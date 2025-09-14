"""
PowerGrid Environment wrapper for PPO training
Integrates Node/Branch architecture with multi-agent PPO
"""

import numpy as np
from typing import Dict, List, Tuple, Any, Optional
from collections import defaultdict

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from environment.PowerGrid import PowerGrid
from agents.ppo_agent import PPOAgent
from utils.temperature import get_daily_temperatures_simple


class PowerGridEnvPPO:
    """
    Environment wrapper that integrates PowerGrid (with Nodes/Branches) with PPO training
    Each Node has an agent, and we train them using independent PPO
    """

    def __init__(
        self,
        ppc_config,
        node_configs: Dict[int, Dict] = None,
        dt: float = 5.0,
        target_hz: float = 60.0,
        max_steps: int = 288,
        ppo_config: Dict = None
    ):
        """
        Args:
            ppc_config: Power grid configuration (bus, branch data)
            node_configs: Dict mapping node index to agent configuration
                Example: {
                    0: {'agent_type': 'producer', 'agent_params': {'production_capacity': 500}},
                    1: {'agent_type': 'consumer', 'agent_params': {'consumption_range': (100, 200)}},
                    2: {'agent_type': 'battery', 'agent_params': {'capacity': 300}}
                }
            dt: Time step in minutes
            target_hz: Target grid frequency
            max_steps: Maximum steps per episode
            ppo_config: PPO training configuration
        """
        self.dt = dt
        self.max_steps = max_steps
        self.ppo_config = ppo_config or {}

        # Initialize PowerGrid with node configurations
        self.grid = PowerGrid(ppc_config, dt, target_hz, node_configs)

        # Temperature simulation (generate for 24 hours)
        self.temperatures = [20 + 10 * np.sin(2 * np.pi * h / 24) for h in range(24)]

        # Time tracking
        self.current_step = 0
        self.current_hour = 0.0

        # Initialize PPO agents for each node
        self.ppo_agents = self._initialize_ppo_agents()

        # Episode tracking
        self.episode_rewards = defaultdict(list)
        self.episode_info = {}

    def _initialize_ppo_agents(self) -> Dict[str, PPOAgent]:
        """Initialize PPO agents for each node"""
        ppo_agents = {}

        for node in self.grid.nodes:
            agent = node.agent
            agent_id = agent.agent_id

            # Determine observation dimension based on agent type
            if node.agent_type == 'consumer':
                obs_dim = 5
                agent_type_id = 1
            elif node.agent_type == 'producer':
                obs_dim = 6
                agent_type_id = 2
            elif node.agent_type == 'battery':
                obs_dim = 7
                agent_type_id = 3
            elif node.agent_type == 'business':
                obs_dim = 7
                agent_type_id = 0
            else:
                obs_dim = 7
                agent_type_id = 0

            # Create PPO agent
            ppo_agent = PPOAgent(
                agent_id=agent_id,
                agent_type=agent_type_id,
                obs_dim=obs_dim,
                hidden_size=self.ppo_config.get('hidden_size', 64),
                lr=self.ppo_config.get('lr', 3e-4),
                gamma=self.ppo_config.get('gamma', 0.99),
                gae_lambda=self.ppo_config.get('gae_lambda', 0.95),
                clip_range=self.ppo_config.get('clip_range', 0.2),
                value_coef=self.ppo_config.get('value_coef', 0.5),
                entropy_coef=self.ppo_config.get('entropy_coef', 0.01),
                buffer_size=self.ppo_config.get('buffer_size', 2048),
                batch_size=self.ppo_config.get('batch_size', 64),
                n_epochs=self.ppo_config.get('n_epochs', 10),
                device=self.ppo_config.get('device', 'cpu')
            )

            # Attach PPO agent to node
            node.set_ppo_agent(ppo_agent)
            ppo_agents[agent_id] = ppo_agent

        return ppo_agents

    def reset(self) -> Dict[str, np.ndarray]:
        """Reset environment and return initial observations"""
        # Reset time
        self.current_step = 0
        self.current_hour = 0.0

        # Reset grid
        self.grid.grid_frequency = self.grid.target_hz
        for node in self.grid.nodes:
            node.offset = 0
            node.doffset = 0
            if hasattr(node.agent, 'reset'):
                node.agent.reset()

        # Reset episode tracking
        self.episode_rewards = defaultdict(list)

        # Get initial state
        state = self._get_state()

        # Get observations for all agents
        observations = {}
        for agent_id, ppo_agent in self.ppo_agents.items():
            node = self.grid.get_node_by_agent_id(agent_id)
            if node:
                observations[agent_id] = self._get_observation(node, state)

        return observations

    def step(self, actions: Dict[str, float]) -> Tuple[Dict, Dict, bool, Dict]:
        """
        Step environment with actions from all agents

        Args:
            actions: Dict mapping agent_id to action value

        Returns:
            observations: New observations for all agents
            rewards: Rewards for all agents
            done: Whether episode is finished
            info: Additional information
        """
        # Convert actions dict to node-indexed list
        node_actions = []
        for node in self.grid.nodes:
            agent_id = node.agent.agent_id
            if agent_id in actions:
                node_actions.append(actions[agent_id])
            else:
                node_actions.append(0.0)

        # Step the power grid
        temperature = self.temperatures[int(self.current_hour)]
        state = self.grid.time_step(temperature, self.current_hour, node_actions)

        # Update time
        self.current_step += 1
        self.current_hour += self.dt / 60.0
        if self.current_hour >= 24:
            self.current_hour -= 24

        # Get new state with additional info
        state = self._get_state()

        # Calculate rewards and get observations
        observations = {}
        rewards = {}

        for agent_id, ppo_agent in self.ppo_agents.items():
            node = self.grid.get_node_by_agent_id(agent_id)
            if node:
                # Get observation
                observations[agent_id] = self._get_observation(node, state)

                # Calculate reward
                rewards[agent_id] = self._calculate_reward(node, state, actions.get(agent_id, 0))

                # Track episode reward
                self.episode_rewards[agent_id].append(rewards[agent_id])

        # Check if done
        done = self.current_step >= self.max_steps

        # Collect info
        info = {
            'step': self.current_step,
            'hour': self.current_hour,
            'frequency': self.grid.grid_frequency,
            'temperature': temperature,
            'total_production': self._get_total_production(),
            'total_consumption': self._get_total_consumption(),
            'grid_imbalance': self._get_grid_imbalance()
        }

        if done:
            info['episode_rewards'] = {
                agent_id: sum(rewards_list)
                for agent_id, rewards_list in self.episode_rewards.items()
            }

        return observations, rewards, done, info

    def _get_state(self) -> Dict[str, Any]:
        """Get current environment state"""
        state = {
            'frequency': self.grid.grid_frequency,
            'temperature': self.temperatures[int(self.current_hour)],
            'time': self.current_hour,
            'cost': self._calculate_electricity_cost()
        }

        # Add power flow information
        total_transmission = 0
        for node in self.grid.nodes:
            total_transmission += abs(node.get_transmission())
        state['transmission_load'] = total_transmission

        return state

    def _get_observation(self, node, state: Dict) -> np.ndarray:
        """Get observation for a specific node's agent"""
        agent = node.agent

        # Common features (normalized)
        frequency_norm = (state['frequency'] - self.grid.target_hz) / 5.0
        temp_norm = state['temperature'] / 40.0
        cost_norm = state['cost'] / 1.0
        time_norm = state['time'] / 24.0

        # Get cumulative reward (normalized)
        agent_id = agent.agent_id
        if agent_id in self.episode_rewards:
            cum_reward = sum(self.episode_rewards[agent_id]) / 100.0
        else:
            cum_reward = 0.0

        # Build observation based on agent type
        if node.agent_type == 'consumer':
            obs = np.array([
                frequency_norm,
                temp_norm,
                cost_norm,
                time_norm,
                cum_reward
            ], dtype=np.float32)

        elif node.agent_type == 'producer':
            # Add utilization
            if hasattr(agent, 'current_production') and hasattr(agent, 'production_capacity'):
                utilization = agent.current_production / (agent.production_capacity + 1e-6)
            else:
                utilization = 0.5

            obs = np.array([
                frequency_norm,
                temp_norm,
                cost_norm,
                time_norm,
                utilization,
                cum_reward
            ], dtype=np.float32)

        elif node.agent_type == 'battery':
            # Add state of charge and capacity utilization
            soc = getattr(agent, 'state_of_charge', 0.5)
            if hasattr(agent, 'current_charge_rate') and hasattr(agent, 'capacity'):
                capacity_util = abs(agent.current_charge_rate) / (agent.capacity + 1e-6)
            else:
                capacity_util = 0.0

            obs = np.array([
                frequency_norm,
                temp_norm,
                cost_norm,
                time_norm,
                soc,
                capacity_util,
                cum_reward
            ], dtype=np.float32)

        elif node.agent_type == 'business':
            # Add consumption ratio
            if hasattr(agent, 'net_consumption') and hasattr(agent, 'base_consumption'):
                consumption_ratio = agent.net_consumption / (agent.base_consumption + 1e-6)
            else:
                consumption_ratio = 1.0

            obs = np.array([
                frequency_norm,
                temp_norm,
                cost_norm,
                time_norm,
                consumption_ratio,
                cum_reward,
                0.0  # Agent type indicator
            ], dtype=np.float32)

        else:
            # Default observation
            obs = np.array([
                frequency_norm,
                temp_norm,
                cost_norm,
                time_norm,
                0.0,
                cum_reward,
                0.0
            ], dtype=np.float32)

        return obs

    def _calculate_reward(self, node, state: Dict, action: float) -> float:
        """Calculate reward for a specific node"""
        # Frequency deviation penalty (shared by all)
        frequency_deviation = abs(state['frequency'] - self.grid.target_hz)
        stability_reward = -0.1 * frequency_deviation

        # Grid imbalance penalty
        imbalance = self._get_grid_imbalance()
        imbalance_penalty = -0.05 * abs(imbalance) / 100.0

        # Node power flow penalty (prevent overload)
        transmission = abs(node.get_transmission())
        max_transmission = sum(branch.capacity for branch in node.connections)
        if max_transmission > 0:
            transmission_penalty = -0.1 * (transmission / max_transmission) if transmission > 0.8 * max_transmission else 0
        else:
            transmission_penalty = 0

        # Agent-specific rewards
        individual_reward = 0.0

        if node.agent_type == 'producer':
            # Reward for meeting demand efficiently
            if imbalance < 0:  # Shortage
                individual_reward = action * 0.3  # Reward for increasing production
            elif imbalance > 100:  # Excess
                individual_reward = -action * 0.2  # Penalize overproduction

        elif node.agent_type == 'consumer':
            # Reward for demand response
            if frequency_deviation > 1.0:  # Grid stressed
                individual_reward = -action * 0.3  # Reward for reducing consumption

        elif node.agent_type == 'battery':
            # Reward for grid stabilization
            if hasattr(node.agent, 'state_of_charge'):
                soc = node.agent.state_of_charge
                soc_penalty = -abs(soc - 0.5) * 0.1  # Maintain optimal SOC

                # Frequency regulation reward
                if frequency_deviation > 0.5:
                    if state['frequency'] < self.grid.target_hz:
                        # Low frequency - reward discharge
                        individual_reward = -action * 0.4 + soc_penalty
                    else:
                        # High frequency - reward charging
                        individual_reward = action * 0.4 + soc_penalty
                else:
                    individual_reward = soc_penalty

        elif node.agent_type == 'business':
            # Balance between cost and flexibility
            cost = state['cost']
            if cost > 0.1:  # High price
                individual_reward = -action * 0.2  # Reward for reducing consumption
            else:
                individual_reward = action * 0.1  # Can increase consumption

        # Combine all reward components
        total_reward = stability_reward + imbalance_penalty + transmission_penalty + individual_reward

        return np.clip(total_reward, -1.0, 1.0)

    def _calculate_electricity_cost(self) -> float:
        """Calculate current electricity cost"""
        if 6 <= self.current_hour < 10 or 17 <= self.current_hour < 21:
            return 0.15  # Peak
        elif 10 <= self.current_hour < 17:
            return 0.10  # Mid-peak
        else:
            return 0.05  # Off-peak

    def _get_total_production(self) -> float:
        """Calculate total production across all nodes"""
        total = 0.0
        for node in self.grid.nodes:
            if node.agent_type in ['producer', 'business']:
                total += getattr(node.agent, 'current_production', 0)
        return total

    def _get_total_consumption(self) -> float:
        """Calculate total consumption across all nodes"""
        total = 0.0
        for node in self.grid.nodes:
            if node.agent_type == 'consumer':
                total += getattr(node.agent, 'current_consumption', 0)
            elif node.agent_type == 'business':
                total += max(0, getattr(node.agent, 'net_consumption', 0))
        return total

    def _get_grid_imbalance(self) -> float:
        """Calculate grid imbalance"""
        return self._get_total_production() - self._get_total_consumption()

    def collect_rollout(self, n_steps: int):
        """Collect rollout data for PPO training"""
        observations = self.reset()

        for step in range(n_steps):
            # Get actions from all PPO agents
            actions = {}
            values = {}
            log_probs = {}

            for agent_id, ppo_agent in self.ppo_agents.items():
                action_info = ppo_agent.act(observations[agent_id])
                actions[agent_id] = action_info['action'].item() if isinstance(action_info['action'], np.ndarray) else action_info['action']
                values[agent_id] = action_info['value']
                log_probs[agent_id] = action_info['log_prob']

            # Step environment
            next_observations, rewards, done, info = self.step(actions)

            # Store transitions in PPO agents' buffers
            for agent_id, ppo_agent in self.ppo_agents.items():
                ppo_agent.store_transition(
                    observations[agent_id],
                    actions[agent_id],
                    rewards[agent_id],
                    values[agent_id],
                    log_probs[agent_id],
                    done
                )

            observations = next_observations

            if done:
                observations = self.reset()

            # Check if any buffer is full
            if any(agent.buffer.is_full() for agent in self.ppo_agents.values()):
                break

    def update_agents(self) -> Dict[str, Dict]:
        """Update all PPO agents"""
        update_stats = {}

        for agent_id, ppo_agent in self.ppo_agents.items():
            if ppo_agent.buffer.is_ready():
                stats = ppo_agent.update()
                update_stats[agent_id] = stats

        return update_stats

    def save_agents(self, save_dir: str, episode: int):
        """Save all PPO agents"""
        import os
        os.makedirs(save_dir, exist_ok=True)

        for agent_id, ppo_agent in self.ppo_agents.items():
            save_path = os.path.join(save_dir, f"{agent_id}_episode_{episode}.pt")
            ppo_agent.save(save_path)

    def load_agents(self, save_dir: str, episode: int):
        """Load all PPO agents"""
        import os

        for agent_id, ppo_agent in self.ppo_agents.items():
            load_path = os.path.join(save_dir, f"{agent_id}_episode_{episode}.pt")
            if os.path.exists(load_path):
                ppo_agent.load(load_path)