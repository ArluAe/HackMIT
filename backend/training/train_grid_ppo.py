"""
Complete training example for PowerGrid with PPO
Shows how to create a network of nodes with different agents and train them
"""

import os
import sys
import torch
import numpy as np
import yaml
from pathlib import Path

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from environment.PowerGridEnvPPO import PowerGridEnvPPO
from environment.case14 import case14
from utils.logger import Logger


def create_node_configurations():
    """
    Create node configurations for a diverse power grid
    This defines what type of agent each node will have
    """
    node_configs = {
        # Producer nodes (power plants)
        0: {
            'agent_type': 'producer',
            'agent_params': {
                'production_capacity': 500.0,
                'ramp_rate': 50.0
            }
        },
        1: {
            'agent_type': 'producer',
            'agent_params': {
                'production_capacity': 300.0,
                'ramp_rate': 30.0
            }
        },

        # Consumer nodes (residential/industrial loads)
        2: {
            'agent_type': 'consumer',
            'agent_params': {
                'consumption_range': (100, 200),
                'flexibility': 0.2
            }
        },
        3: {
            'agent_type': 'consumer',
            'agent_params': {
                'consumption_range': (150, 300),
                'flexibility': 0.15
            }
        },
        4: {
            'agent_type': 'consumer',
            'agent_params': {
                'consumption_range': (80, 150),
                'flexibility': 0.25
            }
        },

        # Business nodes (prosumers - can produce and consume)
        5: {
            'agent_type': 'business',
            'agent_params': {
                'base_consumption': 100,
                'production_capacity': 50  # e.g., rooftop solar
            }
        },
        6: {
            'agent_type': 'business',
            'agent_params': {
                'base_consumption': 150,
                'production_capacity': 75
            }
        },

        # Battery storage nodes
        7: {
            'agent_type': 'battery',
            'agent_params': {
                'capacity': 200,
                'max_charge_rate': 50,
                'max_discharge_rate': 50
            }
        },
        8: {
            'agent_type': 'battery',
            'agent_params': {
                'capacity': 300,
                'max_charge_rate': 75,
                'max_discharge_rate': 75
            }
        },

        # Additional mixed nodes
        9: {
            'agent_type': 'producer',
            'agent_params': {
                'production_capacity': 200.0,
                'ramp_rate': 40.0
            }
        },
        10: {
            'agent_type': 'consumer',
            'agent_params': {
                'consumption_range': (50, 100),
                'flexibility': 0.3
            }
        },
        11: {
            'agent_type': 'business',
            'agent_params': {
                'base_consumption': 80,
                'production_capacity': 30
            }
        },
        12: {
            'agent_type': 'battery',
            'agent_params': {
                'capacity': 150,
                'max_charge_rate': 40,
                'max_discharge_rate': 40
            }
        },
        13: {
            'agent_type': 'consumer',
            'agent_params': {
                'consumption_range': (120, 250),
                'flexibility': 0.18
            }
        }
    }

    return node_configs


