from agents.BaseAgent import BaseAgent
from agents.PPO import PPOContinuous
import numpy as np
import math

class ProducerAgent(BaseAgent):
    def __init__(self, agent_id, training_steps, state_dim):
        super().__init__(agent_id, training_steps, state_dim)

    def act(self, state):
        """
        Single action method: get observation, compute policy decision, execute action.

        Args:
            state: Environment state dictionary

        Returns:
            float: startup_rate * action (action in [-1, 1])
        """
        return super().act(state)

    def compute_reward(self, state):
        # Scale the reward to prevent extremely high value losses
        return -abs(state[0]) * 0.01
