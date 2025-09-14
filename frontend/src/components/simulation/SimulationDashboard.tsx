'use client';

import { useState, useEffect, useRef } from 'react';
import { SimulationData, SimulationMetrics, simulationEngine } from '@/services/simulationEngine';

interface SimulationDashboardProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function SimulationDashboard({ isVisible, onClose }: SimulationDashboardProps) {
  const [simulationData, setSimulationData] = useState<SimulationData[]>([]);
  const [metrics, setMetrics] = useState<SimulationMetrics>({
    totalGeneration: 0,
    totalConsumption: 0,
    gridEfficiency: 0,
    averageCost: 0,
    peakDemand: 0,
    peakSupply: 0,
    frequencyStability: 0
  });
  const [currentData, setCurrentData] = useState<SimulationData | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<HTMLCanvasElement>(null);

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
    if (!isVisible || !canvasRef.current || !chartRef.current) return;

    drawRealTimeChart();
    drawMetricsChart();
  }, [simulationData, isVisible]);

  const drawRealTimeChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set up chart area
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Draw background
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid lines
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    
    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = padding + (chartWidth / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }
    
    // Horizontal grid lines
    for (let i = 0; i <= 8; i++) {
      const y = padding + (chartHeight / 8) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    
    if (simulationData.length < 2) return;
    
    // Find min/max values for scaling
    const allValues = simulationData.flatMap(d => [d.totalDemand, d.totalSupply]);
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const range = maxValue - minValue;
    
    // Draw demand line
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
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
    
    // Draw labels
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Demand & Supply (MW)', padding, 20);
    
    // Draw legend
    const legendY = height - 20;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(width - 200, legendY - 15, 15, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Demand', width - 180, legendY - 10);
    
    ctx.fillStyle = '#10b981';
    ctx.fillRect(width - 120, legendY - 15, 15, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Supply', width - 100, legendY - 10);
  };

  const drawMetricsChart = () => {
    const canvas = chartRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, width, height);
    
    // Draw efficiency gauge
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 60;
    
    // Background circle
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Efficiency arc
    const efficiency = metrics.gridEfficiency;
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (2 * Math.PI * efficiency);
    
    ctx.strokeStyle = efficiency > 0.8 ? '#10b981' : efficiency > 0.6 ? '#f59e0b' : '#ef4444';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.stroke();
    
    // Efficiency text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${(efficiency * 100).toFixed(1)}%`, centerX, centerY + 5);
    
    // Frequency indicator
    const frequency = currentData?.gridFrequency || 50;
    const frequencyColor = Math.abs(frequency - 50) < 0.5 ? '#10b981' : '#ef4444';
    
    ctx.fillStyle = frequencyColor;
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${frequency.toFixed(2)} Hz`, centerX, centerY + 25);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <h2 className="text-xl font-bold text-white">Live Simulation Dashboard</h2>
            <div className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
              RUNNING
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Real-time Chart */}
            <div className="lg:col-span-2">
              <div className="bg-gray-800 rounded-lg p-4 h-full">
                <h3 className="text-lg font-semibold text-white mb-4">Real-time Demand & Supply</h3>
                <div className="relative h-[calc(100%-3rem)]">
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={400}
                    className="w-full h-full"
                  />
                </div>
              </div>
            </div>

            {/* Metrics Panel */}
            <div className="space-y-4">
              {/* Key Metrics */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Key Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Generation</span>
                    <span className="text-green-400 font-mono">{metrics.totalGeneration.toFixed(1)} MW</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Consumption</span>
                    <span className="text-red-400 font-mono">{metrics.totalConsumption.toFixed(1)} MW</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Efficiency</span>
                    <span className="text-blue-400 font-mono">{(metrics.gridEfficiency * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Cost</span>
                    <span className="text-yellow-400 font-mono">${metrics.averageCost.toFixed(2)}/MWh</span>
                  </div>
                </div>
              </div>

              {/* Grid Status */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Grid Status</h3>
                <div className="text-center">
                  <canvas
                    ref={chartRef}
                    width={200}
                    height={200}
                    className="mx-auto"
                  />
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Peak Demand</span>
                      <span className="text-white">{metrics.peakDemand.toFixed(1)} MW</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Peak Supply</span>
                      <span className="text-white">{metrics.peakSupply.toFixed(1)} MW</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Stability</span>
                      <span className="text-white">{(metrics.frequencyStability * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Status */}
              {currentData && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Current Status</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Time</span>
                      <span className="text-white">{currentData.timestamp}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Demand</span>
                      <span className="text-red-400">{currentData.totalDemand.toFixed(1)} MW</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Supply</span>
                      <span className="text-green-400">{currentData.totalSupply.toFixed(1)} MW</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Frequency</span>
                      <span className="text-blue-400">{currentData.gridFrequency.toFixed(2)} Hz</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}