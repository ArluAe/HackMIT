// Debug utility for testing layout algorithms
import { applySmartLayout, detectBestLayout } from './graphLayout';
import { Node as SimulationNode, Connection as SimulationConnection } from '@/types/simulation';

export const createTestNodes = (): SimulationNode[] => [
  {
    id: '1',
    type: 'generator',
    x: 0, // This will be overridden by layout
    y: 0,
    name: 'Solar Panel 1',
    power: 500,
    status: 'active',
    layer: 0,
    childNodes: [],
    isGroup: false
  },
  {
    id: '2',
    type: 'consumer',
    x: 0,
    y: 0,
    name: 'Factory 1',
    power: 300,
    status: 'active',
    layer: 0,
    childNodes: [],
    isGroup: false
  },
  {
    id: '3',
    type: 'storage',
    x: 0,
    y: 0,
    name: 'Battery 1',
    power: 200,
    status: 'active',
    layer: 0,
    childNodes: [],
    isGroup: false
  },
  {
    id: '4',
    type: 'generator',
    x: 0,
    y: 0,
    name: 'Wind Turbine',
    power: 400,
    status: 'active',
    layer: 0,
    childNodes: [],
    isGroup: false
  },
  {
    id: '5',
    type: 'consumer',
    x: 0,
    y: 0,
    name: 'Residential',
    power: 150,
    status: 'active',
    layer: 0,
    childNodes: [],
    isGroup: false
  }
];

export const createTestConnections = (): SimulationConnection[] => [
  { id: '1', from: '1', to: '2', power: 100, status: 'active' },
  { id: '2', from: '2', to: '3', power: 50, status: 'active' },
  { id: '3', from: '3', to: '4', power: 75, status: 'active' },
  { id: '4', from: '4', to: '5', power: 60, status: 'active' },
  { id: '5', from: '5', to: '1', power: 40, status: 'active' }
];

export const testLayout = () => {
  console.log('=== Testing Layout Algorithms ===');
  
  const nodes = createTestNodes();
  const connections = createTestConnections();
  
  console.log('Input nodes:', nodes.map(n => ({ id: n.id, x: n.x, y: n.y })));
  console.log('Input connections:', connections.length);
  
  const algorithm = detectBestLayout(nodes, connections);
  console.log('Detected algorithm:', algorithm);
  
  const result = applySmartLayout(nodes, connections, {
    width: 1200,
    height: 800,
    padding: 100,
    algorithm,
    iterations: 300
  });
  
  console.log('Output nodes:', result.map(n => ({ id: n.id, x: n.x, y: n.y })));
  
  // Check if all nodes have valid positions
  const validPositions = result.every(n => 
    n.x !== undefined && n.y !== undefined && 
    !isNaN(n.x) && !isNaN(n.y) &&
    n.x !== 0 && n.y !== 0
  );
  
  console.log('All positions valid:', validPositions);
  
  if (!validPositions) {
    console.error('Some nodes have invalid positions!');
    result.forEach(n => {
      if (n.x === 0 && n.y === 0) {
        console.error('Node', n.id, 'has position (0,0)');
      }
    });
  }
  
  return result;
};

export const testLouvainLayout = () => {
  console.log('=== Testing Louvain Layout Specifically ===');
  
  const nodes = createTestNodes();
  const connections = createTestConnections();
  
  console.log('Input nodes:', nodes.map(n => ({ id: n.id, x: n.x, y: n.y })));
  console.log('Input connections:', connections.length);
  
  const result = applySmartLayout(nodes, connections, {
    width: 1200,
    height: 800,
    padding: 100,
    algorithm: 'louvain',
    iterations: 300
  });
  
  console.log('Louvain output nodes:', result.map(n => ({ id: n.id, x: n.x, y: n.y })));
  
  // Check spacing between nodes
  let minDistance = Infinity;
  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      const dx = result[j].x - result[i].x;
      const dy = result[j].y - result[i].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      minDistance = Math.min(minDistance, distance);
    }
  }
  
  console.log('Minimum distance between nodes:', minDistance.toFixed(1), 'px');
  console.log('Nodes properly spaced (>=400px):', minDistance >= 400);
  console.log('Nodes safe spacing (>=500px):', minDistance >= 500);
  
  // Check for any overlapping nodes with much stricter criteria
  let overlappingPairs = 0;
  let closePairs = 0;
  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      const dx = result[j].x - result[i].x;
      const dy = result[j].y - result[i].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 300) { // 300px is the minimum safe distance
        overlappingPairs++;
        console.warn(`Overlapping nodes: ${result[i].id} and ${result[j].id} (${distance.toFixed(1)}px apart)`);
      } else if (distance < 400) {
        closePairs++;
        console.warn(`Close nodes: ${result[i].id} and ${result[j].id} (${distance.toFixed(1)}px apart)`);
      }
    }
  }
  
  console.log('Overlapping node pairs (<300px):', overlappingPairs);
  console.log('Close node pairs (300-400px):', closePairs);
  console.log('No overlaps:', overlappingPairs === 0);
  console.log('Safe spacing:', closePairs === 0);
  
  return result;
};

// Make it available globally for testing
if (typeof window !== 'undefined') {
  (window as any).testLayout = testLayout;
  (window as any).testLouvainLayout = testLouvainLayout;
  (window as any).createTestNodes = createTestNodes;
  (window as any).createTestConnections = createTestConnections;
}
