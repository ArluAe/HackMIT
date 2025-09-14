from environment.Node import Node
from environment.Branch import Branch
from collections import defaultdict

import numpy as np

class PowerGrid:
    def __init__(self, ppc, dt, target_hz=60):
        self.size = len(ppc["bus"])
        self.branches = defaultdict(lambda : list())
        self.nodes = [None] * self.size
        self.dt = dt # minutes
        self.target_hz = target_hz
        self.grid_frequency = target_hz
        self.temperature = 25 # Celsius
        
        for node in ppc["bus"]:
            index = int(node[0]) - 1
            node_type = int(node[1])  # Bus type (1=load, 2=generator, 3=slack)
            load_demand = node[2]     # Active power demand (Pd)
            inertia = node[13]        # Index 13 for inertia
            friction = node[14]       # Index 14 for friction
            new_node = Node(index, node_type, inertia, friction, dt, target_hz, load_demand)
            self.nodes[index] = new_node

        for branch in ppc["branch"]:
            node0 = int(branch[0]) - 1
            node1 = int(branch[1]) - 1
            capacity =  branch[5]
            transmission_factor = 1.0 / branch[3] if branch[3] != 0 else 1.0  # Use reactance x for transmission
            new_branch = Branch(self.nodes[node0], self.nodes[node1], capacity, transmission_factor)

            self.branches[node0].append(new_branch)
            self.branches[node1].append(new_branch)

        for index, node in enumerate(self.nodes):
            node.add_connections(self.branches[index])

    def get_node(self, index):
        return self.nodes[index]
    
    def calculate_electricity_price(self):
        """Calculate electricity price based on supply and demand"""
        total_supply = 0
        total_demand = 0

        for node in self.nodes:
            agent = node.agent
            if agent.delta_e > 0:  # Producing/discharging
                total_supply += agent.delta_e
            else:  # Consuming/charging
                total_demand += abs(agent.delta_e)

        # Price model: base price modified by supply/demand ratio
        base_price = 50.0  # $/MWh
        if total_supply > 0:
            supply_demand_ratio = total_demand / (total_supply + 1e-6)
            # Price increases with demand, decreases with supply
            price = base_price * (0.5 + supply_demand_ratio)
            price = min(200, max(10, price))  # Cap between $10 and $200/MWh
        else:
            price = 150.0  # High price when no supply

        return price

    def time_step(self, temperature, time_of_day):
        # Calculate current electricity price before actions
        current_price = self.calculate_electricity_price()

        state = dict()
        state["frequency"] = self.grid_frequency
        state["avg_cost"] = current_price
        state["time_of_day"] = time_of_day

        # Run time step process on all nodes
        for node in self.nodes:
            node.time_step(state)

        # Recalculate the grid frequency
        pertubation = 0
        for node in self.nodes:
            pertubation += (node.inertia * node.get_transmission())

        pertubation = pertubation / sum([node.inertia for node in self.nodes])

        self.grid_frequency += pertubation * self.dt

        # Calculate new price after actions
        new_price = self.calculate_electricity_price()

        # Compute and update rewards for all agents after state update
        updated_state = dict()
        updated_state["frequency"] = self.grid_frequency
        updated_state["avg_cost"] = new_price
        updated_state["time_of_day"] = time_of_day
        updated_state["prev_cost"] = current_price  # Pass previous price for comparison

        all_agents = [node.agent for node in self.nodes]
        for node in self.nodes:
            reward = node.agent.compute_reward(updated_state, all_agents)
            node.agent.update_reward(reward)


    def simulate_day(self):
        time_values = np.linspace(0, 1440 - int(self.dt), num=int(1440/self.dt))
        warming_factor = 10 * np.random.rand() + 5
        temps = 20 + warming_factor * -np.cos(time_values / (1440 - int(self.dt)) * 2 * np.pi - 180)
        for i in range(len(temps)):
            self.time_step(temps[i], time_values[i])



