import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type { Instance, InstanceStatus, UsageSummary, UsageRow, WindowsPasswordResetResponse, Backup, CreateBackupRequest, RestoreBackupRequest } from '../data/types';
import type { UserPreferences, ProfileUpdateData } from '../types/preferences';

// Callback function for handling logout on 401 errors
// This will be set by the Auth Context when it initializes
let onUnauthorizedCallback: (() => void) | null = null;

// Create Axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  // Use empty baseURL to make requests relative to current domain
  // This allows the app to work both locally and through Cloudflare Tunnel
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true, // Enable sending cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token to Authorization header
apiClient.interceptors.request.use(
  (config) => {
    // JWT token is automatically included via setAuthToken method
    // which sets it in apiClient.defaults.headers.common['Authorization']
    return config;
  },
  (error) => {
    // Handle request errors
    return Promise.reject(error);
  }
);

// GCP Error codes from backend
const GCP_ERROR_CODES = {
  AUTH_ERROR: 'GCP_AUTH_ERROR',
  PERMISSION_ERROR: 'GCP_PERMISSION_ERROR',
  QUOTA_ERROR: 'GCP_QUOTA_ERROR',
  NOT_FOUND: 'GCP_NOT_FOUND',
  TIMEOUT: 'GCP_TIMEOUT',
  INVALID_CONFIG: 'GCP_INVALID_CONFIG',
  COMMAND_ERROR: 'GCP_COMMAND_ERROR',
  SDK_NOT_INSTALLED: 'GCP_SDK_NOT_INSTALLED',
  ZONE_EXHAUSTED: 'GCP_ZONE_EXHAUSTED'
};

/**
 * Get user-friendly error message for GCP errors
 * @param errorCode - GCP error code from backend
 * @param defaultMessage - Default message if no specific mapping exists
 * @returns User-friendly error message
 */
const getGcpErrorMessage = (errorCode: string, defaultMessage: string): string => {
  switch (errorCode) {
    case GCP_ERROR_CODES.AUTH_ERROR:
      return 'GCP authentication failed. The system needs to be re-authenticated with Google Cloud. Please contact your administrator.';
    case GCP_ERROR_CODES.PERMISSION_ERROR:
      return 'Insufficient permissions to perform this operation. Your account may not have the required GCP permissions. Please contact your administrator.';
    case GCP_ERROR_CODES.QUOTA_ERROR:
      return 'GCP resource quota exceeded. You may have reached your limit for VMs in this region. Try selecting a different region or contact support to increase your quota.';
    case GCP_ERROR_CODES.ZONE_EXHAUSTED:
      return 'The selected machine configuration is currently unavailable in this zone due to high demand. Please try selecting a different region or try again later.';
    case GCP_ERROR_CODES.NOT_FOUND:
      return 'The VM instance was not found in Google Cloud. It may have been deleted externally or there may be a synchronization issue.';
    case GCP_ERROR_CODES.TIMEOUT:
      return 'The operation timed out. This can happen with slow network connections or when GCP is experiencing high load. Please try again in a few moments.';
    case GCP_ERROR_CODES.INVALID_CONFIG:
      return 'Invalid VM configuration. The selected combination of resources may not be available in the chosen region. Please try adjusting your configuration.';
    case GCP_ERROR_CODES.SDK_NOT_INSTALLED:
      return 'GCP SDK is not properly configured on the server. Please contact your administrator to resolve this issue.';
    case GCP_ERROR_CODES.COMMAND_ERROR:
      return defaultMessage || 'An error occurred while communicating with Google Cloud. Please try again or contact support if the problem persists.';
    default:
      return defaultMessage;
  }
};

// Response interceptor to handle 401 errors, network issues, and GCP-specific errors
apiClient.interceptors.response.use(
  (response) => {
    // Pass through successful responses
    return response;
  },
  (error: AxiosError<{ message?: string; error?: string; details?: any }>) => {
    // Handle 401 Unauthorized errors (invalid or expired token)
    if (error.response?.status === 401) {
      console.error('Unauthorized: Token is invalid or expired');
      
      // Trigger logout callback if set by Auth Context
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
      
      // Enhance error with user-friendly message
      error.message = 'Your session has expired. Please log in again.';
      return Promise.reject(error);
    }
    
    // Handle network errors (no response from server)
    if (!error.response) {
      console.error('Network error: Unable to connect to server');
      error.message = 'Unable to connect to server. Please check your internet connection and try again.';
      return Promise.reject(error);
    }
    
    // Check if this is a GCP-specific error
    const responseData = error.response.data;
    const gcpErrorCode = responseData?.error;
    
    if (gcpErrorCode && Object.values(GCP_ERROR_CODES).includes(gcpErrorCode)) {
      // This is a GCP error - use specialized error message
      const serverMessage = responseData?.message || '';
      error.message = getGcpErrorMessage(gcpErrorCode, serverMessage);
      
      // Log GCP error details for debugging
      console.error('GCP Error:', {
        code: gcpErrorCode,
        message: error.message,
        details: responseData?.details
      });
      
      return Promise.reject(error);
    }
    
    // Handle other HTTP errors with user-friendly messages
    const statusCode = error.response.status;
    let userMessage = 'An error occurred. Please try again.';
    
    switch (statusCode) {
      case 403:
        userMessage = 'Access denied. Your email is not authorized.';
        break;
      case 404:
        userMessage = 'The requested resource was not found.';
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        userMessage = 'Server error. Please try again later.';
        break;
    }
    
    // Use server-provided message if available, otherwise use user-friendly message
    error.message = error.response.data?.message || userMessage;
    return Promise.reject(error);
  }
);

