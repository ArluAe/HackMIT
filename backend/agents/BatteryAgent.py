class Battery(BaseAgent):
    def __init__(self, agent_id, capacity, charge_rate, efficiency=0.9, soc=0.5, cost_function=None):
        super().__init__(agent_id, cost_function)
        self.capacity = capacity      # total capacity (kWh)
        self.charge_rate = charge_rate
        self.efficiency = efficiency
        self.soc = soc                # State of Charge [0, 1]
    

    
    def act(self, state):
        # Rule: charge if overcapacity, discharge if under
        if state.get("overcapacity", 0) > 0:
            # charge
            charge_amount = min(self.charge_rate, (1 - self.soc) * self.capacity)
            self.delta_e = charge_amount
            self.soc += (charge_amount * self.efficiency) / self.capacity
        else:
            # discharge
            discharge_amount = min(self.charge_rate, self.soc * self.capacity)
            self.delta_e = -discharge_amount
            self.soc -= discharge_amount / self.capacity
        return self.delta_e

    def compute_reward(self, state):
        operation_cost = self.cost_function(abs(self.delta_e))
        storage_losses = (1 - self.efficiency) * abs(self.delta_e)
        soc_penalty = max(0, self.soc - 1) + max(0, -self.soc)
        return -operation_cost - storage_losses - soc_penalty
