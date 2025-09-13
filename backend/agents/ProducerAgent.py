from agents.BaseAgent import BaseAgent
from agents.policies.ProducerPolicy import ProducerPolicy
import numpy as np

class ProducerAgent(BaseAgent):
    def __init__(self, agent_id, max_output, cost_function=None):
        super().__init__(agent_id, cost_function)
        self.max_output = max_output
        self.current_output = 0.0

        # Initialize policy network
        self.policy = ProducerPolicy(input_size=7)  # matches observation size
        self.autonomous_mode = False  # can switch between manual/autonomous

    def act(self, action):
        """
        Execute RL action: action ∈ [0, 1] → output = action × max_capacity

        Args:
            action: Continuous action in [0, 1]

        Returns:
            self.delta_e: Actual electricity produced
        """
        # Clamp action to valid range
        action = max(0, min(1, action))
        self.last_action = action
        self.save_action(action)

        # Convert action to actual output
        self.current_output = action * self.max_output
        self.delta_e = self.current_output

        return self.delta_e

    def get_observation(self, state):
        """Convert state to normalized observation vector."""
        global_features = [
            state.get("frequency", 60) / 60.0,         # normalized frequency
            state.get("temperature", 0),                   # weather index [-1, 1]
            state.get("avg_cost", 1.0) / 10.0,         # normalized cost
            state.get("time_of_day", 12) / 24.0        # normalized hour
        ]

        # Agent-specific features
        agent_features = [
            self.current_output / self.max_output,     # output utilization
            self.last_action,                          # previous action
            self.episode_reward / 10.0                 # normalized cumulative reward
        ]

        return self.normalize_features(global_features + agent_features)

    def compute_reward(self, state, all_agents):
        """
        Adversarial reward: maximize profit + market share - stability penalty

        Args:
            state: Environment state
            all_agents: List of all agents for competition

        Returns:
            float: Reward in [-1, 1] range
        """
        # Profit component
        price = state.get("avg_cost", 1.0)
        revenue = self.delta_e * price
        production_cost = self.cost_function(self.delta_e) if self.delta_e > 0 else 0
        profit = revenue - production_cost

        # Normalize profit (assuming max possible profit ~50)
        profit_reward = min(1, max(-1, profit / 50.0))

        # Market share competition
        producer_agents = [a for a in all_agents if isinstance(a, ProducerAgent)]
        if len(producer_agents) > 1:
            total_production = sum(a.delta_e for a in producer_agents)
            if total_production > 0:
                my_share = self.delta_e / total_production
                equal_share = 1.0 / len(producer_agents)
                market_share_reward = (my_share - equal_share) * 2  # compete for dominance
            else:
                market_share_reward = 0
        else:
            market_share_reward = 0

        # Grid stability penalty (shared responsibility)
        frequency = state.get("frequency", 60)
        stability_penalty = -abs(frequency - 60) / 4.0  # reduced impact vs profit

        # Zero-sum component: reduce others' average reward
        other_rewards = [a.episode_reward for a in all_agents if a != self]
        others_penalty = -np.mean(other_rewards) * 0.1 if other_rewards else 0

        total_reward = profit_reward + market_share_reward + stability_penalty + others_penalty
        return max(-1, min(1, total_reward))

    def get_action_bounds(self):
        """Producer actions are in [0, 1]."""
        return (0.0, 1.0)

    def select_autonomous_action(self, observation):
        """
        Use policy network to select action autonomously

        Args:
            observation: current state observation

        Returns:
            action: selected action from policy network
        """
        if self.autonomous_mode:
            return self.policy.compute_production_action(
                observation, self.cost_function, self.max_output
            )
        else:
            # Return neutral action if not in autonomous mode
            return 0.5

    def set_autonomous_mode(self, enabled=True):
        """Enable/disable autonomous decision making"""
        self.autonomous_mode = enabled

    def train_policy(self, observations, actions, rewards):
        """
        Train the policy network (placeholder for training logic)

        Args:
            observations: batch of observations
            actions: batch of actions taken
            rewards: batch of rewards received
        """
        # This would be implemented with actual RL training algorithm
        pass