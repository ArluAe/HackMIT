#!/usr/bin/env python3

"""
Simple timing benchmark for PowerGrid parallelization
Uses available case files and measures serial vs parallel performance
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import time
import multiprocessing as mp
import numpy as np
import json
from environment.PowerGrid import PowerGrid

def load_case1():
    """Load case1.json file"""
    with open('cases/case1.json', 'r') as f:
        return json.load(f)

def benchmark_serial_vs_parallel():
    """Simple benchmark comparing serial vs parallel execution"""
    print("🚀 PowerGrid Parallelization Benchmark")
    print("=" * 50)
    
    # Load test case
    case_data = load_case1()
    grid = PowerGrid(case_data, dt=1.0)
    
    print(f"📊 Testing with {len(grid.nodes)} nodes")
    print(f"🖥️ CPU Cores available: {mp.cpu_count()}")
    
    # Test serial execution
    print("\n⏱️ Testing serial execution...")
    serial_times = []
    
    for i in range(5):  # 5 runs
        start_time = time.time()
        
        # Simulate the update process (serial)
        for node in grid.nodes.values():
            node.update()
        
        end_time = time.time()
        serial_times.append(end_time - start_time)
        print(f"  Run {i+1}: {end_time - start_time:.4f}s")
    
    # Test parallel execution
    print("\n⚡ Testing parallel execution...")
    parallel_times = []
    
    for i in range(5):  # 5 runs
        start_time = time.time()
        
        # Simulate the update process (parallel)
        processes = []
        for node in grid.nodes.values():
            p = mp.Process(target=node.update)
            processes.append(p)
            p.start()
        
        for p in processes:
            p.join()
        
        end_time = time.time()
        parallel_times.append(end_time - start_time)
        print(f"  Run {i+1}: {end_time - start_time:.4f}s")
    
    # Calculate statistics
    avg_serial = np.mean(serial_times)
    avg_parallel = np.mean(parallel_times)
    speedup = avg_serial / avg_parallel if avg_parallel > 0 else 0
    
    print(f"\n📈 Results:")
    print(f"  Serial Average: {avg_serial:.4f}s")
    print(f"  Parallel Average: {avg_parallel:.4f}s")
    print(f"  Speedup: {speedup:.2f}x")
    print(f"  Efficiency: {(speedup / mp.cpu_count()) * 100:.1f}%")
    
    # Analysis
    print(f"\n💡 Analysis:")
    if speedup > 1.5:
        print(f"  ✅ Parallelization is beneficial (speedup > 1.5x)")
    elif speedup > 1.0:
        print(f"  ⚠️  Parallelization provides modest improvement")
    else:
        print(f"  ❌ Parallelization overhead exceeds benefits")
    
    if len(grid.nodes) < mp.cpu_count():
        print(f"  📝 Consider: Fewer nodes than CPU cores - parallelization may not be optimal")
    else:
        print(f"  📝 Consider: More nodes than CPU cores - parallelization should help")

def benchmark_time_step():
    """Benchmark the time_step method performance"""
    print(f"\n🔄 Time Step Performance Benchmark")
    print("=" * 50)
    
    case_data = load_case1()
    grid = PowerGrid(case_data, dt=1.0)
    
    # Time the time_step method
    times = []
    for i in range(10):
        start_time = time.time()
        
        # Create state
        state = {
            "pertubation": grid.pertubation,
            "avg_cost": 0,
            "time_of_day": 0.5,
            "temperature": 20.0
        }
        state = np.array(list(state.values()), dtype=np.float32)
        
        # Execute time_step
        for node in grid.nodes.values():
            node.time_step(state)
        
        # Calculate pertubation
        grid.pertubation = 0
        for node in grid.nodes.values():
            grid.pertubation += (node.inertia * node.get_transmission())
        
        end_time = time.time()
        times.append(end_time - start_time)
    
    avg_time = np.mean(times)
    print(f"Average time_step duration: {avg_time:.4f}s")
    print(f"Time steps per second: {1/avg_time:.1f}")

def benchmark_simulate_day():
    """Benchmark the simulate_day method"""
    print(f"\n🌅 Simulate Day Performance Benchmark")
    print("=" * 50)
    
    case_data = load_case1()
    grid = PowerGrid(case_data, dt=1.0)
    
    # Time simulate_day
    times = []
    for i in range(3):  # 3 runs
        start_time = time.time()
        grid.simulate_day()
        end_time = time.time()
        times.append(end_time - start_time)
        print(f"  Run {i+1}: {end_time - start_time:.4f}s")
    
    avg_time = np.mean(times)
    print(f"\nAverage simulate_day duration: {avg_time:.4f}s")

def main():
    """Run all benchmarks"""
    try:
        benchmark_serial_vs_parallel()
        benchmark_time_step()
        benchmark_simulate_day()
        
        print(f"\n🎯 Summary:")
        print(f"  Use timing_utility.py for detailed timing in your code")
        print(f"  Use @timed_function decorator to time specific functions")
        print(f"  Use timing.timer() context manager for timing code blocks")
        
    except Exception as e:
        print(f"❌ Error running benchmark: {e}")
        print(f"Make sure case1.json exists in the cases/ directory")

if __name__ == "__main__":
    main()

