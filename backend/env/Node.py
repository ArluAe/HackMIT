# import Agent # Fix
import numpy as np

class Node:
    def __init__(self, index, inertia, friction, dt, target_hz):
        # Parameters
        self.index = index
        self.inertia = inertia
        self.friction = friction
        self.connections = []
        self.dt = dt
        
        # State Variables
        self.grid_frequency = target_hz
        self.offset = 0
        self.doffset = 0

        # Agent
        # self.agent = Agent() # Fix

    def add_connections(self, connections):
        self.connections = connections

    def time_step(self):
        self.doffset = self.doffset + self.d2offset * self.dt
        self.offset = self.offset + self.doffset * self.dt
    
    def get_transmission(self):
        total_transmission = 0
        for branch in self.connections:
            if branch.node0 == self:
                total_transmission += branch.get_transmission() # Positive if flowing out
            else:
                total_transmission -= branch.get_transmission() # Positive if flowing in
        return total_transmission