class GridPPOTrainer:
    """Trainer for PowerGrid with PPO agents"""

    def __init__(self, config):
        self.config = config
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        print(f"Using device: {self.device}")

        # Create node configurations
        node_configs = create_node_configurations()

        # Get power grid configuration (14-bus system)
        ppc = case14()

        # PPO configuration
        ppo_config = {
            'hidden_size': config.get('hidden_size', 64),
            'lr': config.get('lr', 3e-4),
            'gamma': config.get('gamma', 0.99),
            'gae_lambda': config.get('gae_lambda', 0.95),
            'clip_range': config.get('clip_range', 0.2),
            'value_coef': config.get('value_coef', 0.5),
            'entropy_coef': config.get('entropy_coef', 0.01),
            'buffer_size': config.get('buffer_size', 2048),
            'batch_size': config.get('batch_size', 64),
            'n_epochs': config.get('n_epochs', 10),
            'device': str(self.device)
        }

        # Initialize environment
        self.env = PowerGridEnvPPO(
            ppc_config=ppc,
            node_configs=node_configs,
            dt=config.get('dt', 5.0),
            target_hz=config.get('target_hz', 60.0),
            max_steps=config.get('max_steps_per_episode', 288),
            ppo_config=ppo_config
        )

        # Initialize logger
        self.logger = Logger(
            log_dir=config.get('log_dir', './logs'),
            experiment_name=config.get('experiment_name', 'grid_ppo_training')
        )

        # Training parameters
        self.n_episodes = config.get('n_episodes', 1000)
        self.rollout_steps = config.get('rollout_steps', 2048)
        self.save_freq = config.get('save_freq', 50)
        self.eval_freq = config.get('eval_freq', 10)
        self.n_eval_episodes = config.get('n_eval_episodes', 5)

        # Print network information
        self.print_network_info()

    def print_network_info(self):
        """Print information about the power grid network"""
        print("\n" + "="*60)
        print("POWER GRID NETWORK CONFIGURATION")
        print("="*60)
        print(f"Number of nodes: {len(self.env.grid.nodes)}")
        print(f"Number of branches: {sum(len(branches) for branches in self.env.grid.branches.values()) // 2}")
        print(f"Number of PPO agents: {len(self.env.ppo_agents)}")

        print("\nNode Types:")
        node_types = {}
        for node in self.env.grid.nodes:
            node_types[node.agent_type] = node_types.get(node.agent_type, 0) + 1

        for agent_type, count in node_types.items():
            print(f"  {agent_type}: {count} nodes")

        print("\nAgent IDs:")
        for agent_id in sorted(self.env.ppo_agents.keys()):
            print(f"  - {agent_id}")

        print("="*60 + "\n")

    def train(self):
        """Main training loop"""
        print(f"Starting PPO training for {self.n_episodes} episodes")
        print(f"Rollout steps: {self.rollout_steps}")
        print(f"Max steps per episode: {self.env.max_steps}")

        best_reward = -float('inf')
        total_steps = 0

        for episode in range(self.n_episodes):
            # Collect rollout
            print(f"\nEpisode {episode + 1}/{self.n_episodes}")
            print("Collecting rollout...")
            self.env.collect_rollout(self.rollout_steps)
            total_steps += self.rollout_steps

            # Update all agents
            print("Updating PPO agents...")
            update_stats = self.env.update_agents()

            # Log training statistics
            for agent_id, stats in update_stats.items():
                for key, value in stats.items():
                    self.logger.log_scalar(
                        f'{key}/{agent_id}',
                        value,
                        total_steps
                    )

            # Evaluation
            if (episode + 1) % self.eval_freq == 0:
                print("Evaluating...")
                eval_rewards = self.evaluate()
                total_reward = sum(eval_rewards.values())

                print(f"\nEvaluation Results (Episode {episode + 1}):")
                print(f"Total Reward: {total_reward:.2f}")

                # Print top 5 agents
                sorted_agents = sorted(eval_rewards.items(), key=lambda x: x[1], reverse=True)[:5]
                print("Top 5 Agents:")
                for agent_id, reward in sorted_agents:
                    node = self.env.grid.get_node_by_agent_id(agent_id)
                    print(f"  {agent_id} ({node.agent_type}): {reward:.2f}")

                # Save best model
                if total_reward > best_reward:
                    best_reward = total_reward
                    self.save_checkpoint(episode + 1, is_best=True)
                    print(f"New best reward: {best_reward:.2f}")

            # Regular checkpoint
            if (episode + 1) % self.save_freq == 0:
                self.save_checkpoint(episode + 1)

            # Log episode
            self.logger.log_scalar('episode', episode + 1, total_steps)

        print("\n" + "="*60)
        print("TRAINING COMPLETED!")
        print(f"Best total reward: {best_reward:.2f}")
        print("="*60)

    def evaluate(self):
        """Evaluate current policies"""
        eval_rewards = {agent_id: [] for agent_id in self.env.ppo_agents}

        for eval_episode in range(self.n_eval_episodes):
            observations = self.env.reset()
            episode_rewards = {agent_id: 0 for agent_id in self.env.ppo_agents}
            done = False
            step = 0

            while not done:
                # Get actions (deterministic for evaluation)
                actions = {}
                for agent_id, ppo_agent in self.env.ppo_agents.items():
                    with torch.no_grad():
                        obs_tensor = torch.FloatTensor(observations[agent_id]).unsqueeze(0)
                        action_info = ppo_agent.policy.select_action(obs_tensor, training=False)
                        actions[agent_id] = action_info['action'].item() if isinstance(action_info['action'], np.ndarray) else action_info['action']

                # Step environment
                observations, rewards, done, info = self.env.step(actions)

                for agent_id in self.env.ppo_agents:
                    episode_rewards[agent_id] += rewards[agent_id]

                step += 1

            # Store episode rewards
            for agent_id in self.env.ppo_agents:
                eval_rewards[agent_id].append(episode_rewards[agent_id])

        # Calculate mean rewards
        mean_rewards = {}
        for agent_id in self.env.ppo_agents:
            mean_rewards[agent_id] = np.mean(eval_rewards[agent_id])
            self.logger.log_scalar(
                f'eval_reward/{agent_id}',
                mean_rewards[agent_id],
                self.n_eval_episodes
            )

        return mean_rewards

    def save_checkpoint(self, episode, is_best=False):
        """Save training checkpoint"""
        checkpoint_dir = Path(self.config.get('checkpoint_dir', './checkpoints'))
        checkpoint_dir.mkdir(parents=True, exist_ok=True)

        if is_best:
            save_dir = checkpoint_dir / 'best'
        else:
            save_dir = checkpoint_dir / f'episode_{episode}'

        self.env.save_agents(str(save_dir), episode)
        print(f"Saved checkpoint: {save_dir}")

    def load_checkpoint(self, episode):
        """Load training checkpoint"""
        checkpoint_dir = Path(self.config.get('checkpoint_dir', './checkpoints'))

        if episode == 'best':
            load_dir = checkpoint_dir / 'best'
        else:
            load_dir = checkpoint_dir / f'episode_{episode}'

        self.env.load_agents(str(load_dir), episode)
        print(f"Loaded checkpoint: {load_dir}")


def main():
    """Main entry point"""
    # Load configuration
    config_path = Path(__file__).parent.parent / 'configs' / 'default.yaml'
    if config_path.exists():
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)
    else:
        # Default configuration
        config = {
            'n_episodes': 500,
            'rollout_steps': 2048,
            'max_steps_per_episode': 288,  # 24 hours with 5-minute steps
            'dt': 5.0,  # 5 minutes per step
            'target_hz': 60.0,
            'hidden_size': 64,
            'lr': 3e-4,
            'gamma': 0.99,
            'gae_lambda': 0.95,
            'clip_range': 0.2,
            'value_coef': 0.5,
            'entropy_coef': 0.01,
            'buffer_size': 2048,
            'batch_size': 64,
            'n_epochs': 10,
            'save_freq': 25,
            'eval_freq': 10,
            'n_eval_episodes': 5,
            'log_dir': './logs',
            'checkpoint_dir': './checkpoints',
            'experiment_name': 'grid_ppo_experiment'
        }

    # Create trainer and train
    trainer = GridPPOTrainer(config)
    trainer.train()


if __name__ == '__main__':
    main()