from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from environment.PowerGrid import PowerGrid
from cases import case14
from stochastic_grid_simulation import GridConfiguration, run_simulation, SimulationAnalyzer
import json
import os
import uuid
import threading
import time

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication
socketio = SocketIO(app, cors_allowed_origins="*")  # WebSocket for real-time communication

# Session management
capacity = 100
app.sessions = {}  # Dictionary to store sessions by session_id
next_session_id = 0

# Stochastic simulation management
app.stochastic_simulations = {}  # Store running simulations
app.simulation_results = {}  # Store completed simulation results

# --- Helper Functions ---

def convert_react_flow_to_backend(react_flow_data):
    """
    Convert React Flow graph format to backend simulation format.

    Args:
        react_flow_data: Dictionary containing 'nodes' and 'edges' arrays from React Flow

    Returns:
        Dictionary in backend format with 'simulation' containing 'nodes' and 'connections'
    """
    backend_nodes = []
    backend_connections = []

    # Convert React Flow nodes to backend nodes
    for node in react_flow_data.get('nodes', []):
        # Extract node data from React Flow format
        node_data = node.get('data', {})
        node_type = node_data.get('type', 'generator')

        # Map React Flow node types to backend types
        backend_type_map = {
            'generator': 'solar-generator',
            'consumer': 'consumer',
            'storage': 'battery',
            'grid': 'grid-connection'
        }

        backend_node = {
            "id": node.get('id'),
            "type": backend_type_map.get(node_type, 'solar-generator'),
            "settings": {
                "power": node_data.get('power', 100),
                "type": backend_type_map.get(node_type, 'solar-generator'),
                "inertia": 1.0,
                "friction": 0.1
            },
            "position": {
                "x": node.get('position', {}).get('x', 0),
                "y": node.get('position', {}).get('y', 0)
            }
        }
        backend_nodes.append(backend_node)

    # Convert React Flow edges to backend connections
    for edge in react_flow_data.get('edges', []):
        backend_connection = {
            "id": edge.get('id'),
            "from": edge.get('source'),
            "to": edge.get('target'),
            "settings": {
                "resistance": 0.1,
                "capacity": 1000
            }
        }
        backend_connections.append(backend_connection)

    return {
        "simulation": {
            "nodes": backend_nodes,
            "connections": backend_connections
        }
    }

def convert_backend_to_react_flow(backend_data):
    """
    Convert backend simulation format to React Flow graph format.

    Args:
        backend_data: Dictionary with 'simulation' containing 'nodes' and 'connections'

    Returns:
        Dictionary containing 'nodes' and 'edges' arrays for React Flow
    """
    react_flow_nodes = []
    react_flow_edges = []

    simulation_data = backend_data.get('simulation', {})

    # Convert backend nodes to React Flow nodes
    for node in simulation_data.get('nodes', []):
        # Map backend types to React Flow types
        type_map = {
            'solar-generator': 'generator',
            'wind-generator': 'generator',
            'thermal-generator': 'generator',
            'consumer': 'consumer',
            'business': 'consumer',
            'battery': 'storage',
            'grid-connection': 'grid'
        }

        position = node.get('position', {})
        settings = node.get('settings', {})

        react_flow_node = {
            "id": node.get('id'),
            "type": "energyNode",
            "position": {
                "x": position.get('x', 400 + len(react_flow_nodes) * 150),
                "y": position.get('y', 300 + (len(react_flow_nodes) % 3) * 150)
            },
            "data": {
                "id": node.get('id'),
                "type": type_map.get(node.get('type', 'generator'), 'generator'),
                "name": f"{type_map.get(node.get('type', 'generator'), 'generator').title()} {node.get('id')}",
                "power": settings.get('power', 100),
                "status": "active",
                "x": position.get('x', 400 + len(react_flow_nodes) * 150),
                "y": position.get('y', 300 + (len(react_flow_nodes) % 3) * 150)
            }
        }
        react_flow_nodes.append(react_flow_node)

    # Convert backend connections to React Flow edges
    for connection in simulation_data.get('connections', []):
        react_flow_edge = {
            "id": connection.get('id'),
            "source": connection.get('from'),
            "target": connection.get('to'),
            "type": "smoothstep",
            "animated": True,
            "style": {
                "stroke": "#10b981",
                "strokeWidth": 3
            }
        }
        react_flow_edges.append(react_flow_edge)

    return {
        "nodes": react_flow_nodes,
        "edges": react_flow_edges
    }

def get_session(session_id):
    """Get session by ID, create empty grid if not found"""
    if session_id not in app.sessions:
        # Create an empty grid for new session
        empty_network = {
            "simulation": {
                "nodes": [],
                "connections": []
            }
        }
        app.sessions[session_id] = PowerGrid(empty_network, 0.01)
    return app.sessions.get(session_id)

def validate_session(session_id):
    """Validate session exists, return error response if not"""
    # Since get_session() now creates sessions automatically, 
    # we only need to check if session_id is valid
    if not session_id or session_id.strip() == "":
        return jsonify({"error": "Invalid session ID"}), 400
    return None

# --- Endpoints ---

