import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { FEATURE_ACCESS, PLAN_RANK, PLANS, PlanId } from '@/constants/security-platform';

export type EntitlementFeatureId =
  | 'security-score'
  | 'ai-assistant'
  | 'unlimited-ai'
  | 'deep-scans'
  | 'malware-protection'
  | 'phishing-detection'
  | 'ransomware-protection'
  | 'dark-web-monitoring'
  | 'social-media-protection'
  | 'social-profile-analysis'
  | 'child-family-safety'
  | 'website-protection'
  | 'personal-security-firewall'
  | 'fraud-detection'
  | 'identity-protection'
  | 'scheduled-scans'
  | 'advanced-reports'
  | 'family-protection'
  | 'team-management'
  | 'compliance-tools'
  | 'enterprise-integrations'
  | 'siem-integrations'
  | 'executive-reporting'
  | 'api-security-monitoring';

export interface EntitlementDefinition {
  id: EntitlementFeatureId;
  label: string;
  minPlan: PlanId;
  hiddenUntilPlan?: PlanId;
  limits: Partial<Record<PlanId, number | 'unlimited'>>;
  upgradeReason: string;
}

export interface PlanEntitlementProfile {
  plan: PlanId;
  monthlyTokens: number;
  aiPromptLimit: number | 'unlimited';
  scanFrequency: string;
  reportDepth: 'basic' | 'advanced' | 'professional' | 'business' | 'enterprise';
  dashboardModules: number | 'all';
  enterpriseTools: boolean;
}

export interface TrialBoost {
  id: string;
  plan: PlanId;
  reason: string;
  expiresAt: string;
}

export interface RewardGrant {
  id: string;
  source: 'referral' | 'achievement' | 'loyalty' | 'campaign';
  tokens?: number;
  protectionCredits?: number;
  featureUnlocks?: EntitlementFeatureId[];
  trialPlan?: PlanId;
  trialDays?: number;
  label: string;
  createdAt: string;
}

export interface PromotionCampaign {
  id: string;
  name: string;
  active: boolean;
  reward: Omit<RewardGrant, 'id' | 'createdAt' | 'source'>;
}

export interface SubscriptionState {
  currentPlan: PlanId;
  billingCycle: 'monthly' | 'yearly';
  activatedAt: string | null;
  bonusTokens: number;
  protectionCredits: number;
  promoUnlocks: EntitlementFeatureId[];
  trialBoost: TrialBoost | null;
  rewardGrants: RewardGrant[];
}

interface SubscriptionContextValue extends SubscriptionState {
  effectivePlan: PlanId;
  setPlan: (plan: PlanId | 'basic' | 'standard' | 'personal') => Promise<void>;
  setBillingCycle: (cycle: 'monthly' | 'yearly') => Promise<void>;
  canAccess: (feature: EntitlementFeatureId | string) => boolean;
  canAccessFeature: (feature: string) => boolean;
  isFeatureLocked: (feature: string) => boolean;
  isHidden: (feature: EntitlementFeatureId | string) => boolean;
  getLimit: (feature: EntitlementFeatureId | string) => number | 'unlimited' | null;
  getTokenAllowance: () => number;
  getEffectivePlan: () => PlanId;
  getUpgradeReason: (feature: EntitlementFeatureId | string) => string;
  getAvailableFeatures: () => string[];
  getLockedFeatures: () => string[];
  addBonusTokens: (amount: number, label?: string) => Promise<void>;
  addProtectionCredits: (amount: number, label?: string) => Promise<void>;
  activateTrialBoost: (plan: PlanId, days: number, reason: string) => Promise<void>;
  applyRewardGrant: (grant: Omit<RewardGrant, 'id' | 'createdAt'>) => Promise<RewardGrant>;
}

const PLAN_KEY = 'deltex_ai_subscription_state';

