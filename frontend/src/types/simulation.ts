export interface Node {
  id: string;
  type: 'solar-generator' | 'wind-generator' | 'natural-gas-generator' | 'coal-generator' | 'hydroelectric-generator' | 'factory' | 'commercial-building' | 'residential' | 'battery-storage' | 'grid' | 'group';
  x: number;
  y: number;
  name: string;
  status: 'active' | 'inactive' | 'charging' | 'discharging';

  // Node settings dictionary
  settings: {
    power: number;
    type: string;
    inertia: number;
    friction: number;
  };

  // Hierarchical properties
  layer: number; // 0 = base layer, 1 = neighborhood, 2 = city, etc.
  parentNode?: string; // ID of parent group node
  childNodes: string[]; // IDs of child nodes
  isGroup: boolean; // Whether this represents a group
  familyId?: string; // ID of the family this node belongs to
  familyName?: string; // Display name for the family
  groupStats?: {
    totalPower: number;
    nodeCount: number;
    activeConnections: number;
    childTypes: Record<string, number>; // Count of each child node type
  };
}

export interface Connection {
  id: string;
  from: string;
  to: string;
  power: number;
  status: 'active' | 'inactive';
  resistance: number;
  maxPower: number;
}

export interface SimulationState {
  nodes: Node[];
  connections: Connection[];
  selectedNode: string | null;
  isSimulationRunning: boolean;
  draggedNode: string | null;
  isConnecting: boolean;
  connectionStart: string | null;
}

export interface GraphExportData {
  version: string;
  metadata: {
    name: string;
    description: string;
    createdAt: string;
    author: string;
  };
  simulation: {
    nodes: Node[];
    connections: Connection[];
    families: FamilyGroup[];
    layers: LayerInfo[];
  };
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  settings: {
    simulationRunning: boolean;
    currentLayer: number;
  };
}

export interface FamilyGroup {
  id: string;
  name: string;
  nodeIds: string[];
  centerPosition: { x: number; y: number };
  stats: {
    totalPower: number;
    nodeCount: number;
    childTypes: Record<string, number>;
  };
}

export interface LayerInfo {
  layer: number;
  name: string;
  description: string;
  nodeCount: number;
}
