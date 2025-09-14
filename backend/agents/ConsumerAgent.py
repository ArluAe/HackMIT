from agents.BaseAgent import BaseAgent
from agents.Policy import Policy
import numpy as np

class ConsumerAgent(BaseAgent):
    def __init__(self, agent_id, consumption_range=(50, 200), flexibility=0.2, startup_rate=1.0):
        super().__init__(agent_id, cost_function=None)
        self.consumption_range = consumption_range
        self.flexibility = flexibility
        self.startup_rate = startup_rate
        self.current_consumption = np.mean(consumption_range)
        self.policy = Policy(agent_type=1)  # Consumer agent type

    def act(self, state):
        """
        Single action method: get observation, compute policy decision, execute action.

        Args:
            state: Environment state dictionary

        Returns:
            float: startup_rate * action (action in [-1, 1])
        """
        observation = self._get_observation(state)
        action = self.policy.select_action(observation, training=False)

        # Save action to history at the beginning
        self.action_history.append(action)

        # Scale [-1,1] to consumer bounds [0.5, 2.0] and execute
        scaled_action = 1.25 + action * 0.75  # center at 1.25, range ±0.75
        scaled_action = max(0.5, min(2.0, scaled_action))

        consumption = scaled_action * self.energy_consumption
        self.delta_e = -consumption

        # Return startup_rate * action (action is already [-1, 1])
        return self.startup_rate * action

    def _get_observation(self, state):
        """Convert state to normalized observation vector."""
        global_features = [
            state.get("frequency", 60) / 60.0,
            state.get("temperature", 0),
            state.get("avg_cost", 1.0) / 10.0,
            state.get("time_of_day", 12) / 24.0
        ]

        agent_features = [
            self.episode_reward / 10.0
        ]

        return np.array(global_features + agent_features, dtype=np.float32)

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
        