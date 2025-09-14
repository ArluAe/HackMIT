import { GraphExportData } from '@/types/simulation';

// City model data - these will be loaded from the JSON files
let compactCityData: GraphExportData | null = null;
let largeCityData: GraphExportData | null = null;

// Load city models from JSON files
export const loadCityModels = async () => {
  try {
    // Load compact city (50 nodes)
    const compactResponse = await fetch('/compact_city_50_nodes.json');
    if (compactResponse.ok) {
      compactCityData = await compactResponse.json();
    }

    // Load large city (500 nodes)
    const largeResponse = await fetch('/large_city_500_nodes.json');
    if (largeResponse.ok) {
      largeCityData = await largeResponse.json();
    }
  } catch (error) {
    console.error('Failed to load city models:', error);
  }
};

// Get city models
export const getCityModels = () => {
  return {
    compactCity: compactCityData,
    largeCity: largeCityData
  };
};

// City model metadata for display
export const cityModelMetadata = [
  {
    id: 'compact-city',
    name: 'Compact City (50 nodes)',
    description: 'Well-spaced 50-node city with 6 districts',
    nodes: 48,
    connections: 19,
    families: 6,
    dimensions: '8000x6000',
    zoom: '0.05',
    image: '🏙️',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'large-city',
    name: 'Large City (500 nodes)',
    description: 'Massive 500-node city with 11 districts',
    nodes: 343,
    connections: 108,
    families: 11,
    dimensions: '16000x12000',
    zoom: '0.025',
    image: '🌆',
    color: 'from-purple-500 to-pink-500'
  }
];
