from flask import Flask, request, jsonify
from flask_cors import CORS
from environment.PowerGrid import PowerGrid
from cases import case14


app = Flask(__name__)
capacity = 100
app.sessions = [None] * 100
next_session_id = 0

# --- Endpoints ---

@app.route('/network/state', methods=['GET'])
def get_network_state():
    """
    Fetch the state of the entire network.
    Returns:
        JSON: representation of the network state
    """
    
    pass


@app.route('/network/node/<int:node_id>', methods=['GET'])
def get_node_state(node_id):
    """
    Fetch the state of an individual node by ID.
    Args:
        node_id (int): ID of the node
    Returns:
        JSON: representation of the node state
    """
    pass


@app.route('/network/node', methods=['POST'])
def add_node():
    """
    Add a new node to the network from a JSON payload.
    Body:
        JSON: containing node details
    Returns:
        JSON: confirmation or updated network state
    """
    pass


@app.route('/network/connection', methods=['POST'])
def add_connection():
    """
    Add a new connection between nodes from a JSON payload.
    Body:
        JSON: containing connection details
    Returns:
        JSON: confirmation or updated network state
    """
    pass

@app.route('/session', methods=['POST'])
def create_session():
    """
    Create a new simulation session.
    Body:
        JSON: containing session parameters
    Returns:
        JSON: session ID and initial state
    """
    global next_session_id
    if next_session_id >= capacity:
        return jsonify({"error": "Maximum session capacity reached."}), 400

    session_id = next_session_id
    next_session_id += 1

    # Initialize session (placeholder)
    app.sessions[session_id] = PowerGrid(case14(), 0.01)

    return session_id


# --- Main entrypoint ---
if __name__ == '__main__':
    app.run(debug=True)