from agents.BaseAgent import BaseAgent
# from agents.Policy import Policy
import numpy as np

class ProducerAgent(BaseAgent):
    def __init__(self, agent_id, max_output, kind="thermal", startup_rate=1.0, cost_function=None):
        super().__init__(agent_id, cost_function)
        self.max_output = max_output
        self.kind = kind  # "solar", "wind", "thermal"
        self.supply = 0
        self.startup_rate = startup_rate
        self.production_cost = 30.0  # Base production cost $/MWh
        self.revenue_history = []
        # self.policy = Policy(agent_type=2)  # Producer agent type
        self.policy = None


    def _get_observation(self, state):
        """Convert state to normalized observation vector."""
        global_features = [
            state.get("frequency", 60) / 60.0,
            state.get("avg_cost", 50.0) / 100.0,  # Normalized price
            state.get("time_of_day", 0.5),  # Already normalized
            (state.get("frequency", 60) - 60) / 10.0  # Frequency deviation
        ]

        agent_features = [
            self.delta_e / self.max_output if self.max_output > 0 else 0,
            self.episode_reward / 10.0
        ]

        return np.array(global_features + agent_features, dtype=np.float32)

    def update_state(self, dt):
        """Update supply based on producer type."""
        if self.kind == "solar":
            # Daytime Gaussian generation
            hour = np.random.randint(0, 24)  # Simplified time simulation
            mean = 30 if 8 <= hour <= 18 else 0
            self.supply = max(0, np.random.normal(mean, 5))
        elif self.kind == "wind":
            # Weibull distribution for wind
            w = np.random.weibull(2) * 5
            self.supply = min(self.max_output, 0.5 * w**3)
        elif self.kind == "thermal":
            # Outage probability for thermal plants
            if np.random.rand() < 0.01:  # 1% outage chance
                self.supply = 0
            else:
                self.supply = self.max_output

    def act(self, state):
        """Return positive power for generation."""
        return abs(self.supply)  # Always positive for generation