export const ENTITLEMENTS: Record<EntitlementFeatureId, EntitlementDefinition> = {
  'security-score': {
    id: 'security-score',
    label: 'Security Score',
    minPlan: 'free',
    limits: { free: 1, premium: 'unlimited', family: 'unlimited', professional: 'unlimited', business: 'unlimited', enterprise: 'unlimited' },
    upgradeReason: 'Security score is available on every plan.',
  },
  'ai-assistant': {
    id: 'ai-assistant',
    label: 'AI Assistant',
    minPlan: 'free',
    limits: { free: 5, premium: 'unlimited', family: 'unlimited', professional: 'unlimited', business: 'unlimited', enterprise: 'unlimited' },
    upgradeReason: 'Upgrade to Premium for unlimited AI assistance.',
  },
  'unlimited-ai': {
    id: 'unlimited-ai',
    label: 'Unlimited AI',
    minPlan: 'premium',
    limits: { free: 0, premium: 'unlimited', family: 'unlimited', professional: 'unlimited', business: 'unlimited', enterprise: 'unlimited' },
    upgradeReason: 'Unlimited AI starts on Premium.',
  },
  'deep-scans': {
    id: 'deep-scans',
    label: 'Deep Scans',
    minPlan: 'premium',
    limits: { free: 1, premium: 12, family: 24, professional: 40, business: 120, enterprise: 'unlimited' },
    upgradeReason: 'Deep scans require Premium or higher.',
  },
  'malware-protection': {
    id: 'malware-protection',
    label: 'Malware Protection',
    minPlan: 'free',
    limits: { free: 1, premium: 'unlimited', family: 'unlimited', professional: 'unlimited', business: 'unlimited', enterprise: 'unlimited' },
    upgradeReason: 'Malware protection is included in Free.',
  },
  'phishing-detection': {
    id: 'phishing-detection',
    label: 'Phishing Detection',
    minPlan: 'premium',
    limits: { free: 3, premium: 'unlimited', family: 'unlimited', professional: 'unlimited', business: 'unlimited', enterprise: 'unlimited' },
    upgradeReason: 'Advanced phishing detection starts on Premium.',
  },
  'ransomware-protection': {
    id: 'ransomware-protection',
    label: 'Ransomware Protection',
    minPlan: 'premium',
    limits: { free: 0, premium: 5, family: 15, professional: 25, business: 100, enterprise: 'unlimited' },
    upgradeReason: 'Ransomware protection starts on Premium.',
  },
  'dark-web-monitoring': {
    id: 'dark-web-monitoring',
    label: 'Dark Web Monitoring',
    minPlan: 'premium',
    limits: { free: 0, premium: 5, family: 15, professional: 25, business: 250, enterprise: 'unlimited' },
    upgradeReason: 'Dark web monitoring starts on Premium.',
  },
  'social-media-protection': {
    id: 'social-media-protection',
    label: 'Social Media Protection',
    minPlan: 'family',
    limits: { free: 0, premium: 2, family: 20, professional: 40, business: 250, enterprise: 'unlimited' },
    upgradeReason: 'Full social media protection starts on Family.',
  },
  'social-profile-analysis': {
    id: 'social-profile-analysis',
    label: 'Social Profile Analysis',
    minPlan: 'family',
    limits: { free: 0, premium: 2, family: 25, professional: 60, business: 300, enterprise: 'unlimited' },
    upgradeReason: 'Social profile and conversation analysis starts on Family.',
  },
  'child-family-safety': {
    id: 'child-family-safety',
    label: 'Child & Family Safety',
    minPlan: 'family',
    limits: { free: 0, premium: 0, family: 6, professional: 10, business: 50, enterprise: 'unlimited' },
    upgradeReason: 'Child and family safety controls start on the Family plan.',
  },
  'website-protection': {
    id: 'website-protection',
    label: 'Website Protection',
    minPlan: 'premium',
    limits: { free: 0, premium: 1, family: 2, professional: 8, business: 75, enterprise: 'unlimited' },
    upgradeReason: 'Website baselining starts on Premium and scales for Professional, Business, and Enterprise.',
  },
  'personal-security-firewall': {
    id: 'personal-security-firewall',
    label: 'Personal Security Firewall',
    minPlan: 'premium',
    limits: { free: 0, premium: 'unlimited', family: 'unlimited', professional: 'unlimited', business: 'unlimited', enterprise: 'unlimited' },
    upgradeReason: 'The intelligent personal firewall starts on Premium.',
  },
  'fraud-detection': {
    id: 'fraud-detection',
    label: 'Fraud Detection',
    minPlan: 'professional',
    limits: { free: 0, premium: 1, family: 5, professional: 30, business: 150, enterprise: 'unlimited' },
    upgradeReason: 'Fraud investigations start on Professional.',
  },
  'identity-protection': {
    id: 'identity-protection',
    label: 'Identity Protection',
    minPlan: 'family',
    limits: { free: 0, premium: 3, family: 12, professional: 30, business: 250, enterprise: 'unlimited' },
    upgradeReason: 'Identity protection starts on Family.',
  },
  'scheduled-scans': {
    id: 'scheduled-scans',
    label: 'Scheduled Scans',
    minPlan: 'premium',
    limits: { free: 1, premium: 8, family: 20, professional: 50, business: 300, enterprise: 'unlimited' },
    upgradeReason: 'Flexible scheduled protection starts on Premium.',
  },
  'advanced-reports': {
    id: 'advanced-reports',
    label: 'Advanced Reports',
    minPlan: 'premium',
    limits: { free: 1, premium: 8, family: 12, professional: 30, business: 100, enterprise: 'unlimited' },
    upgradeReason: 'Advanced reporting starts on Premium.',
  },
  'family-protection': {
    id: 'family-protection',
    label: 'Family Protection',
    minPlan: 'family',
    limits: { free: 0, premium: 0, family: 6, professional: 6, business: 50, enterprise: 'unlimited' },
    upgradeReason: 'Family protection starts on the Family plan.',
  },
  'team-management': {
    id: 'team-management',
    label: 'Team Management',
    minPlan: 'business',
    hiddenUntilPlan: 'professional',
    limits: { free: 0, premium: 0, family: 0, professional: 3, business: 50, enterprise: 'unlimited' },
    upgradeReason: 'Team management starts on Business.',
  },
  'compliance-tools': {
    id: 'compliance-tools',
    label: 'Compliance Tools',
    minPlan: 'business',
    hiddenUntilPlan: 'professional',
    limits: { free: 0, premium: 0, family: 0, professional: 1, business: 12, enterprise: 'unlimited' },
    upgradeReason: 'Compliance tools start on Business.',
  },
  'enterprise-integrations': {
    id: 'enterprise-integrations',
    label: 'Enterprise Integrations',
    minPlan: 'enterprise',
    hiddenUntilPlan: 'business',
    limits: { free: 0, premium: 0, family: 0, professional: 0, business: 1, enterprise: 'unlimited' },
    upgradeReason: 'Enterprise integrations require Enterprise.',
  },
  'siem-integrations': {
    id: 'siem-integrations',
    label: 'SIEM Integrations',
    minPlan: 'enterprise',
    hiddenUntilPlan: 'business',
    limits: { free: 0, premium: 0, family: 0, professional: 0, business: 1, enterprise: 'unlimited' },
    upgradeReason: 'SIEM integrations require Enterprise.',
  },
  'executive-reporting': {
    id: 'executive-reporting',
    label: 'Executive Reporting',
    minPlan: 'enterprise',
    hiddenUntilPlan: 'business',
    limits: { free: 0, premium: 0, family: 0, professional: 0, business: 1, enterprise: 'unlimited' },
    upgradeReason: 'Executive reporting requires Enterprise.',
  },
  'api-security-monitoring': {
    id: 'api-security-monitoring',
    label: 'API Security Monitoring',
    minPlan: 'enterprise',
    hiddenUntilPlan: 'business',
    limits: { free: 0, premium: 0, family: 0, professional: 0, business: 1, enterprise: 'unlimited' },
    upgradeReason: 'API security monitoring requires Enterprise.',
  },
};

