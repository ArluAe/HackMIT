import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';
import { Node as SimulationNode, Connection as SimulationConnection } from '@/types/simulation';
import { applyLouvainLayout } from './louvainLayout';

export interface LayoutOptions {
  width: number;
  height: number;
  padding: number;
  algorithm: 'force' | 'hierarchical' | 'circular' | 'grid' | 'louvain';
  iterations?: number;
}

export interface PositionedNode extends SimulationNode {
  x: number;
  y: number;
}

/**
 * Apply smart layout to nodes using various algorithms
 */
export const applySmartLayout = (
  nodes: SimulationNode[],
  connections: SimulationConnection[],
  options: LayoutOptions
): PositionedNode[] => {
  const { width, height, padding, algorithm, iterations = 300 } = options;

  console.log('Applying smart layout:', { algorithm, nodeCount: nodes.length, connectionCount: connections.length });

  let result: PositionedNode[];

  try {
    switch (algorithm) {
      case 'force':
        result = applyForceLayout(nodes, connections, { width, height, padding, iterations });
        break;
      case 'hierarchical':
        result = applyHierarchicalLayout(nodes, connections, { width, height, padding });
        break;
      case 'circular':
        result = applyCircularLayout(nodes, { width, height, padding });
        break;
      case 'grid':
        result = applyGridLayout(nodes, { width, height, padding });
        break;
      case 'louvain':
        result = applyLouvainLayout(nodes, connections, { width, height, padding });
        break;
      default:
        result = applyForceLayout(nodes, connections, { width, height, padding, iterations });
    }

    // Ensure all nodes have valid positions
    const centerX = width / 2;
    const centerY = height / 2;
    
    result = result.map((node, index) => {
      const hasValidPosition = node.x !== undefined && node.y !== undefined && 
                              !isNaN(node.x) && !isNaN(node.y);
      
      if (!hasValidPosition) {
        // Fallback positioning
        const angle = (2 * Math.PI * index) / result.length;
        const radius = Math.min(width, height) * 0.3;
        return {
          ...node,
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        };
      }
      
      return node;
    });

    // Verify spacing and apply fallback if needed
    if (!verifyNodeSpacing(result, 300)) {
      console.log('Spacing verification failed, applying fallback circular layout');
      result = applyCircularLayout(nodes, { width, height, padding });
    }
    
    // Always apply additional spacing correction as a safety measure
    result = ensureMinimumSpacing(result, 300, width, height, padding);

    console.log('Layout completed successfully');
    return result;
  } catch (error) {
    console.error('Layout error:', error);
    // Fallback to simple circular layout
    return applyCircularLayout(nodes, { width, height, padding });
  }
};

/**
 * Verify that nodes are properly spaced
 */
function verifyNodeSpacing(nodes: PositionedNode[], minDistance: number): boolean {
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[j].x - nodes[i].x;
      const dy = nodes[j].y - nodes[i].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < minDistance) {
        console.warn(`Nodes too close: ${nodes[i].id} and ${nodes[j].id} (${distance.toFixed(1)}px apart)`);
        return false;
      }
    }
  }
  return true;
}

/**
 * Ensure minimum spacing between nodes
 */
function ensureMinimumSpacing(
  nodes: PositionedNode[],
  minDistance: number,
  width: number,
  height: number,
  padding: number
): PositionedNode[] {
  const result = [...nodes];
  const maxIterations = 100;
  
  for (let iter = 0; iter < maxIterations; iter++) {
    let hasOverlaps = false;
    
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const node1 = result[i];
        const node2 = result[j];
        const dx = node2.x - node1.x;
        const dy = node2.y - node1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDistance && distance > 0) {
          hasOverlaps = true;
          
          // Calculate separation vector
          const separationX = (dx / distance) * minDistance;
          const separationY = (dy / distance) * minDistance;
          
          // Move nodes apart
          const force = 0.3;
          result[i] = {
            ...node1,
            x: Math.max(padding, Math.min(width - padding, node1.x - separationX * force)),
            y: Math.max(padding, Math.min(height - padding, node1.y - separationY * force))
          };
          
          result[j] = {
            ...node2,
            x: Math.max(padding, Math.min(width - padding, node2.x + separationX * force)),
            y: Math.max(padding, Math.min(height - padding, node2.y + separationY * force))
          };
        }
      }
    }
    
    if (!hasOverlaps) break;
  }
  
  return result;
}

/**
 * Force-directed layout using D3 force simulation
 * This creates natural, organic-looking layouts
 */
