'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SimulationData, SimulationMetrics, simulationEngine } from '@/services/simulationEngine';
import EnergyChart from '@/components/charts/EnergyChart';
import BatteryChart from '@/components/charts/BatteryChart';

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

  // Chart data arrays
  const [gridFrequencyData, setGridFrequencyData] = useState<ChartData[]>([]);
  const [supplyData, setSupplyData] = useState<ChartData[]>([]);
  const [demandData, setDemandData] = useState<ChartData[]>([]);
  const [powerImbalanceData, setPowerImbalanceData] = useState<ChartData[]>([]);
  const [voltageData, setVoltageData] = useState<ChartData[]>([]);

  const MAX_DATA_POINTS = 200;

  useEffect(() => {
    // Start the simulation automatically if not already running
    console.log('🚀 Initializing simulation engine for analysis page');

    // Always ensure simulation is running with demo data
    simulationEngine.stop(); // Stop any existing simulation
    simulationEngine.start([], []); // Start fresh with demo data
    setIsSimulationRunning(true);

    const handleSimulationUpdate = (data: SimulationData) => {
      setCurrentData(data);
      setSimulationData(prev => {
        const newData = [...prev, data];
        return newData.slice(-MAX_DATA_POINTS);
      });
      setMetrics(simulationEngine.getMetrics());
      updateChartData(data);
    };

    simulationEngine.subscribe(handleSimulationUpdate);

    return () => {
      simulationEngine.unsubscribe(handleSimulationUpdate);
      // Clean up on unmount
      simulationEngine.stop();
    };
  }, []);

  const updateChartData = useCallback((data: SimulationData) => {
    const time = data.timestamp;

    // Update all chart data
    setGridFrequencyData(prev => [...prev, { time, value: data.gridFrequency }].slice(-MAX_DATA_POINTS));
    setSupplyData(prev => [...prev, { time, value: data.totalSupply }].slice(-MAX_DATA_POINTS));
    setDemandData(prev => [...prev, { time, value: data.totalDemand }].slice(-MAX_DATA_POINTS));
    setPowerImbalanceData(prev => [...prev, { time, value: data.totalDemand - data.totalSupply }].slice(-MAX_DATA_POINTS));
    setVoltageData(prev => [...prev, { time, value: data.voltageLevel }].slice(-MAX_DATA_POINTS));

    // Update battery data
    const batteries: BatteryData[] = [];
    Object.entries(data.nodeData).forEach(([nodeId, nodeData]) => {
      if (nodeId.includes('battery') || nodeId.includes('storage')) {
        const levelKey = `${nodeId}_level`;
        const storedLevel = data.nodeData[levelKey];

        // Ensure we have a valid numeric level
        let level = 50; // Default level
        if (typeof storedLevel === 'number' && !isNaN(storedLevel)) {
          level = Math.max(0, Math.min(100, storedLevel));
        } else if (typeof nodeData.power === 'number' && !isNaN(nodeData.power)) {
          level = Math.max(0, Math.min(100, Math.abs(nodeData.power)));
        }

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900/90 to-slate-800/90 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Live Energy Analysis
              </h1>
              <div className="px-4 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm rounded-full font-semibold shadow-lg shadow-green-500/25">
                SIMULATION ACTIVE
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/simulation/workspace')}
                className="px-4 py-2 text-slate-400 hover:text-white transition-all hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <button
                onClick={handleStopSimulation}
                className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-lg transition-all hover:scale-105 flex items-center space-x-2 shadow-lg shadow-red-500/25"
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
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Generation */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900/20 to-green-900/20 backdrop-blur-sm rounded-2xl p-6 border border-emerald-700/30 hover:border-emerald-600/50 transition-all hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <p className="text-emerald-400 text-sm font-medium">Total Generation</p>
                <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{metrics.totalGeneration.toFixed(1)} MW</p>
              <p className="text-emerald-400/70 text-xs">Efficiency: {(metrics.gridEfficiency * 100).toFixed(1)}%</p>
            </div>
          </div>

          {/* Total Consumption */}
          <div className="relative overflow-hidden bg-gradient-to-br from-rose-900/20 to-red-900/20 backdrop-blur-sm rounded-2xl p-6 border border-rose-700/30 hover:border-rose-600/50 transition-all hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <p className="text-rose-400 text-sm font-medium">Total Consumption</p>
                <div className="w-10 h-10 bg-rose-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{metrics.totalConsumption.toFixed(1)} MW</p>
              <p className="text-rose-400/70 text-xs">Peak: {metrics.peakDemand.toFixed(1)} MW</p>
            </div>
          </div>

          {/* Grid Frequency */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-900/20 to-indigo-900/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-700/30 hover:border-blue-600/50 transition-all hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <p className="text-blue-400 text-sm font-medium">Grid Frequency</p>
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{currentData?.gridFrequency.toFixed(2)} Hz</p>
              <p className="text-blue-400/70 text-xs">Stability: {(metrics.frequencyStability * 100).toFixed(1)}%</p>
            </div>
          </div>

          {/* Renewable Share */}
          <div className="relative overflow-hidden bg-gradient-to-br from-amber-900/20 to-yellow-900/20 backdrop-blur-sm rounded-2xl p-6 border border-amber-700/30 hover:border-amber-600/50 transition-all hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <p className="text-amber-400 text-sm font-medium">Renewable Energy</p>
                <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{metrics.renewableShare.toFixed(1)}%</p>
              <p className="text-amber-400/70 text-xs">Carbon: {metrics.carbonIntensity.toFixed(0)} g/kWh</p>
            </div>
          </div>
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <EnergyChart
            data={gridFrequencyData}
            title="Grid Frequency"
            color="#3b82f6"
            unit="Hz"
            currentValue={currentData?.gridFrequency}
            targetValue={60}
            minValue={59}
            maxValue={61}
            type="line"
            height={320}
          />

          <EnergyChart
            data={supplyData}
            title="Power Supply"
            color="#10b981"
            unit="MW"
            currentValue={currentData?.totalSupply}
            type="area"
            height={320}
          />

          <EnergyChart
            data={demandData}
            title="Power Demand"
            color="#ef4444"
            unit="MW"
            currentValue={currentData?.totalDemand}
            type="area"
            height={320}
          />

          <EnergyChart
            data={powerImbalanceData}
            title="Power Imbalance"
            color="#f59e0b"
            unit="MW"
            currentValue={currentData ? currentData.totalDemand - currentData.totalSupply : 0}
            targetValue={0}
            type="line"
            height={320}
          />
        </div>

        {/* Battery and Voltage Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BatteryChart batteries={batteryData} height={320} />

          <EnergyChart
            data={voltageData}
            title="Voltage Level"
            color="#8b5cf6"
            unit="V"
            currentValue={currentData?.voltageLevel}
            targetValue={400}
            minValue={380}
            maxValue={420}
            type="line"
            height={320}
          />
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/30">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Environmental Impact
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Carbon Intensity</span>
                <span className="text-orange-400 font-mono font-bold">{metrics.carbonIntensity.toFixed(1)} g/kWh</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Renewable Share</span>
                <span className="text-green-400 font-mono font-bold">{metrics.renewableShare.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Environmental Score</span>
                <span className="text-emerald-400 font-mono font-bold">{metrics.environmentalImpact.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/30">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Grid Health
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Grid Reliability</span>
                <span className="text-green-400 font-mono font-bold">{metrics.gridReliability.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Power Quality</span>
                <span className="text-blue-400 font-mono font-bold">{metrics.powerQuality.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Voltage Stability</span>
                <span className="text-purple-400 font-mono font-bold">{metrics.voltageStability.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/30">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
              Market Conditions
            </h3>
            <div className="space-y-3">
              {currentData && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Electricity Price</span>
                    <span className="text-green-400 font-mono font-bold">${currentData.marketData.electricityPrice.toFixed(2)}/MWh</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Carbon Price</span>
                    <span className="text-orange-400 font-mono font-bold">${currentData.marketData.carbonPrice.toFixed(2)}/ton</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Demand Response</span>
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