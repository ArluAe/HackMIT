'use client';

import { useState, useEffect } from 'react';

interface FamilyNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (familyName: string) => void;
  selectedNodeCount: number;
}

export default function FamilyNameModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  selectedNodeCount 
}: FamilyNameModalProps) {
  const [familyName, setFamilyName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFamilyName(`Family ${selectedNodeCount}`);
    }
  }, [isOpen, selectedNodeCount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (familyName.trim()) {
      onConfirm(familyName.trim());
      setFamilyName('');
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div 
        className="bg-gray-800 border border-gray-600 rounded-lg p-6 w-96 max-w-md mx-4"
        onKeyDown={handleKeyDown}
      >
        <h3 className="text-white text-lg font-semibold mb-4">
          Create Family Group
        </h3>
        
        <p className="text-gray-300 text-sm mb-4">
          You have selected {selectedNodeCount} nodes. Give your family group a name:
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <input
              type="text"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="Enter family name..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!familyName.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
            >
              Create Family
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
