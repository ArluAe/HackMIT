from agents.BaseAgent import BaseAgent
from agents.PPO import PPOContinuous
import numpy as np

class ConsumerAgent(BaseAgent):
    def __init__(self, agent_id, training_steps, state_dim):
        super().__init__(agent_id, training_steps, state_dim)
        self.last_power = 0

    def act(self, state):
        self.last_power = super().act(state)
        return self.last_power

    def compute_reward(self, state):
        required_power = (state[3] - 24) * 1 + 5 / (720^2) * pow((state[2] - 0.5), 2)
        return -abs(self.last_power - required_power) * 0.001

    
        



        