'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadCityModels, getCityModels, cityModelMetadata } from '@/services/cityModels';
import { GraphExportData } from '@/types/simulation';

export default function Dashboard() {
  const router = useRouter();
  const [isCreatingSimulation, setIsCreatingSimulation] = useState(false);
  const [cityModels, setCityModels] = useState<{ compactCity: GraphExportData | null; largeCity: GraphExportData | null }>({
    compactCity: null,
    largeCity: null
  });

  // Load city models on component mount
  useEffect(() => {
    loadCityModels().then(() => {
      setCityModels(getCityModels());
    });
  }, []);

  const handleCreateSimulation = () => {
    window.open('/simulation/new', '_blank');
  };

  const handleLoadCityModel = (modelId: string) => {
    const { compactCity, largeCity } = cityModels;
    let modelData: GraphExportData | null = null;

    if (modelId === 'compact-city' && compactCity) {
      modelData = compactCity;
    } else if (modelId === 'large-city' && largeCity) {
      modelData = largeCity;
    }

    if (modelData) {
      // Store the model data in sessionStorage for the simulation workspace to load
      sessionStorage.setItem('loadedSimulationData', JSON.stringify(modelData));
      // Navigate to simulation workspace
      router.push('/simulation/workspace');
    }
  };

  // Mock data for dashboard
  const recentSimulations = [
    { id: 1, name: 'Factory A Energy Network', status: 'Running', savings: '$12,450', lastRun: '2 hours ago' },
    { id: 2, name: 'Community Solar Grid', status: 'Completed', savings: '$8,230', lastRun: '1 day ago' },
    { id: 3, name: 'Industrial Complex B', status: 'Paused', savings: '$5,670', lastRun: '3 days ago' },
  ];

  const quickActions = [
    { name: 'New Simulation', icon: '⚡' },
    { name: 'Import Data', icon: '📊' },
    { name: 'View Reports', icon: '📈' },
    { name: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">G</span>
              </div>
              <h1 className="text-2xl font-bold text-white">GridForge</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleCreateSimulation}
                disabled={isCreatingSimulation}
                className="metallic-button px-4 py-2 rounded-lg text-white font-medium hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingSimulation ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>New Simulation</span>
                  </div>
                )}
              </button>
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">U</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="metallic-card p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Savings</p>
                <p className="text-2xl font-bold text-white">$2.4M</p>
                <p className="text-gray-400 text-xs">+12% this month</p>
              </div>
              <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="metallic-card p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Simulations</p>
                <p className="text-2xl font-bold text-white">1,247</p>
                <p className="text-gray-400 text-xs">+23 this week</p>
              </div>
              <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="metallic-card p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Energy Optimized</p>
                <p className="text-2xl font-bold text-white">2.1M kWh</p>
                <p className="text-gray-400 text-xs">+8% efficiency</p>
              </div>
              <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="metallic-card p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Cost Reduction</p>
                <p className="text-2xl font-bold text-white">35%</p>
                <p className="text-gray-400 text-xs">Average savings</p>
              </div>
              <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* City Models Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">🏙️ Pre-built City Models</h2>
            <p className="text-gray-400 text-sm">Click to load directly into simulation</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {cityModelMetadata.map((model) => (
              <div
                key={model.id}
                onClick={() => handleLoadCityModel(model.id)}
                className={`metallic-card p-6 rounded-xl cursor-pointer hover:scale-105 transition-all duration-200 bg-gradient-to-br ${model.color} hover:shadow-lg hover:shadow-purple-500/20`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{model.image}</div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{model.name}</h3>
                      <p className="text-gray-200 text-sm">{model.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold text-lg">{model.nodes} nodes</div>
                    <div className="text-gray-200 text-sm">{model.families} families</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="text-gray-300">Connections</div>
                    <div className="text-white font-semibold">{model.connections}</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="text-gray-300">Dimensions</div>
                    <div className="text-white font-semibold">{model.dimensions}</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="text-gray-300">Initial Zoom</div>
                    <div className="text-white font-semibold">{model.zoom}</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="text-gray-300">Status</div>
                    <div className="text-green-400 font-semibold">Ready</div>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-gray-300 text-sm">
                    Click to load at Layer 0
                  </div>
                  <div className="text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Simulations */}
          <div className="lg:col-span-2">
            <div className="metallic-card p-6 rounded-xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">Recent Simulations</h3>
                <button className="text-gray-400 hover:text-white text-sm font-medium">View All</button>
              </div>
              <div className="space-y-4">
                {recentSimulations.map((sim) => (
                  <div key={sim.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{sim.name}</h4>
                        <p className="text-gray-400 text-sm">Last run: {sim.lastRun}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-white font-semibold">{sim.savings}</p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          sim.status === 'Running' ? 'bg-gray-700 text-gray-300' :
                          sim.status === 'Completed' ? 'bg-gray-600 text-gray-200' :
                          'bg-gray-800 text-gray-400'
                        }`}>
                          {sim.status}
                        </span>
                      </div>
                      <button className="text-gray-400 hover:text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions & System Status */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="metallic-card p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors text-left"
                  >
                    <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center mb-2">
                      <span className="text-lg">{action.icon}</span>
                    </div>
                    <p className="text-white text-sm font-medium">{action.name}</p>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
