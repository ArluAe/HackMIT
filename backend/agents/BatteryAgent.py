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
        self.total_arbitrage = 0.0
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
            state.get("temperature", 0),
            state.get("avg_cost", 1.0) / 10.0,
            state.get("time_of_day", 12) / 24.0
        ]

        agent_features = [
            self.soc,
            (self.capacity - abs(self.delta_e)) / self.capacity,
            self.episode_reward / 10.0
        ]

        return np.array(global_features + agent_features, dtype=np.float32)

    def compute_reward(self, state, all_agents):
        """
        Adversarial reward: maximize arbitrage + market manipulation + competitive advantage

        Args:
            state: Environment state
            all_agents: List of all agents for competition

        Returns:
            float: Reward in [-1, 1] range
        """
        # Arbitrage profit component
        price = state.get("avg_cost", 1.0)
        if self.delta_e > 0:  # charging (buying)
            transaction_profit = -self.delta_e * price  # negative (cost)
        elif self.delta_e < 0:  # discharging (selling)
            transaction_profit = abs(self.delta_e) * price  # positive (revenue)
        else:
            transaction_profit = 0

        self.total_arbitrage += transaction_profit

        # Normalize arbitrage reward
        arbitrage_reward = min(1, max(-1, transaction_profit / 10.0))

        # Market impact reward (reward for affecting prices)
        frequency = state.get("frequency", 60)
        frequency_deviation = abs(frequency - 60)

        # Reward for creating beneficial instability that batteries can exploit
        if abs(self.delta_e) > 0:
            market_impact = frequency_deviation * abs(self.delta_e) / (self.charge_rate + 1e-8)
            impact_reward = min(1, market_impact / 5.0)
        else:
            impact_reward = 0

        # Competition with other batteries
        battery_agents = [a for a in all_agents if isinstance(a, BatteryAgent)]
        if len(battery_agents) > 1:
            my_profit_rate = self.total_arbitrage
            others_profit = [a.total_arbitrage for a in battery_agents if a != self]
            if others_profit:
                competitive_advantage = my_profit_rate - np.mean(others_profit)
                competition_reward = min(1, max(-1, competitive_advantage / 20.0))
            else:
                competition_reward = 0
        else:
            competition_reward = 0

        # SoC management penalty (operational constraints)
        if self.soc < 0.1:  # nearly empty
            soc_penalty = -2 * (0.1 - self.soc)
        elif self.soc > 0.9:  # nearly full
            soc_penalty = -2 * (self.soc - 0.9)
        else:
            soc_penalty = 0

        # Zero-sum component: profit from others' inefficiency
        other_rewards = [a.episode_reward for a in all_agents if a != self]
        exploitation_reward = -np.mean(other_rewards) * 0.1 if other_rewards else 0

        # Weighted combination
        total_reward = (
            0.4 * arbitrage_reward +
            0.2 * impact_reward +
            0.2 * competition_reward +
            0.1 * exploitation_reward +
            0.1 * soc_penalty
        )

        return max(-1, min(1, total_reward))
