'use client';

import { useState, useCallback } from 'react';
import { useSimulation } from '@/hooks/useSimulation';
import SimulationHeader from '@/components/simulation/SimulationHeader';
import ControlPanel from '@/components/simulation/ControlPanel';
import ReactFlowCanvas from '@/components/simulation/ReactFlowCanvas';
import NodeEditModal from '@/components/simulation/nodes/NodeEditModal';
import FamilyNameModal from '@/components/simulation/FamilyNameModal';
import { Node } from '@/types/simulation';

export default function SimulationWorkspace() {
  const [getViewportCenter, setGetViewportCenter] = useState<(() => { x: number; y: number }) | null>(null);
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
    setIsSelectionMode
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
          onEditNode={handleEditNode}
          currentLayer={currentLayer}
          selectedNodes={selectedNodes}
          isSelectionMode={isSelectionMode}
          onToggleNodeSelection={toggleNodeSelection}
          onNavigateDown={handleNavigateDown}
          onNavigateToLayer={navigateToLayer}
        />
      </main>

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
