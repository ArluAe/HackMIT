#!/usr/bin/env python3
"""
Comprehensive Stochastic Power Grid Simulation

This single file runs complete power grid simulations with configurable:
- Network topology and agent types
- Simulation parameters (timesteps, scenarios)
- Stochastic processes (renewable generation, demand patterns, battery regulation)
- Analysis and visualization of results

Usage:
    python stochastic_grid_simulation.py
"""

import numpy as np
import json
import argparse
from typing import Dict, List, Tuple, Optional
from environment.PowerGrid import PowerGrid


class GridConfiguration:
    """Predefined grid configurations for different test scenarios."""

    @staticmethod
    def small_renewable_grid() -> Dict:
        """Small grid with renewable sources and battery storage."""
        return {
            "simulation": {
                "nodes": [
                    {
                        "id": "solar_1",
                        "position": {"x": 0, "y": 0},
                        "settings": {
                            "type": "solar-generator",
                            "power": 50.0,
                            "inertia": 1.0,
                            "friction": 0.1
                        }
                    },
                    {
                        "id": "wind_1",
                        "position": {"x": 100, "y": 0},
                        "settings": {
                            "type": "wind-generator",
                            "power": 40.0,
                            "inertia": 1.2,
                            "friction": 0.1
                        }
                    },
                    {
                        "id": "thermal_1",
                        "position": {"x": 200, "y": 0},
                        "settings": {
                            "type": "natural-gas-generator",
                            "power": 80.0,
                            "inertia": 2.0,
                            "friction": 0.05
                        }
                    },
                    {
                        "id": "consumer_1",
                        "position": {"x": 0, "y": 100},
                        "settings": {
                            "type": "consumer",
                            "power": 45.0,
                            "inertia": 0.5,
                            "friction": 0.2
                        }
                    },
                    {
                        "id": "business_1",
                        "position": {"x": 100, "y": 100},
                        "settings": {
                            "type": "business",
                            "power": 55.0,
                            "inertia": 0.8,
                            "friction": 0.15
                        }
                    },
                    {
                        "id": "battery_1",
                        "position": {"x": 200, "y": 100},
                        "settings": {
                            "type": "storage",
                            "power": 40.0,
                            "charge_rate": 30.0,
                            "soc": 0.5,
                            "inertia": 0.3,
                            "friction": 0.1
                        }
                    },
                    {
                        "id": "battery_2",
                        "position": {"x": 300, "y": 100},
                        "settings": {
                            "type": "storage",
                            "power": 30.0,
                            "charge_rate": 25.0,
                            "soc": 0.5,
                            "inertia": 0.3,
                            "friction": 0.1
                        }
                    }
                ],
                "connections": [
                    {"id": "c1", "from": "solar_1", "to": "consumer_1", "power": 50.0, "transmission_factor": 1.0},
                    {"id": "c2", "from": "wind_1", "to": "business_1", "power": 40.0, "transmission_factor": 1.0},
                    {"id": "c3", "from": "thermal_1", "to": "battery_1", "power": 80.0, "transmission_factor": 1.0},
                    {"id": "c4", "from": "battery_1", "to": "consumer_1", "power": 40.0, "transmission_factor": 1.0},
                    {"id": "c5", "from": "battery_2", "to": "business_1", "power": 30.0, "transmission_factor": 1.0}
                ]
            }
        }

    @staticmethod
    def large_mixed_grid() -> Dict:
        """Larger grid with diverse generation and loads."""
        return {
            "simulation": {
                "nodes": [
                    # Renewable Generation
                    {"id": "solar_1", "position": {"x": 0, "y": 0},
                     "settings": {"type": "solar-generator", "power": 60.0, "inertia": 1.0, "friction": 0.1}},
                    {"id": "solar_2", "position": {"x": 50, "y": 0},
                     "settings": {"type": "solar-generator", "power": 45.0, "inertia": 1.0, "friction": 0.1}},
                    {"id": "wind_1", "position": {"x": 100, "y": 0},
                     "settings": {"type": "wind-generator", "power": 50.0, "inertia": 1.2, "friction": 0.1}},
                    {"id": "wind_2", "position": {"x": 150, "y": 0},
                     "settings": {"type": "wind-generator", "power": 35.0, "inertia": 1.2, "friction": 0.1}},

                    # Conventional Generation
                    {"id": "thermal_1", "position": {"x": 200, "y": 0},
                     "settings": {"type": "natural-gas-generator", "power": 100.0, "inertia": 2.5, "friction": 0.05}},
                    {"id": "thermal_2", "position": {"x": 250, "y": 0},
                     "settings": {"type": "natural-gas-generator", "power": 80.0, "inertia": 2.0, "friction": 0.05}},

                    # Loads
                    {"id": "consumer_1", "position": {"x": 0, "y": 100},
                     "settings": {"type": "consumer", "power": 40.0, "inertia": 0.5, "friction": 0.2}},
                    {"id": "consumer_2", "position": {"x": 100, "y": 100},
                     "settings": {"type": "consumer", "power": 35.0, "inertia": 0.5, "friction": 0.2}},
                    {"id": "business_1", "position": {"x": 200, "y": 100},
                     "settings": {"type": "business", "power": 70.0, "inertia": 0.8, "friction": 0.15}},
                    {"id": "business_2", "position": {"x": 300, "y": 100},
                     "settings": {"type": "business", "power": 50.0, "inertia": 0.8, "friction": 0.15}},

                    # Energy Storage
                    {"id": "battery_1", "position": {"x": 50, "y": 200},
                     "settings": {"type": "storage", "power": 50.0, "charge_rate": 40.0, "soc": 0.5, "inertia": 0.3, "friction": 0.1}},
                    {"id": "battery_2", "position": {"x": 150, "y": 200},
                     "settings": {"type": "storage", "power": 40.0, "charge_rate": 30.0, "soc": 0.5, "inertia": 0.3, "friction": 0.1}},
                    {"id": "battery_3", "position": {"x": 250, "y": 200},
                     "settings": {"type": "storage", "power": 35.0, "charge_rate": 25.0, "soc": 0.5, "inertia": 0.3, "friction": 0.1}}
                ],
                "connections": [
                    # Generation to load connections
                    {"id": "c1", "from": "solar_1", "to": "consumer_1", "power": 60.0, "transmission_factor": 1.0},
                    {"id": "c2", "from": "solar_2", "to": "consumer_2", "power": 45.0, "transmission_factor": 1.0},
                    {"id": "c3", "from": "wind_1", "to": "business_1", "power": 50.0, "transmission_factor": 1.0},
                    {"id": "c4", "from": "wind_2", "to": "business_2", "power": 35.0, "transmission_factor": 1.0},
                    {"id": "c5", "from": "thermal_1", "to": "battery_1", "power": 100.0, "transmission_factor": 1.0},
                    {"id": "c6", "from": "thermal_2", "to": "battery_2", "power": 80.0, "transmission_factor": 1.0},

                    # Battery connections
                    {"id": "c7", "from": "battery_1", "to": "consumer_1", "power": 50.0, "transmission_factor": 1.0},
                    {"id": "c8", "from": "battery_2", "to": "business_1", "power": 40.0, "transmission_factor": 1.0},
                    {"id": "c9", "from": "battery_3", "to": "business_2", "power": 35.0, "transmission_factor": 1.0}
                ]
            }
        }


