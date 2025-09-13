'use client';

import { useCallback, useMemo, useEffect, useRef, useState } from 'react';
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
  SelectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';

import EnergyNode from './nodes/EnergyNode';
import GroupNode from './nodes/GroupNode';
import GroupBubble from './nodes/GroupBubble';
import { Node as SimulationNode, Connection as SimulationConnection } from '@/types/simulation';

interface ReactFlowCanvasProps {
  nodes: SimulationNode[];
  connections: SimulationConnection[];
  selectedNode: string | null;
  onNodeClick: (nodeId: string | null) => void;
  onNodeMouseMove: (x: number, y: number) => void;
  onNodeMouseUp: () => void;
  onConnectionFinish: (fromId: string, toId: string) => void;
  onConnectionDelete: (connectionIds: string[]) => void;
  onGetViewportCenter?: (getCenter: () => { x: number; y: number }) => void;
  onEditNode: (node: SimulationNode) => void;
  // Hierarchical props
  currentLayer: number;
  selectedNodes: string[];
  isSelectionMode: boolean;
  onToggleNodeSelection: (nodeId: string) => void;
  onNavigateDown: (groupNodeId: string) => void;
  onNavigateToLayer: (layer: number) => void;
}

const nodeTypes = {
  energyNode: EnergyNode,
  groupNode: GroupNode,
  groupBubble: GroupBubble,
};

