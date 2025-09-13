from agents.BaseAgent import BaseAgent
from agents.policies.BatteryPolicy import BatteryPolicy
import numpy as np

class BatteryAgent(BaseAgent):
    def __init__(self, agent_id, capacity, charge_rate, efficiency=0.9, soc=0.5, cost_function=None):
        super().__init__(agent_id, cost_function)
        self.capacity = capacity      # total storage capacity (kWh)
        self.charge_rate = charge_rate
        self.efficiency = efficiency
        self.soc = soc                # State of Charge [0, 1]
        self.total_arbitrage = 0.0    # cumulative profit from trading

        # Initialize policy network
        self.policy = BatteryPolicy(input_size=9)  # matches observation size
        self.autonomous_mode = False  # can switch between manual/autonomous

    def act(self, action):
        """
        Execute RL action: action ∈ [-1, 1] → charge_rate = action × max_charge_rate

        Args:
            action: Continuous action in [-1, 1]
                   -1 = max discharge, 0 = no action, +1 = max charge

        Returns:
            self.delta_e: Actual electricity change
        """
        # Clamp action to valid range
        action = max(-1, min(1, action))
        self.last_action = action
        self.save_action(action)

        if action > 0:  # charging
            max_charge = min(self.charge_rate, (1 - self.soc) * self.capacity)
            actual_charge = action * max_charge
            self.delta_e = actual_charge
            self.soc += (actual_charge * self.efficiency) / self.capacity
        elif action < 0:  # discharging
            max_discharge = min(self.charge_rate, self.soc * self.capacity)
            actual_discharge = abs(action) * max_discharge
            self.delta_e = -actual_discharge
            self.soc -= actual_discharge / self.capacity
        else:  # no action
            self.delta_e = 0

        # Ensure SoC stays within bounds
        self.soc = max(0, min(1, self.soc))

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
            self.soc,                                  # state of charge [0, 1]
            (self.capacity - abs(self.delta_e)) / self.capacity,  # capacity utilization
            self.last_action,                          # previous action [-1, 1]
            self.total_arbitrage / 100.0,             # normalized cumulative profit
            self.episode_reward / 10.0                # normalized cumulative reward
        ]

        return self.normalize_features(global_features + agent_features)

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

    def get_action_bounds(self):
        """Battery actions are in [-1, 1]."""
        return (-1.0, 1.0)

    def select_autonomous_action(self, observation):
        """
        Use policy network to select action autonomously

        Args:
            observation: current state observation

        Returns:
            action: selected action from policy network
        """
        if self.autonomous_mode:
            return self.policy.compute_action_value(observation, self.soc)
        else:
            # Return neutral action if not in autonomous mode
            return 0.0

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
