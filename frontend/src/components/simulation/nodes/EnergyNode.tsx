'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Node } from '@/types/simulation';

interface EnergyNodeProps extends NodeProps {
  data: Node & { 
    onEditNode?: (node: Node) => void;
    onDeleteNode?: (nodeId: string) => void;
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
      'solar-generator': 'rgba(51, 65, 85, 0.6)',
      'wind-generator': 'rgba(51, 65, 85, 0.6)',
      'natural-gas-generator': 'rgba(51, 65, 85, 0.6)',
      'coal-generator': 'rgba(51, 65, 85, 0.6)',
      'hydroelectric-generator': 'rgba(51, 65, 85, 0.6)',
      'factory': 'rgba(51, 65, 85, 0.6)',
      'commercial-building': 'rgba(51, 65, 85, 0.6)',
      'residential': 'rgba(51, 65, 85, 0.6)',
      'battery-storage': 'rgba(51, 65, 85, 0.6)',
      'grid': 'rgba(51, 65, 85, 0.6)',
      'group': 'rgba(51, 65, 85, 0.6)',
    };
    
    const activeColors = {
      'solar-generator': 'rgba(255, 193, 7, 0.4)', // Yellow for solar
      'wind-generator': 'rgba(96, 165, 250, 0.4)', // Blue for wind
      'natural-gas-generator': 'rgba(34, 197, 94, 0.4)', // Green for gas
      'coal-generator': 'rgba(107, 114, 128, 0.4)', // Gray for coal
      'hydroelectric-generator': 'rgba(59, 130, 246, 0.4)', // Blue for hydro
      'factory': 'rgba(74, 222, 128, 0.4)', // Green for factory
      'commercial-building': 'rgba(168, 85, 247, 0.4)', // Purple for commercial
      'residential': 'rgba(236, 72, 153, 0.4)', // Pink for residential
      'battery-storage': 'rgba(196, 181, 253, 0.4)', // Purple for storage
      'grid': 'rgba(251, 191, 36, 0.4)', // Orange for grid
      'group': 'rgba(147, 51, 234, 0.4)', // Purple for group
    };
    
    const baseColor = baseColors[node.type] || baseColors['solar-generator'];
    const activeColor = activeColors[node.type] || activeColors['solar-generator'];
    
    if (node.type === 'battery-storage') {
      if (node.status === 'charging') return 'rgba(96, 165, 250, 0.5)';
      if (node.status === 'discharging') return 'rgba(248, 113, 113, 0.4)';
    }
    
    return node.status === 'active' ? activeColor : baseColor;
  };

  const getNodeIcon = (node: Node) => {
    switch (node.type) {
      case 'solar-generator': 
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case 'wind-generator': 
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
        );
      case 'natural-gas-generator': 
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          </svg>
        );
      case 'coal-generator': 
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      case 'hydroelectric-generator': 
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21v-4a2 2 0 012-2h4a2 2 0 012 2v4" />
          </svg>
        );
      case 'factory': 
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'commercial-building': 
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21v-4a2 2 0 012-2h4a2 2 0 012 2v4" />
          </svg>
        );
      case 'residential': 
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      case 'battery-storage': 
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
      case 'group': 
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
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
      case 'solar-generator': return 'Solar';
      case 'wind-generator': return 'Wind';
      case 'natural-gas-generator': return 'Gas';
      case 'coal-generator': return 'Coal';
      case 'hydroelectric-generator': return 'Hydro';
      case 'factory': return 'Factory';
      case 'commercial-building': return 'Commercial';
      case 'residential': return 'Residential';
      case 'battery-storage': return 'Battery';
      case 'grid': return 'Substation';
      case 'group': return 'Group';
      default: return 'Node';
    }
  };

  const getNodeTitle = (node: Node) => {
    switch (node.type) {
      case 'solar-generator': return 'Solar Generator';
      case 'wind-generator': return 'Wind Generator';
      case 'natural-gas-generator': return 'Natural Gas Generator';
      case 'coal-generator': return 'Coal Generator';
      case 'hydroelectric-generator': return 'Hydroelectric Generator';
      case 'factory': return 'Factory';
      case 'commercial-building': return 'Commercial Building';
      case 'residential': return 'Residential';
      case 'battery-storage': return 'Battery Storage';
      case 'grid': return 'Substation';
      case 'group': return 'Group Node';
      default: return 'Node';
    }
  };

  const getNodeDescription = (node: Node) => {
    switch (node.type) {
      case 'solar-generator': return 'Solar photovoltaic energy generation';
      case 'wind-generator': return 'Wind turbine energy generation';
      case 'natural-gas-generator': return 'Natural gas power plant';
      case 'coal-generator': return 'Coal-fired power plant';
      case 'hydroelectric-generator': return 'Hydroelectric power generation';
      case 'factory': return 'Industrial manufacturing facility';
      case 'commercial-building': return 'Commercial energy consumer';
      case 'residential': return 'Residential energy consumer';
      case 'battery-storage': return 'Energy storage and management system';
      case 'grid': return 'Electrical substation and distribution point';
      case 'group': return 'Group of related nodes';
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
            <div className="flex space-x-1">
              <div 
                onClick={handleEditClick}
                className="w-8 h-8 rounded bg-gray-600/30 flex items-center justify-center cursor-pointer hover:bg-gray-500/40 transition-all duration-200 group"
                title="Edit Node"
              >
                <svg className="w-4 h-4 text-gray-300 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-3">
          {/* Power Output */}
          <div 
            className="flex items-center justify-between px-3 py-2 rounded"
            style={{
              backgroundColor: 'rgba(96, 165, 250, 0.05)',
              border: '1px solid rgba(96, 165, 250, 0.1)',
            }}
          >
            <span className="text-blue-100 text-sm">Power</span>
            <div className="flex items-center space-x-2">
              <span className="text-blue-200 text-xs font-mono">{data.settings.power}kW</span>
              <span className="text-gray-400 text-xs">Float</span>
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
