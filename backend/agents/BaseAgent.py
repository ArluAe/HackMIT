from abc import ABC, abstractmethod
import numpy as np

class BaseAgent(ABC):
    def __init__(self, agent_id, cost_function=None):
        self.agent_id = agent_id
        self.delta_e = 0.0
        self.cost_function = cost_function or (lambda e: 10 + 0.5 * e if e > 0 else 0)
        self.episode_reward = 0.0
        self.policy = None
        self.action_history = []

    @abstractmethod
    def act(self, state):
        """
        Single action method: get observation, compute policy decision, execute action.

        Args:
            state: Environment state dictionary

        Returns:
            float: startup_rate * action (action already in [-1, 1])
        """
        pass

    @abstractmethod
    def compute_reward(self, state, all_agents):
        """
        Calculate reward based on state and other agents.

        Args:
            state: Environment state dictionary
            all_agents: List of all agents

        Returns:
            float: Reward value in [-1, 1] range
        """
        pass

    def update_reward(self, reward):
        self.episode_reward += reward