class SimulationResult:
    """Container for simulation results and analysis."""

    def __init__(self):
        self.time = []
        self.frequency = []
        self.power_imbalance = []
        self.total_supply = []
        self.total_demand = []

        # Generation by type
        self.solar_generation = []
        self.wind_generation = []
        self.thermal_generation = []

        # Demand by type
        self.consumer_demand = []
        self.business_demand = []

        # Battery metrics
        self.battery_power = []
        self.battery_soc = []

    def add_timestep(self, t: float, grid: PowerGrid):
        """Add data from one timestep."""
        self.time.append(t)
        self.frequency.append(grid.grid_frequency)

        # Calculate totals
        total_supply = 0
        total_demand = 0
        solar_gen = 0
        wind_gen = 0
        thermal_gen = 0
        consumer_dem = 0
        business_dem = 0
        battery_pow = 0
        battery_soc_avg = 0
        battery_count = 0

        for node in grid.nodes.values():
            agent = node.agent

            if hasattr(agent, 'supply'):
                total_supply += agent.supply
                if agent.kind == 'solar':
                    solar_gen += agent.supply
                elif agent.kind == 'wind':
                    wind_gen += agent.supply
                elif agent.kind == 'thermal':
                    thermal_gen += agent.supply

            elif hasattr(agent, 'demand'):
                if 'consumer' in node.node_id:
                    consumer_dem += agent.demand
                elif 'business' in node.node_id:
                    business_dem += agent.demand
                total_demand += agent.demand

            elif hasattr(agent, 'soc'):  # Battery
                battery_pow += node.power
                battery_soc_avg += agent.soc
                battery_count += 1

        self.total_supply.append(total_supply)
        self.total_demand.append(total_demand)
        self.power_imbalance.append(total_supply - total_demand)

        self.solar_generation.append(solar_gen)
        self.wind_generation.append(wind_gen)
        self.thermal_generation.append(thermal_gen)

        self.consumer_demand.append(consumer_dem)
        self.business_demand.append(business_dem)

        self.battery_power.append(battery_pow)
        self.battery_soc.append(battery_soc_avg / max(1, battery_count))


