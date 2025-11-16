import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut
} from 'firebase/auth';
import type { Auth, UserCredential, User } from 'firebase/auth';

/**
 * Firebase configuration interface
 */
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

/**
 * Initialize Firebase with configuration from environment variables
 * @returns Firebase Auth instance
 */
export const initializeFirebase = (): Auth => {
  if (auth) {
    return auth;
  }

  const config: FirebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  // Validate required configuration
  if (!config.apiKey || !config.authDomain || !config.projectId || !config.appId) {
    throw new Error('Missing required Firebase configuration. Please check your environment variables.');
  }

  app = initializeApp(config);
  auth = getAuth(app);

  return auth;
};

/**
 * Sign in with Google using popup
 * @returns UserCredential with user information and ID token
 * @throws Error with user-friendly message
 */
export const signInWithGoogle = async (): Promise<UserCredential> => {
  const authInstance = initializeFirebase();
  const provider = new GoogleAuthProvider();
  
  try {
    const result = await signInWithPopup(authInstance, provider);
    return result;
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    
    // Provide user-friendly error messages based on error code
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Login cancelled. Please try again.');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your connection.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many attempts. Please try again later.');
    } else {
      throw new Error('Authentication failed. Please try again.');
    }
  }
};

/**
 * Sign in with Google using hosted domain parameter
 * @param domain - The hosted domain to restrict authentication (e.g., 'student.ub.ac.id')
 * @returns UserCredential with user information and ID token
 * @throws Error with user-friendly message
 */
export const signInWithGoogleHD = async (domain: string): Promise<UserCredential> => {
  const authInstance = initializeFirebase();
  const provider = new GoogleAuthProvider();
  
  // Set custom parameters for hosted domain
  provider.setCustomParameters({
    hd: domain,
  });
  
  try {
    const result = await signInWithPopup(authInstance, provider);
    return result;
  } catch (error: any) {
    console.error('Error signing in with Google HD:', error);
    
    // Provide user-friendly error messages based on error code
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Login cancelled. Please try again.');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your connection.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many attempts. Please try again later.');
    } else {
      throw new Error('Authentication failed. Please try again.');
    }
  }
};

/**
 * Sign out the current user from Firebase
 * @throws Error with user-friendly message
 */
export const signOut = async (): Promise<void> => {
  const authInstance = initializeFirebase();
  
  try {
    await firebaseSignOut(authInstance);
  } catch (error: any) {
    console.error('Error signing out:', error);
    throw new Error('Failed to sign out. Please try again.');
  }
};

/**
 * Get the current Firebase user
 * @returns Current user or null if not authenticated
 */
export const getCurrentUser = (): User | null => {
  const authInstance = initializeFirebase();
  return authInstance.currentUser;
};
