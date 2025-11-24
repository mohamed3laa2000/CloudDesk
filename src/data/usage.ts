import type { Instance, UsageRow, UsageSummary, DailyUsage, PricingConfig } from './types';
import { calculateHourlyCost, calculateCostForHours, PRICING_CONFIG } from './pricing';

/**
 * Hard-coded usage hours for demo instances
 * Maps instance ID to hours used in the current period
 */
const DEMO_USAGE_HOURS: Record<string, number> = {
  'inst-001': 42.5, // Ubuntu 22.04 LTS
  'inst-002': 38.0, // Windows 11 Pro
  'inst-003': 28.5, // Data Science ML
  'inst-004': 22.0, // Development Env
  'inst-005': 11.5, // 3D Rendering
  'inst-006': 0.0, // Testing Environment (just provisioned)
};

/**
 * Calculate billable hours for an instance
 * Matches backend logic: from created_at to now (or updated_at for deleted instances)
 */
function calculateUsageHours(instance: Instance): number {
  // If we have hardcoded demo data, use it for demo instances
  if (DEMO_USAGE_HOURS[instance.id] !== undefined) {
    return DEMO_USAGE_HOURS[instance.id];
  }
  
  // Calculate billable hours based on time elapsed since creation
  // This matches the backend calculateBillableHours logic
  const created = new Date(instance.createdAt);
  const endTime = instance.status === 'DELETED' 
    ? new Date(instance.updatedAt || Date.now())  // Use deletion time for deleted instances
    : new Date();  // Use current time for active instances
  
  const diffMs = endTime.getTime() - created.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  // Round to 2 decimal places, ensure non-negative
  return Math.max(0, Math.round(diffHours * 100) / 100);
}

/**
 * Build usage data for all instances
 */
export function buildUsage(instances: Instance[], _pricing?: PricingConfig): UsageRow[] {
  return instances.map((instance) => {
    const hours = calculateUsageHours(instance);
    
    // Calculate compute hourly rate (CPU + RAM + GPU)
    const cpuCost = instance.cpuCores * PRICING_CONFIG.basePerCpuPerHour;
    const ramCost = instance.ramGb * PRICING_CONFIG.basePerRamGbPerHour;
    const gpuCost = PRICING_CONFIG.gpuExtraPerHour[instance.gpu];
    const computeHourlyRate = (cpuCost + ramCost + gpuCost) * PRICING_CONFIG.markupRate;
    
    // Calculate storage hourly rate
    const storageHourlyRate = instance.storageGb * PRICING_CONFIG.basePerStorageGbPerHour * PRICING_CONFIG.markupRate;
    
    // Calculate total hourly rate
    const avgHourlyRate = calculateHourlyCost(instance);
    
    // Calculate costs for the hours used
    const computeCost = Math.round(computeHourlyRate * hours * 100) / 100;
    const storageCost = Math.round(storageHourlyRate * hours * 100) / 100;
    const estimatedCost = calculateCostForHours(instance, hours);

    return {
      instanceId: instance.id,
      instanceName: instance.name,
      status: instance.status,
      hours,
      computeHourlyRate: Math.round(computeHourlyRate * 100) / 100,
      storageHourlyRate: Math.round(storageHourlyRate * 1000) / 1000,
      avgHourlyRate,
      computeCost,
      storageCost,
      estimatedCost,
    };
  });
}

/**
 * Calculate usage summary from usage rows
 */
export function calculateUsageSummary(usageRows: UsageRow[]): UsageSummary {
  const totalHours = usageRows.reduce((sum, row) => sum + row.hours, 0);
  const totalCost = usageRows.reduce((sum, row) => sum + row.estimatedCost, 0);
  const totalComputeCost = usageRows.reduce((sum, row) => sum + row.computeCost, 0);
  const totalStorageCost = usageRows.reduce((sum, row) => sum + row.storageCost, 0);
  const activeDesktops = usageRows.filter((row) => row.hours > 0).length;
  const averageCostPerDesktop = activeDesktops > 0 ? totalCost / activeDesktops : 0;

  return {
    totalHours: Math.round(totalHours * 10) / 10,
    totalCost: Math.round(totalCost * 100) / 100,
    totalComputeCost: Math.round(totalComputeCost * 100) / 100,
    totalStorageCost: Math.round(totalStorageCost * 100) / 100,
    averageCostPerDesktop: Math.round(averageCostPerDesktop * 100) / 100,
    activeDesktops,
  };
}

/**
 * Generate daily usage data for the last 30 days
 * This creates a realistic-looking chart with variation
 */
export function generateDailyUsage(_instances?: Instance[]): DailyUsage[] {
  const dailyData: DailyUsage[] = [];
  const today = new Date('2025-01-20'); // Fixed date for demo consistency

  // Base daily costs with realistic variation (in IDR)
  const baseDailyCosts = [
    30710, 35192, 40670, 31872, 36188, 27390, 23572, // Week 1 (weekend lower)
    39010, 42828, 45152, 40670, 39508, 31208, 25730, // Week 2
    40172, 43990, 47808, 41832, 40670, 32370, 27888, // Week 3
    42330, 46148, 51792, 47310, 43492, 35690, 30212, // Week 4
    44492, 48472, // Last 2 days
  ];

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const cost = baseDailyCosts[29 - i] || 33200;
    const hours = Math.round((cost / 6972) * 10) / 10; // Approximate hours based on avg rate (0.42 USD * 16600 = 6972 IDR)

    dailyData.push({
      date: date.toISOString().split('T')[0],
      cost: Math.round(cost * 100) / 100,
      hours: Math.round(hours * 10) / 10,
    });
  }

  return dailyData;
}

/**
 * Get usage for a specific instance
 */
export function getInstanceUsage(instanceId: string): number {
  return DEMO_USAGE_HOURS[instanceId] || 0;
}

/**
 * Calculate total storage used across all instances
 */
export function calculateTotalStorage(instances: Instance[]): number {
  return instances.reduce((sum, instance) => sum + instance.storageGb, 0);
}

/**
 * Get instances sorted by cost (highest first)
 */
export function sortInstancesByCost(usageRows: UsageRow[]): UsageRow[] {
  return [...usageRows].sort((a, b) => b.estimatedCost - a.estimatedCost);
}

/**
 * Get instances sorted by hours (highest first)
 */
export function sortInstancesByHours(usageRows: UsageRow[]): UsageRow[] {
  return [...usageRows].sort((a, b) => b.hours - a.hours);
}
