'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Node } from '@/types/simulation';

interface EnergyNodeProps extends NodeProps {
  data: Node & { 
    onEditNode?: (node: Node) => void;
    onToggleSelection?: (nodeId: string) => void;
    isSelected?: boolean;
    isSelectionMode?: boolean;
  };
}

const EnergyNode = memo(({ data, selected }: EnergyNodeProps) => {
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onEditNode) {
      data.onEditNode(data);
    }
  };

  const handleNodeClick = (e: React.MouseEvent) => {
    if (data.isSelectionMode && data.onToggleSelection) {
      e.stopPropagation();
      data.onToggleSelection(data.id);
    }
  };
  const getNodeColor = (node: Node) => {
    const baseColors = {
      generator: 'rgba(51, 65, 85, 0.6)', // Lighter blue-gray
      consumer: 'rgba(51, 65, 85, 0.6)', // Lighter blue-gray  
      storage: 'rgba(51, 65, 85, 0.6)', // Lighter blue-gray
      grid: 'rgba(51, 65, 85, 0.6)', // Lighter blue-gray
    };
    
    const activeColors = {
      generator: 'rgba(96, 165, 250, 0.4)', // Lighter blue
      consumer: 'rgba(74, 222, 128, 0.4)', // Lighter green
      storage: 'rgba(196, 181, 253, 0.4)', // Lighter purple
      grid: 'rgba(251, 191, 36, 0.4)', // Lighter orange
    };
    
    const baseColor = baseColors[node.type] || baseColors.generator;
    const activeColor = activeColors[node.type] || activeColors.generator;
    
    if (node.type === 'storage') {
      if (node.status === 'charging') return 'rgba(96, 165, 250, 0.5)';
      if (node.status === 'discharging') return 'rgba(248, 113, 113, 0.4)';
    }
    
    return node.status === 'active' ? activeColor : baseColor;
  };

  const getNodeIcon = (node: Node) => {
    switch (node.type) {
      case 'generator': 
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'consumer': 
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'storage': 
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        );
      case 'grid': 
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        );
      default: 
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
          </svg>
        );
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

  const getNodeTitle = (node: Node) => {
    switch (node.type) {
      case 'generator': return 'Energy Source';
      case 'consumer': return 'Factory Unit';
      case 'storage': return 'Battery System';
      case 'grid': return 'Grid Connection';
      default: return 'Node';
    }
  };

  const getNodeDescription = (node: Node) => {
    switch (node.type) {
      case 'generator': return 'Renewable energy generation system';
      case 'consumer': return 'Industrial energy consumption unit';
      case 'storage': return 'Energy storage and management system';
      case 'grid': return 'Main electrical grid connection point';
      default: return 'Network component';
    }
  };

  return (
    <div 
      className={`relative ${selected ? 'ring-1 ring-blue-300/40' : ''} ${data.isSelected ? 'ring-2 ring-green-400/60' : ''}`}
      onClick={handleNodeClick}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2 border"
        style={{ 
          top: '50%', 
          left: '-4px',
          backgroundColor: 'rgba(147, 51, 234, 0.6)',
          borderColor: 'rgba(196, 181, 253, 0.4)',
        }}
      />
      
      {/* Node Body */}
      <div
        className="flex flex-col min-w-[200px] max-w-[240px] rounded-lg border backdrop-blur-sm overflow-hidden"
        style={{
          backgroundColor: getNodeColor(data),
          borderColor: selected ? 'rgba(255,255,255,0.2)' : 'rgba(71, 85, 105, 0.3)',
          boxShadow: selected 
            ? '0 6px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)' 
            : '0 3px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.03)',
          borderWidth: '1px',
        }}
      >
        {/* Header Section */}
        <div 
          className="px-4 py-3 border-b"
          style={{
            borderColor: 'rgba(71, 85, 105, 0.2)',
            backgroundColor: 'rgba(0,0,0,0.05)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="text-blue-300">{getNodeIcon(data)}</div>
              <div>
                <h3 className="text-white font-semibold text-sm">{getNodeTitle(data)}</h3>
                <p className="text-gray-300 text-xs">{getNodeDescription(data)}</p>
              </div>
            </div>
            <div className="flex">
              <div 
                onClick={handleEditClick}
                className="w-8 h-8 rounded bg-gray-600/30 flex items-center justify-center cursor-pointer hover:bg-gray-500/40 transition-all duration-200 group"
              >
                <svg className="w-4 h-4 text-gray-300 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-3 space-y-2">
          {/* Power Output */}
          <div 
            className="flex items-center justify-between px-3 py-2 rounded"
            style={{
              backgroundColor: 'rgba(96, 165, 250, 0.05)',
              border: '1px solid rgba(96, 165, 250, 0.1)',
            }}
          >
            <span className="text-blue-100 text-sm">Power Output</span>
            <div className="flex items-center space-x-2">
              <span className="text-blue-200 text-xs font-mono">{data.power}kW</span>
              <span className="text-gray-400 text-xs">Float</span>
            </div>
          </div>

          {/* Status */}
          <div 
            className="flex items-center justify-between px-3 py-2 rounded"
            style={{
              backgroundColor: data.status === 'active' 
                ? 'rgba(74, 222, 128, 0.05)' 
                : 'rgba(71, 85, 105, 0.05)',
              border: `1px solid ${data.status === 'active' 
                ? 'rgba(74, 222, 128, 0.1)' 
                : 'rgba(71, 85, 105, 0.1)'}`,
            }}
          >
            <span className="text-blue-100 text-sm">Status</span>
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  data.status === 'active' ? 'bg-green-300' :
                  data.status === 'charging' ? 'bg-blue-300' :
                  data.status === 'discharging' ? 'bg-red-300' :
                  'bg-gray-400'
                }`}
              />
              <span className="text-blue-200 text-xs font-mono capitalize">{data.status}</span>
            </div>
          </div>

          {/* Node ID */}
          <div 
            className="flex items-center justify-between px-3 py-2 rounded"
            style={{
              backgroundColor: 'rgba(71, 85, 105, 0.05)',
              border: '1px solid rgba(71, 85, 105, 0.1)',
            }}
          >
            <span className="text-blue-100 text-sm">Node ID</span>
            <div className="flex items-center space-x-2">
              <span className="text-blue-200 text-xs font-mono">{data.id.slice(-6)}</span>
              <span className="text-gray-400 text-xs">String</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-2 border"
        style={{ 
          top: '50%', 
          right: '-4px',
          backgroundColor: 'rgba(147, 51, 234, 0.6)',
          borderColor: 'rgba(196, 181, 253, 0.4)',
        }}
      />

    </div>
  );
});

EnergyNode.displayName = 'EnergyNode';

export default EnergyNode;
