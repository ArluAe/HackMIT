from agents import ConsumerAgent, ProducerAgent, BusinessAgent, BatteryAgent
from .Node import Node
from .Branch import Branch
from collections import defaultdict

import numpy as np

class PowerGrid:
    def __init__(self, network_dict, dt, target_hz=60):
        self.dt = dt # minutes
        self.target_hz = target_hz
        self.total_inertia = 0
        self.grid_frequency = target_hz  # Initialize grid frequency
        
        # Store the network dictionary as instance variable
        self.network_dict = network_dict

        # Process nodes from JSON format
        nodes = network_dict["simulation"]["nodes"]
        self.nodes = {}  # Dictionary with node_id as key
        self.branches = defaultdict(lambda : list())  # Dictionary with node_id as key
        
        # Create nodes from JSON format
        for node_data in nodes:
            # Extract settings from the node data
            settings = node_data.get("settings", {})
            node_id = node_data.get("id")
            
            # Create appropriate agent based on node type
            agent = self._create_agent(settings, node_id)
            
            # Extract node properties from settings
            inertia = settings.get("inertia", np.random.rand())
            friction = settings.get("friction", np.random.rand())
            
            # Create the node
            new_node = Node(agent, node_id, inertia, friction, dt, target_hz)
            self.nodes[node_id] = new_node
            self.total_inertia += inertia

        # Process connections from JSON format
        connections = network_dict["simulation"].get("connections", [])
        for conn_data in connections:
            from_id = conn_data["from"]
            to_id = conn_data["to"]
            capacity = conn_data.get("power", 100)  # Use power as capacity
            transmission_factor = conn_data.get("transmission_factor", 1.0)
            
            # Check if both nodes exist
            if from_id in self.nodes and to_id in self.nodes:
                new_branch = Branch(self.nodes[from_id], self.nodes[to_id], capacity, transmission_factor)
                self.branches[from_id].append(new_branch)
                self.branches[to_id].append(new_branch)

        # Add connections to each node
        for node_id, node in self.nodes.items():
            node.add_connections(self.branches[node_id])

    def _create_agent(self, settings, node_id):
        """Create appropriate agent based on node type from settings"""
        node_type = settings.get("type", "consumer")
        power = settings.get("power", 50.0)
        
        if node_type in ["generator", "solar-generator", "natural-gas-generator", "wind-generator"]:
            return ProducerAgent(agent_id=node_id, max_output=power)
        elif node_type == "consumer":
            return ConsumerAgent(agent_id=node_id, energy_consumption=power)
        elif node_type == "storage":
            capacity = power
            charge_rate = settings.get("charge_rate", capacity * 0.5)
            soc = settings.get("soc", 0.5)
            return BatteryAgent(agent_id=node_id, capacity=capacity, charge_rate=charge_rate, soc=soc)
        elif node_type == "grid":
            # Grid connection can be treated as a special consumer
            return ConsumerAgent(agent_id=node_id, energy_consumption=power)
        else:
            # Default to consumer
            return ConsumerAgent(agent_id=node_id, energy_consumption=power)

    def get_node(self, node_id):
        """Get node by its ID"""
        return self.nodes.get(node_id)
    
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

        # Run time step process on all nodes PARALLELIZATION HERE
        for node in self.nodes.values():
            node.time_step(state)
        
        # Calculate the pertubation of the grid frequency
        pertubation = 0
        for node in self.nodes.values():
            pertubation += (node.inertia * node.get_transmission())

        print(f"Pertubation: {pertubation}")

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

    def gen_dict(self):
        ret = dict()
        ret["nodes"] = [node.gen_dict() for node in self.nodes.values()]
        return ret

    def get_network_state(self):
        """Return the complete network state as JSON"""
        return self.network_dict

    def get_node_state(self, node_id):
        """Return the state of a specific node by ID"""
        for node in self.network_dict["simulation"]["nodes"]:
            if node["id"] == node_id:
                return node
        return None

    def get_connection_state(self, connection_id):
        """Return the state of a specific connection by ID"""
        for conn in self.network_dict["simulation"]["connections"]:
            if conn["id"] == connection_id:
                return conn
        return None

    def add_node(self, node_json):
        """Add a node to the network based on JSON representation"""
        node_id = node_json.get("id")
        if node_id is None:
            return False
        
        # Extract settings
        settings = node_json.get("settings", {})
        
        # Create agent
        agent = self._create_agent(settings, node_id)
        
        # Extract properties
        inertia = settings.get("inertia", np.random.rand())
        friction = settings.get("friction", np.random.rand())
        
        # Create node
        new_node = Node(agent, node_id, inertia, friction, self.dt, self.target_hz)
        self.nodes[node_id] = new_node
        self.total_inertia += inertia
        
        # Initialize empty connections for this node
        self.branches[node_id] = []
        new_node.add_connections([])
        
        # Add to network_dict
        self.network_dict["simulation"]["nodes"].append(node_json)
        
        return True

    def add_connection(self, connection_json):
        """Add a connection to the network based on JSON representation"""
        from_id = connection_json.get("from")
        to_id = connection_json.get("to")
        
        if from_id is None or to_id is None:
            return False
        
        # Check if both nodes exist
        if from_id not in self.nodes or to_id not in self.nodes:
            return False
        
        # Extract connection properties
        capacity = connection_json.get("power", 100)
        transmission_factor = connection_json.get("transmission_factor", 1.0)
        
        # Create branch
        new_branch = Branch(self.nodes[from_id], self.nodes[to_id], capacity, transmission_factor)
        self.branches[from_id].append(new_branch)
        self.branches[to_id].append(new_branch)
        
        # Update node connections
        self.nodes[from_id].add_connections(self.branches[from_id])
        self.nodes[to_id].add_connections(self.branches[to_id])
        
        # Add to network_dict
        self.network_dict["simulation"]["connections"].append(connection_json)
        
        return True

    def remove_node(self, node_id):
        """Remove a node from the network by ID"""
        if node_id not in self.nodes:
            return False
        
        # Remove all connections involving this node
        connections_to_remove = []
        for conn in self.network_dict["simulation"]["connections"]:
            if conn["from"] == node_id or conn["to"] == node_id:
                connections_to_remove.append(conn["id"])
        
        for conn_id in connections_to_remove:
            self.remove_connection(conn_id)
        
        # Remove node
        node = self.nodes[node_id]
        self.total_inertia -= node.inertia
        del self.nodes[node_id]
        del self.branches[node_id]
        
        # Remove from network_dict
        self.network_dict["simulation"]["nodes"] = [
            node for node in self.network_dict["simulation"]["nodes"] 
            if node["id"] != node_id
        ]
        
        return True
