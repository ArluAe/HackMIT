import numpy as np
import random
from typing import List
from datetime import datetime, time


def get_daily_temperatures(timestamps: List[float], base_temp: float = 20.0) -> List[float]:
    """
    Generate realistic daily temperature curve from timestamps.

    Args:
        timestamps: Array of Unix timestamps within a day
        base_temp: Base temperature in Celsius (default: 20°C)

    Returns:
        List of temperatures in Celsius corresponding to each timestamp
    """
    if not timestamps:
        return []

    # Convert timestamps to hours (0-24)
    hours = []
    for ts in timestamps:
        dt = datetime.fromtimestamp(ts)
        hour_float = dt.hour + dt.minute / 60.0 + dt.second / 3600.0
        hours.append(hour_float)

    # Random parameters for temperature curve variation
    peak_hour = random.uniform(12, 15)  # Peak temperature between 12-3 PM
    amplitude = random.uniform(8, 15)   # Temperature swing (8-15°C)
    morning_dip = random.uniform(2, 5)  # Extra cooling in early morning
    noise_scale = random.uniform(0.5, 2.0)  # Random noise magnitude

    temperatures = []

    for hour in hours:
        # Base sinusoidal curve with peak around midday
        # Shift so minimum is around 6 AM and maximum around peak_hour
        normalized_hour = (hour - 6) / 12  # Normalize to 0-2 range starting from 6 AM
        base_curve = np.cos(np.pi * normalized_hour) if normalized_hour <= 1 else np.cos(np.pi * (2 - normalized_hour))

        # Apply extra morning dip (between 4-8 AM)
        if 4 <= hour <= 8:
            morning_factor = 1 - morning_dip * np.exp(-((hour - 6) ** 2) / 2)
            base_curve *= morning_factor

        # Shift peak to desired hour
        peak_shift = np.exp(-((hour - peak_hour) ** 2) / 8) * random.uniform(0.8, 1.2)

        # Calculate temperature
        temp = base_temp + amplitude * (base_curve + peak_shift * 0.3)

        # Add random noise
        noise = random.gauss(0, noise_scale)
        temp += noise

        temperatures.append(round(temp, 1))

    return temperatures


def get_daily_temperatures_simple(timestamps: List[float],
                                min_temp: float = 15.0,
                                max_temp: float = 30.0) -> List[float]:
    """
    Simplified version with normal distribution curve.

    Args:
        timestamps: Array of Unix timestamps within a day
        min_temp: Minimum temperature (early morning)
        max_temp: Maximum temperature (midday)

    Returns:
        List of temperatures in Celsius
    """
    if not timestamps:
        return []

    hours = []
    for ts in timestamps:
        dt = datetime.fromtimestamp(ts)
        hour_float = dt.hour + dt.minute / 60.0
        hours.append(hour_float)

    # Random variations
    peak_hour = random.uniform(13, 16)
    temp_range = max_temp - min_temp
    std_dev = random.uniform(3, 5)

    temperatures = []
    for hour in hours:
        # Normal distribution centered around peak_hour
        gaussian = np.exp(-((hour - peak_hour) ** 2) / (2 * std_dev ** 2))
        temp = min_temp + temp_range * gaussian

        # Add small random variation
        temp += random.gauss(0, 1.0)
        temperatures.append(round(temp, 1))

    return temperatures