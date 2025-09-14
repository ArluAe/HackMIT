import { useState, useEffect, useCallback, useRef } from 'react';
import { backendAPI, BackendSimulationData } from '@/services/backendAPI';
import { SimulationData, SimulationMetrics } from '@/services/simulationEngine';

export interface BackendSimulationHook {
  simulationData: SimulationData[];
  metrics: SimulationMetrics;
  currentData: SimulationData | null;
  isSimulationRunning: boolean;
  progress: number;
  error: string | null;
  startAnalysis: (gridForgeData: any) => Promise<void>;
  stopAnalysis: () => void;
  subscribe: (callback: (data: SimulationData) => void) => void;
  unsubscribe: (callback: (data: SimulationData) => void) => void;
}

// Convert backend analysis step data format to frontend format
const convertAnalysisStepToFrontend = (stepData: any): SimulationData => {
  const metrics = stepData.metrics;

  return {
    timestamp: stepData.timestamp,
    totalDemand: metrics.total_demand,
    totalSupply: metrics.total_supply,
    efficiency: metrics.total_supply > 0 ? Math.min(metrics.total_demand / metrics.total_supply, 1) : 0,
    cost: metrics.total_demand * 50, // Estimated cost
    gridFrequency: metrics.grid_frequency,
    carbonEmissions: (metrics.thermal_generation * 0.8 + metrics.solar_generation * 0.05 + metrics.wind_generation * 0.02),
    renewablePercentage: metrics.total_supply > 0 ?
      ((metrics.solar_generation + metrics.wind_generation) / metrics.total_supply) * 100 : 0,
    gridStability: Math.max(0, 1 - Math.abs(metrics.power_imbalance) / Math.max(metrics.total_supply, metrics.total_demand, 1)),
    voltageLevel: 400 + (Math.random() - 0.5) * 20, // Simulated voltage
    powerQuality: 0.85 + Math.random() * 0.15,
    nodeData: {
      // Convert battery levels to node data format
      ...metrics.battery_levels.reduce((acc: any, level: number, idx: number) => {
        acc[`battery-${idx}`] = {
          power: metrics.battery_power / Math.max(metrics.battery_levels.length, 1),
          demand: 0,
          efficiency: 0.9,
          status: 'active' as const,
          temperature: 25,
          voltage: 400,
          current: 10,
          powerFactor: 0.9,
          carbonFootprint: 0.1
        };
        acc[`battery-${idx}_level`] = level;
        return acc;
      }, {})
    },
    weatherData: {
      temperature: 20 + 10 * Math.sin(stepData.time * 0.1),
      humidity: 60,
      windSpeed: 5 + Math.random() * 10,
      solarIrradiance: Math.max(0, 1000 * Math.sin(stepData.time * 0.2)),
      cloudCover: Math.random() * 50
    },
    marketData: {
      electricityPrice: 50 + Math.random() * 20,
      carbonPrice: 25 + Math.random() * 10,
      demandResponse: Math.min(100, metrics.total_demand / 10),
      peakShaving: Math.max(0, metrics.total_demand - 1000) * 0.1
    }
  };
};

