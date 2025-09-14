from abc import ABC, abstractmethod
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.distributions import Normal

from agents import PPO

class BaseAgent(ABC):
    def __init__(self, agent_id, training_steps, state_dim):
        self.agent_id = agent_id
        self.training_steps = training_steps
        self.state_dim = state_dim
        self.reset()
        
        self.network = PPO.PPOContinuous(state_dim, 1)

    def reset(self):
        self.action_history = np.zeros(self.training_steps - 2)
        self.state_history = np.zeros([self.training_steps - 2, self.state_dim])
        self.reward_history = np.zeros(self.training_steps - 2)
        self.logprob_history = np.zeros(self.training_steps - 2)
        self.step = -1

    def act(self, state):
        with torch.no_grad():
            mean, std = self.network.policy.forward(state)
            dist = Normal(mean, std)
            action = dist.sample()
            
            self.step += 1
            
            # Only collect data if we haven't exceeded our buffer size
            if self.step < self.training_steps - 2:
                # Store current state and action
                self.logprob_history[self.step] = dist.log_prob(action).sum(dim=-1).item()
                self.action_history[self.step] = action[0].item()
                self.state_history[self.step, :] = state
                
                # Compute reward for the previous step (step-1) based on current state
                if self.step > 0:
                    self.reward_history[self.step - 1] = self.compute_reward(state)
            return action[0].item()


    def compute_reward(self, state):
        # Default reward function - can be overridden by subclasses
        # Provide a small negative reward to encourage exploration
        # This prevents the constant reward of 1 that provides no learning signal
        # Scale rewards to prevent extremely high value losses
        return -0.01

    def update(self):
        # Only update if we have collected enough data
        if self.step < 0 or self.step < 100:  # Need at least 100 steps to update
            print(f"Agent {self.agent_id}: Not enough data collected (step: {self.step}, required: 100)")
            return
            
        policy_loss, value_loss = self.network.update(self.state_history, self.action_history, self.reward_history, self.logprob_history)
        print(f"Agent {self.agent_id} - Policy Loss: {policy_loss:.6f}, Value Loss: {value_loss:.6f}")
        self.reset()