@app.route('/session', methods=['POST'])
def create_session():
    """
    Create a new simulation session.
    Body:
        JSON: containing session parameters (optional)
    Returns:
        JSON: session ID and initial state
    """
    global next_session_id
    if len(app.sessions) >= capacity:
        return jsonify({"error": "Maximum session capacity reached."}), 400

    # Generate unique session ID
    session_id = str(uuid.uuid4())
    
    try:
        # Load default case1.json for new session
        with open('cases/case1.json', 'r') as f:
            network_dict = json.load(f)
        
        # Initialize session with PowerGrid
        app.sessions[session_id] = PowerGrid(network_dict, 0.01)
        
        return jsonify({
            "session_id": session_id,
            "message": "Session created successfully",
            "initial_state": app.sessions[session_id].get_network_state()
        }), 201
        
    except Exception as e:
        return jsonify({"error": f"Failed to create session: {str(e)}"}), 500

@app.route('/session/<session_id>', methods=['DELETE'])
def delete_session(session_id):
    """
    Delete a simulation session.
    Args:
        session_id (str): ID of the session to delete
    Returns:
        JSON: confirmation message
    """
    error_response = validate_session(session_id)
    if error_response:
        return error_response
    
    del app.sessions[session_id]
    return jsonify({"message": f"Session {session_id} deleted successfully"}), 200

@app.route('/upload', methods=['POST'])
def upload_file():
    """
    Upload a JSON file and create a new PowerGrid session.
    Body:
        Form data with 'file' field containing JSON file
    Returns:
        JSON: session ID and network state
    """
    global next_session_id
    if len(app.sessions) >= capacity:
        return jsonify({"error": "Maximum session capacity reached."}), 400
    
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    if not file.filename.endswith('.json'):
        return jsonify({"error": "File must be a JSON file"}), 400
    
    try:
        # Read and parse JSON file
        file_content = file.read().decode('utf-8')
        network_dict = json.loads(file_content)
        
        # Validate JSON structure
        if 'simulation' not in network_dict:
            return jsonify({"error": "Invalid JSON format: missing 'simulation' key"}), 400
        
        if 'nodes' not in network_dict['simulation']:
            return jsonify({"error": "Invalid JSON format: missing 'nodes' key"}), 400
        
        # Generate unique session ID
        session_id = str(uuid.uuid4())
        
        # Create PowerGrid from uploaded JSON
        app.sessions[session_id] = PowerGrid(network_dict, 0.01)
        
        return jsonify({
            "session_id": session_id,
            "message": "File uploaded and session created successfully",
            "network_state": app.sessions[session_id].get_network_state()
        }), 201
        
    except json.JSONDecodeError:
        return jsonify({"error": "Invalid JSON format"}), 400
    except Exception as e:
        return jsonify({"error": f"Failed to process file: {str(e)}"}), 500

@app.route('/network/state/<session_id>', methods=['GET'])
def get_network_state(session_id):
    """
    Fetch the state of the entire network for a specific session.
    Args:
        session_id (str): ID of the session
    Returns:
        JSON: representation of the network state
    """
    error_response = validate_session(session_id)
    if error_response:
        return error_response
    
    try:
        power_grid = get_session(session_id)
        network_state = power_grid.get_network_state()
        return jsonify(network_state), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get network state: {str(e)}"}), 500

@app.route('/network/node/<session_id>/<node_id>', methods=['GET'])
def get_node_state(session_id, node_id):
    """
    Fetch the state of an individual node by ID for a specific session.
    Args:
        session_id (str): ID of the session
        node_id (str): ID of the node
    Returns:
        JSON: representation of the node state
    """
    error_response = validate_session(session_id)
    if error_response:
        return error_response
    
    try:
        power_grid = get_session(session_id)
        node_state = power_grid.get_node_state(node_id)
        
        if node_state is None:
            return jsonify({"error": f"Node {node_id} not found"}), 404
        
        return jsonify(node_state), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get node state: {str(e)}"}), 500

@app.route('/network/node/<session_id>', methods=['POST'])
def add_node(session_id):
    """
    Add a new node to the network for a specific session.
    Args:
        session_id (str): ID of the session
    Body:
        JSON: containing node details
    Returns:
        JSON: confirmation and updated network state
    """
    error_response = validate_session(session_id)
    if error_response:
        return error_response
    
    try:
        node_data = request.get_json()
        if not node_data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        power_grid = get_session(session_id)
        success = power_grid.add_node(node_data)
        
        if success:
            return jsonify({
                "message": "Node added successfully",
                "node_id": node_data.get("id"),
                "network_state": power_grid.get_network_state()
            }), 201
        else:
            return jsonify({"error": "Failed to add node"}), 400
            
    except Exception as e:
        return jsonify({"error": f"Failed to add node: {str(e)}"}), 500

@app.route('/network/node/<session_id>/<node_id>', methods=['DELETE'])
def remove_node(session_id, node_id):
    """
    Remove a node from the network for a specific session.
    Args:
        session_id (str): ID of the session
        node_id (str): ID of the node to remove
    Returns:
        JSON: confirmation and updated network state
    """
    error_response = validate_session(session_id)
    if error_response:
        return error_response
    
    try:
        power_grid = get_session(session_id)
        success = power_grid.remove_node(node_id)
        
        if success:
            return jsonify({
                "message": f"Node {node_id} removed successfully",
                "network_state": power_grid.get_network_state()
            }), 200
        else:
            return jsonify({"error": f"Failed to remove node {node_id}"}), 400
            
    except Exception as e:
        return jsonify({"error": f"Failed to remove node: {str(e)}"}), 500

