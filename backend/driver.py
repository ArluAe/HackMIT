
import json
from environment.PowerGrid import PowerGrid

def test_basic_initialization():
    """Test basic PowerGrid initialization"""
    print("=== Testing Basic Initialization ===")
    
    # Load JSON data from case1.json
    with open('cases/case1.json', 'r') as f:
        network_dict = json.load(f)
    
    # Create PowerGrid
    my_grid = PowerGrid(network_dict, 0.01)
    
    print(f"✅ PowerGrid created successfully")
    print(f"   - Number of nodes: {len(my_grid.nodes)}")
    print(f"   - Total inertia: {my_grid.total_inertia}")
    print(f"   - Grid frequency: {my_grid.grid_frequency}")
    
    return my_grid

def test_network_state():
    """Test getting network state"""
    print("\n=== Testing Network State ===")
    
    with open('cases/case1.json', 'r') as f:
        network_dict = json.load(f)
    
    my_grid = PowerGrid(network_dict, 0.01)
    
    # Get network state
    network_state = my_grid.get_network_state()
    
    print(f"✅ Network state retrieved")
    print(f"   - Original nodes: {len(network_dict['simulation']['nodes'])}")
    print(f"   - Retrieved nodes: {len(network_state['simulation']['nodes'])}")
    print(f"   - Original connections: {len(network_dict['simulation']['connections'])}")
    print(f"   - Retrieved connections: {len(network_state['simulation']['connections'])}")
    
    return my_grid

def test_node_operations():
    """Test node-specific operations"""
    print("\n=== Testing Node Operations ===")
    
    with open('cases/case1.json', 'r') as f:
        network_dict = json.load(f)
    
    my_grid = PowerGrid(network_dict, 0.01)
    
    # Test getting node state
    first_node_id = network_dict['simulation']['nodes'][0]['id']
    node_state = my_grid.get_node_state(first_node_id)
    
    if node_state:
        print(f"✅ Node state retrieved for node {first_node_id}")
        print(f"   - Node type: {node_state.get('type', 'unknown')}")
        print(f"   - Node power: {node_state.get('settings', {}).get('power', 'unknown')}")
    else:
        print(f"❌ Failed to get node state for {first_node_id}")
    
    # Test adding a new node
    new_node = {
        "id": "test_node_123",
        "type": "solar-generator",
        "x": 200,
        "y": 300,
        "name": "Test Solar Panel",
        "status": "active",
        "settings": {
            "power": 250,
            "type": "solar-generator",
            "inertia": 1.5,
            "friction": 0.3
        }
    }
    
    success = my_grid.add_node(new_node)
    if success:
        print(f"✅ Successfully added new node: {new_node['id']}")
        print(f"   - Total nodes now: {len(my_grid.nodes)}")
        
        # Verify it's in the network state
        updated_state = my_grid.get_network_state()
        node_found = any(node['id'] == new_node['id'] for node in updated_state['simulation']['nodes'])
        print(f"   - Node found in network state: {node_found}")
    else:
        print(f"❌ Failed to add new node")
    
    return my_grid

def test_connection_operations():
    """Test connection-specific operations"""
    print("\n=== Testing Connection Operations ===")
    
    with open('cases/case1.json', 'r') as f:
        network_dict = json.load(f)
    
    my_grid = PowerGrid(network_dict, 0.01)
    
    # Test getting connection state
    if network_dict['simulation']['connections']:
        first_conn_id = network_dict['simulation']['connections'][0]['id']
        conn_state = my_grid.get_connection_state(first_conn_id)
        
        if conn_state:
            print(f"✅ Connection state retrieved for connection {first_conn_id}")
            print(f"   - From: {conn_state.get('from', 'unknown')}")
            print(f"   - To: {conn_state.get('to', 'unknown')}")
            print(f"   - Power: {conn_state.get('power', 'unknown')}")
        else:
            print(f"❌ Failed to get connection state for {first_conn_id}")
    
    # Test adding a new connection (if we have at least 2 nodes)
    nodes = list(my_grid.nodes.keys())
    if len(nodes) >= 2:
        new_connection = {
            "id": "test_conn_456",
            "from": nodes[0],
            "to": nodes[1],
            "power": 150,
            "status": "active",
            "resistance": 0.5,
            "maxPower": 200
        }
        
        success = my_grid.add_connection(new_connection)
        if success:
            print(f"✅ Successfully added new connection: {new_connection['id']}")
            
            # Verify it's in the network state
            updated_state = my_grid.get_network_state()
            conn_found = any(conn['id'] == new_connection['id'] for conn in updated_state['simulation']['connections'])
            print(f"   - Connection found in network state: {conn_found}")
        else:
            print(f"❌ Failed to add new connection")
    else:
        print(f"⚠️  Not enough nodes to test connection addition")
    
    return my_grid

