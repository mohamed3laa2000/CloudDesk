import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Props for AuthGuard component
 */
interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Auth Guard component that protects routes by verifying authentication
 * Redirects to /login if user is not authenticated
 * Shows loading spinner while checking authentication status
 * 
 * Requirements: 4.2, 4.3, 4.5
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-sm text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to /login if not authenticated
  if (!isAuthenticated) {
    // Save the current location to redirect back after login
    const redirectUrl = `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`;
    return <Navigate to={redirectUrl} replace />;
  }

  // Render children if authenticated
  return <>{children}</>;
};
