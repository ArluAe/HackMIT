class Consumer(BaseAgent):
    def __init__(self, agent_id, baseline_demand, cost_function=None):
        super().__init__(agent_id, cost_function)
        self.baseline_demand = baseline_demand

    def act(self, state):
        # Rule: consume baseline demand
        self.delta_e = -self.baseline_demand
        return self.delta_e

    def compute_reward(self, state):
        consumption_cost = self.cost_function(abs(self.delta_e))
        freq_penalty = abs(state.get("frequency", 60) - 60)
        weather_penalty = state.get("weather", 0)  # penalize if comfort needs not met
        time_penalty = state.get("time_penalty", 0)
        return -consumption_cost - freq_penalty - weather_penalty - time_penalty
