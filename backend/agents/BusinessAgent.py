from agents.BaseAgent import BaseAgent
from agents.policies.ConsumerPolicy import ConsumerPolicy
import numpy as np

class BusinessAgent(BaseAgent):
    def __init__(self, agent_id, baseline_consumption):
        # Businesses care about costs → use cost function
        super().__init__(agent_id, cost_function=lambda e: abs(e) * 0.1)  # simple cost model
        self.baseline_consumption = baseline_consumption
        self.current_consumption = baseline_consumption

        # Initialize policy network
        self.policy = ConsumerPolicy(input_size=7)  # matches observation size
        self.autonomous_mode = False  # can switch between manual/autonomous

    def act(self, action):
        """
        Execute RL action: action ∈ [0.3, 1.5] → consumption = action × baseline_consumption

        Args:
            action: Continuous action in [0.3, 1.5] (businesses can reduce more than consumers)

        Returns:
            self.delta_e: Actual electricity consumed (negative)
        """
        # Clamp action to valid range (businesses have more flexibility)
        action = max(0.3, min(1.5, action))
        self.last_action = action
        self.save_action(action)

        # Convert action to actual consumption
        self.current_consumption = action * self.baseline_consumption
        self.delta_e = -self.current_consumption  # negative for consumption

        return self.delta_e

    def get_observation(self, state):
        """Convert state to normalized observation vector."""
        global_features = [
            state.get("frequency", 60) / 60.0,         # normalized frequency
            state.get("temperature", 0),                   # weather index [-1, 1]
            state.get("avg_cost", 1.0) / 10.0,         # normalized cost (important for businesses)
            state.get("time_of_day", 12) / 24.0        # normalized hour
        ]

        # Agent-specific features
        agent_features = [
            self.current_consumption / self.baseline_consumption,  # consumption multiplier
            (self.last_action - 0.9) / 0.6,           # normalized action [-1, 1]
            self.episode_reward / 10.0                 # normalized cumulative reward
        ]

        return self.normalize_features(global_features + agent_features)

    def compute_reward(self, state, all_agents):
        """
        Business reward: minimize operational costs while maintaining productivity

        Args:
            state: Environment state
            all_agents: List of all agents for competition

        Returns:
            float: Reward in [-1, 1] range
        """
        # Cost minimization (primary business objective)
        price = state.get("avg_cost", 1.0)
        baseline_cost = self.baseline_consumption * price
        actual_cost = abs(self.delta_e) * price
        cost_savings = (baseline_cost - actual_cost) / baseline_cost if baseline_cost > 0 else 0
        cost_reward = min(1, max(-1, cost_savings))

        # Productivity maintenance (can't reduce consumption too much)
        consumption_ratio = abs(self.delta_e) / self.baseline_consumption
        if consumption_ratio < 0.5:  # penalty for reducing too much
            productivity_penalty = -2 * (0.5 - consumption_ratio)
        else:
            productivity_penalty = 0

        # Business competition (compete for low-cost energy)
        business_agents = [a for a in all_agents if isinstance(a, BusinessAgent)]
        if len(business_agents) > 1:
            my_efficiency = cost_savings
            others_efficiency = [
                (a.baseline_consumption * price - abs(a.delta_e) * price) / (a.baseline_consumption * price)
                for a in business_agents if a != self and a.baseline_consumption > 0
            ]
            if others_efficiency:
                competitive_advantage = my_efficiency - np.mean(others_efficiency)
                competition_reward = min(1, max(-1, competitive_advantage))
            else:
                competition_reward = 0
        else:
            competition_reward = 0

        # Grid stability (secondary concern for businesses)
        frequency = state.get("frequency", 60)
        stability_reward = 0.2 * (1 - abs(frequency - 60) / 10.0)

        # Zero-sum: reduce others' rewards
        other_rewards = [a.episode_reward for a in all_agents if a != self]
        others_penalty = -np.mean(other_rewards) * 0.05 if other_rewards else 0

        # Weighted combination
        total_reward = (
            0.5 * cost_reward +
            0.2 * competition_reward +
            0.15 * stability_reward +
            0.1 * others_penalty +
            0.05 * productivity_penalty
        )

        return max(-1, min(1, total_reward))

    def get_action_bounds(self):
        """Business actions are in [0.3, 1.5]."""
        return (0.3, 1.5)

    def select_autonomous_action(self, observation):
        """
        Use policy network to select action autonomously

        Args:
            observation: current state observation

        Returns:
            action: selected action from policy network
        """
        if self.autonomous_mode:
            price = observation[2] if len(observation) > 2 else 1.0  # price awareness
            return self.policy.compute_business_action(observation, price)
        else:
            # Return baseline action if not in autonomous mode
            return 1.0

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