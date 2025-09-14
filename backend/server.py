from flask import Flask, request, jsonify
from flask_cors import CORS
from environment.PowerGrid import PowerGrid
from cases import case14
import json
import os
import uuid

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Session management
capacity = 100
app.sessions = {}  # Dictionary to store sessions by session_id
next_session_id = 0

# --- Helper Functions ---

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
            <h3>Simulation</h3>
            <button onclick="simulationStep()">Run Simulation Step</button>
            <button onclick="simulationDay()">Run Full Day</button>
            <div id="simulationResult" class="result"></div>
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
        </script>
    </body>
    </html>
    '''

# --- Main entrypoint ---
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)