// Convert legacy backend data format to frontend format (for polling fallback)
const convertBackendToFrontend = (backendData: BackendSimulationData): SimulationData => {
  const metrics = backendData.metrics;

  return {
    timestamp: backendData.timestamp,
    totalDemand: metrics.total_demand,
    totalSupply: metrics.total_supply,
    efficiency: metrics.total_supply > 0 ? Math.min(metrics.total_demand / metrics.total_supply, 1) : 0,
    cost: metrics.total_demand * 50, // Estimated cost
    gridFrequency: metrics.grid_frequency,
    carbonEmissions: (metrics.thermal_generation * 0.8 + metrics.solar_generation * 0.05 + metrics.wind_generation * 0.02),
    renewablePercentage: metrics.total_supply > 0 ?
      ((metrics.solar_generation + metrics.wind_generation) / metrics.total_supply) * 100 : 0,
    gridStability: Math.max(0, 1 - Math.abs(metrics.power_imbalance) / Math.max(metrics.total_supply, metrics.total_demand, 1)),
    voltageLevel: 400 + (Math.random() - 0.5) * 20, // Simulated voltage
    powerQuality: 0.85 + Math.random() * 0.15,
    nodeData: {
      // Convert battery levels to node data format
      ...metrics.battery_levels.reduce((acc, level, idx) => {
        acc[`battery-${idx}`] = {
          power: metrics.battery_power / Math.max(metrics.battery_levels.length, 1),
          demand: 0,
          efficiency: 0.9,
          status: 'active' as const,
          temperature: 25,
          voltage: 400,
          current: 10,
          powerFactor: 0.9,
          carbonFootprint: 0.1
        };
        acc[`battery-${idx}_level`] = level;
        return acc;
      }, {} as any)
    },
    weatherData: {
      temperature: 20 + 10 * Math.sin(backendData.time * 0.1),
      humidity: 60,
      windSpeed: 5 + Math.random() * 10,
      solarIrradiance: Math.max(0, 1000 * Math.sin(backendData.time * 0.2)),
      cloudCover: Math.random() * 50
    },
    marketData: {
      electricityPrice: 50 + Math.random() * 20,
      carbonPrice: 25 + Math.random() * 10,
      demandResponse: Math.min(100, metrics.total_demand / 10),
      peakShaving: Math.max(0, metrics.total_demand - 1000) * 0.1
    }
  };
};

