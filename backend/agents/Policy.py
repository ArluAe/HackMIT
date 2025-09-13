import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np

class Policy(nn.Module):
    def __init__(self, agent_type=0, hidden_size=64):
        super().__init__()
        self.agent_type = agent_type
        self.hidden_size = hidden_size

        # Set input size based on agent type
        self.input_size = self._get_input_size_for_agent_type(agent_type)

        # Network layers
        self.fc1 = nn.Linear(self.input_size, hidden_size)
        self.fc2 = nn.Linear(hidden_size, hidden_size)
        self.fc3 = nn.Linear(hidden_size, hidden_size)
        self.action_head = nn.Linear(hidden_size, 1)

        # Dropout for regularization
        self.dropout = nn.Dropout(0.1)

        # Initialize weights
        self._initialize_weights()

    def _get_input_size_for_agent_type(self, agent_type):
        """Get appropriate input size for each agent type"""
        if agent_type == 0:  # Business
            return 7  # frequency, temp, cost, time, consumption_ratio, reward, agent_type
        elif agent_type == 1:  # Consumer
            return 5  # frequency, temp, cost, time, reward
        elif agent_type == 2:  # Producer
            return 6  # frequency, temp, cost, time, utilization, reward
        elif agent_type == 3:  # Battery
            return 7  # frequency, temp, cost, time, soc, capacity_util, reward
        else:
            return 7  # Default

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
            action: raw action in [-1, 1]
        """
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        x = F.relu(self.fc2(x))
        x = self.dropout(x)
        x = F.relu(self.fc3(x))

        # Raw action output [-1, 1]
        raw_action = torch.tanh(self.action_head(x))
        return raw_action

    def select_action(self, observation, training=True):
        """
        Select action from observation

        Args:
            observation: numpy array or torch tensor
            training: if True, add exploration noise

        Returns:
            action: single action value in [-1, 1]
        """
        if isinstance(observation, np.ndarray):
            observation = torch.FloatTensor(observation)

        with torch.no_grad():
            action = self.forward(observation.unsqueeze(0))

        if training:
            # Add exploration noise during training
            noise = torch.normal(0, 0.1, action.shape)
            action = action + noise
            action = torch.clamp(action, -1, 1)

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