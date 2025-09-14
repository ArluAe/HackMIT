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
  onNavigateDown: (groupNodeId?: string) => void;
  onClearSelection: () => void;
  // Import/Export props
  onExportGraph: () => void;
  onImportGraph: (file: File) => void;
  onApplyLayout: () => void;
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
  onClearSelection,
  onExportGraph,
  onImportGraph,
  onApplyLayout
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
              {currentLayer === 0 ? (
                // Layer 0: Show up arrow to go to higher layer
                <button
                  onClick={onNavigateUp}
                  className="p-1.5 rounded text-gray-400 hover:text-white transition-colors"
                  title="Go to Higher Layer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
              ) : (
                // Layer 1+: Show down arrow to go to lower layer
                <button
                  onClick={() => onNavigateDown('')}
                  className="p-1.5 rounded text-gray-400 hover:text-white transition-colors"
                  title="Go to Lower Layer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
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

            {/* Import/Export Divider */}
            <div className="w-px h-6 bg-gray-600 mx-2"></div>

            {/* Export Button */}
            <button
              onClick={onExportGraph}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm font-medium transition-colors flex items-center space-x-1"
              title="Export Graph"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export</span>
            </button>

            {/* Import Button */}
            <label className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm font-medium transition-colors flex items-center space-x-1 cursor-pointer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              <span>Import</span>
              <input
                type="file"
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onImportGraph(file);
                    e.target.value = ''; // Reset input
                  }
                }}
                className="hidden"
              />
            </label>

            {/* Layout Button */}
            <button
              onClick={onApplyLayout}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors flex items-center space-x-1"
              title="Apply Smart Layout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              <span>Layout</span>
            </button>
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
