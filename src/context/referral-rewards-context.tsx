import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Share } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { EntitlementFeatureId, RewardGrant, useSubscription } from '@/context/subscription-context';
import { PlanId } from '@/constants/security-platform';

export type ReferralState = 'invited' | 'code-applied' | 'registered' | 'consent-accepted' | 'onboarding-complete' | 'installed' | 'verified' | 'rewarded' | 'rejected';

export interface ReferralEvent {
  id: string;
  referralId: string;
  state: ReferralState;
  detail: string;
  timestamp: string;
}

export interface ReferralCoupon {
  code: string;
  ownerUserId?: string;
  campaignId: string;
  createdAt: string;
  redeemedBy?: string;
  redeemedAt?: string;
  valid: boolean;
}

export interface ReferralRewardPackage {
  id: string;
  label: string;
  tokens: number;
  protectionCredits: number;
  trialPlan: PlanId;
  trialDays: number;
  featureUnlocks: EntitlementFeatureId[];
}

export interface ReferralRecord {
  id: string;
  code: string;
  friendEmail?: string;
  state: ReferralState;
  rewardGranted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralAnalytics {
  invitationsSent: number;
  successfulReferrals: number;
  pendingReferrals: number;
  earnedRewards: number;
  redeemedRewards: number;
  totalBonusTokens: number;
}

export interface ReferralCampaign {
  id: string;
  name: string;
  active: boolean;
  seasonal: boolean;
  milestone: number;
  rewardPackage: ReferralRewardPackage;
}

interface ReferralRewardsContextValue {
  referralCode: string;
  referralLink: string;
  shareMessage: string;
  coupons: ReferralCoupon[];
  referrals: ReferralRecord[];
  events: ReferralEvent[];
  campaigns: ReferralCampaign[];
  analytics: ReferralAnalytics;
  rewards: RewardGrant[];
  generateReferralCode: () => Promise<string>;
  shareInvite: () => Promise<void>;
  inviteFriend: (email?: string) => Promise<ReferralRecord>;
  applyReferralCoupon: (code: string, userId?: string) => Promise<{ ok: boolean; message: string }>;
  markReferralState: (referralId: string, state: ReferralState, detail: string) => Promise<void>;
  verifyPendingReferrals: () => Promise<void>;
}

const REFERRAL_KEY = 'deltex_ai_referral_rewards';
const BASE_REFERRAL_URL = 'https://deltex.ai/invite';

const DEFAULT_REWARD_PACKAGE: ReferralRewardPackage = {
  id: 'default-referral-reward',
  label: 'Referral Security Boost',
  tokens: 150,
  protectionCredits: 5,
  trialPlan: 'premium',
  trialDays: 14,
  featureUnlocks: ['deep-scans', 'advanced-reports'],
};

const DEFAULT_CAMPAIGNS: ReferralCampaign[] = [
  {
    id: 'always-on-referral',
    name: 'Always-on Referral Rewards',
    active: true,
    seasonal: false,
    milestone: 1,
    rewardPackage: DEFAULT_REWARD_PACKAGE,
  },
  {
    id: 'seasonal-family-boost',
    name: 'Family Safety Boost',
    active: true,
    seasonal: true,
    milestone: 3,
    rewardPackage: {
      id: 'family-milestone-reward',
      label: 'Family Milestone Boost',
      tokens: 500,
      protectionCredits: 15,
      trialPlan: 'family',
      trialDays: 30,
      featureUnlocks: ['family-protection', 'social-media-protection'],
    },
  },
];

interface ReferralRewardsState {
  referralCode: string;
  coupons: ReferralCoupon[];
  referrals: ReferralRecord[];
  events: ReferralEvent[];
  rewards: RewardGrant[];
}

const ReferralRewardsContext = createContext<ReferralRewardsContextValue | null>(null);

function nowIso() {
  return new Date().toISOString();
}

function createCode() {
  return `DLTX-${Math.random().toString(36).slice(2, 7).toUpperCase()}-${Date.now().toString().slice(-4)}`;
}

function defaultState(): ReferralRewardsState {
  const referralCode = createCode();

  return {
    referralCode,
    coupons: [
      {
        code: referralCode,
        campaignId: 'always-on-referral',
        createdAt: nowIso(),
        valid: true,
      },
    ],
    referrals: [],
    events: [],
    rewards: [],
  };
}

function createEvent(referralId: string, state: ReferralState, detail: string): ReferralEvent {
  return {
    id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    referralId,
    state,
    detail,
    timestamp: nowIso(),
  };
}

async function getStoredState() {
  if (Platform.OS === 'web') {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(REFERRAL_KEY);
  }

  return SecureStore.getItemAsync(REFERRAL_KEY);
}

async function setStoredState(state: ReferralRewardsState) {
  const value = JSON.stringify(state);

  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(REFERRAL_KEY, value);
    }
    return;
  }

  await SecureStore.setItemAsync(REFERRAL_KEY, value);
}

