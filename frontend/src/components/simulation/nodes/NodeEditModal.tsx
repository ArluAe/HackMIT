'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Node } from '@/types/simulation';

interface NodeEditModalProps {
  node: Node | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedNode: Node) => void;
}

export default function NodeEditModal({ node, isOpen, onClose, onSave }: NodeEditModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    power: 0,
    status: 'active' as 'active' | 'inactive' | 'charging' | 'discharging',
  });

  useEffect(() => {
    if (node) {
      setFormData({
        name: node.name,
        power: node.power,
        status: node.status,
      });
    }
  }, [node]);

  const handleSave = () => {
    if (node) {
      const updatedNode: Node = {
        ...node,
        name: formData.name,
        power: formData.power,
        status: formData.status,
      };
      onSave(updatedNode);
      onClose();
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!isOpen || !node) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div 
        className="bg-gray-800/95 backdrop-blur-sm border rounded-lg shadow-2xl max-w-4xl w-full mx-4 transform -translate-y-8"
        style={{
          borderColor: 'rgba(71, 85, 105, 0.3)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        {/* Header */}
        <div 
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: 'rgba(71, 85, 105, 0.2)' }}
        >
          <h2 className="text-white font-semibold text-lg">Edit Node Settings</h2>
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
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Node Type Display */}
            <div 
              className="px-4 py-3 rounded"
              style={{
                backgroundColor: 'rgba(71, 85, 105, 0.1)',
                border: '1px solid rgba(71, 85, 105, 0.2)',
              }}
            >
              <div className="flex items-center space-x-3">
                <div className="text-blue-300">
                  {node.type === 'generator' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )}
                  {node.type === 'consumer' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  )}
                  {node.type === 'storage' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                  {node.type === 'grid' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="text-white font-medium capitalize">{node.type}</h3>
                  <p className="text-gray-400 text-sm">Node Type</p>
                </div>
              </div>
            </div>

            {/* Node Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Node Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                style={{
                  borderColor: 'rgba(71, 85, 105, 0.3)',
                  backgroundColor: 'rgba(55, 65, 81, 0.5)',
                }}
                placeholder="Enter node name"
              />
            </div>

            {/* Power Output */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Power Output (kW)</label>
              <input
                type="number"
                value={formData.power}
                onChange={(e) => handleInputChange('power', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                style={{
                  borderColor: 'rgba(71, 85, 105, 0.3)',
                  backgroundColor: 'rgba(55, 65, 81, 0.5)',
                }}
                placeholder="Enter power output"
                min="0"
                step="1"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-4 py-3 bg-gray-700/50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                style={{
                  borderColor: 'rgba(71, 85, 105, 0.3)',
                  backgroundColor: 'rgba(55, 65, 81, 0.5)',
                }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                {node.type === 'storage' && (
                  <>
                    <option value="charging">Charging</option>
                    <option value="discharging">Discharging</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Node ID (Read-only) - Full width */}
          <div className="mt-6 space-y-2">
            <label className="block text-sm font-medium text-gray-300">Node ID</label>
            <div 
              className="px-4 py-3 rounded text-gray-400 text-sm font-mono"
              style={{
                backgroundColor: 'rgba(71, 85, 105, 0.1)',
                border: '1px solid rgba(71, 85, 105, 0.2)',
              }}
            >
              {node.id}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div 
          className="px-6 py-4 border-t flex justify-end space-x-3"
          style={{ borderColor: 'rgba(71, 85, 105, 0.2)' }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
