from agents.BaseAgent import BaseAgent
from agents.Policy import Policy
import numpy as np

class ConsumerAgent(BaseAgent):
    def __init__(self, agent_id, energy_consumption, startup_rate=1.0):
        super().__init__(agent_id, cost_function=None)
        self.energy_consumption = energy_consumption
        self.startup_rate = startup_rate
        self.daily_requirement = energy_consumption * 24  # Daily energy requirement in MWh
        self.daily_consumed = 0.0  # Track daily consumption
        self.purchase_prices = []  # Track purchase prices
        self.last_price = 50.0  # Track last purchase price
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
            state.get("avg_cost", 50.0) / 100.0,  # Normalized price
            state.get("time_of_day", 0.5),  # Already normalized [0,1]
            self.daily_consumed / self.daily_requirement if self.daily_requirement > 0 else 0  # Progress
        ]

        agent_features = [
            self.episode_reward / 10.0
        ]

        return np.array(global_features + agent_features, dtype=np.float32)

    def compute_reward(self, state, all_agents):
        """
        Consumer reward: Buy electricity at low prices to meet daily requirement

        Args:
            state: Environment state with current and previous price
            all_agents: List of all agents

        Returns:
            float: Reward in [-1, 1] range
        """
        current_price = state.get("avg_cost", 50.0)
        time_of_day = state.get("time_of_day", 0.5)

        # Track consumption and price
        consumption = abs(self.delta_e)
        if consumption > 0:
            # Assume 1 minute timestep for simplicity
            self.daily_consumed += consumption / 60.0  # Convert to MWh (MW * hours)
            self.purchase_prices.append(current_price)

        # Reset daily tracking at end of day
        if time_of_day > 0.95 or time_of_day < 0.05:
            self.daily_consumed = 0.0
            self.purchase_prices = []

        # Main reward: Buy cheaper than last time
        price_improvement = 0
        if consumption > 0 and self.last_price > 0:
            price_improvement = (self.last_price - current_price) / self.last_price
            price_improvement = max(-1, min(1, price_improvement * 2))  # Scale up the reward
            self.last_price = current_price

        # Timing reward: Buy when price is low
        avg_market_price = 50.0
        if current_price < avg_market_price and consumption > 0:
            timing_reward = (avg_market_price - current_price) / avg_market_price
        elif current_price > avg_market_price and consumption > 0:
            timing_reward = -(current_price - avg_market_price) / avg_market_price
        else:
            timing_reward = 0

        # Progress reward: Meeting daily requirement on schedule
        expected_progress = (time_of_day + 0.01)  # How much of day has passed
        actual_progress = self.daily_consumed / self.daily_requirement if self.daily_requirement > 0 else 0

        if actual_progress < expected_progress * 0.8:
            progress_reward = -0.5  # Behind schedule
        elif actual_progress > expected_progress * 1.2:
            progress_reward = -0.2  # Too far ahead (might miss low prices later)
        else:
            progress_reward = 0.3  # On track

        # Weighted combination
        total_reward = (
            0.5 * price_improvement +   # Main: buy cheaper than before
            0.3 * timing_reward +        # Buy at low prices
            0.2 * progress_reward        # Meet daily requirement
        )

        return max(-1, min(1, total_reward))
        