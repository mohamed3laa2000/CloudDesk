import axios, { type AxiosInstance, type AxiosError } from 'axios';

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

// Response interceptor to handle 401 errors and network issues
apiClient.interceptors.response.use(
  (response) => {
    // Pass through successful responses
    return response;
  },
  (error: AxiosError<{ message?: string }>) => {
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
      error.message = 'Unable to connect to server. Please check your connection.';
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
};

export default apiClient;
