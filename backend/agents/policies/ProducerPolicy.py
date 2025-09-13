import torch
import torch.nn as nn
import torch.nn.functional as F
from .BasePolicyNetwork import BasePolicyNetwork

class ProducerPolicy(BasePolicyNetwork):
    def __init__(self, input_size=8, hidden_size=64):
        # Producer actions: [0, 1] (output level)
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
            action: tensor with values in [0, 1]
        """
        # Shared layers
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        x = F.relu(self.fc2(x))
        x = self.dropout(x)
        x = F.relu(self.fc3(x))

        # Action output (sigmoid for [0, 1] range)
        action = torch.sigmoid(self.action_head(x))

        return action

    def get_action_bounds(self):
        """Return action bounds for this policy"""
        return (0.0, 1.0)

    def compute_production_action(self, observation, cost_function, max_output):
        """
        Compute production action considering costs and market conditions

        Args:
            observation: current observation
            cost_function: production cost function
            max_output: maximum production capacity

        Returns:
            constrained_action: economically viable action
        """
        raw_action = self.select_action(observation, training=False)

        # Extract price from observation (assuming it's in position 3, normalized)
        price_normalized = observation[3] if len(observation) > 3 else 0.1
        estimated_price = price_normalized * 10.0  # denormalize

        # Check profitability at different production levels
        test_output = raw_action * max_output
        production_cost = cost_function(test_output) if test_output > 0 else 0
        revenue = test_output * estimated_price
        profit_margin = (revenue - production_cost) / (revenue + 1e-8)

        # Reduce output if not profitable enough
        if profit_margin < 0.1 and raw_action > 0.2:
            # Not profitable, reduce output
            constrained_action = max(0.1, raw_action * 0.7)
        else:
            constrained_action = raw_action

        return constrained_action

    def estimate_market_response(self, my_action, other_producers_actions):
        """
        Estimate how market will respond to production decisions

        Args:
            my_action: this producer's action [0, 1]
            other_producers_actions: list of other producers' actions

        Returns:
            market_impact_factor: expected price impact
        """
        total_production = my_action + sum(other_producers_actions)

        # More production typically reduces prices
        if total_production > 0.8:  # high total production
            price_impact = 0.8  # prices likely to drop
        elif total_production < 0.3:  # low total production
            price_impact = 1.2  # prices likely to rise
        else:
            price_impact = 1.0  # stable prices

        return price_impact

    def get_ramping_constraints(self, previous_action, max_ramp_rate=0.3):
        """
        Apply ramping constraints for realistic power plant operation

        Args:
            previous_action: last action taken
            max_ramp_rate: maximum change per step

        Returns:
            (min_action, max_action): allowed action range
        """
        min_action = max(0.0, previous_action - max_ramp_rate)
        max_action = min(1.0, previous_action + max_ramp_rate)

        return min_action, max_action