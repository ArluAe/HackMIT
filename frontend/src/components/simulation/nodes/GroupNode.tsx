'use client';

import { Node } from '@/types/simulation';

interface GroupNodeProps {
  data: Node;
  onEditNode?: (node: Node) => void;
  onNavigateDown?: (groupNodeId: string) => void;
}

export default function GroupNode({ data, onEditNode, onNavigateDown }: GroupNodeProps) {
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEditNode) {
      onEditNode(data);
    }
  };

  const handleDrillDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onNavigateDown) {
      onNavigateDown(data.id);
    }
  };

  return (
    <div className="group-node bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600 rounded-lg p-8 min-w-[400px] shadow-2xl transform scale-[2.5]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-blue-600 rounded flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-white font-bold text-2xl">{data.name}</h3>
        </div>
        <button
          onClick={handleEditClick}
          className="w-14 h-14 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center transition-colors"
          title="Edit Group"
        >
          <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>

      {/* Group Stats */}
      {data.groupStats && (
        <div className="space-y-4 mb-6">
          <div className="flex justify-between text-lg text-gray-300">
            <span>Nodes:</span>
            <span className="text-white font-bold text-xl">{data.groupStats.nodeCount}</span>
          </div>
          <div className="flex justify-between text-lg text-gray-300">
            <span>Power:</span>
            <span className="text-white font-bold text-xl">{data.groupStats.totalPower}W</span>
          </div>
          <div className="flex justify-between text-lg text-gray-300">
            <span>Connections:</span>
            <span className="text-white font-bold text-xl">{data.groupStats.activeConnections}</span>
          </div>
        </div>
      )}

      {/* Child Types */}
      {data.groupStats?.childTypes && (
        <div className="mb-6">
          <div className="text-lg text-gray-400 mb-3">Composition:</div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(data.groupStats.childTypes).map(([type, count]) => (
              <span
                key={type}
                className="px-4 py-2 bg-gray-700 text-gray-300 text-lg rounded"
              >
                {type}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Drill Down Button */}
      <button
        onClick={handleDrillDown}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded transition-colors flex items-center justify-center space-x-3"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        <span>Drill Down</span>
      </button>
    </div>
  );
}