export default function ReactFlowCanvas({
  nodes,
  connections,
  selectedNode,
  onNodeClick,
  onNodeMouseMove,
  onNodeMouseUp,
  onConnectionFinish,
  onConnectionDelete,
  onGetViewportCenter,
  onEditNode,
  currentLayer,
  selectedNodes,
  isSelectionMode,
  onToggleNodeSelection,
  onNavigateDown,
  onNavigateToLayer
}: ReactFlowCanvasProps) {
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  const [selectedEdges, setSelectedEdges] = useState<string[]>([]);
  const selectedEdgesRef = useRef<string[]>([]);
  
  // Store the original node positions to preserve them exactly
  const [savedNodePositions, setSavedNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const savedPositionsForLayer = useRef<number | null>(null);
  // Convert simulation nodes to React Flow nodes
  // Only set initial position for new nodes, let React Flow manage positions
  const reactFlowNodes: Node[] = useMemo(() => {
    if (currentLayer === 0) {
      // Layer 0: Show individual nodes and family bubbles
        const individualNodes = nodes
          .filter(node => !node.isGroup && node.layer === 0)
          .map(node => {
            // Use saved position if available, otherwise use node's current position
            const savedPosition = savedNodePositions[node.id];
            const position = savedPosition || { x: node.x, y: node.y };
            
            return {
              id: node.id,
              type: 'energyNode',
              position,
              data: { 
                ...node, 
                onEditNode,
                onToggleSelection: isSelectionMode ? onToggleNodeSelection : undefined,
                isSelected: selectedNodes.includes(node.id),
                isSelectionMode
              },
              selected: selectedNode === node.id || selectedNodes.includes(node.id),
            };
          });

      // Add family bubble nodes for visualization
      const familyBubbles = nodes
        .filter(node => node.familyId && node.layer === 0)
        .reduce((bubbles, node) => {
          // Only create one bubble per family
          const existingBubble = bubbles.find(b => b.data.familyId === node.familyId);
            if (!existingBubble) {
              const familyNodes = nodes.filter(n => n.familyId === node.familyId && n.layer === 0);
              // Use saved positions if available, otherwise use current positions
              const centerX = familyNodes.reduce((sum, n) => {
                const savedPos = savedNodePositions[n.id];
                return sum + (savedPos ? savedPos.x : n.x);
              }, 0) / familyNodes.length;
              const centerY = familyNodes.reduce((sum, n) => {
                const savedPos = savedNodePositions[n.id];
                return sum + (savedPos ? savedPos.y : n.y);
              }, 0) / familyNodes.length;
            
            bubbles.push({
              id: `family_bubble_${node.familyId}`,
              type: 'groupBubble',
              position: { x: centerX, y: centerY },
              data: { 
                id: node.familyId,
                name: `Family ${familyNodes.length}`,
                familyId: node.familyId,
                isBubble: true,
                onNavigateDown: onNavigateDown,
                groupStats: {
                  totalPower: familyNodes.reduce((sum, n) => sum + n.power, 0),
                  nodeCount: familyNodes.length,
                  activeConnections: 0,
                  childTypes: familyNodes.reduce((acc, n) => {
                    acc[n.type] = (acc[n.type] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                }
              },
              selected: false,
            });
          }
          return bubbles;
        }, [] as any[]);

      return [...individualNodes, ...familyBubbles];
    } else {
      // Higher layers: Show family group nodes
      const families = nodes
        .filter(node => node.familyId && node.layer === 0)
        .reduce((families, node) => {
            if (!families.find(f => f.id === node.familyId)) {
              const familyNodes = nodes.filter(n => n.familyId === node.familyId && n.layer === 0);
              // Use saved positions if available, otherwise use current positions
              const centerX = familyNodes.reduce((sum, n) => {
                const savedPos = savedNodePositions[n.id];
                return sum + (savedPos ? savedPos.x : n.x);
              }, 0) / familyNodes.length;
              const centerY = familyNodes.reduce((sum, n) => {
                const savedPos = savedNodePositions[n.id];
                return sum + (savedPos ? savedPos.y : n.y);
              }, 0) / familyNodes.length;
            
            families.push({
              id: node.familyId,
              type: 'groupNode',
              position: { x: centerX, y: centerY },
              data: { 
                id: node.familyId,
                name: `Family ${familyNodes.length}`,
                familyId: node.familyId,
                isGroup: true,
                onEditNode,
                onNavigateDown: onNavigateDown,
                onToggleSelection: isSelectionMode ? onToggleNodeSelection : undefined,
                isSelected: selectedNodes.includes(node.familyId!),
                isSelectionMode,
                groupStats: {
                  totalPower: familyNodes.reduce((sum, n) => sum + n.power, 0),
                  nodeCount: familyNodes.length,
                  activeConnections: 0,
                  childTypes: familyNodes.reduce((acc, n) => {
                    acc[n.type] = (acc[n.type] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                }
              },
              selected: selectedNode === node.familyId || selectedNodes.includes(node.familyId!),
            });
          }
          return families;
        }, [] as any[]);

      return families;
    }
  }, [nodes, selectedNode, onEditNode, currentLayer, selectedNodes, isSelectionMode, onToggleNodeSelection, onNavigateDown, savedNodePositions]
  );

  // Convert simulation connections to React Flow edges
  const reactFlowEdges: Edge[] = useMemo(() => 
    connections.map(conn => ({
      id: conn.id,
      source: conn.from,
      target: conn.to,
      type: 'smoothstep',
      animated: conn.status === 'active',
      selected: selectedEdges.includes(conn.id),
      style: {
        stroke: selectedEdges.includes(conn.id) 
          ? 'rgba(59, 130, 246, 0.9)'  // Blue when selected
          : conn.status === 'active' 
            ? 'rgba(147, 51, 234, 0.6)'  // Purple when active
            : 'rgba(71, 85, 105, 0.4)',  // Gray when inactive
        strokeWidth: selectedEdges.includes(conn.id) ? 3 : 2,  // Thicker when selected
        opacity: selectedEdges.includes(conn.id) ? 1 : 0.7,    // More opaque when selected
      },
    })), [connections, selectedEdges]
  );

  const [reactFlowNodesState, setNodes, onNodesChange] = useNodesState(reactFlowNodes);
  const [reactFlowEdgesState, setEdges, onEdgesChange] = useEdgesState(reactFlowEdges);

  // Track selected edges and nodes for keyboard deletion and multi-selection
  const onSelectionChange = useCallback(({ nodes: selectedReactFlowNodes, edges: selectedReactFlowEdges }: { nodes: Node[], edges: Edge[] }) => {
    const edgeIds = selectedReactFlowEdges.map(edge => edge.id);
    const nodeIds = selectedReactFlowNodes.map(node => node.id);
    
    console.log('Selection changed - Nodes:', nodeIds, 'Edges:', edgeIds);
    
    // Update edge selection for deletion
    setSelectedEdges(edgeIds);
    selectedEdgesRef.current = edgeIds;
    
    // For rectangle selection in selection mode, we need to handle this differently
    // We'll use a separate effect to sync React Flow selection with our state
  }, []);

  // Sync React Flow selection with our multi-selection state when in selection mode
  useEffect(() => {
    if (isSelectionMode) {
      // Get currently selected nodes from React Flow
      const selectedNodeIds = reactFlowNodesState
        .filter(node => node.selected)
        .map(node => node.id);
      
      console.log('Syncing selection - React Flow selected:', selectedNodeIds, 'Our selected:', selectedNodes);
      
      // Add any newly selected nodes to our selection
      selectedNodeIds.forEach(nodeId => {
        if (!selectedNodes.includes(nodeId)) {
          onToggleNodeSelection(nodeId);
        }
      });
    }
  }, [reactFlowNodesState, isSelectionMode, selectedNodes, onToggleNodeSelection]);

  // Handle keyboard delete for selected edges
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedEdgesRef.current.length > 0) {
        event.preventDefault();
        console.log('Deleting edges:', selectedEdgesRef.current);
        
        // Call parent callback to delete connections from simulation data
        onConnectionDelete(selectedEdgesRef.current);
        
        // Clear selection
        setSelectedEdges([]);
        selectedEdgesRef.current = [];
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onConnectionDelete]);

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
    if (node.type === 'groupNode') {
      // If it's a group node, drill down to its children
      if (onNavigateDown) {
        // Reset transition state for manual navigation
        setIsTransitioning(false);
        setLastSwitchTime(Date.now());
        
        onNavigateDown(node.id);
        // After drilling down, center the view on the family's nodes
        setTimeout(() => {
          if (reactFlowInstance.current) {
            const familyNodes = nodes.filter(n => n.familyId === node.id);
            if (familyNodes.length > 0) {
              reactFlowInstance.current.fitView({
                nodes: familyNodes.map(n => ({ id: n.id, x: n.x, y: n.y })),
                duration: 800,
                padding: 0.1,
              });
            }
          }
        }, 100);
      }
    } else {
      // Regular node click
      onNodeClick(node.id);
    }
  }, [onNodeClick, onNavigateDown, nodes, reactFlowInstance]);

  const onNodeDragStop: NodeDragHandler = useCallback((event, node) => {
    // Update simulation state with final position when drag ends
    onNodeMouseMove(node.position.x, node.position.y);
    onNodeMouseUp();
    
    // Save the position for layer switching
    setSavedNodePositions(prev => ({
      ...prev,
      [node.id]: { x: node.position.x, y: node.position.y }
    }));
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

  // Zoom-based layer switching
  const [currentZoom, setCurrentZoom] = useState(1);
  const [isZooming, setIsZooming] = useState(false);
  const [lastSwitchTime, setLastSwitchTime] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Handle zoom changes and automatic layer switching
  const onMove = useCallback((event: any, viewport: any) => {
    const newZoom = viewport.zoom;
    setCurrentZoom(newZoom);
    
    // Prevent rapid switching and infinite loops
    const now = Date.now();
    const timeSinceLastSwitch = now - lastSwitchTime;
    const minSwitchInterval = 1000; // Minimum 1 second between switches
    
    // Only switch layers if we're not already transitioning and enough time has passed
    if (!isZooming && !isTransitioning && timeSinceLastSwitch > minSwitchInterval && reactFlowInstance.current) {
      // Get the current nodes to check their visual size
      const currentNodes = reactFlowInstance.current.getNodes();
      const individualNodes = currentNodes.filter(node => node.type === 'energyNode');
      const groupNodes = currentNodes.filter(node => node.type === 'groupNode');
      
      if (currentLayer === 0 && individualNodes.length > 0) {
        // We're in individual view - check if we should switch to group view
        const nodeSize = 60; // Base size of individual nodes in pixels
        const visualNodeSize = nodeSize * newZoom;
        
        // Use a more conservative threshold and require sustained zoom
        if (visualNodeSize <= 15) { // Switch to group view when nodes are smaller than 15px
          setIsZooming(true);
          setIsTransitioning(true);
          setLastSwitchTime(now);
          onNavigateToLayer(1);
          setTimeout(() => {
            setIsZooming(false);
            setIsTransitioning(false);
          }, 1000); // Longer debounce
        }
      } else if (currentLayer > 0 && groupNodes.length > 0) {
        // We're in group view - check if we should drill down to individual view
        const groupNodeSize = 200; // Base size of group nodes in pixels (they're scaled 2.5x)
        const visualGroupSize = groupNodeSize * newZoom;
        
        // Use a more conservative threshold and require sustained zoom
        if (visualGroupSize >= 80) { // Switch to individual view when group nodes are larger than 80px
          setIsZooming(true);
          setIsTransitioning(true);
          setLastSwitchTime(now);
          onNavigateToLayer(0);
          setTimeout(() => {
            setIsZooming(false);
            setIsTransitioning(false);
          }, 1000); // Longer debounce
        }
      }
    }
  }, [currentLayer, isZooming, isTransitioning, lastSwitchTime, onNavigateToLayer, reactFlowInstance]);

  // Sync zoom level with layer changes
  useEffect(() => {
    if (reactFlowInstance.current && !isZooming) {
      // Reset transition state when layer changes manually
      setIsTransitioning(false);
      setLastSwitchTime(Date.now());
      
      // When switching TO layer 1+ (group view), save current node positions
      // Only save once per layer switch to avoid infinite loops
      if (currentLayer > 0 && savedPositionsForLayer.current !== currentLayer) {
        const currentNodes = reactFlowInstance.current.getNodes();
        const newSavedPositions: Record<string, { x: number; y: number }> = {};
        
        currentNodes.forEach(node => {
          if (node.type === 'energyNode') {
            newSavedPositions[node.id] = { 
              x: node.position.x, 
              y: node.position.y 
            };
          }
        });
        
        setSavedNodePositions(prev => ({
          ...prev,
          ...newSavedPositions
        }));
        
        savedPositionsForLayer.current = currentLayer;
      }
      
      // Reset the saved layer when going back to layer 0
      if (currentLayer === 0) {
        savedPositionsForLayer.current = null;
      }
      
      // No automatic viewport changes - user controls zoom and pan manually
    }
  }, [currentLayer, isZooming, nodes]);

  return (
    <div className={`flex-1 relative ${isSelectionMode ? 'selection-mode' : ''}`}>
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
        onSelectionChange={onSelectionChange}
        onMove={onMove}
        nodeTypes={nodeTypes}
        attributionPosition="bottom-left"
        className="bg-gray-900"
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.1}
        maxZoom={4}
        panOnDrag={!isSelectionMode}
        panOnScroll={false}
        zoomOnScroll={true}
        zoomOnPinch={true}
        selectNodesOnDrag={isSelectionMode}
        selectionMode={isSelectionMode ? SelectionMode.Partial : undefined}
        selectionOnDrag={isSelectionMode}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1}
          color="#374151"
        />
        <Controls 
          className="bg-gray-800 border-gray-600"
        />
        <MiniMap 
          className="bg-gray-800 border-gray-600"
          pannable={true}
          zoomable={true}
          nodeColor={(node) => {
            const data = node.data as SimulationNode;
            return data.status === 'active' ? 'rgba(147, 51, 234, 0.6)' : 'rgba(71, 85, 105, 0.4)';
          }}
          nodeStrokeColor="rgba(71, 85, 105, 0.6)"
          nodeBorderRadius={4}
          maskColor="rgba(59, 130, 246, 0.15)"
          style={{
            backgroundColor: 'rgba(30, 41, 59, 0.9)',
            border: '1px solid rgba(71, 85, 105, 0.6)',
            width: 200,
            height: 150,
          }}
        />
      </ReactFlow>
      
      {/* Empty State */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-gray-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Start Building Your Network</h3>
            <p className="text-gray-400">Add energy sources and factories from the left panel</p>
          </div>
        </div>
      )}
    </div>
  );
}
