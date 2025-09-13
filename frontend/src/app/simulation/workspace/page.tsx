'use client';

import { useSimulation } from '@/hooks/useSimulation';
import SimulationHeader from '@/components/simulation/SimulationHeader';
import ControlPanel from '@/components/simulation/ControlPanel';
import ReactFlowCanvas from '@/components/simulation/ReactFlowCanvas';

export default function SimulationWorkspace() {
  const {
    nodes,
    connections,
    selectedNode,
    isSimulationRunning,
    draggedNode,
    setSelectedNode,
    setDraggedNode,
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

  const handleNodeMouseDown = (nodeId: string | null) => {
    setDraggedNode(nodeId);
  };

  const handleNodeMouseMove = (x: number, y: number) => {
    if (draggedNode) {
      updateNodePosition(draggedNode, x, y);
    }
  };

  const handleNodeMouseUp = () => {
    setDraggedNode(null);
  };

  const handleConnectionFinish = (fromId: string, toId: string) => {
    addConnection(fromId, toId);
  };


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
          onAddNode={addNode}
          onDeleteNode={deleteNode}
        />

        <ReactFlowCanvas
          nodes={nodes}
          connections={connections}
          selectedNode={selectedNode}
          onNodeClick={handleNodeClick}
          onNodeMouseDown={handleNodeMouseDown}
          onNodeMouseMove={handleNodeMouseMove}
          onNodeMouseUp={handleNodeMouseUp}
          onConnectionFinish={handleConnectionFinish}
        />
      </main>
    </div>
  );
}
