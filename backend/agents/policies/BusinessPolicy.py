import torch
import torch.nn as nn
import torch.nn.functional as F
from .BasePolicyNetwork import BasePolicyNetwork

class BusinessPolicy(BasePolicyNetwork):
    def __init__(self, input_size=7, hidden_size=64):
        # Business actions: [0.3, 1.5] (consumption multiplier)
        super().__init__(input_size, output_size=1, hidden_size=hidden_size)

        # Output layer for continuous action
        self.action_head = nn.Linear(hidden_size, 1)

        # Initialize weights
        self._initialize_weights()

    def _initialize_weights(self):
        """Initialize network weights"""
        for layer in [self.fc1, self.fc2, self.fc3, self.action_head]:
            nn.init.xavier_uniform_(layer.weight)
            nn.init.constant_(layer.bias, 0.0)

    def forward(self, x):
        """
        Forward pass

        Args:
            x: observation tensor [batch_size, input_size] or [input_size]

        Returns:
            action: tensor with values in [0.3, 1.5]
        """
        # Shared layers
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        x = F.relu(self.fc2(x))
        x = self.dropout(x)
        x = F.relu(self.fc3(x))

        # Action output (sigmoid scaled to [0.3, 1.5])
        raw_action = torch.sigmoid(self.action_head(x))
        action = 0.3 + raw_action * 1.2  # scale from [0,1] to [0.3, 1.5]

        return action

    def get_action_bounds(self):
        """Return action bounds for this policy"""
        return (0.3, 1.5)

    def compute_cost_optimized_action(self, observation, baseline_consumption, current_price):
        """
        Compute action optimizing for cost efficiency

        Args:
            observation: current observation
            baseline_consumption: baseline energy needs
            current_price: current electricity price

        Returns:
            optimized_action: cost-conscious consumption multiplier
        """
        raw_action = self.select_action(observation, training=False)

        # Extract price trend from observation (assuming it's normalized in position 2)
        price_normalized = observation[2] if len(observation) > 2 else 0.1
        estimated_price = price_normalized * 10.0  # denormalize

        # Cost optimization logic
        if estimated_price > current_price * 1.2:  # high price period
            # Reduce consumption to save costs
            optimized_action = max(0.3, raw_action * 0.8)
        elif estimated_price < current_price * 0.8:  # low price period
            # Increase consumption to take advantage of low prices
            optimized_action = min(1.5, raw_action * 1.15)
        else:
            # Normal pricing, use raw action
            optimized_action = raw_action

        return optimized_action

    def estimate_productivity_impact(self, consumption_level, baseline_consumption):
        """
        Estimate impact on business productivity based on consumption level

        Args:
            consumption_level: planned consumption level
            baseline_consumption: minimum required consumption

        Returns:
            productivity_factor: expected productivity impact [0, 1]
        """
        consumption_ratio = consumption_level / baseline_consumption

        if consumption_ratio < 0.5:
            # Severe consumption reduction hurts productivity
            productivity_factor = consumption_ratio * 2  # linear penalty below 0.5
        elif consumption_ratio < 0.8:
            # Moderate reduction with diminishing returns
            productivity_factor = 0.5 + (consumption_ratio - 0.5) * 1.67
        else:
            # Above 80% baseline, minimal productivity impact
            productivity_factor = min(1.0, 0.8 + (consumption_ratio - 0.8) * 0.5)

        return productivity_factor

    def get_operational_constraints(self, previous_consumption, max_change_rate=0.4):
        """
        Apply operational constraints for business continuity

        Args:
            previous_consumption: last consumption level
            max_change_rate: maximum change per step (as fraction)

        Returns:
            (min_action, max_action): allowed action range
        """
        min_action = max(0.3, previous_consumption * (1 - max_change_rate))
        max_action = min(1.5, previous_consumption * (1 + max_change_rate))

        return min_action, max_action

    def evaluate_market_timing(self, observation, price_history):
        """
        Evaluate optimal timing for consumption based on market trends

        Args:
            observation: current observation
            price_history: recent price history

        Returns:
            timing_score: recommendation for current consumption timing [-1, 1]
        """
        if len(price_history) < 3:
            return 0.0  # insufficient data

        # Extract time of day (assuming it's in position 3, normalized)
        time_of_day = observation[3] * 24 if len(observation) > 3 else 12

        # Analyze price trends
        recent_prices = price_history[-3:]
        price_trend = (recent_prices[-1] - recent_prices[0]) / (recent_prices[0] + 1e-8)

        # Time-based scoring (businesses typically prefer off-peak hours)
        if 2 <= time_of_day <= 6:  # late night - typically low demand
            time_score = 0.8
        elif 22 <= time_of_day <= 24 or 0 <= time_of_day <= 2:  # late evening/early morning
            time_score = 0.6
        elif 9 <= time_of_day <= 17:  # business hours - high demand
            time_score = -0.4
        else:  # other hours
            time_score = 0.0

        # Price trend scoring
        if price_trend < -0.1:  # prices falling
            trend_score = 0.6
        elif price_trend > 0.1:  # prices rising
            trend_score = -0.6
        else:  # stable prices
            trend_score = 0.0

        # Combined timing score
        timing_score = (time_score + trend_score) / 2
        return max(-1.0, min(1.0, timing_score))