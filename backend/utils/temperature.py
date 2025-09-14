import numpy as np
import random
from typing import List
from datetime import datetime


def get_daily_temperature(timestamp: float, min_temp: float = 15.0, max_temp: float = 30.0) -> float:
    """
    Calculate realistic temperature for a given timestamp.

    Args:
        timestamp: Unix timestamp
        min_temp: Minimum temperature (early morning)
        max_temp: Maximum temperature (midday)

    Returns:
        Temperature in Celsius
    """
    dt = datetime.fromtimestamp(timestamp)
    hour = dt.hour + dt.minute / 60.0

    # Peak temperature between 1-4 PM
    peak_hour = random.uniform(13, 16)
    temp_range = max_temp - min_temp
    std_dev = random.uniform(3, 5)

    # Gaussian distribution centered around peak_hour
    gaussian = np.exp(-((hour - peak_hour) ** 2) / (2 * std_dev ** 2))
    temp = min_temp + temp_range * gaussian

    # Add small random variation
    temp += random.gauss(0, 1.0)

    return round(temp, 1)


def get_daily_temperatures(timestamps: List[float], base_temp: float = 25.0) -> List[float]:
    """
    Get temperatures for multiple timestamps.

    Args:
        timestamps: List of Unix timestamps
        base_temp: Base temperature to use as reference

    Returns:
        List of temperatures in Celsius
    """
    return [get_daily_temperature(ts, base_temp - 10, base_temp + 5) for ts in timestamps]