export const PLAN_ENTITLEMENT_PROFILES: Record<PlanId, PlanEntitlementProfile> = {
  free: { plan: 'free', monthlyTokens: 25, aiPromptLimit: 5, scanFrequency: 'manual', reportDepth: 'basic', dashboardModules: 7, enterpriseTools: false },
  premium: { plan: 'premium', monthlyTokens: 250, aiPromptLimit: 'unlimited', scanFrequency: 'daily', reportDepth: 'advanced', dashboardModules: 17, enterpriseTools: false },
  family: { plan: 'family', monthlyTokens: 600, aiPromptLimit: 'unlimited', scanFrequency: 'daily + family', reportDepth: 'advanced', dashboardModules: 22, enterpriseTools: false },
  professional: { plan: 'professional', monthlyTokens: 900, aiPromptLimit: 'unlimited', scanFrequency: 'hourly', reportDepth: 'professional', dashboardModules: 27, enterpriseTools: false },
  business: { plan: 'business', monthlyTokens: 2400, aiPromptLimit: 'unlimited', scanFrequency: 'continuous team', reportDepth: 'business', dashboardModules: 32, enterpriseTools: true },
  enterprise: { plan: 'enterprise', monthlyTokens: 10000, aiPromptLimit: 'unlimited', scanFrequency: 'continuous enterprise', reportDepth: 'enterprise', dashboardModules: 'all', enterpriseTools: true },
};

