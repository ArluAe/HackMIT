# Frontend Integration Guide

## Stochastic Power Grid Simulation API

The backend now provides comprehensive API endpoints to integrate stochastic power grid simulations with any frontend framework.

## API Endpoints

### Configuration Management

#### `GET /stochastic/configs`
Get available simulation configurations.

**Response:**
```json
{
  "small": {
    "name": "Small Renewable Grid",
    "description": "7 nodes: 3 generators, 2 loads, 2 batteries",
    "nodes": 7,
    "renewable_capacity": "90 MW",
    "storage_capacity": "70 MW"
  },
  "large": {
    "name": "Large Mixed Grid",
    "description": "13 nodes: 6 generators, 4 loads, 3 batteries",
    "nodes": 13,
    "renewable_capacity": "190 MW",
    "storage_capacity": "125 MW"
  }
}
```

### Simulation Management

#### `POST /stochastic/simulate`
Start a new stochastic simulation.

**Request Body:**
```json
{
  "config": "small" | "large",
  "runs": 3,           // 1-10 runs
  "timesteps": 100,    // 10-1000 timesteps
  "dt": 0.1,          // Time step size
  "seed": 42          // Optional random seed
}
```

**Response:**
```json
{
  "simulation_id": "uuid-string",
  "message": "Stochastic simulation started",
  "config": "small",
  "parameters": {
    "runs": 3,
    "timesteps": 100,
    "dt": 0.1,
    "seed": 42
  }
}
```

#### `GET /stochastic/status/<sim_id>`
Get simulation progress and status.

**Response:**
```json
{
  "id": "uuid-string",
  "status": "running" | "completed" | "error",
  "progress": 65.5,
  "current_run": 2,
  "elapsed_time": 12.34,
  "estimated_remaining": 6.78
}
```

#### `GET /stochastic/results/<sim_id>`
Get simulation results and analysis.

**Query Parameters:**
- `include_raw=true` - Include timestep-by-timestep data

**Response:**
```json
{
  "simulation_info": {
    "id": "uuid-string",
    "config": "small",
    "parameters": {...},
    "execution_time": 18.45
  },
  "analysis": {
    "frequency_stability": {
      "mean_std": 0.0639,
      "range": [0.05, 0.08]
    },
    "power_balance": {
      "mean_imbalance_std": 22.48
    },
    "generation_mix": {
      "solar_mean": 14.98,
      "wind_mean": 24.95,
      "total_renewable": 39.93
    },
    "battery_performance": {
      "mean_utilization": 5.72,
      "regulation_effectiveness": 97.8
    }
  }
}
```

#### `GET /stochastic/simulations`
List all simulations.

**Response:**
```json
{
  "simulations": [
    {
      "id": "uuid-string",
      "config": "small",
      "status": "completed",
      "progress": 100,
      "duration": 18.45
    }
  ],
  "total": 1
}
```

#### `DELETE /stochastic/<sim_id>`
Delete a simulation and its results.

## Frontend Integration Examples

### React/Next.js Example

```javascript
// Start a simulation
const startSimulation = async (config = 'small', runs = 3) => {
  const response = await fetch('/api/stochastic/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config, runs, timesteps: 100 })
  });

  const result = await response.json();
  return result.simulation_id;
};

// Monitor simulation progress
const monitorSimulation = async (simId, onUpdate) => {
  const poll = async () => {
    const response = await fetch(`/api/stochastic/status/${simId}`);
    const status = await response.json();

    onUpdate(status);

    if (status.status === 'running') {
      setTimeout(poll, 2000); // Poll every 2 seconds
    }
  };

  poll();
};

// Get results
const getResults = async (simId) => {
  const response = await fetch(`/api/stochastic/results/${simId}`);
  return await response.json();
};
```

### Vue.js Example

```vue
<template>
  <div>
    <select v-model="selectedConfig">
      <option value="small">Small Grid</option>
      <option value="large">Large Grid</option>
    </select>

    <button @click="startSimulation" :disabled="isRunning">
      {{ isRunning ? `Running... ${progress}%` : 'Start Simulation' }}
    </button>

    <div v-if="results">
      <h3>Results</h3>
      <p>Frequency Stability: {{ results.analysis.frequency_stability.mean_std }}Hz</p>
      <p>Battery Effectiveness: {{ results.analysis.battery_performance.regulation_effectiveness }}%</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      selectedConfig: 'small',
      isRunning: false,
      progress: 0,
      results: null,
      currentSimId: null
    };
  },

  methods: {
    async startSimulation() {
      this.isRunning = true;
      this.progress = 0;

      const response = await fetch('/stochastic/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: this.selectedConfig,
          runs: 3,
          timesteps: 100
        })
      });

      const result = await response.json();
      this.currentSimId = result.simulation_id;

      this.monitorProgress();
    },

    async monitorProgress() {
      const poll = async () => {
        const response = await fetch(`/stochastic/status/${this.currentSimId}`);
        const status = await response.json();

        this.progress = status.progress;

        if (status.status === 'completed') {
          this.isRunning = false;
          await this.loadResults();
        } else if (status.status === 'error') {
          this.isRunning = false;
          console.error('Simulation error:', status.error);
        } else {
          setTimeout(poll, 2000);
        }
      };

      poll();
    },

    async loadResults() {
      const response = await fetch(`/stochastic/results/${this.currentSimId}`);
      this.results = await response.json();
    }
  }
};
</script>
```

## Key Features for Frontend

### Real-time Progress Tracking
- Poll `/stochastic/status/<sim_id>` every 2 seconds
- Show progress bar with percentage completion
- Display estimated time remaining

### Configuration Selection
- Fetch available configs from `/stochastic/configs`
- Let users choose between small/large grids
- Customize simulation parameters (runs, timesteps, seed)

### Results Visualization
- Display key metrics from analysis
- Create charts for frequency stability, power balance
- Show battery performance and renewable generation stats

### Simulation Management
- List all simulations with `/stochastic/simulations`
- Allow users to delete old simulations
- Show simulation history with timestamps

## CORS and Development

The backend includes CORS support for frontend development:

```python
from flask_cors import CORS
app = Flask(__name__)
CORS(app)  # Enables all origins in development
```

For production, configure CORS for specific domains:

```python
CORS(app, origins=['https://your-frontend-domain.com'])
```

## Testing the Integration

1. **Start the backend server:**
   ```bash
   python server.py
   ```

2. **Test the built-in interface:**
   Visit `http://localhost:5000/` for the HTML test interface

3. **Use curl for API testing:**
   ```bash
   # Start a simulation
   curl -X POST http://localhost:5000/stochastic/simulate \
     -H "Content-Type: application/json" \
     -d '{"config": "small", "runs": 2, "timesteps": 50}'

   # Check status
   curl http://localhost:5000/stochastic/status/your-sim-id

   # Get results
   curl http://localhost:5000/stochastic/results/your-sim-id
   ```

## Error Handling

The API provides consistent error responses:

```json
{
  "error": "Descriptive error message",
  "details": "Additional context if available"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Resource created (simulation started)
- `400` - Bad request (invalid parameters)
- `404` - Resource not found
- `500` - Server error