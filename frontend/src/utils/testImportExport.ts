// Test utility for import/export functionality
import { GraphExportData } from '@/types/simulation';

export const createTestExportData = (): GraphExportData => {
  return {
    version: '1.0',
    metadata: {
      name: 'Test Simulation',
      description: 'Test export for GridForge',
      createdAt: new Date().toISOString(),
      author: 'Test User'
    },
    simulation: {
      nodes: [
        {
          id: '1',
          type: 'generator',
          x: 100,
          y: 100,
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
          x: 300,
          y: 100,
          name: 'Factory 1',
          power: 300,
          status: 'active',
          layer: 0,
          childNodes: [],
          isGroup: false
        }
      ],
      connections: [
        {
          id: '1',
          from: '1',
          to: '2',
          power: 100,
          status: 'active'
        }
      ],
      families: [],
      layers: [
        { layer: 0, name: 'Individual Nodes', description: 'Base layer', nodeCount: 2 }
      ]
    },
    viewport: {
      x: -50,
      y: -25,
      zoom: 0.8
    },
    settings: {
      simulationRunning: false,
      currentLayer: 0
    }
  };
};

export const downloadTestFile = () => {
  const testData = createTestExportData();
  const blob = new Blob([JSON.stringify(testData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'test-gridforge-export.json';
  a.click();
  URL.revokeObjectURL(url);
};
