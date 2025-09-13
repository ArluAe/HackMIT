# ⚡ Energy Agent System — Implementation Guide

## 1. System Overview
This system implements **multi-agent reinforcement learning** for energy grid simulation with four competing agent types using a unified architecture.

### Agent Types & Objectives
- **🏭 Producers**: Maximize profit while competing for market dominance
- **🏠 Consumers**: Grid stability focused, price-agnostic electricity consumption
- **🏢 Businesses**: Cost-conscious electricity consumers with operational flexibility
- **🔋 Batteries**: Exploit price volatility and create market inefficiencies

### RL Architecture
Each agent implements a streamlined interface through `BaseAgent`:
1. **`act(state)`**: Single method that gets observation, computes policy decision, and executes action → returns `startup_rate * action`
2. **`compute_reward(state, all_agents)`**: Calculate reward based on competition
3. **Unified Policy**: All agents use the same `Policy` class with agent-type-specific configurations

---

## 2. Implementation Details

### BaseAgent Interface (`BaseAgent.py`)
**Core attributes:**
- `agent_id`: Unique identifier for the agent
- `delta_e`: Electricity produced (+) or consumed (-) by agent
- `cost_function`: Agent-specific cost calculation function
- `episode_reward`: Cumulative reward for current episode
- `policy`: Policy instance for decision-making

**Key methods:**
- `act(state)`: Single action method that handles complete decision-making process, returns `startup_rate * action`
- `compute_reward(state, all_agents)`: Calculate competitive rewards
- `update_reward(reward)`: Accumulate episode rewards

### Unified Policy Class (`Policy.py`)
**Purpose:** Single neural network architecture adaptable to all agent types
- **Architecture**: 3-layer fully connected network (64 hidden units each)
- **Input**: Agent-type-specific observation vectors (variable dimensions)
- **Output**: Single action value in [-1, 1] range via tanh activation
- **Features**: Xavier initialization, dropout regularization, exploration noise

**Key methods:**
- `select_action(observation, training=True)`: Returns action in [-1, 1] with optional exploration noise
- `forward(x)`: Neural network forward pass
- `get_action_batch(observations)`: Batch processing for training

**Agent Type Configuration:**
- Business (type 0): 7-dimensional input
- Consumer (type 1): 5-dimensional input
- Producer (type 2): 6-dimensional input
- Battery (type 3): 7-dimensional input

---

## 3. Agent-Specific Implementations

### 🏭 ProducerAgent (`ProducerAgent.py`)

**Action Flow:**
1. `act(state)` → `_get_observation(state)` → `policy.select_action()` → scale to [0,1] → execute production
2. **Action Space:** Policy outputs [-1,1] → scale to [0,1] → `output = scaled_action × max_output`
3. **Return:** `startup_rate × action` (original [-1,1] action)

