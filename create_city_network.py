#!/usr/bin/env python3
"""
Create a comprehensive city energy network JSON file
"""
import json
import random
from datetime import datetime

def create_city_network():
    """Create a large city energy network"""
    
    # Set random seed for reproducibility
    random.seed(42)
    
    nodes = []
    connections = []
    families = []
    
    # Generate unique IDs
    def generate_id():
        return str(random.randint(1000000000000, 9999999999999))
    
    # Power generation facilities
    power_plants = [
        {"type": "coal-generator", "power": 8000, "name": "Main Coal Plant", "x": 100, "y": 100},
        {"type": "nuclear-generator", "power": 12000, "name": "Nuclear Plant Alpha", "x": 200, "y": 150},
        {"type": "nuclear-generator", "power": 10000, "name": "Nuclear Plant Beta", "x": 300, "y": 120},
        {"type": "hydro-generator", "power": 5000, "name": "Hydroelectric Dam", "x": 400, "y": 80},
        {"type": "geothermal-generator", "power": 2000, "name": "Geothermal Plant", "x": 500, "y": 200},
        {"type": "coal-generator", "power": 6000, "name": "Secondary Coal Plant", "x": 150, "y": 300},
        {"type": "nuclear-generator", "power": 9000, "name": "Nuclear Plant Gamma", "x": 350, "y": 250},
    ]
    
    # Solar farms (25 locations)
    solar_farms = []
    for i in range(25):
        x = random.randint(50, 550)
        y = random.randint(50, 200)
        power = random.randint(500, 2500)
        solar_farms.append({
            "type": "solar-generator",
            "power": power,
            "name": f"Solar Farm {i+1}",
            "x": x,
            "y": y
        })
    
    # Wind farms (20 locations)
    wind_farms = []
    for i in range(20):
        x = random.randint(100, 500)
        y = random.randint(250, 400)
        power = random.randint(800, 1800)
        wind_farms.append({
            "type": "wind-generator",
            "power": power,
            "name": f"Wind Farm {i+1}",
            "x": x,
            "y": y
        })
    
    # Battery storage facilities (15 locations)
    battery_storages = []
    for i in range(15):
        x = random.randint(200, 400)
        y = random.randint(450, 600)
        power = random.randint(800, 2000)
        soc = random.uniform(0.3, 0.9)
        battery_storages.append({
            "type": "battery-storage",
            "power": power,
            "name": f"Battery Storage {i+1}",
            "x": x,
            "y": y,
            "soc": soc
        })
    
    # Substations (30 locations)
    substations = []
    for i in range(30):
        x = random.randint(150, 450)
        y = random.randint(300, 700)
        power = random.randint(3000, 10000)
        substations.append({
            "type": "grid",
            "power": power,
            "name": f"Substation {i+1}",
            "x": x,
            "y": y
        })
    
    # Residential areas (150 houses)
    houses = []
    for i in range(150):
        x = random.randint(300, 800)
        y = random.randint(700, 1000)
        power = random.randint(5, 20)  # kW per house
        houses.append({
            "type": "residential",
            "power": power,
            "name": f"House {i+1}",
            "x": x,
            "y": y
        })
    
    # Commercial buildings (75 locations)
    commercial = []
    for i in range(75):
        x = random.randint(400, 800)
        y = random.randint(600, 900)
        power = random.randint(50, 300)
        commercial.append({
            "type": "commercial",
            "power": power,
            "name": f"Commercial Building {i+1}",
            "x": x,
            "y": y
        })
    
    # Industrial facilities (50 factories)
    factories = []
    for i in range(50):
        x = random.randint(200, 600)
        y = random.randint(800, 1200)
        power = random.randint(300, 1500)
        factories.append({
            "type": "factory",
            "power": power,
            "name": f"Factory {i+1}",
            "x": x,
            "y": y
        })
    
    # Data centers (8 locations)
    data_centers = []
    for i in range(8):
        x = random.randint(500, 700)
        y = random.randint(500, 700)
        power = random.randint(1500, 4000)
        data_centers.append({
            "type": "data-center",
            "power": power,
            "name": f"Data Center {i+1}",
            "x": x,
            "y": y
        })
    
    # Hospitals (12 locations)
    hospitals = []
    for i in range(12):
        x = random.randint(300, 600)
        y = random.randint(400, 800)
        power = random.randint(400, 1000)
        hospitals.append({
            "type": "hospital",
            "power": power,
            "name": f"Hospital {i+1}",
            "x": x,
            "y": y
        })
    
    # Schools (30 locations)
    schools = []
    for i in range(30):
        x = random.randint(250, 750)
        y = random.randint(500, 900)
        power = random.randint(80, 200)
        schools.append({
            "type": "school",
            "power": power,
            "name": f"School {i+1}",
            "x": x,
            "y": y
        })
    
    # Shopping centers (15 locations)
    shopping_centers = []
    for i in range(15):
        x = random.randint(400, 700)
        y = random.randint(600, 850)
        power = random.randint(300, 800)
        shopping_centers.append({
            "type": "shopping-center",
            "power": power,
            "name": f"Shopping Center {i+1}",
            "x": x,
            "y": y
        })
    
    # Office buildings (40 locations)
    offices = []
    for i in range(40):
        x = random.randint(350, 650)
        y = random.randint(550, 800)
        power = random.randint(100, 400)
        offices.append({
            "type": "office",
            "power": power,
            "name": f"Office Building {i+1}",
            "x": x,
            "y": y
        })
    
    # Combine all node types
    all_node_types = [
        (power_plants, "power_plant"),
        (solar_farms, "solar_farm"),
        (wind_farms, "wind_farm"),
        (battery_storages, "battery_storage"),
        (substations, "substation"),
        (houses, "residential"),
        (commercial, "commercial"),
        (factories, "factory"),
        (data_centers, "data_center"),
        (hospitals, "hospital"),
        (schools, "school"),
        (shopping_centers, "shopping_center"),
        (offices, "office")
    ]
    
    # Generate nodes with proper GridForge format
    for node_list, category in all_node_types:
        for node_data in node_list:
            node_id = generate_id()
            node_type = node_data["type"]
            power = node_data["power"]
            
            # Set appropriate settings based on node type
            if "generator" in node_type or "plant" in node_type or "dam" in node_type:
                settings = {
                    "power": power,
                    "type": node_type,
                    "inertia": random.uniform(5, 30),
                    "friction": random.uniform(1, 8)
                }
            elif "battery" in node_type:
                settings = {
                    "power": power,
                    "type": node_type,
                    "inertia": random.uniform(2, 8),
                    "friction": random.uniform(0.5, 2),
                    "charge_rate": power * random.uniform(0.3, 0.8),
                    "soc": node_data.get("soc", random.uniform(0.2, 0.9))
                }
            elif "grid" in node_type or "substation" in node_type:
                settings = {
                    "power": power,
                    "type": node_type,
                    "inertia": random.uniform(10, 25),
                    "friction": random.uniform(2, 6)
                }
            else:  # Consumers
                settings = {
                    "power": power,
                    "type": node_type,
                    "inertia": random.uniform(0.5, 5),
                    "friction": random.uniform(0.1, 2)
                }
            
            node = {
                "id": node_id,
                "type": node_type,
                "x": node_data["x"],
                "y": node_data["y"],
                "name": node_data["name"],
                "status": "active",
                "settings": settings,
                "layer": 0,
                "childNodes": [],
                "isGroup": False
            }
            nodes.append(node)
    
    # Generate connections
    # Get all node IDs by type for easier connection generation
    power_generators = [n for n in nodes if "generator" in n["type"] or "plant" in n["type"] or "dam" in n["type"]]
    substation_nodes = [n for n in nodes if "grid" in n["type"] or "substation" in n["type"]]
    consumer_nodes = [n for n in nodes if n["type"] not in ["solar-generator", "wind-generator", "coal-generator", "nuclear-generator", "hydro-generator", "geothermal-generator", "battery-storage"] and "grid" not in n["type"]]
    
    # Connect power generators to substations
    for generator in power_generators:
        # Connect to 1-3 nearby substations
        num_connections = random.randint(1, min(3, len(substation_nodes)))
        connected_subs = random.sample(substation_nodes, num_connections)
        
        for substation in connected_subs:
            connections.append({
                "id": str(generate_id()),
                "from": generator["id"],
                "to": substation["id"],
                "power": 0,
                "status": "active",
                "resistance": random.uniform(0.1, 0.5),
                "maxPower": min(generator["settings"]["power"], substation["settings"]["power"])
            })
    
    # Connect substations to each other (grid backbone)
    for i, sub1 in enumerate(substation_nodes):
        for sub2 in substation_nodes[i+1:]:
            if random.random() < 0.3:  # 30% chance of connection
                connections.append({
                    "id": str(generate_id()),
                    "from": sub1["id"],
                    "to": sub2["id"],
                    "power": 0,
                    "status": "active",
                    "resistance": random.uniform(0.2, 0.8),
                    "maxPower": min(sub1["settings"]["power"], sub2["settings"]["power"])
                })
    
    # Connect consumers to substations
    for consumer in consumer_nodes:
        # Connect to 1-2 nearby substations
        num_connections = random.randint(1, min(2, len(substation_nodes)))
        connected_subs = random.sample(substation_nodes, num_connections)
        
        for substation in connected_subs:
            connections.append({
                "id": str(generate_id()),
                "from": substation["id"],
                "to": consumer["id"],
                "power": 0,
                "status": "active",
                "resistance": random.uniform(0.1, 0.4),
                "maxPower": min(substation["settings"]["power"], consumer["settings"]["power"] * 2)
            })
    
    # Connect battery storage to nearby substations
    battery_nodes = [n for n in nodes if "battery" in n["type"]]
    for battery in battery_nodes:
        # Connect to 1-2 nearby substations
        num_connections = random.randint(1, min(2, len(substation_nodes)))
        connected_subs = random.sample(substation_nodes, num_connections)
        
        for substation in connected_subs:
            connections.append({
                "id": str(generate_id()),
                "from": battery["id"],
                "to": substation["id"],
                "power": 0,
                "status": "active",
                "resistance": random.uniform(0.1, 0.3),
                "maxPower": min(battery["settings"]["power"], substation["settings"]["power"])
            })
    
    # Create families (group related nodes)
    # Group residential areas by neighborhood
    residential_nodes = [n for n in nodes if n["type"] == "residential"]
    for i in range(0, len(residential_nodes), 20):  # Groups of 20 houses
        neighborhood = residential_nodes[i:i+20]
        if len(neighborhood) >= 10:  # Only create family if we have enough nodes
            family_id = str(generate_id())
            family_name = f"Neighborhood {i//20 + 1}"
            
            families.append({
                "id": family_id,
                "name": family_name,
                "nodeIds": [n["id"] for n in neighborhood],
                "layer": 1
            })
    
    # Group factories by industrial zone
    factory_nodes = [n for n in nodes if n["type"] == "factory"]
    for i in range(0, len(factory_nodes), 10):  # Groups of 10 factories
        industrial_zone = factory_nodes[i:i+10]
        if len(industrial_zone) >= 5:  # Only create family if we have enough nodes
            family_id = str(generate_id())
            family_name = f"Industrial Zone {i//10 + 1}"
            
            families.append({
                "id": family_id,
                "name": family_name,
                "nodeIds": [n["id"] for n in industrial_zone],
                "layer": 1
            })
    
    # Create layers
    layers = [
        {
            "layer": 0,
            "name": "Individual Nodes",
            "description": "Base layer with individual components",
            "nodeCount": len(nodes)
        },
        {
            "layer": 1,
            "name": "Family Groups",
            "description": "Grouped components by family",
            "nodeCount": len(families)
        }
    ]
    
    # Create the complete network structure
    network = {
        "version": "1.0",
        "metadata": {
            "name": "MegaCity Energy Network",
            "description": "Comprehensive city energy infrastructure simulation",
            "createdAt": datetime.now().isoformat() + "Z",
            "author": "GridForge Generator"
        },
        "simulation": {
            "nodes": nodes,
            "connections": connections,
            "families": families,
            "layers": layers
        },
        "viewport": {
            "x": -100,
            "y": -50,
            "zoom": 0.5
        },
        "settings": {
            "simulationRunning": False,
            "currentLayer": 0
        }
    }
    
    return network

