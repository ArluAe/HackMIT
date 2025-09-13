from agents.BaseAgent import BaseAgent
from agents.Policy import Policy
import numpy as np

class BusinessAgent(BaseAgent):
    def __init__(self, agent_id, baseline_consumption, startup_rate=1.0):
        super().__init__(agent_id, cost_function=lambda e: abs(e) * 0.1)
        self.baseline_consumption = baseline_consumption
        self.startup_rate = startup_rate
        self.policy = Policy(agent_type=0)  # Business agent type

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

        # Scale [-1,1] to business bounds [0.3, 1.5] and execute
        scaled_action = 0.9 + action * 0.6  # center at 0.9, range ±0.6
        scaled_action = max(0.3, min(1.5, scaled_action))

        consumption = scaled_action * self.baseline_consumption
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
            abs(self.delta_e) / self.baseline_consumption,
            self.episode_reward / 10.0,
            0.0  # agent type identifier
        ]

        return np.array(global_features + agent_features, dtype=np.float32)

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