const applyForceLayout = (
  nodes: SimulationNode[],
  connections: SimulationConnection[],
  options: { width: number; height: number; padding: number; iterations: number }
): PositionedNode[] => {
  const { width, height, padding, iterations } = options;
  const centerX = width / 2;
  const centerY = height / 2;

  console.log('Force layout - input nodes:', nodes.length, 'connections:', connections.length);

  // Create D3 nodes with proper initial positions
  const d3Nodes = nodes.map((node, index) => {
    // If node has valid x,y coordinates, use them, otherwise create random positions
    const hasValidPosition = node.x !== undefined && node.y !== undefined && 
                            !isNaN(node.x) && !isNaN(node.y) && 
                            node.x !== 0 && node.y !== 0;
    
    return {
      id: node.id,
      x: hasValidPosition ? node.x : centerX + (Math.random() - 0.5) * width * 0.4,
      y: hasValidPosition ? node.y : centerY + (Math.random() - 0.5) * height * 0.4,
      type: node.type,
      power: node.power,
      familyId: node.familyId
    };
  });

  console.log('D3 nodes created:', d3Nodes.map(n => ({ id: n.id, x: n.x, y: n.y })));

  // Create D3 links
  const d3Links = connections.map(conn => ({
    source: conn.from,
    target: conn.to,
    power: conn.power
  }));

  console.log('D3 links created:', d3Links.length);

  // Create force simulation with better parameters for connection awareness
  const simulation = forceSimulation(d3Nodes)
    .force('link', forceLink(d3Links)
      .id((d: any) => d.id)
      .distance(300) // Much larger distance between connected nodes for better spacing
      .strength(0.8) // Increased link strength to respect connections better
    )
    .force('charge', forceManyBody()
      .strength(-800) // Increased repulsion strength
      .distanceMax(300) // Reduced maximum distance for stronger local repulsion
    )
    .force('center', forceCenter(centerX, centerY))
    .force('collide', forceCollide(150)) // Much larger collision radius to prevent overlapping
    .stop();

  // Run simulation
  for (let i = 0; i < iterations; i++) {
    simulation.tick();
  }

  console.log('After simulation:', d3Nodes.map(n => ({ id: n.id, x: n.x, y: n.y })));

  // Convert back to our node format
  let result = nodes.map(node => {
    const positionedNode = d3Nodes.find(n => n.id === node.id);
    return {
      ...node,
      x: positionedNode ? positionedNode.x : centerX + (Math.random() - 0.5) * width * 0.2,
      y: positionedNode ? positionedNode.y : centerY + (Math.random() - 0.5) * height * 0.2
    };
  });

  // Apply post-processing to ensure minimum spacing
  result = ensureMinimumSpacing(result, 400, width, height, padding);

  console.log('After spacing correction:', result.map(n => ({ id: n.id, x: n.x, y: n.y })));

  console.log('Final result:', result.map(n => ({ id: n.id, x: n.x, y: n.y })));
  return result;
};

/**
 * Hierarchical layout - good for tree-like structures
 */