const DEFAULT_STATE: SubscriptionState = {
  currentPlan: 'free',
  billingCycle: 'monthly',
  activatedAt: null,
  bonusTokens: 0,
  protectionCredits: 0,
  promoUnlocks: [],
  trialBoost: null,
  rewardGrants: [],
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

function normalizePlan(plan: PlanId | 'basic' | 'standard' | 'personal'): PlanId {
  if (plan === 'basic') return 'free';
  if (plan === 'standard' || plan === 'personal') return 'premium';
  return plan;
}

function isPlanId(value: string): value is PlanId {
  return PLANS.some((item) => item.id === value);
}

function isEntitlementFeatureId(feature: string): feature is EntitlementFeatureId {
  return feature in ENTITLEMENTS;
}

function nowIso() {
  return new Date().toISOString();
}

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function isTrialActive(trial: TrialBoost | null) {
  return !!trial && new Date(trial.expiresAt).getTime() > Date.now();
}

function rankEffectivePlan(currentPlan: PlanId, trial: TrialBoost | null) {
  if (!trial || !isTrialActive(trial)) return currentPlan;
  return PLAN_RANK[trial.plan] > PLAN_RANK[currentPlan] ? trial.plan : currentPlan;
}

async function getStoredState() {
  if (Platform.OS === 'web') {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(PLAN_KEY);
  }

  return SecureStore.getItemAsync(PLAN_KEY);
}

async function setStoredState(state: SubscriptionState) {
  const value = JSON.stringify(state);

  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PLAN_KEY, value);
    }
    return;
  }

  await SecureStore.setItemAsync(PLAN_KEY, value);
}

