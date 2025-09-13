'use client';

import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

import EnergyNode from './nodes/EnergyNode';
import { Node as SimulationNode, Connection as SimulationConnection } from '@/types/simulation';

interface ReactFlowCanvasProps {
  nodes: SimulationNode[];
  connections: SimulationConnection[];
  selectedNode: string | null;
  onNodeClick: (nodeId: string | null) => void;
  onNodeMouseDown: (nodeId: string | null) => void;
  onNodeMouseMove: (x: number, y: number) => void;
  onNodeMouseUp: () => void;
  onConnectionFinish: (fromId: string, toId: string) => void;
}

const nodeTypes = {
  energyNode: EnergyNode,
};

export default function ReactFlowCanvas({
  nodes,
  connections,
  selectedNode,
  onNodeClick,
  onNodeMouseDown,
  onNodeMouseMove,
  onNodeMouseUp,
  onConnectionFinish
}: ReactFlowCanvasProps) {
  // Convert simulation nodes to React Flow nodes
  const reactFlowNodes: Node[] = useMemo(() => 
    nodes.map(node => ({
      id: node.id,
      type: 'energyNode',
      position: { x: node.x, y: node.y },
      data: node,
      selected: selectedNode === node.id,
    })), [nodes, selectedNode]
  );

  // Convert simulation connections to React Flow edges
  const reactFlowEdges: Edge[] = useMemo(() => 
    connections.map(conn => ({
      id: conn.id,
      source: conn.from,
      target: conn.to,
      type: 'smoothstep',
      animated: conn.status === 'active',
      style: {
        stroke: conn.status === 'active' ? '#10b981' : '#6b7280',
        strokeWidth: 3,
      },
    })), [connections]
  );

  const [reactFlowNodesState, setNodes, onNodesChange] = useNodesState(reactFlowNodes);
  const [reactFlowEdgesState, setEdges, onEdgesChange] = useEdgesState(reactFlowEdges);

  // Update React Flow state when props change
  useMemo(() => {
    setNodes(reactFlowNodes);
  }, [reactFlowNodes, setNodes]);

  useMemo(() => {
    setEdges(reactFlowEdges);
  }, [reactFlowEdges, setEdges]);

  const onConnect = useCallback((params: Connection) => {
    if (params.source && params.target) {
      onConnectionFinish(params.source, params.target);
    }
  }, [onConnectionFinish]);

  const onNodeClickHandler = useCallback((event: React.MouseEvent, node: Node) => {
    onNodeClick(node.id);
  }, [onNodeClick]);

  const onNodeMouseDownHandler = useCallback((event: React.MouseEvent, node: Node) => {
    onNodeMouseDown(node.id);
  }, [onNodeMouseDown]);

  const onNodeDrag = useCallback((event: React.MouseEvent, node: Node) => {
    onNodeMouseMove(node.position.x, node.position.y);
  }, [onNodeMouseMove]);

  const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    onNodeMouseUp();
  }, [onNodeMouseUp]);

  const onPaneClick = useCallback(() => {
    onNodeClick(null);
  }, [onNodeClick]);

  return (
    <div className="flex-1 relative">
      <ReactFlow
        nodes={reactFlowNodesState}
        edges={reactFlowEdgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClickHandler}
        onNodeMouseDown={onNodeMouseDownHandler}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        className="bg-gray-900"
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1}
          color="#374151"
        />
        <Controls 
          className="bg-gray-800 border-gray-600"
          style={{ button: { backgroundColor: '#1f2937', color: '#d1d5db' } }}
        />
        <MiniMap 
          className="bg-gray-800 border-gray-600"
          nodeColor={(node) => {
            const data = node.data as SimulationNode;
            switch (data.type) {
              case 'generator': return '#10b981';
              case 'consumer': return '#f59e0b';
              case 'storage': return '#3b82f6';
              case 'grid': return '#8b5cf6';
              default: return '#6b7280';
            }
          }}
          style={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
          }}
        />
      </ReactFlow>
      
      {/* Empty State */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-6xl text-gray-600 mb-4">⚡</div>
            <h3 className="text-xl font-semibold text-white mb-2">Start Building Your Network</h3>
            <p className="text-gray-400">Add energy sources and factories from the left panel</p>
          </div>
        </div>
      )}
    </div>
  );
}
