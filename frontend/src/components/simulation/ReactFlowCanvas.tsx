'use client';

import { useCallback, useMemo, useEffect, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
  NodeDragHandler,
  NodeMouseHandler,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';

import EnergyNode from './nodes/EnergyNode';
import { Node as SimulationNode, Connection as SimulationConnection } from '@/types/simulation';

interface ReactFlowCanvasProps {
  nodes: SimulationNode[];
  connections: SimulationConnection[];
  selectedNode: string | null;
  onNodeClick: (nodeId: string | null) => void;
  onNodeMouseMove: (x: number, y: number) => void;
  onNodeMouseUp: () => void;
  onConnectionFinish: (fromId: string, toId: string) => void;
  onGetViewportCenter?: (getCenter: () => { x: number; y: number }) => void;
}

const nodeTypes = {
  energyNode: EnergyNode,
};

export default function ReactFlowCanvas({
  nodes,
  connections,
  selectedNode,
  onNodeClick,
  onNodeMouseMove,
  onNodeMouseUp,
  onConnectionFinish,
  onGetViewportCenter
}: ReactFlowCanvasProps) {
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  // Convert simulation nodes to React Flow nodes
  // Only set initial position for new nodes, let React Flow manage positions
  const reactFlowNodes: Node[] = useMemo(() => 
    nodes.map(node => ({
      id: node.id,
      type: 'energyNode',
      position: { x: node.x, y: node.y }, // Initial position only
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
        stroke: conn.status === 'active' ? 'rgba(147, 51, 234, 0.6)' : 'rgba(71, 85, 105, 0.4)',
        strokeWidth: 2,
        opacity: 0.7,
      },
    })), [connections]
  );

  const [reactFlowNodesState, setNodes, onNodesChange] = useNodesState(reactFlowNodes);
  const [reactFlowEdgesState, setEdges, onEdgesChange] = useEdgesState(reactFlowEdges);

  // Handle node additions and deletions while preserving positions
  useEffect(() => {
    const currentIds = new Set(reactFlowNodesState.map(n => n.id));
    const newIds = new Set(reactFlowNodes.map(n => n.id));
    
    // Find nodes that need to be added or removed
    const nodesToAdd = reactFlowNodes.filter(node => !currentIds.has(node.id));
    const nodesToRemove = Array.from(currentIds).filter(id => !newIds.has(id));
    
    if (nodesToAdd.length > 0 || nodesToRemove.length > 0) {
      setNodes(prevNodes => {
        // Remove deleted nodes
        let updatedNodes = prevNodes.filter(node => !nodesToRemove.includes(node.id));
        // Add new nodes simply
        updatedNodes = [...updatedNodes, ...nodesToAdd];
        return updatedNodes;
      });
    }
  }, [reactFlowNodes, reactFlowNodesState, setNodes]);

  useEffect(() => {
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

  const onNodeDragStop: NodeDragHandler = useCallback((event, node) => {
    // Update simulation state with final position when drag ends
    onNodeMouseMove(node.position.x, node.position.y);
    onNodeMouseUp();
  }, [onNodeMouseMove, onNodeMouseUp]);

  const onPaneClick = useCallback(() => {
    onNodeClick(null);
  }, [onNodeClick]);

  // Function to get the center of the current viewport
  const getViewportCenter = useCallback(() => {
    if (!reactFlowInstance.current) {
      return { x: 400, y: 300 }; // Fallback position
    }
    // Use React Flow's built-in method to convert screen coordinates to flow coordinates
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    return reactFlowInstance.current.screenToFlowPosition({
      x: centerX,
      y: centerY,
    });
  }, []);

  // Initialize React Flow instance
  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;
  }, []);

  // Expose the viewport center function to parent
  useEffect(() => {
    if (onGetViewportCenter) {
      onGetViewportCenter(getViewportCenter);
    }
  }, [onGetViewportCenter, getViewportCenter]);

  return (
    <div className="flex-1 relative">
      <ReactFlow
        nodes={reactFlowNodesState}
        edges={reactFlowEdgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClickHandler}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={onPaneClick}
        onInit={onInit}
        nodeTypes={nodeTypes}
        attributionPosition="bottom-left"
        className="bg-gray-900"
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.1}
        maxZoom={4}
        panOnDrag={true}
        panOnScroll={false}
        zoomOnScroll={true}
        zoomOnPinch={true}
        selectNodesOnDrag={false}
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
            return data.status === 'active' ? 'rgba(147, 51, 234, 0.6)' : 'rgba(71, 85, 105, 0.4)';
          }}
          style={{
            backgroundColor: 'rgba(30, 41, 59, 0.9)',
            border: '1px solid rgba(71, 85, 105, 0.6)',
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
