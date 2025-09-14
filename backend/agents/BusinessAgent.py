from agents.BaseAgent import BaseAgent
# from agents.Policy import Policy
import numpy as np

class BusinessAgent(BaseAgent):
    def __init__(self, agent_id, baseline_consumption, startup_rate=1.0):
        super().__init__(agent_id, cost_function=lambda e: abs(e) * 0.1)
        self.baseline_consumption = baseline_consumption
        self.demand = baseline_consumption
        self.startup_rate = startup_rate
        self.daily_requirement = baseline_consumption * 24  # Daily energy requirement
        self.daily_consumed = 0.0
        self.purchase_prices = []
        self.last_price = 50.0
        # self.policy = Policy(agent_type=0)  # Business agent type
        self.policy = None


    def _get_observation(self, state):
        """Convert state to normalized observation vector."""
        global_features = [
            state.get("frequency", 60) / 60.0,
            state.get("avg_cost", 50.0) / 100.0,  # Normalized price
            state.get("time_of_day", 0.5),  # Already normalized
            self.daily_consumed / self.daily_requirement if self.daily_requirement > 0 else 0
        ]

        agent_features = [
            abs(self.delta_e) / self.baseline_consumption,
            self.episode_reward / 10.0,
            0.0  # agent type identifier
        ]

        return np.array(global_features + agent_features, dtype=np.float32)

    def update_state(self, dt):
        """Update demand using OU process with compound Poisson jumps."""
        # OU background process
        self.demand = self.ornstein_uhlenbeck(
            self.demand, mu=self.baseline_consumption, theta=0.1, sigma=5, dt=dt
        )
        # Random Poisson jumps (5% chance per step)
        jump = self.compound_poisson_jump(lambda_rate=0.05, jump_mean=20, jump_std=5, dt=dt)
        self.demand += jump

    def act(self, state):
        """Return negative power for consumption."""
        return -abs(self.demand)  # Always negative for consumption
