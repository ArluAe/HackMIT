from agents.BaseAgent import BaseAgent
from agents.Policy import Policy
import numpy as np

class ProducerAgent(BaseAgent):
    def __init__(self, agent_id, max_output, startup_rate=1.0, cost_function=None):
        super().__init__(agent_id, cost_function)
        self.max_output = max_output
        self.startup_rate = startup_rate
        self.policy = Policy(agent_type=2)  # Producer agent type

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

        # Scale [-1,1] to producer bounds [0, 1] and execute
        scaled_action = (action + 1) / 2  # scale [-1,1] to [0,1]
        scaled_action = max(0, min(1, scaled_action))
        output = scaled_action * self.max_output
        self.delta_e = output

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
            self.delta_e / self.max_output,
            self.episode_reward / 10.0
        ]

        return np.array(global_features + agent_features, dtype=np.float32)

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