from agents.BaseAgent import BaseAgent
# from agents.Policy import Policy
import numpy as np

class ConsumerAgent(BaseAgent):
    def __init__(self, agent_id, energy_consumption, startup_rate=1.0):
        super().__init__(agent_id, cost_function=None)
        self.baseline_demand = energy_consumption
        self.demand = energy_consumption
        self.startup_rate = startup_rate
        self.daily_requirement = energy_consumption * 24  # Daily energy requirement in MWh
        self.daily_consumed = 0.0  # Track daily consumption
        self.purchase_prices = []  # Track purchase prices
        self.last_price = 50.0  # Track last purchase price
        # self.policy = Policy(agent_type=1)  # Consumer agent type
        self.policy = None


    def _get_observation(self, state):
        """Convert state to normalized observation vector."""
        global_features = [
            state.get("frequency", 60) / 60.0,
            state.get("avg_cost", 50.0) / 100.0,  # Normalized price
            state.get("time_of_day", 0.5),  # Already normalized [0,1]
            self.daily_consumed / self.daily_requirement if self.daily_requirement > 0 else 0  # Progress
        ]

        agent_features = [
            self.episode_reward / 10.0
        ]

        return np.array(global_features + agent_features, dtype=np.float32)

    def update_state(self, dt):
        """Update demand using Ornstein-Uhlenbeck process."""
        self.demand = self.ornstein_uhlenbeck(
            self.demand, mu=self.baseline_demand, theta=0.2, sigma=2, dt=dt
        )

    def act(self, state):
        """Return negative power for consumption."""
        return -abs(self.demand)  # Always negative for consumption