class SimulationAnalyzer:
    """Analysis and reporting for simulation results."""

    @staticmethod
    def analyze_results(results: List[SimulationResult], config_name: str) -> Dict:
        """Analyze multiple simulation runs."""
        print(f"\n📊 Analysis Results for {config_name}")
        print("=" * 60)

        # Aggregate statistics across all runs
        all_freq_std = [np.std(r.frequency) for r in results]
        all_imbalance_std = [np.std(r.power_imbalance) for r in results]
        all_solar_mean = [np.mean(r.solar_generation) for r in results]
        all_wind_mean = [np.mean(r.wind_generation) for r in results]
        all_battery_utilization = [np.mean(np.abs(r.battery_power)) for r in results]

        analysis = {
            'config_name': config_name,
            'num_runs': len(results),
            'frequency_stability': {
                'mean_std': np.mean(all_freq_std),
                'range': [np.min(all_freq_std), np.max(all_freq_std)]
            },
            'power_balance': {
                'mean_imbalance_std': np.mean(all_imbalance_std),
                'range': [np.min(all_imbalance_std), np.max(all_imbalance_std)]
            },
            'generation_mix': {
                'solar_mean': np.mean(all_solar_mean),
                'wind_mean': np.mean(all_wind_mean),
                'total_renewable': np.mean(all_solar_mean) + np.mean(all_wind_mean)
            },
            'battery_performance': {
                'mean_utilization': np.mean(all_battery_utilization),
                'regulation_effectiveness': 100 - (np.mean(all_imbalance_std) / 10.0)  # Simplified metric
            }
        }

        # Print summary
        print(f"Simulation Runs: {analysis['num_runs']}")
        print(f"")
        print(f"Grid Stability:")
        print(f"  Frequency StdDev: {analysis['frequency_stability']['mean_std']:.4f} Hz (avg)")
        print(f"  Power Imbalance StdDev: {analysis['power_balance']['mean_imbalance_std']:.2f} MW (avg)")
        print(f"")
        print(f"Generation Mix:")
        print(f"  Solar Average: {analysis['generation_mix']['solar_mean']:.1f} MW")
        print(f"  Wind Average: {analysis['generation_mix']['wind_mean']:.1f} MW")
        print(f"  Total Renewable: {analysis['generation_mix']['total_renewable']:.1f} MW")
        print(f"")
        print(f"Battery Performance:")
        print(f"  Average Utilization: {analysis['battery_performance']['mean_utilization']:.1f} MW")
        print(f"  Regulation Score: {analysis['battery_performance']['regulation_effectiveness']:.1f}%")

        return analysis


