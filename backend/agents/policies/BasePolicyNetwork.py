import torch
import torch.nn as nn
import torch.nn.functional as F
from abc import ABC, abstractmethod
import numpy as np

class BasePolicyNetwork(nn.Module, ABC):
    def __init__(self, input_size, output_size, hidden_size=64):
        super().__init__()
        self.input_size = input_size
        self.output_size = output_size
        self.hidden_size = hidden_size

        # Common network layers
        self.fc1 = nn.Linear(input_size, hidden_size)
        self.fc2 = nn.Linear(hidden_size, hidden_size)
        self.fc3 = nn.Linear(hidden_size, hidden_size)

        # Dropout for regularization
        self.dropout = nn.Dropout(0.1)

    @abstractmethod
    def forward(self, x):
        """Forward pass - must be implemented by subclasses"""
        pass

    def select_action(self, observation, training=True):
        """
        Select action from observation

        Args:
            observation: numpy array or torch tensor
            training: if True, add exploration noise

        Returns:
            action: single action value
        """
        if isinstance(observation, np.ndarray):
            observation = torch.FloatTensor(observation)

        with torch.no_grad():
            action = self.forward(observation.unsqueeze(0))

        if training:
            # Add exploration noise during training
            noise = torch.normal(0, 0.1, action.shape)
            action = action + noise

        return action.squeeze(0).item()

    def get_action_batch(self, observations):
        """Get actions for a batch of observations (for training)"""
        if isinstance(observations, np.ndarray):
            observations = torch.FloatTensor(observations)

        return self.forward(observations)

    def save_model(self, filepath):
        """Save model parameters"""
        torch.save(self.state_dict(), filepath)

    def load_model(self, filepath):
        """Load model parameters"""
        self.load_state_dict(torch.load(filepath))