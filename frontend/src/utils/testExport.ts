// Test utility for export functionality
export const createTestSimulation = () => {
  const testNodes = [
    {
      id: '1',
      type: 'generator' as const,
      x: 100,
      y: 100,
      name: 'Solar Panel 1',
      power: 500,
      status: 'active' as const,
      layer: 0,
      childNodes: [],
      isGroup: false
    },
    {
      id: '2',
      type: 'consumer' as const,
      x: 300,
      y: 100,
      name: 'Factory 1',
      power: 300,
      status: 'active' as const,
      layer: 0,
      childNodes: [],
      isGroup: false
    },
    {
      id: '3',
      type: 'storage' as const,
      x: 200,
      y: 200,
      name: 'Battery 1',
      power: 200,
      status: 'active' as const,
      layer: 0,
      childNodes: [],
      isGroup: false
    }
  ];

  const testConnections = [
    {
      id: '1',
      from: '1',
      to: '2',
      power: 100,
      status: 'active' as const
    },
    {
      id: '2',
      from: '1',
      to: '3',
      power: 50,
      status: 'active' as const
    }
  ];

  return { nodes: testNodes, connections: testConnections };
};
