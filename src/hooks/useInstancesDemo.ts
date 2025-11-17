import { useState, useCallback, useEffect } from 'react';
import { INITIAL_INSTANCES } from '../data/instances';
import type { Instance, InstanceStatus } from '../data/types';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

const STORAGE_KEY = 'clouddesk_instances';

/**
 * Demo hook for managing instance state with localStorage persistence.
 * Provides CRUD operations for instances without backend.
 * Supports both demo mode (localStorage) and authenticated mode (API).
 */
export function useInstancesDemo() {
  // Import AuthContext to determine if user is authenticated
  const { isAuthenticated } = useAuth();
  
  // Set isDemo flag based on authentication status
  const isDemo = !isAuthenticated;
  
  // Loading and error states for API operations
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load from localStorage or use initial data (for demo mode)
  const [instances, setInstances] = useState<Instance[]>(() => {
    // Only load from localStorage in demo mode
    if (!isAuthenticated) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (error) {
        console.error('Failed to load instances from localStorage:', error);
      }
      return INITIAL_INSTANCES;
    }
    // For authenticated users, start with empty array (will be loaded from API)
    return [];
  });

  // Save to localStorage whenever instances change (demo mode only)
  useEffect(() => {
    if (isDemo) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(instances));
      } catch (error) {
        console.error('Failed to save instances to localStorage:', error);
      }
    }
  }, [instances, isDemo]);

  // Fetch instances from API when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const fetchInstances = async () => {
        setLoading(true);
        setError(null);
        try {
          const fetchedInstances = await apiService.getInstances();
          setInstances(fetchedInstances);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load instances';
          setError(errorMessage);
          console.error('Failed to fetch instances:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchInstances();
    }
  }, [isAuthenticated]);

  // Auto-transition PROVISIONING instances to RUNNING after 3-5 seconds (demo mode only)
  useEffect(() => {
    // Only auto-transition in demo mode
    if (isAuthenticated) return;

    const provisioningInstances = instances.filter(
      (instance) => instance.status === 'PROVISIONING'
    );

    if (provisioningInstances.length === 0) return;

    const timers = provisioningInstances.map((instance) => {
      // Random delay between 3-5 seconds to simulate real provisioning
      const delay = 3000 + Math.random() * 2000;
      
      return setTimeout(() => {
        setInstances((prev) =>
          prev.map((inst) =>
            inst.id === instance.id
              ? {
                  ...inst,
                  status: 'RUNNING',
                  updatedAt: new Date().toISOString(),
                }
              : inst
          )
        );
      }, delay);
    });

    // Cleanup timers on unmount or when instances change
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [instances, isAuthenticated]);

  // Poll for status updates when authenticated and have provisioning instances
  useEffect(() => {
    if (!isAuthenticated) return;

    const provisioningInstances = instances.filter(
      (instance) => instance.status === 'PROVISIONING'
    );

    if (provisioningInstances.length === 0) return;

    // Poll every 2 seconds to check for status updates
    const pollInterval = setInterval(async () => {
      try {
        const fetchedInstances = await apiService.getInstances();
        setInstances(fetchedInstances);
      } catch (err) {
        console.error('Failed to poll instances:', err);
      }
    }, 2000);

    // Cleanup interval on unmount or when instances change
    return () => {
      clearInterval(pollInterval);
    };
  }, [instances, isAuthenticated]);

  /**
   * Create a new instance with generated ID and timestamps.
   * Status defaults to PROVISIONING if not provided.
   */
  const createInstance = useCallback(
    async (
      input: Omit<Instance, 'id' | 'status' | 'createdAt' | 'updatedAt'> & {
        status?: InstanceStatus;
      }
    ): Promise<Instance> => {
      setError(null);

      // Authenticated mode: use API
      if (isAuthenticated) {
        setLoading(true);
        try {
          const createdInstance = await apiService.createInstance({
            name: input.name,
            imageId: input.imageId,
            cpuCores: input.cpuCores,
            ramGb: input.ramGb,
            storageGb: input.storageGb,
            gpu: input.gpu,
            region: input.region,
          });
          setInstances((prev) => [...prev, createdInstance]);
          return createdInstance;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to create instance';
          setError(errorMessage);
          console.error('Failed to create instance:', err);
          throw err;
        } finally {
          setLoading(false);
        }
      }

      // Demo mode: use localStorage
      const now = new Date().toISOString();
      const newInstance: Instance = {
        ...input,
        id: `inst-${Date.now()}`,
        status: input.status || 'PROVISIONING',
        createdAt: now,
        updatedAt: now,
      };

      setInstances((prev) => [...prev, newInstance]);
      return newInstance;
    },
    [isAuthenticated]
  );

  /**
   * Update the status of an existing instance.
   */
  const updateStatus = useCallback(
    async (id: string, status: InstanceStatus): Promise<void> => {
      setError(null);

      // Authenticated mode: use API
      if (isAuthenticated) {
        setLoading(true);
        try {
          const updatedInstance = await apiService.updateInstanceStatus(id, status);
          setInstances((prev) =>
            prev.map((instance) =>
              instance.id === id ? updatedInstance : instance
            )
          );
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to update instance status';
          setError(errorMessage);
          console.error('Failed to update instance status:', err);
          throw err;
        } finally {
          setLoading(false);
        }
        return;
      }

      // Demo mode: use localStorage
      setInstances((prev) =>
        prev.map((instance) =>
          instance.id === id
            ? {
                ...instance,
                status,
                updatedAt: new Date().toISOString(),
              }
            : instance
        )
      );
    },
    [isAuthenticated]
  );

  /**
   * Delete an instance by ID.
   */
  const deleteInstance = useCallback(
    async (id: string): Promise<void> => {
      setError(null);

      // Authenticated mode: use API
      if (isAuthenticated) {
        setLoading(true);
        try {
          await apiService.deleteInstance(id);
          setInstances((prev) => prev.filter((instance) => instance.id !== id));
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to delete instance';
          setError(errorMessage);
          console.error('Failed to delete instance:', err);
          throw err;
        } finally {
          setLoading(false);
        }
        return;
      }

      // Demo mode: use localStorage
      setInstances((prev) => prev.filter((instance) => instance.id !== id));
    },
    [isAuthenticated]
  );

  /**
   * Get a single instance by ID.
   */
  const getInstance = useCallback(
    (id: string) => {
      return instances.find((instance) => instance.id === id);
    },
    [instances]
  );

  return {
    instances,
    loading,
    error,
    createInstance,
    updateStatus,
    deleteInstance,
    getInstance,
    isDemo,
  };
}