def run_simulation(config: Dict, timesteps: int = 200, dt: float = 0.1,
                  seed: Optional[int] = None, verbose: bool = False) -> SimulationResult:
    """Run a single simulation with given configuration."""

    if seed is not None:
        np.random.seed(seed)

    # Create grid
    grid = PowerGrid(config, dt=dt, target_hz=60.0)

    # Initialize results
    results = SimulationResult()

    if verbose:
        print(f"Running simulation: {timesteps} timesteps, dt={dt}")

    # Run simulation
    for step in range(timesteps):
        # Time and temperature (simplified daily cycle)
        time = step * dt
        time_of_day = (time % 24) / 24  # Normalized [0,1]
        temperature = 20 + 10 * np.sin(2 * np.pi * time_of_day - np.pi/2)

        # Run timestep
        grid.time_step(temperature, time_of_day)

        # Record results
        results.add_timestep(time, grid)

        # Progress update
        if verbose and step % (timesteps // 10) == 0:
            print(f"  Step {step}: Freq={grid.grid_frequency:.3f}Hz, "
                  f"Imbalance={results.power_imbalance[-1]:.1f}MW")

    if verbose:
        print(f"Simulation completed!")

    return results


def main():
    """Main simulation runner."""
    parser = argparse.ArgumentParser(description="Stochastic Power Grid Simulation")
    parser.add_argument("--config", choices=["small", "large"], default="small",
                       help="Grid configuration to use")
    parser.add_argument("--runs", type=int, default=5,
                       help="Number of simulation runs")
    parser.add_argument("--timesteps", type=int, default=200,
                       help="Timesteps per simulation")
    parser.add_argument("--dt", type=float, default=0.1,
                       help="Time step size")
    parser.add_argument("--seed", type=int, default=None,
                       help="Random seed for reproducibility")
    parser.add_argument("--verbose", action="store_true",
                       help="Verbose output")

    args = parser.parse_args()

    print("🔋 Stochastic Power Grid Simulation Suite")
    print("=" * 50)

    # Select configuration
    if args.config == "small":
        config = GridConfiguration.small_renewable_grid()
        config_name = "Small Renewable Grid"
    else:
        config = GridConfiguration.large_mixed_grid()
        config_name = "Large Mixed Grid"

    print(f"Configuration: {config_name}")
    print(f"Simulation Parameters:")
    print(f"  Runs: {args.runs}")
    print(f"  Timesteps: {args.timesteps}")
    print(f"  Time step: {args.dt}")
    print(f"  Seed: {args.seed}")

    # Run multiple simulations
    all_results = []

    for run in range(args.runs):
        print(f"\n🔄 Run {run + 1}/{args.runs}")

        # Use different seed for each run if base seed provided
        run_seed = (args.seed + run) if args.seed is not None else None

        result = run_simulation(
            config=config,
            timesteps=args.timesteps,
            dt=args.dt,
            seed=run_seed,
            verbose=args.verbose
        )

        all_results.append(result)

        # Quick summary
        freq_std = np.std(result.frequency)
        imbalance_std = np.std(result.power_imbalance)
        battery_util = np.mean(np.abs(result.battery_power))

        print(f"  Frequency StdDev: {freq_std:.4f} Hz")
        print(f"  Power Imbalance StdDev: {imbalance_std:.2f} MW")
        print(f"  Battery Utilization: {battery_util:.1f} MW")

    # Analyze all results
    analysis = SimulationAnalyzer.analyze_results(all_results, config_name)

    # Export summary to JSON
    output_file = f"simulation_results_{args.config}_{args.runs}runs.json"
    with open(output_file, 'w') as f:
        json.dump(analysis, f, indent=2)

    print(f"\n📁 Results exported to: {output_file}")
    print(f"✅ Simulation suite completed successfully!")

    return all_results


if __name__ == "__main__":
    main()