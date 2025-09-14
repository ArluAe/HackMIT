from .Node import Node
from .Branch import Branch
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
        self.total_inerta = 0
        
        for index in range(self.size):
            node = ppc["bus"][index]
            inertia = 1 # fix
            friction = 1 # fix
            new_node = Node(index, inertia, friction, dt, target_hz)
            self.nodes[index] = new_node
            self.total_inerta += inertia

        for branch in ppc["branch"]:
            node0 = int(branch[0]) - 1
            node1 = int(branch[1]) - 1
            capacity =  branch[5]
            transmission_factor = 1 # Fix
            new_branch = Branch(self.nodes[node0], self.nodes[node1], capacity, transmission_factor)

            self.branches[node0].append(new_branch)
            self.branches[node1].append(new_branch)

        for index, node in enumerate(self.nodes):
            node.add_connections(self.branches[index])

    def get_node(self, index):
        return self.nodes[index]
    
    def time_step(self, temperature, time_of_day):
        state = dict()
        state["frequency"] = self.grid_frequency
        state["temperature"] = temperature
        state["avg_price"] = 0 # implement
        state["time_of_day"] = time_of_day

        # Run time step process on all nodes PARALLELIZATION HERE
        for node in self.nodes:
            node.time_step(state)
        
        # Recalculate the grid frequency
        pertubation = 0
        for node in self.nodes:
            pertubation += (node.inertia * node.get_transmission())
        
        pertubation = pertubation / self.total_inerta

        self.grid_frequency += pertubation * self.dt

        print(f"Grid Frequency: {self.grid_frequency}")


    def simulate_day(self):
        time_values = np.linspace(0, 1440 - int(self.dt), num=int(1440/self.dt))
        warming_factor = 10 * np.random.rand() + 5
        temps = 20 + warming_factor * -np.cos(time_values / (1440 - int(self.dt)) * 2 * np.pi - 180)
        for i in range(len(temps)):
            self.time_step(temps[i], time_values[i])



