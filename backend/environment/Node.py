import numpy as np
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.ProducerAgent import ProducerAgent
from agents.ConsumerAgent import ConsumerAgent
from agents.BusinessAgent import BusinessAgent
from agents.BatteryAgent import BatteryAgent

class Node:
    def __init__(self, index, inertia, friction, dt, target_hz, agent_type='producer', agent_params=None):
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

        # Initialize agent based on type
        self.agent_type = agent_type
        self.agent = self._create_agent(agent_type, agent_params or {})

        # PPO agent (will be set during training)
        self.ppo_agent = None

    def _create_agent(self, agent_type, params):
        """Create agent based on type"""
        if agent_type == 'producer':
            return ProducerAgent(
                agent_id=f"node_{self.index}_producer",
                production_capacity=params.get('production_capacity', 100.0),
                ramp_rate=params.get('ramp_rate', 10.0)
            )
        elif agent_type == 'consumer':
            return ConsumerAgent(
                agent_id=f"node_{self.index}_consumer",
                consumption_range=params.get('consumption_range', (50, 150)),
                flexibility=params.get('flexibility', 0.2)
            )
        elif agent_type == 'business':
            return BusinessAgent(
                agent_id=f"node_{self.index}_business",
                base_consumption=params.get('base_consumption', 100),
                production_capacity=params.get('production_capacity', 50)
            )
        elif agent_type == 'battery':
            return BatteryAgent(
                agent_id=f"node_{self.index}_battery",
                capacity=params.get('capacity', 200),
                max_charge_rate=params.get('max_charge_rate', 50),
                max_discharge_rate=params.get('max_discharge_rate', 50)
            )
        else:
            # Default to producer
            return ProducerAgent(
                agent_id=f"node_{self.index}_producer",
                max_output=100.0
            )

    def add_connections(self, connections):
        self.connections = connections

    def time_step(self, state, action=None):
        """Execute time step with optional PPO action"""
        if self.ppo_agent is not None and action is not None:
            # Use PPO action if available
            d2offset = action * self.agent.startup_rate if hasattr(self.agent, 'startup_rate') else action
        else:
            # Use default agent action
            d2offset = self.agent.act(state)

        self.doffset = self.doffset + d2offset * self.dt
        self.offset = self.offset + self.doffset * self.dt

        return d2offset

    def get_observation(self, state):
        """Get observation for this node's agent"""
        return self.agent.get_observation(state) if hasattr(self.agent, 'get_observation') else np.zeros(7)

    def calculate_reward(self, state, action):
        """Calculate reward for this node's agent"""
        if hasattr(self.agent, 'compute_reward'):
            return self.agent.compute_reward(state, [])
        return 0.0

    def set_ppo_agent(self, ppo_agent):
        """Attach a PPO agent for training"""
        self.ppo_agent = ppo_agent
    
    def get_transmission(self):
        total_transmission = 0
        for branch in self.connections:
            if branch.node0 == self:
                total_transmission += branch.get_transmission() # Positive if flowing out
            else:
                total_transmission -= branch.get_transmission() # Positive if flowing in
        return total_transmission



