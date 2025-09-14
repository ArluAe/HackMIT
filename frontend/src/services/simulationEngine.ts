import { Node, Connection } from '@/types/simulation';

export interface SimulationData {
  timestamp: number;
  totalDemand: number;
  totalSupply: number;
  efficiency: number;
  cost: number;
  gridFrequency: number;
  carbonEmissions: number;
  renewablePercentage: number;
  gridStability: number;
  voltageLevel: number;
  powerQuality: number;
  nodeData: {
    [nodeId: string]: {
      power: number;
      demand: number;
      efficiency: number;
      status: 'active' | 'overloaded' | 'underutilized' | 'offline' | 'maintenance';
      temperature: number;
      voltage: number;
      current: number;
      powerFactor: number;
      carbonFootprint: number;
    };
  };
  weatherData: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    solarIrradiance: number;
    cloudCover: number;
  };
  marketData: {
    electricityPrice: number;
    carbonPrice: number;
    demandResponse: number;
    peakShaving: number;
  };
}

export interface SimulationMetrics {
  totalGeneration: number;
  totalConsumption: number;
  gridEfficiency: number;
  averageCost: number;
  peakDemand: number;
  peakSupply: number;
  frequencyStability: number;
  carbonIntensity: number;
  renewableShare: number;
  gridReliability: number;
  powerQuality: number;
  voltageStability: number;
  energyStorage: number;
  demandResponse: number;
  costSavings: number;
  environmentalImpact: number;
}

class SimulationEngine {
  private isRunning = false;
  private simulationData: SimulationData[] = [];
  private currentTime = 0;
  private intervalId: NodeJS.Timeout | null = null;
  private nodes: Node[] = [];
  private connections: Connection[] = [];
  private callbacks: ((data: SimulationData) => void)[] = [];

  start(nodes: Node[], connections: Connection[]) {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.nodes = nodes;
    this.connections = connections;
    this.currentTime = 0;
    this.simulationData = [];

    // Start simulation loop
    this.intervalId = setInterval(() => {
      this.tick();
    }, 1000); // Update every second
  }

  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  subscribe(callback: (data: SimulationData) => void) {
    this.callbacks.push(callback);
  }

