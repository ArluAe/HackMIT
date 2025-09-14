#!/usr/bin/env python3

"""
Simple working multi-agent training for power grid
Fixes gradient issues and provides a basic training loop
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from environment.PowerGrid import PowerGrid
from environment.case14 import case14

class SimpleTrainingEnv:
    """Simple training environment for power grid"""

    def __init__(self, dt=1.0, max_steps=60):  # Shorter episodes for faster training
        self.dt = dt
        self.max_steps = max_steps
        self.reset()

    def reset(self):
        """Reset environment"""
        self.current_step = 0
        self.grid = PowerGrid(case14(), self.dt)
        self.temp_profile = 20 + 10 * np.sin(np.linspace(0, 2*np.pi, self.max_steps))
        return self._get_observations()

    def step(self, actions):
        """Execute one step"""
        # Apply actions to agents (replace their policy decisions)
        for i, node in enumerate(self.grid.nodes):
            action = actions[i] if i < len(actions) else 0.0

            # Override agent action
            node.agent.action_history.append(action)

            agent_type = type(node.agent).__name__

            if agent_type == "ProducerAgent":
                # Scale action to [0, max_output]
                output = ((action + 1) / 2) * node.agent.max_output
                node.agent.delta_e = output

            elif agent_type == "ConsumerAgent":
                # Scale action to [0, 2*base_consumption]
                consumption = ((action + 1) / 2) * node.agent.energy_consumption * 2
                node.agent.delta_e = -consumption

            elif agent_type == "BatteryAgent":
                # Battery can charge (negative) or discharge (positive)
                # Action in [-1,1] maps to [-charge_rate, +charge_rate]
                charge_discharge = action * node.agent.charge_rate

                # Apply SOC constraints
                if charge_discharge > 0 and node.agent.soc <= 0.1:  # Can't discharge when empty
                    charge_discharge = 0
                elif charge_discharge < 0 and node.agent.soc >= 0.9:  # Can't charge when full
                    charge_discharge = 0

                node.agent.delta_e = charge_discharge

                # Update SOC based on action
                soc_change = -charge_discharge / node.agent.capacity * self.dt
                node.agent.soc = max(0, min(1, node.agent.soc + soc_change))

            elif agent_type == "BusinessAgent":
                # Scale action to [0.3, 1.5] * baseline_consumption (like in BusinessAgent.act)
                scaled_action = 0.9 + action * 0.6  # center at 0.9, range ±0.6
                scaled_action = max(0.3, min(1.5, scaled_action))
                consumption = scaled_action * node.agent.baseline_consumption
                node.agent.delta_e = -consumption

            else:
                # Default behavior for unknown agent types
                node.agent.delta_e = action

        # Store previous rewards
        prev_rewards = [node.agent.episode_reward for node in self.grid.nodes]

        # Step the grid with normalized time_of_day
        time_of_day = self.current_step / self.max_steps
        self.grid.time_step(None, time_of_day)  # Temperature is not used in new system

        # Calculate step rewards
        step_rewards = []
        for i, node in enumerate(self.grid.nodes):
            reward = node.agent.episode_reward - prev_rewards[i]
            step_rewards.append(reward)

        self.current_step += 1
        done = self.current_step >= self.max_steps

        return self._get_observations(), step_rewards, done

    def _get_observations(self):
        """Get observations for all agents"""
        # Calculate current price based on supply/demand
        current_price = self.grid.calculate_electricity_price()

        state = {
            "frequency": self.grid.grid_frequency,
            "avg_cost": current_price,
            "time_of_day": self.current_step / self.max_steps  # Normalized [0,1]
        }

        observations = []
        for node in self.grid.nodes:
            obs = node.agent._get_observation(state)
            observations.append(obs)

        return observations


class PPOActorCritic(nn.Module):
    """Actor-Critic network for PPO"""

    def __init__(self, input_size, hidden_size=64):
        super().__init__()

        # Shared feature extraction
        self.shared = nn.Sequential(
            nn.Linear(input_size, hidden_size),
            nn.ReLU(),
            nn.Linear(hidden_size, hidden_size),
            nn.ReLU()
        )

        # Actor head (policy)
        self.actor_mean = nn.Linear(hidden_size, 1)
        self.actor_logstd = nn.Parameter(torch.zeros(1))

        # Critic head (value function)
        self.critic = nn.Linear(hidden_size, 1)

    def forward(self, x):
        shared_features = self.shared(x)

        # Actor: output mean of continuous action
        action_mean = torch.tanh(self.actor_mean(shared_features))  # [-1, 1]
        action_std = torch.exp(self.actor_logstd.clamp(-20, 2))

        # Critic: state value
        value = self.critic(shared_features)

        return action_mean, action_std, value

    def get_action_and_value(self, x, action=None):
        action_mean, action_std, value = self(x)

        # Create normal distribution
        probs = torch.distributions.Normal(action_mean, action_std)

        if action is None:
            action = probs.sample()

        # Clamp action to [-1, 1]
        action = torch.clamp(action, -1, 1)

        return action, probs.log_prob(action).sum(-1), probs.entropy().sum(-1), value


class PPOTrainer:
    """PPO trainer for multi-agent power grid"""

    def __init__(self, learning_rate=3e-4, gamma=0.99, gae_lambda=0.95, clip_coef=0.2, ent_coef=0.01, vf_coef=0.5, max_grad_norm=0.5):
        self.env = SimpleTrainingEnv()
        self.num_agents = self.env.grid.size

        # PPO hyperparameters
        self.gamma = gamma
        self.gae_lambda = gae_lambda
        self.clip_coef = clip_coef
        self.ent_coef = ent_coef
        self.vf_coef = vf_coef
        self.max_grad_norm = max_grad_norm

        # Create actor-critic networks for each agent
        self.agents = []
        self.optimizers = []

        for i in range(self.num_agents):
            node = self.env.grid.nodes[i]
            agent_type = type(node.agent).__name__

            if agent_type == "ProducerAgent":
                input_size = 6
            elif agent_type == "ConsumerAgent":
                input_size = 5
            elif agent_type == "BatteryAgent":
                input_size = 7
            elif agent_type == "BusinessAgent":
                input_size = 7
            else:
                input_size = 6

            agent_net = PPOActorCritic(input_size)
            optimizer = torch.optim.Adam(agent_net.parameters(), lr=learning_rate, eps=1e-5)

            self.agents.append(agent_net)
            self.optimizers.append(optimizer)

    def get_actions_and_values(self, observations):
        """Get actions and values from all agent networks"""
        actions = []
        log_probs = []
        values = []
        entropies = []

        for i, obs in enumerate(observations):
            obs_tensor = torch.FloatTensor(obs).unsqueeze(0)

            with torch.no_grad():
                action, log_prob, entropy, value = self.agents[i].get_action_and_value(obs_tensor)

            actions.append(action.squeeze(0).item())
            log_probs.append(log_prob.item())
            values.append(value.squeeze(0).item())
            entropies.append(entropy.item())

        return actions, log_probs, values, entropies

    def compute_gae(self, rewards, values, next_value, dones):
        """Compute Generalized Advantage Estimation"""
        advantages = []
        gae = 0

        # Add next_value to values for easier computation
        values = values + [next_value]

        for step in reversed(range(len(rewards))):
            if step == len(rewards) - 1:
                next_non_terminal = 1.0 - dones[step]
                next_value = values[step + 1]
            else:
                next_non_terminal = 1.0 - dones[step]
                next_value = values[step + 1]

            delta = rewards[step] + self.gamma * next_value * next_non_terminal - values[step]
            gae = delta + self.gamma * self.gae_lambda * next_non_terminal * gae
            advantages.insert(0, gae)

        returns = [adv + val for adv, val in zip(advantages, values[:-1])]
        return advantages, returns

    def update_agents(self, rollout_data, update_epochs=4, minibatch_size=64):
        """Update all agents using PPO"""
        total_losses = []

        for agent_id in range(self.num_agents):
            # Extract data for this agent
            obs_list = [step[agent_id] for step in rollout_data['observations']]
            action_list = [step[agent_id] for step in rollout_data['actions']]
            logprob_list = [step[agent_id] for step in rollout_data['logprobs']]

            obs_data = torch.FloatTensor(np.array(obs_list))
            action_data = torch.FloatTensor(np.array(action_list))
            logprob_data = torch.FloatTensor(np.array(logprob_list))
            reward_data = [step[agent_id] for step in rollout_data['rewards']]
            value_data = [step[agent_id] for step in rollout_data['values']]
            done_data = rollout_data['dones']

            # Compute GAE
            next_value = 0.0  # Assuming episode ends
            advantages, returns = self.compute_gae(reward_data, value_data, next_value, done_data)

            advantages = torch.FloatTensor(advantages)
            returns = torch.FloatTensor(returns)

            # Normalize advantages
            advantages = (advantages - advantages.mean()) / (advantages.std() + 1e-8)

            batch_size = len(obs_data)
            agent_losses = []

            # Multiple epochs of updates
            for epoch in range(update_epochs):
                # Create minibatches
                indices = torch.randperm(batch_size)

                for start in range(0, batch_size, minibatch_size):
                    end = min(start + minibatch_size, batch_size)
                    mb_indices = indices[start:end]

                    if len(mb_indices) == 0:
                        continue

                    # Get current policy outputs
                    _, newlogprob, entropy, newvalue = self.agents[agent_id].get_action_and_value(
                        obs_data[mb_indices], action_data[mb_indices].unsqueeze(-1)
                    )

                    # PPO loss computation
                    logratio = newlogprob - logprob_data[mb_indices]
                    ratio = logratio.exp()

                    mb_advantages = advantages[mb_indices]

                    # Policy loss with clipping
                    pg_loss1 = -mb_advantages * ratio
                    pg_loss2 = -mb_advantages * torch.clamp(ratio, 1 - self.clip_coef, 1 + self.clip_coef)
                    pg_loss = torch.max(pg_loss1, pg_loss2).mean()

                    # Value loss
                    v_loss = F.mse_loss(newvalue.squeeze(), returns[mb_indices])

                    # Entropy bonus
                    entropy_loss = entropy.mean()

                    # Total loss
                    loss = pg_loss - self.ent_coef * entropy_loss + self.vf_coef * v_loss

                    # Update
                    self.optimizers[agent_id].zero_grad()
                    loss.backward()
                    torch.nn.utils.clip_grad_norm_(self.agents[agent_id].parameters(), self.max_grad_norm)
                    self.optimizers[agent_id].step()

                    agent_losses.append(loss.item())

            if agent_losses:
                total_losses.append(np.mean(agent_losses))

        return np.mean(total_losses) if total_losses else 0.0

    def train(self, num_episodes=1000, rollout_steps=None):
        """Train using PPO"""
        if rollout_steps is None:
            rollout_steps = self.env.max_steps

        print(f"Training {self.num_agents} agents for {num_episodes} episodes using PPO...")

        for episode in range(num_episodes):
            # Collect rollout data
            rollout_data = {
                'observations': [],
                'actions': [],
                'logprobs': [],
                'rewards': [],
                'values': [],
                'dones': []
            }

            obs = self.env.reset()
            total_reward = 0
            episode_length = 0

            for step in range(rollout_steps):
                # Get actions and values from all agents
                actions, log_probs, values, entropies = self.get_actions_and_values(obs)

                # Store data
                rollout_data['observations'].append(obs.copy())
                rollout_data['actions'].append(actions.copy())
                rollout_data['logprobs'].append(log_probs.copy())
                rollout_data['values'].append(values.copy())

                # Environment step
                obs, rewards, done = self.env.step(actions)

                rollout_data['rewards'].append(rewards.copy())
                rollout_data['dones'].append(done)

                total_reward += sum(rewards)
                episode_length += 1

                if done:
                    break

            # Update agents using PPO
            if len(rollout_data['observations']) > 0:
                loss = self.update_agents(rollout_data)
            else:
                loss = 0.0

            # Log progress
            if episode % 10 == 0:
                freq = self.env.grid.grid_frequency
                avg_reward = total_reward / self.num_agents
                print(f"Episode {episode:3d}: Avg_Reward={avg_reward:6.2f}, Total_Reward={total_reward:8.2f}, Freq={freq:6.2f}Hz, Loss={loss:.4f}, Steps={episode_length}")

        print("PPO training completed!")

    def test_episode(self):
        """Run a test episode with trained PPO agents"""
        obs = self.env.reset()
        total_reward = 0
        agent_rewards = [0.0] * self.num_agents

        print("\nTesting trained PPO agents...")
        print(f"Initial frequency: {self.env.grid.grid_frequency:.2f} Hz")

        with torch.no_grad():
            for step in range(self.env.max_steps):
                actions = []
                for i, obs_i in enumerate(obs):
                    obs_tensor = torch.FloatTensor(obs_i).unsqueeze(0)
                    action_mean, action_std, value = self.agents[i](obs_tensor)
                    # Use mean action for testing (no exploration)
                    actions.append(action_mean.squeeze(0).item())

                obs, rewards, done = self.env.step(actions)
                total_reward += sum(rewards)

                for i, reward in enumerate(rewards):
                    agent_rewards[i] += reward

                if step % 10 == 0:
                    print(f"Step {step:2d}: Freq={self.env.grid.grid_frequency:.2f}Hz, "
                          f"Sample_Rewards={[f'{r:.1f}' for r in rewards[:3]]}")

                if done:
                    break

        print(f"\nTest Results:")
        print(f"  Total reward: {total_reward:.2f}")
        print(f"  Average reward per agent: {total_reward/self.num_agents:.2f}")
        print(f"  Final frequency: {self.env.grid.grid_frequency:.2f} Hz")

        print(f"\nIndividual agent performance:")
        for i, reward in enumerate(agent_rewards):
            agent_type = type(self.env.grid.nodes[i].agent).__name__
            print(f"  Agent {i+1} ({agent_type:12s}): {reward:6.2f}")

    def save_models(self, path="ppo_models"):
        """Save all PPO agent models"""
        os.makedirs(path, exist_ok=True)
        for i, agent in enumerate(self.agents):
            torch.save({
                'model_state_dict': agent.state_dict(),
                'optimizer_state_dict': self.optimizers[i].state_dict(),
                'agent_type': type(self.env.grid.nodes[i].agent).__name__
            }, f"{path}/ppo_agent_{i}.pt")
        print(f"PPO models saved to {path}/")

    def load_models(self, path="ppo_models"):
        """Load all PPO agent models"""
        for i in range(self.num_agents):
            checkpoint = torch.load(f"{path}/ppo_agent_{i}.pt")
            self.agents[i].load_state_dict(checkpoint['model_state_dict'])
            self.optimizers[i].load_state_dict(checkpoint['optimizer_state_dict'])
        print(f"PPO models loaded from {path}/")


# For backwards compatibility
SimpleTrainer = PPOTrainer
SimplePolicy = PPOActorCritic

if __name__ == "__main__":
    # Create PPO trainer
    trainer = PPOTrainer(
        learning_rate=3e-4,
        gamma=0.99,
        gae_lambda=0.95,
        clip_coef=0.2,
        ent_coef=0.01,
        vf_coef=0.5
    )

    print("Starting PPO training for multi-agent power grid...")
    trainer.train(num_episodes=1000)
    trainer.test_episode()
    trainer.save_models()