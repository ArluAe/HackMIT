'use client';

import { Node } from '@/types/simulation';

interface ControlPanelProps {
  selectedNode: Node | null;
  networkStats: {
    totalGeneration: number;
    totalConsumption: number;
    storageCapacity: number;
    activeNodes: number;
  };
  onAddNode: (type: Node['type']) => void;
  onDeleteNode: (nodeId: string) => void;
}

export default function ControlPanel({
  selectedNode,
  networkStats,
  onAddNode,
  onDeleteNode
}: ControlPanelProps) {
  return (
    <div className="w-80 bg-gray-900/50 border-r border-gray-700 p-4 overflow-y-auto h-full">
      <h3 className="text-lg font-semibold text-white mb-4">Network Controls</h3>
      
      {/* Add Energy Sources */}
      <div className="mb-6">
        <h4 className="text-white font-medium mb-3">Energy Sources</h4>
        <div className="space-y-2">
          <button
            onClick={() => onAddNode('solar-generator')}
            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg hover:border-gray-500 transition-colors text-left flex items-center space-x-3"
          >
            <div className="text-yellow-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <div className="text-white text-sm font-medium">Solar Generator</div>
              <div className="text-gray-400 text-xs">Add solar energy source</div>
            </div>
          </button>
          <button
            onClick={() => onAddNode('wind-generator')}
            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg hover:border-gray-500 transition-colors text-left flex items-center space-x-3"
          >
            <div className="text-blue-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </div>
            <div>
              <div className="text-white text-sm font-medium">Wind Generator</div>
              <div className="text-gray-400 text-xs">Add wind energy source</div>
            </div>
          </button>
          <button
            onClick={() => onAddNode('natural-gas-generator')}
            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg hover:border-gray-500 transition-colors text-left flex items-center space-x-3"
          >
            <div className="text-green-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
            </div>
            <div>
              <div className="text-white text-sm font-medium">Natural Gas Generator</div>
              <div className="text-gray-400 text-xs">Add natural gas power plant</div>
            </div>
          </button>
          <button
            onClick={() => onAddNode('coal-generator')}
            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg hover:border-gray-500 transition-colors text-left flex items-center space-x-3"
          >
            <div className="text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <div className="text-white text-sm font-medium">Coal Generator</div>
              <div className="text-gray-400 text-xs">Add coal-fired power plant</div>
            </div>
          </button>
          <button
            onClick={() => onAddNode('hydroelectric-generator')}
            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg hover:border-gray-500 transition-colors text-left flex items-center space-x-3"
          >
            <div className="text-blue-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21v-4a2 2 0 012-2h4a2 2 0 012 2v4" />
              </svg>
            </div>
            <div>
              <div className="text-white text-sm font-medium">Hydroelectric Generator</div>
              <div className="text-gray-400 text-xs">Add hydroelectric power plant</div>
            </div>
          </button>
          <button
            onClick={() => onAddNode('grid')}
            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg hover:border-gray-500 transition-colors text-left flex items-center space-x-3"
          >
            <div className="text-orange-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <div>
              <div className="text-white text-sm font-medium">Substation</div>
              <div className="text-gray-400 text-xs">Electrical substation</div>
            </div>
          </button>
        </div>
      </div>

      {/* Add Consumers */}
      <div className="mb-6">
        <h4 className="text-white font-medium mb-3">Consumers</h4>
        <div className="space-y-2">
          <button
            onClick={() => onAddNode('factory')}
            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg hover:border-gray-500 transition-colors text-left flex items-center space-x-3"
          >
            <div className="text-green-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <div className="text-white text-sm font-medium">Factory</div>
              <div className="text-gray-400 text-xs">Add industrial facility</div>
            </div>
          </button>
          <button
            onClick={() => onAddNode('commercial-building')}
            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg hover:border-gray-500 transition-colors text-left flex items-center space-x-3"
          >
            <div className="text-purple-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21v-4a2 2 0 012-2h4a2 2 0 012 2v4" />
              </svg>
            </div>
            <div>
              <div className="text-white text-sm font-medium">Commercial Building</div>
              <div className="text-gray-400 text-xs">Add commercial consumer</div>
            </div>
          </button>
          <button
            onClick={() => onAddNode('residential')}
            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg hover:border-gray-500 transition-colors text-left flex items-center space-x-3"
          >
            <div className="text-pink-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div>
              <div className="text-white text-sm font-medium">Residential</div>
              <div className="text-gray-400 text-xs">Add residential consumer</div>
            </div>
          </button>
        </div>
      </div>

      {/* Add Storage */}
      <div className="mb-6">
        <h4 className="text-white font-medium mb-3">Storage</h4>
        <div className="space-y-2">
          <button
            onClick={() => onAddNode('battery-storage')}
            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg hover:border-gray-500 transition-colors text-left flex items-center space-x-3"
          >
            <div className="text-purple-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <div className="text-white text-sm font-medium">Battery Storage</div>
              <div className="text-gray-400 text-xs">Add energy storage</div>
            </div>
          </button>
        </div>
      </div>

      {/* Connection Info */}
      <div className="mb-6">
        <h4 className="text-white font-medium mb-3">Connections</h4>
        <div className="p-3 bg-gray-800 border border-gray-600 rounded-lg">
          <p className="text-gray-300 text-sm">
            Drag from one node's handle to another to create connections
          </p>
        </div>
      </div>

      {/* Selected Node Info */}
      {selectedNode && (
        <div className="metallic-card p-4 rounded-lg mb-4">
          <h4 className="text-white font-medium mb-3">Selected Node</h4>
          <div className="space-y-2 text-sm">
            <div className="text-gray-300">Name: {selectedNode.name}</div>
            <div className="text-gray-300">Type: {selectedNode.type}</div>
            <div className="text-gray-300">Power: {selectedNode.settings.power}kW</div>
            <div className="text-gray-300">Status: {selectedNode.status}</div>
            <button
              onClick={() => onDeleteNode(selectedNode.id)}
              className="w-full mt-3 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
            >
              Delete Node
            </button>
          </div>
        </div>
      )}

      {/* Network Stats */}
      <div className="metallic-card p-4 rounded-lg">
        <h4 className="text-white font-medium mb-3">Network Stats</h4>
        <div className="space-y-1 text-sm text-gray-300">
          <div>Total Generation: {networkStats.totalGeneration}kW</div>
          <div>Total Consumption: {networkStats.totalConsumption}kW</div>
          <div>Storage Capacity: {networkStats.storageCapacity}kW</div>
          <div>Active Nodes: {networkStats.activeNodes}</div>
        </div>
      </div>
    </div>
  );
}
