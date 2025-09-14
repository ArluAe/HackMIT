import torch
import torch.nn as nn
import numpy as np
from .Policy import Policy
from .rollout_buffer import RolloutBuffer


class PPOAgent:
    """PPO Agent with its own policy network, buffer, and optimizer"""

    def __init__(
        self,
        agent_id,
        agent_type,
        obs_dim=None,
        hidden_size=64,
        lr=3e-4,
        gamma=0.99,
        gae_lambda=0.95,
        clip_range=0.2,
        value_coef=0.5,
        entropy_coef=0.01,
        max_grad_norm=0.5,
        buffer_size=2048,
        batch_size=64,
        n_epochs=10,
        device='cpu'
    ):
        self.agent_id = agent_id
        self.agent_type = agent_type
        self.device = torch.device(device)

        # PPO hyperparameters
        self.gamma = gamma
        self.gae_lambda = gae_lambda
        self.clip_range = clip_range
        self.value_coef = value_coef
        self.entropy_coef = entropy_coef
        self.max_grad_norm = max_grad_norm
        self.batch_size = batch_size
        self.n_epochs = n_epochs

        # Initialize policy network (actor-critic)
        self.policy = Policy(agent_type=agent_type, hidden_size=hidden_size).to(self.device)
        self.optimizer = torch.optim.Adam(self.policy.parameters(), lr=lr)

        # Initialize rollout buffer
        self.buffer = RolloutBuffer(
            buffer_size=buffer_size,
            obs_dim=obs_dim or self.policy.input_size,
            device=self.device
        )

        # Training statistics
        self.training_step = 0
        self.episode_reward = 0
        self.episode_length = 0

    def act(self, observation):
        """Select action given observation"""
        action_info = self.policy.select_action(observation, training=True)
        return action_info

    def store_transition(self, obs, action, reward, value, log_prob, done):
        """Store transition in buffer"""
        self.buffer.add(obs, action, reward, value, log_prob, done)
        self.episode_reward += reward
        self.episode_length += 1

        if done:
            # Reset episode statistics
            episode_return = self.episode_reward
            episode_len = self.episode_length
            self.episode_reward = 0
            self.episode_length = 0
            return episode_return, episode_len
        return None, None

    def update(self):
        """PPO update using collected rollout data"""
        if not self.buffer.is_ready():
            return {}

        # Get data from buffer
        obs, actions, rewards, values, log_probs, dones = self.buffer.get()

        # Compute returns and advantages
        returns, advantages = self.compute_gae(rewards, values, dones)

        # Convert to tensors
        obs = torch.FloatTensor(obs).to(self.device)
        actions = torch.FloatTensor(actions).to(self.device)
        old_log_probs = torch.FloatTensor(log_probs).to(self.device)
        returns = torch.FloatTensor(returns).to(self.device)
        advantages = torch.FloatTensor(advantages).to(self.device)

        # Normalize advantages
        advantages = (advantages - advantages.mean()) / (advantages.std() + 1e-8)

        # Training statistics
        total_loss = 0
        policy_loss_epoch = 0
        value_loss_epoch = 0
        entropy_epoch = 0
        approx_kl_epoch = 0
        clip_fraction_epoch = 0

        # PPO epochs
        for epoch in range(self.n_epochs):
            # Create random indices for minibatches
            indices = np.random.permutation(len(obs))

            for start in range(0, len(obs), self.batch_size):
                end = start + self.batch_size
                batch_indices = indices[start:end]

                batch_obs = obs[batch_indices]
                batch_actions = actions[batch_indices]
                batch_old_log_probs = old_log_probs[batch_indices]
                batch_returns = returns[batch_indices]
                batch_advantages = advantages[batch_indices]

                # Get current policy outputs
                _, new_log_probs, values, entropy = self.policy.get_action_and_value(
                    batch_obs, batch_actions
                )

                # Compute ratio
                ratio = torch.exp(new_log_probs - batch_old_log_probs)

                # Policy loss (clipped PPO objective)
                policy_loss_1 = batch_advantages * ratio
                policy_loss_2 = batch_advantages * torch.clamp(
                    ratio, 1 - self.clip_range, 1 + self.clip_range
                )
                policy_loss = -torch.min(policy_loss_1, policy_loss_2).mean()

                # Value loss
                value_loss = nn.functional.mse_loss(values, batch_returns)

                # Entropy bonus
                entropy_loss = -entropy.mean()

                # Total loss
                loss = (
                    policy_loss +
                    self.value_coef * value_loss +
                    self.entropy_coef * entropy_loss
                )

                # Backpropagation
                self.optimizer.zero_grad()
                loss.backward()
                nn.utils.clip_grad_norm_(self.policy.parameters(), self.max_grad_norm)
                self.optimizer.step()

                # Update statistics
                total_loss += loss.item()
                policy_loss_epoch += policy_loss.item()
                value_loss_epoch += value_loss.item()
                entropy_epoch += entropy.mean().item()

                with torch.no_grad():
                    approx_kl = ((ratio - 1) - torch.log(ratio)).mean().item()
                    clip_fraction = ((ratio - 1.0).abs() > self.clip_range).float().mean().item()
                    approx_kl_epoch += approx_kl
                    clip_fraction_epoch += clip_fraction

        # Clear buffer after update
        self.buffer.clear()

        # Calculate average statistics
        n_updates = self.n_epochs * max(1, len(obs) // self.batch_size)
        stats = {
            'total_loss': total_loss / n_updates if n_updates > 0 else 0,
            'policy_loss': policy_loss_epoch / n_updates if n_updates > 0 else 0,
            'value_loss': value_loss_epoch / n_updates if n_updates > 0 else 0,
            'entropy': entropy_epoch / n_updates if n_updates > 0 else 0,
            'approx_kl': approx_kl_epoch / n_updates if n_updates > 0 else 0,
            'clip_fraction': clip_fraction_epoch / n_updates if n_updates > 0 else 0
        }

        self.training_step += 1
        return stats

    def compute_gae(self, rewards, values, dones):
        """Compute Generalized Advantage Estimation"""
        advantages = np.zeros_like(rewards)
        last_advantage = 0

        # Calculate advantages in reverse order
        for t in reversed(range(len(rewards))):
            if t == len(rewards) - 1:
                next_value = 0  # Assuming terminal state
            else:
                next_value = values[t + 1]

            delta = rewards[t] + self.gamma * next_value * (1 - dones[t]) - values[t]
            last_advantage = delta + self.gamma * self.gae_lambda * (1 - dones[t]) * last_advantage
            advantages[t] = last_advantage

        returns = advantages + values
        return returns, advantages

    def save(self, path):
        """Save agent's policy"""
        torch.save({
            'policy_state_dict': self.policy.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'training_step': self.training_step,
            'agent_id': self.agent_id,
            'agent_type': self.agent_type
        }, path)

    def load(self, path):
        """Load agent's policy"""
        checkpoint = torch.load(path, map_location=self.device)
        self.policy.load_state_dict(checkpoint['policy_state_dict'])
        self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        self.training_step = checkpoint['training_step']