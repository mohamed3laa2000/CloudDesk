// CloudDesk EDU Data Types

export type InstanceStatus = 'PROVISIONING' | 'RUNNING' | 'STOPPED' | 'DELETED' | 'ERROR';

export type GpuType = 
  | 'NONE' 
  | 'T4' 
  | 'V100' 
  | 'A10' 
  | 'A100' 
  | 'H100' 
  | 'RTX_4090' 
  | 'RTX_A6000';

export type GpuCategory = 'NONE' | 'ENTRY' | 'PROFESSIONAL' | 'ENTERPRISE' | 'WORKSTATION';

export type Region = 
  | 'SINGAPORE'
  | 'IOWA'
  | 'US_EAST_1' 
  | 'US_EAST_2' 
  | 'US_WEST_1' 
  | 'US_WEST_2' 
  | 'EU_WEST_1' 
  | 'EU_WEST_2' 
  | 'EU_CENTRAL_1' 
  | 'EU_NORTH_1'
  | 'ASIA_PACIFIC_1' 
  | 'ASIA_PACIFIC_2' 
  | 'ASIA_PACIFIC_3'
  | 'MIDDLE_EAST_1'
  | 'SOUTH_AMERICA_1';

export interface Instance {
  id: string;
  name: string;
  imageId: string;
  status: InstanceStatus;
  cpuCores: number;
  ramGb: number;
  storageGb: number;
  gpu: GpuType;
  region: Region;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  // GCP-specific fields (optional, null for demo instances)
  gcpInstanceId?: string | null;
  gcpZone?: string | null;
  gcpMachineType?: string | null;
  gcpProjectId?: string | null;
  gcpExternalIp?: string | null;
  errorMessage?: string | null;
}

export interface ImagePreset {
  id: string;
  name: string;
  description: string;
  osName: string; // e.g., "Ubuntu 22.04 LTS", "Windows 11 Pro"
  recommendedCpu: number;
  recommendedRamGb: number;
  recommendedStorageGb: number;
  supportsGpu: boolean;
  icon?: string; // Icon identifier for UI
}

export interface PricingConfig {
  basePerCpuPerHour: number;
  basePerRamGbPerHour: number;
  basePerStorageGbPerHour: number;
  gpuExtraPerHour: Record<GpuType, number>;
  markupRate: number; // Multiplier for total cost (e.g., 1.1 for 10% markup)
}

export interface UsageRow {
  instanceId: string;
  instanceName: string;
  status: InstanceStatus;
  hours: number;
  computeHourlyRate: number;
  storageHourlyRate: number;
  avgHourlyRate: number;
  computeCost: number;
  storageCost: number;
  estimatedCost: number;
}

export interface UsageSummary {
  totalHours: number;
  totalCost: number;
  totalComputeCost: number;
  totalStorageCost: number;
  averageCostPerDesktop: number;
  activeDesktops: number;
  backupStorageCost?: number;
  backupStorageGb?: number;
  backupCount?: number;
}

export interface DailyUsage {
  date: string; // ISO date string
  cost: number;
  hours: number;
}

// Helper type for region display
export const REGION_NAMES: Record<Region, string> = {
  SINGAPORE: 'Singapore',
  IOWA: 'Iowa (US)',
  US_EAST_1: 'US East (N. Virginia)',
  US_EAST_2: 'US East (Ohio)',
  US_WEST_1: 'US West (N. California)',
  US_WEST_2: 'US West (Oregon)',
  EU_WEST_1: 'EU West (Ireland)',
  EU_WEST_2: 'EU West (London)',
  EU_CENTRAL_1: 'EU Central (Frankfurt)',
  EU_NORTH_1: 'EU North (Stockholm)',
  ASIA_PACIFIC_1: 'Asia Pacific (Singapore)',
  ASIA_PACIFIC_2: 'Asia Pacific (Tokyo)',
  ASIA_PACIFIC_3: 'Asia Pacific (Sydney)',
  MIDDLE_EAST_1: 'Middle East (Bahrain)',
  SOUTH_AMERICA_1: 'South America (São Paulo)',
};

