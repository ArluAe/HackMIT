from Node import Node
from Branch import Branch
from collections import defaultdict

class PowerGrid:
    def __init__(self, ppc, dt, target_hz=60):
        self.size = len(ppc["bus"])
        self.branches = defaultdict(lambda : list())
        self.nodes = [None] * self.size
        self.dt = dt
        self.target_hz = target_hz
        self.grid_frequency = target_hz
        self.temperature = 25 # Celsius
        
        for node in ppc["bus"]:
            index = int(node[0]) - 1
            inertia = node[9]
            friction = node[10]
            new_node = Node(index, inertia, friction, dt, target_hz)
            self.nodes[index] = new_node

        for branch in ppc["branch"]:
            node0 = int(branch[0]) - 1
            node1 = int(branch[1]) - 1
            capacity =  branch[5]
            transmission_factor = 1 # Fix
            new_branch = Branch(node0, node1, capacity, transmission_factor)

            self.branches[node0].append(new_branch)
            self.branches[node1].append(new_branch)

        for index, node in enumerate(self.nodes):
            node.add_connections(self.branches[index])

    def get_node(self, index):
        return self.nodes[index]
    
    def time_step(self):
        for node in self.nodes:
            node.time_step()
        
        pertubation = 0
        for node in self.nodes:
            pertubation += (node.inertia * node.get_transmission())
        
        pertubation = pertubation / sum([node.inertia for node in self.nodes])

        self.grid_frequency -= pertubation * self.dt

    def simulate_day(self):
        
        for node in self.nodes:
            node.time_step()

        self.time_step()

        state = dict()
        state["frequency"] = self.grid_frequency
        state["temperature"] = self.temperature
        state["avg_price"] = 0 # implement
        state["time_of_day"] = 0 # implement

        for node in self.nodes:
            node.d2offset = node.agent.act(state)