def main():
    print("🏙️ Generating comprehensive city energy network...")
    
    # Generate the network
    network = create_city_network()
    
    # Print statistics
    num_nodes = len(network["simulation"]["nodes"])
    num_connections = len(network["simulation"]["connections"])
    num_families = len(network["simulation"]["families"])
    
    print(f"✅ Generated network with {num_nodes} nodes, {num_connections} connections, and {num_families} families")
    
    # Count by type
    node_types = {}
    for node in network["simulation"]["nodes"]:
        node_type = node["type"]
        node_types[node_type] = node_types.get(node_type, 0) + 1
    
    print("\n📊 Node distribution:")
    for node_type, count in sorted(node_types.items()):
        print(f"  {node_type}: {count}")
    
    # Calculate total power capacity
    total_generation = 0
    total_consumption = 0
    
    for node in network["simulation"]["nodes"]:
        power = node["settings"]["power"]
        if "generator" in node["type"] or "plant" in node["type"] or "dam" in node["type"]:
            total_generation += power
        else:
            total_consumption += power
    
    print(f"\n⚡ Power capacity:")
    print(f"  Total generation: {total_generation:,} kW")
    print(f"  Total consumption: {total_consumption:,} kW")
    print(f"  Balance: {total_generation - total_consumption:,} kW")
    
    # Save to file
    with open("mega_city_energy_network.json", "w") as f:
        json.dump(network, f, indent=2)
    
    print(f"\n💾 Saved to mega_city_energy_network.json")
    print(f"📏 File size: {len(json.dumps(network)) / 1024:.1f} KB")

if __name__ == "__main__":
    main()