def test_removal_operations():
    """Test removal operations"""
    print("\n=== Testing Removal Operations ===")
    
    with open('cases/case1.json', 'r') as f:
        network_dict = json.load(f)
    
    my_grid = PowerGrid(network_dict, 0.01)
    
    # Test removing a connection
    if network_dict['simulation']['connections']:
        conn_to_remove = network_dict['simulation']['connections'][0]['id']
        success = my_grid.remove_connection(conn_to_remove)
        
        if success:
            print(f"✅ Successfully removed connection: {conn_to_remove}")
            
            # Verify it's removed from network state
            updated_state = my_grid.get_network_state()
            conn_found = any(conn['id'] == conn_to_remove for conn in updated_state['simulation']['connections'])
            print(f"   - Connection removed from network state: {not conn_found}")
        else:
            print(f"❌ Failed to remove connection: {conn_to_remove}")
    
    # Test removing a node (be careful - this removes all its connections too)
    if len(my_grid.nodes) > 1:  # Keep at least one node
        node_to_remove = list(my_grid.nodes.keys())[0]
        initial_node_count = len(my_grid.nodes)
        initial_conn_count = len(my_grid.get_network_state()['simulation']['connections'])
        
        success = my_grid.remove_node(node_to_remove)
        
        if success:
            print(f"✅ Successfully removed node: {node_to_remove}")
            print(f"   - Nodes before: {initial_node_count}, after: {len(my_grid.nodes)}")
            
            # Check final connection count
            final_state = my_grid.get_network_state()
            final_conn_count = len(final_state['simulation']['connections'])
            print(f"   - Connections before: {initial_conn_count}, after: {final_conn_count}")
        else:
            print(f"❌ Failed to remove node: {node_to_remove}")
    else:
        print(f"⚠️  Not enough nodes to test node removal")
    
    return my_grid

def test_simulation():
    """Test running the simulation"""
    print("\n=== Testing Simulation ===")
    
    with open('cases/case1.json', 'r') as f:
        network_dict = json.load(f)
    
    my_grid = PowerGrid(network_dict, 0.01)
    
    print(f"✅ Starting simulation with {len(my_grid.nodes)} nodes")
    
    # Run a short simulation
    try:
        my_grid.simulate_day()
        print(f"✅ Simulation completed successfully")
        
        # Check final state
        final_state = my_grid.get_network_state()
        print(f"   - Final node count: {len(final_state['simulation']['nodes'])}")
        print(f"   - Final connection count: {len(final_state['simulation']['connections'])}")
        
    except Exception as e:
        print(f"❌ Simulation failed with error: {e}")
    
    return my_grid

def run_all_tests():
    """Run all tests"""
    print("🚀 Starting PowerGrid Tests")
    print("=" * 50)
    
    try:
        # Run all test functions
        test_basic_initialization()
        test_network_state()
        test_node_operations()
        test_connection_operations()
        test_removal_operations()
        test_simulation()
        
        print("\n" + "=" * 50)
        print("🎉 All tests completed!")
        
    except Exception as e:
        print(f"\n❌ Test suite failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Run all tests
    run_all_tests()
