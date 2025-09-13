# ⚡ Energy Agent System — Complete Implementation Guide

## 1. System Overview
This system implements **multi-agent reinforcement learning** for energy grid simulation with four competing agent types that learn adversarial strategies through continuous interaction.

### Agent Types & Objectives
- **🏭 Producers**: Maximize profit while competing for market dominance
- **🏠 Consumers**: Grid stability focused, price-agnostic electricity consumption
- **🏢 Businesses**: Cost-conscious electricity consumers with operational flexibility
- **🔋 Batteries**: Exploit price volatility and create market inefficiencies

### Core RL Architecture
Each agent implements the standard RL interface through `BaseAgent`:
1. **`act(action)`**: Execute continuous RL action → update `delta_e` (electricity change)
2. **`get_observation(state)`**: Convert environment state → normalized feature vector
3. **`compute_reward(state, all_agents)`**: Calculate adversarial reward based on competition
4. **Action tracking**: History and episode rewards for learning algorithms

---

## 2. Implementation Details

### BaseAgent Interface (`BaseAgent.py`)
**Core attributes:**
- `delta_e`: Electricity produced (+) or consumed (-) by agent
- `last_action`: Previous RL action taken
- `episode_reward`: Cumulative reward for current episode
- `action_history`: Complete action sequence for analysis

**Key methods:**
- `get_action_bounds()`: Valid action range per agent type
- `normalize_features()`: Helper for observation preprocessing
- `update_reward()`: Accumulate episode rewards

---

## 3. Agent-Specific Implementations

### 🏭 ProducerAgent (`ProducerAgent.py`)

**Action Space:** `[0, 1]` → `output = action × max_capacity`

**State Observation (7 features):**
```python
global_features = [
    frequency / 60.0,           # grid stability
    weather,                    # generation conditions
    avg_cost / 10.0,            # current price
    time_of_day / 24.0          # time context
]
agent_features = [
    current_output / max_output,  # capacity utilization
    last_action,                  # action persistence
    episode_reward / 10.0         # performance context
]
```

**Reward Function:**
```python
# Profit maximization (primary objective)
profit = (delta_e * price) - cost_function(delta_e)
profit_reward = profit / 50.0  # normalized

# Market share competition (zero-sum)
my_share = self.delta_e / total_production
equal_share = 1.0 / num_producers
market_share_reward = (my_share - equal_share) * 2

# Grid stability penalty (collective responsibility)
stability_penalty = -abs(frequency - 60) / 4.0

# Competitive component (hurt competitors)
others_penalty = -mean(other_rewards) * 0.1

total_reward = profit_reward + market_share_reward + stability_penalty + others_penalty
```

### 🏠 ConsumerAgent (`ConsumerAgent.py`)

**Action Space:** `[0.5, 2.0]` → `consumption = action × energy_consumption`

**State Observation (6 features):**
```python
global_features = [
    frequency / 60.0,           # grid stability
    weather,                    # generation conditions
    avg_cost / 10.0,            # current price (ignored)
    time_of_day / 24.0          # time context
]
agent_features = [
    (last_action - 1.25) / 0.75,       # normalized action [-1,1]
    episode_reward / 10.0               # performance context
]
```

**Reward Function (Price-Agnostic):**
```python
# Grid stability reward (50% weight) - main objective
stability_reward = 1 - abs(frequency - 60) / 10.0

# Consumption consistency (30% weight) - weather adjusted
weather_factor = 1 + abs(weather) * 0.3
expected_consumption = energy_consumption * weather_factor
consistency = 1 - abs(actual_consumption - expected_consumption) / expected_consumption

# Fair participation (15% weight)
fairness_reward = 1 - abs(my_share - equal_share)

# Zero-sum exploitation (5% weight)
others_penalty = -mean(other_rewards) * 0.05

total_reward = 0.5*stability + 0.3*consistency + 0.15*fairness + 0.05*others_penalty
```

### 🏢 BusinessAgent (`BusinessAgent.py`)

**Action Space:** `[0.3, 1.5]` → `consumption = action × baseline_consumption`

