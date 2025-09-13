'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Node } from '@/types/simulation';

interface EnergyNodeProps extends NodeProps {
  data: Node;
}

const EnergyNode = memo(({ data, selected }: EnergyNodeProps) => {
  const getNodeColor = (node: Node) => {
    switch (node.type) {
      case 'generator': return node.status === 'active' ? '#10b981' : '#6b7280';
      case 'consumer': return node.status === 'active' ? '#f59e0b' : '#6b7280';
      case 'storage': 
        if (node.status === 'charging') return '#3b82f6';
        if (node.status === 'discharging') return '#ef4444';
        return '#6b7280';
      case 'grid': return node.status === 'active' ? '#8b5cf6' : '#6b7280';
      default: return '#6b7280';
    }
  };

  const getNodeIcon = (node: Node) => {
    switch (node.type) {
      case 'generator': return '⚡';
      case 'consumer': return '🏭';
      case 'storage': return '🔋';
      case 'grid': return '🔌';
      default: return '⚪';
    }
  };

  const getNodeLabel = (node: Node) => {
    switch (node.type) {
      case 'generator': return 'Solar/Wind';
      case 'consumer': return 'Factory';
      case 'storage': return 'Battery';
      case 'grid': return 'Grid';
      default: return 'Node';
    }
  };

  return (
    <div className={`relative ${selected ? 'ring-2 ring-white' : ''}`}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-gray-600 border-2 border-gray-400"
        style={{ top: '50%', left: '-6px' }}
      />
      
      {/* Node Body */}
      <div
        className="flex flex-col items-center p-4 rounded-lg border-2 min-w-[120px]"
        style={{
          backgroundColor: getNodeColor(data),
          borderColor: selected ? '#ffffff' : '#374151',
        }}
      >
        {/* Node Icon */}
        <div className="text-2xl mb-2">{getNodeIcon(data)}</div>
        
        {/* Node Name */}
        <div className="text-white font-semibold text-sm text-center mb-1">
          {data.name}
        </div>
        
        {/* Node Type */}
        <div className="text-gray-200 text-xs mb-1">
          {getNodeLabel(data)}
        </div>
        
        {/* Power Value */}
        <div className="text-gray-300 text-xs">
          {data.power}kW
        </div>
        
        {/* Status Indicator */}
        <div className="absolute top-2 right-2">
          <div
            className={`w-2 h-2 rounded-full ${
              data.status === 'active' ? 'bg-green-400' :
              data.status === 'charging' ? 'bg-blue-400' :
              data.status === 'discharging' ? 'bg-red-400' :
              'bg-gray-400'
            }`}
          />
        </div>
      </div>
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-gray-600 border-2 border-gray-400"
        style={{ top: '50%', right: '-6px' }}
      />
    </div>
  );
});

EnergyNode.displayName = 'EnergyNode';

export default EnergyNode;
