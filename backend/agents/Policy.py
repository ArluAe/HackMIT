import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from torch.distributions import Normal

class Policy(nn.Module):
    def __init__(self, agent_type=0, hidden_size=64):
        super().__init__()
        self.agent_type = agent_type
        self.hidden_size = hidden_size

        # Set input size based on agent type
        self.input_size = self._get_input_size_for_agent_type(agent_type)

        # Shared network layers
        self.fc1 = nn.Linear(self.input_size, hidden_size)
        self.fc2 = nn.Linear(hidden_size, hidden_size)

        # Actor head (policy)
        self.actor_fc = nn.Linear(hidden_size, hidden_size)
        self.action_mean = nn.Linear(hidden_size, 1)
        self.action_log_std = nn.Parameter(torch.zeros(1))

        # Critic head (value function)
        self.critic_fc = nn.Linear(hidden_size, hidden_size)
        self.value_head = nn.Linear(hidden_size, 1)

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
        for layer in [self.fc1, self.fc2, self.actor_fc, self.action_mean,
                     self.critic_fc, self.value_head]:
            if hasattr(layer, 'weight'):
                nn.init.orthogonal_(layer.weight, gain=np.sqrt(2))
            if hasattr(layer, 'bias'):
                nn.init.constant_(layer.bias, 0.0)

        # Initialize action_mean with smaller weights for stable exploration
        nn.init.orthogonal_(self.action_mean.weight, gain=0.01)

    def forward(self, x):
        """
        Forward pass through shared layers

        Args:
            x: observation tensor [batch_size, input_size] or [input_size]

        Returns:
            shared_features: features for actor and critic heads
        """
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        x = F.relu(self.fc2(x))
        return x

    def get_action_and_value(self, obs, action=None):
        """Get action distribution, value estimate, and log probability"""
        if isinstance(obs, np.ndarray):
            obs = torch.FloatTensor(obs)

        # Shared features
        shared_features = self.forward(obs)

        # Actor: action distribution
        actor_features = F.relu(self.actor_fc(shared_features))
        action_mean = torch.tanh(self.action_mean(actor_features))  # Bound to [-1, 1]
        action_std = torch.exp(self.action_log_std.clamp(-5, 2))  # Prevent extreme values

        action_dist = Normal(action_mean, action_std)

        # If action not provided, sample from distribution
        if action is None:
            action = action_dist.sample()

        # Clamp action to [-1, 1] range
        action = torch.clamp(action, -1, 1)

        # Get log probability of action
        log_prob = action_dist.log_prob(action).sum(-1)

        # Critic: value estimate
        critic_features = F.relu(self.critic_fc(shared_features))
        value = self.value_head(critic_features).squeeze(-1)

        return action, log_prob, value, action_dist.entropy().sum(-1)

    def get_value(self, obs):
        """Get only value estimate (for computing advantages)"""
        if isinstance(obs, np.ndarray):
            obs = torch.FloatTensor(obs)

        shared_features = self.forward(obs)
        critic_features = F.relu(self.critic_fc(shared_features))
        return self.value_head(critic_features).squeeze(-1)

    def select_action(self, observation, training=True):
        """
        Select action from observation for environment interaction

        Args:
            observation: numpy array or torch tensor
            training: if True, sample from distribution; else use mean

        Returns:
            dict with action, value, log_prob for PPO training
        """
        if isinstance(observation, np.ndarray):
            observation = torch.FloatTensor(observation)

        with torch.no_grad():
            if observation.dim() == 1:
                observation = observation.unsqueeze(0)

            action, log_prob, value, _ = self.get_action_and_value(observation)

            if not training:
                # Use deterministic action (mean) during evaluation
                shared_features = self.forward(observation)
                actor_features = F.relu(self.actor_fc(shared_features))
                action = torch.tanh(self.action_mean(actor_features))

        return {
            'action': action.squeeze(0).cpu().numpy(),
            'value': value.cpu().numpy(),
            'log_prob': log_prob.cpu().numpy()
        }

    def get_action_batch(self, observations):
        """Get actions for a batch of observations (for training)"""
        if isinstance(observations, np.ndarray):
            observations = torch.FloatTensor(observations)

        action, log_prob, value, entropy = self.get_action_and_value(observations)
        return action, log_prob, value, entropy

    def save_model(self, filepath):
        """Save model parameters"""
        torch.save(self.state_dict(), filepath)

    def load_model(self, filepath):
        """Load model parameters"""
        self.load_state_dict(torch.load(filepath))