function canVerifyReferral(events: ReferralEvent[], referralId: string) {
  const states = new Set(events.filter((event) => event.referralId === referralId).map((event) => event.state));
  return states.has('code-applied') && states.has('registered') && states.has('consent-accepted') && states.has('onboarding-complete') && states.has('installed');
}

export function ReferralRewardsProvider({ children }: { children: ReactNode }) {
  const subscription = useSubscription();
  const initialState = useMemo(() => defaultState(), []);
  const [state, setState] = useState<ReferralRewardsState>(initialState);
  const stateRef = useRef<ReferralRewardsState>(initialState);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      try {
        const stored = await getStoredState();
        if (stored && mounted) {
          const hydrated = JSON.parse(stored) as ReferralRewardsState;
          stateRef.current = hydrated;
          setState(hydrated);
        }
      } catch {
        if (mounted) {
          const fallback = defaultState();
          stateRef.current = fallback;
          setState(fallback);
        }
      }
    }

    hydrate();

    return () => {
      mounted = false;
    };
  }, []);

  const updateState = useCallback(async (updater: (current: ReferralRewardsState) => ReferralRewardsState) => {
    const nextState = updater(stateRef.current);
    stateRef.current = nextState;
    setState(nextState);
    await setStoredState(nextState);
  }, []);

  const referralLink = useMemo(() => `${BASE_REFERRAL_URL}?code=${encodeURIComponent(state.referralCode)}`, [state.referralCode]);
  const shareMessage = useMemo(
    () => `Join me on Deltex AI and use referral code ${state.referralCode} for a security boost: ${referralLink}`,
    [referralLink, state.referralCode],
  );

  const generateReferralCode = useCallback(async () => {
    const nextCode = createCode();

    await updateState((current) => ({
      ...current,
      referralCode: nextCode,
      coupons: [
        {
          code: nextCode,
          campaignId: 'always-on-referral',
          createdAt: nowIso(),
          valid: true,
        },
        ...current.coupons,
      ],
    }));

    return nextCode;
  }, [updateState]);

  const shareInvite = useCallback(async () => {
    await Share.share({
      message: shareMessage,
      title: 'Invite to Deltex AI',
    });
  }, [shareMessage]);

  const markReferralState = useCallback(
    async (referralId: string, referralState: ReferralState, detail: string) => {
      await updateState((current) => ({
        ...current,
        referrals: current.referrals.map((referral) =>
          referral.id === referralId
            ? {
                ...referral,
                state: referralState,
                updatedAt: nowIso(),
              }
            : referral,
        ),
        events: [createEvent(referralId, referralState, detail), ...current.events],
      }));
    },
    [updateState],
  );

  const inviteFriend = useCallback(
    async (email?: string) => {
      const referral: ReferralRecord = {
        id: `referral-${Date.now()}`,
        code: stateRef.current.referralCode,
        friendEmail: email,
        state: 'invited',
        rewardGranted: false,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };

      await updateState((current) => ({
        ...current,
        referrals: [referral, ...current.referrals],
        events: [createEvent(referral.id, 'invited', email ? `Invitation sent to ${email}` : 'Share invitation generated'), ...current.events],
      }));

      return referral;
    },
    [updateState],
  );

  const applyReferralCoupon = useCallback(
    async (code: string, userId?: string) => {
      const normalized = code.trim().toUpperCase();
      const coupon = stateRef.current.coupons.find((item) => item.code.toUpperCase() === normalized && item.valid);

      if (!coupon) {
        return { ok: false, message: 'Referral coupon is invalid or expired.' };
      }

      const referral: ReferralRecord = {
        id: `referral-${Date.now()}`,
        code: normalized,
        state: 'code-applied',
        rewardGranted: false,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };

      await updateState((current) => ({
        ...current,
        coupons: current.coupons.map((item) =>
          item.code.toUpperCase() === normalized
            ? {
                ...item,
                redeemedBy: userId,
                redeemedAt: nowIso(),
              }
            : item,
        ),
        referrals: [referral, ...current.referrals],
        events: [
          createEvent(referral.id, 'code-applied', `Coupon ${normalized} applied`),
          createEvent(referral.id, 'registered', 'Registration signal recorded'),
          createEvent(referral.id, 'consent-accepted', 'Consent signal recorded'),
          createEvent(referral.id, 'onboarding-complete', 'Onboarding signal recorded'),
          createEvent(referral.id, 'installed', 'Install activation signal recorded'),
          ...current.events,
        ],
      }));

      return { ok: true, message: 'Referral coupon applied. Rewards will verify automatically.' };
    },
    [updateState],
  );

  const verifyPendingReferrals = useCallback(async () => {
    const currentState = stateRef.current;
    const rewardsToGrant = currentState.referrals.filter((referral) => !referral.rewardGranted && canVerifyReferral(currentState.events, referral.id));

    if (rewardsToGrant.length === 0) return;

    const rewardPackage = DEFAULT_CAMPAIGNS.find((campaign) => campaign.active)?.rewardPackage || DEFAULT_REWARD_PACKAGE;
    const grantedRewards: RewardGrant[] = [];

    for (let index = 0; index < rewardsToGrant.length; index += 1) {
      const reward = await subscription.applyRewardGrant({
        source: 'referral',
        tokens: rewardPackage.tokens,
        protectionCredits: rewardPackage.protectionCredits,
        featureUnlocks: rewardPackage.featureUnlocks,
        trialPlan: rewardPackage.trialPlan,
        trialDays: rewardPackage.trialDays,
        label: rewardPackage.label,
      });
      grantedRewards.push(reward);

      const successfulCount = currentState.referrals.filter((item) => item.rewardGranted).length + grantedRewards.length;
      const milestoneCampaign = DEFAULT_CAMPAIGNS.find((campaign) => campaign.active && campaign.milestone > 1 && successfulCount >= campaign.milestone);

      if (milestoneCampaign) {
        const milestoneReward = await subscription.applyRewardGrant({
          source: 'campaign',
          tokens: milestoneCampaign.rewardPackage.tokens,
          protectionCredits: milestoneCampaign.rewardPackage.protectionCredits,
          featureUnlocks: milestoneCampaign.rewardPackage.featureUnlocks,
          trialPlan: milestoneCampaign.rewardPackage.trialPlan,
          trialDays: milestoneCampaign.rewardPackage.trialDays,
          label: milestoneCampaign.rewardPackage.label,
        });
        grantedRewards.push(milestoneReward);
      }
    }

    await updateState((current) => ({
      ...current,
      referrals: current.referrals.map((referral) =>
        rewardsToGrant.some((item) => item.id === referral.id)
          ? {
              ...referral,
              state: 'rewarded',
              rewardGranted: true,
              updatedAt: nowIso(),
            }
          : referral,
      ),
      events: [
        ...rewardsToGrant.flatMap((referral) => [
          createEvent(referral.id, 'verified', 'Referral eligibility verified'),
          createEvent(referral.id, 'rewarded', 'Reward package granted'),
        ]),
        ...current.events,
      ],
      rewards: [...grantedRewards, ...current.rewards],
    }));
  }, [subscription, updateState]);

  useEffect(() => {
    void verifyPendingReferrals();
  }, [verifyPendingReferrals]);

  const analytics = useMemo<ReferralAnalytics>(() => {
    const successfulReferrals = state.referrals.filter((referral) => referral.rewardGranted).length;

    return {
      invitationsSent: state.referrals.length,
      successfulReferrals,
      pendingReferrals: state.referrals.filter((referral) => !referral.rewardGranted && referral.state !== 'rejected').length,
      earnedRewards: state.rewards.length,
      redeemedRewards: state.coupons.filter((coupon) => coupon.redeemedAt).length,
      totalBonusTokens: state.rewards.reduce((total, reward) => total + (reward.tokens || 0), 0),
    };
  }, [state.coupons, state.referrals, state.rewards]);

  const value = useMemo<ReferralRewardsContextValue>(
    () => ({
      referralCode: state.referralCode,
      referralLink,
      shareMessage,
      coupons: state.coupons,
      referrals: state.referrals,
      events: state.events,
      campaigns: DEFAULT_CAMPAIGNS,
      analytics,
      rewards: state.rewards,
      generateReferralCode,
      shareInvite,
      inviteFriend,
      applyReferralCoupon,
      markReferralState,
      verifyPendingReferrals,
    }),
    [
      analytics,
      applyReferralCoupon,
      generateReferralCode,
      inviteFriend,
      markReferralState,
      referralLink,
      shareInvite,
      shareMessage,
      state.coupons,
      state.events,
      state.referralCode,
      state.referrals,
      state.rewards,
      verifyPendingReferrals,
    ],
  );

  return <ReferralRewardsContext.Provider value={value}>{children}</ReferralRewardsContext.Provider>;
}

export function useReferralRewards() {
  const context = useContext(ReferralRewardsContext);

  if (!context) {
    throw new Error('useReferralRewards must be used within ReferralRewardsProvider');
  }

  return context;
}