@app.route('/network/connection/<session_id>', methods=['POST'])
def add_connection(session_id):
    """
    Add a new connection between nodes for a specific session.
    Args:
        session_id (str): ID of the session
    Body:
        JSON: containing connection details
    Returns:
        JSON: confirmation and updated network state
    """
    error_response = validate_session(session_id)
    if error_response:
        return error_response
    
    try:
        connection_data = request.get_json()
        if not connection_data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        power_grid = get_session(session_id)
        success = power_grid.add_connection(connection_data)
        
        if success:
            return jsonify({
                "message": "Connection added successfully",
                "connection_id": connection_data.get("id"),
                "network_state": power_grid.get_network_state()
            }), 201
        else:
            return jsonify({"error": "Failed to add connection"}), 400
            
    except Exception as e:
        return jsonify({"error": f"Failed to add connection: {str(e)}"}), 500

@app.route('/network/connection/<session_id>/<connection_id>', methods=['DELETE'])
def remove_connection(session_id, connection_id):
    """
    Remove a connection from the network for a specific session.
    Args:
        session_id (str): ID of the session
        connection_id (str): ID of the connection to remove
    Returns:
        JSON: confirmation and updated network state
    """
    error_response = validate_session(session_id)
    if error_response:
        return error_response
    
    try:
        power_grid = get_session(session_id)
        success = power_grid.remove_connection(connection_id)
        
        if success:
            return jsonify({
                "message": f"Connection {connection_id} removed successfully",
                "network_state": power_grid.get_network_state()
            }), 200
        else:
            return jsonify({"error": f"Failed to remove connection {connection_id}"}), 400
            
    except Exception as e:
        return jsonify({"error": f"Failed to remove connection: {str(e)}"}), 500

@app.route('/network/connection/<session_id>/<connection_id>', methods=['GET'])
def get_connection_state(session_id, connection_id):
    """
    Fetch the state of a specific connection for a specific session.
    Args:
        session_id (str): ID of the session
        connection_id (str): ID of the connection
    Returns:
        JSON: representation of the connection state
    """
    error_response = validate_session(session_id)
    if error_response:
        return error_response
    
    try:
        power_grid = get_session(session_id)
        connection_state = power_grid.get_connection_state(connection_id)
        
        if connection_state is None:
            return jsonify({"error": f"Connection {connection_id} not found"}), 404
        
        return jsonify(connection_state), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get connection state: {str(e)}"}), 500

