import { useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

// Minimal demo auth hook with auto-verify on app launch.
// Replace OAuth client IDs and server calls for production.
export function useAuthProvider() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auto-verify token on mount (e.g., when app loads or user returns)
  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync('demo_token');
        // Simulate Chrome profile scan / token verification
        if (token) {
          await new Promise((r) => setTimeout(r, 600)); // simulated verification delay
          setUser({ email: token === 'google-token' ? 'user@google.com' : 'user@local' });
        }
      } catch (e) {
        console.error('Auto-verify failed:', e);
      }
      setLoading(false);
    })();
  }, []);

  const signInWithCredentials = useCallback(async (email, password) => {
    setLoading(true);
    try {
      // Simulate network delay and token issuance
      await new Promise((r) => setTimeout(r, 700));
      await SecureStore.setItemAsync('demo_token', 'local-token');
      setUser({ email: email || 'user@local' });
    } catch (e) {
      console.error('Sign in failed:', e);
      setUser(null);
    }
    setLoading(false);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    try {
      // Placeholder: in real app use expo-auth-session or Google SDK
      // This simulates scanning the Chrome profile for credentials
      await new Promise((r) => setTimeout(r, 900));
      await SecureStore.setItemAsync('demo_token', 'google-token');
      setUser({ email: 'user@google.com' });
    } catch (e) {
      console.error('Google sign in failed:', e);
      setUser(null);
    }
    setLoading(false);
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await SecureStore.deleteItemAsync('demo_token');
      setUser(null);
    } catch (e) {
      console.error('Sign out failed:', e);
    }
    setLoading(false);
  }, []);

  return {
    user,
    loading,
    signInWithCredentials,
    signInWithGoogle,
    signOut,
  };
}

// Small wrapper hook for component imports
export function useAuth() {
  return useAuthProvider();
}
