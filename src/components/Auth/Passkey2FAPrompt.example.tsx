import { Passkey2FAPrompt } from './Passkey2FAPrompt';

/**
 * Example usage of Passkey2FAPrompt component
 * 
 * This component is shown after a user successfully authenticates with Google
 * but has 2FA enabled, requiring them to also authenticate with a passkey.
 */
export default function Passkey2FAPromptExample() {
  const handleSuccess = (accessToken: string, user: { email: string; name: string }) => {
    console.log('2FA authentication successful!');
    console.log('Access Token:', accessToken);
    console.log('User:', user);
    
    // Store token and redirect to dashboard
    localStorage.setItem('accessToken', accessToken);
    window.location.href = '/dashboard';
  };

  const handleCancel = () => {
    console.log('User cancelled 2FA authentication');
    
    // Return to login page
    window.location.href = '/login';
  };

  return (
    <Passkey2FAPrompt
      tempToken="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // Temp token from Google login
      userEmail="user@example.com"
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
}
