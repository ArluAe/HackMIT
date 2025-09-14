# Stochastic Power Grid Simulation

A comprehensive power grid simulation with dynamic battery regulation and stochastic renewable generation.

## Quick Start

Run a complete stochastic simulation with default parameters:

```bash
python stochastic_grid_simulation.py
```

## Configuration Options

### Grid Configurations

- `--config small`: Small renewable grid (7 nodes: 3 generators, 2 loads, 2 batteries)
- `--config large`: Large mixed grid (13 nodes: 6 generators, 4 loads, 3 batteries)

### Simulation Parameters

- `--runs N`: Number of simulation runs (default: 5)
- `--timesteps N`: Timesteps per simulation (default: 200)
- `--dt FLOAT`: Time step size in minutes (default: 0.1)
- `--seed N`: Random seed for reproducibility
- `--verbose`: Show detailed progress

## Example Usage

```bash
# Small grid, 3 runs, 100 timesteps each, with verbose output
python stochastic_grid_simulation.py --config small --runs 3 --timesteps 100 --verbose

# Large grid, reproducible results
python stochastic_grid_simulation.py --config large --runs 5 --seed 42

# Quick test with minimal timesteps
python stochastic_grid_simulation.py --config small --runs 2 --timesteps 50
```

## Output

The simulation generates:

1. **Console output**: Real-time progress and analysis summary
2. **JSON export**: Detailed results in `simulation_results_[config]_[runs]runs.json`

### Metrics Tracked

- **Grid Stability**: Frequency standard deviation and power imbalance
- **Generation Mix**: Solar, wind, and total renewable generation
- **Battery Performance**: Utilization and regulation effectiveness

## Stochastic Features

### Agent Types

- **Solar Generator**: Daytime Gaussian generation with random variations
- **Wind Generator**: Weibull-distributed power output
- **Thermal Generator**: Reliable output with random outage probability
- **Consumer**: Ornstein-Uhlenbeck demand process (mean-reverting)
- **Business**: OU background + compound Poisson demand jumps
- **Battery**: Dynamic grid regulation with efficiency noise

### Battery Regulation

Batteries actively balance supply and demand by:
- Charging when excess supply exists
- Discharging when demand exceeds supply
- Responding proportionally to power imbalances
- Providing frequency regulation services

## Results Interpretation

- **Frequency StdDev < 0.1 Hz**: Excellent grid stability
- **Power Imbalance StdDev < 20 MW**: Good regulation performance
- **Regulation Score > 95%**: Effective battery coordination
- **Renewable Penetration**: MW of solar + wind generation

## File Structure

```
backend/
├── stochastic_grid_simulation.py  # Main simulation script
├── agents/                        # Agent implementations
│   ├── BaseAgent.py               # Base class with stochastic utilities
│   ├── ConsumerAgent.py           # OU demand process
│   ├── BusinessAgent.py           # OU + Poisson jumps
│   ├── ProducerAgent.py           # Type-dependent generation
│   └── BatteryAgent.py            # Dynamic grid regulation
├── environment/                   # Grid infrastructure
│   ├── PowerGrid.py               # Main simulation engine
│   ├── Node.py                    # Grid nodes
│   └── Branch.py                  # Transmission lines
└── simulation_results_*.json      # Output files
```

## Dependencies

- `numpy`: Stochastic process generation
- `argparse`: Command-line interface
- `json`: Results export

No external dependencies required - uses only Python standard library plus NumPy.