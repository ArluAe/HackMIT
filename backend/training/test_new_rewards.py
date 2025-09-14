#!/usr/bin/env python3

"""
Test the new reward system where:
- PowerGrid tracks only frequency and average cost
- Consumers/Business buy electricity at low prices
- Batteries do arbitrage (buy low, sell high)
- Producers maintain frequency AND sell at high prices
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from training.simple_trainer import PPOTrainer
import numpy as np

def test_reward_system():
    """Test that the new reward system works correctly"""
    print("🎯 TESTING NEW REWARD SYSTEM")
    print("="*60)

    trainer = PPOTrainer()

    print("\n📊 AGENT OBJECTIVES:")
    print("  • Consumers: Buy electricity at LOW prices")
    print("  • Business: Buy at LOW prices (more flexible)")
    print("  • Battery: Buy LOW, sell HIGH (arbitrage)")
    print("  • Producer: Maintain 60Hz frequency + sell at HIGH prices")

    print(f"\n🔧 SYSTEM STATE:")
    print(f"  • Grid tracks: frequency and average_cost only")
    print(f"  • Price based on supply/demand dynamics")

    # Run a short episode
    obs = trainer.env.reset()

    # Track metrics
    prices = []
    frequencies = []
    producer_rewards = []
    consumer_rewards = []

    print(f"\n📈 RUNNING 20 STEPS:")
    for step in range(20):
        actions, _, _, _ = trainer.get_actions_and_values(obs)
        obs, rewards, done = trainer.env.step(actions)

        price = trainer.env.grid.calculate_electricity_price()
        freq = trainer.env.grid.grid_frequency

        prices.append(price)
        frequencies.append(freq)

        # Collect rewards by type
        for i, node in enumerate(trainer.env.grid.nodes):
            agent_type = type(node.agent).__name__
            if agent_type == "ProducerAgent":
                producer_rewards.append(rewards[i])
            elif agent_type == "ConsumerAgent":
                consumer_rewards.append(rewards[i])

        if step % 5 == 0:
            print(f"  Step {step:2d}: Price=${price:6.1f}/MWh, Freq={freq:5.1f}Hz")

    print(f"\n📊 SUMMARY STATISTICS:")
    print(f"  Price range: ${min(prices):.1f} - ${max(prices):.1f}/MWh")
    print(f"  Avg price: ${np.mean(prices):.1f}/MWh")
    print(f"  Frequency range: {min(frequencies):.1f} - {max(frequencies):.1f}Hz")
    print(f"  Avg frequency deviation: {np.mean([abs(f-60) for f in frequencies]):.2f}Hz")

    print(f"\n🏆 REWARD ANALYSIS:")
    print(f"  Avg Producer reward: {np.mean(producer_rewards):.3f}")
    print(f"  Avg Consumer reward: {np.mean(consumer_rewards):.3f}")

    # Check specific behaviors
    print(f"\n✅ BEHAVIOR VERIFICATION:")

    # Check if prices vary based on supply/demand
    price_variance = np.var(prices)
    if price_variance > 100:
        print("  ✓ Prices vary with supply/demand")
    else:
        print("  ✗ Prices not varying enough")

    # Check if frequency is being managed
    freq_deviation = np.mean([abs(f-60) for f in frequencies])
    if freq_deviation < 5:
        print("  ✓ Frequency reasonably maintained")
    else:
        print("  ✗ Frequency control needs improvement")

    # Test specific agent behaviors
    print(f"\n🔬 AGENT-SPECIFIC TESTS:")

    # Check a consumer agent
    for node in trainer.env.grid.nodes:
        if type(node.agent).__name__ == "ConsumerAgent":
            if hasattr(node.agent, 'purchase_prices') and len(node.agent.purchase_prices) > 0:
                avg_purchase = np.mean(node.agent.purchase_prices)
                print(f"  Consumer avg purchase price: ${avg_purchase:.1f}/MWh")
            break

    # Check a battery agent
    for node in trainer.env.grid.nodes:
        if type(node.agent).__name__ == "BatteryAgent":
            if hasattr(node.agent, 'buy_prices') and hasattr(node.agent, 'sell_prices'):
                if len(node.agent.buy_prices) > 0 and len(node.agent.sell_prices) > 0:
                    avg_buy = np.mean(node.agent.buy_prices)
                    avg_sell = np.mean(node.agent.sell_prices)
                    print(f"  Battery buy/sell spread: ${avg_sell - avg_buy:.1f}/MWh")
            break

    print("\n" + "="*60)
    print("✅ NEW REWARD SYSTEM TEST COMPLETE!")

if __name__ == "__main__":
    test_reward_system()