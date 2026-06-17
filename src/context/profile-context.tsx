import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

import { AuthProviderName, DeltexUser, useAuthContext } from '@/context/auth-context';
import { getLocalJsonItem, setLocalJsonItem } from '@/utils/local-json-store';

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
}

export interface NotificationPreferences {
  threatAlerts: boolean;
  scanResults: boolean;
  billing: boolean;
  referrals: boolean;
  weeklyReports: boolean;
}

export interface PrivacyPreferences {
  allowMetadataAnalysis: boolean;
  allowPublicProfileAnalysis: boolean;
  allowLocationContext: boolean;
  shareDiagnostics: boolean;
}

export interface SecurityPreferences {
  biometrics: boolean;
  passkeys: boolean;
  mfa: boolean;
  emergencyLock: boolean;
  trustedDeviceAlerts: boolean;
}

export interface UserProfile {
  userId: string;
  photoUri?: string;
  displayName: string;
  email: string;
  phone: string;
  occupation: string;
  organization: string;
  timezone: string;
  language: string;
  address: string;
  connectedProviders: AuthProviderName[];
  emergencyContacts: EmergencyContact[];
  notificationPreferences: NotificationPreferences;
  privacyPreferences: PrivacyPreferences;
  securityPreferences: SecurityPreferences;
  updatedAt: string;
}

interface ProfileContextValue {
  profile: UserProfile | null;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  updateNotificationPreferences: (patch: Partial<NotificationPreferences>) => Promise<void>;
  updatePrivacyPreferences: (patch: Partial<PrivacyPreferences>) => Promise<void>;
  updateSecurityPreferences: (patch: Partial<SecurityPreferences>) => Promise<void>;
  addEmergencyContact: (contact: Omit<EmergencyContact, 'id'>) => Promise<void>;
  updateEmergencyContact: (id: string, patch: Partial<EmergencyContact>) => Promise<void>;
  removeEmergencyContact: (id: string) => Promise<void>;
  copyProfilePhoto: (sourceUri: string) => Promise<string>;
}

const PROFILE_KEY = 'deltex_ai_user_profile';
const ProfileContext = createContext<ProfileContextValue | null>(null);

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  threatAlerts: true,
  scanResults: true,
  billing: true,
  referrals: true,
  weeklyReports: true,
};

const DEFAULT_PRIVACY_PREFERENCES: PrivacyPreferences = {
  allowMetadataAnalysis: true,
  allowPublicProfileAnalysis: true,
  allowLocationContext: false,
  shareDiagnostics: false,
};

const DEFAULT_SECURITY_PREFERENCES: SecurityPreferences = {
  biometrics: true,
  passkeys: true,
  mfa: true,
  emergencyLock: true,
  trustedDeviceAlerts: true,
};

function nowIso() {
  return new Date().toISOString();
}

function profileKey(userId: string) {
  return `${PROFILE_KEY}_${userId}`;
}

async function getStoredProfile(userId: string) {
  return getLocalJsonItem(profileKey(userId));
}

async function setStoredProfile(profile: UserProfile) {
  const key = profileKey(profile.userId);
  await setLocalJsonItem(key, JSON.stringify(profile));
}

function createProfileFromAuth(user: DeltexUser): UserProfile {
  return {
    userId: user.id,
    photoUri: user.avatarUri,
    displayName: user.name,
    email: user.email,
    phone: '',
    occupation: user.provider === 'microsoft' ? 'Security Manager' : '',
    organization: user.provider === 'microsoft' ? 'Contoso Security' : '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    language: user.locale || 'en-US',
    address: '',
    connectedProviders: user.connectedProviders?.length ? user.connectedProviders : [user.provider],
    emergencyContacts: [
      {
        id: 'primary-emergency-contact',
        name: 'Emergency Contact',
        relationship: 'Trusted contact',
        phone: '',
        email: '',
      },
    ],
    notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
    privacyPreferences: DEFAULT_PRIVACY_PREFERENCES,
    securityPreferences: {
      ...DEFAULT_SECURITY_PREFERENCES,
      biometrics: user.biometricEnabled,
      passkeys: user.passkeyEnabled || user.provider === 'passkey',
      mfa: user.mfaEnabled,
    },
    updatedAt: nowIso(),
  };
}