function normalizeStoredState(stored: string | null): SubscriptionState {
  if (!stored) return DEFAULT_STATE;

  try {
    const parsed = JSON.parse(stored);

    if (typeof parsed === 'string' && isPlanId(parsed)) {
      return { ...DEFAULT_STATE, currentPlan: parsed, activatedAt: nowIso() };
    }

    const currentPlan = typeof parsed.currentPlan === 'string' && isPlanId(parsed.currentPlan) ? parsed.currentPlan : 'free';
    const trialBoost = parsed.trialBoost && isPlanId(parsed.trialBoost.plan) ? parsed.trialBoost as TrialBoost : null;

    return {
      ...DEFAULT_STATE,
      ...parsed,
      currentPlan,
      trialBoost: isTrialActive(trialBoost) ? trialBoost : null,
      promoUnlocks: Array.isArray(parsed.promoUnlocks) ? parsed.promoUnlocks.filter(isEntitlementFeatureId) : [],
      rewardGrants: Array.isArray(parsed.rewardGrants) ? parsed.rewardGrants : [],
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SubscriptionState>(DEFAULT_STATE);
  const stateRef = useRef<SubscriptionState>(DEFAULT_STATE);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      const stored = await getStoredState();
      if (mounted) {
        const hydrated = normalizeStoredState(stored);
        stateRef.current = hydrated;
        setState(hydrated);
      }
    }

    hydrate();

    return () => {
      mounted = false;
    };
  }, []);

  const updateState = useCallback(async (updater: (current: SubscriptionState) => SubscriptionState) => {
    const nextState = updater(stateRef.current);
    stateRef.current = nextState;
    setState(nextState);
    await setStoredState(nextState);
  }, []);

  const effectivePlan = useMemo(() => rankEffectivePlan(state.currentPlan, state.trialBoost), [state.currentPlan, state.trialBoost]);

  const setPlan = useCallback(
    async (plan: PlanId | 'basic' | 'standard' | 'personal') => {
      const normalized = normalizePlan(plan);
      await updateState((current) => ({
        ...current,
        currentPlan: normalized,
        activatedAt: nowIso(),
      }));
    },
    [updateState],
  );

  const setBillingCycle = useCallback(
    async (cycle: 'monthly' | 'yearly') => {
      await updateState((current) => ({ ...current, billingCycle: cycle }));
    },
    [updateState],
  );

  const canAccess = useCallback(
    (feature: EntitlementFeatureId | string) => {
      if (isEntitlementFeatureId(feature)) {
        const entitlement = ENTITLEMENTS[feature];
        return state.promoUnlocks.includes(feature) || PLAN_RANK[effectivePlan] >= PLAN_RANK[entitlement.minPlan];
      }

      const legacy = FEATURE_ACCESS[feature];
      if (!legacy) return true;

      return PLAN_RANK[effectivePlan] >= PLAN_RANK[legacy.minPlan];
    },
    [effectivePlan, state.promoUnlocks],
  );

  const canAccessFeature = useCallback((feature: string) => canAccess(feature), [canAccess]);
  const isFeatureLocked = useCallback((feature: string) => !canAccess(feature), [canAccess]);

  const isHidden = useCallback(
    (feature: EntitlementFeatureId | string) => {
      if (!isEntitlementFeatureId(feature)) return false;
      const hiddenUntilPlan = ENTITLEMENTS[feature].hiddenUntilPlan;
      return hiddenUntilPlan ? PLAN_RANK[effectivePlan] < PLAN_RANK[hiddenUntilPlan] : false;
    },
    [effectivePlan],
  );

  const getLimit = useCallback(
    (feature: EntitlementFeatureId | string) => {
      if (!isEntitlementFeatureId(feature)) return null;
      const limit = ENTITLEMENTS[feature].limits[effectivePlan];
      return limit ?? null;
    },
    [effectivePlan],
  );

  const getTokenAllowance = useCallback(
    () => PLAN_ENTITLEMENT_PROFILES[effectivePlan].monthlyTokens + state.bonusTokens,
    [effectivePlan, state.bonusTokens],
  );

  const getEffectivePlan = useCallback(() => effectivePlan, [effectivePlan]);

  const getUpgradeReason = useCallback((feature: EntitlementFeatureId | string) => {
    if (isEntitlementFeatureId(feature)) return ENTITLEMENTS[feature].upgradeReason;
    const legacy = FEATURE_ACCESS[feature];
    return legacy ? `Requires ${legacy.minPlan} plan or higher.` : 'This feature is available.';
  }, []);

  const getAvailableFeatures = useCallback(
    () => [
      ...Object.keys(FEATURE_ACCESS).filter((feature) => canAccess(feature)),
      ...Object.keys(ENTITLEMENTS).filter((feature) => canAccess(feature)),
    ],
    [canAccess],
  );

  const getLockedFeatures = useCallback(
    () => [
      ...Object.keys(FEATURE_ACCESS).filter((feature) => !canAccess(feature)),
      ...Object.keys(ENTITLEMENTS).filter((feature) => !canAccess(feature)),
    ],
    [canAccess],
  );

  const addBonusTokens = useCallback(
    async (amount: number, label = 'Bonus tokens') => {
      await updateState((current) => ({
        ...current,
        bonusTokens: current.bonusTokens + Math.max(0, amount),
        rewardGrants: [
          {
            id: `grant-${Date.now()}`,
            source: 'achievement',
            tokens: amount,
            label,
            createdAt: nowIso(),
          },
          ...current.rewardGrants,
        ],
      }));
    },
    [updateState],
  );

  const addProtectionCredits = useCallback(
    async (amount: number, label = 'Protection credits') => {
      await updateState((current) => ({
        ...current,
        protectionCredits: current.protectionCredits + Math.max(0, amount),
        rewardGrants: [
          {
            id: `grant-${Date.now()}`,
            source: 'achievement',
            protectionCredits: amount,
            label,
            createdAt: nowIso(),
          },
          ...current.rewardGrants,
        ],
      }));
    },
    [updateState],
  );

  const activateTrialBoost = useCallback(
    async (plan: PlanId, days: number, reason: string) => {
      await updateState((current) => ({
        ...current,
        trialBoost: {
          id: `trial-${Date.now()}`,
          plan,
          reason,
          expiresAt: addDays(days),
        },
      }));
    },
    [updateState],
  );

  const applyRewardGrant = useCallback(
    async (grant: Omit<RewardGrant, 'id' | 'createdAt'>) => {
      const created: RewardGrant = {
        ...grant,
        id: `grant-${Date.now()}`,
        createdAt: nowIso(),
      };

      await updateState((current) => {
        const trialBoost = created.trialPlan && created.trialDays
          ? {
              id: `trial-${Date.now()}`,
              plan: created.trialPlan,
              reason: created.label,
              expiresAt: addDays(created.trialDays),
            }
          : current.trialBoost;

        return {
          ...current,
          bonusTokens: current.bonusTokens + (created.tokens || 0),
          protectionCredits: current.protectionCredits + (created.protectionCredits || 0),
          promoUnlocks: Array.from(new Set([...current.promoUnlocks, ...(created.featureUnlocks || [])])),
          trialBoost,
          rewardGrants: [created, ...current.rewardGrants],
        };
      });

      return created;
    },
    [updateState],
  );

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      ...state,
      effectivePlan,
      setPlan,
      setBillingCycle,
      canAccess,
      canAccessFeature,
      isFeatureLocked,
      isHidden,
      getLimit,
      getTokenAllowance,
      getEffectivePlan,
      getUpgradeReason,
      getAvailableFeatures,
      getLockedFeatures,
      addBonusTokens,
      addProtectionCredits,
      activateTrialBoost,
      applyRewardGrant,
    }),
    [
      state,
      effectivePlan,
      setPlan,
      setBillingCycle,
      canAccess,
      canAccessFeature,
      isFeatureLocked,
      isHidden,
      getLimit,
      getTokenAllowance,
      getEffectivePlan,
      getUpgradeReason,
      getAvailableFeatures,
      getLockedFeatures,
      addBonusTokens,
      addProtectionCredits,
      activateTrialBoost,
      applyRewardGrant,
    ],
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);

  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }

  return context;
}

export { PLANS, FEATURE_ACCESS };
