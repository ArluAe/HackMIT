import { Node as SimulationNode, Connection as SimulationConnection } from '@/types/simulation';

/**
 * Louvain community detection algorithm implementation
 * This creates natural clusters based on network structure
 */
export class LouvainLayout {
  private nodes: SimulationNode[];
  private connections: SimulationConnection[];
  private communities: Map<string, number> = new Map();
  private nodeToCommunity: Map<string, string> = new Map();

  constructor(nodes: SimulationNode[], connections: SimulationConnection[]) {
    this.nodes = nodes;
    this.connections = connections;
    this.initializeCommunities();
  }

  /**
   * Initialize each node as its own community
   */
  private initializeCommunities() {
    this.nodes.forEach((node, index) => {
      this.communities.set(node.id, index);
      this.nodeToCommunity.set(node.id, node.id);
    });
  }

  /**
   * Calculate modularity of the current community structure
   */
  private calculateModularity(): number {
    const totalEdges = this.connections.length;
    if (totalEdges === 0) return 0;

    let modularity = 0;
    const communityEdges = new Map<string, number>();
    const communityNodes = new Map<string, number>();

    // Count edges within each community
    this.connections.forEach(conn => {
      const sourceCommunity = this.nodeToCommunity.get(conn.from);
      const targetCommunity = this.nodeToCommunity.get(conn.to);
      
      if (sourceCommunity === targetCommunity) {
        communityEdges.set(sourceCommunity!, (communityEdges.get(sourceCommunity!) || 0) + 1);
      }
    });

    // Count nodes in each community
    this.nodes.forEach(node => {
      const community = this.nodeToCommunity.get(node.id);
      communityNodes.set(community!, (communityNodes.get(community!) || 0) + 1);
    });

    // Calculate modularity
    communityEdges.forEach((edges, community) => {
      const nodes = communityNodes.get(community) || 0;
      const expectedEdges = (nodes * (nodes - 1)) / 2;
      modularity += (edges / totalEdges) - Math.pow(expectedEdges / totalEdges, 2);
    });

    return modularity;
  }

  /**
   * Move a node to a different community and calculate modularity gain
   */
  private calculateModularityGain(nodeId: string, newCommunity: string): number {
    const currentCommunity = this.nodeToCommunity.get(nodeId);
    if (currentCommunity === newCommunity) return 0;

    // Calculate connections to current community
    const currentConnections = this.connections.filter(conn => 
      (conn.from === nodeId && this.nodeToCommunity.get(conn.to) === currentCommunity) ||
      (conn.to === nodeId && this.nodeToCommunity.get(conn.from) === currentCommunity)
    ).length;

    // Calculate connections to new community
    const newConnections = this.connections.filter(conn => 
      (conn.from === nodeId && this.nodeToCommunity.get(conn.to) === newCommunity) ||
      (conn.to === nodeId && this.nodeToCommunity.get(conn.from) === newCommunity)
    ).length;

    const totalConnections = this.connections.filter(conn => 
      conn.from === nodeId || conn.to === nodeId
    ).length;

    return (newConnections - currentConnections) / this.connections.length;
  }

  /**
   * Run the Louvain algorithm
   */
  public runLouvain(): Map<string, string> {
    let improved = true;
    let iterations = 0;
    const maxIterations = 100;

    while (improved && iterations < maxIterations) {
      improved = false;
      iterations++;

      // Try to move each node to a better community
      this.nodes.forEach(node => {
        const currentCommunity = this.nodeToCommunity.get(node.id);
        let bestCommunity = currentCommunity;
        let bestGain = 0;

        // Check all neighboring communities
        const neighboringCommunities = new Set<string>();
        this.connections.forEach(conn => {
          if (conn.from === node.id) {
            neighboringCommunities.add(this.nodeToCommunity.get(conn.to)!);
          } else if (conn.to === node.id) {
            neighboringCommunities.add(this.nodeToCommunity.get(conn.from)!);
          }
        });

        // Test moving to each neighboring community
        neighboringCommunities.forEach(community => {
          const gain = this.calculateModularityGain(node.id, community);
          if (gain > bestGain) {
            bestGain = gain;
            bestCommunity = community;
          }
        });

        // Move node if improvement found
        if (bestCommunity !== currentCommunity && bestGain > 0) {
          this.nodeToCommunity.set(node.id, bestCommunity!);
          improved = true;
        }
      });
    }

    return new Map(this.nodeToCommunity);
  }

