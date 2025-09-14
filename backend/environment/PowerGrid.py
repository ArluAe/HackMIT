from .Node import Node
from .Branch import Branch
from collections import defaultdict
import numpy as np

class PowerGrid:
    def __init__(self, ppc, dt, target_hz=60, node_configs=None):
        self.size = len(ppc["bus"])
        self.branches = defaultdict(lambda : list())
        self.nodes = [None] * self.size
        self.dt = dt # minutes
        self.target_hz = target_hz
        self.grid_frequency = target_hz
        self.temperature = 25 # Celsius
        self.node_configs = node_configs or {}
        
        for node in ppc["bus"]:
            index = int(node[0]) - 1
            inertia = node[9]
            friction = node[10]

            # Get node configuration if provided
            node_config = self.node_configs.get(index, {})
            agent_type = node_config.get('agent_type', 'producer')
            agent_params = node_config.get('agent_params', {})

            new_node = Node(index, inertia, friction, dt, target_hz, agent_type, agent_params)
            self.nodes[index] = new_node

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
    
    def time_step(self, temperature, time_of_day, actions=None):
        state = dict()
        state["frequency"] = self.grid_frequency
        state["temperature"] = temperature
        state["avg_price"] = 0 # implement
        state["time_of_day"] = time_of_day

        # Run time step process on all nodes
        for i, node in enumerate(self.nodes):
            action = actions[i] if actions is not None and i < len(actions) else None
            node.time_step(state, action)

        # Update grid frequency based on power balance
        self._update_frequency()

        return state

    def _update_frequency(self):
        """Update grid frequency based on power imbalance"""
        total_production = 0
        total_consumption = 0

        for node in self.nodes:
            if node.agent_type == 'producer':
                total_production += getattr(node.agent, 'current_production', 0)
            elif node.agent_type == 'consumer':
                total_consumption += getattr(node.agent, 'current_consumption', 0)
            elif node.agent_type == 'business':
                total_consumption += max(0, getattr(node.agent, 'net_consumption', 0))
                total_production += getattr(node.agent, 'current_production', 0)

        # Simple frequency dynamics based on imbalance
        imbalance = total_production - total_consumption
        frequency_change = imbalance * 0.001  # Scaling factor
        self.grid_frequency += frequency_change

        # Damping to stabilize around target
        self.grid_frequency = 0.95 * self.grid_frequency + 0.05 * self.target_hz

    def get_agents(self):
        """Get all agents from nodes"""
        agents = {}
        for node in self.nodes:
            if node.agent is not None:
                agents[node.agent.agent_id] = node.agent
        return agents

    def get_node_by_agent_id(self, agent_id):
        """Get node by agent ID"""
        for node in self.nodes:
            if node.agent and node.agent.agent_id == agent_id:
                return node
        return None
        
        # Recalculate the grid frequency
        pertubation = 0
        for node in self.nodes:
            pertubation += (node.inertia * node.get_transmission())
        
        pertubation = pertubation / sum([node.inertia for node in self.nodes])

        self.grid_frequency += pertubation * self.dt


    def simulate_day(self):
        time_values = np.linspace(0, 1440 - int(self.dt), num=int(1440/self.dt))
        warming_factor = 10 * np.random.rand() + 5
        temps = 20 + warming_factor * -np.cos(time_values / (1440 - int(self.dt)) * 2 * np.pi - 180)
        for i in range(len(temps)):
            self.time_step(temps[i], time_values[i])