**State Observation (6 features):**
```python
global_features = [
    frequency / 60.0,           # grid stability
    temperature,                # weather conditions
    avg_cost / 10.0,            # current price
    time_of_day / 24.0          # time context
]
agent_features = [
    delta_e / max_output,       # current utilization
    episode_reward / 10.0       # performance context
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

**Action Flow:**
1. `act(state)` → `_get_observation(state)` → `policy.select_action()` → scale to [0.5,2.0] → execute consumption
2. **Action Space:** Policy outputs [-1,1] → scale to [0.5,2.0] → `consumption = scaled_action × energy_consumption`
3. **Return:** `startup_rate × action` (original [-1,1] action)

**State Observation (5 features):**
```python
global_features = [
    frequency / 60.0,           # grid stability
    temperature,                # weather conditions
    avg_cost / 10.0,            # current price (price-agnostic)
    time_of_day / 24.0          # time context
]
agent_features = [
    episode_reward / 10.0       # performance context
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

**Action Flow:**
1. `act(state)` → `_get_observation(state)` → `policy.select_action()` → scale to [0.3,1.5] → execute consumption
2. **Action Space:** Policy outputs [-1,1] → scale to [0.3,1.5] → `consumption = scaled_action × baseline_consumption`
3. **Return:** `startup_rate × action` (original [-1,1] action)

**State Observation (7 features):**
```python
global_features = [
    frequency / 60.0,           # grid stability
    temperature,                # weather conditions
    avg_cost / 10.0,            # current price (cost-sensitive!)
    time_of_day / 24.0          # time context
]
agent_features = [
    abs(delta_e) / baseline_consumption,  # consumption ratio
    episode_reward / 10.0,                # performance context
    0.0                                   # agent type identifier
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

**Action Flow:**
1. `act(state)` → `_get_observation(state)` → `policy.select_action()` → execute charge/discharge
2. **Action Space:** Policy outputs [-1,1] (perfect for battery operations)
   - Positive: charging (buying electricity)
   - Negative: discharging (selling electricity)
3. **Return:** `startup_rate × action` (original [-1,1] action)

**State Management:**
- **SoC (State of Charge)**: `[0, 1]` with efficiency losses during charging
- **Capacity constraints**: Physical limits on charge/discharge rates
- **Arbitrage tracking**: Cumulative profit from all transactions

**State Observation (7 features):**
```python
global_features = [
    frequency / 60.0,           # grid stability
    temperature,                # weather conditions
    avg_cost / 10.0,            # current price (arbitrage key!)
    time_of_day / 24.0          # time context
]
agent_features = [
    soc,                                    # current charge level
    (capacity - abs(delta_e)) / capacity,   # capacity utilization
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

## 4. Simplified Multi-Agent Environment Interaction

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

### Simplified Agent Interaction Flow
1. **Single Action Phase**: Each agent calls `act(state)` which internally:
   - Gets observation from state
   - Calls `policy.select_action(observation)`
   - Executes action and returns `delta_e`
2. **Environment Update**: Grid physics calculate new frequency, prices based on supply/demand
3. **Reward Phase**: Each agent calls `compute_reward(state, all_agents)` → receives competitive reward

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

## 5. Simplified Training Integration

### RL Algorithm Interface
Simplified training loop with unified action method:

```python
# Example integration with PPO/MADDPG
for episode in range(max_episodes):
    state = env.reset()

    for step in range(max_steps):
        # Single action call per agent - returns startup_rate * action
        actions = [agent.act(state) for agent in agents]

        # Each agent's delta_e is updated internally during act()
        delta_es = [agent.delta_e for agent in agents]

        # Update environment physics
        new_state = update_grid_physics(state, delta_es)

        # Calculate rewards
        rewards = [agent.compute_reward(new_state, agents) for agent in agents]

        # Update episode tracking
        for agent, reward in zip(agents, rewards):
            agent.update_reward(reward)

        # For training, access agent.policy directly for observations/gradients
        # Each agent's policy can be trained independently or jointly

        state = new_state
```

### Key Training Considerations

**Observation Dimensionality:**
- Producer: 6 features (4 global + 2 agent-specific)
- Consumer: 5 features (4 global + 1 agent-specific)
- Business: 7 features (4 global + 3 agent-specific)
- Battery: 7 features (4 global + 3 agent-specific)

**Policy Output & Action Scaling:**
- All policies output actions in `[-1, 1]` range (via tanh activation)
- Each agent scales to their specific operational bounds:
  - Producers: `(action + 1) / 2` → `[0, 1]` → multiply by max_output
  - Consumers: `1.25 + action * 0.75` → `[0.5, 2.0]` → multiply by energy_consumption
  - Businesses: `0.9 + action * 0.6` → `[0.3, 1.5]` → multiply by baseline_consumption
  - Batteries: `action` → `[-1, 1]` (no scaling needed, perfect range for charge/discharge)

**Reward Normalization:**
- All rewards clipped to `[-1, 1]` range
- Episode rewards tracked in `agent.episode_reward`

### Recommended Algorithms
- **MADDPG**: Handles continuous actions + multi-agent non-stationarity
- **MAPPO**: Stable training with competitive reward shaping
- **SAC**: Individual agent training with good exploration
- **Custom**: Curriculum learning starting with cooperative rewards → adversarial

---

## 6. Architecture Benefits

### Implemented Capabilities
✅ **Unified action interface** - single `act(state)` method per agent
✅ **Single Policy class** - adaptable neural network for all agent types
✅ **Agent-type-specific configurations** - tailored input dimensions and scaling
✅ **Continuous action spaces** with [-1,1] output range
✅ **Competitive reward functions** with zero-sum components
✅ **Market dynamics** through supply/demand interactions
✅ **Operational constraints** (SoC limits, capacity bounds, productivity requirements)

### Architecture Advantages
- **Unified Training**: All agents use the same Policy architecture with type-specific configurations
- **Clean Interface**: Single method call handles observation → action → execution
- **Consistent Output**: All policies output [-1,1] actions, scaled per agent type
- **Modular Design**: Easy to add new agent types by extending BaseAgent
- **Training Flexibility**: Direct policy access for custom RL algorithms

### PyTorch/RL Integration

**Training Access Pattern:**
```python
# Direct policy access for training
for agent in agents:
    observation = agent._get_observation(state)
    raw_action = agent.policy.select_action(observation, training=True)
    # Use raw_action for gradient computation

    # Or batch processing for efficiency
    batch_actions = agent.policy.get_action_batch(observation_batch)
```

**Model Persistence:**
```python
# Save/load individual agent policies
agent.policy.save_model(f"agent_{agent.agent_id}_policy.pth")
agent.policy.load_model(f"agent_{agent.agent_id}_policy.pth")
```

This implementation provides a robust foundation for multi-agent RL in energy markets, balancing simplicity with the flexibility needed for complex adversarial training scenarios.
