export interface Node {
  id: string;
  type: 'generator' | 'consumer' | 'storage' | 'grid' | 'group';
  x: number;
  y: number;
  name: string;
  power: number;
  status: 'active' | 'inactive' | 'charging' | 'discharging';

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
