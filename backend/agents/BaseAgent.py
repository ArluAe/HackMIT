from abc import ABC, abstractmethod
import numpy as np

class BaseAgent(ABC):
    def __init__(self, agent_id, cost_function=None):
        self.agent_id = agent_id
        self.delta_e = 0.0   # electricity produced (+) or consumed (-)
        # default cost function: fixed + variable (economies of scale)
        self.cost_function = cost_function or (lambda e: 10 + 0.5 * e if e > 0 else 0)

        # RL-specific attributes
        self.last_action = 0.0
        self.episode_reward = 0.0
        self.action_history = []  # stores all actions taken

    @abstractmethod
    def act(self, action):
        """
        Execute RL action (continuous parameter) and update self.delta_e.

        Args:
            action: Continuous action parameter from RL policy

        Returns:
            self.delta_e: Actual electricity change
        """
        pass

    @abstractmethod
    def get_observation(self, state):
        """
        Convert environment state to normalized observation vector for RL.

        Args:
            state: Environment state dictionary

        Returns:
            np.array: Normalized observation vector
        """
        pass

    @abstractmethod
    def compute_reward(self, state, all_agents):
        """
        Calculate adversarial reward based on action, state, and other agents.

        Args:
            state: Environment state dictionary
            all_agents: List of all agents for competitive rewards

        Returns:
            float: Reward value in [-1, 1] range
        """
        pass

    def update_reward(self, reward):
        """Update episode reward accumulation."""
        self.episode_reward += reward

    def get_action_bounds(self):
        """Return (min_action, max_action) bounds for this agent type."""
        return (-1.0, 1.0)  # Default bounds, override in subclasses

    def normalize_features(self, features):
        """Helper to normalize observation features."""
        return np.array(features, dtype=np.float32)

    def save_action(self, action):
        """Save action to history."""
        self.action_history.append(action)

    def get_action_history(self):
        """Return complete action history."""
        return self.action_history.copy()