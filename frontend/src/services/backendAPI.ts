// Backend API service for connecting to the Flask backend
export interface BackendSimulationData {
  simulation_id: string;
  run: number;
  step: number;
  total_runs: number;
  total_steps: number;
  progress: number;
  time: number;
  timestamp: number;
  metrics: {
    grid_frequency: number;
    power_imbalance: number;
    total_supply: number;
    total_demand: number;
    solar_generation: number;
    wind_generation: number;
    thermal_generation: number;
    consumer_demand: number;
    business_demand: number;
    battery_power: number;
    battery_levels: number[];
  };
}

export interface SimulationResponse {
  simulation_id: string;
  message: string;
  parameters: {
    nodes: number;
    connections: number;
    total_steps: number;
  };
  polling_url: string;
  status_url: string;
}

export interface SimulationDataResponse {
  simulation_id: string;
  status: 'running' | 'completed' | 'error';
  progress: number;
  current_step: number;
  total_steps: number;
  data_points: BackendSimulationData[];
  total_data_points: number;
}

export interface SimulationStatus {
  simulation_id: string;
  status: 'running' | 'completed' | 'error';
  progress: number;
  current_step: number;
  total_steps: number;
  start_time: number;
  end_time?: number;
  error?: string;
}

class BackendAPIService {
  private baseUrl = 'http://localhost:5000';
  private currentSimulationId: string | null = null;
  private socket: any = null;
  private isSocketConnected = false;

  constructor() {
    console.log('🔧 Backend API service initialized with polling mode');
    // WebSocket disabled due to compatibility issues, using polling only
  }

  onAnalysisStep(callback: (data: any) => void) {
    // WebSocket disabled - polling mode only
    console.log('⚠️ WebSocket events not available, using polling instead');
  }

  onAnalysisComplete(callback: (data: any) => void) {
    // WebSocket disabled - polling mode only
    console.log('⚠️ WebSocket events not available, using polling instead');
  }

  onAnalysisError(callback: (data: any) => void) {
    // WebSocket disabled - polling mode only
    console.log('⚠️ WebSocket events not available, using polling instead');
  }

  removeAllListeners() {
    // WebSocket disabled - nothing to remove
  }

  async startAnalysis(gridForgeData: any): Promise<SimulationResponse> {
    const response = await fetch(`${this.baseUrl}/frontend/start-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gridForgeData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start analysis');
    }

    const result = await response.json();
    this.currentSimulationId = result.simulation_id;
    return result;
  }

  async getSimulationData(simulationId: string, startStep = 0, endStep?: number): Promise<SimulationDataResponse> {
    let url = `${this.baseUrl}/simulation/data/${simulationId}?start=${startStep}`;
    if (endStep !== undefined) {
      url += `&end=${endStep}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get simulation data');
    }

    return await response.json();
  }

  async getSimulationStatus(simulationId: string): Promise<SimulationStatus> {
    const response = await fetch(`${this.baseUrl}/simulation/status/${simulationId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get simulation status');
    }

    return await response.json();
  }

  async getLatestData(simulationId: string, lastStep = 0): Promise<BackendSimulationData[]> {
    try {
      const response = await this.getSimulationData(simulationId, lastStep);
      return response.data_points;
    } catch (error) {
      console.error('Error fetching latest data:', error);
      return [];
    }
  }

  getCurrentSimulationId(): string | null {
    return this.currentSimulationId;
  }

  setCurrentSimulationId(id: string | null) {
    this.currentSimulationId = id;
  }
}

export const backendAPI = new BackendAPIService();