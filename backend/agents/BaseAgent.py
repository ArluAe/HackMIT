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
        """Decide how much to consume/produce based on current state."""
        pass

    def compute_reward(self, state):
        """Compute payoff based on current state and actions."""
        return 0.0

    def update_state(self, dt):
        """Apply stochastic process step - to be overridden by subclasses."""
        pass

    def ornstein_uhlenbeck(self, x, mu, theta, sigma, dt):
        """OU process for mean-reverting stochastic demand/supply."""
        return x + theta * (mu - x) * dt + sigma * np.sqrt(dt) * np.random.randn()

    def compound_poisson_jump(self, lambda_rate, jump_mean, jump_std, dt):
        """Generate compound Poisson jumps."""
        n_jumps = np.random.poisson(lambda_rate * dt)
        if n_jumps > 0:
            return np.sum(np.random.normal(jump_mean, jump_std, n_jumps))
        return 0.0

    def update_reward(self, reward):
        self.episode_reward += reward