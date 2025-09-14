#!/usr/bin/env python3

"""
Quick test of PPO implementation with all agent types
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from training.simple_trainer import PPOTrainer

def test_ppo_training():
    """Test PPO with a very short training run"""
    print("🚀 TESTING PPO IMPLEMENTATION")
    print("="*50)

    # Create PPO trainer
    trainer = PPOTrainer(
        learning_rate=3e-4,
        gamma=0.99,
        gae_lambda=0.95,
        clip_coef=0.2
    )

    print(f"Created PPO trainer with {trainer.num_agents} agents")

    # Check agent types
    print("\nAgent types and network inputs:")
    for i, node in enumerate(trainer.env.grid.nodes):
        agent_type = type(node.agent).__name__
        input_size = trainer.agents[i].shared[0].in_features
        print(f"  Agent {i+1:2d}: {agent_type:12s} -> Input size: {input_size}")

    # Run very short training
    print(f"\nRunning short PPO training (10 episodes)...")
    trainer.train(num_episodes=10)

    # Test episode
    print(f"\nTesting trained agents...")
    trainer.test_episode()

    print("\n✅ PPO implementation test completed successfully!")

if __name__ == "__main__":
    test_ppo_training()