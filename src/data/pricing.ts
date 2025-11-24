import type { PricingConfig, Instance, GpuType } from './types';

/**
 * Pricing configuration for CloudDesk EDU
 * All prices are in IDR (Indonesian Rupiah) per hour
 * Based on GCP Compute Engine pricing (approximate)
 * Conversion rate: 1 USD = 16,600 IDR
 */
export const PRICING_CONFIG: PricingConfig = {
  // Base compute costs (GCP-based pricing in IDR)
  basePerCpuPerHour: 788.5, // Rp 788.5 per vCPU per hour (0.0475 USD * 16600)
  basePerRamGbPerHour: 107.9, // Rp 107.9 per GB RAM per hour (0.0065 USD * 16600)
  basePerStorageGbPerHour: 2.324, // Rp 2.324 per GB storage per hour (~Rp 1,660/GB/month for persistent disk)

  // GPU additional costs (per hour) - GCP pricing in IDR
  gpuExtraPerHour: {
    NONE: 0.0,
    T4: 5810,           // Entry-level ML/inference (0.35 USD * 16600)
    V100: 41168,        // Professional deep learning (2.48 USD * 16600)
    A10: 29880,         // Professional graphics/AI (1.80 USD * 16600)
    A100: 60922,        // Enterprise AI training (3.67 USD * 16600)
    H100: 132800,       // Next-gen enterprise AI (8.00 USD * 16600)
    RTX_4090: 46480,    // Workstation rendering (2.80 USD * 16600)
    RTX_A6000: 53120,   // Professional visualization (3.20 USD * 16600)
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
  return `Rp ${cost.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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
