#!/usr/bin/env python3
"""
Generate a comprehensive, well-organized city energy network in GridForge format
with proper hierarchical families and strategic positioning
"""
import json
import random
import math
from datetime import datetime

def generate_city_network():
    """Generate a large, well-organized city energy network with proper families"""
    
    # Set random seed for reproducibility
    random.seed(42)
    
    nodes = []
    connections = []
    families = []
    
    # Generate unique IDs
    def generate_id():
        return str(random.randint(1000000000000, 9999999999999))
    
    # City layout parameters - MUCH LARGER for better spacing
    CITY_WIDTH = 4000
    CITY_HEIGHT = 3000
    PADDING = 200
    
    # Define city districts and their positioning with MUCH MORE SPACING
    districts = {
        "power_generation": {
            "center": (CITY_WIDTH // 2, PADDING + 400),
            "size": (CITY_WIDTH - 2 * PADDING, 600),
            "description": "Main power generation district"
        },
        "industrial": {
            "center": (PADDING + 600, CITY_HEIGHT // 2),
            "size": (800, CITY_HEIGHT - 2 * PADDING),
            "description": "Industrial zone"
        },
        "residential_north": {
            "center": (CITY_WIDTH // 2 - 600, CITY_HEIGHT // 2 - 400),
            "size": (1200, 600),
            "description": "North residential district"
        },
        "residential_south": {
            "center": (CITY_WIDTH // 2 + 600, CITY_HEIGHT // 2 + 400),
            "size": (1200, 600),
            "description": "South residential district"
        },
        "commercial_center": {
            "center": (CITY_WIDTH // 2, CITY_HEIGHT // 2),
            "size": (800, 400),
            "description": "Central business district"
        },
        "storage_district": {
            "center": (CITY_WIDTH - PADDING - 400, CITY_HEIGHT // 2),
            "size": (600, 800),
            "description": "Energy storage facilities"
        }
    }
    
    # 1. POWER GENERATION DISTRICT (Top of city)
    print("Generating power generation district...")
    power_generation_family = {
        "id": f"family_{generate_id()}",
        "name": "Power Generation Complex",
        "nodeIds": [],
        "centerPosition": {"x": districts["power_generation"]["center"][0], "y": districts["power_generation"]["center"][1]},
        "stats": {"totalPower": 0, "nodeCount": 0, "childTypes": {}}
    }
    
    # Major power plants - MUCH MORE SPACED
    major_plants = [
        {"type": "nuclear-generator", "power": 15000, "name": "Nuclear Plant Alpha", "x": districts["power_generation"]["center"][0] - 600, "y": districts["power_generation"]["center"][1] - 100},
        {"type": "nuclear-generator", "power": 12000, "name": "Nuclear Plant Beta", "x": districts["power_generation"]["center"][0] + 600, "y": districts["power_generation"]["center"][1] - 100},
        {"type": "coal-generator", "power": 8000, "name": "Main Coal Plant", "x": districts["power_generation"]["center"][0] - 200, "y": districts["power_generation"]["center"][1] + 100},
        {"type": "hydro-generator", "power": 6000, "name": "Hydroelectric Dam", "x": districts["power_generation"]["center"][0] + 200, "y": districts["power_generation"]["center"][1] + 100},
    ]
    
    for plant in major_plants:
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
            "familyId": power_generation_family["id"],
            "familyName": power_generation_family["name"]
        }
        nodes.append(node)
        power_generation_family["nodeIds"].append(node_id)
        power_generation_family["stats"]["totalPower"] += plant["power"]
        power_generation_family["stats"]["nodeCount"] += 1
        power_generation_family["stats"]["childTypes"][plant["type"]] = power_generation_family["stats"]["childTypes"].get(plant["type"], 0) + 1
    
    # Solar farms (arranged in rows) - MUCH MORE SPACED
    for row in range(3):
        for col in range(8):
            x = districts["power_generation"]["center"][0] - 800 + col * 200
            y = districts["power_generation"]["center"][1] + 300 + row * 150
            power = random.randint(800, 2000)
            node_id = generate_id()
            node = {
                "id": node_id,
                "type": "solar-generator",
                "x": x,
                "y": y,
                "name": f"Solar Farm {row * 8 + col + 1}",
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
                "familyId": power_generation_family["id"],
                "familyName": power_generation_family["name"]
            }
            nodes.append(node)
            power_generation_family["nodeIds"].append(node_id)
            power_generation_family["stats"]["totalPower"] += power
            power_generation_family["stats"]["nodeCount"] += 1
            power_generation_family["stats"]["childTypes"]["solar-generator"] = power_generation_family["stats"]["childTypes"].get("solar-generator", 0) + 1
    
    families.append(power_generation_family)
    
    # 2. INDUSTRIAL DISTRICT (Left side)
    print("Generating industrial district...")
    industrial_family = {
        "id": f"family_{generate_id()}",
        "name": "Industrial Zone",
        "nodeIds": [],
        "centerPosition": {"x": districts["industrial"]["center"][0], "y": districts["industrial"]["center"][1]},
        "stats": {"totalPower": 0, "nodeCount": 0, "childTypes": {}}
    }
    
    # Large factories (arranged in grid) - MUCH MORE SPACED
    for row in range(4):
        for col in range(3):
            x = districts["industrial"]["center"][0] - 300 + col * 200
            y = districts["industrial"]["center"][1] - 400 + row * 200
            power = random.randint(2000, 8000)
            node_id = generate_id()
            node = {
                "id": node_id,
                "type": "factory",
                "x": x,
                "y": y,
                "name": f"Factory {row * 3 + col + 1}",
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
    
    # 3. NORTH RESIDENTIAL DISTRICT
    print("Generating north residential district...")
    north_residential_family = {
        "id": f"family_{generate_id()}",
        "name": "North Residential District",
        "nodeIds": [],
        "centerPosition": {"x": districts["residential_north"]["center"][0], "y": districts["residential_north"]["center"][1]},
        "stats": {"totalPower": 0, "nodeCount": 0, "childTypes": {}}
    }
    
    # Residential houses (arranged in neighborhood blocks) - MUCH MORE SPACED
    for block in range(4):
        block_x = districts["residential_north"]["center"][0] - 400 + (block % 2) * 400
        block_y = districts["residential_north"]["center"][1] - 200 + (block // 2) * 200
        
        for house in range(12):  # 12 houses per block
            house_x = block_x + (house % 4) * 80
            house_y = block_y + (house // 4) * 60
            power = random.randint(3, 15)
            node_id = generate_id()
            node = {
                "id": node_id,
                "type": "residential",
                "x": house_x,
                "y": house_y,
                "name": f"House {block * 12 + house + 1}",
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
                "familyId": north_residential_family["id"],
                "familyName": north_residential_family["name"]
            }
            nodes.append(node)
            north_residential_family["nodeIds"].append(node_id)
            north_residential_family["stats"]["totalPower"] += power
            north_residential_family["stats"]["nodeCount"] += 1
            north_residential_family["stats"]["childTypes"]["residential"] = north_residential_family["stats"]["childTypes"].get("residential", 0) + 1
    
    families.append(north_residential_family)
    
    # 4. SOUTH RESIDENTIAL DISTRICT
    print("Generating south residential district...")
    south_residential_family = {
        "id": f"family_{generate_id()}",
        "name": "South Residential District",
        "nodeIds": [],
        "centerPosition": {"x": districts["residential_south"]["center"][0], "y": districts["residential_south"]["center"][1]},
        "stats": {"totalPower": 0, "nodeCount": 0, "childTypes": {}}
    }
    
    # Residential houses (arranged in neighborhood blocks) - MUCH MORE SPACED
    for block in range(4):
        block_x = districts["residential_south"]["center"][0] - 400 + (block % 2) * 400
        block_y = districts["residential_south"]["center"][1] - 200 + (block // 2) * 200
        
        for house in range(12):  # 12 houses per block
            house_x = block_x + (house % 4) * 80
            house_y = block_y + (house // 4) * 60
            power = random.randint(3, 15)
            node_id = generate_id()
            node = {
                "id": node_id,
                "type": "residential",
                "x": house_x,
                "y": house_y,
                "name": f"House {block * 12 + house + 1}",
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
                "familyId": south_residential_family["id"],
                "familyName": south_residential_family["name"]
            }
            nodes.append(node)
            south_residential_family["nodeIds"].append(node_id)
            south_residential_family["stats"]["totalPower"] += power
            south_residential_family["stats"]["nodeCount"] += 1
            south_residential_family["stats"]["childTypes"]["residential"] = south_residential_family["stats"]["childTypes"].get("residential", 0) + 1
    
    families.append(south_residential_family)
    
    # 5. COMMERCIAL CENTER
    print("Generating commercial center...")
    commercial_family = {
        "id": f"family_{generate_id()}",
        "name": "Central Business District",
        "nodeIds": [],
        "centerPosition": {"x": districts["commercial_center"]["center"][0], "y": districts["commercial_center"]["center"][1]},
        "stats": {"totalPower": 0, "nodeCount": 0, "childTypes": {}}
    }
    
    # Commercial buildings (arranged in grid) - MUCH MORE SPACED
    for row in range(3):
        for col in range(4):
            x = districts["commercial_center"]["center"][0] - 300 + col * 200
            y = districts["commercial_center"]["center"][1] - 150 + row * 100
            power = random.randint(100, 500)
            node_id = generate_id()
            node = {
                "id": node_id,
                "type": "commercial-building",
                "x": x,
                "y": y,
                "name": f"Office Building {row * 4 + col + 1}",
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
    
    # 6. STORAGE DISTRICT (Right side)
    print("Generating storage district...")
    storage_family = {
        "id": f"family_{generate_id()}",
        "name": "Energy Storage Complex",
        "nodeIds": [],
        "centerPosition": {"x": districts["storage_district"]["center"][0], "y": districts["storage_district"]["center"][1]},
        "stats": {"totalPower": 0, "nodeCount": 0, "childTypes": {}}
    }
    
    # Battery storage facilities (arranged in grid) - MUCH MORE SPACED
    for row in range(3):
        for col in range(2):
            x = districts["storage_district"]["center"][0] - 150 + col * 300
            y = districts["storage_district"]["center"][1] - 200 + row * 200
            power = random.randint(1000, 3000)
            soc = random.uniform(0.3, 0.9)
            node_id = generate_id()
            node = {
                "id": node_id,
                "type": "battery-storage",
                "x": x,
                "y": y,
                "name": f"Battery Storage {row * 2 + col + 1}",
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
    
    # 7. GRID INFRASTRUCTURE (Substations and distribution)
    print("Generating grid infrastructure...")
    grid_family = {
        "id": f"family_{generate_id()}",
        "name": "Grid Infrastructure",
        "nodeIds": [],
        "centerPosition": {"x": CITY_WIDTH // 2, "y": CITY_HEIGHT // 2},
        "stats": {"totalPower": 0, "nodeCount": 0, "childTypes": {}}
    }
    
    # Major substations (strategically placed) - MUCH MORE SPACED
    substation_positions = [
        (CITY_WIDTH // 2, CITY_HEIGHT // 2),  # Central
        (CITY_WIDTH // 2 - 600, CITY_HEIGHT // 2),  # West
        (CITY_WIDTH // 2 + 600, CITY_HEIGHT // 2),  # East
        (CITY_WIDTH // 2, CITY_HEIGHT // 2 - 400),  # North
        (CITY_WIDTH // 2, CITY_HEIGHT // 2 + 400),  # South
    ]
    
    for i, (x, y) in enumerate(substation_positions):
        power = random.randint(5000, 15000)
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
    
    # 8. CREATE CONNECTIONS (Smart grid connections)
    print("Generating smart grid connections...")
    
    # Connect power generation to major substations
    power_nodes = [n for n in nodes if n["familyId"] == power_generation_family["id"]]
    grid_nodes = [n for n in nodes if n["familyId"] == grid_family["id"]]
    
    for power_node in power_nodes:
        # Connect to nearest substation
        nearest_substation = min(grid_nodes, key=lambda s: 
            math.sqrt((power_node["x"] - s["x"])**2 + (power_node["y"] - s["y"])**2))
        
        connection_id = generate_id()
        connection = {
            "id": connection_id,
            "from": power_node["id"],
            "to": nearest_substation["id"],
            "power": random.randint(1000, 5000),
            "status": "active",
            "resistance": random.uniform(0.1, 0.5),
            "maxPower": random.randint(5000, 15000)
        }
        connections.append(connection)
    
    # Connect substations to each other
    for i in range(len(grid_nodes)):
        for j in range(i + 1, len(grid_nodes)):
            if random.random() < 0.6:  # 60% chance of connection
                connection_id = generate_id()
                connection = {
                    "id": connection_id,
                    "from": grid_nodes[i]["id"],
                    "to": grid_nodes[j]["id"],
                    "power": random.randint(2000, 8000),
                    "status": "active",
                    "resistance": random.uniform(0.2, 0.8),
                    "maxPower": random.randint(8000, 20000)
                }
                connections.append(connection)
    
    # Connect substations to districts
    for family in families:
        if family["id"] != power_generation_family["id"] and family["id"] != grid_family["id"]:
            family_nodes = [n for n in nodes if n["familyId"] == family["id"]]
            if family_nodes:
                # Connect to nearest substation
                nearest_substation = min(grid_nodes, key=lambda s: 
                    math.sqrt((family["centerPosition"]["x"] - s["x"])**2 + (family["centerPosition"]["y"] - s["y"])**2))
                
                # Connect a few representative nodes from each family
                sample_nodes = random.sample(family_nodes, min(3, len(family_nodes)))
                for node in sample_nodes:
                    connection_id = generate_id()
                    connection = {
                        "id": connection_id,
                        "from": nearest_substation["id"],
                        "to": node["id"],
                        "power": random.randint(100, 1000),
                        "status": "active",
                        "resistance": random.uniform(0.5, 1.5),
                        "maxPower": random.randint(1000, 5000)
                    }
                    connections.append(connection)
    
    # 9. CREATE HIERARCHICAL LAYERS
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
    
    # 10. CREATE FINAL EXPORT DATA
    export_data = {
        "version": "1.0",
        "metadata": {
            "name": "MegaCity Energy Network",
            "description": "Comprehensive, well-organized city energy infrastructure simulation",
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
            "x": -CITY_WIDTH // 8,
            "y": -CITY_HEIGHT // 8,
            "zoom": 0.15
        },
        "settings": {
            "simulationRunning": False,
            "currentLayer": 0
        }
    }
    
    print(f"Generated city network with {len(nodes)} nodes, {len(connections)} connections, and {len(families)} families")
    print(f"City dimensions: {CITY_WIDTH}x{CITY_HEIGHT}")
    
    return export_data

if __name__ == "__main__":
    # Generate the city network
    city_network = generate_city_network()
    
    # Save to file
    with open('mega_city_energy_network.json', 'w') as f:
        json.dump(city_network, f, indent=2)
    
    print("City network saved to mega_city_energy_network.json")