const applyHierarchicalLayout = (
  nodes: SimulationNode[],
  connections: SimulationConnection[],
  options: { width: number; height: number; padding: number }
): PositionedNode[] => {
  const { width, height, padding } = options;
  const centerX = width / 2;
  const centerY = height / 2;

  // Group nodes by families
  const familyGroups = groupNodesByFamily(nodes);
  
  // Position family groups in a circle
  const familyPositions = familyGroups.map((family, index) => {
    const angle = (2 * Math.PI * index) / familyGroups.length;
    const radius = Math.min(width, height) * 0.3;
    return {
      familyId: family.familyId,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  });

  // Position nodes within each family
  const positionedNodes = nodes.map(node => {
    if (node.familyId) {
      const familyPos = familyPositions.find(pos => pos.familyId === node.familyId);
      if (familyPos) {
        // Position nodes in a small cluster around family center
        const familyNodes = nodes.filter(n => n.familyId === node.familyId);
        const nodeIndex = familyNodes.findIndex(n => n.id === node.id);
        const angle = (2 * Math.PI * nodeIndex) / familyNodes.length;
        const radius = 80; // Small radius for family clustering
        
        return {
          ...node,
          x: familyPos.x + radius * Math.cos(angle),
          y: familyPos.y + radius * Math.sin(angle)
        };
      }
    }
    
    // Default positioning for nodes without families
    return {
      ...node,
      x: node.x || centerX + (Math.random() - 0.5) * width * 0.2,
      y: node.y || centerY + (Math.random() - 0.5) * height * 0.2
    };
  });

  return positionedNodes;
};

/**
 * Circular layout - nodes arranged in a circle
 */
const applyCircularLayout = (
  nodes: SimulationNode[],
  options: { width: number; height: number; padding: number }
): PositionedNode[] => {
  const { width, height, padding } = options;
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Calculate radius to ensure minimum 400px spacing between nodes
  const minSpacing = 400;
  const circumference = nodes.length * minSpacing;
  const radius = Math.max(circumference / (2 * Math.PI), Math.min(width, height) * 0.4);
  
  console.log(`Circular layout: ${nodes.length} nodes, radius: ${radius.toFixed(1)}px`);

  return nodes.map((node, index) => {
    const angle = (2 * Math.PI * index) / nodes.length;
    return {
      ...node,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  });
};

/**
 * Grid layout - nodes arranged in a grid
 */
const applyGridLayout = (
  nodes: SimulationNode[],
  options: { width: number; height: number; padding: number }
): PositionedNode[] => {
  const { width, height, padding } = options;
  const cols = Math.ceil(Math.sqrt(nodes.length));
  const rows = Math.ceil(nodes.length / cols);
  
  // Ensure minimum 400px spacing between nodes
  const minSpacing = 400;
  const cellWidth = Math.max((width - 2 * padding) / cols, minSpacing);
  const cellHeight = Math.max((height - 2 * padding) / rows, minSpacing);
  
  console.log(`Grid layout: ${cols}x${rows}, cell size: ${cellWidth.toFixed(1)}x${cellHeight.toFixed(1)}`);

  return nodes.map((node, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    return {
      ...node,
      x: padding + col * cellWidth + cellWidth / 2,
      y: padding + row * cellHeight + cellHeight / 2
    };
  });
};

/**
 * Group nodes by their family relationships
 */
const groupNodesByFamily = (nodes: SimulationNode[]) => {
  const families = new Map<string, SimulationNode[]>();
  
  nodes.forEach(node => {
    if (node.familyId) {
      if (!families.has(node.familyId)) {
        families.set(node.familyId, []);
      }
      families.get(node.familyId)!.push(node);
    }
  });

  return Array.from(families.entries()).map(([familyId, familyNodes]) => ({
    familyId,
    nodes: familyNodes
  }));
};

/**
 * Apply family-based clustering to force-directed layout
 */
const applyFamilyClustering = (
  nodes: any[],
  familyGroups: any[],
  options: { width: number; height: number; padding: number }
) => {
  const { width, height, padding } = options;
  const centerX = width / 2;
  const centerY = height / 2;

  // Calculate family centers
  const familyCenters = familyGroups.map(family => {
    const familyNodes = nodes.filter(n => n.familyId === family.familyId);
    const centerX = familyNodes.reduce((sum, n) => sum + n.x, 0) / familyNodes.length;
    const centerY = familyNodes.reduce((sum, n) => sum + n.y, 0) / familyNodes.length;
    return { familyId: family.familyId, x: centerX, y: centerY };
  });

  // Adjust node positions to cluster around family centers
  return nodes.map(node => {
    if (node.familyId) {
      const familyCenter = familyCenters.find(center => center.familyId === node.familyId);
      if (familyCenter) {
        // Move node closer to family center
        const dx = familyCenter.x - node.x;
        const dy = familyCenter.y - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 100; // Maximum distance from family center
        
        if (distance > maxDistance) {
          const factor = maxDistance / distance;
          return {
            ...node,
            x: node.x + dx * factor,
            y: node.y + dy * factor
          };
        }
      }
    }
    return node;
  });
};

/**
 * Auto-detect the best layout algorithm based on graph characteristics
 */
export const detectBestLayout = (nodes: SimulationNode[], connections: SimulationConnection[]): LayoutOptions['algorithm'] => {
  const nodeCount = nodes.length;
  const connectionCount = connections.length;
  const familyCount = new Set(nodes.map(n => n.familyId).filter(Boolean)).size;
  
  // Calculate graph density
  const maxPossibleConnections = nodeCount * (nodeCount - 1) / 2;
  const density = connectionCount / maxPossibleConnections;

  // Decision logic
  if (familyCount > 0 && familyCount < nodeCount / 2) {
    return 'hierarchical'; // Good for family-based grouping
  } else if (nodeCount > 15 && density > 0.1) {
    return 'louvain'; // Good for complex graphs with communities
  } else if (density > 0.3) {
    return 'force'; // Good for dense, interconnected graphs
  } else if (nodeCount < 10) {
    return 'circular'; // Good for small graphs
  } else {
    return 'force'; // Default to force-directed
  }
};
