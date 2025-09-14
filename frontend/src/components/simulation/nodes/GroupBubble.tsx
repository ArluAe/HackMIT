'use client';

import { Node } from '@/types/simulation';

interface GroupBubbleProps {
  data: {
    id: string;
    name: string;
    familyId?: string;
    isBubble?: boolean;
    onNavigateDown?: (groupNodeId: string) => void;
    groupStats?: {
      totalPower: number;
      nodeCount: number;
      activeConnections: number;
      childTypes: Record<string, number>;
    };
  };
}

export default function GroupBubble({ data }: GroupBubbleProps) {
  const handleBubbleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onNavigateDown && data.familyId) {
      data.onNavigateDown(data.familyId);
    }
  };

  return (
    <div 
      className="group-bubble absolute pointer-events-auto cursor-pointer"
      onClick={handleBubbleClick}
      style={{
        left: -50,
        top: -50,
        width: 100,
        height: 100,
      }}
    >
      {/* Bubble Background */}
      <div 
        className="absolute inset-0 rounded-full border-2 border-dashed border-blue-400/60 bg-blue-400/10 backdrop-blur-sm"
        style={{
          animation: 'pulse 2s infinite',
        }}
      />
      
      {/* Bubble Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          {/* Group Icon */}
          <div className="w-8 h-8 mx-auto mb-1 bg-blue-600/80 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          
          {/* Group Name */}
          <div className="text-xs text-blue-300 font-medium whitespace-nowrap">
            {data.name}
          </div>
          
          {/* Node Count */}
          <div className="text-xs text-blue-400/80">
            {data.groupStats?.nodeCount || 0} nodes
          </div>
        </div>
      </div>
      
      {/* Hover Effect */}
      <div className="absolute inset-0 rounded-full bg-blue-400/20 opacity-0 hover:opacity-100 transition-opacity duration-200" />
    </div>
  );
}
