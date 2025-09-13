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
            onClick={() => onAddNode('generator')}
            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg hover:border-gray-500 transition-colors text-left flex items-center space-x-3"
          >
            <div className="text-green-400 text-xl">⚡</div>
            <div>
              <div className="text-white text-sm font-medium">Solar Generator</div>
              <div className="text-gray-400 text-xs">Add solar energy source</div>
            </div>
          </button>
          <button
            onClick={() => onAddNode('generator')}
            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg hover:border-gray-500 transition-colors text-left flex items-center space-x-3"
          >
            <div className="text-blue-400 text-xl">🌬️</div>
            <div>
              <div className="text-white text-sm font-medium">Wind Generator</div>
              <div className="text-gray-400 text-xs">Add wind energy source</div>
            </div>
          </button>
          <button
            onClick={() => onAddNode('grid')}
            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg hover:border-gray-500 transition-colors text-left flex items-center space-x-3"
          >
            <div className="text-purple-400 text-xl">🔌</div>
            <div>
              <div className="text-white text-sm font-medium">Grid Connection</div>
              <div className="text-gray-400 text-xs">Connect to main grid</div>
            </div>
          </button>
        </div>
      </div>

      {/* Add Factories */}
      <div className="mb-6">
        <h4 className="text-white font-medium mb-3">Factories & Consumers</h4>
        <div className="space-y-2">
          <button
            onClick={() => onAddNode('consumer')}
            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg hover:border-gray-500 transition-colors text-left flex items-center space-x-3"
          >
            <div className="text-yellow-400 text-xl">🏭</div>
            <div>
              <div className="text-white text-sm font-medium">Factory</div>
              <div className="text-gray-400 text-xs">Add industrial facility</div>
            </div>
          </button>
          <button
            onClick={() => onAddNode('consumer')}
            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg hover:border-gray-500 transition-colors text-left flex items-center space-x-3"
          >
            <div className="text-orange-400 text-xl">🏢</div>
            <div>
              <div className="text-white text-sm font-medium">Commercial Building</div>
              <div className="text-gray-400 text-xs">Add commercial consumer</div>
            </div>
          </button>
          <button
            onClick={() => onAddNode('storage')}
            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg hover:border-gray-500 transition-colors text-left flex items-center space-x-3"
          >
            <div className="text-blue-400 text-xl">🔋</div>
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
            <div className="text-gray-300">Power: {selectedNode.power}kW</div>
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
