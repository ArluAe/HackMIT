'use client';

import { useRouter } from 'next/navigation';

interface SimulationHeaderProps {
  isSimulationRunning: boolean;
  onToggleSimulation: () => void;
  // Hierarchical props
  currentLayer: number;
  selectedNodes: string[];
  isSelectionMode: boolean;
  onToggleSelectionMode: () => void;
  onCreateGroup: () => void;
  onNavigateUp: () => void;
  onNavigateDown: (groupNodeId: string) => void;
  onClearSelection: () => void;
}

export default function SimulationHeader({
  isSimulationRunning,
  onToggleSimulation,
  currentLayer,
  selectedNodes,
  isSelectionMode,
  onToggleSelectionMode,
  onCreateGroup,
  onNavigateUp,
  onNavigateDown,
  onClearSelection
}: SimulationHeaderProps) {
  const router = useRouter();

  return (
    <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="w-6 h-6 bg-gray-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <h1 className="text-lg font-bold text-white">GridForge</h1>
          </div>

          {/* Selection Tools */}
          <div className="flex items-center space-x-2">
            {/* Layer Navigation */}
            <div className="flex items-center space-x-1 bg-gray-800 rounded-lg p-1">
              <button
                onClick={onNavigateUp}
                disabled={currentLayer === 0}
                className="p-1.5 rounded text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Navigate Up"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <span className="px-2 py-1 text-xs text-gray-300 bg-gray-700 rounded">
                L{currentLayer}
              </span>
            </div>

            {/* Selection Mode Toggle */}
            <button
              onClick={onToggleSelectionMode}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                isSelectionMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              {isSelectionMode ? 'Exit Select' : 'Select'}
            </button>

            {/* Create Group Button */}
            {selectedNodes.length > 1 && (
              <button
                onClick={onCreateGroup}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
              >
                Create Group ({selectedNodes.length})
              </button>
            )}

            {/* Clear Selection */}
            {selectedNodes.length > 0 && (
              <button
                onClick={onClearSelection}
                className="p-1.5 text-gray-400 hover:text-white transition-colors"
                title="Clear Selection"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onToggleSimulation}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                isSimulationRunning 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'metallic-button text-white'
              }`}
            >
              {isSimulationRunning ? 'Stop' : 'Start'}
            </button>
            <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-medium">U</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
