import type { Instance } from './types';

/**
 * Initial demo instances for CloudDesk EDU
 * These represent a realistic set of cloud desktops for demonstration
 */
export const INITIAL_INSTANCES: Instance[] = [
  {
    id: 'inst-001',
    name: 'Ubuntu 22.04 LTS',
    imageId: 'dev-engineering',
    status: 'RUNNING',
    cpuCores: 4,
    ramGb: 8,
    storageGb: 50,
    gpu: 'NONE',
    region: 'US_EAST_1',
    createdAt: '2025-01-15T10:30:00Z',
    updatedAt: '2025-01-20T14:22:00Z',
  },
  {
    id: 'inst-002',
    name: 'Windows 11 Pro',
    imageId: 'windows-general',
    status: 'RUNNING',
    cpuCores: 4,
    ramGb: 8,
    storageGb: 60,
    gpu: 'NONE',
    region: 'US_WEST_2',
    createdAt: '2025-01-10T08:15:00Z',
    updatedAt: '2025-01-20T09:45:00Z',
  },
  {
    id: 'inst-003',
    name: 'ML Training Workstation',
    imageId: 'data-science-ml',
    status: 'RUNNING',
    cpuCores: 16,
    ramGb: 64,
    storageGb: 500,
    gpu: 'A100',
    region: 'US_WEST_2',
    createdAt: '2025-01-12T14:20:00Z',
    updatedAt: '2025-01-20T16:30:00Z',
  },
  {
    id: 'inst-004',
    name: 'Development Env',
    imageId: 'dev-engineering',
    status: 'STOPPED',
    cpuCores: 4,
    ramGb: 8,
    storageGb: 50,
    gpu: 'NONE',
    region: 'EU_WEST_1',
    createdAt: '2025-01-08T11:00:00Z',
    updatedAt: '2025-01-19T18:00:00Z',
  },
  {
    id: 'inst-005',
    name: '3D Rendering Studio',
    imageId: '3d-rendering-cad',
    status: 'STOPPED',
    cpuCores: 12,
    ramGb: 48,
    storageGb: 1000,
    gpu: 'RTX_A6000',
    region: 'US_EAST_1',
    createdAt: '2025-01-18T09:30:00Z',
    updatedAt: '2025-01-19T22:15:00Z',
  },
  {
    id: 'inst-006',
    name: 'Testing Environment',
    imageId: 'general-purpose',
    status: 'PROVISIONING',
    cpuCores: 2,
    ramGb: 4,
    storageGb: 30,
    gpu: 'NONE',
    region: 'EU_CENTRAL_1',
    createdAt: '2025-01-20T16:45:00Z',
    updatedAt: '2025-01-20T16:45:00Z',
  },
  {
    id: 'inst-007',
    name: 'AI Research Lab',
    imageId: 'data-science-ml',
    status: 'RUNNING',
    cpuCores: 32,
    ramGb: 128,
    storageGb: 2000,
    gpu: 'H100',
    region: 'US_EAST_2',
    createdAt: '2025-01-05T09:00:00Z',
    updatedAt: '2025-01-20T11:30:00Z',
  },
  {
    id: 'inst-008',
    name: 'Video Production',
    imageId: '3d-rendering-cad',
    status: 'RUNNING',
    cpuCores: 8,
    ramGb: 32,
    storageGb: 500,
    gpu: 'RTX_4090',
    region: 'ASIA_PACIFIC_1',
    createdAt: '2025-01-14T15:20:00Z',
    updatedAt: '2025-01-20T08:45:00Z',
  },
  {
    id: 'inst-009',
    name: 'ML Inference Server',
    imageId: 'data-science-ml',
    status: 'RUNNING',
    cpuCores: 8,
    ramGb: 32,
    storageGb: 200,
    gpu: 'T4',
    region: 'EU_WEST_2',
    createdAt: '2025-01-16T12:00:00Z',
    updatedAt: '2025-01-20T10:15:00Z',
  },
  {
    id: 'inst-010',
    name: 'CAD Workstation',
    imageId: '3d-rendering-cad',
    status: 'STOPPED',
    cpuCores: 8,
    ramGb: 32,
    storageGb: 500,
    gpu: 'A10',
    region: 'ASIA_PACIFIC_2',
    createdAt: '2025-01-11T07:30:00Z',
    updatedAt: '2025-01-19T16:00:00Z',
  },
  {
    id: 'inst-011',
    name: 'GCP Windows Server',
    imageId: 'windows-general',
    status: 'RUNNING',
    cpuCores: 4,
    ramGb: 16,
    storageGb: 100,
    gpu: 'NONE',
    region: 'SINGAPORE',
    createdAt: '2025-01-19T10:00:00Z',
    updatedAt: '2025-01-20T14:30:00Z',
    // GCP metadata - this instance is managed by GCP
    gcpInstanceId: 'clouddesk-inst-011',
    gcpZone: 'asia-southeast1-a',
    gcpMachineType: 'n1-standard-4',
    gcpProjectId: 'clouddesk-demo-project',
    gcpExternalIp: '34.87.123.45',
  },
];

/**
 * Get an instance by ID
 */
export function getInstanceById(id: string): Instance | undefined {
  return INITIAL_INSTANCES.find((instance) => instance.id === id);
}

/**
 * Get instances by status
 */
export function getInstancesByStatus(status: Instance['status']): Instance[] {
  return INITIAL_INSTANCES.filter((instance) => instance.status === status);
}

/**
 * Get running instances count
 */
export function getRunningInstancesCount(): number {
  return INITIAL_INSTANCES.filter((instance) => instance.status === 'RUNNING').length;
}

/**
 * Get total instances count
 */
export function getTotalInstancesCount(): number {
  return INITIAL_INSTANCES.length;
}
