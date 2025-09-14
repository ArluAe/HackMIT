from .PowerGrid import PowerGrid
from ..utils import get_daily_temperatures
import time

from . import case14
my_grid = PowerGrid(case14.case14(), 0.01)
my_grid.simulate_day()

# Example usage of temperature function
timestamps = [time.time()]  # Current timestamp
temps = get_daily_temperatures(timestamps, base_temp=25.0)
print(f"Temperature: {temps[0]}°C")