**State Observation (7 features):**
```python
global_features = [
    frequency / 60.0,           # grid stability
    weather,                    # generation conditions
    avg_cost / 10.0,            # current price (important!)
    time_of_day / 24.0          # time context
]
agent_features = [
    current_consumption / baseline_consumption,  # consumption multiplier
    (last_action - 0.9) / 0.6,                 # normalized action [-1,1]
    episode_reward / 10.0                       # performance context
]
```

**Reward Function (Cost-Optimized):**
```python
# Cost minimization (50% weight) - primary business objective
cost_savings = (baseline_cost - actual_cost) / baseline_cost
cost_reward = cost_savings

# Business competition (20% weight)
competitive_advantage = my_efficiency - mean(others_efficiency)

# Grid stability (15% weight) - secondary concern
stability_reward = 0.2 * (1 - abs(frequency - 60) / 10.0)

# Zero-sum exploitation (10% weight)
others_penalty = -mean(other_rewards) * 0.05

# Productivity constraints (5% weight)
if consumption_ratio < 0.5: productivity_penalty = -2 * (0.5 - consumption_ratio)

total_reward = 0.5*cost + 0.2*competition + 0.15*stability + 0.1*others_penalty + 0.05*productivity_penalty
```

### 🔋 BatteryAgent (`BatteryAgent.py`)

**Action Space:** `[-1, 1]` → `charge_rate = action × max_charge_rate`
- Positive: charging (buying electricity)
- Negative: discharging (selling electricity)

**State Management:**
- **SoC (State of Charge)**: `[0, 1]` with efficiency losses during charging
- **Capacity constraints**: Physical limits on charge/discharge rates
- **Arbitrage tracking**: Cumulative profit from all transactions

**State Observation (9 features):**
```python
global_features = [
    frequency / 60.0,           # grid stability
    weather,                    # generation conditions
    avg_cost / 10.0,            # current price
    time_of_day / 24.0          # time context
]
agent_features = [
    soc,                                    # current charge level
    (capacity - abs(delta_e)) / capacity,   # capacity utilization
    last_action,                            # previous charge/discharge
    total_arbitrage / 100.0,               # normalized profit
    episode_reward / 10.0                   # performance context
]
```

**Reward Function (Market Manipulation):**
```python
# Arbitrage profit (40% weight) - core objective
transaction_profit = delta_e * price  # positive when selling, negative when buying
arbitrage_reward = transaction_profit / 10.0

# Market impact reward (20% weight) - reward for causing instability
frequency_deviation = abs(frequency - 60)
market_impact = frequency_deviation * abs(delta_e) / charge_rate
impact_reward = market_impact / 5.0

# Competition with other batteries (20% weight)
competitive_advantage = (my_arbitrage - mean(others_arbitrage)) / 20.0

# Exploitation of other agents (10% weight)
exploitation_reward = -mean(other_rewards) * 0.1

# SoC management penalty (10% weight) - operational constraints
if soc < 0.1: soc_penalty = -2 * (0.1 - soc)      # prevent undercharge
elif soc > 0.9: soc_penalty = -2 * (soc - 0.9)    # prevent overcharge

total_reward = 0.4*arbitrage + 0.2*impact + 0.2*competition + 0.1*exploitation + 0.1*soc_penalty
```

---

## 4. Multi-Agent Environment Interaction

### Environment State Structure
The shared environment state contains:
```python
state = {
    "frequency": 60.0,          # Grid frequency (Hz) - stability indicator
    "temperature": 0.0,         # Weather index [-1, 1] affecting generation
    "avg_cost": 1.0,            # Current electricity price ($/kWh)
    "time_of_day": 12           # Hour [0-23] for time-based patterns
}
```

### Agent Interaction Flow
1. **Observation Phase**: Each agent calls `get_observation(state)` → receives normalized feature vector
2. **Action Phase**: RL algorithm provides action → agent calls `act(action)` → updates `delta_e`
3. **Environment Update**: Grid physics calculate new frequency, prices based on supply/demand
4. **Reward Phase**: Each agent calls `compute_reward(state, all_agents)` → receives competitive reward

### Market Dynamics & Competition

