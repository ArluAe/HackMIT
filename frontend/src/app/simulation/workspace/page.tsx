'use client';

import { useState, useCallback } from 'react';
import { useSimulation } from '@/hooks/useSimulation';
import SimulationHeader from '@/components/simulation/SimulationHeader';
import ControlPanel from '@/components/simulation/ControlPanel';
import ReactFlowCanvas from '@/components/simulation/ReactFlowCanvas';
import NodeEditModal from '@/components/simulation/nodes/NodeEditModal';
import { Node } from '@/types/simulation';

export default function SimulationWorkspace() {
  const [getViewportCenter, setGetViewportCenter] = useState<(() => { x: number; y: number }) | null>(null);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
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
    toggleSimulation,
    getNetworkStats
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


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <SimulationHeader
        isSimulationRunning={isSimulationRunning}
        onToggleSimulation={toggleSimulation}
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
          onGetViewportCenter={handleGetViewportCenter}
          onEditNode={handleEditNode}
        />
      </main>

      {/* Node Edit Modal - Rendered at workspace level */}
      <NodeEditModal
        node={editingNode}
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveNode}
      />
    </div>
  );
}