function mergeAuthProfile(stored: UserProfile, user: DeltexUser): UserProfile {
  const connectedProviders = Array.from(new Set([...(stored.connectedProviders || []), ...(user.connectedProviders || [user.provider])]));

  return {
    ...stored,
    displayName: stored.displayName || user.name,
    email: stored.email || user.email,
    photoUri: stored.photoUri || user.avatarUri,
    language: stored.language || user.locale || 'en-US',
    connectedProviders,
    updatedAt: nowIso(),
  };
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      if (!user) {
        setProfile(null);
        return;
      }

      try {
        const stored = await getStoredProfile(user.id);
        const nextProfile = stored ? mergeAuthProfile(JSON.parse(stored) as UserProfile, user) : createProfileFromAuth(user);

        if (mounted) {
          setProfile(nextProfile);
          await setStoredProfile(nextProfile);
        }
      } catch {
        if (mounted) {
          const fallback = createProfileFromAuth(user);
          setProfile(fallback);
          await setStoredProfile(fallback);
        }
      }
    }

    hydrate();

    return () => {
      mounted = false;
    };
  }, [user]);

  const persistProfile = useCallback(async (nextProfile: UserProfile) => {
    setProfile(nextProfile);
    await setStoredProfile(nextProfile);
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<UserProfile>) => {
      if (!profile) return;
      await persistProfile({ ...profile, ...patch, updatedAt: nowIso() });
    },
    [persistProfile, profile],
  );

  const updateNotificationPreferences = useCallback(
    async (patch: Partial<NotificationPreferences>) => {
      if (!profile) return;
      await persistProfile({
        ...profile,
        notificationPreferences: { ...profile.notificationPreferences, ...patch },
        updatedAt: nowIso(),
      });
    },
    [persistProfile, profile],
  );

  const updatePrivacyPreferences = useCallback(
    async (patch: Partial<PrivacyPreferences>) => {
      if (!profile) return;
      await persistProfile({
        ...profile,
        privacyPreferences: { ...profile.privacyPreferences, ...patch },
        updatedAt: nowIso(),
      });
    },
    [persistProfile, profile],
  );

  const updateSecurityPreferences = useCallback(
    async (patch: Partial<SecurityPreferences>) => {
      if (!profile) return;
      await persistProfile({
        ...profile,
        securityPreferences: { ...profile.securityPreferences, ...patch },
        updatedAt: nowIso(),
      });
    },
    [persistProfile, profile],
  );

  const addEmergencyContact = useCallback(
    async (contact: Omit<EmergencyContact, 'id'>) => {
      if (!profile) return;
      await persistProfile({
        ...profile,
        emergencyContacts: [
          ...profile.emergencyContacts,
          {
            ...contact,
            id: `contact-${Date.now()}`,
          },
        ],
        updatedAt: nowIso(),
      });
    },
    [persistProfile, profile],
  );

  const updateEmergencyContact = useCallback(
    async (id: string, patch: Partial<EmergencyContact>) => {
      if (!profile) return;
      await persistProfile({
        ...profile,
        emergencyContacts: profile.emergencyContacts.map((contact) => (contact.id === id ? { ...contact, ...patch } : contact)),
        updatedAt: nowIso(),
      });
    },
    [persistProfile, profile],
  );

  const removeEmergencyContact = useCallback(
    async (id: string) => {
      if (!profile) return;
      await persistProfile({
        ...profile,
        emergencyContacts: profile.emergencyContacts.filter((contact) => contact.id !== id),
        updatedAt: nowIso(),
      });
    },
    [persistProfile, profile],
  );

  const copyProfilePhoto = useCallback(async (sourceUri: string) => {
    if (Platform.OS === 'web') return sourceUri;

    const directory = `${FileSystem.documentDirectory || ''}deltex-profile/`;
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    const extension = sourceUri.split('.').pop()?.split('?')[0] || 'jpg';
    const destination = `${directory}profile-${Date.now()}.${extension}`;
    await FileSystem.copyAsync({ from: sourceUri, to: destination });
    return destination;
  }, []);

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      updateProfile,
      updateNotificationPreferences,
      updatePrivacyPreferences,
      updateSecurityPreferences,
      addEmergencyContact,
      updateEmergencyContact,
      removeEmergencyContact,
      copyProfilePhoto,
    }),
    [
      addEmergencyContact,
      copyProfilePhoto,
      profile,
      removeEmergencyContact,
      updateEmergencyContact,
      updateNotificationPreferences,
      updatePrivacyPreferences,
      updateProfile,
      updateSecurityPreferences,
    ],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);

  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider');
  }

  return context;
}