  /**
   * Separate overlapping nodes to ensure proper spacing
   */
  private separateOverlappingNodes(nodes: SimulationNode[], minDistance: number): SimulationNode[] {
    const separatedNodes = [...nodes];
    const maxIterations = 200; // Increased iterations
    const nodeRadius = 60; // Increased node radius assumption
    const requiredDistance = Math.max(minDistance + (nodeRadius * 2), 200); // Minimum 200px between nodes

    console.log(`Starting separation with required distance: ${requiredDistance}px`);

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      let hasOverlaps = false;
      let totalOverlaps = 0;

      for (let i = 0; i < separatedNodes.length; i++) {
        for (let j = i + 1; j < separatedNodes.length; j++) {
          const node1 = separatedNodes[i];
          const node2 = separatedNodes[j];
          
          const dx = node2.x - node1.x;
          const dy = node2.y - node1.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < requiredDistance && distance > 0) {
            hasOverlaps = true;
            totalOverlaps++;
            
            // Calculate separation vector
            const separationX = (dx / distance) * requiredDistance;
            const separationY = (dy / distance) * requiredDistance;
            
            // Use much stronger separation force
            const force = Math.min(0.8, (requiredDistance - distance) / requiredDistance + 0.3);
            
            separatedNodes[i] = {
              ...node1,
              x: node1.x - separationX * force,
              y: node1.y - separationY * force
            };
            
            separatedNodes[j] = {
              ...node2,
              x: node2.x + separationX * force,
              y: node2.y + separationY * force
            };
          }
        }
      }

      if (!hasOverlaps) {
        console.log(`Separation completed after ${iteration} iterations`);
        break;
      }
      
