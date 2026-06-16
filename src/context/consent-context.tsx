import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type ConsentDecision = 'accepted' | 'declined' | 'pending';

export interface AgreementVersion {
  id: 'terms' | 'privacy' | 'data-usage';
  title: string;
  version: string;
  summary: string;
}

export interface ConsentRecord {
  decision: ConsentDecision;
  accepted: boolean;
  agreementVersions: Record<AgreementVersion['id'], string>;
  timestamp: string;
  deviceConsentId: string;
  userId?: string;
}

interface ConsentContextValue {
  agreements: AgreementVersion[];
  consentRecord: ConsentRecord | null;
  hasAcceptedConsent: boolean;
  decision: ConsentDecision;
  acceptConsent: (userId?: string) => Promise<void>;
  declineConsent: () => Promise<void>;
  attachUserToConsent: (userId: string) => Promise<void>;
}

const CONSENT_KEY = 'deltex_ai_consent_record';

export const AGREEMENTS: AgreementVersion[] = [
  {
    id: 'terms',
    title: 'Terms of Service',
    version: 'tos-2026-06',
    summary: 'You agree to use Deltex AI responsibly, keep your account secure, and follow subscription and acceptable-use rules.',
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    version: 'privacy-2026-06',
    summary: 'Deltex AI stores only the profile, security, and device signals required to provide protection and account features.',
  },
  {
    id: 'data-usage',
    title: 'Data Usage Agreement',
    version: 'data-usage-2026-06',
    summary: 'Security analysis uses permission-based data only, including submitted links, files, metadata, and profile details you provide.',
  },
];

const ConsentContext = createContext<ConsentContextValue | null>(null);

function nowIso() {
  return new Date().toISOString();
}

function agreementVersions() {
  return AGREEMENTS.reduce(
    (acc, agreement) => ({
      ...acc,
      [agreement.id]: agreement.version,
    }),
    {} as Record<AgreementVersion['id'], string>,
  );
}

function createDeviceConsentId() {
  return `consent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function getStoredConsent() {
  if (Platform.OS === 'web') {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(CONSENT_KEY);
  }

  return SecureStore.getItemAsync(CONSENT_KEY);
}

async function setStoredConsent(record: ConsentRecord) {
  const value = JSON.stringify(record);

  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CONSENT_KEY, value);
    }
    return;
  }

  await SecureStore.setItemAsync(CONSENT_KEY, value);
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consentRecord, setConsentRecord] = useState<ConsentRecord | null>(null);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      try {
        const stored = await getStoredConsent();
        if (stored && mounted) {
          setConsentRecord(JSON.parse(stored) as ConsentRecord);
        }
      } catch {
        if (mounted) {
          setConsentRecord(null);
        }
      }
    }

    hydrate();

    return () => {
      mounted = false;
    };
  }, []);

  const persistRecord = useCallback(async (record: ConsentRecord) => {
    setConsentRecord(record);
    await setStoredConsent(record);
  }, []);

  const acceptConsent = useCallback(
    async (userId?: string) => {
      await persistRecord({
        decision: 'accepted',
        accepted: true,
        agreementVersions: agreementVersions(),
        timestamp: nowIso(),
        deviceConsentId: consentRecord?.deviceConsentId || createDeviceConsentId(),
        userId,
      });
    },
    [consentRecord?.deviceConsentId, persistRecord],
  );

  const declineConsent = useCallback(async () => {
    await persistRecord({
      decision: 'declined',
      accepted: false,
      agreementVersions: agreementVersions(),
      timestamp: nowIso(),
      deviceConsentId: consentRecord?.deviceConsentId || createDeviceConsentId(),
    });
  }, [consentRecord?.deviceConsentId, persistRecord]);

  const attachUserToConsent = useCallback(
    async (userId: string) => {
      if (!consentRecord || !consentRecord.accepted) return;
      if (consentRecord.userId === userId) return;
      await persistRecord({ ...consentRecord, userId });
    },
    [consentRecord, persistRecord],
  );

  const value = useMemo<ConsentContextValue>(
    () => ({
      agreements: AGREEMENTS,
      consentRecord,
      hasAcceptedConsent: !!consentRecord?.accepted,
      decision: consentRecord?.decision || 'pending',
      acceptConsent,
      declineConsent,
      attachUserToConsent,
    }),
    [acceptConsent, attachUserToConsent, consentRecord, declineConsent],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent() {
  const context = useContext(ConsentContext);

  if (!context) {
    throw new Error('useConsent must be used within ConsentProvider');
  }

  return context;
}