  unsubscribe(callback: (data: SimulationData) => void) {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  getMetrics(): SimulationMetrics {
    if (this.simulationData.length === 0) {
      return {
        totalGeneration: 0,
        totalConsumption: 0,
        gridEfficiency: 0,
        averageCost: 0,
        peakDemand: 0,
        peakSupply: 0,
        frequencyStability: 0,
        carbonIntensity: 0,
        renewableShare: 0,
        gridReliability: 0,
        powerQuality: 0,
        voltageStability: 0,
        energyStorage: 0,
        demandResponse: 0,
        costSavings: 0,
        environmentalImpact: 0
      };
    }

    const latest = this.simulationData[this.simulationData.length - 1];
    const allData = this.simulationData;

    // Calculate advanced metrics
    const avgCarbonEmissions = allData.reduce((sum, d) => sum + d.carbonEmissions, 0) / allData.length;
    const avgRenewablePercentage = allData.reduce((sum, d) => sum + d.renewablePercentage, 0) / allData.length;
    const avgGridStability = allData.reduce((sum, d) => sum + d.gridStability, 0) / allData.length;
    const avgPowerQuality = allData.reduce((sum, d) => sum + d.powerQuality, 0) / allData.length;
    const avgVoltageLevel = allData.reduce((sum, d) => sum + d.voltageLevel, 0) / allData.length;
    const voltageStability = 1 - (Math.max(...allData.map(d => Math.abs(d.voltageLevel - 400))) / 400);
    
    // Calculate energy storage utilization
    const energyStorage = allData.reduce((sum, d) => {
      return sum + Object.values(d.nodeData).reduce((nodeSum: number, node: any) => {
        return nodeSum + (node.power > 0 ? node.power : 0);
      }, 0);
    }, 0) / allData.length;

    // Calculate demand response participation
    const avgDemandResponse = allData.reduce((sum, d) => sum + d.marketData.demandResponse, 0) / allData.length;
    
    // Calculate cost savings from optimization
    const baseCost = 1000 * 50; // Base cost without optimization
    const actualCost = allData.reduce((sum, d) => sum + d.cost, 0) / allData.length;
    const costSavings = Math.max(0, (baseCost - actualCost) / baseCost) * 100;
    
    // Calculate environmental impact (inverse of carbon intensity)
    const environmentalImpact = Math.max(0, 1 - (avgCarbonEmissions / 1000)) * 100;

    return {
      totalGeneration: latest.totalSupply,
      totalConsumption: latest.totalDemand,
      gridEfficiency: latest.efficiency,
      averageCost: allData.reduce((sum, d) => sum + d.cost, 0) / allData.length,
      peakDemand: Math.max(...allData.map(d => d.totalDemand)),
      peakSupply: Math.max(...allData.map(d => d.totalSupply)),
      frequencyStability: 1 - (Math.max(...allData.map(d => Math.abs(d.gridFrequency - 50))) / 50),
      carbonIntensity: avgCarbonEmissions,
      renewableShare: avgRenewablePercentage,
      gridReliability: avgGridStability * 100,
      powerQuality: avgPowerQuality * 100,
      voltageStability: voltageStability * 100,
      energyStorage: energyStorage,
      demandResponse: avgDemandResponse,
      costSavings: costSavings,
      environmentalImpact: environmentalImpact
    };
  }

  getHistoricalData(): SimulationData[] {
    return [...this.simulationData];
  }

  private tick() {
    this.currentTime += 1;
    
    // Generate realistic simulation data
    const simulationData = this.generateSimulationData();
    this.simulationData.push(simulationData);

    // Keep only last 300 data points (5 minutes at 1Hz)
    if (this.simulationData.length > 300) {
      this.simulationData = this.simulationData.slice(-300);
    }

    // Notify subscribers
    this.callbacks.forEach(callback => callback(simulationData));
  }

  private generateSimulationData(): SimulationData {
    const time = this.currentTime;
    const hourOfDay = (time % 86400) / 3600; // 24-hour cycle
    const dayOfWeek = Math.floor(time / 86400) % 7; // 0 = Sunday, 6 = Saturday

    // Generate realistic weather data
    const weatherData = this.generateWeatherData(hourOfDay, time);

    // Calculate base demand with realistic patterns
    const baseDemand = this.calculateRealisticDemand(hourOfDay, dayOfWeek, weatherData);

    // Calculate supply with weather-dependent renewable generation
    const supplyData = this.calculateRealisticSupply(weatherData, hourOfDay);

    // Calculate grid stability and power quality
    const gridStability = this.calculateGridStability(baseDemand, supplyData.totalSupply);
    const powerQuality = this.calculatePowerQuality(gridStability, supplyData.renewablePercentage);

    // Calculate environmental impact
    const carbonEmissions = this.calculateCarbonEmissions(supplyData, weatherData);
    const renewablePercentage = supplyData.renewablePercentage;

    // Calculate market data
    const marketData = this.calculateMarketData(baseDemand, supplyData.totalSupply, hourOfDay);

    // Generate detailed node data
    const nodeData = this.generateDetailedNodeData(weatherData, hourOfDay);

    // Calculate efficiency and cost
    const efficiency = supplyData.totalSupply > 0 ? Math.min(baseDemand / supplyData.totalSupply, 1) : 0;
    const cost = this.calculateRealisticCost(baseDemand, supplyData.totalSupply, marketData);

    // Grid frequency with realistic control (60 Hz base for US grid)
    const frequencyDeviation = this.calculateFrequencyDeviation(baseDemand, supplyData.totalSupply, gridStability);
    const gridFrequency = 60 + frequencyDeviation; // Changed from 50 to 60 Hz for US grid

    // Voltage level
    const voltageLevel = 400 + (Math.random() - 0.5) * 20; // 380-420V range

    return {
      timestamp: time,
      totalDemand: baseDemand,
      totalSupply: supplyData.totalSupply,
      efficiency,
      cost,
      gridFrequency,
      carbonEmissions,
      renewablePercentage,
      gridStability,
      voltageLevel,
      powerQuality,
      nodeData,
      weatherData,
      marketData
    };
  }

  private generateWeatherData(hourOfDay: number, time: number): any {
    // Realistic weather patterns
    const baseTemp = 20 + 10 * Math.sin((hourOfDay - 6) * Math.PI / 12); // Daily temperature cycle
    const temperature = baseTemp + (Math.random() - 0.5) * 4; // ±2°C variation
    
    const humidity = 60 + 20 * Math.sin(hourOfDay * Math.PI / 12) + (Math.random() - 0.5) * 10;
    const windSpeed = 5 + 10 * Math.random() * Math.sin(hourOfDay * Math.PI / 12);
    const solarIrradiance = Math.max(0, 1000 * Math.sin((hourOfDay - 6) * Math.PI / 12) * (1 - Math.random() * 0.3));
    const cloudCover = Math.random() * 100;
    
    return {
      temperature,
      humidity: Math.max(0, Math.min(100, humidity)),
      windSpeed: Math.max(0, windSpeed),
      solarIrradiance: Math.max(0, solarIrradiance),
      cloudCover
    };
  }

  private calculateRealisticDemand(hourOfDay: number, dayOfWeek: number, weather: any): number {
    // Base demand varies by day of week
    const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.85 : 1.0;

    // Temperature effect on demand (HVAC load)
    const tempEffect = Math.abs(weather.temperature - 22) * 0.02; // 2% per degree from 22°C

    // Realistic daily demand curve
    let baseDemand = 1000; // Base demand in MW

    // Peak hours with realistic patterns
    if (hourOfDay >= 7 && hourOfDay <= 9) {
      baseDemand *= 1.4; // Morning peak
    } else if (hourOfDay >= 18 && hourOfDay <= 20) {
      baseDemand *= 1.5; // Evening peak (highest)
    } else if (hourOfDay >= 12 && hourOfDay <= 14) {
      baseDemand *= 1.2; // Lunch peak
    } else if (hourOfDay >= 22 || hourOfDay <= 6) {
      baseDemand *= 0.6; // Night time
    } else {
      baseDemand *= 0.8 + (hourOfDay - 6) * 0.05; // Gradual increase
    }

    // Add realistic fluctuations
    const randomFluctuation = (Math.random() - 0.5) * 0.1; // ±5%
    const seasonalVariation = Math.sin(this.currentTime * 0.0001) * 0.1; // Seasonal cycle - fixed to use this.currentTime

    return baseDemand * weekendMultiplier * (1 + tempEffect + randomFluctuation + seasonalVariation);
  }

  private calculateRealisticSupply(weather: any, hourOfDay: number): any {
    let totalSupply = 0;
    let renewableSupply = 0;
    let conventionalSupply = 0;

    // If no nodes, generate default supply data for demo
    if (this.nodes.length === 0) {
      // Create virtual default power generation
      const solarPower = 500 * Math.max(0, Math.sin((hourOfDay - 6) * Math.PI / 12)) * (0.8 + Math.random() * 0.4);
      const windPower = 300 * Math.min(1, Math.pow(weather.windSpeed / 15, 3)) * (0.7 + Math.random() * 0.6);
      const nuclearPower = 800 * (0.95 + Math.random() * 0.1);
      const coalPower = 400 * (0.7 + Math.random() * 0.6);

      renewableSupply = solarPower + windPower;
      conventionalSupply = nuclearPower + coalPower;
      totalSupply = renewableSupply + conventionalSupply;
    } else {
      this.nodes.forEach(node => {
        if (node.type.includes('generator') || node.type === 'battery-storage') {
          const basePower = node.settings.power;
          let power = 0;

          if (node.type === 'solar-generator') {
            // Solar depends on irradiance and time of day
            const solarEfficiency = Math.max(0, weather.solarIrradiance / 1000);
            const timeEfficiency = Math.max(0, Math.sin((hourOfDay - 6) * Math.PI / 12));
            power = basePower * solarEfficiency * timeEfficiency * (0.8 + Math.random() * 0.4);
            renewableSupply += power;
          } else if (node.type === 'wind-generator') {
            // Wind depends on wind speed (cubic relationship)
            const windEfficiency = Math.min(1, Math.pow(weather.windSpeed / 15, 3));
            power = basePower * windEfficiency * (0.7 + Math.random() * 0.6);
            renewableSupply += power;
          } else if (node.type === 'hydro-generator') {
            // Hydro is more stable but varies with season
            const seasonalFactor = 0.8 + 0.4 * Math.sin(this.currentTime * 0.0001);
            power = basePower * seasonalFactor * (0.9 + Math.random() * 0.2);
            renewableSupply += power;
          } else if (node.type === 'nuclear-generator') {
            // Nuclear is very stable
            power = basePower * (0.95 + Math.random() * 0.1);
            conventionalSupply += power;
          } else if (node.type === 'coal-generator') {
            // Coal varies with demand
            power = basePower * (0.7 + Math.random() * 0.6);
            conventionalSupply += power;
          } else if (node.type === 'battery-storage') {
            // Battery behavior depends on grid state
            const isCharging = Math.random() > 0.6;
            if (isCharging) {
              power = -basePower * 0.3; // Negative = charging
            } else {
              power = basePower * 0.4; // Discharging
            }
            renewableSupply += Math.abs(power);
          }

          totalSupply += Math.abs(power);
        }
      });
    }

    const renewablePercentage = totalSupply > 0 ? (renewableSupply / totalSupply) * 100 : 0;

    return {
      totalSupply,
      renewableSupply,
      conventionalSupply,
      renewablePercentage
    };
  }

  private calculateGridStability(demand: number, supply: number): number {
    const balance = Math.abs(demand - supply) / Math.max(demand, supply);
    return Math.max(0, 1 - balance * 2); // 0-1 scale
  }

  private calculatePowerQuality(stability: number, renewablePercentage: number): number {
    // Power quality decreases with high renewable percentage and low stability
    const renewableEffect = renewablePercentage / 100 * 0.2; // 20% reduction at 100% renewable
    const stabilityEffect = (1 - stability) * 0.3; // 30% reduction at 0 stability
    return Math.max(0.5, 1 - renewableEffect - stabilityEffect);
  }

  private calculateCarbonEmissions(supplyData: any, weather: any): number {
    // Carbon intensity varies by generation type
    const renewableCarbon = supplyData.renewableSupply * 0.05; // 50g CO2/kWh
    const conventionalCarbon = supplyData.conventionalSupply * 0.8; // 800g CO2/kWh
    return renewableCarbon + conventionalCarbon;
  }

  private calculateMarketData(demand: number, supply: number, hourOfDay: number): any {
    // Electricity price varies with demand and time
    const basePrice = 50; // $/MWh base price
    const demandMultiplier = demand / 1000; // Price increases with demand
    const timeMultiplier = hourOfDay >= 18 && hourOfDay <= 20 ? 1.5 : 1.0; // Peak pricing
    const electricityPrice = basePrice * demandMultiplier * timeMultiplier * (0.8 + Math.random() * 0.4);
    
    const carbonPrice = 25 + Math.random() * 10; // $/ton CO2
    const demandResponse = Math.min(100, (demand - 800) / 2); // Demand response participation
    const peakShaving = Math.max(0, demand - 1200) * 0.1; // Peak shaving savings
    
    return {
      electricityPrice,
      carbonPrice,
      demandResponse: Math.max(0, demandResponse),
      peakShaving
    };
  }

  private generateDetailedNodeData(weather: any, hourOfDay: number): any {
    const nodeData: any = {};

    // If no nodes, generate default data for demo
    if (this.nodes.length === 0) {
      // Generate demo battery data
      for (let i = 1; i <= 3; i++) {
        const batteryId = `battery-${i}`;
        const batteryLevel = 20 + Math.random() * 60; // 20-80% charge
        const isCharging = batteryLevel < 30 || (Math.random() > 0.7);

        nodeData[batteryId] = {
          power: isCharging ? 0 : 100 * 0.4,
          demand: isCharging ? 100 * 0.3 : 0,
          efficiency: 0.9,
          status: 'active',
          temperature: weather.temperature + (Math.random() - 0.5) * 10,
          voltage: 400 + (Math.random() - 0.5) * 40,
          current: isCharging ? 100 * 0.3 / 400 : 100 * 0.4 / 400,
          powerFactor: 0.85 + Math.random() * 0.15,
          carbonFootprint: 10
        };
        nodeData[`${batteryId}_level`] = batteryLevel;
      }

      // Generate demo generator data
      nodeData['solar-1'] = {
        power: 500 * Math.max(0, Math.sin((hourOfDay - 6) * Math.PI / 12)) * (0.8 + Math.random() * 0.4),
        demand: 0,
        efficiency: 0.85,
        status: 'active',
        temperature: weather.temperature + 5,
        voltage: 400 + (Math.random() - 0.5) * 20,
        current: 2,
        powerFactor: 0.95,
        carbonFootprint: 25
      };

      nodeData['wind-1'] = {
        power: 300 * Math.min(1, Math.pow(weather.windSpeed / 15, 3)) * (0.7 + Math.random() * 0.6),
        demand: 0,
        efficiency: 0.88,
        status: 'active',
        temperature: weather.temperature,
        voltage: 400 + (Math.random() - 0.5) * 20,
        current: 1.5,
        powerFactor: 0.92,
        carbonFootprint: 20
      };

      // Generate demo consumer data
      nodeData['residential-1'] = {
        power: 0,
        demand: 200 * (0.7 + Math.random() * 0.6),
        efficiency: 1,
        status: 'active',
        temperature: weather.temperature + (Math.random() - 0.5) * 5,
        voltage: 400 + (Math.random() - 0.5) * 30,
        current: 0.8,
        powerFactor: 0.88,
        carbonFootprint: 100
      };

      return nodeData;
    }

    this.nodes.forEach(node => {
      const nodeType = node.type;
      let power = 0;
      let demand = 0;
      let status: any = 'active';
      let temperature = weather.temperature + (Math.random() - 0.5) * 10;
      let voltage = 400 + (Math.random() - 0.5) * 40;
      let current = 0;
      let powerFactor = 0.85 + Math.random() * 0.15;
      let carbonFootprint = 0;
      
      if (nodeType.includes('generator')) {
        power = node.settings.power * (0.8 + Math.random() * 0.4);
        current = power / voltage;
        carbonFootprint = power * (nodeType === 'solar-generator' ? 0.05 : 0.8);
        
        if (power > node.settings.power * 1.1) status = 'overloaded';
        else if (power < node.settings.power * 0.7) status = 'underutilized';
        else if (Math.random() < 0.01) status = 'maintenance'; // 1% chance of maintenance
      } else if (nodeType === 'factory' || nodeType === 'commercial-building' || nodeType === 'residential') {
        demand = node.settings.power * (0.7 + Math.random() * 0.6);
        current = demand / voltage;
        carbonFootprint = demand * 0.5; // Consumption carbon footprint
        
        if (demand > node.settings.power * 1.2) status = 'overloaded';
        else if (demand < node.settings.power * 0.5) status = 'underutilized';
      } else if (nodeType === 'battery-storage') {
        // More realistic battery behavior
        const batteryLevel = 20 + Math.random() * 60; // 20-80% charge
        const isCharging = batteryLevel < 30 || (Math.random() > 0.7);
        
        if (isCharging) {
          demand = node.settings.power * 0.3;
          current = demand / voltage;
          power = 0;
        } else {
          power = node.settings.power * 0.4;
          current = power / voltage;
          demand = 0;
        }
        carbonFootprint = (power + demand) * 0.1;
        
        // Store battery level for chart display
        nodeData[`${node.id}_level`] = batteryLevel;
      }
      
      nodeData[node.id] = {
        power,
        demand,
        efficiency: power > 0 ? Math.min(demand / power, 1) : 1,
        status,
        temperature,
        voltage,
        current,
        powerFactor,
        carbonFootprint
      };
    });
    
    return nodeData;
  }

  private calculateRealisticCost(demand: number, supply: number, marketData: any): number {
    const baseCost = demand * marketData.electricityPrice / 1000; // Convert to $/MWh
    const imbalanceCost = Math.abs(demand - supply) * 10; // Penalty for imbalance
    const carbonCost = marketData.carbonPrice * 0.001; // Carbon cost per MWh
    return baseCost + imbalanceCost + carbonCost;
  }

  private calculateFrequencyDeviation(demand: number, supply: number, stability: number): number {
    const imbalance = (demand - supply) / supply;
    const controlResponse = imbalance * 0.5; // Grid control response
    const randomVariation = (Math.random() - 0.5) * 0.1; // Random grid noise
    const stabilityEffect = (1 - stability) * 0.2; // Instability increases deviation
    
    return controlResponse + randomVariation + stabilityEffect;
  }

  private calculateTotalSupply(): number {
    return this.nodes
      .filter(node => node.type.includes('generator') || node.type === 'battery-storage')
      .reduce((total, node) => {
        const basePower = node.settings.power;
        const efficiency = 0.8 + Math.random() * 0.4; // 80-120% efficiency
        return total + (basePower * efficiency);
      }, 0);
  }
}

export const simulationEngine = new SimulationEngine();
