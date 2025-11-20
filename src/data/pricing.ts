import type { PricingConfig, Instance, GpuType } from './types';

/**
 * Pricing configuration for CloudDesk EDU
 * All prices are in USD per hour
 * Based on GCP Compute Engine pricing (approximate)
 */
export const PRICING_CONFIG: PricingConfig = {
  // Base compute costs (GCP-based pricing)
  basePerCpuPerHour: 0.0475, // $0.0475 per vCPU per hour (n1-standard pricing)
  basePerRamGbPerHour: 0.0065, // $0.0065 per GB RAM per hour (n1-standard pricing)
  basePerStorageGbPerHour: 0.00014, // $0.00014 per GB storage per hour (~$0.10/GB/month for persistent disk)

  // GPU additional costs (per hour) - GCP pricing
  gpuExtraPerHour: {
    NONE: 0.0,
    T4: 0.35,           // Entry-level ML/inference (GCP T4 pricing)
    V100: 2.48,         // Professional deep learning (GCP V100 pricing)
    A10: 1.80,          // Professional graphics/AI
    A100: 3.67,         // Enterprise AI training (GCP A100 pricing)
    H100: 8.00,         // Next-gen enterprise AI (estimated)
    RTX_4090: 2.80,     // Workstation rendering (estimated)
    RTX_A6000: 3.20,    // Professional visualization (estimated)
  },

  // Markup rate (1.0 = no markup, 1.1 = 10% markup)
  markupRate: 1.0,
};

/**
 * Calculate hourly cost for an instance
 */
export function calculateHourlyCost(instance: Instance): number {
  const cpuCost = instance.cpuCores * PRICING_CONFIG.basePerCpuPerHour;
  const ramCost = instance.ramGb * PRICING_CONFIG.basePerRamGbPerHour;
  const storageCost = instance.storageGb * PRICING_CONFIG.basePerStorageGbPerHour;
  const gpuCost = PRICING_CONFIG.gpuExtraPerHour[instance.gpu];

  const totalCost = (cpuCost + ramCost + storageCost + gpuCost) * PRICING_CONFIG.markupRate;

  return Math.round(totalCost * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate monthly cost estimate (based on 8 hours/day, 22 days/month)
 */
export function calculateMonthlyCost(instance: Instance): number {
  const hourlyCost = calculateHourlyCost(instance);
  const monthlyHours = 8 * 22; // 176 hours
  return Math.round(hourlyCost * monthlyHours * 100) / 100;
}

/**
 * Calculate cost for specific hours
 */
export function calculateCostForHours(instance: Instance, hours: number): number {
  const hourlyCost = calculateHourlyCost(instance);
  return Math.round(hourlyCost * hours * 100) / 100;
}

/**
 * Get GPU cost per hour
 */
export function getGpuCost(gpuType: GpuType): number {
  return PRICING_CONFIG.gpuExtraPerHour[gpuType];
}

/**
 * Format cost as currency string
 */
export function formatCost(cost: number): string {
  return `$${cost.toFixed(2)}`;
}

/**
 * Calculate cost breakdown for an instance
 */
export interface CostBreakdown {
  cpu: number;
  ram: number;
  storage: number;
  gpu: number;
  total: number;
}

export function calculateCostBreakdown(instance: Instance): CostBreakdown {
  const cpuCost = instance.cpuCores * PRICING_CONFIG.basePerCpuPerHour;
  const ramCost = instance.ramGb * PRICING_CONFIG.basePerRamGbPerHour;
  const storageCost = instance.storageGb * PRICING_CONFIG.basePerStorageGbPerHour;
  const gpuCost = PRICING_CONFIG.gpuExtraPerHour[instance.gpu];

  const subtotal = cpuCost + ramCost + storageCost + gpuCost;
  const total = subtotal * PRICING_CONFIG.markupRate;

  return {
    cpu: Math.round(cpuCost * 100) / 100,
    ram: Math.round(ramCost * 100) / 100,
    storage: Math.round(storageCost * 100) / 100,
    gpu: Math.round(gpuCost * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}
