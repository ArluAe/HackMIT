# PowerGrid PPO Training System

## Overview
This system implements Independent PPO (IPPO) training for multi-agent power grid control. Each node in the power grid has its own agent with an independent PPO policy network.

## Architecture

### Core Components

1. **Environment** (`environment/PowerGridEnvPPO.py`)
   - Wrapper for PowerGrid that interfaces with PPO agents
   - Handles observations, rewards, and rollout collection
   - Manages node-agent relationships

2. **PPO Agent** (`agents/ppo_agent.py`)
   - Individual PPO implementation for each agent
   - Actor-critic network with independent updates
   - Own experience buffer and optimizer

3. **Rollout Buffer** (`agents/rollout_buffer.py`)
   - Experience storage for each agent
   - Supports multi-agent buffer management

4. **Policy Network** (`agents/Policy.py`)
   - Actor-critic architecture
   - Supports different agent types (producer, consumer, battery, business)

5. **Training Script** (`training/train_grid_ppo.py`)
   - Main training loop
   - Handles evaluation and checkpointing
   - Configurable via YAML

## Quick Start

```bash
# Run training with default configuration
python run_training.py

# Or run the training script directly
python training/train_grid_ppo.py
```

## Configuration

Edit `configs/default.yaml` to modify:
- Number of training episodes
- PPO hyperparameters (learning rate, clip range, etc.)
- Network architecture (hidden size)
- Rollout and batch sizes

## Network Structure

The default configuration creates a 14-bus power system with:
- Producer nodes (power plants)
- Consumer nodes (loads)
- Battery nodes (energy storage)
- Business nodes (prosumers)

Each node:
- Has physical connections via branches
- Maintains its own PPO agent
- Learns independently while respecting grid physics

## Key Features

- **Decentralized Learning**: Each agent updates independently (IPPO)
- **Physical Constraints**: Power flow through branches is constrained
- **Flexible Agent Types**: Easy to add new agent behaviors
- **Comprehensive Logging**: Track per-agent rewards and training metrics

## File Structure

```
backend/
├── agents/
│   ├── ppo_agent.py          # PPO implementation
│   ├── rollout_buffer.py     # Experience storage
│   └── Policy.py              # Actor-critic network
├── environment/
│   ├── PowerGridEnvPPO.py    # Main environment wrapper
│   ├── Node.py                # Node with agent integration
│   └── PowerGrid.py          # Grid simulation
├── training/
│   └── train_grid_ppo.py     # Training script
├── utils/
│   └── logger.py             # Logging utilities
├── configs/
│   └── default.yaml          # Configuration
└── run_training.py           # Entry point
```

## Training Flow

1. **Rollout Phase**: Agents interact with environment, collecting experiences
2. **Update Phase**: Each agent updates its PPO policy independently
3. **Evaluation**: Periodic evaluation of learned policies
4. **Checkpointing**: Save best models and regular checkpoints

## Customization

To add new agent types:
1. Create agent class inheriting from `BaseAgent`
2. Update `Node._create_agent()` to handle new type
3. Define observation space in `PowerGridEnvPPO`
4. Implement reward function for the agent type

## Results

Training produces:
- Logs in `./logs/` directory
- Checkpoints in `./checkpoints/` directory
- Per-agent reward tracking
- Grid stability metrics