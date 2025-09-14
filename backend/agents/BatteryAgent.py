from agents.BaseAgent import BaseAgent
from agents.Policy import Policy
import numpy as np

class BatteryAgent(BaseAgent):
    def __init__(self, agent_id, capacity, charge_rate, startup_rate=1.0, efficiency=0.9, soc=0.5, cost_function=None):
        super().__init__(agent_id, cost_function)
        self.capacity = capacity
        self.charge_rate = charge_rate
        self.startup_rate = startup_rate
        self.efficiency = efficiency
        self.soc = soc
        self.buy_prices = []  # Track prices when charging
        self.sell_prices = []  # Track prices when discharging
        self.total_profit = 0.0  # Track cumulative profit
        self.policy = Policy(agent_type=3)  # Battery agent type

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

        # Action is already in [-1, 1] - perfect for battery
        scaled_action = max(-1, min(1, action))

        # Execute action
        if scaled_action > 0:  # charging
            max_charge = min(self.charge_rate, (1 - self.soc) * self.capacity)
            actual_charge = scaled_action * max_charge
            self.delta_e = actual_charge
            self.soc += (actual_charge * self.efficiency) / self.capacity
        elif scaled_action < 0:  # discharging
            max_discharge = min(self.charge_rate, self.soc * self.capacity)
            actual_discharge = abs(scaled_action) * max_discharge
            self.delta_e = -actual_discharge
            self.soc -= actual_discharge / self.capacity
        else:  # no action
            self.delta_e = 0

        self.soc = max(0, min(1, self.soc))

        # Return startup_rate * action (action is already [-1, 1])
        return self.startup_rate * action

    def _get_observation(self, state):
        """Convert state to normalized observation vector."""
        global_features = [
            state.get("frequency", 60) / 60.0,
            state.get("avg_cost", 50.0) / 100.0,  # Normalized price
            state.get("time_of_day", 0.5),  # Already normalized
            self.soc  # State of charge is critical for batteries
        ]

        agent_features = [
            abs(self.delta_e) / self.charge_rate if self.charge_rate > 0 else 0,  # Utilization
            self.total_profit / 1000.0,  # Normalized profit
            self.episode_reward / 10.0
        ]

        return np.array(global_features + agent_features, dtype=np.float32)

    def compute_reward(self, state, all_agents):
        """
        Battery reward: Buy low, sell high arbitrage

        Args:
            state: Environment state
            all_agents: List of all agents

        Returns:
            float: Reward in [-1, 1] range
        """
        current_price = state.get("avg_cost", 50.0)
        time_of_day = state.get("time_of_day", 0.5)

        # Track transaction and calculate immediate profit
        transaction_reward = 0
        if self.delta_e > 0:  # Charging (buying)
            cost = self.delta_e * current_price / 60.0  # MW * $/MWh / 60 = cost per minute
            self.buy_prices.append(current_price)
            self.total_profit -= cost
            # Reward for buying at low price
            if current_price < 40:  # Below average
                transaction_reward = 0.5
            elif current_price < 50:
                transaction_reward = 0.2
            else:
                transaction_reward = -0.3  # Penalty for buying high

        elif self.delta_e < 0:  # Discharging (selling)
            revenue = abs(self.delta_e) * current_price / 60.0  # MW * $/MWh / 60 = revenue per minute
            self.sell_prices.append(current_price)
            self.total_profit += revenue
            # Reward for selling at high price
            if current_price > 60:  # Above average
                transaction_reward = 0.5
            elif current_price > 50:
                transaction_reward = 0.2
            else:
                transaction_reward = -0.3  # Penalty for selling low

        # Arbitrage performance: Average sell price vs average buy price
        arbitrage_reward = 0
        if len(self.buy_prices) > 0 and len(self.sell_prices) > 0:
            avg_buy = np.mean(self.buy_prices[-10:])  # Recent average
            avg_sell = np.mean(self.sell_prices[-10:])
            spread = (avg_sell - avg_buy) / avg_buy if avg_buy > 0 else 0
            arbitrage_reward = max(-1, min(1, spread * 5))  # Scale spread to reward

        # SOC management: Maintain flexibility
        soc_reward = 0
        if 0.2 <= self.soc <= 0.8:  # Optimal range for flexibility
            soc_reward = 0.2
        elif self.soc < 0.1 or self.soc > 0.9:  # Too extreme
            soc_reward = -0.5
        else:
            soc_reward = 0

        # Strategic timing based on typical daily price patterns
        timing_reward = 0
        if time_of_day < 0.3 or time_of_day > 0.8:  # Off-peak hours
            if self.delta_e > 0:  # Charging during off-peak
                timing_reward = 0.3
            elif self.delta_e < 0:  # Discharging during off-peak
                timing_reward = -0.2
        else:  # Peak hours
            if self.delta_e < 0:  # Discharging during peak
                timing_reward = 0.3
            elif self.delta_e > 0:  # Charging during peak
                timing_reward = -0.2

        # Competition with other batteries
        battery_agents = [a for a in all_agents if type(a).__name__ == 'BatteryAgent']
        competition_reward = 0
        if len(battery_agents) > 1:
            my_profit = self.total_profit
            for other in battery_agents:
                if other != self:
                    if my_profit > other.total_profit:
                        competition_reward += 0.2
                    else:
                        competition_reward -= 0.1
            competition_reward = max(-1, min(1, competition_reward))

        # Weighted combination
        total_reward = (
            0.3 * transaction_reward +   # Immediate transaction quality
            0.3 * arbitrage_reward +      # Buy low/sell high spread
            0.2 * timing_reward +         # Strategic timing
            0.1 * soc_reward +           # SOC management
            0.1 * competition_reward      # Beat other batteries
        )

        return max(-1, min(1, total_reward))
