import { useState, useEffect, useCallback } from 'react';
import { Node, Connection } from '@/types/simulation';
import { simulationAPI, SimulationUpdate } from '@/services/simulationAPI';

export const useSimulation = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [simulationData, setSimulationData] = useState<any>(null);

  const addNode = (type: Node['type']) => {
    const newNode: Node = {
      id: Date.now().toString(),
      type,
      x: 400 + Math.random() * 200,
      y: 300 + Math.random() * 200,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${nodes.length + 1}`,
      power: Math.floor(Math.random() * 500) + 100,
      status: 'active'
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

  return {
    // State
    nodes,
    connections,
    selectedNode,
    isSimulationRunning,
    draggedNode,
    isConnecting,
    connectionStart,
    
    // Actions
    setNodes,
    setConnections,
    setSelectedNode,
    setDraggedNode,
    addNode,
    deleteNode,
    updateNodePosition,
    addConnection,
    startConnection,
    finishConnection,
    cancelConnection,
    toggleSimulation,
    getNetworkStats
  };
};
