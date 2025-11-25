import type { Backup } from './types';

/**
 * Initial demo backups for CloudDesk EDU
 * These represent a realistic set of machine image backups for demonstration
 */
export const INITIAL_BACKUPS: Backup[] = [
  {
    id: 'bak-1737100800-a1b2c3',
    userEmail: 'demo@clouddesk.edu',
    instanceId: 'inst-001',
    name: 'Ubuntu Pre-Production Snapshot',
    gcpMachineImageName: 'ubuntu-backup-20250117',
    sourceInstanceName: 'Ubuntu 22.04 LTS',
    sourceInstanceZone: 'us-east1-b',
    storageBytes: 53687091200, // 50 GB
    storageGb: 50,
    status: 'COMPLETED',
    createdAt: '2025-01-17T08:00:00Z',
    updatedAt: '2025-01-17T08:45:00Z',
    currentCost: 0, // Will be calculated dynamically
  },
  {
    id: 'bak-1737360000-d4e5f6',
    userEmail: 'demo@clouddesk.edu',
    instanceId: 'inst-002',
    name: 'Windows Clean Install',
    gcpMachineImageName: 'windows-backup-20250120',
    sourceInstanceName: 'Windows 11 Pro',
    sourceInstanceZone: 'us-west2-a',
    storageBytes: 64424509440, // 60 GB
    storageGb: 60,
    status: 'COMPLETED',
    createdAt: '2025-01-20T08:00:00Z',
    updatedAt: '2025-01-20T08:30:00Z',
    currentCost: 0, // Will be calculated dynamically
  },
  {
    id: 'bak-1736841600-g7h8i9',
    userEmail: 'demo@clouddesk.edu',
    instanceId: 'inst-003',
    name: 'ML Training Checkpoint',
    gcpMachineImageName: 'ml-workstation-backup-20250114',
    sourceInstanceName: 'ML Training Workstation',
    sourceInstanceZone: 'us-west2-c',
    storageBytes: 536870912000, // 500 GB
    storageGb: 500,
    status: 'COMPLETED',
    createdAt: '2025-01-14T16:00:00Z',
    updatedAt: '2025-01-14T17:30:00Z',
    currentCost: 0, // Will be calculated dynamically
  },
  {
    id: 'bak-1737273600-j1k2l3',
    userEmail: 'demo@clouddesk.edu',
    instanceId: 'inst-004',
    name: 'Dev Environment Baseline',
    gcpMachineImageName: 'dev-env-backup-20250119',
    sourceInstanceName: 'Development Env',
    sourceInstanceZone: 'europe-west1-b',
    storageBytes: 53687091200, // 50 GB
    storageGb: 50,
    status: 'COMPLETED',
    createdAt: '2025-01-19T10:00:00Z',
    updatedAt: '2025-01-19T10:40:00Z',
    currentCost: 0, // Will be calculated dynamically
  },
  {
    id: 'bak-1737446400-m4n5o6',
    userEmail: 'demo@clouddesk.edu',
    instanceId: 'inst-005',
    name: 'Rendering Studio Config',
    gcpMachineImageName: '3d-rendering-backup-20250121',
    sourceInstanceName: '3D Rendering Studio',
    sourceInstanceZone: 'us-east1-c',
    storageBytes: 1073741824000, // 1000 GB (1 TB)
    storageGb: 1000,
    status: 'COMPLETED',
    createdAt: '2025-01-21T06:00:00Z',
    updatedAt: '2025-01-21T08:15:00Z',
    currentCost: 0, // Will be calculated dynamically
  },
  {
    id: 'bak-1737475200-p7q8r9',
    userEmail: 'demo@clouddesk.edu',
    instanceId: 'inst-007',
    name: 'AI Research Snapshot',
    gcpMachineImageName: 'ai-research-backup-20250121',
    sourceInstanceName: 'AI Research Lab',
    sourceInstanceZone: 'us-east2-a',
    storageBytes: 2147483648000, // 2000 GB (2 TB)
    storageGb: 2000,
    status: 'CREATING',
    createdAt: '2025-01-21T14:00:00Z',
    updatedAt: '2025-01-21T14:00:00Z',
    currentCost: 0, // Will be calculated dynamically
  },
  {
    id: 'bak-1737187200-s1t2u3',
    userEmail: 'demo@clouddesk.edu',
    instanceId: 'inst-008',
    name: 'Video Production Archive',
    gcpMachineImageName: 'video-prod-backup-20250118',
    sourceInstanceName: 'Video Production',
    sourceInstanceZone: 'asia-east1-a',
    storageBytes: 536870912000, // 500 GB
    storageGb: 500,
    status: 'COMPLETED',
    createdAt: '2025-01-18T12:00:00Z',
    updatedAt: '2025-01-18T13:20:00Z',
    currentCost: 0, // Will be calculated dynamically
  },
  {
    id: 'bak-1737388800-v4w5x6',
    userEmail: 'demo@clouddesk.edu',
    instanceId: 'inst-009',
    name: 'ML Inference Baseline',
    gcpMachineImageName: 'ml-inference-backup-20250120',
    sourceInstanceName: 'ML Inference Server',
    sourceInstanceZone: 'europe-west2-b',
    storageBytes: 214748364800, // 200 GB
    storageGb: 200,
    status: 'ERROR',
    errorMessage: 'Insufficient quota for machine image creation in region europe-west2',
    createdAt: '2025-01-20T20:00:00Z',
    updatedAt: '2025-01-20T20:15:00Z',
    currentCost: 0, // Will be calculated dynamically
  },
  {
    id: 'bak-1736668800-y7z8a9',
    userEmail: 'demo@clouddesk.edu',
    instanceId: 'inst-010',
    name: 'CAD Workstation Setup',
    gcpMachineImageName: 'cad-workstation-backup-20250112',
    sourceInstanceName: 'CAD Workstation',
    sourceInstanceZone: 'asia-northeast1-a',
    storageBytes: 536870912000, // 500 GB
    storageGb: 500,
    status: 'COMPLETED',
    createdAt: '2025-01-12T14:00:00Z',
    updatedAt: '2025-01-12T15:30:00Z',
    currentCost: 0, // Will be calculated dynamically
  },
  {
    id: 'bak-1737014400-b1c2d3',
    userEmail: 'demo@clouddesk.edu',
    instanceId: 'inst-011',
    name: 'GCP Windows Server Backup',
    gcpMachineImageName: 'gcp-windows-backup-20250116',
    sourceInstanceName: 'GCP Windows Server',
    sourceInstanceZone: 'asia-southeast1-a',
    storageBytes: 107374182400, // 100 GB
    storageGb: 100,
    status: 'COMPLETED',
    createdAt: '2025-01-16T09:00:00Z',
    updatedAt: '2025-01-16T09:45:00Z',
    currentCost: 0, // Will be calculated dynamically
  },
];

/**
 * Get a backup by ID
 */
export function getBackupById(id: string): Backup | undefined {
  return INITIAL_BACKUPS.find((backup) => backup.id === id);
}

/**
 * Get backups by instance ID
 */
export function getBackupsByInstanceId(instanceId: string): Backup[] {
  return INITIAL_BACKUPS.filter((backup) => backup.instanceId === instanceId);
}

/**
 * Get backups by status
 */
export function getBackupsByStatus(status: Backup['status']): Backup[] {
  return INITIAL_BACKUPS.filter((backup) => backup.status === status);
}

/**
 * Get completed backups count
 */
export function getCompletedBackupsCount(): number {
  return INITIAL_BACKUPS.filter((backup) => backup.status === 'COMPLETED').length;
}

/**
 * Get total backups count (excluding DELETED)
 */
export function getTotalBackupsCount(): number {
  return INITIAL_BACKUPS.filter((backup) => backup.status !== 'DELETED').length;
}

/**
 * Get total backup storage in GB
 */
export function getTotalBackupStorageGb(): number {
  return INITIAL_BACKUPS
    .filter((backup) => backup.status !== 'DELETED')
    .reduce((total, backup) => total + backup.storageGb, 0);
}
