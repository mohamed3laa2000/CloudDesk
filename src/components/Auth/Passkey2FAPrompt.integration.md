# Passkey2FAPrompt Integration Guide

## Overview

The `Passkey2FAPrompt` component handles the second factor authentication step when a user has 2FA enabled. It should be shown after successful Google OAuth login when the backend returns `requires2FA: true`.

## Integration Steps

### 1. Update Login Flow

In your login page (e.g., `src/routes/Login.tsx`), modify the Google login handler to check for 2FA requirement:

```typescript
const handleGoogleLogin = async () => {
  setLoading(true);
  setError(null);
  
  try {
    // Sign in with Firebase Google OAuth
    const result = await signInWithGoogle();
    const idToken = await result.user.getIdToken();
    
    // Call backend login endpoint
    const response = await apiService.login(idToken);
    
    // Check if 2FA is required
    if (response.requires2FA) {
      // Store temp token and user email
      setTempToken(response.tempToken);
      setUserEmail(response.user.email);
      setShow2FAPrompt(true);
      return;
    }
    
    // Normal login flow (no 2FA)
    const { accessToken, user } = response;
    localStorage.setItem('accessToken', accessToken);
    apiService.setAuthToken(accessToken);
    navigate('/dashboard');
    
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Authentication failed');
  } finally {
    setLoading(false);
  }
};
```

### 2. Add State Management

Add state variables to track 2FA flow:

```typescript
const [show2FAPrompt, setShow2FAPrompt] = useState(false);
const [tempToken, setTempToken] = useState<string>('');
const [userEmail, setUserEmail] = useState<string>('');
```

### 3. Conditional Rendering

Render the 2FA prompt when needed:

```typescript
// In your component's return statement
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

// Otherwise render normal login page
return (
  <div>
    {/* Normal login UI */}
  </div>
);
```

### 4. Handle Success and Cancel

Implement the callback handlers:

```typescript
const handle2FASuccess = (accessToken: string, user: { email: string; name: string }) => {
  // Store JWT
  localStorage.setItem('accessToken', accessToken);
  apiService.setAuthToken(accessToken);
  
  // Navigate to dashboard
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  navigate(redirectTo, { replace: true });
  
  // Optionally reload to ensure AuthContext picks up the token
  window.location.href = redirectTo;
};

const handle2FACancel = () => {
  // Clear 2FA state
  setShow2FAPrompt(false);
  setTempToken('');
  setUserEmail('');
  
  // Optionally show a message
  setError('Authentication cancelled. Please try again.');
};
```

## Backend Response Format

The backend should return this format when 2FA is required:

```json
{
  "success": true,
  "requires2FA": true,
  "tempToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

## Component Props

- `tempToken` (string): Temporary JWT token from Google login (5-minute expiration)
- `userEmail` (string): User's email address to display
- `onSuccess` (function): Called when passkey authentication succeeds with `(accessToken, user)`
- `onCancel` (function): Called when user clicks cancel button

## User Experience

1. User clicks "Sign in with Google"
2. Google OAuth completes successfully
3. Backend checks if user has 2FA enabled
4. If yes, backend returns temp token and `requires2FA: true`
5. Frontend shows `Passkey2FAPrompt` component
6. User authenticates with their passkey
7. Backend verifies passkey and returns full JWT
8. User is redirected to dashboard

## Error Handling

The component handles these error scenarios:

- **User cancels authentication**: Shows error message, allows retry
- **Passkey not recognized**: Shows error message, allows retry
- **Network error**: Shows error message, allows retry
- **User clicks cancel button**: Calls `onCancel` to return to login

## Requirements Validated

- **8.1**: Prompts for passkey after Google login when 2FA enabled
- **8.3**: Allows retry on failure without requiring Google re-authentication
- **8.5**: Provides cancel button to return to login page
