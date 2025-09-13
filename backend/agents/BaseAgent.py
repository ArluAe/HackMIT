from abc import ABC, abstractmethod

class BaseAgent(ABC):
    def __init__(self, agent_id, cost_function=None):
        self.agent_id = agent_id
        self.delta_e = 0.0   # electricity produced (+) or consumed (-)
        # default cost function: quadratic (convex)
        self.cost_function = cost_function or (lambda e: e**2)

    @abstractmethod
    def act(self, state):
        """
        Decide action (update self.delta_e) given current environment state.
        state is a dictionary, e.g.:
        {
            "frequency": 60,
            "weather": 0.2,
            "time_of_day": 12,
            "overcapacity": 0.1
        }
        """
        pass

    @abstractmethod
    def compute_reward(self, state):
        """Calculate reward/penalty based on current action and environment state."""
        pass