'use client';

import { useState, useEffect } from 'react';
import { Connection } from '@/types/simulation';

interface ConnectionCreationModalProps {
  isOpen: boolean;
  fromNodeId: string | null;
  toNodeId: string | null;
  fromNodeName: string;
  toNodeName: string;
  onClose: () => void;
  onCreateConnection: (connectionData: Partial<Connection>) => void;
}

export default function ConnectionCreationModal({ 
  isOpen, 
  fromNodeId, 
  toNodeId, 
  fromNodeName, 
  toNodeName, 
  onClose, 
  onCreateConnection 
}: ConnectionCreationModalProps) {
  const [formData, setFormData] = useState({
    resistance: 1.0,
    maxPower: 1000,
    status: 'active' as Connection['status']
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        resistance: 1.0,
        maxPower: 1000,
        status: 'active'
      });
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.resistance <= 0) {
      newErrors.resistance = 'Resistance must be greater than 0';
    }

    if (formData.maxPower <= 0) {
      newErrors.maxPower = 'Max Power must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !fromNodeId || !toNodeId) return;

    const connectionData: Partial<Connection> = {
      from: fromNodeId,
      to: toNodeId,
      power: 0, // Initial power is 0
      status: formData.status,
      resistance: formData.resistance,
      maxPower: formData.maxPower
    };

    onCreateConnection(connectionData);
    onClose();
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen || !fromNodeId || !toNodeId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">
            Create Connection
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

        <div className="mb-4 p-3 bg-gray-800 rounded-lg">
          <div className="text-sm text-gray-300">
            <span className="text-blue-300">{fromNodeName}</span>
            <span className="mx-2">→</span>
            <span className="text-green-300">{toNodeName}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Resistance */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Resistance (Ω)
            </label>
            <input
              type="number"
              value={formData.resistance}
              onChange={(e) => handleInputChange('resistance', parseFloat(e.target.value) || 0)}
              className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.resistance ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="Enter resistance value"
              min="0.1"
              step="0.1"
            />
            {errors.resistance && (
              <p className="mt-1 text-sm text-red-400">{errors.resistance}</p>
            )}
          </div>

          {/* Max Power */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Power (kW)
            </label>
            <input
              type="number"
              value={formData.maxPower}
              onChange={(e) => handleInputChange('maxPower', parseFloat(e.target.value) || 0)}
              className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.maxPower ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="Enter max power value"
              min="1"
              step="1"
            />
            {errors.maxPower && (
              <p className="mt-1 text-sm text-red-400">{errors.maxPower}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value as Connection['status'])}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
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
              Create Connection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
