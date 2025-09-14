'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

export default function NewSimulation() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    simulationType: 'factory',
    energySource: 'mixed',
    gridCapacity: '',
    estimatedDemand: '',
    timeHorizon: '1year'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Creating simulation with data:', formData);
    
    // Navigate to simulation workspace
    router.push('/simulation/workspace');
  };

  const handleCancel = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <Logo size="md" />
              <h1 className="text-2xl font-bold text-white">EnergyLens</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">U</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Create New Simulation</h2>
          <p className="text-gray-400">Configure your energy network simulation parameters</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="metallic-card p-6 rounded-xl">
            <h3 className="text-xl font-semibold text-white mb-6">Basic Information</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Simulation Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                  placeholder="e.g., Factory A Energy Network"
                />
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                  placeholder="e.g., San Francisco, CA"
                />
              </div>
            </div>
            <div className="mt-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                placeholder="Describe your energy network and simulation goals..."
              />
            </div>
          </div>

          {/* Simulation Configuration */}
          <div className="metallic-card p-6 rounded-xl">
            <h3 className="text-xl font-semibold text-white mb-6">Simulation Configuration</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="simulationType" className="block text-sm font-medium text-gray-300 mb-2">
                  Simulation Type *
                </label>
                <select
                  id="simulationType"
                  name="simulationType"
                  value={formData.simulationType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                >
                  <option value="factory">Factory</option>
                  <option value="community">Community</option>
                  <option value="industrial">Industrial Complex</option>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
              <div>
                <label htmlFor="energySource" className="block text-sm font-medium text-gray-300 mb-2">
                  Primary Energy Source *
                </label>
                <select
                  id="energySource"
                  name="energySource"
                  value={formData.energySource}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                >
                  <option value="mixed">Mixed (Grid + Renewables)</option>
                  <option value="renewable">100% Renewable</option>
                  <option value="grid">Grid Only</option>
                  <option value="solar">Solar Focused</option>
                  <option value="wind">Wind Focused</option>
                </select>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div>
                <label htmlFor="gridCapacity" className="block text-sm font-medium text-gray-300 mb-2">
                  Grid Capacity (kW) *
                </label>
                <input
                  type="number"
                  id="gridCapacity"
                  name="gridCapacity"
                  value={formData.gridCapacity}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                  placeholder="e.g., 1000"
                />
              </div>
              <div>
                <label htmlFor="estimatedDemand" className="block text-sm font-medium text-gray-300 mb-2">
                  Estimated Demand (kWh/day) *
                </label>
                <input
                  type="number"
                  id="estimatedDemand"
                  name="estimatedDemand"
                  value={formData.estimatedDemand}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                  placeholder="e.g., 5000"
                />
              </div>
            </div>
            <div className="mt-6">
              <label htmlFor="timeHorizon" className="block text-sm font-medium text-gray-300 mb-2">
                Simulation Time Horizon *
              </label>
              <select
                id="timeHorizon"
                name="timeHorizon"
                value={formData.timeHorizon}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
              >
                <option value="1month">1 Month</option>
                <option value="3months">3 Months</option>
                <option value="6months">6 Months</option>
                <option value="1year">1 Year</option>
                <option value="2years">2 Years</option>
                <option value="5years">5 Years</option>
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="metallic-button px-6 py-3 rounded-lg text-white font-semibold hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Simulation...</span>
                </div>
              ) : (
                'Create Simulation'
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