@app.route('/simulation/step/<session_id>', methods=['POST'])
def simulation_step(session_id):
    """
    Run one simulation step for a specific session.
    Args:
        session_id (str): ID of the session
    Body:
        JSON: containing temperature and time_of_day (optional)
    Returns:
        JSON: updated network state after simulation step
    """
    error_response = validate_session(session_id)
    if error_response:
        return error_response
    
    try:
        data = request.get_json() or {}
        temperature = data.get('temperature', 20.0)
        time_of_day = data.get('time_of_day', 0.5)
        
        power_grid = get_session(session_id)
        power_grid.time_step(temperature, time_of_day)
        
        return jsonify({
            "message": "Simulation step completed",
            "grid_frequency": power_grid.grid_frequency,
            "network_state": power_grid.get_network_state()
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to run simulation step: {str(e)}"}), 500

@app.route('/simulation/day/<session_id>', methods=['POST'])
def simulation_day(session_id):
    """
    Run a full day simulation for a specific session.
    Args:
        session_id (str): ID of the session
    Returns:
        JSON: final network state after simulation
    """
    error_response = validate_session(session_id)
    if error_response:
        return error_response
    
    try:
        power_grid = get_session(session_id)
        power_grid.simulate_day()
        
        return jsonify({
            "message": "Full day simulation completed",
            "grid_frequency": power_grid.grid_frequency,
            "network_state": power_grid.get_network_state()
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to run day simulation: {str(e)}"}), 500

@app.route('/graph/submit/<session_id>', methods=['POST'])
def submit_react_flow_graph(session_id):
    """
    Submit a React Flow graph to create/update a simulation session.
    Args:
        session_id (str): ID of the session
    Body:
        JSON: React Flow format with 'nodes' and 'edges' arrays
    Returns:
        JSON: confirmation and backend network state
    """
    try:
        react_flow_data = request.get_json()
        if not react_flow_data:
            return jsonify({"error": "No graph data provided"}), 400

        if 'nodes' not in react_flow_data or 'edges' not in react_flow_data:
            return jsonify({"error": "Invalid graph format. Must include 'nodes' and 'edges' arrays"}), 400

        # Convert React Flow format to backend format
        backend_data = convert_react_flow_to_backend(react_flow_data)

        # Create or update session with new graph
        app.sessions[session_id] = PowerGrid(backend_data, 0.01)

        return jsonify({
            "message": "Graph submitted successfully",
            "session_id": session_id,
            "node_count": len(react_flow_data['nodes']),
            "connection_count": len(react_flow_data['edges']),
            "network_state": app.sessions[session_id].get_network_state()
        }), 201

    except Exception as e:
        return jsonify({"error": f"Failed to submit graph: {str(e)}"}), 500

@app.route('/graph/get/<session_id>', methods=['GET'])
def get_react_flow_graph(session_id):
    """
    Get the current graph in React Flow format.
    Args:
        session_id (str): ID of the session
    Returns:
        JSON: React Flow format with 'nodes' and 'edges' arrays
    """
    error_response = validate_session(session_id)
    if error_response:
        return error_response

    try:
        power_grid = get_session(session_id)
        backend_state = power_grid.get_network_state()

        # Convert backend format to React Flow format
        react_flow_data = convert_backend_to_react_flow({"simulation": backend_state})

        return jsonify({
            "session_id": session_id,
            "graph": react_flow_data,
            "metadata": {
                "node_count": len(react_flow_data['nodes']),
                "connection_count": len(react_flow_data['edges']),
                "grid_frequency": power_grid.grid_frequency,
                "total_inertia": power_grid.total_inertia
            }
        }), 200

    except Exception as e:
        return jsonify({"error": f"Failed to get graph: {str(e)}"}), 500

@app.route('/simulation/start/<session_id>', methods=['POST'])
def start_realtime_simulation(session_id):
    """
    Start a real-time simulation that will emit updates via WebSocket.
    Args:
        session_id (str): ID of the session
    Body:
        JSON: {
            "duration": int (seconds, default: 60),
            "timestep": float (default: 0.1),
            "temperature": float (default: 20.0),
            "time_of_day": float (default: 0.5)
        }
    Returns:
        JSON: simulation started confirmation
    """
    error_response = validate_session(session_id)
    if error_response:
        return error_response

    try:
        data = request.get_json() or {}
        duration = data.get('duration', 60)  # seconds
        timestep = data.get('timestep', 0.1)
        temperature = data.get('temperature', 20.0)
        time_of_day = data.get('time_of_day', 0.5)

        power_grid = get_session(session_id)

        # Start simulation in background thread
        def run_realtime_simulation():
            steps = int(duration / timestep)
            for step in range(steps):
                try:
                    # Run one simulation step
                    power_grid.time_step(temperature, time_of_day)

                    # Emit current state via WebSocket
                    network_state = power_grid.get_network_state()
                    react_flow_data = convert_backend_to_react_flow({"simulation": network_state})

                    socketio.emit('simulation_update', {
                        'session_id': session_id,
                        'step': step,
                        'total_steps': steps,
                        'progress': (step / steps) * 100,
                        'grid_frequency': power_grid.grid_frequency,
                        'total_inertia': power_grid.total_inertia,
                        'graph': react_flow_data,
                        'timestamp': time.time()
                    })

                    time.sleep(timestep)

                except Exception as e:
                    socketio.emit('simulation_error', {
                        'session_id': session_id,
                        'error': str(e),
                        'step': step
                    })
                    break

            # Emit completion
            socketio.emit('simulation_complete', {
                'session_id': session_id,
                'message': 'Simulation completed successfully',
                'final_frequency': power_grid.grid_frequency
            })

        # Start background thread
        thread = threading.Thread(target=run_realtime_simulation)
        thread.daemon = True
        thread.start()

        return jsonify({
            "message": "Real-time simulation started",
            "session_id": session_id,
            "duration": duration,
            "timestep": timestep,
            "total_steps": int(duration / timestep)
        }), 200

    except Exception as e:
        return jsonify({"error": f"Failed to start simulation: {str(e)}"}), 500

@app.route('/sessions', methods=['GET'])
def list_sessions():
    """
    List all active sessions.
    Returns:
        JSON: list of session IDs and basic info
    """
    try:
        sessions_info = []
        for session_id, power_grid in app.sessions.items():
            sessions_info.append({
                "session_id": session_id,
                "node_count": len(power_grid.nodes),
                "grid_frequency": power_grid.grid_frequency,
                "total_inertia": power_grid.total_inertia
            })

        return jsonify({
            "sessions": sessions_info,
            "total_sessions": len(app.sessions)
        }), 200

    except Exception as e:
        return jsonify({"error": f"Failed to list sessions: {str(e)}"}), 500


# --- Stochastic Simulation Endpoints ---

@app.route('/stochastic/configs', methods=['GET'])
def get_stochastic_configs():
    """
    Get available stochastic simulation configurations.
    Returns:
        JSON: list of available configurations with descriptions
    """
    try:
        configs = {
            "small": {
                "name": "Small Renewable Grid",
                "description": "7 nodes: 3 generators (solar, wind, thermal), 2 loads (consumer, business), 2 batteries",
                "nodes": 7,
                "generators": 3,
                "loads": 2,
                "batteries": 2,
                "renewable_capacity": "90 MW",
                "storage_capacity": "70 MW"
            },
            "large": {
                "name": "Large Mixed Grid",
                "description": "13 nodes: 6 generators (2 solar, 2 wind, 2 thermal), 4 loads, 3 batteries",
                "nodes": 13,
                "generators": 6,
                "loads": 4,
                "batteries": 3,
                "renewable_capacity": "190 MW",
                "storage_capacity": "125 MW"
            }
        }

        return jsonify(configs), 200

    except Exception as e:
        return jsonify({"error": f"Failed to get configurations: {str(e)}"}), 500

@app.route('/stochastic/simulate', methods=['POST'])
def start_stochastic_simulation():
    """
    Start a new stochastic simulation.
    Body:
        JSON: {
            "config": "small" | "large",
            "runs": int (default: 3),
            "timesteps": int (default: 100),
            "dt": float (default: 0.1),
            "seed": int (optional)
        }
    Returns:
        JSON: simulation ID and initial status
    """
    try:
        data = request.get_json() or {}

        # Validate and extract parameters
        config_name = data.get('config', 'small')
        if config_name not in ['small', 'large']:
            return jsonify({"error": "Invalid config. Must be 'small' or 'large'"}), 400

        runs = data.get('runs', 3)
        timesteps = data.get('timesteps', 100)
        dt = data.get('dt', 0.1)
        seed = data.get('seed')

        # Validate parameters
        if runs < 1 or runs > 10:
            return jsonify({"error": "Runs must be between 1 and 10"}), 400
        if timesteps < 10 or timesteps > 1000:
            return jsonify({"error": "Timesteps must be between 10 and 1000"}), 400
        if dt <= 0 or dt > 1:
            return jsonify({"error": "dt must be between 0 and 1"}), 400

        # Generate simulation ID
        sim_id = str(uuid.uuid4())

        # Get configuration
        if config_name == 'small':
            config = GridConfiguration.small_renewable_grid()
        else:
            config = GridConfiguration.large_mixed_grid()

        # Store simulation metadata
        app.stochastic_simulations[sim_id] = {
            "id": sim_id,
            "config": config_name,
            "runs": runs,
            "timesteps": timesteps,
            "dt": dt,
            "seed": seed,
            "status": "running",
            "progress": 0,
            "current_run": 0,
            "start_time": time.time(),
            "results": []
        }

        # Start simulation in background thread
        def run_stochastic_simulation():
            try:
                all_results = []

                for run in range(runs):
                    # Update progress
                    app.stochastic_simulations[sim_id]["current_run"] = run + 1
                    app.stochastic_simulations[sim_id]["progress"] = (run / runs) * 100

                    # Use different seed for each run if base seed provided
                    run_seed = (seed + run) if seed is not None else None

                    # Run simulation
                    result = run_simulation(
                        config=config,
                        timesteps=timesteps,
                        dt=dt,
                        seed=run_seed,
                        verbose=False
                    )

                    all_results.append(result)

                # Analyze results
                analysis = SimulationAnalyzer.analyze_results(all_results, config_name.title())

                # Store final results
                app.stochastic_simulations[sim_id]["status"] = "completed"
                app.stochastic_simulations[sim_id]["progress"] = 100
                app.stochastic_simulations[sim_id]["end_time"] = time.time()
                app.simulation_results[sim_id] = {
                    "analysis": analysis,
                    "raw_results": all_results
                }

            except Exception as e:
                app.stochastic_simulations[sim_id]["status"] = "error"
                app.stochastic_simulations[sim_id]["error"] = str(e)

        # Start background thread
        thread = threading.Thread(target=run_stochastic_simulation)
        thread.daemon = True
        thread.start()

        return jsonify({
            "simulation_id": sim_id,
            "message": "Stochastic simulation started",
            "config": config_name,
            "parameters": {
                "runs": runs,
                "timesteps": timesteps,
                "dt": dt,
                "seed": seed
            }
        }), 201

    except Exception as e:
        return jsonify({"error": f"Failed to start simulation: {str(e)}"}), 500

@app.route('/stochastic/status/<sim_id>', methods=['GET'])
def get_simulation_status(sim_id):
    """
    Get the status of a running stochastic simulation.
    Args:
        sim_id (str): ID of the simulation
    Returns:
        JSON: current simulation status and progress
    """
    try:
        if sim_id not in app.stochastic_simulations:
            return jsonify({"error": "Simulation not found"}), 404

        sim_info = app.stochastic_simulations[sim_id].copy()

        # Add runtime information
        if sim_info["status"] == "running":
            elapsed = time.time() - sim_info["start_time"]
            sim_info["elapsed_time"] = elapsed

            # Estimate remaining time
            if sim_info["progress"] > 0:
                estimated_total = elapsed / (sim_info["progress"] / 100)
                sim_info["estimated_remaining"] = estimated_total - elapsed

        elif sim_info["status"] == "completed":
            sim_info["total_time"] = sim_info["end_time"] - sim_info["start_time"]

        return jsonify(sim_info), 200

    except Exception as e:
        return jsonify({"error": f"Failed to get simulation status: {str(e)}"}), 500

@app.route('/stochastic/results/<sim_id>', methods=['GET'])
def get_simulation_results(sim_id):
    """
    Get the results of a completed stochastic simulation.
    Args:
        sim_id (str): ID of the simulation
    Query params:
        include_raw (bool): Whether to include raw timestep data (default: false)
    Returns:
        JSON: simulation results and analysis
    """
    try:
        if sim_id not in app.stochastic_simulations:
            return jsonify({"error": "Simulation not found"}), 404

        sim_info = app.stochastic_simulations[sim_id]

        if sim_info["status"] != "completed":
            return jsonify({"error": f"Simulation not completed. Status: {sim_info['status']}"}), 400

        if sim_id not in app.simulation_results:
            return jsonify({"error": "Results not found"}), 404

        results = app.simulation_results[sim_id]
        include_raw = request.args.get('include_raw', 'false').lower() == 'true'

        response_data = {
            "simulation_info": {
                "id": sim_id,
                "config": sim_info["config"],
                "parameters": {
                    "runs": sim_info["runs"],
                    "timesteps": sim_info["timesteps"],
                    "dt": sim_info["dt"],
                    "seed": sim_info["seed"]
                },
                "execution_time": sim_info["end_time"] - sim_info["start_time"]
            },
            "analysis": results["analysis"]
        }

        if include_raw:
            # Convert raw results to JSON-serializable format
            raw_data = []
            for result in results["raw_results"]:
                raw_data.append({
                    "time": result.time,
                    "frequency": result.frequency,
                    "power_imbalance": result.power_imbalance,
                    "total_supply": result.total_supply,
                    "total_demand": result.total_demand,
                    "solar_generation": result.solar_generation,
                    "wind_generation": result.wind_generation,
                    "thermal_generation": result.thermal_generation,
                    "consumer_demand": result.consumer_demand,
                    "business_demand": result.business_demand,
                    "battery_power": result.battery_power,
                    "battery_soc": result.battery_soc
                })
            response_data["raw_results"] = raw_data

        return jsonify(response_data), 200

    except Exception as e:
        return jsonify({"error": f"Failed to get simulation results: {str(e)}"}), 500

@app.route('/stochastic/simulations', methods=['GET'])
def list_stochastic_simulations():
    """
    List all stochastic simulations (running and completed).
    Returns:
        JSON: list of simulations with basic info
    """
    try:
        simulations = []

        for sim_id, sim_info in app.stochastic_simulations.items():
            sim_summary = {
                "id": sim_id,
                "config": sim_info["config"],
                "status": sim_info["status"],
                "progress": sim_info["progress"],
                "parameters": {
                    "runs": sim_info["runs"],
                    "timesteps": sim_info["timesteps"],
                    "dt": sim_info["dt"]
                },
                "start_time": sim_info["start_time"]
            }

            if sim_info["status"] == "completed":
                sim_summary["end_time"] = sim_info.get("end_time")
                sim_summary["duration"] = sim_info.get("end_time", 0) - sim_info["start_time"]
            elif sim_info["status"] == "error":
                sim_summary["error"] = sim_info.get("error")

            simulations.append(sim_summary)

        return jsonify({
            "simulations": simulations,
            "total": len(simulations)
        }), 200

    except Exception as e:
        return jsonify({"error": f"Failed to list simulations: {str(e)}"}), 500

@app.route('/stochastic/<sim_id>', methods=['DELETE'])
def delete_stochastic_simulation(sim_id):
    """
    Delete a stochastic simulation and its results.
    Args:
        sim_id (str): ID of the simulation to delete
    Returns:
        JSON: confirmation message
    """
    try:
        if sim_id not in app.stochastic_simulations:
            return jsonify({"error": "Simulation not found"}), 404

        # Remove simulation metadata and results
        del app.stochastic_simulations[sim_id]
        if sim_id in app.simulation_results:
            del app.simulation_results[sim_id]

        return jsonify({"message": f"Simulation {sim_id} deleted successfully"}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to delete simulation: {str(e)}"}), 500


@app.route('/', methods=['GET'])
def index():
    """Serve a simple HTML frontend for testing"""
    return '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>PowerGrid API Frontend</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .section { margin: 20px 0; padding: 15px; border: 1px solid #ccc; border-radius: 5px; }
            button { margin: 5px; padding: 8px 15px; }
            input, textarea { margin: 5px; padding: 5px; width: 300px; }
            .result { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 3px; }
            pre { white-space: pre-wrap; }
        </style>
    </head>
    <body>
        <h1>PowerGrid API Frontend</h1>
        
        <div class="section">
            <h3>Session Management</h3>
            <button onclick="createSession()">Create New Session</button>
            <button onclick="listSessions()">List Sessions</button>
            <input type="text" id="sessionId" placeholder="Session ID">
            <button onclick="deleteSession()">Delete Session</button>
            <div id="sessionResult" class="result"></div>
        </div>

        <div class="section">
            <h3>File Upload</h3>
            <input type="file" id="fileInput" accept=".json">
            <button onclick="uploadFile()">Upload JSON File</button>
            <div id="uploadResult" class="result"></div>
        </div>

        <div class="section">
            <h3>Network Operations</h3>
            <button onclick="getNetworkState()">Get Network State</button>
            <button onclick="getNodeState()">Get Node State</button>
            <input type="text" id="nodeId" placeholder="Node ID">
            <div id="networkResult" class="result"></div>
        </div>

        <div class="section">
            <h3>Add Node</h3>
            <textarea id="nodeData" placeholder='{"id": "new_node", "type": "solar-generator", "settings": {"power": 100, "type": "solar-generator", "inertia": 1.0, "friction": 0.1}}'></textarea>
            <button onclick="addNode()">Add Node</button>
            <div id="addNodeResult" class="result"></div>
        </div>

        <div class="section">
            <h3>Regular Simulation</h3>
            <button onclick="simulationStep()">Run Simulation Step</button>
            <button onclick="simulationDay()">Run Full Day</button>
            <div id="simulationResult" class="result"></div>
        </div>

        <div class="section">
            <h3>Stochastic Simulations</h3>
            <button onclick="getStochasticConfigs()">Get Configurations</button>
            <button onclick="listStochasticSimulations()">List Simulations</button>
            <br><br>
            <select id="configSelect">
                <option value="small">Small Renewable Grid</option>
                <option value="large">Large Mixed Grid</option>
            </select>
            <input type="number" id="runsInput" placeholder="Runs (1-10)" value="3" min="1" max="10">
            <input type="number" id="timestepsInput" placeholder="Timesteps (10-1000)" value="100" min="10" max="1000">
            <input type="number" id="seedInput" placeholder="Seed (optional)">
            <button onclick="startStochasticSimulation()">Start Simulation</button>
            <br><br>
            <input type="text" id="simIdInput" placeholder="Simulation ID">
            <button onclick="getSimulationStatus()">Get Status</button>
            <button onclick="getSimulationResults()">Get Results</button>
            <button onclick="deleteSimulation()">Delete</button>
            <div id="stochasticResult" class="result"></div>
        </div>

        <script>
            let currentSessionId = '';

            async function apiCall(url, method = 'GET', data = null) {
                try {
                    const options = {
                        method: method,
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    };
                    if (data) {
                        options.body = JSON.stringify(data);
                    }
                    const response = await fetch(url, options);
                    const result = await response.json();
                    return { success: response.ok, data: result, status: response.status };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            }

            async function createSession() {
                const result = await apiCall('/session', 'POST');
                if (result.success) {
                    currentSessionId = result.data.session_id;
                    document.getElementById('sessionId').value = currentSessionId;
                    document.getElementById('sessionResult').innerHTML = 
                        '<pre>' + JSON.stringify(result.data, null, 2) + '</pre>';
                } else {
                    document.getElementById('sessionResult').innerHTML = 
                        '<pre>Error: ' + JSON.stringify(result, null, 2) + '</pre>';
                }
            }

            async function listSessions() {
                const result = await apiCall('/sessions');
                document.getElementById('sessionResult').innerHTML = 
                    '<pre>' + JSON.stringify(result.data, null, 2) + '</pre>';
            }

            async function deleteSession() {
                const sessionId = document.getElementById('sessionId').value;
                if (!sessionId) {
                    alert('Please enter a session ID');
                    return;
                }
                const result = await apiCall(`/session/${sessionId}`, 'DELETE');
                document.getElementById('sessionResult').innerHTML = 
                    '<pre>' + JSON.stringify(result.data, null, 2) + '</pre>';
            }

            async function uploadFile() {
                const fileInput = document.getElementById('fileInput');
                const file = fileInput.files[0];
                if (!file) {
                    alert('Please select a file');
                    return;
                }

                const formData = new FormData();
                formData.append('file', file);

                try {
                    const response = await fetch('/upload', {
                        method: 'POST',
                        body: formData
                    });
                    const result = await response.json();
                    if (response.ok) {
                        currentSessionId = result.session_id;
                        document.getElementById('sessionId').value = currentSessionId;
                    }
                    document.getElementById('uploadResult').innerHTML = 
                        '<pre>' + JSON.stringify(result, null, 2) + '</pre>';
                } catch (error) {
                    document.getElementById('uploadResult').innerHTML = 
                        '<pre>Error: ' + error.message + '</pre>';
                }
            }

            async function getNetworkState() {
                const sessionId = document.getElementById('sessionId').value || currentSessionId;
                if (!sessionId) {
                    alert('Please create a session first');
                    return;
                }
                const result = await apiCall(`/network/state/${sessionId}`);
                document.getElementById('networkResult').innerHTML = 
                    '<pre>' + JSON.stringify(result.data, null, 2) + '</pre>';
            }

            async function getNodeState() {
                const sessionId = document.getElementById('sessionId').value || currentSessionId;
                const nodeId = document.getElementById('nodeId').value;
                if (!sessionId || !nodeId) {
                    alert('Please enter session ID and node ID');
                    return;
                }
                const result = await apiCall(`/network/node/${sessionId}/${nodeId}`);
                document.getElementById('networkResult').innerHTML = 
                    '<pre>' + JSON.stringify(result.data, null, 2) + '</pre>';
            }

            async function addNode() {
                const sessionId = document.getElementById('sessionId').value || currentSessionId;
                const nodeData = document.getElementById('nodeData').value;
                if (!sessionId || !nodeData) {
                    alert('Please enter session ID and node data');
                    return;
                }
                try {
                    const data = JSON.parse(nodeData);
                    const result = await apiCall(`/network/node/${sessionId}`, 'POST', data);
                    document.getElementById('addNodeResult').innerHTML = 
                        '<pre>' + JSON.stringify(result.data, null, 2) + '</pre>';
                } catch (error) {
                    document.getElementById('addNodeResult').innerHTML = 
                        '<pre>Error parsing JSON: ' + error.message + '</pre>';
                }
            }

            async function simulationStep() {
                const sessionId = document.getElementById('sessionId').value || currentSessionId;
                if (!sessionId) {
                    alert('Please create a session first');
                    return;
                }
                const result = await apiCall(`/simulation/step/${sessionId}`, 'POST');
                document.getElementById('simulationResult').innerHTML = 
                    '<pre>' + JSON.stringify(result.data, null, 2) + '</pre>';
            }

            async function simulationDay() {
                const sessionId = document.getElementById('sessionId').value || currentSessionId;
                if (!sessionId) {
                    alert('Please create a session first');
                    return;
                }
                const result = await apiCall(`/simulation/day/${sessionId}`, 'POST');
                document.getElementById('simulationResult').innerHTML =
                    '<pre>' + JSON.stringify(result.data, null, 2) + '</pre>';
            }

            // Stochastic Simulation Functions
            async function getStochasticConfigs() {
                const result = await apiCall('/stochastic/configs');
                document.getElementById('stochasticResult').innerHTML =
                    '<pre>' + JSON.stringify(result.data, null, 2) + '</pre>';
            }

            async function startStochasticSimulation() {
                const config = document.getElementById('configSelect').value;
                const runs = parseInt(document.getElementById('runsInput').value) || 3;
                const timesteps = parseInt(document.getElementById('timestepsInput').value) || 100;
                const seedValue = document.getElementById('seedInput').value;
                const seed = seedValue ? parseInt(seedValue) : null;

                const data = { config, runs, timesteps, seed };
                const result = await apiCall('/stochastic/simulate', 'POST', data);

                if (result.success) {
                    document.getElementById('simIdInput').value = result.data.simulation_id;
                    document.getElementById('stochasticResult').innerHTML =
                        '<pre>' + JSON.stringify(result.data, null, 2) + '</pre>';

                    // Auto-refresh status every 2 seconds
                    const simId = result.data.simulation_id;
                    const statusInterval = setInterval(async () => {
                        const statusResult = await apiCall(`/stochastic/status/${simId}`);
                        if (statusResult.success) {
                            const status = statusResult.data.status;
                            const progress = statusResult.data.progress;

                            document.getElementById('stochasticResult').innerHTML =
                                `<h4>Status: ${status} (${progress.toFixed(1)}%)</h4>` +
                                '<pre>' + JSON.stringify(statusResult.data, null, 2) + '</pre>';

                            if (status === 'completed' || status === 'error') {
                                clearInterval(statusInterval);
                            }
                        }
                    }, 2000);
                } else {
                    document.getElementById('stochasticResult').innerHTML =
                        '<pre>Error: ' + JSON.stringify(result, null, 2) + '</pre>';
                }
            }

            async function getSimulationStatus() {
                const simId = document.getElementById('simIdInput').value;
                if (!simId) {
                    alert('Please enter a simulation ID');
                    return;
                }
                const result = await apiCall(`/stochastic/status/${simId}`);
                document.getElementById('stochasticResult').innerHTML =
                    '<pre>' + JSON.stringify(result.data, null, 2) + '</pre>';
            }

            async function getSimulationResults() {
                const simId = document.getElementById('simIdInput').value;
                if (!simId) {
                    alert('Please enter a simulation ID');
                    return;
                }
                const result = await apiCall(`/stochastic/results/${simId}`);
                document.getElementById('stochasticResult').innerHTML =
                    '<pre>' + JSON.stringify(result.data, null, 2) + '</pre>';
            }

            async function listStochasticSimulations() {
                const result = await apiCall('/stochastic/simulations');
                document.getElementById('stochasticResult').innerHTML =
                    '<pre>' + JSON.stringify(result.data, null, 2) + '</pre>';
            }

            async function deleteSimulation() {
                const simId = document.getElementById('simIdInput').value;
                if (!simId) {
                    alert('Please enter a simulation ID');
                    return;
                }
                const result = await apiCall(`/stochastic/${simId}`, 'DELETE');
                document.getElementById('stochasticResult').innerHTML =
                    '<pre>' + JSON.stringify(result.data, null, 2) + '</pre>';
            }
        </script>
    </body>
    </html>
    '''

# --- WebSocket Event Handlers ---

@socketio.on('connect')
def handle_connect():
    print('Client connected')
    emit('connection_established', {'message': 'Connected to simulation server'})

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('join_session')
def handle_join_session(data):
    session_id = data.get('session_id')
    if session_id:
        # Join room for session-specific updates
        from flask_socketio import join_room
        join_room(session_id)
        emit('joined_session', {'session_id': session_id, 'message': f'Joined session {session_id}'})

@socketio.on('leave_session')
def handle_leave_session(data):
    session_id = data.get('session_id')
    if session_id:
        from flask_socketio import leave_room
        leave_room(session_id)
        emit('left_session', {'session_id': session_id, 'message': f'Left session {session_id}'})

# --- Main entrypoint ---
if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)