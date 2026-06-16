import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

export type AuthProviderName = 'google' | 'microsoft' | 'apple' | 'email' | 'biometric' | 'passkey' | 'mfa';

export interface DeltexUser {
  id: string;
  email: string;
  name: string;
  provider: AuthProviderName;
  mfaEnabled: boolean;
  biometricEnabled: boolean;
  passkeyEnabled: boolean;
  providerUserId?: string;
  avatarUri?: string;
  givenName?: string;
  familyName?: string;
  locale?: string;
  connectedProviders?: AuthProviderName[];
  referralAttribution?: string;
}

interface AuthContextValue {
  user: DeltexUser | null;
  loading: boolean;
  error: string | null;
  signInWithCredentials: (email: string, password: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  signInWithProvider: (provider: AuthProviderName) => Promise<boolean>;
  signInWithBiometrics: () => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AUTH_KEY = 'deltex_ai_auth_user';
const AuthContext = createContext<AuthContextValue | null>(null);

async function getStoredValue(key: string) {
  if (Platform.OS === 'web') {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

async function setStoredValue(key: string, value: string) {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function deleteStoredValue(key: string) {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

function createUser(provider: AuthProviderName, email?: string): DeltexUser {
  const providerLabel = provider === 'email' ? 'local' : provider;
  const providerProfiles: Partial<Record<AuthProviderName, Partial<DeltexUser>>> = {
    google: {
      email: 'alex.donovan@gmail.deltex.ai',
      name: 'Alex Donovan',
      givenName: 'Alex',
      familyName: 'Donovan',
      locale: 'en-US',
      avatarUri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240',
    },
    microsoft: {
      email: 'morgan.security@outlook.deltex.ai',
      name: 'Morgan Security',
      givenName: 'Morgan',
      familyName: 'Security',
      locale: 'en-US',
      avatarUri: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=240',
    },
    apple: {
      email: 'apple.private@icloud.deltex.ai',
      name: 'Jordan Apple',
      givenName: 'Jordan',
      familyName: 'Apple',
      locale: 'en-US',
    },
  };
  const providerProfile = providerProfiles[provider] || {};

  return {
    id: `deltex-${providerLabel}-user`,
    email: email?.trim() || providerProfile.email || `user@${providerLabel}.deltex.ai`,
    name: providerProfile.name || (provider === 'microsoft' ? 'Morgan Security' : 'Alex Donovan'),
    provider,
    mfaEnabled: true,
    biometricEnabled: provider === 'biometric',
    passkeyEnabled: provider === 'passkey',
    providerUserId: `${providerLabel}-${Date.now()}`,
    avatarUri: providerProfile.avatarUri,
    givenName: providerProfile.givenName,
    familyName: providerProfile.familyName,
    locale: providerProfile.locale || 'en-US',
    connectedProviders: [provider],
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DeltexUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      try {
        const stored = await getStoredValue(AUTH_KEY);
        if (stored && mounted) {
          setUser(JSON.parse(stored) as DeltexUser);
        }
      } catch {
        if (mounted) {
          setError('We could not restore your secure session.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    hydrate();

    return () => {
      mounted = false;
    };
  }, []);

  const persistUser = useCallback(async (nextUser: DeltexUser) => {
    await setStoredValue(AUTH_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const signInWithCredentials = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);

      try {
        if (!email.includes('@') || password.length < 4) {
          throw new Error('Enter a valid email and a password with at least 4 characters.');
        }

        await new Promise((resolve) => setTimeout(resolve, 450));
        await persistUser(createUser('email', email));
        return true;
      } catch (authError) {
        setError(authError instanceof Error ? authError.message : 'Sign in failed.');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [persistUser],
  );

  const signInWithProvider = useCallback(
    async (provider: AuthProviderName) => {
      setLoading(true);
      setError(null);

      try {
        await new Promise((resolve) => setTimeout(resolve, 520));
        await persistUser(createUser(provider));
        return true;
      } catch {
        setError(`Could not sign in with ${provider}.`);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [persistUser],
  );

  const signInWithGoogle = useCallback(() => signInWithProvider('google'), [signInWithProvider]);

  const signInWithBiometrics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (Platform.OS !== 'web') {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !enrolled) {
          throw new Error('Biometric authentication is not configured on this device.');
        }

        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Unlock Deltex AI',
          fallbackLabel: 'Use passcode',
          cancelLabel: 'Cancel',
        });

        if (!result.success) {
          throw new Error('Biometric authentication was cancelled.');
        }
      }

      await persistUser(createUser('biometric'));
      return true;
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Biometric authentication failed.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [persistUser]);

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await deleteStoredValue(AUTH_KEY);
      setUser(null);
    } catch {
      setError('Could not sign out securely.');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      signInWithCredentials,
      signInWithGoogle,
      signInWithProvider,
      signInWithBiometrics,
      signOut,
      clearError,
    }),
    [
      user,
      loading,
      error,
      signInWithCredentials,
      signInWithGoogle,
      signInWithProvider,
      signInWithBiometrics,
      signOut,
      clearError,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }

  return context;
}
