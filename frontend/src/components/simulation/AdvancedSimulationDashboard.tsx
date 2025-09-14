'use client';

import { useState, useEffect, useRef } from 'react';
import { SimulationData, SimulationMetrics, simulationEngine } from '@/services/simulationEngine';

interface AdvancedSimulationDashboardProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function AdvancedSimulationDashboard({ isVisible, onClose }: AdvancedSimulationDashboardProps) {
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
  const [selectedTab, setSelectedTab] = useState<'overview' | 'environmental' | 'grid' | 'market'>('overview');
  
  const mainChartRef = useRef<HTMLCanvasElement>(null);
  const renewableChartRef = useRef<HTMLCanvasElement>(null);
  const frequencyChartRef = useRef<HTMLCanvasElement>(null);
  const weatherChartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isVisible) return;

    const handleSimulationUpdate = (data: SimulationData) => {
      setCurrentData(data);
      setSimulationData(prev => [...prev, data]);
      setMetrics(simulationEngine.getMetrics());
    };

    simulationEngine.subscribe(handleSimulationUpdate);

    return () => {
      simulationEngine.unsubscribe(handleSimulationUpdate);
    };
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      drawMainChart();
      drawRenewableChart();
      drawFrequencyChart();
      drawWeatherChart();
    }, 100);

    return () => clearInterval(interval);
  }, [simulationData, isVisible]);

  const drawMainChart = () => {
    const canvas = mainChartRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#1e293b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    if (simulationData.length < 2) return;
    
    const padding = 60;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Draw grid
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    for (let i = 0; i <= 10; i++) {
      const x = padding + (chartWidth / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }
    
    for (let i = 0; i <= 8; i++) {
      const y = padding + (chartHeight / 8) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    
    ctx.setLineDash([]);
    
    // Find min/max values
    const allValues = simulationData.flatMap(d => [d.totalDemand, d.totalSupply]);
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const range = maxValue - minValue;
    
    // Draw demand area
    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
    ctx.beginPath();
    simulationData.forEach((data, index) => {
      const x = padding + (chartWidth / (simulationData.length - 1)) * index;
      const y = height - padding - ((data.totalDemand - minValue) / range) * chartHeight;
      
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
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.beginPath();
    simulationData.forEach((data, index) => {
      const x = padding + (chartWidth / (simulationData.length - 1)) * index;
      const y = height - padding - ((data.totalSupply - minValue) / range) * chartHeight;
      
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
    ctx.shadowBlur = 10;
    ctx.beginPath();
    simulationData.forEach((data, index) => {
      const x = padding + (chartWidth / (simulationData.length - 1)) * index;
      const y = height - padding - ((data.totalDemand - minValue) / range) * chartHeight;
      
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
    ctx.shadowBlur = 10;
    ctx.beginPath();
    simulationData.forEach((data, index) => {
      const x = padding + (chartWidth / (simulationData.length - 1)) * index;
      const y = height - padding - ((data.totalSupply - minValue) / range) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    
    ctx.shadowBlur = 0;
    
    // Draw efficiency line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    simulationData.forEach((data, index) => {
      const x = padding + (chartWidth / (simulationData.length - 1)) * index;
      const y = height - padding - ((data.efficiency * (maxValue - minValue) + minValue - minValue) / range) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw labels
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Real-time Energy Flow (MW)', padding, 30);
    
    // Draw value labels
    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = '#ef4444';
    ctx.fillText(`Demand: ${currentData?.totalDemand.toFixed(1)} MW`, width - 200, 30);
    ctx.fillStyle = '#10b981';
    ctx.fillText(`Supply: ${currentData?.totalSupply.toFixed(1)} MW`, width - 200, 50);
    ctx.fillStyle = '#3b82f6';
    ctx.fillText(`Efficiency: ${(currentData?.efficiency || 0 * 100).toFixed(1)}%`, width - 200, 70);
  };

  const drawRenewableChart = () => {
    const canvas = renewableChartRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Background
    const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/2);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#1e293b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    if (!currentData) return;
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 80;
    
    // Renewable percentage
    const renewablePercentage = currentData.renewablePercentage;
    const angle = (renewablePercentage / 100) * 2 * Math.PI;
    
    // Background circle
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Renewable arc
    ctx.strokeStyle = renewablePercentage > 50 ? '#10b981' : renewablePercentage > 25 ? '#f59e0b' : '#ef4444';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + angle);
    ctx.stroke();
    
    // Center text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${renewablePercentage.toFixed(1)}%`, centerX, centerY + 5);
    
    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Renewable', centerX, centerY + 25);
    
    // Carbon intensity indicator
    const carbonIntensity = currentData.carbonEmissions;
    const carbonColor = carbonIntensity < 200 ? '#10b981' : carbonIntensity < 400 ? '#f59e0b' : '#ef4444';
    
    ctx.fillStyle = carbonColor;
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText(`${carbonIntensity.toFixed(0)} g CO₂/kWh`, centerX, centerY + 40);
  };

  const drawFrequencyChart = () => {
    const canvas = frequencyChartRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);
    
    if (simulationData.length < 2) return;
    
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Draw frequency line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    simulationData.forEach((data, index) => {
      const x = padding + (chartWidth / (simulationData.length - 1)) * index;
      const y = height - padding - ((data.gridFrequency - 49.5) / 1) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    
    // Draw 50Hz reference line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    const refY = height - padding - ((50 - 49.5) / 1) * chartHeight;
    ctx.beginPath();
    ctx.moveTo(padding, refY);
    ctx.lineTo(width - padding, refY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Labels
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Grid Frequency (Hz)', padding, 15);
    
    ctx.textAlign = 'right';
    ctx.fillText(`${currentData?.gridFrequency.toFixed(2)} Hz`, width - padding, 15);
  };

  const drawWeatherChart = () => {
    const canvas = weatherChartRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);
    
    if (!currentData) return;
    
    const weather = currentData.weatherData;
    
    // Temperature gauge
    const tempX = 20;
    const tempY = 20;
    const tempWidth = 60;
    const tempHeight = 20;
    
    ctx.fillStyle = '#334155';
    ctx.fillRect(tempX, tempY, tempWidth, tempHeight);
    
    const tempColor = weather.temperature < 10 ? '#3b82f6' : weather.temperature < 25 ? '#10b981' : '#f59e0b';
    ctx.fillStyle = tempColor;
    ctx.fillRect(tempX, tempY, (weather.temperature / 40) * tempWidth, tempHeight);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${weather.temperature.toFixed(1)}°C`, tempX + tempWidth/2, tempY + 15);
    
    // Wind speed
    const windX = 100;
    const windY = 20;
    const windWidth = 60;
    const windHeight = 20;
    
    ctx.fillStyle = '#334155';
    ctx.fillRect(windX, windY, windWidth, windHeight);
    
    ctx.fillStyle = '#8b5cf6';
    ctx.fillRect(windX, windY, (weather.windSpeed / 20) * windWidth, windHeight);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${weather.windSpeed.toFixed(1)} m/s`, windX + windWidth/2, windY + 15);
    
    // Solar irradiance
    const solarX = 180;
    const solarY = 20;
    const solarWidth = 60;
    const solarHeight = 20;
    
    ctx.fillStyle = '#334155';
    ctx.fillRect(solarX, solarY, solarWidth, solarHeight);
    
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(solarX, solarY, (weather.solarIrradiance / 1000) * solarWidth, solarHeight);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${weather.solarIrradiance.toFixed(0)} W/m²`, solarX + solarWidth/2, solarY + 15);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center space-x-4">
            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
            <h2 className="text-2xl font-bold text-white">Advanced Energy Management System</h2>
            <div className="px-3 py-1 bg-green-600 text-white text-sm rounded-full font-medium shadow-lg">
              LIVE SIMULATION
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 p-4 border-b border-slate-700">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'environmental', label: 'Environmental', icon: '🌱' },
            { id: 'grid', label: 'Grid Status', icon: '⚡' },
            { id: 'market', label: 'Market Data', icon: '💰' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-hidden">
          {selectedTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
              {/* Main Chart */}
              <div className="lg:col-span-2">
                <div className="bg-slate-800/50 rounded-xl p-4 h-full border border-slate-700">
                  <canvas
                    ref={mainChartRef}
                    width={800}
                    height={400}
                    className="w-full h-full"
                  />
                </div>
              </div>

              {/* Metrics Panel */}
              <div className="space-y-4">
                {/* Key Metrics */}
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Key Performance Indicators</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Generation</span>
                      <span className="text-green-400 font-mono font-bold">{metrics.totalGeneration.toFixed(1)} MW</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Consumption</span>
                      <span className="text-red-400 font-mono font-bold">{metrics.totalConsumption.toFixed(1)} MW</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Efficiency</span>
                      <span className="text-blue-400 font-mono font-bold">{(metrics.gridEfficiency * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Cost</span>
                      <span className="text-yellow-400 font-mono font-bold">${metrics.averageCost.toFixed(2)}/MWh</span>
                    </div>
                  </div>
                </div>

                {/* Renewable Energy */}
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Renewable Energy</h3>
                  <div className="text-center">
                    <canvas
                      ref={renewableChartRef}
                      width={200}
                      height={200}
                      className="mx-auto"
                    />
                  </div>
                </div>

                {/* Grid Frequency */}
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Grid Frequency</h3>
                  <canvas
                    ref={frequencyChartRef}
                    width={200}
                    height={100}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'environmental' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              {/* Environmental Metrics */}
              <div className="space-y-4">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-xl font-semibold text-white mb-4">🌱 Environmental Impact</h3>
                  <div className="space-y-4">
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
                  <h3 className="text-xl font-semibold text-white mb-4">🌤️ Weather Conditions</h3>
                  <canvas
                    ref={weatherChartRef}
                    width={400}
                    height={100}
                    className="w-full"
                  />
                  {currentData && (
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-300">Temperature</span>
                        <span className="text-white">{currentData.weatherData.temperature.toFixed(1)}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Humidity</span>
                        <span className="text-white">{currentData.weatherData.humidity.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Wind Speed</span>
                        <span className="text-white">{currentData.weatherData.windSpeed.toFixed(1)} m/s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Solar Irradiance</span>
                        <span className="text-white">{currentData.weatherData.solarIrradiance.toFixed(0)} W/m²</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Environmental Chart */}
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h3 className="text-xl font-semibold text-white mb-4">Carbon Emissions Over Time</h3>
                <div className="h-64 flex items-center justify-center text-slate-400">
                  <p>Environmental impact visualization coming soon...</p>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'grid' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              {/* Grid Status */}
              <div className="space-y-4">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-xl font-semibold text-white mb-4">⚡ Grid Health</h3>
                  <div className="space-y-4">
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
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Frequency Stability</span>
                      <span className="text-cyan-400 font-mono font-bold">{metrics.frequencyStability.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-xl font-semibold text-white mb-4">🔋 Energy Storage</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Storage Utilization</span>
                      <span className="text-yellow-400 font-mono font-bold">{metrics.energyStorage.toFixed(1)} MW</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Demand Response</span>
                      <span className="text-orange-400 font-mono font-bold">{metrics.demandResponse.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid Visualization */}
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h3 className="text-xl font-semibold text-white mb-4">Grid Frequency Monitor</h3>
                <canvas
                  ref={frequencyChartRef}
                  width={400}
                  height={300}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {selectedTab === 'market' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              {/* Market Data */}
              <div className="space-y-4">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-xl font-semibold text-white mb-4">💰 Market Conditions</h3>
                  <div className="space-y-4">
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
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300">Peak Shaving</span>
                          <span className="text-purple-400 font-mono font-bold">{currentData.marketData.peakShaving.toFixed(1)} MW</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-xl font-semibold text-white mb-4">💵 Cost Analysis</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Average Cost</span>
                      <span className="text-yellow-400 font-mono font-bold">${metrics.averageCost.toFixed(2)}/MWh</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Cost Savings</span>
                      <span className="text-green-400 font-mono font-bold">{metrics.costSavings.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Peak Demand</span>
                      <span className="text-red-400 font-mono font-bold">{metrics.peakDemand.toFixed(1)} MW</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Peak Supply</span>
                      <span className="text-blue-400 font-mono font-bold">{metrics.peakSupply.toFixed(1)} MW</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Market Chart */}
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h3 className="text-xl font-semibold text-white mb-4">Price Trends</h3>
                <div className="h-64 flex items-center justify-center text-slate-400">
                  <p>Market price visualization coming soon...</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
