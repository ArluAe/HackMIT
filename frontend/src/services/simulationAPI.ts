import { Node, Connection } from '@/types/simulation';
import { io, Socket } from 'socket.io-client';

// Backend API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// WebSocket connection
let socket: Socket | null = null;

export interface ReactFlowGraph {
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: Node;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    type?: string;
    animated?: boolean;
    style?: any;
  }>;
}

export interface SimulationUpdate {
  session_id: string;
  step: number;
  total_steps: number;
  progress: number;
  grid_frequency: number;
  total_inertia: number;
  graph: ReactFlowGraph;
  timestamp: number;
}

export class SimulationAPI {
  private static instance: SimulationAPI;
  private currentSessionId: string | null = null;

  private constructor() {}

  public static getInstance(): SimulationAPI {
    if (!SimulationAPI.instance) {
      SimulationAPI.instance = new SimulationAPI();
    }
    return SimulationAPI.instance;
  }

  // Session management
  async createSession(): Promise<{ session_id: string; initial_state: any }> {
    const response = await fetch(`${API_BASE_URL}/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }

    const result = await response.json();
    this.currentSessionId = result.session_id;
    return result;
  }

  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  setCurrentSessionId(sessionId: string) {
    this.currentSessionId = sessionId;
  }

  // Graph submission
  async submitGraph(nodes: Node[], connections: Connection[], sessionId?: string): Promise<any> {
    const targetSessionId = sessionId || this.currentSessionId;
    if (!targetSessionId) {
      throw new Error('No active session. Create a session first.');
    }

    // Convert internal format to React Flow format
    const reactFlowGraph: ReactFlowGraph = {
      nodes: nodes.map(node => ({
        id: node.id,
        type: 'energyNode',
        position: { x: node.x, y: node.y },
        data: node
      })),
      edges: connections.map(conn => ({
        id: conn.id,
        source: conn.from,
        target: conn.to,
        type: 'smoothstep',
        animated: conn.status === 'active',
        style: {
          stroke: conn.status === 'active' ? '#10b981' : '#6b7280',
          strokeWidth: 3,
        }
      }))
    };

    const response = await fetch(`${API_BASE_URL}/graph/submit/${targetSessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reactFlowGraph),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit graph: ${response.statusText}`);
    }

    return response.json();
  }

  // Get current graph
  async getGraph(sessionId?: string): Promise<{ graph: ReactFlowGraph; metadata: any }> {
    const targetSessionId = sessionId || this.currentSessionId;
    if (!targetSessionId) {
      throw new Error('No active session. Create a session first.');
    }

    const response = await fetch(`${API_BASE_URL}/graph/get/${targetSessionId}`);

    if (!response.ok) {
      throw new Error(`Failed to get graph: ${response.statusText}`);
    }

    return response.json();
  }

  // Simulation control
  async startSimulation(options: {
    duration?: number;
    timestep?: number;
    temperature?: number;
    time_of_day?: number;
  } = {}, sessionId?: string): Promise<any> {
    const targetSessionId = sessionId || this.currentSessionId;
    if (!targetSessionId) {
      throw new Error('No active session. Create a session first.');
    }

    const response = await fetch(`${API_BASE_URL}/simulation/start/${targetSessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        duration: 60,
        timestep: 0.1,
        temperature: 20.0,
        time_of_day: 0.5,
        ...options
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to start simulation: ${response.statusText}`);
    }

    return response.json();
  }

  // WebSocket connection management
  connectWebSocket(): Socket {
    if (socket?.connected) {
      return socket;
    }

    socket = io(API_BASE_URL, {
      autoConnect: false,
    });

    socket.on('connect', () => {
      console.log('Connected to simulation server');
      if (this.currentSessionId) {
        socket?.emit('join_session', { session_id: this.currentSessionId });
      }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from simulation server');
    });

    socket.on('connection_established', (data) => {
      console.log('Connection established:', data);
    });

    socket.on('joined_session', (data) => {
      console.log('Joined session:', data);
    });

    socket.connect();
    return socket;
  }

  disconnectWebSocket() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  }

  // Event listeners for simulation updates
  onSimulationUpdate(callback: (data: SimulationUpdate) => void): void {
    if (!socket) {
      this.connectWebSocket();
    }
    socket?.on('simulation_update', callback);
  }

  onSimulationComplete(callback: (data: any) => void): void {
    if (!socket) {
      this.connectWebSocket();
    }
    socket?.on('simulation_complete', callback);
  }

  onSimulationError(callback: (data: any) => void): void {
    if (!socket) {
      this.connectWebSocket();
    }
    socket?.on('simulation_error', callback);
  }

  removeAllListeners(): void {
    socket?.removeAllListeners();
  }

  // Utility methods
  convertReactFlowToInternal(reactFlowGraph: ReactFlowGraph): { nodes: Node[]; connections: Connection[] } {
    const nodes = reactFlowGraph.nodes.map(rfNode => rfNode.data);
    const connections = reactFlowGraph.edges.map(rfEdge => ({
      id: rfEdge.id,
      from: rfEdge.source,
      to: rfEdge.target,
      power: 100, // Default power
      status: (rfEdge.animated ? 'active' : 'inactive') as 'active' | 'inactive'
    }));

    return { nodes, connections };
  }
}

// Export singleton instance
export const simulationAPI = SimulationAPI.getInstance();