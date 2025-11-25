import { useState, useCallback, useEffect } from 'react';
import { INITIAL_BACKUPS } from '../data/backups';
import type { Backup, BackupStatus } from '../data/types';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

const STORAGE_KEY = 'clouddesk_backups';

/**
 * Demo hook for managing backup state with localStorage persistence.
 * Provides CRUD operations for backups without backend.
 * Supports both demo mode (localStorage) and authenticated mode (API).
 */
export function useBackupsDemo() {
  // Import AuthContext to determine if user is authenticated
  const { isAuthenticated } = useAuth();
  
  // Set isDemo flag based on authentication status
  const isDemo = !isAuthenticated;
  
  // Loading and error states for API operations
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load from localStorage or use initial data (for demo mode)
  const [backups, setBackups] = useState<Backup[]>(() => {
    // Only load from localStorage in demo mode
    if (!isAuthenticated) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (error) {
        console.error('Failed to load backups from localStorage:', error);
      }
      return INITIAL_BACKUPS;
    }
    // For authenticated users, start with empty array (will be loaded from API)
    return [];
  });

  // Save to localStorage whenever backups change (demo mode only)
  useEffect(() => {
    if (isDemo) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(backups));
      } catch (error) {
        console.error('Failed to save backups to localStorage:', error);
      }
    }
  }, [backups, isDemo]);

  // Fetch backups from API when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const fetchBackups = async () => {
        setLoading(true);
        setError(null);
        try {
          const fetchedBackups = await apiService.getBackups();
          setBackups(fetchedBackups);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load backups';
          setError(errorMessage);
          console.error('Failed to fetch backups:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchBackups();
    }
  }, [isAuthenticated]);

  // Auto-transition CREATING backups to COMPLETED after 30-45 seconds (demo mode only)
  useEffect(() => {
    // Only auto-transition in demo mode
    if (isAuthenticated) return;

    const creatingBackups = backups.filter(
      (backup) => backup.status === 'CREATING'
    );

    if (creatingBackups.length === 0) return;

    const timers = creatingBackups.map((backup) => {
      // Random delay between 30-45 seconds to simulate real backup creation
      const delay = 30000 + Math.random() * 15000;
      
      return setTimeout(() => {
        setBackups((prev) =>
          prev.map((bak) =>
            bak.id === backup.id
              ? {
                  ...bak,
                  status: 'COMPLETED',
                  updatedAt: new Date().toISOString(),
                }
              : bak
          )
        );
      }, delay);
    });

    // Cleanup timers on unmount or when backups change
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [backups, isAuthenticated]);

  // Poll for status updates when authenticated and have creating backups
  useEffect(() => {
    if (!isAuthenticated) return;

    const creatingBackups = backups.filter(
      (backup) => backup.status === 'CREATING'
    );

    if (creatingBackups.length === 0) return;

    // Poll every 5 seconds to check for status updates
    const pollInterval = setInterval(async () => {
      try {
        const fetchedBackups = await apiService.getBackups();
        setBackups(fetchedBackups);
      } catch (err) {
        console.error('Failed to poll backups:', err);
      }
    }, 5000);

    // Cleanup interval on unmount or when backups change
    return () => {
      clearInterval(pollInterval);
    };
  }, [backups, isAuthenticated]);

  /**
   * Calculate current cost for a backup based on storage and time elapsed
   */
  const calculateBackupCost = useCallback((backup: Backup): number => {
    const now = new Date();
    const createdAt = new Date(backup.createdAt);
    const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    
    // Storage cost rate: Rp 1,200 per GiB per month
    // Monthly rate / 730 hours = 1200 / 730 ≈ 1.64 IDR per GiB-hour
    const storageRatePerGbHour = 1.64;
    const cost = backup.storageGb * hoursElapsed * storageRatePerGbHour;
    
    return Math.max(0, cost);
  }, []);

  /**
   * Create a new backup with generated ID and timestamps.
   * Status defaults to CREATING if not provided.
   */
  const createBackup = useCallback(
    async (
      input: {
        instanceId: string;
        name: string;
        sourceInstanceName: string;
        sourceInstanceZone: string;
        storageGb: number;
      }
    ): Promise<Backup> => {
      setError(null);

      // Authenticated mode: use API
      if (isAuthenticated) {
        setLoading(true);
        try {
          const createdBackup = await apiService.createBackup({
            instanceId: input.instanceId,
            name: input.name,
          });
          setBackups((prev) => [...prev, createdBackup]);
          return createdBackup;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to create backup';
          setError(errorMessage);
          console.error('Failed to create backup:', err);
          throw err;
        } finally {
          setLoading(false);
        }
      }

      // Demo mode: use localStorage
      const now = new Date().toISOString();
      const storageBytes = input.storageGb * 1024 * 1024 * 1024;
      const newBackup: Backup = {
        id: `bak-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        userEmail: 'demo@clouddesk.edu',
        instanceId: input.instanceId,
        name: input.name,
        gcpMachineImageName: `backup-${Date.now()}`,
        sourceInstanceName: input.sourceInstanceName,
        sourceInstanceZone: input.sourceInstanceZone,
        storageBytes,
        storageGb: input.storageGb,
        status: 'CREATING',
        createdAt: now,
        updatedAt: now,
        currentCost: 0,
      };

      setBackups((prev) => [...prev, newBackup]);
      return newBackup;
    },
    [isAuthenticated]
  );

  /**
   * Delete a backup by ID.
   */
  const deleteBackup = useCallback(
    async (id: string): Promise<void> => {
      setError(null);

      // Authenticated mode: use API
      if (isAuthenticated) {
        setLoading(true);
        try {
          await apiService.deleteBackup(id);
          setBackups((prev) => prev.filter((backup) => backup.id !== id));
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to delete backup';
          setError(errorMessage);
          console.error('Failed to delete backup:', err);
          throw err;
        } finally {
          setLoading(false);
        }
        return;
      }

      // Demo mode: use localStorage (soft delete by setting status to DELETED)
      setBackups((prev) =>
        prev.map((backup) =>
          backup.id === id
            ? {
                ...backup,
                status: 'DELETED' as BackupStatus,
                updatedAt: new Date().toISOString(),
              }
            : backup
        )
      );
    },
    [isAuthenticated]
  );

  /**
   * Get a single backup by ID.
   */
  const getBackup = useCallback(
    (id: string) => {
      return backups.find((backup) => backup.id === id);
    },
    [backups]
  );

  /**
   * Get backups with calculated current costs
   */
  const getBackupsWithCost = useCallback(() => {
    return backups.map(backup => ({
      ...backup,
      currentCost: calculateBackupCost(backup),
    }));
  }, [backups, calculateBackupCost]);

  return {
    backups: getBackupsWithCost(),
    loading,
    error,
    createBackup,
    deleteBackup,
    getBackup,
    calculateBackupCost,
    isDemo,
  };
}
