from backend.agents import ConsumerAgent
from backend.agents.ProducerAgent import ProducerAgent
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
        self.total_inertia = 0
        
        for index in range(self.size):
            def create_agent():
                if index in ppc["gen"][:,0]:
                    return ProducerAgent(agent_id=index, max_output=ppc["bus"][index, 1])
                else:
                    return ConsumerAgent(agent_id=index, energy_consumption=ppc["bus"][index, 1])
            node = ppc["bus"][index]
            inertia = np.random.rand() # fix
            friction = np.random.rand() # fix
            new_node = Node(create_agent(), index, inertia, friction, dt, target_hz)
            self.nodes[index] = new_node
            self.total_inertia += inertia

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
        
        # Calculate the pertubation of the grid frequency
        pertubation = 0
        for node in self.nodes:
            pertubation += (node.inertia * node.get_transmission())

        print(f"Pertubation: {pertubation}")


    def simulate_day(self):
        time_values = np.linspace(0, 1440 - int(self.dt), num=int(1440/self.dt))
        warming_factor = 10 * np.random.rand() + 5
        temps = 20 + warming_factor * -np.cos(time_values / (1440 - int(self.dt)) * 2 * np.pi - 180)
        for i in range(len(temps)):
            self.time_step(temps[i], time_values[i])

    def gen_dict(self):
        ret = dict()
        ret["nodes"] = [node.gen_dict() for node in self.nodes]
        return ret






