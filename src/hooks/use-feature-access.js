import { useSubscription } from '@/context/subscription-context';

export function useFeatureAccess() {
  const subscription = useSubscription();

  const canAccess = (feature) => {
    return subscription.canAccessFeature(feature);
  };

  const requiresUpgrade = (feature, plan) => {
    return !canAccess(feature) && subscription.currentPlan !== plan;
  };

  const getPlanForFeature = (feature) => {
    const featureMap = {
      'ai-threat-detection': 'Enterprise',
      'ai-recommendations': 'Enterprise',
      'compliance-suite': 'Enterprise',
      'team-management': 'Enterprise',
      'analytics-basic': 'Standard',
      'automation-templates': 'Standard',
    };
    return featureMap[feature] || 'Premium';
  };

  return {
    canAccess,
    requiresUpgrade,
    getPlanForFeature,
  };
}
