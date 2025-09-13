class Producer(BaseAgent):
    def __init__(self, agent_id, max_output, cost_function=None):
        super().__init__(agent_id, cost_function)
        self.max_output = max_output

    def act(self, state):
        # Rule: produce as much as possible if demand is high, otherwise reduce
        demand = state.get("demand", self.max_output)
        self.delta_e = min(demand, self.max_output)
        return self.delta_e

    def compute_reward(self, state):
        production_cost = self.cost_function(self.delta_e)
        freq_penalty = abs(state.get("frequency", 60) - 60)
        over_penalty = state.get("overcapacity", 0)
        return -production_cost - freq_penalty - over_penalty
