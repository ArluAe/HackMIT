from agents.BaseAgent import BaseAgent
from agents.Policy import Policy
import numpy as np

class BusinessAgent(BaseAgent):
    def __init__(self, agent_id, baseline_consumption, startup_rate=1.0):
        super().__init__(agent_id, cost_function=lambda e: abs(e) * 0.1)
        self.baseline_consumption = baseline_consumption
        self.startup_rate = startup_rate
        self.daily_requirement = baseline_consumption * 24  # Daily energy requirement
        self.daily_consumed = 0.0
        self.purchase_prices = []
        self.last_price = 50.0
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
            state.get("avg_cost", 50.0) / 100.0,  # Normalized price
            state.get("time_of_day", 0.5),  # Already normalized
            self.daily_consumed / self.daily_requirement if self.daily_requirement > 0 else 0
        ]

        agent_features = [
            abs(self.delta_e) / self.baseline_consumption,
            self.episode_reward / 10.0,
            0.0  # agent type identifier
        ]

        return np.array(global_features + agent_features, dtype=np.float32)

    def compute_reward(self, state, all_agents):
        """
        Business reward: Buy electricity at low prices, smarter than consumers

        Args:
            state: Environment state
            all_agents: List of all agents

        Returns:
            float: Reward in [-1, 1] range
        """
        current_price = state.get("avg_cost", 50.0)
        time_of_day = state.get("time_of_day", 0.5)

        # Track consumption
        consumption = abs(self.delta_e)
        if consumption > 0:
            # Assume 1 minute timestep
            self.daily_consumed += consumption / 60.0  # Convert MW to MWh
            self.purchase_prices.append(current_price)

        # Reset at day end
        if time_of_day > 0.95 or time_of_day < 0.05:
            self.daily_consumed = 0.0
            self.purchase_prices = []

        # Main reward: Buy cheaper than last time (businesses are price-sensitive)
        price_improvement = 0
        if consumption > 0 and self.last_price > 0:
            price_improvement = (self.last_price - current_price) / self.last_price
            price_improvement = max(-1, min(1, price_improvement * 3))  # More sensitive to price
            self.last_price = current_price

        # Strategic timing: Businesses can shift load more flexibly
        avg_market_price = 50.0
        if current_price < avg_market_price * 0.8 and consumption > 0:
            timing_reward = 1.0  # Excellent timing
        elif current_price < avg_market_price and consumption > 0:
            timing_reward = 0.5  # Good timing
        elif current_price > avg_market_price * 1.2 and consumption > 0:
            timing_reward = -1.0  # Poor timing
        else:
            timing_reward = 0

        # Flexibility reward: Can vary consumption more than consumers
        consumption_ratio = consumption / self.baseline_consumption if self.baseline_consumption > 0 else 1
        if 0.3 <= consumption_ratio <= 1.5:  # Operating within flexible range
            flexibility_reward = 0.2
        else:
            flexibility_reward = -0.3  # Outside operational limits

        # Competition: Beat other businesses on average price
        business_agents = [a for a in all_agents if type(a).__name__ == 'BusinessAgent']
        if len(business_agents) > 1 and len(self.purchase_prices) > 0:
            my_avg_price = np.mean(self.purchase_prices)
            competition_reward = 0
            for other in business_agents:
                if other != self and len(other.purchase_prices) > 0:
                    other_avg = np.mean(other.purchase_prices)
                    if my_avg_price < other_avg:
                        competition_reward += 0.3
                    else:
                        competition_reward -= 0.1
            competition_reward = max(-1, min(1, competition_reward))
        else:
            competition_reward = 0

        # Weighted combination
        total_reward = (
            0.4 * price_improvement +   # Main: buy cheaper than before
            0.3 * timing_reward +        # Strategic load timing
            0.2 * competition_reward +   # Beat other businesses
            0.1 * flexibility_reward     # Operational flexibility
        )

        return max(-1, min(1, total_reward))