#!/usr/bin/env python3

"""
Time keeping benchmark for parallelization in PowerGrid simulation
Measures performance of serial vs parallel execution
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import time
import multiprocessing as mp
import numpy as np
import json
from environment.PowerGrid import PowerGrid
from cases.case14 import case14

class TimingBenchmark:
    """Benchmark class for measuring PowerGrid performance"""
    
    def __init__(self):
        self.results = {}
        
    def benchmark_serial_vs_parallel(self, num_runs=5, num_nodes_range=[5, 10, 20, 50]):
        """Compare serial vs parallel execution across different node counts"""
        print("🚀 PowerGrid Parallelization Benchmark")
        print("=" * 60)
        
        for num_nodes in num_nodes_range:
            print(f"\n📊 Testing with {num_nodes} nodes:")
            print("-" * 40)
            
            # Create test case with specified number of nodes
            test_case = self._create_test_case(num_nodes)
            
            serial_times = []
            parallel_times = []
            
            for run in range(num_runs):
                print(f"  Run {run + 1}/{num_runs}...", end=" ")
                
                # Test serial execution
                serial_time = self._benchmark_serial_execution(test_case)
                serial_times.append(serial_time)
                
                # Test parallel execution
                parallel_time = self._benchmark_parallel_execution(test_case)
                parallel_times.append(parallel_time)
                
                speedup = serial_time / parallel_time if parallel_time > 0 else 0
                print(f"Serial: {serial_time:.3f}s, Parallel: {parallel_time:.3f}s, Speedup: {speedup:.2f}x")
            
            # Calculate statistics
            avg_serial = np.mean(serial_times)
            avg_parallel = np.mean(parallel_times)
            avg_speedup = avg_serial / avg_parallel if avg_parallel > 0 else 0
            
            std_serial = np.std(serial_times)
            std_parallel = np.std(parallel_times)
            
            self.results[num_nodes] = {
                'serial_avg': avg_serial,
                'parallel_avg': avg_parallel,
                'speedup': avg_speedup,
                'serial_std': std_serial,
                'parallel_std': std_parallel,
                'serial_times': serial_times,
                'parallel_times': parallel_times
            }
            
            print(f"  📈 Average Speedup: {avg_speedup:.2f}x")
            print(f"  📊 Serial: {avg_serial:.3f}±{std_serial:.3f}s")
            print(f"  📊 Parallel: {avg_parallel:.3f}±{std_parallel:.3f}s")
    
    def _create_test_case(self, num_nodes):
        """Create a test case with specified number of nodes"""
        # Use case14 as base and modify node count
        base_case = case14()
        
        # Create nodes
        nodes = []
        for i in range(num_nodes):
            node_type = "consumer" if i % 3 == 0 else "producer" if i % 3 == 1 else "business"
            node = {
                "id": f"node_{i}",
                "type": node_type,
                "x": np.random.randint(0, 1000),
                "y": np.random.randint(0, 1000),
                "name": f"Test {node_type.title()} {i}",
                "status": "active",
                "settings": {
                    "power": np.random.randint(50, 200),
                    "type": node_type,
                    "inertia": np.random.uniform(0.5, 2.0),
                    "friction": np.random.uniform(0.1, 0.5)
                }
            }
            nodes.append(node)
        
        # Create connections (simplified - just connect adjacent nodes)
        connections = []
        for i in range(num_nodes - 1):
            connection = {
                "id": f"conn_{i}",
                "from": f"node_{i}",
                "to": f"node_{i+1}",
                "power": np.random.randint(100, 300),
                "status": "active",
                "resistance": np.random.uniform(0.1, 0.8),
                "maxPower": np.random.randint(200, 400)
            }
            connections.append(connection)
        
        test_case = {
            "simulation": {
                "nodes": nodes,
                "connections": connections
            }
        }
        
        return test_case
    
    def _benchmark_serial_execution(self, test_case):
        """Benchmark serial execution (original implementation)"""
        grid = PowerGrid(test_case, dt=1.0)
        
        start_time = time.time()
        
        # Simulate multiple time steps
        for _ in range(10):  # 10 time steps
            # Serial execution of time_step
            state = {
                "pertubation": grid.pertubation,
                "avg_cost": 0,
                "time_of_day": 0.5,
                "temperature": 20.0
            }
            state = np.array(list(state.values()), dtype=np.float32)
            
            for node in grid.nodes.values():
                node.time_step(state)
            
            # Calculate pertubation
            grid.pertubation = 0
            for node in grid.nodes.values():
                grid.pertubation += (node.inertia * node.get_transmission())
        
        # Serial update (original implementation)
        for node in grid.nodes.values():
            node.update()
        
        end_time = time.time()
        return end_time - start_time
    
    def _benchmark_parallel_execution(self, test_case):
        """Benchmark parallel execution (multiprocessing implementation)"""
        grid = PowerGrid(test_case, dt=1.0)
        
        start_time = time.time()
        
        # Simulate multiple time steps
        for _ in range(10):  # 10 time steps
            # Serial execution of time_step (this part is still serial)
            state = {
                "pertubation": grid.pertubation,
                "avg_cost": 0,
                "time_of_day": 0.5,
                "temperature": 20.0
            }
            state = np.array(list(state.values()), dtype=np.float32)
            
            for node in grid.nodes.values():
                node.time_step(state)
            
            # Calculate pertubation
            grid.pertubation = 0
            for node in grid.nodes.values():
                grid.pertubation += (node.inertia * node.get_transmission())
        
        # Parallel update (multiprocessing implementation)
        processes = []
        for node in grid.nodes.values():
            p = mp.Process(target=node.update)
            processes.append(p)
            p.start()
        
        for p in processes:
            p.join()
        
        end_time = time.time()
        return end_time - start_time
    
    def benchmark_training_performance(self, num_episodes=10):
        """Benchmark training performance with timing"""
        print(f"\n🏋️ Training Performance Benchmark ({num_episodes} episodes)")
        print("=" * 60)
        
        from training.simple_trainer import PPOTrainer
        
        # Create trainer
        trainer = PPOTrainer()
        
        # Time the training
        start_time = time.time()
        
        print("Starting training...")
        trainer.train(num_episodes=num_episodes)
        
        end_time = time.time()
        total_time = end_time - start_time
        
        print(f"\n📊 Training Results:")
        print(f"  Total Time: {total_time:.2f} seconds")
        print(f"  Time per Episode: {total_time/num_episodes:.2f} seconds")
        print(f"  Episodes per Second: {num_episodes/total_time:.2f}")
        
        return total_time
    
    def benchmark_node_update_overhead(self, num_nodes_range=[5, 10, 20, 50, 100]):
        """Benchmark the overhead of node updates"""
        print(f"\n⚡ Node Update Overhead Benchmark")
        print("=" * 60)
        
        for num_nodes in num_nodes_range:
            print(f"\nTesting {num_nodes} nodes:")
            
            # Create test case
            test_case = self._create_test_case(num_nodes)
            grid = PowerGrid(test_case, dt=1.0)
            
            # Time serial updates
            start_time = time.time()
            for _ in range(100):  # 100 iterations
                for node in grid.nodes.values():
                    node.update()
            serial_time = time.time() - start_time
            
            # Time parallel updates
            start_time = time.time()
            for _ in range(100):  # 100 iterations
                processes = []
                for node in grid.nodes.values():
                    p = mp.Process(target=node.update)
                    processes.append(p)
                    p.start()
                
                for p in processes:
                    p.join()
            parallel_time = time.time() - start_time
            
            speedup = serial_time / parallel_time if parallel_time > 0 else 0
            overhead = (parallel_time - serial_time) / serial_time * 100 if serial_time > 0 else 0
            
            print(f"  Serial: {serial_time:.3f}s")
            print(f"  Parallel: {parallel_time:.3f}s")
            print(f"  Speedup: {speedup:.2f}x")
            print(f"  Overhead: {overhead:+.1f}%")
    
    def generate_report(self):
        """Generate a comprehensive timing report"""
        print(f"\n📋 Comprehensive Timing Report")
        print("=" * 60)
        
        print(f"\n🖥️ System Information:")
        print(f"  CPU Cores: {mp.cpu_count()}")
        print(f"  Python Version: {sys.version}")
        
        print(f"\n📊 Parallelization Results:")
        print(f"{'Nodes':<8} {'Serial (s)':<12} {'Parallel (s)':<12} {'Speedup':<8} {'Efficiency':<10}")
        print("-" * 60)
        
        for num_nodes, result in self.results.items():
            serial_avg = result['serial_avg']
            parallel_avg = result['parallel_avg']
            speedup = result['speedup']
            efficiency = (speedup / mp.cpu_count()) * 100 if mp.cpu_count() > 0 else 0
            
            print(f"{num_nodes:<8} {serial_avg:<12.3f} {parallel_avg:<12.3f} {speedup:<8.2f} {efficiency:<10.1f}%")
        
        # Find optimal node count
        best_speedup = max(self.results.values(), key=lambda x: x['speedup'])
        best_nodes = [k for k, v in self.results.items() if v['speedup'] == best_speedup['speedup']][0]
        
        print(f"\n🎯 Optimal Configuration:")
        print(f"  Best Speedup: {best_speedup['speedup']:.2f}x at {best_nodes} nodes")
        print(f"  Parallel Efficiency: {(best_speedup['speedup'] / mp.cpu_count()) * 100:.1f}%")
        
        # Recommendations
        print(f"\n💡 Recommendations:")
        if best_speedup['speedup'] > 1.5:
            print(f"  ✅ Parallelization is beneficial (speedup > 1.5x)")
        else:
            print(f"  ⚠️  Parallelization overhead may be too high")
        
        if best_nodes < 20:
            print(f"  📝 Consider using parallel execution for small to medium grids")
        else:
            print(f"  📝 Parallel execution is most beneficial for large grids")

def main():
    """Run comprehensive timing benchmarks"""
    benchmark = TimingBenchmark()
    
    # Run parallelization benchmark
    benchmark.benchmark_serial_vs_parallel(num_runs=3, num_nodes_range=[5, 10, 20, 30])
    
    # Run node update overhead benchmark
    benchmark.benchmark_node_update_overhead(num_nodes_range=[5, 10, 20, 30])
    
    # Run training performance benchmark
    benchmark.benchmark_training_performance(num_episodes=5)
    
    # Generate comprehensive report
    benchmark.generate_report()

if __name__ == "__main__":
    main()
