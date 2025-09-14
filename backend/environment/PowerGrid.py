from agents import ConsumerAgent, ProducerAgent
from .Node import Node
from .Branch import Branch
from collections import defaultdict
import torch
import multiprocessing as mp
import numpy as np
import time


class PowerGrid:
    def __init__(self, network_dict, dt, target_hz=60):
        self.dt = dt # minutes
        self.target_hz = target_hz
        self.total_inertia = 0
        self.pertubation = 0  # Initialize pertubation
        
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
            capacity = conn_data.get("maxPower", 100)  # Use maxPower as capacity
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
            return ProducerAgent(node_id, int(1440/self.dt), 4)
        elif node_type == "consumer":
            return ConsumerAgent(node_id, int(1440/self.dt), 4)
        # elif node_type == "storage":
            # capacity = power
            # charge_rate = settings.get("charge_rate", capacity * 0.5)
            # soc = settings.get("soc", 0.5)
            # return BatteryAgent(agent_id=node_id, capacity=capacity, charge_rate=charge_rate, soc=soc)
        elif node_type == "grid":
            # Grid connection can be treated as a special consumer
            return ConsumerAgent(node_id, int(1440/self.dt), 4)
        else:
            # Default to consumer
            return ConsumerAgent(node_id, int(1440/self.dt), 4)

    def get_node(self, node_id):
        """Get node by its ID"""
        return self.nodes.get(node_id)
    

    def time_step(self, temperature, time_of_day):

        state = dict()

        state["pertubation"] = self.pertubation
        state["avg_cost"] = 0
        state["time_of_day"] = time_of_day / 1440
        state["temperature"] = temperature

        state = torch.tensor(list(state.values()), dtype=torch.float32)

        # Run time step process on all nodes PARALLELIZATION HERE
        for node in self.nodes.values():
            node.time_step(state)
        
        # Calculate the pertubation of the grid frequency
        self.pertubation = 0
        for node in self.nodes.values():
            self.pertubation += (node.inertia * node.get_transmission())

        # print(f"Pertubation: {self.pertubation}")

    def simulate_day(self):
        time_values = np.linspace(0, 1440 - int(self.dt), num=int(1440/self.dt))
        warming_factor = 10 * np.random.rand() + 5
        temps = 20 + warming_factor * -np.cos(time_values / (1440 - int(self.dt)) * 2 * np.pi - 180)
        for i in range(len(temps)):
            self.time_step(temps[i], time_values[i])



        for node in self.nodes.values():
            node.update()


        


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


    def remove_connection(self, connection_id):
        """Remove a connection from the network by ID"""
        # Find the connection in network_dict
        connection = None
        for conn in self.network_dict["simulation"]["connections"]:
            if conn["id"] == connection_id:
                connection = conn
                break
        
        if connection is None:
            return False
        
        from_id = connection["from"]
        to_id = connection["to"]
        
        # Find and remove the branch
        branch_to_remove = None
        for branch in self.branches[from_id]:
            if (branch.node0.node_id == from_id and branch.node1.node_id == to_id) or \
               (branch.node0.node_id == to_id and branch.node1.node_id == from_id):
                branch_to_remove = branch
                break
        
        if branch_to_remove:
            self.branches[from_id].remove(branch_to_remove)
            self.branches[to_id].remove(branch_to_remove)
            
            # Update node connections
            self.nodes[from_id].add_connections(self.branches[from_id])
            self.nodes[to_id].add_connections(self.branches[to_id])
        
        # Remove from network_dict
        self.network_dict["simulation"]["connections"] = [
            conn for conn in self.network_dict["simulation"]["connections"] 
            if conn["id"] != connection_id
        ]
        
        return True