// GCP region mapping for GCP Compute integration
export const GCP_REGION_MAPPING: Record<string, { region: string; zone: string }> = {
  'SINGAPORE': { region: 'asia-southeast1', zone: 'asia-southeast1-a' },
  'IOWA': { region: 'us-central1', zone: 'us-central1-a' },
};

// Windows password reset response type
export interface WindowsPasswordResetResponse {
  username: string;
  password: string;
  ipAddress: string;
}

// GPU specifications with detailed info
export interface GpuSpec {
  name: string;
  category: GpuCategory;
  vram: string;
  computeCapability: string;
  idealFor: string[];
  priceMultiplier: number;
}

export const GPU_SPECS: Record<GpuType, GpuSpec> = {
  NONE: {
    name: 'No GPU',
    category: 'NONE',
    vram: '0 GB',
    computeCapability: 'N/A',
    idealFor: ['General computing', 'Web development', 'Office work'],
    priceMultiplier: 0,
  },
  T4: {
    name: 'NVIDIA Tesla T4',
    category: 'ENTRY',
    vram: '16 GB GDDR6',
    computeCapability: '7.5',
    idealFor: ['ML inference', 'Light training', 'Video encoding'],
    priceMultiplier: 1.5,
  },
  V100: {
    name: 'NVIDIA Tesla V100',
    category: 'PROFESSIONAL',
    vram: '32 GB HBM2',
    computeCapability: '7.0',
    idealFor: ['Deep learning', 'HPC', 'Scientific computing'],
    priceMultiplier: 3.0,
  },
  A10: {
    name: 'NVIDIA A10',
    category: 'PROFESSIONAL',
    vram: '24 GB GDDR6',
    computeCapability: '8.6',
    idealFor: ['Graphics workloads', 'AI inference', 'Virtual workstations'],
    priceMultiplier: 2.5,
  },
  A100: {
    name: 'NVIDIA A100',
    category: 'ENTERPRISE',
    vram: '80 GB HBM2e',
    computeCapability: '8.0',
    idealFor: ['Large-scale AI training', 'HPC', 'Data analytics'],
    priceMultiplier: 5.0,
  },
  H100: {
    name: 'NVIDIA H100',
    category: 'ENTERPRISE',
    vram: '80 GB HBM3',
    computeCapability: '9.0',
    idealFor: ['Generative AI', 'LLM training', 'Advanced HPC'],
    priceMultiplier: 8.0,
  },
  RTX_4090: {
    name: 'NVIDIA GeForce RTX 4090',
    category: 'WORKSTATION',
    vram: '24 GB GDDR6X',
    computeCapability: '8.9',
    idealFor: ['3D rendering', 'Game development', 'Content creation'],
    priceMultiplier: 3.5,
  },
  RTX_A6000: {
    name: 'NVIDIA RTX A6000',
    category: 'WORKSTATION',
    vram: '48 GB GDDR6',
    computeCapability: '8.6',
    idealFor: ['Professional visualization', 'CAD', 'Ray tracing'],
    priceMultiplier: 4.0,
  },
};

// Helper to get GPU name
export function getGpuName(type: GpuType): string {
  return GPU_SPECS[type].name;
}

// Helper to get GPUs by category
export function getGpusByCategory(category: GpuCategory): GpuType[] {
  return Object.entries(GPU_SPECS)
    .filter(([_, spec]) => spec.category === category)
    .map(([type]) => type as GpuType);
}

// Backup-related types
export type BackupStatus = 'CREATING' | 'COMPLETED' | 'ERROR' | 'DELETED';

export interface Backup {
  id: string;
  userEmail: string;
  instanceId: string;
  name: string;
  gcpMachineImageName: string;
  sourceInstanceName: string;
  sourceInstanceZone: string;
  storageBytes: number;
  storageGb: number; // Calculated field
  status: BackupStatus;
  errorMessage?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  currentCost: number; // Calculated field
}

export interface CreateBackupRequest {
  instanceId: string;
  name: string;
}

export interface RestoreBackupRequest {
  instanceName: string;
  zone: string;
}

export interface BackupCostSummary {
  totalBackupStorageCost: number;
  totalBackupStorageGb: number;
  backupCount: number;
  costByBackup: Array<{
    backupId: string;
    backupName: string;
    storageGb: number;
    cost: number;
  }>;
}
