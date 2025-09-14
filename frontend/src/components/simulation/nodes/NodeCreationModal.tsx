'use client';

import { useState, useEffect } from 'react';
import { Node } from '@/types/simulation';

interface NodeCreationModalProps {
  isOpen: boolean;
  nodeType: Node['type'] | null;
  onClose: () => void;
  onCreateNode: (nodeData: Partial<Node>) => void;
}

export default function NodeCreationModal({ 
  isOpen, 
  nodeType, 
  onClose, 
  onCreateNode 
}: NodeCreationModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    power: 100,
    inertia: 0,
    friction: 0,
    status: 'active' as Node['status']
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens with new node type
  useEffect(() => {
    if (isOpen && nodeType) {
      const defaultName = getDefaultName(nodeType);
      setFormData({
        name: defaultName,
        power: getDefaultPower(nodeType),
        inertia: getDefaultInertia(nodeType),
        friction: getDefaultFriction(nodeType),
        status: 'active'
      });
      setErrors({});
    }
  }, [isOpen, nodeType]);

  const getDefaultName = (type: Node['type']) => {
    switch (type) {
      case 'solar-generator': return 'Solar Panel';
      case 'wind-generator': return 'Wind Turbine';
      case 'natural-gas-generator': return 'Gas Plant';
      case 'coal-generator': return 'Coal Plant';
      case 'hydroelectric-generator': return 'Hydro Plant';
      case 'factory': return 'Factory';
      case 'commercial-building': return 'Commercial Building';
      case 'residential': return 'Residential';
      case 'battery-storage': return 'Battery Storage';
      case 'grid': return 'Substation';
      case 'group': return 'Group';
      default: return 'Node';
    }
  };

  const getDefaultPower = (type: Node['type']) => {
    switch (type) {
      case 'solar-generator': return 500;
      case 'wind-generator': return 400;
      case 'natural-gas-generator': return 800;
      case 'coal-generator': return 1000;
      case 'hydroelectric-generator': return 600;
      case 'factory': return 300;
      case 'commercial-building': return 150;
      case 'residential': return 50;
      case 'battery-storage': return 200;
      case 'grid': return 2000;
      case 'group': return 0;
      default: return 100;
    }
  };

  const getDefaultInertia = (type: Node['type']) => {
    switch (type) {
      case 'solar-generator': return 2;
      case 'wind-generator': return 5;
      case 'natural-gas-generator': return 8;
      case 'coal-generator': return 10;
      case 'hydroelectric-generator': return 6;
      case 'factory': return 4;
      case 'commercial-building': return 1;
      case 'residential': return 0.5;
      case 'battery-storage': return 3;
      case 'grid': return 15;
      case 'group': return 0;
      default: return 1;
    }
  };

  const getDefaultFriction = (type: Node['type']) => {
    switch (type) {
      case 'solar-generator': return 0.5;
      case 'wind-generator': return 1;
      case 'natural-gas-generator': return 2;
      case 'coal-generator': return 3;
      case 'hydroelectric-generator': return 1.5;
      case 'factory': return 1.5;
      case 'commercial-building': return 0.5;
      case 'residential': return 0.2;
      case 'battery-storage': return 1;
      case 'grid': return 4;
      case 'group': return 0;
      default: return 0.5;
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.power < 0) {
      newErrors.power = 'Power must be non-negative';
    }

    if (formData.inertia < 0) {
      newErrors.inertia = 'Inertia must be non-negative';
    }

    if (formData.friction < 0) {
      newErrors.friction = 'Friction must be non-negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !nodeType) return;

    const nodeData: Partial<Node> = {
      type: nodeType,
      name: formData.name.trim(),
      status: formData.status,
      settings: {
        power: formData.power,
        type: nodeType,
        inertia: formData.inertia,
        friction: formData.friction
      }
    };

    onCreateNode(nodeData);
    onClose();
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen || !nodeType) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">
            Create {getDefaultName(nodeType)}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Node Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Node Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="Enter node name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-400">{errors.name}</p>
            )}
          </div>

          {/* Power */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Power (kW)
            </label>
            <input
              type="number"
              value={formData.power}
              onChange={(e) => handleInputChange('power', parseFloat(e.target.value) || 0)}
              className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.power ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="Enter power value"
              min="0"
              step="0.1"
            />
            {errors.power && (
              <p className="mt-1 text-sm text-red-400">{errors.power}</p>
            )}
          </div>

          {/* Inertia */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Inertia
            </label>
            <input
              type="number"
              value={formData.inertia}
              onChange={(e) => handleInputChange('inertia', parseFloat(e.target.value) || 0)}
              className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.inertia ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="Enter inertia value"
              min="0"
              step="0.1"
            />
            {errors.inertia && (
              <p className="mt-1 text-sm text-red-400">{errors.inertia}</p>
            )}
          </div>

          {/* Friction */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Friction
            </label>
            <input
              type="number"
              value={formData.friction}
              onChange={(e) => handleInputChange('friction', parseFloat(e.target.value) || 0)}
              className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.friction ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="Enter friction value"
              min="0"
              step="0.1"
            />
            {errors.friction && (
              <p className="mt-1 text-sm text-red-400">{errors.friction}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value as Node['status'])}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              {nodeType === 'battery-storage' && (
                <>
                  <option value="charging">Charging</option>
                  <option value="discharging">Discharging</option>
                </>
              )}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Node
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
