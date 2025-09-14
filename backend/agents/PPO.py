import torch
import torch.nn as nn
import torch.optim as optim
from torch.distributions import Normal
import numpy as np

class PolicyNetContinuous(nn.Module):
    def __init__(self, state_dim, action_dim, hidden_dim=64):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Tanh()
        )
        self.mean = nn.Linear(hidden_dim, action_dim)
        self.log_std = nn.Parameter(torch.zeros(action_dim))  # learned log std

    def forward(self, x):
        x = self.net(x)
        mean = self.mean(x)
        std = torch.exp(self.log_std.clamp(-20, 2))  # Clamp to prevent NaN
        return mean, std

class ValueNet(nn.Module):
    def __init__(self, state_dim, hidden_dim=64):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, 1)
        )
    def forward(self, x):
        return self.net(x)

class PPOContinuous:
    def __init__(self, state_dim, action_dim, clip=0.2, gamma=0.99, lam=0.95,
                 policy_lr=3e-4, value_lr=1e-3):
        self.policy = PolicyNetContinuous(state_dim, action_dim)
        self.value = ValueNet(state_dim)
        self.policy_opt = optim.Adam(self.policy.parameters(), lr=policy_lr)
        self.value_opt = optim.Adam(self.value.parameters(), lr=value_lr)
        self.clip = clip
        self.gamma = gamma
        self.lam = lam

    def compute_advantages(self, rewards, values, next_value=0.0):
        """Compute advantages using GAE (Generalized Advantage Estimation)"""
        if len(rewards) == 0:
            return torch.tensor([], dtype=torch.float32), torch.tensor([], dtype=torch.float32)
            
        # Add next_value to values for easier computation
        values = values + [next_value]
        
        advantages = []
        gae = 0
        
        for step in reversed(range(len(rewards))):
            if step == len(rewards) - 1:
                next_non_terminal = 1.0  # Assuming episode continues
                next_value = values[step + 1]
            else:
                next_non_terminal = 1.0
                next_value = values[step + 1]
            
            delta = rewards[step] + self.gamma * next_value * next_non_terminal - values[step]
            gae = delta + self.gamma * self.lam * next_non_terminal * gae
            advantages.insert(0, gae)
        
        returns = [adv + val for adv, val in zip(advantages, values[:-1])]
        
        # Convert to tensors
        advantages = torch.tensor(advantages, dtype=torch.float32)
        returns = torch.tensor(returns, dtype=torch.float32)
        
        # Normalize advantages with safety checks
        if len(advantages) > 1:
            adv_std = advantages.std()
            if adv_std > 1e-8:
                advantages = (advantages - advantages.mean()) / adv_std
            else:
                advantages = advantages - advantages.mean()
        else:
            advantages = torch.zeros_like(advantages)
            
        return returns, advantages

    def update(self, states, actions, rewards, old_logprobs):
        # Check for empty data
        if len(states) == 0 or len(actions) == 0 or len(rewards) == 0:
            return 0.0, 0.0
            
        states = torch.tensor(states, dtype=torch.float32)
        actions = torch.tensor(actions, dtype=torch.float32)
        old_logprobs = torch.tensor(old_logprobs, dtype=torch.float32)

        # Value predictions
        values = self.value(states).squeeze().detach().numpy()
        returns, advs = self.compute_advantages(rewards, values.tolist(), next_value=0.0)
        
        # Check if we have valid data after advantage computation
        if len(returns) == 0 or len(advs) == 0:
            return 0.0, 0.0

        # Policy step
        mean, std = self.policy(states)
        dist = Normal(mean, std)
        logprobs = dist.log_prob(actions).sum(dim=-1)  # sum if multidim action
        ratio = torch.exp(logprobs - old_logprobs)

        surr1 = ratio * advs
        surr2 = torch.clamp(ratio, 1 - self.clip, 1 + self.clip) * advs
        policy_loss = -torch.min(surr1, surr2).mean()
        
        # Check for NaN in policy loss and skip update if NaN
        if torch.isnan(policy_loss):
            policy_loss_val = 0.0
        else:
            self.policy_opt.zero_grad()
            policy_loss.backward()
            # Add gradient clipping
            torch.nn.utils.clip_grad_norm_(self.policy.parameters(), max_norm=0.5)
            self.policy_opt.step()
            policy_loss_val = policy_loss.item()

        # Value step
        value_preds = self.value(states).squeeze()
        value_loss = nn.MSELoss()(value_preds, returns)
        
        # Check for NaN in value loss and skip update if NaN
        if torch.isnan(value_loss):
            value_loss_val = 0.0
        else:
            self.value_opt.zero_grad()
            value_loss.backward()
            # Add gradient clipping
            torch.nn.utils.clip_grad_norm_(self.value.parameters(), max_norm=0.5)
            self.value_opt.step()
            value_loss_val = value_loss.item()

        return policy_loss_val, value_loss_val