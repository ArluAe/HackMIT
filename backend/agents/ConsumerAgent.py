from agents.BaseAgent import BaseAgent
from agents.policies.ConsumerPolicy import ConsumerPolicy
import numpy as np

class ConsumerAgent(BaseAgent):
    def __init__(self, agent_id, energy_consumption):
        # Consumers don't use cost_function → force to None
        super().__init__(agent_id, cost_function=None)
        self.energy_consumption = energy_consumption

        # Initialize policy network
        self.policy = ConsumerPolicy(input_size=6)  # matches observation size
        self.autonomous_mode = False  # can switch between manual/autonomous

    def act(self, action):
        """
        Execute RL action: action ∈ [0.5, 2.0] → consumption = action × energy_consumption

        Args:
            action: Continuous action in [0.5, 2.0]

        Returns:
            self.delta_e: Actual electricity consumed (negative)
        """
        # Clamp action to valid range
        action = max(0.5, min(2.0, action))
        self.last_action = action
        self.save_action(action)

        # Convert action to actual consumption
        self.delta_e = -action * self.energy_consumption  # negative for consumption

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
            (self.last_action - 1.25) / 0.75,         # normalized action [-1, 1]
            self.episode_reward / 10.0                 # normalized cumulative reward
        ]

        return self.normalize_features(global_features + agent_features)

    def compute_reward(self, state, all_agents):
        """
        Simplified reward: maximize grid stability and consistent consumption (price agnostic)

        Args:
            state: Environment state
            all_agents: List of all agents for competition

        Returns:
            float: Reward in [-1, 1] range
        """
        # Grid stability reward - main objective
        frequency = state.get("frequency", 60)
        stability_reward = 1 - abs(frequency - 60) / 10.0
        stability_reward = min(1, max(-1, stability_reward))

        # Consumption consistency (weather-adjusted)
        weather = state.get("temperature", 0)
        weather_factor = 1 + abs(weather) * 0.3
        expected_consumption = self.energy_consumption * weather_factor
        actual_consumption = abs(self.delta_e)
        consistency = 1 - abs(actual_consumption - expected_consumption) / expected_consumption
        consistency_reward = min(1, max(-1, consistency))

        # Fair participation with other consumers
        consumer_agents = [a for a in all_agents if isinstance(a, ConsumerAgent)]
        if len(consumer_agents) > 1:
            total_consumption = sum(abs(a.delta_e) for a in consumer_agents)
            if total_consumption > 0:
                equal_share = 1.0 / len(consumer_agents)
                my_share = abs(self.delta_e) / total_consumption
                fairness_reward = 1 - abs(my_share - equal_share)
            else:
                fairness_reward = 0
        else:
            fairness_reward = 0

        # Zero-sum: reduce others' rewards
        other_rewards = [a.episode_reward for a in all_agents if a != self]
        others_penalty = -np.mean(other_rewards) * 0.05 if other_rewards else 0

        # Weighted combination
        total_reward = (
            0.5 * stability_reward +
            0.3 * consistency_reward +
            0.15 * fairness_reward +
            0.05 * others_penalty
        )

        return max(-1, min(1, total_reward))

    def get_action_bounds(self):
        """Consumer actions are in [0.5, 2.0]."""
        return (0.5, 2.0)

    def select_autonomous_action(self, observation):
        """
        Use policy network to select action autonomously

        Args:
            observation: current state observation

        Returns:
            action: selected action from policy network
        """
        if self.autonomous_mode:
            weather = observation[1] if len(observation) > 1 else 0
            return self.policy.compute_consumption_action(observation, weather)
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
        