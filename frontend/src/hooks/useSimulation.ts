import { useState } from 'react';
import { Node, Connection, GraphExportData, FamilyGroup, LayerInfo } from '@/types/simulation';
import { applySmartLayout, detectBestLayout, LayoutOptions } from '@/utils/graphLayout';

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

  // Node creation modal state
  const [isNodeCreationModalOpen, setIsNodeCreationModalOpen] = useState(false);
  const [pendingNodeType, setPendingNodeType] = useState<Node['type'] | null>(null);
  const [pendingViewportCenter, setPendingViewportCenter] = useState<{ x: number; y: number } | undefined>(undefined);

  // Connection creation modal state
  const [isConnectionCreationModalOpen, setIsConnectionCreationModalOpen] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<{ from: string; to: string; fromName: string; toName: string } | null>(null);

  const addNode = (type: Node['type'], viewportCenter?: { x: number; y: number }) => {
    // Show modal instead of directly creating node
    setPendingNodeType(type);
    setPendingViewportCenter(viewportCenter);
    setIsNodeCreationModalOpen(true);
  };

  const createNodeFromModal = (nodeData: Partial<Node>) => {
    if (!pendingNodeType) return;

    const newNode: Node = {
      id: Date.now().toString(),
      type: pendingNodeType,
      x: pendingViewportCenter?.x || (400 + Math.random() * 200),
      y: pendingViewportCenter?.y || (300 + Math.random() * 200),
      name: nodeData.name || `${pendingNodeType.charAt(0).toUpperCase() + pendingNodeType.slice(1)} ${nodes.length + 1}`,
      status: nodeData.status || 'active',
      settings: {
        power: nodeData.settings?.power || 100,
        type: pendingNodeType,
        inertia: nodeData.settings?.inertia || 0,
        friction: nodeData.settings?.friction || 0
      },
      layer: currentLayer,
      childNodes: [],
      isGroup: pendingNodeType === 'group'
    };
    
    setNodes([...nodes, newNode]);
    
    // Reset modal state
    setIsNodeCreationModalOpen(false);
    setPendingNodeType(null);
    setPendingViewportCenter(undefined);
  };

  const closeNodeCreationModal = () => {
    setIsNodeCreationModalOpen(false);
    setPendingNodeType(null);
    setPendingViewportCenter(undefined);
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
      // Get node names for the modal
      const fromNode = nodes.find(n => n.id === from);
      const toNode = nodes.find(n => n.id === to);
      
      if (fromNode && toNode) {
        setPendingConnection({
          from,
          to,
          fromName: fromNode.name,
          toName: toNode.name
        });
        setIsConnectionCreationModalOpen(true);
      }
    }
  };

  const createConnectionFromModal = (connectionData: Partial<Connection>) => {
    if (!pendingConnection) return;

    const newConnection: Connection = {
      id: Date.now().toString(),
      from: pendingConnection.from,
      to: pendingConnection.to,
      power: connectionData.power || 0,
      status: connectionData.status || 'active',
      resistance: connectionData.resistance || 1.0,
      maxPower: connectionData.maxPower || 1000
    };
    
    setConnections([...connections, newConnection]);
    
    // Reset modal state
    setIsConnectionCreationModalOpen(false);
    setPendingConnection(null);
  };

  const closeConnectionCreationModal = () => {
    setIsConnectionCreationModalOpen(false);
    setPendingConnection(null);
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
      totalGeneration: nodes.filter(n => n.type.includes('generator')).reduce((sum, n) => sum + n.settings.power, 0),
      totalConsumption: nodes.filter(n => n.type === 'factory' || n.type === 'commercial-building' || n.type === 'residential').reduce((sum, n) => sum + n.settings.power, 0),
      storageCapacity: nodes.filter(n => n.type === 'battery-storage').reduce((sum, n) => sum + n.settings.power, 0),
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

  // Import/Export functions
  const exportGraph = (simulationName: string = 'GridForge Simulation', viewport?: { x: number; y: number; zoom: number }) => {
    const families = getFamilies();
    const familyGroups: FamilyGroup[] = families
      .filter(family => family.id) // Filter out families without IDs
      .map(family => {
        const familyNodes = family.nodes;
        const centerX = familyNodes.reduce((sum, n) => sum + n.x, 0) / familyNodes.length;
        const centerY = familyNodes.reduce((sum, n) => sum + n.y, 0) / familyNodes.length;
        
        return {
          id: family.id!,
          name: familyNodes[0]?.familyName || `Family ${familyNodes.length}`,
          nodeIds: familyNodes.map(n => n.id),
          centerPosition: { x: centerX, y: centerY },
          stats: {
            totalPower: familyNodes.reduce((sum, n) => sum + n.power, 0),
            nodeCount: familyNodes.length,
            childTypes: familyNodes.reduce((acc, n) => {
              acc[n.type] = (acc[n.type] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          }
        };
      });

    const layers: LayerInfo[] = [
      { layer: 0, name: 'Individual Nodes', description: 'Base layer with individual components', nodeCount: nodes.filter(n => n.layer === 0).length },
      { layer: 1, name: 'Family Groups', description: 'Grouped components by family', nodeCount: families.length }
    ];

    const exportData: GraphExportData = {
      version: '1.0',
      metadata: {
        name: simulationName,
        description: 'Exported from GridForge',
        createdAt: new Date().toISOString(),
        author: 'User'
      },
      simulation: {
        nodes,
        connections,
        families: familyGroups,
        layers
      },
      viewport: viewport || {
        x: 0,
        y: 0,
        zoom: 1
      },
      settings: {
        simulationRunning: isSimulationRunning,
        currentLayer
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${simulationName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importGraph = (file: File): Promise<{ success: boolean; error?: string; viewport?: { x: number; y: number; zoom: number } }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data: GraphExportData = JSON.parse(e.target?.result as string);
          
          // Validate version compatibility
          if (data.version !== '1.0') {
            resolve({ success: false, error: 'Incompatible file version. Please use a GridForge v1.0 export file.' });
            return;
          }

          // Validate data structure
          if (!data.simulation || !data.simulation.nodes || !data.simulation.connections) {
            resolve({ success: false, error: 'Invalid file format. Missing required simulation data.' });
            return;
          }

          // Clear current simulation
          setNodes([]);
          setConnections([]);
          setSelectedNodes([]);
          setSelectedNode(null);
          setCurrentLayer(0);
          setLayerHistory([0]);

          // Import nodes and connections
          setConnections(data.simulation.connections);

          // Apply smart layout to the imported nodes
          const layoutAlgorithm = detectBestLayout(data.simulation.nodes, data.simulation.connections);
          console.log('Detected layout algorithm:', layoutAlgorithm);
          console.log('Original nodes:', data.simulation.nodes.map(n => ({ id: n.id, x: n.x, y: n.y })));
          
          const layoutOptions: LayoutOptions = {
            width: 1200, // Canvas width
            height: 800, // Canvas height
            padding: 100,
            algorithm: layoutAlgorithm,
            iterations: 300
          };

          const positionedNodes = applySmartLayout(
            data.simulation.nodes,
            data.simulation.connections,
            layoutOptions
          );

          console.log('Positioned nodes:', positionedNodes.map(n => ({ id: n.id, x: n.x, y: n.y })));
          setNodes(positionedNodes);

          // Restore settings
          setIsSimulationRunning(data.settings.simulationRunning);
          setCurrentLayer(data.settings.currentLayer);

          resolve({ success: true, viewport: data.viewport });
        } catch (error) {
          console.error('Import failed:', error);
          resolve({ success: false, error: 'Failed to parse file. Please ensure it\'s a valid GridForge export file.' });
        }
      };
      reader.onerror = () => {
        resolve({ success: false, error: 'Failed to read file.' });
      };
      reader.readAsText(file);
    });
  };

  // Apply smart layout to current simulation
  const applyLayout = (algorithm?: LayoutOptions['algorithm']) => {
    const layoutAlgorithm = algorithm || detectBestLayout(nodes, connections);
    const layoutOptions: LayoutOptions = {
      width: 1200,
      height: 800,
      padding: 100,
      algorithm: layoutAlgorithm,
      iterations: 300
    };

    const positionedNodes = applySmartLayout(nodes, connections, layoutOptions);
    setNodes(positionedNodes);
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
    setIsSelectionMode,
    
    // Import/Export actions
    exportGraph,
    importGraph,
    applyLayout,
    
    // Node creation modal
    isNodeCreationModalOpen,
    pendingNodeType,
    createNodeFromModal,
    closeNodeCreationModal,
    
    // Connection creation modal
    isConnectionCreationModalOpen,
    pendingConnection,
    createConnectionFromModal,
    closeConnectionCreationModal
  };
};
