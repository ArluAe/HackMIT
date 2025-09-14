#!/usr/bin/env python3

"""
Simple timing utility for PowerGrid parallelization
Easy to integrate into existing code
"""

import time
import multiprocessing as mp
import functools
from contextlib import contextmanager

class TimingUtility:
    """Simple timing utility for measuring performance"""
    
    def __init__(self):
        self.timings = {}
        self.start_times = {}
    
    def start_timer(self, name):
        """Start a named timer"""
        self.start_times[name] = time.time()
    
    def end_timer(self, name):
        """End a named timer and store the result"""
        if name in self.start_times:
            elapsed = time.time() - self.start_times[name]
            if name not in self.timings:
                self.timings[name] = []
            self.timings[name].append(elapsed)
            del self.start_times[name]
            return elapsed
        return 0.0
    
    @contextmanager
    def timer(self, name):
        """Context manager for timing code blocks"""
        self.start_timer(name)
        try:
            yield
        finally:
            self.end_timer(name)
    
    def get_stats(self, name):
        """Get statistics for a named timer"""
        if name not in self.timings or not self.timings[name]:
            return None
        
        times = self.timings[name]
        return {
            'count': len(times),
            'total': sum(times),
            'average': sum(times) / len(times),
            'min': min(times),
            'max': max(times)
        }
    
    def print_stats(self, name):
        """Print statistics for a named timer"""
        stats = self.get_stats(name)
        if stats:
            print(f"⏱️  {name}:")
            print(f"   Count: {stats['count']}")
            print(f"   Total: {stats['total']:.3f}s")
            print(f"   Average: {stats['average']:.3f}s")
            print(f"   Min: {stats['min']:.3f}s")
            print(f"   Max: {stats['max']:.3f}s")
    
    def compare_timers(self, timer1, timer2):
        """Compare two timers and show speedup"""
        stats1 = self.get_stats(timer1)
        stats2 = self.get_stats(timer2)
        
        if stats1 and stats2:
            speedup = stats1['average'] / stats2['average']
            print(f"📊 Comparison: {timer1} vs {timer2}")
            print(f"   Speedup: {speedup:.2f}x")
            print(f"   {timer1}: {stats1['average']:.3f}s")
            print(f"   {timer2}: {stats2['average']:.3f}s")
            return speedup
        return 0.0

# Global timing utility instance
timing = TimingUtility()

def timed_function(name):
    """Decorator to time function execution"""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            with timing.timer(name):
                return func(*args, **kwargs)
        return wrapper
    return decorator

def benchmark_parallelization(grid, num_iterations=10):
    """Benchmark parallelization in PowerGrid"""
    print("🚀 PowerGrid Parallelization Benchmark")
    print("=" * 50)
    
    # Test serial execution
    print("Testing serial execution...")
    for i in range(num_iterations):
        with timing.timer("serial_update"):
            for node in grid.nodes.values():
                node.update()
    
    # Test parallel execution
    print("Testing parallel execution...")
    for i in range(num_iterations):
        with timing.timer("parallel_update"):
            processes = []
            for node in grid.nodes.values():
                p = mp.Process(target=node.update)
                processes.append(p)
                p.start()
            
            for p in processes:
                p.join()
    
    # Print results
    timing.print_stats("serial_update")
    timing.print_stats("parallel_update")
    timing.compare_timers("serial_update", "parallel_update")
    
    print(f"\n🖥️ System Info:")
    print(f"   CPU Cores: {mp.cpu_count()}")
    print(f"   Nodes: {len(grid.nodes)}")

def quick_timing_test():
    """Quick test of the timing utility"""
    print("⚡ Quick Timing Test")
    print("=" * 30)
    
    # Test context manager
    with timing.timer("test_operation"):
        time.sleep(0.1)  # Simulate work
    
    # Test decorator
    @timed_function("decorated_function")
    def sample_function():
        time.sleep(0.05)  # Simulate work
        return "done"
    
    sample_function()
    
    # Print results
    timing.print_stats("test_operation")
    timing.print_stats("decorated_function")

if __name__ == "__main__":
    quick_timing_test()

