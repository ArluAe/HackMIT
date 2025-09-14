import numpy as np
from agents import BaseAgent, ProducerAgent, ConsumerAgent
from agents import BaseAgent
import torch

class Node:
    def __init__(self, agent, node_id, inertia, friction, dt, target_hz):
        # Parameters
        self.node_id = node_id  # Use node_id as the primary identifier
        self.inertia = inertia
        self.friction = friction
        self.connections = []
        self.dt = dt

        # State Variables
        self.grid_frequency = target_hz
        self.offset = 0
        self.doffset = 0
        self.d2offset = 0
        self.power = 0

        # Agent
        self.agent = agent

    def add_connections(self, connections):
        self.connections = connections

    def time_step(self, state):
        self.power = self.agent.act(state)
        # print(f"Power: {self.power}")
        self.d2offset = self.power - self.friction * self.doffset + self.get_transmission()
        # print(f"D2Offset: {self.d2offset.shape}")
        self.doffset += self.d2offset * self.dt
        self.offset += self.doffset * self.dt
        self.offset = self.offset % (2 * np.pi)

    def update(self):
        self.agent.update()
        print(f"offset: {self.offset}")
    
    def get_transmission(self):
        total_transmission = 0
        for branch in self.connections:
            if branch.node0 == self:
                total_transmission += branch.get_transmission() # Positive if flowing out
            else:
                total_transmission -= branch.get_transmission() # Positive if flowing in
        return total_transmission

    
    def gen_dict(self):
        return {
            "node_id": self.node_id,
            "inertia": self.inertia,
            "friction": self.friction,
            "power": self.power,
        }