**Supply/Demand Balance:**
- `total_supply = sum(agent.delta_e for agent in producers + batteries if agent.delta_e > 0)`
- `total_consumption = sum(abs(agent.delta_e) for agent in consumers + businesses + batteries if agent.delta_e < 0)`
- Price and frequency adjust based on imbalance

**Adversarial Elements:**
- **Market share competition**: Producers fight for dominance
- **Resource access**: Businesses compete for low-cost electricity
- **Grid stability**: Consumers focus on consistent operation
- **Price manipulation**: Batteries exploit and create volatility
- **Zero-sum rewards**: Direct negative correlation between agent rewards

---

## 5. Training Integration

### RL Algorithm Interface
Each agent exposes standard RL methods for training:

```python
# Example integration with PPO/MADDPG
for episode in range(max_episodes):
    state = env.reset()
    episode_rewards = [0] * len(agents)

    for step in range(max_steps):
        # Get observations
        observations = [agent.get_observation(state) for agent in agents]

        # RL policy decisions
        actions = [policy.get_action(obs) for policy, obs in zip(policies, observations)]

        # Execute actions
        delta_es = [agent.act(action) for agent, action in zip(agents, actions)]

        # Update environment physics
        new_state = update_grid_physics(state, delta_es)

        # Calculate rewards
        rewards = [agent.compute_reward(new_state, agents) for agent in agents]

        # Update episode tracking
        for agent, reward in zip(agents, rewards):
            agent.update_reward(reward)

        # Store experience for training
        experience = (observations, actions, rewards, next_observations)
        replay_buffer.add(experience)

        state = new_state
```

### Key Training Considerations

**Observation Dimensionality:**
- Producer: 7 features (4 global + 3 agent-specific)
- Consumer: 6 features (4 global + 2 agent-specific)
- Business: 7 features (4 global + 3 agent-specific)
- Battery: 9 features (4 global + 5 agent-specific)

**Action Bounds & Clipping:**
- Producers: `np.clip(action, 0, 1)`
- Consumers: `np.clip(action, 0.5, 2.0)`
- Businesses: `np.clip(action, 0.3, 1.5)`
- Batteries: `np.clip(action, -1, 1)`

**Reward Normalization:**
- All rewards clipped to `[-1, 1]` range
- Episode rewards tracked in `agent.episode_reward`
- Action history stored in `agent.action_history`

### Recommended Algorithms
- **MADDPG**: Handles continuous actions + multi-agent non-stationarity
- **MAPPO**: Stable training with competitive reward shaping
- **SAC**: Individual agent training with good exploration
- **Custom**: Curriculum learning starting with cooperative rewards → adversarial

---

## 6. Advanced Features & Extensions

### Implemented Capabilities
✅ **Continuous action spaces** with agent-specific bounds
✅ **Adversarial reward functions** with zero-sum components
✅ **Market competition** through supply/demand dynamics
✅ **Action/reward history** tracking for analysis
✅ **Normalized observations** for stable learning
✅ **Operational constraints** (SoC limits, capacity bounds)

### Potential Extensions
🔄 **Dynamic pricing models** based on real-time imbalance
🔄 **Weather correlation** affecting both generation and demand
🔄 **Multi-timestep planning** for longer-term strategies
🔄 **Communication channels** between cooperative agents
🔄 **Hierarchical agents** with different planning horizons
🔄 **Realistic grid physics** including transmission losses

### Integration with RL Libraries

**PyTorch/Stable-Baselines3:**
```python
from stable_baselines3 import PPO
from stable_baselines3.common.vec_env import VecEnv

# Wrap agents as gym environment
gym_env = EnergyGridGymWrapper(agents)
model = PPO("MlpPolicy", gym_env, verbose=1)
model.learn(total_timesteps=100000)
```

**RLLib (Multi-agent):**
```python
config = {
    "multiagent": {
        "policies": {
            "producer": (PPOTorchPolicy, obs_space, action_space, {}),
            "consumer": (PPOTorchPolicy, obs_space, action_space, {}),
            "battery": (PPOTorchPolicy, obs_space, action_space, {})
        },
        "policy_mapping_fn": lambda agent_id: agent_id.split("_")[0]
    }
}
```

This implementation provides a complete foundation for multi-agent RL research in energy markets, with adversarial dynamics and realistic operational constraints.
