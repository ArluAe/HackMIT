import torch
import torch.nn as nn
import torch.nn.functional as F
from .BasePolicyNetwork import BasePolicyNetwork

class ConsumerPolicy(BasePolicyNetwork):
    def __init__(self, input_size=6, hidden_size=64):
        # Consumer actions: [0.5, 2.0] (consumption multiplier)
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
            action: tensor with values in [0.5, 2.0]
        """
        # Shared layers
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        x = F.relu(self.fc2(x))
        x = self.dropout(x)
        x = F.relu(self.fc3(x))

        # Action output (sigmoid scaled to [0.5, 2.0])
        raw_action = torch.sigmoid(self.action_head(x))
        # Scale from [0,1] to [0.5, 2.0]
        action = 0.5 + raw_action * 1.5

        return action

    def get_action_bounds(self):
        """Return action bounds for this policy"""
        return (0.5, 2.0)

    def compute_consumption_action(self, observation, weather_condition):
        """
        Compute consumption action considering weather (price-agnostic)

        Args:
            observation: current observation
            weather_condition: weather factor [-1, 1]

        Returns:
            constrained_action: action considering comfort constraints
        """
        raw_action = self.select_action(observation, training=False)

        # Weather adjustment - need more energy in extreme weather
        if abs(weather_condition) > 0.7:  # extreme weather
            min_consumption = 0.8  # can't go below 80% of baseline
            constrained_action = max(raw_action, min_consumption)
        else:
            constrained_action = raw_action

        # Ensure within bounds
        constrained_action = max(0.5, min(2.0, constrained_action))

        return constrained_action

    def compute_business_action(self, observation, price):
        """
        Compute business consumption action considering price

        Args:
            observation: current observation
            price: current electricity price

        Returns:
            action: price-sensitive action for businesses
        """
        raw_action = self.select_action(observation, training=False)

        # Price adjustment - reduce consumption when prices are high
        if price > 5.0:  # high price
            reduction_factor = min(0.7, 1.0 - (price - 5.0) / 10.0)
            price_adjusted_action = raw_action * reduction_factor
        else:
            price_adjusted_action = raw_action

        # Business bounds are [0.3, 1.5]
        constrained_action = max(0.3, min(1.5, price_adjusted_action))

        return constrained_action

    def get_comfort_penalty(self, action, weather_condition):
        """
        Calculate comfort penalty for low consumption in bad weather

        Args:
            action: consumption multiplier
            weather_condition: weather factor [-1, 1]

        Returns:
            penalty: comfort penalty [0, 1]
        """
        if abs(weather_condition) > 0.5 and action < 1.0:
            # Penalty for reducing consumption in bad weather
            severity = abs(weather_condition)
            reduction = 1.0 - action
            penalty = severity * reduction * 0.5
            return min(penalty, 1.0)

        return 0.0