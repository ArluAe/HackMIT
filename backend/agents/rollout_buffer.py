import numpy as np
import torch


class RolloutBuffer:
    """Rollout buffer for storing agent experiences during episodes"""

    def __init__(self, buffer_size, obs_dim, device='cpu'):
        self.buffer_size = buffer_size
        self.obs_dim = obs_dim
        self.device = device
        self.reset()

    def reset(self):
        """Initialize/reset buffer arrays"""
        self.observations = np.zeros((self.buffer_size, self.obs_dim), dtype=np.float32)
        self.actions = np.zeros((self.buffer_size, 1), dtype=np.float32)
        self.rewards = np.zeros(self.buffer_size, dtype=np.float32)
        self.values = np.zeros(self.buffer_size, dtype=np.float32)
        self.log_probs = np.zeros(self.buffer_size, dtype=np.float32)
        self.dones = np.zeros(self.buffer_size, dtype=np.float32)
        self.ptr = 0
        self.path_start_idx = 0

    def add(self, obs, action, reward, value, log_prob, done):
        """Add a transition to the buffer"""
        if self.ptr >= self.buffer_size:
            return False  # Buffer is full

        self.observations[self.ptr] = obs
        self.actions[self.ptr] = action if isinstance(action, (list, np.ndarray)) else [action]
        self.rewards[self.ptr] = reward
        self.values[self.ptr] = value if isinstance(value, (int, float)) else value.item()
        self.log_probs[self.ptr] = log_prob if isinstance(log_prob, (int, float)) else log_prob.item()
        self.dones[self.ptr] = done

        self.ptr += 1

        if done:
            self.path_start_idx = self.ptr

        return True

    def get(self):
        """Get all data from buffer"""
        # Only return data up to current pointer
        idx = self.ptr
        data = (
            self.observations[:idx],
            self.actions[:idx],
            self.rewards[:idx],
            self.values[:idx],
            self.log_probs[:idx],
            self.dones[:idx]
        )
        return data

    def get_batch(self, batch_size=None):
        """Get a random batch from buffer"""
        idx = self.ptr
        if batch_size is None or batch_size >= idx:
            return self.get()

        # Random sampling
        indices = np.random.choice(idx, batch_size, replace=False)
        data = (
            self.observations[indices],
            self.actions[indices],
            self.rewards[indices],
            self.values[indices],
            self.log_probs[indices],
            self.dones[indices]
        )
        return data

    def clear(self):
        """Clear the buffer"""
        self.reset()

    def is_ready(self):
        """Check if buffer has enough data for training"""
        return self.ptr > 0

    def is_full(self):
        """Check if buffer is full"""
        return self.ptr >= self.buffer_size

    def __len__(self):
        """Return current buffer size"""
        return self.ptr


class MultiAgentRolloutBuffer:
    """Rollout buffer manager for multiple agents"""

    def __init__(self, agent_configs, device='cpu'):
        """
        Args:
            agent_configs: dict mapping agent_id to config dict with 'obs_dim' and 'buffer_size'
        """
        self.device = device
        self.buffers = {}

        for agent_id, config in agent_configs.items():
            self.buffers[agent_id] = RolloutBuffer(
                buffer_size=config.get('buffer_size', 2048),
                obs_dim=config['obs_dim'],
                device=device
            )

    def add(self, agent_id, obs, action, reward, value, log_prob, done):
        """Add transition for specific agent"""
        if agent_id not in self.buffers:
            raise ValueError(f"Agent {agent_id} not found in buffer manager")
        return self.buffers[agent_id].add(obs, action, reward, value, log_prob, done)

    def get(self, agent_id):
        """Get data for specific agent"""
        if agent_id not in self.buffers:
            raise ValueError(f"Agent {agent_id} not found in buffer manager")
        return self.buffers[agent_id].get()

    def clear(self, agent_id=None):
        """Clear buffer(s)"""
        if agent_id is not None:
            if agent_id not in self.buffers:
                raise ValueError(f"Agent {agent_id} not found in buffer manager")
            self.buffers[agent_id].clear()
        else:
            # Clear all buffers
            for buffer in self.buffers.values():
                buffer.clear()

    def is_ready(self, agent_id=None):
        """Check if buffer(s) ready for training"""
        if agent_id is not None:
            if agent_id not in self.buffers:
                raise ValueError(f"Agent {agent_id} not found in buffer manager")
            return self.buffers[agent_id].is_ready()
        else:
            # Check if any buffer is ready
            return any(buffer.is_ready() for buffer in self.buffers.values())

    def is_full(self, agent_id=None):
        """Check if buffer(s) full"""
        if agent_id is not None:
            if agent_id not in self.buffers:
                raise ValueError(f"Agent {agent_id} not found in buffer manager")
            return self.buffers[agent_id].is_full()
        else:
            # Check if any buffer is full
            return any(buffer.is_full() for buffer in self.buffers.values())