#!/usr/bin/env python3
"""
Generate a large, well-spaced city energy network with 500 nodes
Families are clearly separated and nodes don't overlap
"""
import json
import random
import math
from datetime import datetime

def generate_large_city():
    """Generate a large city with 500 nodes, well-spaced families"""
    
    # Set random seed for reproducibility
    random.seed(42)
    
    nodes = []
    connections = []
    families = []
    
    # Generate unique IDs
    def generate_id():
        return str(random.randint(1000000000000, 9999999999999))
    
    # City layout parameters - MASSIVE canvas for excellent spacing
    CITY_WIDTH = 16000
    CITY_HEIGHT = 12000
    PADDING = 800
    
    # Define city districts with MASSIVE SPACING between families (4x more)
    districts = {
        "power_generation": {
            "center": (CITY_WIDTH // 2, PADDING + 1600),
            "size": (CITY_WIDTH - 2 * PADDING, 1200),
            "description": "Power Generation District"
        },
        "industrial_north": {
            "center": (PADDING + 2000, CITY_HEIGHT // 2 - 2400),
            "size": (1600, 1000),
            "description": "North Industrial Zone"
        },
        "industrial_south": {
            "center": (PADDING + 2000, CITY_HEIGHT // 2 + 2400),
            "size": (1600, 1000),
            "description": "South Industrial Zone"
        },
        "residential_northwest": {
            "center": (CITY_WIDTH // 2 - 3200, CITY_HEIGHT // 2 - 1600),
            "size": (1200, 800),
            "description": "Northwest Residential"
        },
        "residential_northeast": {
            "center": (CITY_WIDTH // 2 + 3200, CITY_HEIGHT // 2 - 1600),
            "size": (1200, 800),
            "description": "Northeast Residential"
        },
        "residential_southwest": {
            "center": (CITY_WIDTH // 2 - 3200, CITY_HEIGHT // 2 + 1600),
            "size": (1200, 800),
            "description": "Southwest Residential"
        },
        "residential_southeast": {
            "center": (CITY_WIDTH // 2 + 3200, CITY_HEIGHT // 2 + 1600),
            "size": (1200, 800),
            "description": "Southeast Residential"
        },
        "commercial_center": {
            "center": (CITY_WIDTH // 2, CITY_HEIGHT // 2),
            "size": (1600, 800),
            "description": "Central Business District"
        },
        "storage_north": {
            "center": (CITY_WIDTH - PADDING - 1600, CITY_HEIGHT // 2 - 1600),
            "size": (1000, 800),
            "description": "North Storage District"
        },
        "storage_south": {
            "center": (CITY_WIDTH - PADDING - 1600, CITY_HEIGHT // 2 + 1600),
            "size": (1000, 800),
            "description": "South Storage District"
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
    major_plants = [
        {"type": "nuclear-generator", "power": 20000, "name": "Nuclear Plant Alpha", "x": districts["power_generation"]["center"][0] - 1600, "y": districts["power_generation"]["center"][1] - 200},
        {"type": "nuclear-generator", "power": 18000, "name": "Nuclear Plant Beta", "x": districts["power_generation"]["center"][0] + 1600, "y": districts["power_generation"]["center"][1] - 200},
        {"type": "coal-generator", "power": 12000, "name": "Main Coal Plant", "x": districts["power_generation"]["center"][0] - 800, "y": districts["power_generation"]["center"][1] + 200},
        {"type": "coal-generator", "power": 10000, "name": "Secondary Coal Plant", "x": districts["power_generation"]["center"][0] + 800, "y": districts["power_generation"]["center"][1] + 200},
        {"type": "hydro-generator", "power": 8000, "name": "Hydro Dam Alpha", "x": districts["power_generation"]["center"][0] - 400, "y": districts["power_generation"]["center"][1] + 400},
        {"type": "hydro-generator", "power": 6000, "name": "Hydro Dam Beta", "x": districts["power_generation"]["center"][0] + 400, "y": districts["power_generation"]["center"][1] + 400},
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
            "familyId": power_family["id"],
            "familyName": power_family["name"]
        }
        nodes.append(node)
        power_family["nodeIds"].append(node_id)
        power_family["stats"]["totalPower"] += plant["power"]
        power_family["stats"]["nodeCount"] += 1
        power_family["stats"]["childTypes"][plant["type"]] = power_family["stats"]["childTypes"].get(plant["type"], 0) + 1
    
    # Solar farms - MASSIVELY SPACED GRID (2x more)
    for row in range(4):
        for col in range(12):
            x = districts["power_generation"]["center"][0] - 2400 + col * 400
            y = districts["power_generation"]["center"][1] + 600 + row * 240
            power = random.randint(1000, 2500)
            node_id = generate_id()
            node = {
                "id": node_id,
                "type": "solar-generator",
                "x": x,
                "y": y,
                "name": f"Solar Farm {row * 12 + col + 1}",
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
    
    # 2. NORTH INDUSTRIAL DISTRICT
    print("Generating north industrial district...")
    north_industrial_family = {
        "id": f"family_{generate_id()}",
        "name": "North Industrial Zone",
        "nodeIds": [],
        "centerPosition": {"x": districts["industrial_north"]["center"][0], "y": districts["industrial_north"]["center"][1]},
        "stats": {"totalPower": 0, "nodeCount": 0, "childTypes": {}}
    }
    
    # Factories - MASSIVELY SPACED GRID (2x more)
    for row in range(5):
        for col in range(4):
            x = districts["industrial_north"]["center"][0] - 600 + col * 400
            y = districts["industrial_north"]["center"][1] - 400 + row * 200
            power = random.randint(3000, 10000)
            node_id = generate_id()
            node = {
                "id": node_id,
                "type": "factory",
                "x": x,
                "y": y,
                "name": f"Factory N{row * 4 + col + 1}",
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
                "familyId": north_industrial_family["id"],
                "familyName": north_industrial_family["name"]
            }
            nodes.append(node)
            north_industrial_family["nodeIds"].append(node_id)
            north_industrial_family["stats"]["totalPower"] += power
            north_industrial_family["stats"]["nodeCount"] += 1
            north_industrial_family["stats"]["childTypes"]["factory"] = north_industrial_family["stats"]["childTypes"].get("factory", 0) + 1
    
    families.append(north_industrial_family)
    
    # 3. SOUTH INDUSTRIAL DISTRICT
    print("Generating south industrial district...")
    south_industrial_family = {
        "id": f"family_{generate_id()}",
        "name": "South Industrial Zone",
        "nodeIds": [],
        "centerPosition": {"x": districts["industrial_south"]["center"][0], "y": districts["industrial_south"]["center"][1]},
        "stats": {"totalPower": 0, "nodeCount": 0, "childTypes": {}}
    }
    
    # Factories - MASSIVELY SPACED GRID (2x more)
    for row in range(5):
        for col in range(4):
            x = districts["industrial_south"]["center"][0] - 600 + col * 400
            y = districts["industrial_south"]["center"][1] - 400 + row * 200
            power = random.randint(3000, 10000)
            node_id = generate_id()
            node = {
                "id": node_id,
                "type": "factory",
                "x": x,
                "y": y,
                "name": f"Factory S{row * 4 + col + 1}",
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
                "familyId": south_industrial_family["id"],
                "familyName": south_industrial_family["name"]
            }
            nodes.append(node)
            south_industrial_family["nodeIds"].append(node_id)
            south_industrial_family["stats"]["totalPower"] += power
            south_industrial_family["stats"]["nodeCount"] += 1
            south_industrial_family["stats"]["childTypes"]["factory"] = south_industrial_family["stats"]["childTypes"].get("factory", 0) + 1
    
    families.append(south_industrial_family)
    
    # 4. RESIDENTIAL DISTRICTS (4 quadrants)
    residential_districts = [
        ("northwest", "Northwest Residential"),
        ("northeast", "Northeast Residential"),
        ("southwest", "Southwest Residential"),
        ("southeast", "Southeast Residential")
    ]
    
    for district_key, district_name in residential_districts:
        print(f"Generating {district_key} residential district...")
        residential_family = {
            "id": f"family_{generate_id()}",
            "name": district_name,
            "nodeIds": [],
            "centerPosition": {"x": districts[f"residential_{district_key}"]["center"][0], "y": districts[f"residential_{district_key}"]["center"][1]},
            "stats": {"totalPower": 0, "nodeCount": 0, "childTypes": {}}
        }
        
        # Houses - MASSIVELY SPACED NEIGHBORHOODS (2x more)
        for block in range(6):
            block_x = districts[f"residential_{district_key}"]["center"][0] - 400 + (block % 3) * 400
            block_y = districts[f"residential_{district_key}"]["center"][1] - 300 + (block // 3) * 200
            
            for house in range(8):  # 8 houses per block
                house_x = block_x + (house % 4) * 100
                house_y = block_y + (house // 4) * 80
                power = random.randint(5, 25)
                node_id = generate_id()
                node = {
                    "id": node_id,
                    "type": "residential",
                    "x": house_x,
                    "y": house_y,
                    "name": f"House {district_key.upper()}{block * 8 + house + 1}",
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
    
    # 5. COMMERCIAL CENTER
    print("Generating commercial center...")
    commercial_family = {
        "id": f"family_{generate_id()}",
        "name": "Central Business District",
        "nodeIds": [],
        "centerPosition": {"x": districts["commercial_center"]["center"][0], "y": districts["commercial_center"]["center"][1]},
        "stats": {"totalPower": 0, "nodeCount": 0, "childTypes": {}}
    }
    
    # Commercial buildings - MASSIVELY SPACED GRID (2x more)
    for row in range(4):
        for col in range(6):
            x = districts["commercial_center"]["center"][0] - 600 + col * 240
            y = districts["commercial_center"]["center"][1] - 300 + row * 160
            power = random.randint(300, 800)
            node_id = generate_id()
            node = {
                "id": node_id,
                "type": "commercial-building",
                "x": x,
                "y": y,
                "name": f"Office {row * 6 + col + 1}",
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
    
    # 6. STORAGE DISTRICTS (North and South)
    storage_districts = [
        ("north", "North Storage District"),
        ("south", "South Storage District")
    ]
    
    for district_key, district_name in storage_districts:
        print(f"Generating {district_key} storage district...")
        storage_family = {
            "id": f"family_{generate_id()}",
            "name": district_name,
            "nodeIds": [],
            "centerPosition": {"x": districts[f"storage_{district_key}"]["center"][0], "y": districts[f"storage_{district_key}"]["center"][1]},
            "stats": {"totalPower": 0, "nodeCount": 0, "childTypes": {}}
        }
        
        # Battery storage - MASSIVELY SPACED GRID (2x more)
        for row in range(3):
            for col in range(4):
                x = districts[f"storage_{district_key}"]["center"][0] - 400 + col * 300
                y = districts[f"storage_{district_key}"]["center"][1] - 200 + row * 200
                power = random.randint(2000, 6000)
                soc = random.uniform(0.3, 0.9)
                node_id = generate_id()
                node = {
                    "id": node_id,
                    "type": "battery-storage",
                    "x": x,
                    "y": y,
                    "name": f"Battery {district_key.upper()}{row * 4 + col + 1}",
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
    
    # 7. GRID INFRASTRUCTURE (Central distribution)
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
        (CITY_WIDTH // 2 - 1200, CITY_HEIGHT // 2),  # West
        (CITY_WIDTH // 2 + 1200, CITY_HEIGHT // 2),  # East
        (CITY_WIDTH // 2, CITY_HEIGHT // 2 - 800),  # North
        (CITY_WIDTH // 2, CITY_HEIGHT // 2 + 800),  # South
        (CITY_WIDTH // 2 - 600, CITY_HEIGHT // 2 - 400),  # Northwest
        (CITY_WIDTH // 2 + 600, CITY_HEIGHT // 2 - 400),  # Northeast
        (CITY_WIDTH // 2 - 600, CITY_HEIGHT // 2 + 400),  # Southwest
        (CITY_WIDTH // 2 + 600, CITY_HEIGHT // 2 + 400),  # Southeast
    ]
    
    for i, (x, y) in enumerate(substation_positions):
        power = random.randint(10000, 20000)
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
    
    # 8. CREATE SMART CONNECTIONS
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
            "power": random.randint(3000, 12000),
            "status": "active",
            "resistance": random.uniform(0.1, 0.5),
            "maxPower": random.randint(12000, 30000)
        }
        connections.append(connection)
    
    # Connect substations to each other
    for i in range(len(grid_nodes)):
        for j in range(i + 1, len(grid_nodes)):
            if random.random() < 0.7:  # 70% chance of connection
                connection_id = generate_id()
                connection = {
                    "id": connection_id,
                    "from": grid_nodes[i]["id"],
                    "to": grid_nodes[j]["id"],
                    "power": random.randint(5000, 15000),
                    "status": "active",
                    "resistance": random.uniform(0.2, 0.8),
                    "maxPower": random.randint(15000, 40000)
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
                sample_nodes = random.sample(family_nodes, min(3, len(family_nodes)))
                for node in sample_nodes:
                    connection_id = generate_id()
                    connection = {
                        "id": connection_id,
                        "from": nearest_substation["id"],
                        "to": node["id"],
                        "power": random.randint(1000, 3000),
                        "status": "active",
                        "resistance": random.uniform(0.5, 1.5),
                        "maxPower": random.randint(3000, 10000)
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
            "name": "Large City Energy Network",
            "description": "Well-spaced 500-node city energy infrastructure simulation",
            "createdAt": datetime.now().isoformat() + "Z",
            "author": "EnergyLens Generator"
        },
        "simulation": {
            "nodes": nodes,
            "connections": connections,
            "families": families,
            "layers": layers
        },
        "viewport": {
            "x": -CITY_WIDTH // 32,
            "y": -CITY_HEIGHT // 32,
            "zoom": 0.025
        },
        "settings": {
            "simulationRunning": False,
            "currentLayer": 0
        }
    }
    
    print(f"Generated large city with {len(nodes)} nodes, {len(connections)} connections, and {len(families)} families")
    print(f"City dimensions: {CITY_WIDTH}x{CITY_HEIGHT}")
    
    return export_data

if __name__ == "__main__":
    # Generate the large city
    large_city = generate_large_city()
    
    # Save to file
    with open('large_city_500_nodes.json', 'w') as f:
        json.dump(large_city, f, indent=2)
    
    print("Large city saved to large_city_500_nodes.json")
