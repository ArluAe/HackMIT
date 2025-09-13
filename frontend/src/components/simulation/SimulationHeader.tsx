'use client';

import { useRouter } from 'next/navigation';

interface SimulationHeaderProps {
  isSimulationRunning: boolean;
  onToggleSimulation: () => void;
}

export default function SimulationHeader({
  isSimulationRunning,
  onToggleSimulation
}: SimulationHeaderProps) {
  const router = useRouter();

  return (
    <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="w-6 h-6 bg-gray-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <h1 className="text-lg font-bold text-white">GridForge</h1>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onToggleSimulation}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                isSimulationRunning 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'metallic-button text-white'
              }`}
            >
              {isSimulationRunning ? 'Stop' : 'Start'}
            </button>
            <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-medium">U</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
