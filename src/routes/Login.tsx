import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Loader2 } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../contexts/AuthContext';
import { signInWithGoogle, signInWithGoogleHD } from '../services/firebase';
import { PasskeyLoginButton } from '../components/Auth/PasskeyLoginButton';
import { Passkey2FAPrompt } from '../components/Auth/Passkey2FAPrompt';
import { passkeyService } from '../services/passkeyService';
import { apiService } from '../services/api';

export default function Login() {
  useDocumentTitle('Sign In');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [show2FAPrompt, setShow2FAPrompt] = useState(false);
  const [tempToken, setTempToken] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      // Get the intended destination from URL params, default to /dashboard
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, searchParams]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Sign in with Firebase Google OAuth
      const result = await signInWithGoogle();
      
      // Extract ID token from Firebase auth result
      const idToken = await result.user.getIdToken();
      
      // Call backend login endpoint directly to check for 2FA
      const response = await apiService.login(idToken);
      
      // Check if 2FA is required
      if (response.requires2FA) {
        // Store temp token and user email, then show 2FA prompt
        setTempToken(response.tempToken);
        setUserEmail(response.user.email);
        setShow2FAPrompt(true);
      } else {
        // No 2FA required - complete login normally
        // Store JWT in localStorage
        localStorage.setItem('accessToken', response.accessToken);
        apiService.setAuthToken(response.accessToken);
        
        // Redirect to intended destination or dashboard on success
        const redirectTo = searchParams.get('redirect') || '/dashboard';
        navigate(redirectTo, { replace: true });
        
        // Force reload to update AuthContext
        window.location.href = redirectTo;
      }
    } catch (err) {
      // Display appropriate error messages on failure
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUBLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Sign in with Firebase Google OAuth with hosted domain parameter
      const result = await signInWithGoogleHD('student.ub.ac.id');
      
      // Extract ID token from Firebase auth result
      const idToken = await result.user.getIdToken();
      
      // Call backend login endpoint directly to check for 2FA
      const response = await apiService.login(idToken);
      
      // Check if 2FA is required
      if (response.requires2FA) {
        // Store temp token and user email, then show 2FA prompt
        setTempToken(response.tempToken);
        setUserEmail(response.user.email);
        setShow2FAPrompt(true);
      } else {
        // No 2FA required - complete login normally
        // Store JWT in localStorage
        localStorage.setItem('accessToken', response.accessToken);
        apiService.setAuthToken(response.accessToken);
        
        // Redirect to intended destination or dashboard on success
        const redirectTo = searchParams.get('redirect') || '/dashboard';
        navigate(redirectTo, { replace: true });
        
        // Force reload to update AuthContext
        window.location.href = redirectTo;
      }
    } catch (err) {
      // Display appropriate error messages on failure
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle successful passkey authentication
   * @param accessToken - JWT access token from passkey authentication
   * @param _user - User data from authentication (unused, will be loaded from token)
   */
  const handlePasskeySuccess = (accessToken: string, _user: { email: string; name: string }) => {
    // Store JWT in localStorage for persistence
    localStorage.setItem('accessToken', accessToken);

    // Set JWT in Authorization header for future requests
    apiService.setAuthToken(accessToken);

    // Update auth context with user data (without calling login which expects Firebase token)
    // We'll navigate directly since we already have the JWT
    
    // Redirect to intended destination or dashboard
    const redirectTo = searchParams.get('redirect') || '/dashboard';
    navigate(redirectTo, { replace: true });
    
    // Force a page reload to ensure AuthContext picks up the new token
    window.location.href = redirectTo;
  };

  /**
   * Handle passkey authentication error
   * @param errorMessage - Error message to display
   */
  const handlePasskeyError = (errorMessage: string) => {
    setError(errorMessage);
  };

  /**
   * Handle successful 2FA passkey authentication
   * @param accessToken - Full JWT access token after 2FA completion
   * @param _user - User data from authentication
   */
  const handle2FASuccess = async (accessToken: string, _user: { email: string; name: string }) => {
    try {
      // Store JWT in localStorage
      localStorage.setItem('accessToken', accessToken);
      apiService.setAuthToken(accessToken);
      
      // Redirect to intended destination or dashboard
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      navigate(redirectTo, { replace: true });
      
      // Force reload to update AuthContext
      window.location.href = redirectTo;
    } catch (err) {
      setError(err instanceof Error ? err.message : '2FA authentication failed. Please try again.');
      setShow2FAPrompt(false);
    }
  };

  /**
   * Handle 2FA prompt cancellation
   * Returns user to login page
   */
  const handle2FACancel = () => {
    setShow2FAPrompt(false);
    setTempToken('');
    setUserEmail('');
    setError(null);
  };

  // Show 2FA prompt if required
  if (show2FAPrompt) {
    return (
      <Passkey2FAPrompt
        tempToken={tempToken}
        userEmail={userEmail}
        onSuccess={handle2FASuccess}
        onCancel={handle2FACancel}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link to="/">
              <img 
                src="/logo-clouddesk.png" 
                alt="CloudDesk EDU" 
                className="h-8 sm:h-9 w-auto object-contain hover:opacity-80 transition-opacity" 
              />
            </Link>
            <Link to="/">
              <Button variant="ghost" size="sm">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Login Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
              Welcome to CloudDesk
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Sign in to access your cloud desktops
            </p>
          </div>

          {/* Login Card */}
          <Card className="p-6 sm:p-8">
            <div className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Passkey Sign-in Button - Only show if WebAuthn is supported */}
              {passkeyService.isWebAuthnSupported() && (
                <>
                  <PasskeyLoginButton
                    onSuccess={handlePasskeySuccess}
                    onError={handlePasskeyError}
                    disabled={loading}
                  />

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">or</span>
                    </div>
                  </div>
                </>
              )}

              {/* Google Sign-in Button */}
              <Button
                variant="secondary"
                size="lg"
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Sign in with Google
                  </>
                )}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              {/* Universitas Brawijaya Login Button */}
              <Button
                variant="secondary"
                size="lg"
                className="w-full"
                onClick={handleUBLogin}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Login with Universitas Brawijaya'
                )}
              </Button>
            </div>

            {/* Additional Info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-center text-gray-500">
                By signing in, you agree to our{' '}
                <Link to="/terms" className="text-indigo-600 hover:text-indigo-700">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-indigo-600 hover:text-indigo-700">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </Card>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Need help?{' '}
              <Link to="/support" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Contact Support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
