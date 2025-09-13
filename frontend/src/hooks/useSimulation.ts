import { useState } from 'react';
import { Node, Connection } from '@/types/simulation';

export const useSimulation = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  
  // Hierarchical and selection state
  const [currentLayer, setCurrentLayer] = useState(0);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [layerHistory, setLayerHistory] = useState<number[]>([0]);

  const addNode = (type: Node['type'], viewportCenter?: { x: number; y: number }) => {
    const newNode: Node = {
      id: Date.now().toString(),
      type,
      x: viewportCenter?.x || (400 + Math.random() * 200),
      y: viewportCenter?.y || (300 + Math.random() * 200),
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${nodes.length + 1}`,
      power: Math.floor(Math.random() * 500) + 100,
      status: 'active',
      layer: currentLayer,
      childNodes: [],
      isGroup: type === 'group'
    };
    setNodes([...nodes, newNode]);
  };

  const deleteNode = (nodeId: string) => {
    setNodes(nodes.filter(n => n.id !== nodeId));
    setConnections(connections.filter(c => c.from !== nodeId && c.to !== nodeId));
    if (selectedNode === nodeId) {
      setSelectedNode(null);
    }
  };

  const updateNodePosition = (nodeId: string, x: number, y: number) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { ...node, x, y }
        : node
    ));
  };

  const addConnection = (from: string, to: string) => {
    // Check if connection already exists
    const existingConnection = connections.find(
      conn => (conn.from === from && conn.to === to) || (conn.from === to && conn.to === from)
    );
    
    if (!existingConnection) {
      const newConnection: Connection = {
        id: Date.now().toString(),
        from,
        to,
        power: 100,
        status: 'active'
      };
      setConnections([...connections, newConnection]);
    }
  };

  const deleteConnection = (connectionIds: string[]) => {
    setConnections(prev => prev.filter(conn => !connectionIds.includes(conn.id)));
  };

  const startConnection = () => {
    if (selectedNode) {
      setIsConnecting(true);
      setConnectionStart(selectedNode);
    }
  };

  const finishConnection = (targetNodeId: string) => {
    if (connectionStart && targetNodeId !== connectionStart) {
      addConnection(connectionStart, targetNodeId);
    }
    setIsConnecting(false);
    setConnectionStart(null);
  };

  const cancelConnection = () => {
    setIsConnecting(false);
    setConnectionStart(null);
  };

  const toggleSimulation = () => {
    setIsSimulationRunning(!isSimulationRunning);
  };

  const getNetworkStats = () => {
    return {
      totalGeneration: nodes.filter(n => n.type === 'generator').reduce((sum, n) => sum + n.power, 0),
      totalConsumption: nodes.filter(n => n.type === 'consumer').reduce((sum, n) => sum + n.power, 0),
      storageCapacity: nodes.filter(n => n.type === 'storage').reduce((sum, n) => sum + n.power, 0),
      activeNodes: nodes.filter(n => n.status === 'active').length
    };
  };

  // Hierarchical functions
  const createGroupNode = (selectedNodeIds: string[], familyName?: string) => {
    if (selectedNodeIds.length < 2) return;
    
    // Create a family ID for the selected nodes
    const familyId = `family_${Date.now()}`;
    
    // Update selected nodes to belong to the same family
    setNodes(prevNodes => 
      prevNodes.map(node => 
        selectedNodeIds.includes(node.id) 
          ? { ...node, familyId, familyName: familyName || `Family ${selectedNodeIds.length}` }
          : node
      )
    );
    
    // Clear selection
    setSelectedNodes([]);
  };

  // Get nodes that belong to the same family
  const getFamilyNodes = (familyId: string) => {
    return nodes.filter(node => node.familyId === familyId);
  };

  // Get all unique families
  const getFamilies = () => {
    const familyIds = [...new Set(nodes.map(node => node.familyId).filter(Boolean))];
    return familyIds.map(familyId => ({
      id: familyId,
      nodes: getFamilyNodes(familyId as string)
    }));
  };

  const navigateToLayer = (layer: number) => {
    setCurrentLayer(layer);
    setLayerHistory(prev => [...prev, layer]);
  };

  const navigateUp = () => {
    if (currentLayer === 0) {
      // Go from layer 0 to layer 1 (individuals to groups)
      navigateToLayer(1);
    } else if (currentLayer > 1) {
      // Go to higher layer (more abstract)
      navigateToLayer(currentLayer - 1);
    }
  };

  const navigateDown = (groupNodeId: string) => {
    // groupNodeId is actually the familyId
    const familyNodes = nodes.filter(n => n.familyId === groupNodeId);
    if (familyNodes.length > 0) {
      // Switch to layer 0 to show individual nodes
      navigateToLayer(0);
    }
  };

  const toggleNodeSelection = (nodeId: string) => {
    setSelectedNodes(prev => 
      prev.includes(nodeId) 
        ? prev.filter(id => id !== nodeId)
        : [...prev, nodeId]
    );
  };

  const clearSelection = () => {
    setSelectedNodes([]);
  };

  return {
    // State
    nodes,
    connections,
    selectedNode,
    isSimulationRunning,
    draggedNode,
    isConnecting,
    connectionStart,
    
    // Hierarchical state
    currentLayer,
    selectedNodes,
    isSelectionMode,
    layerHistory,
    
    // Actions
    setNodes,
    setConnections,
    setSelectedNode,
    setDraggedNode,
    addNode,
    deleteNode,
    updateNodePosition,
    addConnection,
    deleteConnection,
    startConnection,
    finishConnection,
    cancelConnection,
    toggleSimulation,
    getNetworkStats,
    
    // Hierarchical actions
    createGroupNode,
    getFamilyNodes,
    getFamilies,
    navigateToLayer,
    navigateUp,
    navigateDown,
    toggleNodeSelection,
    clearSelection,
    setIsSelectionMode
  };
};