// API service methods
export const apiService = {
  /**
   * Login with Firebase ID token
   * @param idToken - Firebase ID token from authentication
   * @returns Promise with JWT access token and user data
   */
  login: async (idToken: string) => {
    const response = await apiClient.post('/api/auth/login', { idToken });
    return response.data;
  },

  /**
   * Verify current JWT token
   * @returns Promise with user data if token is valid
   */
  verifyToken: async () => {
    const response = await apiClient.post('/api/auth/verify');
    return response.data;
  },

  /**
   * Logout - clears httpOnly cookie on backend
   * @returns Promise with success message
   */
  logout: async () => {
    const response = await apiClient.post('/api/auth/logout');
    return response.data;
  },

  /**
   * Set JWT token in Authorization header for subsequent requests
   * @param token - JWT access token
   */
  setAuthToken: (token: string) => {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },

  /**
   * Clear JWT token from Authorization header
   */
  clearAuthToken: () => {
    delete apiClient.defaults.headers.common['Authorization'];
  },

  /**
   * Set callback function to be called on 401 Unauthorized errors
   * This should be set by the Auth Context to trigger logout
   * @param callback - Function to call when 401 error occurs
   */
  setUnauthorizedCallback: (callback: () => void) => {
    onUnauthorizedCallback = callback;
  },

  /**
   * Clear the unauthorized callback
   */
  clearUnauthorizedCallback: () => {
    onUnauthorizedCallback = null;
  },

  // Instance API methods

  /**
   * Get all instances for the authenticated user
   * @returns Promise with array of instances
   */
  getInstances: async (): Promise<Instance[]> => {
    const response = await apiClient.get('/api/instances');
    return response.data.instances;
  },

  /**
   * Create a new instance
   * @param instanceData - Instance configuration data
   * @returns Promise with created instance
   */
  createInstance: async (instanceData: {
    name: string;
    imageId: string;
    cpuCores: number;
    ramGb: number;
    storageGb: number;
    gpu: string;
    region: string;
  }): Promise<Instance> => {
    const response = await apiClient.post('/api/instances', instanceData);
    return response.data.instance;
  },

  /**
   * Update instance status
   * @param id - Instance ID
   * @param status - New status
   * @returns Promise with updated instance
   */
  updateInstanceStatus: async (id: string, status: InstanceStatus): Promise<Instance> => {
    const response = await apiClient.patch(`/api/instances/${id}/status`, { status });
    return response.data.instance;
  },

  /**
   * Delete an instance (soft delete)
   * @param id - Instance ID
   * @returns Promise with success message
   */
  deleteInstance: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/api/instances/${id}`);
    return response.data;
  },

  /**
   * Get a single instance by ID
   * @param id - Instance ID
   * @returns Promise with instance details
   */
  getInstance: async (id: string): Promise<Instance> => {
    const response = await apiClient.get(`/api/instances/${id}`);
    return response.data.instance;
  },

  /**
   * Reset Windows password for an instance
   * @param id - Instance ID
   * @param username - Windows username
   * @returns Promise with password reset data (username, password, ipAddress)
   */
  resetWindowsPassword: async (id: string, username: string): Promise<WindowsPasswordResetResponse> => {
    const response = await apiClient.post(`/api/instances/${id}/reset-password`, { username });
    return response.data.data;
  },

  // Billing API methods

  /**
   * Get usage summary for the authenticated user
   * @returns Promise with usage summary including total hours, cost, and breakdown
   */
  getUsageSummary: async (): Promise<UsageSummary & { usageByInstance: UsageRow[] }> => {
    const response = await apiClient.get('/api/billing/usage');
    return response.data;
  },

  // Preferences API methods

  /**
   * Get user preferences
   * @returns Promise with user preferences
   */
  getUserPreferences: async (): Promise<UserPreferences> => {
    const response = await apiClient.get('/api/users/preferences');
    return response.data.preferences;
  },

  /**
   * Update user preferences
   * @param preferences - Partial preferences to update
   * @returns Promise with updated preferences
   */
  updateUserPreferences: async (preferences: Partial<UserPreferences>): Promise<UserPreferences> => {
    const response = await apiClient.put('/api/users/preferences', preferences);
    return response.data.preferences;
  },

  /**
   * Update user profile
   * @param data - Profile data to update
   * @returns Promise with updated user data
   */
  updateUserProfile: async (data: ProfileUpdateData): Promise<{ email: string; name: string }> => {
    const response = await apiClient.put('/api/users/profile', data);
    return response.data.user;
  },

  // Backup API methods

  /**
   * Get all backups for the authenticated user
   * @returns Promise with array of backups
   */
  getBackups: async (): Promise<Backup[]> => {
    const response = await apiClient.get('/api/backups');
    return response.data.backups;
  },

  /**
   * Create a new backup
   * @param backupData - Backup configuration data
   * @returns Promise with created backup
   */
  createBackup: async (backupData: CreateBackupRequest): Promise<Backup> => {
    const response = await apiClient.post('/api/backups', backupData);
    return response.data.backup;
  },

  /**
   * Get a single backup by ID
   * @param id - Backup ID
   * @returns Promise with backup details
   */
  getBackup: async (id: string): Promise<Backup> => {
    const response = await apiClient.get(`/api/backups/${id}`);
    return response.data.backup;
  },

  /**
   * Delete a backup
   * @param id - Backup ID
   * @returns Promise with success message
   */
  deleteBackup: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/api/backups/${id}`);
    return response.data;
  },

  /**
   * Restore a backup to create a new instance
   * @param id - Backup ID
   * @param restoreData - Restore configuration data (instanceName, zone)
   * @returns Promise with created instance
   */
  restoreBackup: async (id: string, restoreData: RestoreBackupRequest): Promise<Instance> => {
    const response = await apiClient.post(`/api/backups/${id}/restore`, restoreData);
    return response.data.instance;
  },
};

export default apiClient;
