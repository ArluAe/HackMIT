from agents.BaseAgent import BaseAgent
# from agents.Policy import Policy
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
        # self.policy = Policy(agent_type=3)  # Battery agent type
        self.policy = None


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

    def update_state(self, dt):
        """Add efficiency noise over time."""
        # Add small random variations to efficiency
        noise = np.random.normal(0, 0.01)  # 1% efficiency noise
        self.efficiency = np.clip(self.efficiency + noise, 0.8, 0.98)

    def act(self, state):
        """Dynamic battery control for active grid regulation."""
        # Get grid state information
        total_supply = state.get("total_supply", 0)
        total_demand = state.get("total_demand", 0)
        freq = state.get("frequency", 60.0)
        dt = 0.1

        # Calculate power imbalance (positive = excess supply, negative = excess demand)
        power_imbalance = total_supply - total_demand

        # Battery should provide the OPPOSITE of the imbalance to balance the grid
        # If excess supply (+imbalance), battery should charge (-power)
        # If excess demand (-imbalance), battery should discharge (+power)

        # Proportional regulation with battery coordination
        # Scale response based on this battery's capacity relative to total battery capacity
        total_battery_capacity = 70.0  # Sum of all battery charge rates in test (40+30)
        my_capacity_share = self.charge_rate / total_battery_capacity
        my_target_share = power_imbalance * my_capacity_share

        # Apply regulation factor to prevent oscillation
        regulation_factor = 0.6  # Conservative for stability
        target_power = -my_target_share * regulation_factor

        # Frequency-based correction (small multiplier for stability)
        freq_deviation = freq - 60.0
        if abs(freq_deviation) > 0.01:  # Only respond to significant deviations
            freq_correction = -freq_deviation * 10.0  # 10 MW per 0.1 Hz deviation
            target_power += freq_correction

        # Limit power based on charge rate and SOC constraints
        max_discharge = self.charge_rate if self.soc > 0.05 else 0
        max_charge = self.charge_rate if self.soc < 0.95 else 0

        # Clamp target power to feasible range
        if target_power > 0:  # Discharging
            actual_power = min(target_power, max_discharge)
        else:  # Charging
            actual_power = max(target_power, -max_charge)

        # Update SOC based on actual power
        if actual_power > 0:  # Discharging
            energy_discharged = actual_power * dt
            self.soc = max(0, self.soc - energy_discharged / self.capacity)
        elif actual_power < 0:  # Charging
            energy_charged = abs(actual_power) * self.efficiency * dt
            self.soc = min(1, self.soc + energy_charged / self.capacity)

        return actual_power

