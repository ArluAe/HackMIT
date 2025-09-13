'use client';

import { useRef, useEffect, useState } from 'react';
import { Node, Connection } from '@/types/simulation';

interface NetworkCanvasProps {
  nodes: Node[];
  connections: Connection[];
  selectedNode: string | null;
  draggedNode: string | null;
  isConnecting: boolean;
  onNodeClick: (nodeId: string | null) => void;
  onNodeMouseDown: (nodeId: string | null) => void;
  onNodeMouseMove: (x: number, y: number) => void;
  onNodeMouseUp: () => void;
  onConnectionFinish: (nodeId: string) => void;
}

export default function NetworkCanvas({
  nodes,
  connections,
  selectedNode,
  draggedNode,
  isConnecting,
  onNodeClick,
  onNodeMouseDown,
  onNodeMouseMove,
  onNodeMouseUp,
  onConnectionFinish
}: NetworkCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanX, setLastPanX] = useState(0);
  const [lastPanY, setLastPanY] = useState(0);

  const getNodeColor = (node: Node) => {
    switch (node.type) {
      case 'generator': return node.status === 'active' ? '#10b981' : '#6b7280';
      case 'consumer': return node.status === 'active' ? '#f59e0b' : '#6b7280';
      case 'storage': 
        if (node.status === 'charging') return '#3b82f6';
        if (node.status === 'discharging') return '#ef4444';
        return '#6b7280';
      case 'grid': return node.status === 'active' ? '#8b5cf6' : '#6b7280';
      default: return '#6b7280';
    }
  };

  const getNodeIcon = (node: Node) => {
    switch (node.type) {
      case 'generator': return '⚡';
      case 'consumer': return '🏭';
      case 'storage': return '🔋';
      case 'grid': return '🔌';
      default: return '⚪';
    }
  };

  const drawNetwork = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context state
    ctx.save();

    // Apply zoom and pan transformations
    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);

    // Draw grid background
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1 / zoom; // Adjust line width for zoom
    const gridSize = 50;
    const startX = Math.floor(-panX / zoom / gridSize) * gridSize;
    const startY = Math.floor(-panY / zoom / gridSize) * gridSize;
    const endX = Math.ceil((canvas.width - panX) / zoom / gridSize) * gridSize;
    const endY = Math.ceil((canvas.height - panY) / zoom / gridSize) * gridSize;

    for (let x = startX; x <= endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }

    // Draw connections
    connections.forEach(conn => {
      const fromNode = nodes.find(n => n.id === conn.from);
      const toNode = nodes.find(n => n.id === conn.to);
      
      if (fromNode && toNode) {
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.strokeStyle = conn.status === 'active' ? '#4b5563' : '#374151';
        ctx.lineWidth = 3 / zoom;
        ctx.stroke();

        // Draw power flow indicator
        if (conn.status === 'active') {
          const midX = (fromNode.x + toNode.x) / 2;
          const midY = (fromNode.y + toNode.y) / 2;
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(midX, midY, 4 / zoom, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const isSelected = selectedNode === node.id;
      
      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, 30, 0, 2 * Math.PI);
      ctx.fillStyle = getNodeColor(node);
      ctx.fill();
      
      // Node border
      ctx.strokeStyle = isSelected ? '#ffffff' : '#374151';
      ctx.lineWidth = (isSelected ? 4 : 2) / zoom;
      ctx.stroke();

      // Node icon
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${20 / zoom}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(getNodeIcon(node), node.x, node.y);

      // Node name
      ctx.fillStyle = '#d1d5db';
      ctx.font = `bold ${14 / zoom}px Arial`;
      ctx.fillText(node.name, node.x, node.y + 45);

      // Power value
      ctx.fillStyle = '#9ca3af';
      ctx.font = `${12 / zoom}px Arial`;
      ctx.fillText(`${node.power}kW`, node.x, node.y + 65);
    });

    // Restore context state
    ctx.restore();
  };

  useEffect(() => {
    drawNetwork();
  }, [nodes, connections, selectedNode, zoom, panX, panY]);

  const screenToWorld = (screenX: number, screenY: number) => {
    return {
      x: (screenX - panX) / zoom,
      y: (screenY - panY) / zoom
    };
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldPos = screenToWorld(screenX, screenY);

    // Check if click is on a node
    const clickedNode = nodes.find(node => {
      const distance = Math.sqrt((worldPos.x - node.x) ** 2 + (worldPos.y - node.y) ** 2);
      return distance <= 30;
    });

    if (isConnecting && clickedNode) {
      onConnectionFinish(clickedNode.id);
    } else {
      onNodeClick(clickedNode ? clickedNode.id : null);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldPos = screenToWorld(screenX, screenY);

    const clickedNode = nodes.find(node => {
      const distance = Math.sqrt((worldPos.x - node.x) ** 2 + (worldPos.y - node.y) ** 2);
      return distance <= 30;
    });

    if (clickedNode) {
      onNodeMouseDown(clickedNode.id);
    } else {
      // Start panning
      setIsPanning(true);
      setLastPanX(screenX);
      setLastPanY(screenY);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    if (isPanning) {
      // Pan the canvas
      const deltaX = screenX - lastPanX;
      const deltaY = screenY - lastPanY;
      setPanX(panX + deltaX);
      setPanY(panY + deltaY);
      setLastPanX(screenX);
      setLastPanY(screenY);
    } else if (draggedNode) {
      // Move node
      const worldPos = screenToWorld(screenX, screenY);
      onNodeMouseMove(worldPos.x, worldPos.y);
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    onNodeMouseUp();
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, zoom * delta));
    
    // Zoom towards mouse position
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const worldX = (mouseX - panX) / zoom;
    const worldY = (mouseY - panY) / zoom;
    
    setPanX(mouseX - worldX * newZoom);
    setPanY(mouseY - worldY * newZoom);
    setZoom(newZoom);
  };

  return (
    <div className="flex-1 relative">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full h-full cursor-pointer"
        onClick={handleCanvasClick}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onWheel={handleWheel}
      />
      
      {/* Empty State */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
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