export function useBackendSimulation(): BackendSimulationHook {
  const [simulationData, setSimulationData] = useState<SimulationData[]>([]);
  const [metrics, setMetrics] = useState<SimulationMetrics>({
    totalGeneration: 0,
    totalConsumption: 0,
    gridEfficiency: 0,
    averageCost: 0,
    peakDemand: 0,
    peakSupply: 0,
    frequencyStability: 0,
    carbonIntensity: 0,
    renewableShare: 0,
    gridReliability: 0,
    powerQuality: 0,
    voltageStability: 0,
    energyStorage: 0,
    demandResponse: 0,
    costSavings: 0,
    environmentalImpact: 0
  });
  const [currentData, setCurrentData] = useState<SimulationData | null>(null);
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [callbacks, setCallbacks] = useState<((data: SimulationData) => void)[]>([]);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastStepRef = useRef(0);

  const calculateMetrics = useCallback((allData: SimulationData[]): SimulationMetrics => {
    if (allData.length === 0) {
      return {
        totalGeneration: 0,
        totalConsumption: 0,
        gridEfficiency: 0,
        averageCost: 0,
        peakDemand: 0,
        peakSupply: 0,
        frequencyStability: 0,
        carbonIntensity: 0,
        renewableShare: 0,
        gridReliability: 0,
        powerQuality: 0,
        voltageStability: 0,
        energyStorage: 0,
        demandResponse: 0,
        costSavings: 0,
        environmentalImpact: 0
      };
    }

    const latest = allData[allData.length - 1];
    const avgCarbonEmissions = allData.reduce((sum, d) => sum + d.carbonEmissions, 0) / allData.length;
    const avgRenewablePercentage = allData.reduce((sum, d) => sum + d.renewablePercentage, 0) / allData.length;
    const avgGridStability = allData.reduce((sum, d) => sum + d.gridStability, 0) / allData.length;

    return {
      totalGeneration: latest.totalSupply,
      totalConsumption: latest.totalDemand,
      gridEfficiency: latest.efficiency,
      averageCost: allData.reduce((sum, d) => sum + d.cost, 0) / allData.length,
      peakDemand: Math.max(...allData.map(d => d.totalDemand)),
      peakSupply: Math.max(...allData.map(d => d.totalSupply)),
      frequencyStability: 1 - (Math.max(...allData.map(d => Math.abs(d.gridFrequency - 50))) / 50),
      carbonIntensity: avgCarbonEmissions,
      renewableShare: avgRenewablePercentage,
      gridReliability: avgGridStability * 100,
      powerQuality: latest.powerQuality * 100,
      voltageStability: (1 - (Math.max(...allData.map(d => Math.abs(d.voltageLevel - 400))) / 400)) * 100,
      energyStorage: latest.totalSupply * 0.1, // Estimated storage
      demandResponse: latest.marketData.demandResponse,
      costSavings: Math.max(0, (1000 - latest.cost) / 1000 * 100),
      environmentalImpact: Math.max(0, 1 - (avgCarbonEmissions / 1000)) * 100
    };
  }, []);

  const pollSimulationData = useCallback(async (simulationId: string) => {
    try {
      const newDataPoints = await backendAPI.getLatestData(simulationId, lastStepRef.current);
      const status = await backendAPI.getSimulationStatus(simulationId);

      setProgress(status.progress);

      if (newDataPoints.length > 0) {
        const convertedData = newDataPoints.map(convertBackendToFrontend);

        setSimulationData(prev => {
          const updated = [...prev, ...convertedData];
          // Keep only last 200 points
          return updated.slice(-200);
        });

        // Update current data with the latest point
        const latestData = convertedData[convertedData.length - 1];
        setCurrentData(latestData);

        // Update last step reference
        lastStepRef.current = newDataPoints[newDataPoints.length - 1].step;

        // Notify subscribers
        callbacks.forEach(callback => callback(latestData));
      }

      // Check if simulation is complete
      if (status.status === 'completed') {
        setIsSimulationRunning(false);
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      } else if (status.status === 'error') {
        setError(status.error || 'Simulation failed');
        setIsSimulationRunning(false);
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
    } catch (err) {
      console.error('Error polling simulation data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [callbacks]);

  // Update metrics whenever simulation data changes
  useEffect(() => {
    setMetrics(calculateMetrics(simulationData));
  }, [simulationData, calculateMetrics]);

  const startAnalysis = useCallback(async (gridForgeData: any) => {
    try {
      setError(null);
      setSimulationData([]);
      setCurrentData(null);
      setProgress(0);
      lastStepRef.current = 0;

      console.log('🚀 Starting backend analysis with data:', {
        nodes: gridForgeData.simulation?.nodes?.length,
        connections: gridForgeData.simulation?.connections?.length
      });

      // Set up WebSocket listeners for real-time updates
      backendAPI.removeAllListeners(); // Clean up any existing listeners

      backendAPI.onAnalysisStep((stepData: any) => {
        console.log('📊 Received analysis step:', {
          step: stepData.step,
          progress: stepData.progress,
          gridFrequency: stepData.metrics.grid_frequency
        });

        const convertedData = convertAnalysisStepToFrontend(stepData);

        setSimulationData(prev => {
          const updated = [...prev, convertedData];
          return updated.slice(-200); // Keep only last 200 points
        });

        setCurrentData(convertedData);
        setProgress(stepData.progress);

        // Notify subscribers
        callbacks.forEach(callback => callback(convertedData));
      });

      backendAPI.onAnalysisComplete((completeData: any) => {
        console.log('✅ Analysis completed:', completeData);
        setIsSimulationRunning(false);
        setProgress(100);
      });

      backendAPI.onAnalysisError((errorData: any) => {
        console.error('❌ Analysis error:', errorData);
        setError(errorData.error || 'Simulation failed');
        setIsSimulationRunning(false);
      });

      // Start the analysis
      const response = await backendAPI.startAnalysis(gridForgeData);
      console.log('🎯 Analysis started:', response);
      setIsSimulationRunning(true);

      // Keep polling as fallback if WebSocket fails
      pollingRef.current = setInterval(() => {
        pollSimulationData(response.simulation_id);
      }, 2000); // Poll every 2 seconds as fallback

    } catch (err) {
      console.error('❌ Failed to start analysis:', err);
      setError(err instanceof Error ? err.message : 'Failed to start analysis');
      setIsSimulationRunning(false);
    }
  }, [pollSimulationData, callbacks]);

  const stopAnalysis = useCallback(() => {
    setIsSimulationRunning(false);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    backendAPI.setCurrentSimulationId(null);
  }, []);

  const subscribe = useCallback((callback: (data: SimulationData) => void) => {
    setCallbacks(prev => [...prev, callback]);
  }, []);

  const unsubscribe = useCallback((callback: (data: SimulationData) => void) => {
    setCallbacks(prev => prev.filter(cb => cb !== callback));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  return {
    simulationData,
    metrics,
    currentData,
    isSimulationRunning,
    progress,
    error,
    startAnalysis,
    stopAnalysis,
    subscribe,
    unsubscribe
  };
}