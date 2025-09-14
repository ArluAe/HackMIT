from agents.BaseAgent import BaseAgent
from agents.Policy import Policy
import numpy as np

class ProducerAgent(BaseAgent):
    def __init__(self, agent_id, max_output, startup_rate=1.0, cost_function=None):
        super().__init__(agent_id, cost_function)
        self.max_output = max_output
        self.startup_rate = startup_rate
        self.production_cost = 30.0  # Base production cost $/MWh
        self.revenue_history = []
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
            state.get("avg_cost", 50.0) / 100.0,  # Normalized price
            state.get("time_of_day", 0.5),  # Already normalized
            (state.get("frequency", 60) - 60) / 10.0  # Frequency deviation
        ]

        agent_features = [
            self.delta_e / self.max_output if self.max_output > 0 else 0,
            self.episode_reward / 10.0
        ]

        return np.array(global_features + agent_features, dtype=np.float32)

    def compute_reward(self, state, all_agents):
        """
        Producer reward: Maintain frequency stability AND sell at high prices

        Args:
            state: Environment state
            all_agents: List of all agents

        Returns:
            float: Reward in [-1, 1] range
        """
        current_price = state.get("avg_cost", 50.0)
        frequency = state.get("frequency", 60)

        # PRIORITY 1: Frequency stability (critical for grid)
        freq_deviation = abs(frequency - 60)
        if freq_deviation < 0.5:  # Excellent stability
            stability_reward = 1.0
        elif freq_deviation < 1.0:  # Good stability
            stability_reward = 0.5
        elif freq_deviation < 2.0:  # Acceptable
            stability_reward = 0
        else:  # Poor stability
            stability_reward = -1.0 * (freq_deviation / 5.0)

        # PRIORITY 2: Profit from selling at high prices
        if self.delta_e > 0:
            revenue = self.delta_e * current_price / 60.0  # MW * $/MWh / 60 = revenue per minute
            cost = self.delta_e * self.production_cost / 60.0
            profit = revenue - cost
            self.revenue_history.append(revenue)

            # Profit margin reward
            margin = (current_price - self.production_cost) / self.production_cost
            if margin > 0.5:  # >50% margin
                profit_reward = 0.8
            elif margin > 0.2:  # >20% margin
                profit_reward = 0.4
            elif margin > 0:  # Positive margin
                profit_reward = 0.1
            else:  # Losing money
                profit_reward = -0.5
        else:
            profit_reward = -0.2  # Penalty for not producing

        # Strategic production: Produce more when price is high
        utilization = self.delta_e / self.max_output if self.max_output > 0 else 0
        if current_price > 60:  # High price
            if utilization > 0.7:
                strategy_reward = 0.5  # Good: high production when price is high
            else:
                strategy_reward = -0.2  # Missing opportunity
        elif current_price < 40:  # Low price
            if utilization < 0.3:
                strategy_reward = 0.3  # Good: low production when price is low
            else:
                strategy_reward = -0.2  # Overproducing at low prices
        else:
            strategy_reward = 0

        # Responsiveness: Adjust production based on frequency
        response_reward = 0
        if frequency < 59.5 and self.delta_e > self.max_output * 0.5:  # Low freq, high production
            response_reward = 0.3
        elif frequency > 60.5 and self.delta_e < self.max_output * 0.3:  # High freq, low production
            response_reward = 0.3
        elif frequency < 59 and self.delta_e < self.max_output * 0.5:  # Not responding to low freq
            response_reward = -0.5
        elif frequency > 61 and self.delta_e > self.max_output * 0.7:  # Not responding to high freq
            response_reward = -0.5

        # Competition with other producers
        producer_agents = [a for a in all_agents if type(a).__name__ == 'ProducerAgent']
        competition_reward = 0
        if len(producer_agents) > 1 and len(self.revenue_history) > 0:
            my_avg_revenue = np.mean(self.revenue_history[-10:]) if len(self.revenue_history) > 0 else 0
            for other in producer_agents:
                if other != self and len(other.revenue_history) > 0:
                    other_avg = np.mean(other.revenue_history[-10:])
                    if my_avg_revenue > other_avg:
                        competition_reward += 0.1
            competition_reward = max(-0.5, min(0.5, competition_reward))

        # Weighted combination: Stability is critical, profit is important
        total_reward = (
            0.4 * stability_reward +     # Critical: maintain frequency
            0.3 * profit_reward +        # Important: sell at profit
            0.15 * strategy_reward +     # Strategic production levels
            0.1 * response_reward +      # Respond to frequency
            0.05 * competition_reward    # Beat other producers
        )

        return max(-1, min(1, total_reward))