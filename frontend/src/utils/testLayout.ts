// Test utility for layout algorithms
import { applySmartLayout, detectBestLayout } from './graphLayout';
import { Node as SimulationNode, Connection as SimulationConnection } from '@/types/simulation';

export const createTestGraph = (): { nodes: SimulationNode[]; connections: SimulationConnection[] } => {
  const nodes: SimulationNode[] = [
    // Family 1 - Solar Farm
    { id: '1', type: 'generator', x: 0, y: 0, name: 'Solar Panel 1', power: 500, status: 'active', layer: 0, childNodes: [], isGroup: false, familyId: 'family1', familyName: 'Solar Farm' },
    { id: '2', type: 'generator', x: 0, y: 0, name: 'Solar Panel 2', power: 500, status: 'active', layer: 0, childNodes: [], isGroup: false, familyId: 'family1', familyName: 'Solar Farm' },
    { id: '3', type: 'storage', x: 0, y: 0, name: 'Battery 1', power: 200, status: 'active', layer: 0, childNodes: [], isGroup: false, familyId: 'family1', familyName: 'Solar Farm' },
    
    // Family 2 - Industrial Zone
    { id: '4', type: 'consumer', x: 0, y: 0, name: 'Factory A', power: 800, status: 'active', layer: 0, childNodes: [], isGroup: false, familyId: 'family2', familyName: 'Industrial Zone' },
    { id: '5', type: 'consumer', x: 0, y: 0, name: 'Factory B', power: 600, status: 'active', layer: 0, childNodes: [], isGroup: false, familyId: 'family2', familyName: 'Industrial Zone' },
    { id: '6', type: 'storage', x: 0, y: 0, name: 'Battery 2', power: 300, status: 'active', layer: 0, childNodes: [], isGroup: false, familyId: 'family2', familyName: 'Industrial Zone' },
    
    // Standalone nodes
    { id: '7', type: 'generator', x: 0, y: 0, name: 'Wind Turbine', power: 400, status: 'active', layer: 0, childNodes: [], isGroup: false },
    { id: '8', type: 'consumer', x: 0, y: 0, name: 'Residential', power: 200, status: 'active', layer: 0, childNodes: [], isGroup: false },
    { id: '9', type: 'grid', x: 0, y: 0, name: 'Main Grid', power: 1000, status: 'active', layer: 0, childNodes: [], isGroup: false }
  ];

  const connections: SimulationConnection[] = [
    // Family 1 connections
    { id: '1', from: '1', to: '3', power: 100, status: 'active' },
    { id: '2', from: '2', to: '3', power: 100, status: 'active' },
    { id: '3', from: '3', to: '4', power: 150, status: 'active' },
    
    // Family 2 connections
    { id: '4', from: '4', to: '6', power: 200, status: 'active' },
    { id: '5', from: '5', to: '6', power: 150, status: 'active' },
    { id: '6', from: '6', to: '7', power: 100, status: 'active' },
    
    // Cross-connections
    { id: '7', from: '7', to: '8', power: 80, status: 'active' },
    { id: '8', from: '8', to: '9', power: 50, status: 'active' },
    { id: '9', from: '9', to: '1', power: 200, status: 'active' }
  ];

  return { nodes, connections };
};

export const testLayoutAlgorithms = () => {
  const { nodes, connections } = createTestGraph();
  
  console.log('Testing layout algorithms...');
  
  // Test auto-detection
  const detectedAlgorithm = detectBestLayout(nodes, connections);
  console.log('Detected algorithm:', detectedAlgorithm);
  
  // Test each algorithm
  const algorithms = ['force', 'hierarchical', 'circular', 'grid', 'louvain'] as const;
  
  algorithms.forEach(algorithm => {
    const startTime = performance.now();
    const positionedNodes = applySmartLayout(nodes, connections, {
      width: 1200,
      height: 800,
      padding: 100,
      algorithm,
      iterations: 300
    });
    const endTime = performance.now();
    
    console.log(`${algorithm}: ${(endTime - startTime).toFixed(2)}ms`);
    console.log('Sample positions:', positionedNodes.slice(0, 3).map(n => ({ id: n.id, x: n.x.toFixed(1), y: n.y.toFixed(1) })));
  });
};
