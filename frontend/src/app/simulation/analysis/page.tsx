'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SimulationData, SimulationMetrics, simulationEngine } from '@/services/simulationEngine';

interface ChartData {
  time: number;
  value: number;
}

interface BatteryData {
  id: string;
  name: string;
  level: number;
  status: 'charging' | 'discharging' | 'idle';
}

export default function SimulationAnalysisPage() {
  const router = useRouter();
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
  const [batteryData, setBatteryData] = useState<BatteryData[]>([]);
  
  // Chart data arrays for time-series graphs
  const [gridFrequencyData, setGridFrequencyData] = useState<ChartData[]>([]);
  const [supplyData, setSupplyData] = useState<ChartData[]>([]);
  const [demandData, setDemandData] = useState<ChartData[]>([]);
  const [powerImbalanceData, setPowerImbalanceData] = useState<ChartData[]>([]);
  const [batteryLevelsData, setBatteryLevelsData] = useState<{ [key: string]: ChartData[] }>({});

  // Chart refs
  const gridFrequencyCanvasRef = useRef<HTMLCanvasElement>(null);
  const supplyDemandCanvasRef = useRef<HTMLCanvasElement>(null);
  const batteryCanvasRef = useRef<HTMLCanvasElement>(null);
  const powerImbalanceCanvasRef = useRef<HTMLCanvasElement>(null);

  // Chart dimensions
  const CHART_WIDTH = 400;
  const CHART_HEIGHT = 200;
  const MAX_DATA_POINTS = 200; // Show last 200 data points

  useEffect(() => {
    // Check if simulation is running
    const checkSimulationStatus = () => {
      setIsSimulationRunning(true);
    };

    checkSimulationStatus();

    const handleSimulationUpdate = (data: SimulationData) => {
      setCurrentData(data);
      setSimulationData(prev => {
        const newData = [...prev, data];
        return newData.slice(-MAX_DATA_POINTS); // Keep only last 200 points
      });
      setMetrics(simulationEngine.getMetrics());
      
      // Update chart data
      updateChartData(data);
    };

    simulationEngine.subscribe(handleSimulationUpdate);

    return () => {
      simulationEngine.unsubscribe(handleSimulationUpdate);
    };
  }, []);

  const updateChartData = useCallback((data: SimulationData) => {
    const time = data.timestamp;
    
    // Update grid frequency data
    setGridFrequencyData(prev => {
      const newData = [...prev, { time, value: data.gridFrequency }];
      return newData.slice(-MAX_DATA_POINTS);
    });

    // Update supply/demand data
    setSupplyData(prev => {
      const newData = [...prev, { time, value: data.totalSupply }];
      return newData.slice(-MAX_DATA_POINTS);
    });

    setDemandData(prev => {
      const newData = [...prev, { time, value: data.totalDemand }];
      return newData.slice(-MAX_DATA_POINTS);
    });

    // Update power imbalance data
    const imbalance = data.totalDemand - data.totalSupply;
    setPowerImbalanceData(prev => {
      const newData = [...prev, { time, value: imbalance }];
      return newData.slice(-MAX_DATA_POINTS);
    });

    // Update battery data
    const batteries: BatteryData[] = [];
    Object.entries(data.nodeData).forEach(([nodeId, nodeData]) => {
      if (nodeId.includes('battery') || nodeId.includes('storage')) {
        // Check if we have a stored battery level
        const levelKey = `${nodeId}_level`;
        const storedLevel = data.nodeData[levelKey];
        const level = storedLevel ? Math.max(0, Math.min(100, storedLevel)) : Math.max(0, Math.min(100, (nodeData.power / 100) * 100));
        const status = nodeData.power > 0 ? 'discharging' : nodeData.power < 0 ? 'charging' : 'idle';
        batteries.push({
          id: nodeId,
          name: `Battery ${nodeId.split('-').pop() || nodeId.slice(-1)}`,
          level,
          status
        });
      }
    });
    setBatteryData(batteries);
  }, []);

  useEffect(() => {
    if (!isSimulationRunning) return;

    const interval = setInterval(() => {
      drawGridFrequencyChart();
      drawSupplyDemandChart();
      drawBatteryChart();
      drawPowerImbalanceChart();
    }, 100); // Update every 100ms for smooth animation

    return () => clearInterval(interval);
  }, [gridFrequencyData, supplyData, demandData, powerImbalanceData, batteryData, isSimulationRunning]);

  const drawGridFrequencyChart = useCallback(() => {
    const canvas = gridFrequencyCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);
    
    if (gridFrequencyData.length < 2) return;
    
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Draw grid
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    
    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = padding + (chartWidth / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }
    
    ctx.setLineDash([]);
    
    // Find min/max values
    const values = gridFrequencyData.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;
    
    // Draw reference lines
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    // Upper critical threshold (60.75 Hz)
    const upperY = height - padding - ((60.75 - minValue) / range) * chartHeight;
    ctx.beginPath();
    ctx.moveTo(padding, upperY);
    ctx.lineTo(width - padding, upperY);
    ctx.stroke();
    
    // Lower critical threshold (59.25 Hz)
    const lowerY = height - padding - ((59.25 - minValue) / range) * chartHeight;
    ctx.beginPath();
    ctx.moveTo(padding, lowerY);
    ctx.lineTo(width - padding, lowerY);
    ctx.stroke();
    
    // Target frequency (60 Hz)
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    const targetY = height - padding - ((60 - minValue) / range) * chartHeight;
    ctx.beginPath();
    ctx.moveTo(padding, targetY);
    ctx.lineTo(width - padding, targetY);
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    // Draw frequency line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#3b82f6';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    
    gridFrequencyData.forEach((data, index) => {
      const x = padding + (chartWidth / (gridFrequencyData.length - 1)) * index;
      const y = height - padding - ((data.value - minValue) / range) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Draw labels
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Grid Frequency (Hz)', padding, 20);
    
    // Y-axis labels
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const value = minValue + (range / 4) * i;
      const y = padding + (chartHeight / 4) * i;
      ctx.fillText(value.toFixed(1), padding - 10, y + 4);
    }
    
    // Current value
    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${currentData?.gridFrequency.toFixed(2)} Hz`, width - padding, 20);
  }, [gridFrequencyData, currentData]);

  const drawSupplyDemandChart = useCallback(() => {
    const canvas = supplyDemandCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);
    
    if (supplyData.length < 2) return;
    
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Draw grid
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    
    for (let i = 0; i <= 10; i++) {
      const x = padding + (chartWidth / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }
    
    ctx.setLineDash([]);
    
    // Find min/max values
    const allValues = [...supplyData.map(d => d.value), ...demandData.map(d => d.value)];
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const range = maxValue - minValue || 1;
    
    // Draw demand area
    ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
    ctx.beginPath();
    demandData.forEach((data, index) => {
      const x = padding + (chartWidth / (demandData.length - 1)) * index;
      const y = height - padding - ((data.value - minValue) / range) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.lineTo(width - padding, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.closePath();
    ctx.fill();
    
    // Draw supply area
    ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
    ctx.beginPath();
    supplyData.forEach((data, index) => {
      const x = padding + (chartWidth / (supplyData.length - 1)) * index;
      const y = height - padding - ((data.value - minValue) / range) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.lineTo(width - padding, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.closePath();
    ctx.fill();
    
    // Draw demand line
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    demandData.forEach((data, index) => {
      const x = padding + (chartWidth / (demandData.length - 1)) * index;
      const y = height - padding - ((data.value - minValue) / range) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    
    // Draw supply line
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    supplyData.forEach((data, index) => {
      const x = padding + (chartWidth / (supplyData.length - 1)) * index;
      const y = height - padding - ((data.value - minValue) / range) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    
    ctx.shadowBlur = 0;
    
    // Draw labels
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Supply vs Demand (MW)', padding, 20);
    
    // Y-axis labels
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const value = minValue + (range / 4) * i;
      const y = padding + (chartHeight / 4) * i;
      ctx.fillText(value.toFixed(0), padding - 10, y + 4);
    }
    
    // Current values
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Demand: ${currentData?.totalDemand.toFixed(1)} MW`, width - padding, 20);
    ctx.fillStyle = '#10b981';
    ctx.fillText(`Supply: ${currentData?.totalSupply.toFixed(1)} MW`, width - padding, 40);
  }, [supplyData, demandData, currentData]);

  const drawBatteryChart = useCallback(() => {
    const canvas = batteryCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);
    
    if (batteryData.length === 0) return;
    
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Draw grid
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    
    ctx.setLineDash([]);
    
    // Draw battery bars
    const barWidth = chartWidth / batteryData.length;
    const maxBarHeight = chartHeight;
    
    batteryData.forEach((battery, index) => {
      const x = padding + index * barWidth + barWidth * 0.1;
      const barWidthActual = barWidth * 0.8;
      const barHeight = (battery.level / 100) * maxBarHeight;
      const y = height - padding - barHeight;
      
      // Bar background
      ctx.fillStyle = '#334155';
      ctx.fillRect(x, height - padding - maxBarHeight, barWidthActual, maxBarHeight);
      
      // Bar fill
      const color = battery.level < 20 ? '#ef4444' : battery.level < 50 ? '#f59e0b' : '#10b981';
      ctx.fillStyle = color;
      ctx.fillRect(x, y, barWidthActual, barHeight);
      
      // Battery name
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(battery.name, x + barWidthActual / 2, height - padding + 15);
      
      // Battery level percentage
      ctx.fillStyle = color;
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText(`${battery.level.toFixed(0)}%`, x + barWidthActual / 2, y - 5);
    });
    
    // Draw labels
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Battery Levels (%)', padding, 20);
    
    // Y-axis labels
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const value = (i * 25);
      const y = padding + (chartHeight / 4) * i;
      ctx.fillText(value.toString(), padding - 10, y + 4);
    }
  }, [batteryData]);

  const drawPowerImbalanceChart = useCallback(() => {
    const canvas = powerImbalanceCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);
    
    if (powerImbalanceData.length < 2) return;
    
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Draw grid
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    
    for (let i = 0; i <= 10; i++) {
      const x = padding + (chartWidth / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }
    
    ctx.setLineDash([]);
    
    // Draw zero line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    const zeroY = height - padding - chartHeight / 2;
    ctx.beginPath();
    ctx.moveTo(padding, zeroY);
    ctx.lineTo(width - padding, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Find min/max values
    const values = powerImbalanceData.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = Math.max(Math.abs(minValue), Math.abs(maxValue)) * 2;
    
    // Draw imbalance line
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    
    powerImbalanceData.forEach((data, index) => {
      const x = padding + (chartWidth / (powerImbalanceData.length - 1)) * index;
      const y = height - padding - ((data.value + range/2) / range) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Draw labels
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Power Flow Imbalance (MW)', padding, 20);
    
    // Y-axis labels
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const value = -range/2 + (range / 4) * i;
      const y = padding + (chartHeight / 4) * i;
      ctx.fillText(value.toFixed(0), padding - 10, y + 4);
    }
    
    // Current value
    const currentImbalance = currentData ? currentData.totalDemand - currentData.totalSupply : 0;
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${currentImbalance.toFixed(1)} MW`, width - padding, 20);
  }, [powerImbalanceData, currentData]);

  const handleStopSimulation = () => {
    simulationEngine.stop();
    setIsSimulationRunning(false);
    router.push('/simulation/workspace');
  };

  if (!isSimulationRunning) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full animate-pulse mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-white mb-2">Simulation Not Running</h1>
          <p className="text-gray-400 mb-6">Please start a simulation from the workspace to view live analysis.</p>
          <button
            onClick={() => router.push('/simulation/workspace')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Go to Workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
              <h1 className="text-2xl font-bold text-white">Live Energy Analysis</h1>
              <div className="px-3 py-1 bg-green-600 text-white text-sm rounded-full font-medium shadow-lg">
                SIMULATION ACTIVE
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/simulation/workspace')}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <button
                onClick={handleStopSimulation}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
                <span>Stop Simulation</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Generation</p>
                <p className="text-2xl font-bold text-green-400">{metrics.totalGeneration.toFixed(1)} MW</p>
                <p className="text-slate-400 text-xs">+{((metrics.totalGeneration / 1000) * 100).toFixed(1)}% efficiency</p>
              </div>
              <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Consumption</p>
                <p className="text-2xl font-bold text-red-400">{metrics.totalConsumption.toFixed(1)} MW</p>
                <p className="text-slate-400 text-xs">Peak: {metrics.peakDemand.toFixed(1)} MW</p>
              </div>
              <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Grid Frequency</p>
                <p className="text-2xl font-bold text-blue-400">{currentData?.gridFrequency.toFixed(2)} Hz</p>
                <p className="text-slate-400 text-xs">Stability: {(metrics.frequencyStability * 100).toFixed(1)}%</p>
              </div>
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Average Cost</p>
                <p className="text-2xl font-bold text-yellow-400">${metrics.averageCost.toFixed(2)}/MWh</p>
                <p className="text-slate-400 text-xs">Savings: {metrics.costSavings.toFixed(1)}%</p>
              </div>
              <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grid Frequency Chart */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Grid Frequency</h3>
            <canvas
              ref={gridFrequencyCanvasRef}
              width={CHART_WIDTH}
              height={CHART_HEIGHT}
              className="w-full h-full"
            />
          </div>

          {/* Supply vs Demand Chart */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Supply vs Demand</h3>
            <canvas
              ref={supplyDemandCanvasRef}
              width={CHART_WIDTH}
              height={CHART_HEIGHT}
              className="w-full h-full"
            />
          </div>

          {/* Battery Levels Chart */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Battery Levels</h3>
            <canvas
              ref={batteryCanvasRef}
              width={CHART_WIDTH}
              height={CHART_HEIGHT}
              className="w-full h-full"
            />
          </div>

          {/* Power Flow Imbalance Chart */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Power Flow Imbalance</h3>
            <canvas
              ref={powerImbalanceCanvasRef}
              width={CHART_WIDTH}
              height={CHART_HEIGHT}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Environmental Impact</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Carbon Intensity</span>
                <span className="text-orange-400 font-mono font-bold">{metrics.carbonIntensity.toFixed(1)} g CO₂/kWh</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Renewable Share</span>
                <span className="text-green-400 font-mono font-bold">{metrics.renewableShare.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Environmental Score</span>
                <span className="text-emerald-400 font-mono font-bold">{metrics.environmentalImpact.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Grid Health</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Grid Reliability</span>
                <span className="text-green-400 font-mono font-bold">{metrics.gridReliability.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Power Quality</span>
                <span className="text-blue-400 font-mono font-bold">{metrics.powerQuality.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Voltage Stability</span>
                <span className="text-purple-400 font-mono font-bold">{metrics.voltageStability.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Market Conditions</h3>
            <div className="space-y-3">
              {currentData && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Electricity Price</span>
                    <span className="text-green-400 font-mono font-bold">${currentData.marketData.electricityPrice.toFixed(2)}/MWh</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Carbon Price</span>
                    <span className="text-orange-400 font-mono font-bold">${currentData.marketData.carbonPrice.toFixed(2)}/ton</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Demand Response</span>
                    <span className="text-blue-400 font-mono font-bold">{currentData.marketData.demandResponse.toFixed(1)}%</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}