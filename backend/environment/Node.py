import numpy as np
from agents.ProducerAgent import ProducerAgent
from agents.ConsumerAgent import ConsumerAgent
from agents.BatteryAgent import BatteryAgent
from agents.BusinessAgent import BusinessAgent

class Node:
    def __init__(self, index, node_type, inertia, friction, dt, target_hz, load_demand=0):
        # Parameters
        self.index = index
        self.node_type = node_type
        self.inertia = inertia
        self.friction = friction
        self.connections = []
        self.dt = dt

        # State Variables
        self.grid_frequency = target_hz
        self.offset = 0
        self.doffset = 0

        # Create appropriate agent based on node type
        if node_type == 1:  # Load bus - Consumer
            self.agent = ConsumerAgent(agent_id=index, energy_consumption=max(50.0, load_demand))
        elif node_type == 2:  # Generator bus - Producer
            self.agent = ProducerAgent(agent_id=index, max_output=100.0)
        elif node_type == 3:  # Business Agent
            self.agent = BusinessAgent(agent_id=index, baseline_consumption=max(50.0, load_demand))
        elif node_type == 4:  # Battery Agent
            self.agent = BatteryAgent(agent_id=index, capacity=100.0, charge_rate=50.0)
        else:  # Default to producer (Slack bus - High capacity producer)
            self.agent = ProducerAgent(agent_id=index, max_output=300.0)

    def add_connections(self, connections):
        self.connections = connections

    def time_step(self, state):
        d2offset = self.agent.act(state)
        self.doffset = self.doffset + d2offset * self.dt
        self.offset = self.offset + self.doffset * self.dt
    
    def get_transmission(self):
        total_transmission = 0
        for branch in self.connections:
            if branch.node0 == self:
                total_transmission += branch.get_transmission() # Positive if flowing out
            else:
                total_transmission -= branch.get_transmission() # Positive if flowing in
        return total_transmission



