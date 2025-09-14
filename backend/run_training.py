#!/usr/bin/env python
"""
Main entry point for PPO training on PowerGrid
Run this script to start training multi-agent PPO on the power grid network
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from training.train_grid_ppo import main

if __name__ == '__main__':
    print("Starting PowerGrid PPO Training...")
    print("This will train multiple agents to balance the power grid.")
    print("Configuration can be modified in configs/default.yaml")
    print("-" * 60)
    main()