import torch
import torch.nn as nn
import torch.nn.functional as F
from .BasePolicyNetwork import BasePolicyNetwork

class BatteryPolicy(BasePolicyNetwork):
    def __init__(self, input_size=10, hidden_size=64):
        # Battery actions: [-1, 1] (discharge to charge)
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
            action: tensor with values in [-1, 1]
        """
        # Shared layers
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        x = F.relu(self.fc2(x))
        x = self.dropout(x)
        x = F.relu(self.fc3(x))

        # Action output (tanh to bound between -1 and 1)
        action = torch.tanh(self.action_head(x))

        return action

    def get_action_bounds(self):
        """Return action bounds for this policy"""
        return (-1.0, 1.0)

    def compute_action_value(self, observation, state_of_charge):
        """
        Compute action considering battery constraints

        Args:
            observation: current observation
            state_of_charge: current SoC [0, 1]

        Returns:
            constrained_action: action respecting battery limits
        """
        raw_action = self.select_action(observation, training=False)

        # Apply SoC constraints
        if state_of_charge >= 0.95 and raw_action > 0:
            # Nearly full, limit charging
            constrained_action = min(raw_action, 0.1)
        elif state_of_charge <= 0.05 and raw_action < 0:
            # Nearly empty, limit discharging
            constrained_action = max(raw_action, -0.1)
        else:
            constrained_action = raw_action

        return constrained_action