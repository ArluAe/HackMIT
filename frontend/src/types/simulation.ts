export interface Node {
  id: string;
  type: 'generator' | 'consumer' | 'storage' | 'grid';
  x: number;
  y: number;
  name: string;
  power: number;
  status: 'active' | 'inactive' | 'charging' | 'discharging';
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