      // Log progress for debugging
      if (iteration % 25 === 0) {
        console.log(`Separation iteration ${iteration}: ${totalOverlaps} overlaps remaining`);
      }
    }

    // Final check - if still overlapping, use more aggressive separation
    if (this.checkForOverlaps(separatedNodes, requiredDistance)) {
      console.log('Applying aggressive separation due to remaining overlaps');
      return this.aggressiveSeparation(separatedNodes, requiredDistance);
    }

    return separatedNodes;
  }

  /**
   * Check if any nodes are still overlapping
   */
  private checkForOverlaps(nodes: SimulationNode[], minDistance: number): boolean {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDistance) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Apply aggressive separation for stubborn overlaps
   */
  private aggressiveSeparation(nodes: SimulationNode[], minDistance: number): SimulationNode[] {
    const separatedNodes = [...nodes];
    const nodeRadius = 60;
    const requiredDistance = Math.max(minDistance, 200); // Minimum 200px

    console.log(`Applying aggressive separation with distance: ${requiredDistance}px`);

    // Sort nodes by position to ensure consistent separation
    separatedNodes.sort((a, b) => a.x - b.x);

    // Apply multiple passes of separation
    for (let pass = 0; pass < 5; pass++) {
      let moved = false;
      
      for (let i = 0; i < separatedNodes.length; i++) {
        for (let j = i + 1; j < separatedNodes.length; j++) {
          const node1 = separatedNodes[i];
          const node2 = separatedNodes[j];
          
          const dx = node2.x - node1.x;
          const dy = node2.y - node1.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < requiredDistance) {
            moved = true;
            
            // Force separation by moving nodes apart
            const separationX = (dx / distance) * requiredDistance;
            const separationY = (dy / distance) * requiredDistance;
            
            // Move both nodes apart
            separatedNodes[i] = {
              ...node1,
              x: node1.x - separationX * 0.5,
              y: node1.y - separationY * 0.5
            };
            
            separatedNodes[j] = {
              ...node2,
              x: node2.x + separationX * 0.5,
              y: node2.y + separationY * 0.5
            };
          }
        }
      }
      
      if (!moved) break;
    }

    // Final verification
    let finalOverlaps = 0;
    for (let i = 0; i < separatedNodes.length; i++) {
      for (let j = i + 1; j < separatedNodes.length; j++) {
        const dx = separatedNodes[j].x - separatedNodes[i].x;
        const dy = separatedNodes[j].y - separatedNodes[i].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < requiredDistance) {
          finalOverlaps++;
        }
      }
    }
    
    console.log(`Aggressive separation completed. Remaining overlaps: ${finalOverlaps}`);

    return separatedNodes;
  }

  /**
   * Apply Louvain-based layout to nodes
   */
  public applyLayout(options: {
    width: number;
    height: number;
    padding: number;
    communitySpacing: number;
    nodeSpacing: number;
  }): SimulationNode[] {
    const { width, height, padding, communitySpacing, nodeSpacing } = options;
    
    console.log('Louvain layout - input nodes:', this.nodes.length, 'connections:', this.connections.length);
    
    // Run Louvain algorithm to detect communities
    const communities = this.runLouvain();
    
    // Group nodes by community
    const communityGroups = new Map<string, SimulationNode[]>();
    communities.forEach((communityId, nodeId) => {
      const node = this.nodes.find(n => n.id === nodeId);
      if (node) {
        if (!communityGroups.has(communityId)) {
          communityGroups.set(communityId, []);
        }
        communityGroups.get(communityId)!.push(node);
      }
    });

    console.log('Communities detected:', communityGroups.size);

    // Use a connection-aware layout that respects both communities and links
    const positionedNodes = this.applyConnectionAwareLayout(communityGroups, width, height, padding, nodeSpacing, communitySpacing);

    console.log('Louvain layout completed - positioned nodes:', positionedNodes.map(n => ({ id: n.id, x: n.x.toFixed(1), y: n.y.toFixed(1) })));

    return positionedNodes;
  }

  /**
   * Apply a connection-aware layout that respects both communities and links
   */
  private applyConnectionAwareLayout(
    communityGroups: Map<string, SimulationNode[]>,
    width: number,
    height: number,
    padding: number,
    nodeSpacing: number,
    communitySpacing: number
  ): SimulationNode[] {
    const positionedNodes: SimulationNode[] = [];
    const minDistance = Math.max(nodeSpacing, 400); // Minimum 400px between nodes
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Step 1: Position communities in a circle
    const communityArray = Array.from(communityGroups.entries());
    const communityRadius = Math.min(width, height) * 0.4;
    
    console.log(`Positioning ${communityArray.length} communities with radius ${communityRadius.toFixed(1)}px`);
    
    // Step 2: Position nodes within each community using force-directed approach
    communityArray.forEach(([communityId, nodes], communityIndex) => {
      const angle = (2 * Math.PI * communityIndex) / Math.max(communityArray.length, 1);
      const communityX = centerX + communityRadius * Math.cos(angle);
      const communityY = centerY + communityRadius * Math.sin(angle);
      
      console.log(`Community ${communityId}: ${nodes.length} nodes at (${communityX.toFixed(1)}, ${communityY.toFixed(1)})`);
      
      // Position nodes within this community using force-directed layout
      const communityNodes = this.positionNodesInCommunity(nodes, communityX, communityY, minDistance);
      positionedNodes.push(...communityNodes);
    });
    
    // Step 3: Apply global force-directed optimization to respect inter-community connections
    const optimizedNodes = this.optimizeGlobalLayout(positionedNodes, minDistance, width, height, padding);
    
    return optimizedNodes;
  }

  /**
   * Position nodes within a community using force-directed layout
   */
  private positionNodesInCommunity(
    nodes: SimulationNode[],
    centerX: number,
    centerY: number,
    minDistance: number
  ): SimulationNode[] {
    if (nodes.length === 1) {
      return [{
        ...nodes[0],
        x: centerX,
        y: centerY
      }];
    }
    
    if (nodes.length === 2) {
      const halfSpacing = Math.max(minDistance * 0.6, 250);
      return [
        {
          ...nodes[0],
          x: centerX - halfSpacing,
          y: centerY
        },
        {
          ...nodes[1],
          x: centerX + halfSpacing,
          y: centerY
        }
      ];
    }
    
    // For multiple nodes, use a circular arrangement with proper spacing
    const nodeRadius = Math.max(minDistance * 0.8, 250);
    const angleStep = (2 * Math.PI) / nodes.length;
    
    return nodes.map((node, index) => {
      const angle = index * angleStep;
      return {
        ...node,
        x: centerX + nodeRadius * Math.cos(angle),
        y: centerY + nodeRadius * Math.sin(angle)
      };
    });
  }

  /**
   * Optimize global layout to respect inter-community connections
   */
  private optimizeGlobalLayout(
    nodes: SimulationNode[],
    minDistance: number,
    width: number,
    height: number,
    padding: number
  ): SimulationNode[] {
    const iterations = 50;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Create a map for quick node lookup
    const nodeMap = new Map(nodes.map(node => [node.id, node]));
    
    // Apply force-directed simulation to respect connections
    for (let iter = 0; iter < iterations; iter++) {
      const forces = new Map<string, { x: number; y: number }>();
      
      // Initialize forces
      nodes.forEach(node => {
        forces.set(node.id, { x: 0, y: 0 });
      });
      
      // Apply connection forces (attraction)
      this.connections.forEach(conn => {
        const fromNode = nodeMap.get(conn.from);
        const toNode = nodeMap.get(conn.to);
        
        if (fromNode && toNode) {
          const dx = toNode.x - fromNode.x;
          const dy = toNode.y - fromNode.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            const force = Math.min(distance * 0.1, 50); // Attraction force
            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;
            
            forces.get(conn.from)!.x += fx;
            forces.get(conn.from)!.y += fy;
            forces.get(conn.to)!.x -= fx;
            forces.get(conn.to)!.y -= fy;
          }
        }
      });
      
      // Apply repulsion forces to maintain spacing
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const node1 = nodes[i];
          const node2 = nodes[j];
          const dx = node2.x - node1.x;
          const dy = node2.y - node1.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < minDistance && distance > 0) {
            const force = (minDistance - distance) * 0.5; // Repulsion force
            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;
            
            forces.get(node1.id)!.x -= fx;
            forces.get(node1.id)!.y -= fy;
            forces.get(node2.id)!.x += fx;
            forces.get(node2.id)!.y += fy;
          }
        }
      }
      
      // Apply forces to nodes
      nodes.forEach(node => {
        const force = forces.get(node.id)!;
        const newX = Math.max(padding, Math.min(width - padding, node.x + force.x * 0.1));
        const newY = Math.max(padding, Math.min(height - padding, node.y + force.y * 0.1));
        
        node.x = newX;
        node.y = newY;
      });
    }
    
    return nodes;
  }
}

/**
 * Apply Louvain-based layout to a graph
 */
export const applyLouvainLayout = (
  nodes: SimulationNode[],
  connections: SimulationConnection[],
  options: {
    width: number;
    height: number;
    padding: number;
    communitySpacing?: number;
    nodeSpacing?: number;
  }
): SimulationNode[] => {
  const layout = new LouvainLayout(nodes, connections);
  
  // Calculate better default spacing based on canvas size
  const canvasSize = Math.min(options.width, options.height);
  const defaultCommunitySpacing = Math.max(500, canvasSize * 0.4); // Much larger community spacing
  const defaultNodeSpacing = Math.max(250, canvasSize * 0.2); // Much larger node spacing
  
  console.log('Louvain layout options:', {
    width: options.width,
    height: options.height,
    communitySpacing: options.communitySpacing || defaultCommunitySpacing,
    nodeSpacing: options.nodeSpacing || defaultNodeSpacing
  });
  
  return layout.applyLayout({
    ...options,
    communitySpacing: options.communitySpacing || defaultCommunitySpacing,
    nodeSpacing: options.nodeSpacing || defaultNodeSpacing
  });
};
