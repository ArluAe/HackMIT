#!/usr/bin/env python3
"""
Generate a compact, well-spaced city energy network with 50 nodes
Families are clearly separated and nodes don't overlap
"""
import json
import random
import math
from datetime import datetime

def generate_compact_city():
    """Generate a compact city with 50 nodes, well-spaced families"""
    
    # Set random seed for reproducibility
    random.seed(42)
    
    nodes = []
    connections = []
    families = []
    
    # Generate unique IDs
    def generate_id():
        return str(random.randint(1000000000000, 9999999999999))
    
    # City layout parameters - MASSIVE canvas for excellent spacing
    CITY_WIDTH = 8000
    CITY_HEIGHT = 6000
    PADDING = 400
    
    # Define city districts with MASSIVE SPACING between families (4x more)
    districts = {
        "power_generation": {
            "center": (CITY_WIDTH // 2, PADDING + 800),
            "size": (1600, 600),
            "description": "Power Generation District"
        },
        "industrial": {
            "center": (PADDING + 1200, CITY_HEIGHT // 2 - 1200),
            "size": (800, 800),
            "description": "Industrial Zone"
        },
        "residential": {
            "center": (CITY_WIDTH // 2 + 2000, CITY_HEIGHT // 2 - 800),
            "size": (1200, 800),
            "description": "Residential District"
        },
        "commercial": {
            "center": (CITY_WIDTH // 2, CITY_HEIGHT // 2 + 1200),
            "size": (1000, 600),
            "description": "Commercial Center"
        },
        "storage": {
            "center": (CITY_WIDTH - PADDING - 1200, CITY_HEIGHT // 2 + 800),
            "size": (800, 600),
            "description": "Storage District"
        }
    }
    
    # 1. POWER GENERATION DISTRICT (Top)
    print("Generating power generation district...")
    power_family = {
        "id": f"family_{generate_id()}",
        "name": "Power Generation Complex",
        "nodeIds": [],
        "centerPosition": {"x": districts["power_generation"]["center"][0], "y": districts["power_generation"]["center"][1]},
        "stats": {"totalPower": 0, "nodeCount": 0, "childTypes": {}}
    }
    
    # Major power plants - MASSIVELY SPACED (2x more)
    power_plants = [
        {"type": "nuclear-generator", "power": 15000, "name": "Nuclear Plant", "x": districts["power_generation"]["center"][0] - 400, "y": districts["power_generation"]["center"][1] - 100},
        {"type": "coal-generator", "power": 8000, "name": "Coal Plant", "x": districts["power_generation"]["center"][0] + 400, "y": districts["power_generation"]["center"][1] - 100},
        {"type": "hydro-generator", "power": 6000, "name": "Hydro Dam", "x": districts["power_generation"]["center"][0], "y": districts["power_generation"]["center"][1] + 200},
    ]
    
    for plant in power_plants:
        node_id = generate_id()
        node = {
            "id": node_id,
            "type": plant["type"],
            "x": plant["x"],
            "y": plant["y"],
            "name": plant["name"],
            "status": "active",
            "settings": {
                "power": plant["power"],
                "type": plant["type"],
                "inertia": random.uniform(5, 15),
                "friction": random.uniform(1, 3)
            },
            "layer": 0,
            "childNodes": [],
            "isGroup": False,
            "familyId": power_family["id"],
            "familyName": power_family["name"]
        }
        nodes.append(node)
        power_family["nodeIds"].append(node_id)
        power_family["stats"]["totalPower"] += plant["power"]
        power_family["stats"]["nodeCount"] += 1
        power_family["stats"]["childTypes"][plant["type"]] = power_family["stats"]["childTypes"].get(plant["type"], 0) + 1
    
    # Solar farms - MASSIVELY SPACED GRID (2x more)
    for row in range(2):
        for col in range(4):
            x = districts["power_generation"]["center"][0] - 600 + col * 400
            y = districts["power_generation"]["center"][1] + 400 + row * 200
            power = random.randint(1000, 2000)
            node_id = generate_id()
            node = {
                "id": node_id,
                "type": "solar-generator",
                "x": x,
                "y": y,
                "name": f"Solar Farm {row * 4 + col + 1}",
                "status": "active",
                "settings": {
                    "power": power,
                    "type": "solar-generator",
                    "inertia": random.uniform(1, 3),
                    "friction": random.uniform(0.5, 1.5)
                },
                "layer": 0,
                "childNodes": [],
                "isGroup": False,
                "familyId": power_family["id"],
                "familyName": power_family["name"]
            }
            nodes.append(node)
            power_family["nodeIds"].append(node_id)
            power_family["stats"]["totalPower"] += power
            power_family["stats"]["nodeCount"] += 1
            power_family["stats"]["childTypes"]["solar-generator"] = power_family["stats"]["childTypes"].get("solar-generator", 0) + 1
    
    families.append(power_family)
    
    # 2. INDUSTRIAL DISTRICT (Left)
    print("Generating industrial district...")
    industrial_family = {
        "id": f"family_{generate_id()}",
        "name": "Industrial Zone",
        "nodeIds": [],
        "centerPosition": {"x": districts["industrial"]["center"][0], "y": districts["industrial"]["center"][1]},
        "stats": {"totalPower": 0, "nodeCount": 0, "childTypes": {}}
    }
    
    # Factories - MASSIVELY SPACED GRID (2x more)
    for row in range(3):
        for col in range(2):
            x = districts["industrial"]["center"][0] - 200 + col * 400
            y = districts["industrial"]["center"][1] - 200 + row * 240
            power = random.randint(3000, 8000)
            node_id = generate_id()
            node = {
                "id": node_id,
                "type": "factory",
                "x": x,
                "y": y,
                "name": f"Factory {row * 2 + col + 1}",
                "status": "active",
                "settings": {
                    "power": power,
                    "type": "factory",
                    "inertia": random.uniform(2, 5),
                    "friction": random.uniform(1, 2)
                },
                "layer": 0,
                "childNodes": [],
                "isGroup": False,
                "familyId": industrial_family["id"],
                "familyName": industrial_family["name"]
            }
            nodes.append(node)
            industrial_family["nodeIds"].append(node_id)
            industrial_family["stats"]["totalPower"] += power
            industrial_family["stats"]["nodeCount"] += 1
            industrial_family["stats"]["childTypes"]["factory"] = industrial_family["stats"]["childTypes"].get("factory", 0) + 1
    
    families.append(industrial_family)
    
    # 3. RESIDENTIAL DISTRICT (Top-right)
    print("Generating residential district...")
    residential_family = {
        "id": f"family_{generate_id()}",
        "name": "Residential District",
        "nodeIds": [],
        "centerPosition": {"x": districts["residential"]["center"][0], "y": districts["residential"]["center"][1]},
        "stats": {"totalPower": 0, "nodeCount": 0, "childTypes": {}}
    }
    
    # Houses - MASSIVELY SPACED NEIGHBORHOOD (2x more)
    for block in range(3):
        block_x = districts["residential"]["center"][0] - 400 + (block % 2) * 400
        block_y = districts["residential"]["center"][1] - 200 + (block // 2) * 300
        
        for house in range(6):  # 6 houses per block
            house_x = block_x + (house % 3) * 120
            house_y = block_y + (house // 3) * 100
            power = random.randint(5, 20)
            node_id = generate_id()
            node = {
                "id": node_id,
                "type": "residential",
                "x": house_x,
                "y": house_y,
                "name": f"House {block * 6 + house + 1}",
                "status": "active",
                "settings": {
                    "power": power,
                    "type": "residential",
                    "inertia": random.uniform(0.5, 2),
                    "friction": random.uniform(0.2, 0.8)
                },
                "layer": 0,
                "childNodes": [],
                "isGroup": False,
                "familyId": residential_family["id"],
                "familyName": residential_family["name"]
            }
            nodes.append(node)
            residential_family["nodeIds"].append(node_id)
            residential_family["stats"]["totalPower"] += power
            residential_family["stats"]["nodeCount"] += 1
            residential_family["stats"]["childTypes"]["residential"] = residential_family["stats"]["childTypes"].get("residential", 0) + 1
    
    families.append(residential_family)
    
    # 4. COMMERCIAL DISTRICT (Bottom-center)
    print("Generating commercial district...")
    commercial_family = {
        "id": f"family_{generate_id()}",
        "name": "Commercial Center",
        "nodeIds": [],
        "centerPosition": {"x": districts["commercial"]["center"][0], "y": districts["commercial"]["center"][1]},
        "stats": {"totalPower": 0, "nodeCount": 0, "childTypes": {}}
    }
    
    # Commercial buildings - MASSIVELY SPACED GRID (2x more)
    for row in range(2):
        for col in range(3):
            x = districts["commercial"]["center"][0] - 400 + col * 400
            y = districts["commercial"]["center"][1] - 100 + row * 200
            power = random.randint(200, 600)
            node_id = generate_id()
            node = {
                "id": node_id,
                "type": "commercial-building",
                "x": x,
                "y": y,
                "name": f"Office {row * 3 + col + 1}",
                "status": "active",
                "settings": {
                    "power": power,
                    "type": "commercial-building",
                    "inertia": random.uniform(1, 3),
                    "friction": random.uniform(0.5, 1.5)
                },
                "layer": 0,
                "childNodes": [],
                "isGroup": False,
                "familyId": commercial_family["id"],
                "familyName": commercial_family["name"]
            }
            nodes.append(node)
            commercial_family["nodeIds"].append(node_id)
            commercial_family["stats"]["totalPower"] += power
            commercial_family["stats"]["nodeCount"] += 1
            commercial_family["stats"]["childTypes"]["commercial-building"] = commercial_family["stats"]["childTypes"].get("commercial-building", 0) + 1
    
    families.append(commercial_family)
    
    # 5. STORAGE DISTRICT (Right)
    print("Generating storage district...")
    storage_family = {
        "id": f"family_{generate_id()}",
        "name": "Energy Storage Complex",
        "nodeIds": [],
        "centerPosition": {"x": districts["storage"]["center"][0], "y": districts["storage"]["center"][1]},
        "stats": {"totalPower": 0, "nodeCount": 0, "childTypes": {}}
    }
    
    # Battery storage - MASSIVELY SPACED (2x more)
    for row in range(2):
        for col in range(2):
            x = districts["storage"]["center"][0] - 200 + col * 400
            y = districts["storage"]["center"][1] - 100 + row * 200
            power = random.randint(2000, 5000)
            soc = random.uniform(0.3, 0.9)
            node_id = generate_id()
            node = {
                "id": node_id,
                "type": "battery-storage",
                "x": x,
                "y": y,
                "name": f"Battery {row * 2 + col + 1}",
                "status": "active",
                "settings": {
                    "power": power,
                    "type": "battery-storage",
                    "inertia": random.uniform(2, 5),
                    "friction": random.uniform(1, 2),
                    "soc": soc
                },
                "layer": 0,
                "childNodes": [],
                "isGroup": False,
                "familyId": storage_family["id"],
                "familyName": storage_family["name"]
            }
            nodes.append(node)
            storage_family["nodeIds"].append(node_id)
            storage_family["stats"]["totalPower"] += power
            storage_family["stats"]["nodeCount"] += 1
            storage_family["stats"]["childTypes"]["battery-storage"] = storage_family["stats"]["childTypes"].get("battery-storage", 0) + 1
    
    families.append(storage_family)
    
    # 6. GRID INFRASTRUCTURE (Central distribution)
    print("Generating grid infrastructure...")
    grid_family = {
        "id": f"family_{generate_id()}",
        "name": "Grid Infrastructure",
        "nodeIds": [],
        "centerPosition": {"x": CITY_WIDTH // 2, "y": CITY_HEIGHT // 2},
        "stats": {"totalPower": 0, "nodeCount": 0, "childTypes": {}}
    }
    
    # Substations - MASSIVELY SPACED (2x more)
    substation_positions = [
        (CITY_WIDTH // 2, CITY_HEIGHT // 2),  # Central
        (CITY_WIDTH // 2 - 800, CITY_HEIGHT // 2),  # West
        (CITY_WIDTH // 2 + 800, CITY_HEIGHT // 2),  # East
    ]
    
    for i, (x, y) in enumerate(substation_positions):
        power = random.randint(8000, 15000)
        node_id = generate_id()
        node = {
            "id": node_id,
            "type": "grid",
            "x": x,
            "y": y,
            "name": f"Substation {i + 1}",
            "status": "active",
            "settings": {
                "power": power,
                "type": "grid",
                "inertia": random.uniform(3, 8),
                "friction": random.uniform(1, 3)
            },
            "layer": 0,
            "childNodes": [],
            "isGroup": False,
            "familyId": grid_family["id"],
            "familyName": grid_family["name"]
        }
        nodes.append(node)
        grid_family["nodeIds"].append(node_id)
        grid_family["stats"]["totalPower"] += power
        grid_family["stats"]["nodeCount"] += 1
        grid_family["stats"]["childTypes"]["grid"] = grid_family["stats"]["childTypes"].get("grid", 0) + 1
    
    families.append(grid_family)
    
    # 7. CREATE SMART CONNECTIONS
    print("Generating smart grid connections...")
    
    # Connect power generation to substations
    power_nodes = [n for n in nodes if n["familyId"] == power_family["id"]]
    grid_nodes = [n for n in nodes if n["familyId"] == grid_family["id"]]
    
    for power_node in power_nodes:
        nearest_substation = min(grid_nodes, key=lambda s: 
            math.sqrt((power_node["x"] - s["x"])**2 + (power_node["y"] - s["y"])**2))
        
        connection_id = generate_id()
        connection = {
            "id": connection_id,
            "from": power_node["id"],
            "to": nearest_substation["id"],
            "power": random.randint(2000, 8000),
            "status": "active",
            "resistance": random.uniform(0.1, 0.5),
            "maxPower": random.randint(8000, 20000)
        }
        connections.append(connection)
    
    # Connect substations to districts
    for family in families:
        if family["id"] != power_family["id"] and family["id"] != grid_family["id"]:
            family_nodes = [n for n in nodes if n["familyId"] == family["id"]]
            if family_nodes:
                nearest_substation = min(grid_nodes, key=lambda s: 
                    math.sqrt((family["centerPosition"]["x"] - s["x"])**2 + (family["centerPosition"]["y"] - s["y"])**2))
                
                # Connect a few representative nodes
                sample_nodes = random.sample(family_nodes, min(2, len(family_nodes)))
                for node in sample_nodes:
                    connection_id = generate_id()
                    connection = {
                        "id": connection_id,
                        "from": nearest_substation["id"],
                        "to": node["id"],
                        "power": random.randint(500, 2000),
                        "status": "active",
                        "resistance": random.uniform(0.5, 1.5),
                        "maxPower": random.randint(2000, 8000)
                    }
                    connections.append(connection)
    
    # 8. CREATE HIERARCHICAL LAYERS
    layers = [
        {
            "layer": 0,
            "name": "Individual Components",
            "description": "Base layer with individual energy components",
            "nodeCount": len(nodes)
        },
        {
            "layer": 1,
            "name": "District Families",
            "description": "Grouped components by city districts",
            "nodeCount": len(families)
        }
    ]
    
    # 9. CREATE FINAL EXPORT DATA
    export_data = {
        "version": "1.0",
        "metadata": {
            "name": "Compact City Energy Network",
            "description": "Well-spaced 50-node city energy infrastructure simulation",
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
            "x": -CITY_WIDTH // 24,
            "y": -CITY_HEIGHT // 24,
            "zoom": 0.05
        },
        "settings": {
            "simulationRunning": False,
            "currentLayer": 0
        }
    }
    
    print(f"Generated compact city with {len(nodes)} nodes, {len(connections)} connections, and {len(families)} families")
    print(f"City dimensions: {CITY_WIDTH}x{CITY_HEIGHT}")
    
    return export_data

if __name__ == "__main__":
    # Generate the compact city
    compact_city = generate_compact_city()
    
    # Save to file
    with open('compact_city_50_nodes.json', 'w') as f:
        json.dump(compact_city, f, indent=2)
    
    print("Compact city saved to compact_city_50_nodes.json")
