from environment.PowerGrid import PowerGrid
from utils.temperature import get_daily_temperatures
import time

import environment.case14 as case14
my_grid = PowerGrid(case14.case14(), 1.0)
my_grid.simulate_day()

# Example usage of temperature function
timestamps = [time.time()]  # Current timestamp
temps = get_daily_temperatures(timestamps, base_temp=25.0)
print(f"Temperature: {temps[0]}°C")