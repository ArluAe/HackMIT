import os
import json
import csv
from datetime import datetime
from pathlib import Path
import numpy as np


class Logger:
    """Logger for tracking training metrics and statistics"""

    def __init__(self, log_dir='./logs', experiment_name=None):
        """
        Initialize logger

        Args:
            log_dir: Base directory for logs
            experiment_name: Name of the experiment
        """
        if experiment_name is None:
            experiment_name = f"experiment_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        self.log_dir = Path(log_dir) / experiment_name
        self.log_dir.mkdir(parents=True, exist_ok=True)

        # Initialize log files
        self.scalar_log_file = self.log_dir / 'scalars.csv'
        self.episode_log_file = self.log_dir / 'episodes.csv'
        self.config_file = self.log_dir / 'config.json'

        # Initialize CSV writers
        self._init_scalar_logger()
        self._init_episode_logger()

        # In-memory buffers for recent statistics
        self.scalar_buffer = {}
        self.episode_buffer = []

        print(f"Logger initialized. Logs will be saved to: {self.log_dir}")

    def _init_scalar_logger(self):
        """Initialize scalar logging CSV file"""
        with open(self.scalar_log_file, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['timestamp', 'step', 'metric', 'value'])

    def _init_episode_logger(self):
        """Initialize episode logging CSV file"""
        with open(self.episode_log_file, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([
                'timestamp', 'episode', 'agent_id', 'total_reward',
                'episode_length', 'average_reward'
            ])

    def log_scalar(self, metric_name, value, step):
        """
        Log a scalar value

        Args:
            metric_name: Name of the metric
            value: Value to log
            step: Current training step
        """
        timestamp = datetime.now().isoformat()

        # Write to CSV
        with open(self.scalar_log_file, 'a', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([timestamp, step, metric_name, value])

        # Update buffer
        if metric_name not in self.scalar_buffer:
            self.scalar_buffer[metric_name] = []
        self.scalar_buffer[metric_name].append((step, value))

    def log_episode(self, episode, agent_id, total_reward, episode_length):
        """
        Log episode statistics

        Args:
            episode: Episode number
            agent_id: Agent identifier
            total_reward: Total episode reward
            episode_length: Length of episode
        """
        timestamp = datetime.now().isoformat()
        average_reward = total_reward / episode_length if episode_length > 0 else 0

        # Write to CSV
        with open(self.episode_log_file, 'a', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([
                timestamp, episode, agent_id, total_reward,
                episode_length, average_reward
            ])

        # Update buffer
        self.episode_buffer.append({
            'episode': episode,
            'agent_id': agent_id,
            'total_reward': total_reward,
            'episode_length': episode_length,
            'average_reward': average_reward
        })

    def log_config(self, config):
        """
        Save configuration to file

        Args:
            config: Configuration dictionary
        """
        with open(self.config_file, 'w') as f:
            json.dump(config, f, indent=2)

    def get_recent_scalar(self, metric_name, n_recent=100):
        """
        Get recent values for a metric

        Args:
            metric_name: Name of the metric
            n_recent: Number of recent values to return

        Returns:
            List of (step, value) tuples
        """
        if metric_name not in self.scalar_buffer:
            return []
        return self.scalar_buffer[metric_name][-n_recent:]

    def get_agent_statistics(self, agent_id, n_recent=100):
        """
        Get recent statistics for a specific agent

        Args:
            agent_id: Agent identifier
            n_recent: Number of recent episodes to consider

        Returns:
            Dictionary with statistics
        """
        agent_episodes = [
            ep for ep in self.episode_buffer[-n_recent:]
            if ep['agent_id'] == agent_id
        ]

        if not agent_episodes:
            return {
                'mean_reward': 0,
                'std_reward': 0,
                'max_reward': 0,
                'min_reward': 0,
                'mean_length': 0
            }

        rewards = [ep['total_reward'] for ep in agent_episodes]
        lengths = [ep['episode_length'] for ep in agent_episodes]

        return {
            'mean_reward': np.mean(rewards),
            'std_reward': np.std(rewards),
            'max_reward': np.max(rewards),
            'min_reward': np.min(rewards),
            'mean_length': np.mean(lengths)
        }

    def print_summary(self, episode, agents_stats):
        """
        Print training summary

        Args:
            episode: Current episode
            agents_stats: Dictionary mapping agent_id to statistics
        """
        print(f"\n{'=' * 60}")
        print(f"Episode {episode} Summary")
        print(f"{'=' * 60}")

        for agent_id, stats in agents_stats.items():
            print(f"\nAgent {agent_id}:")
            print(f"  Mean Reward: {stats.get('mean_reward', 0):.2f}")
            print(f"  Std Reward:  {stats.get('std_reward', 0):.2f}")
            print(f"  Max Reward:  {stats.get('max_reward', 0):.2f}")
            print(f"  Min Reward:  {stats.get('min_reward', 0):.2f}")

        print(f"{'=' * 60}\n")

    def save_checkpoint_info(self, checkpoint_path, episode, metadata=None):
        """
        Save information about a checkpoint

        Args:
            checkpoint_path: Path to the checkpoint
            episode: Episode number
            metadata: Additional metadata to save
        """
        checkpoint_info = {
            'checkpoint_path': str(checkpoint_path),
            'episode': episode,
            'timestamp': datetime.now().isoformat(),
            'metadata': metadata or {}
        }

        checkpoint_file = self.log_dir / 'checkpoints.json'

        # Load existing checkpoints if file exists
        if checkpoint_file.exists():
            with open(checkpoint_file, 'r') as f:
                checkpoints = json.load(f)
        else:
            checkpoints = []

        checkpoints.append(checkpoint_info)

        with open(checkpoint_file, 'w') as f:
            json.dump(checkpoints, f, indent=2)


class TensorboardLogger(Logger):
    """Extended logger with Tensorboard support"""

    def __init__(self, log_dir='./logs', experiment_name=None):
        super().__init__(log_dir, experiment_name)

        try:
            from torch.utils.tensorboard import SummaryWriter
            self.writer = SummaryWriter(self.log_dir)
            self.use_tensorboard = True
            print("Tensorboard logging enabled")
        except ImportError:
            self.use_tensorboard = False
            print("Tensorboard not available. Using CSV logging only.")

    def log_scalar(self, metric_name, value, step):
        """Log scalar with Tensorboard support"""
        super().log_scalar(metric_name, value, step)

        if self.use_tensorboard:
            self.writer.add_scalar(metric_name, value, step)

    def log_histogram(self, name, values, step):
        """Log histogram to Tensorboard"""
        if self.use_tensorboard:
            self.writer.add_histogram(name, values, step)

    def close(self):
        """Close Tensorboard writer"""
        if self.use_tensorboard:
            self.writer.close()