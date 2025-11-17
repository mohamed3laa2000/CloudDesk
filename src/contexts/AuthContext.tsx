import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiService } from '../services/api';
import { signOut as firebaseSignOut } from '../services/firebase';

/**
 * User interface representing authenticated user data
 */
export interface User {
  email: string;
  name: string;
}

/**
 * Auth Context value interface defining available state and methods
 */
export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

/**
 * Auth Context for managing authentication state globally
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Props for AuthProvider component
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component that wraps the app and provides authentication state
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  /**
   * Login method - sends Firebase ID token to backend and receives JWT
   * @param idToken - Firebase ID token from authentication
   */
  const login = async (idToken: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Send Firebase ID token to backend
      const response = await apiService.login(idToken);

      // Extract user data and JWT from response
      const { accessToken, user: userData } = response;

      // Store JWT in localStorage for persistence across page refreshes
      localStorage.setItem('accessToken', accessToken);

      // Store JWT in Authorization header for future requests
      apiService.setAuthToken(accessToken);

      // Update user state
      setUser({
        email: userData.email,
        name: userData.name,
      });

      setIsAuthenticated(true);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
      setUser(null);
      setIsAuthenticated(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout method - clears JWT, signs out from Firebase, and resets state
   */
  const logout = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Call API to clear httpOnly cookie
      try {
        await apiService.logout();
      } catch (err) {
        // Log error but continue with logout even if API call fails
        console.error('Error clearing httpOnly cookie:', err);
      }

      // Sign out from Firebase
      await firebaseSignOut();

      // Clear JWT from localStorage
      localStorage.removeItem('accessToken');

      // Clear JWT from Authorization header
      apiService.clearAuthToken();

      // Reset user state
      setUser(null);
      setIsAuthenticated(false);

      // Redirect to landing page
      window.location.href = '/';
    } catch (err: any) {
      console.error('Logout error:', err);
      setError(err.message || 'Logout failed. Please try again.');
      
      // Even if there's an error, ensure we clear state and redirect
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('accessToken');
      apiService.clearAuthToken();
      window.location.href = '/';
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check authentication status on app initialization
   * Verifies stored JWT and restores user state if valid
   */
  const checkAuth = async (): Promise<void> => {
    setLoading(true);

    try {
      // Try to restore JWT from localStorage
      const storedToken = localStorage.getItem('accessToken');
      
      if (!storedToken) {
        // No token stored, user is not authenticated
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      // Set token in Authorization header
      apiService.setAuthToken(storedToken);

      // Verify stored JWT with backend
      const response = await apiService.verifyToken();

      // Restore user state if token is valid
      setUser({
        email: response.user.email,
        name: response.user.name,
      });

      setIsAuthenticated(true);
    } catch (err: any) {
      console.error('Auth check failed:', err);
      // Clear state if token is invalid or expired
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('accessToken');
      apiService.clearAuthToken();
    } finally {
      setLoading(false);
    }
  };

  /**
   * Set up unauthorized callback for automatic logout on 401 errors
   */
  useEffect(() => {
    // Set callback to handle 401 errors from API
    apiService.setUnauthorizedCallback(() => {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('accessToken');
      apiService.clearAuthToken();
    });

    // Check authentication status on mount
    checkAuth();

    // Cleanup callback on unmount
    return () => {
      apiService.clearUnauthorizedCallback();
    };
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use Auth Context
 * @returns AuthContextValue with user state and methods
 * @throws Error if used outside AuthProvider
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
