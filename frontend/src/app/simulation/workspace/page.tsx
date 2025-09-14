'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSimulation } from '@/hooks/useSimulation';
import { GraphExportData } from '@/types/simulation';
import SimulationHeader from '@/components/simulation/SimulationHeader';
import ControlPanel from '@/components/simulation/ControlPanel';
import ReactFlowCanvas from '@/components/simulation/ReactFlowCanvas';
import NodeEditModal from '@/components/simulation/nodes/NodeEditModal';
import NodeCreationModal from '@/components/simulation/nodes/NodeCreationModal';
import ConnectionCreationModal from '@/components/simulation/ConnectionCreationModal';
import FamilyNameModal from '@/components/simulation/FamilyNameModal';
import { Node } from '@/types/simulation';
import '@/utils/debugLayout'; // Import debug utilities

export default function SimulationWorkspace() {
  const [getViewportCenter, setGetViewportCenter] = useState<(() => { x: number; y: number }) | null>(null);
  const [getViewport, setGetViewport] = useState<(() => { x: number; y: number; zoom: number }) | null>(null);
  const [importedViewport, setImportedViewport] = useState<{ x: number; y: number; zoom: number } | undefined>(undefined);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [pendingSelectedNodes, setPendingSelectedNodes] = useState<string[]>([]);
  
  const {
    nodes,
    connections,
    selectedNode,
    isSimulationRunning,
    setNodes,
    setSelectedNode,
    addNode,
    deleteNode,
    updateNodePosition,
    addConnection,
    deleteConnection,
    toggleSimulation,
    getNetworkStats,
    // Hierarchical state
    currentLayer,
    selectedNodes,
    isSelectionMode,
    createGroupNode,
    getFamilyNodes,
    getFamilies,
    navigateToLayer,
    navigateUp,
    navigateDown,
    toggleNodeSelection,
    clearSelection,
    setIsSelectionMode,
    // Import/Export functions
    exportGraph,
    importGraph,
    loadSimulationFromData,
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
  } = useSimulation();

  const selectedNodeData = selectedNode ? nodes.find(n => n.id === selectedNode) || null : null;
  const networkStats = getNetworkStats();

  const handleNodeClick = (nodeId: string | null) => {
    setSelectedNode(nodeId);
  };


  const handleNodeMouseMove = (x: number, y: number) => {
    // React Flow handles positioning internally
    // We don't need to sync positions back to simulation state
  };

  const handleNodeMouseUp = () => {
    // React Flow handles node dragging internally
  };

  const handleConnectionFinish = (fromId: string, toId: string) => {
    addConnection(fromId, toId);
  };

  const handleGetViewportCenter = useCallback((getCenter: () => { x: number; y: number }) => {
    setGetViewportCenter(() => getCenter);
  }, []);

  const handleGetViewport = useCallback((getViewportFn: () => { x: number; y: number; zoom: number }) => {
    setGetViewport(() => getViewportFn);
  }, []);

  const handleAddNode = useCallback((type: any) => {
    if (getViewportCenter) {
      const viewportCenter = getViewportCenter();
      addNode(type as any, viewportCenter);
    } else {
      // Fallback to default positioning if viewport center is not available
      addNode(type as any);
    }
  }, [addNode, getViewportCenter]);

  const handleEditNode = useCallback((node: Node) => {
    setEditingNode(node);
    setIsEditModalOpen(true);
  }, []);

  const handleSaveNode = useCallback((updatedNode: Node) => {
    // Update the node in the simulation state
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === updatedNode.id ? updatedNode : node
      )
    );
    setIsEditModalOpen(false);
    setEditingNode(null);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingNode(null);
  }, []);

  const handleConnectionDelete = useCallback((connectionIds: string[]) => {
    deleteConnection(connectionIds);
  }, [deleteConnection]);

  // Hierarchical handlers
  const handleCreateGroup = useCallback(() => {
    if (selectedNodes.length >= 2) {
      setPendingSelectedNodes(selectedNodes);
      setIsFamilyModalOpen(true);
    }
  }, [selectedNodes]);

  const handleFamilyNameConfirm = useCallback((familyName: string) => {
    createGroupNode(pendingSelectedNodes, familyName);
    setPendingSelectedNodes([]);
  }, [createGroupNode, pendingSelectedNodes]);

  const handleFamilyModalClose = useCallback(() => {
    setIsFamilyModalOpen(false);
    setPendingSelectedNodes([]);
  }, []);

  const handleToggleSelectionMode = useCallback(() => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      clearSelection();
    }
  }, [isSelectionMode, setIsSelectionMode, clearSelection]);

  const handleNavigateDown = useCallback((groupNodeId?: string) => {
    if (groupNodeId) {
      navigateDown(groupNodeId);
    } else {
      // Manual navigation down - go to layer 0
      navigateToLayer(0);
    }
  }, [navigateDown, navigateToLayer]);

  const handleNavigateUp = useCallback(() => {
    navigateUp();
  }, [navigateUp]);

  // Import/Export handlers
  const handleExportGraph = useCallback(() => {
    const simulationName = prompt('Enter simulation name:', 'GridForge Simulation') || 'GridForge Simulation';
    
    // Get current viewport if available
    const currentViewport = getViewport ? getViewport() : { x: 0, y: 0, zoom: 1 };
    
    // Export with current viewport
    exportGraph(simulationName, currentViewport);
  }, [exportGraph, getViewport]);

  const handleImportGraph = useCallback(async (file: File) => {
    try {
      const result = await importGraph(file);
      if (result.success) {
        // Set the imported viewport for ReactFlowCanvas to restore
        if (result.viewport) {
          setImportedViewport(result.viewport);
          // Clear it after a delay to prevent re-triggering
          setTimeout(() => setImportedViewport(undefined), 1000);
        }
        alert('Graph imported successfully!');
      } else {
        alert(`Import failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import graph. Please try again.');
    }
  }, [importGraph]);

  const handleApplyLayout = useCallback(() => {
    applyLayout();
  }, [applyLayout]);

  // Load simulation data from sessionStorage on mount
  useEffect(() => {
    const loadedData = sessionStorage.getItem('loadedSimulationData');
    if (loadedData) {
      try {
        const simulationData: GraphExportData = JSON.parse(loadedData);
        const result = loadSimulationFromData(simulationData);
        
        if (result.success && result.viewport) {
          setImportedViewport(result.viewport);
          console.log('✅ Loaded simulation data from dashboard');
        } else {
          console.error('Failed to load simulation data:', result.error);
        }
        
        // Clear the loaded data from sessionStorage
        sessionStorage.removeItem('loadedSimulationData');
      } catch (error) {
        console.error('Failed to parse loaded simulation data:', error);
        sessionStorage.removeItem('loadedSimulationData');
      }
    }
  }, [loadSimulationFromData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <SimulationHeader
        isSimulationRunning={isSimulationRunning}
        onToggleSimulation={toggleSimulation}
        currentLayer={currentLayer}
        selectedNodes={selectedNodes}
        isSelectionMode={isSelectionMode}
        onToggleSelectionMode={handleToggleSelectionMode}
        onCreateGroup={handleCreateGroup}
        onNavigateUp={handleNavigateUp}
        onNavigateDown={handleNavigateDown}
        onClearSelection={clearSelection}
        onExportGraph={handleExportGraph}
        onImportGraph={handleImportGraph}
        onApplyLayout={handleApplyLayout}
      />

      <main className="flex h-[calc(100vh-3rem)]">
        <ControlPanel
          selectedNode={selectedNodeData}
          networkStats={networkStats}
          onAddNode={handleAddNode}
          onDeleteNode={deleteNode}
        />

        <ReactFlowCanvas
          nodes={nodes}
          connections={connections}
          selectedNode={selectedNode}
          onNodeClick={handleNodeClick}
          onNodeMouseMove={handleNodeMouseMove}
          onNodeMouseUp={handleNodeMouseUp}
          onConnectionFinish={handleConnectionFinish}
          onConnectionDelete={handleConnectionDelete}
          onGetViewportCenter={handleGetViewportCenter}
          onGetViewport={handleGetViewport}
          onEditNode={handleEditNode}
          onDeleteNode={deleteNode}
          currentLayer={currentLayer}
          selectedNodes={selectedNodes}
          isSelectionMode={isSelectionMode}
          onToggleNodeSelection={toggleNodeSelection}
          onNavigateDown={handleNavigateDown}
          onNavigateUp={navigateUp}
          onNavigateToLayer={navigateToLayer}
          importedViewport={importedViewport}
        />
      </main>

      {/* Node Creation Modal */}
      <NodeCreationModal
        isOpen={isNodeCreationModalOpen}
        nodeType={pendingNodeType}
        onClose={closeNodeCreationModal}
        onCreateNode={createNodeFromModal}
      />

      {/* Connection Creation Modal */}
      <ConnectionCreationModal
        isOpen={isConnectionCreationModalOpen}
        fromNodeId={pendingConnection?.from || null}
        toNodeId={pendingConnection?.to || null}
        fromNodeName={pendingConnection?.fromName || ''}
        toNodeName={pendingConnection?.toName || ''}
        onClose={closeConnectionCreationModal}
        onCreateConnection={createConnectionFromModal}
      />

      {/* Node Edit Modal - Rendered at workspace level */}
      <NodeEditModal
        node={editingNode}
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveNode}
      />

      {/* Family Name Modal */}
      <FamilyNameModal
        isOpen={isFamilyModalOpen}
        onClose={handleFamilyModalClose}
        onConfirm={handleFamilyNameConfirm}
        selectedNodeCount={pendingSelectedNodes.length}
      />
    </div>
  );
}
