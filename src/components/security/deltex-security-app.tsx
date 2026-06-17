import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as Speech from 'expo-speech';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Path, Stop } from 'react-native-svg';
import {
  Activity,
  AlertTriangle,
  Apple,
  ArrowRight,
  BarChart3,
  Bell,
  Brain,
  Bug,
  Building2,
  Calendar,
  Camera,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Crown,
  Database,
  Download,
  Eye,
  EyeOff,
  FileText,
  Fingerprint,
  Globe,
  Home,
  KeyRound,
  Lock,
  Mail,
  MessageSquare,
  Mic,
  MicOff,
  Minus,
  Network,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Star,
  Upload,
  User,
  Users,
  Volume2,
  VolumeX,
  Wifi,
  Zap,
} from 'lucide-react-native';

import { useAuthContext, AuthProviderName } from '@/context/auth-context';
import { useAiChat } from '@/context/ai-chat-context';
import { useConsent } from '@/context/consent-context';
import { useProfile } from '@/context/profile-context';
import { ChildProfile, ModuleConfiguration, RegisteredWebsite, useProtection } from '@/context/protection-context';
import { useReferralRewards } from '@/context/referral-rewards-context';
import { PLAN_ENTITLEMENT_PROFILES, useSubscription } from '@/context/subscription-context';
import {
  INVOICES,
  MODULES,
  PAYMENT_METHODS,
  PLAN_RANK,
  PLANS,
  RECENT_THREATS,
  SECURITY_REPORTS,
  SCORE_HISTORY,
  SETUP_STEPS,
  ModuleCategory,
  PlanId,
  SecurityModule,
  SecurityModuleId,
  SecurityStatus,
} from '@/constants/security-platform';
import { ThemePalette, ThemePreference, useDeltexTheme } from '@/theme/deltex-theme';

type IconComponent = typeof Shield;
type FlowStage = 'splash' | 'onboarding' | 'auth' | 'setup' | 'app';
type AppScreen =
  | 'dashboard'
  | 'protection'
  | 'assistant'
  | 'alerts'
  | 'profile'
  | 'settings'
  | 'subscriptions'
  | 'billing'
  | 'tokens'
  | 'schedule'
  | 'referrals'
  | 'module';
type BillingCycle = 'monthly' | 'yearly';
type AnalysisType = 'message' | 'profile' | 'screenshot' | 'email' | 'link';
type ScheduleFrequency = 'once' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'multiple' | 'custom' | 'recurring';
type DashboardTrendRange = '24H' | '7D' | '30D';
type DashboardChartMetric = 'threats' | 'scans' | 'risk' | 'events';

interface AnalysisResult {
  trustScore: number;
  fraudRisk: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  summary: string;
  signals: string[];
  recommendations: string[];
}

interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  text: string;
  result?: AnalysisResult;
  streaming?: boolean;
}

interface ProfileCropAsset {
  uri: string;
  width: number;
  height: number;
  fileName?: string | null;
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike;
  isFinal: boolean;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onstart?: () => void;
  onresult?: (event: SpeechRecognitionEventLike) => void;
  onerror?: () => void;
  onend?: () => void;
}

interface SecurityScoreActivity {
  completedScans: number;
  resolvedIssues: number;
  userActivity: number;
  refreshes: number;
}

interface SecurityScoreModel {
  score: number;
  label: string;
  status: string;
  trend: string;
  updatedAt: string;
  detectedThreats: number;
  blockedThreats: number;
  activeIssues: number;
  filesScanned: string;
  activeShields: string;
  breakdown: { label: string; value: number; color: string }[];
  insights: string[];
  trendData: { label: string; value: number }[];
}

const logoSource = require('@/assets/images/Logo/Deltex.png');
const PROFILE_CROP_BOX_SIZE = 240;
const PRIMARY_BUTTON = '#2563eb';
const PRIMARY_BUTTON_PRESSED = '#1d4ed8';

const moduleIcons: Record<SecurityModuleId, IconComponent> = {
  malware: Bug,
  ransomware: ShieldAlert,
  phishing: AlertTriangle,
  browser: Globe,
  email: Mail,
  'dark-web': Eye,
  identity: Fingerprint,
  biometrics: Fingerprint,
  social: Users,
  'family-safety': Users,
  'website-protection': Globe,
  'personal-firewall': ShieldCheck,
  scam: MessageSquare,
  fraud: CreditCard,
  'account-takeover': KeyRound,
  'credential-leaks': Database,
  network: Network,
  wifi: Wifi,
  vpn: Lock,
  vulnerability: Search,
  device: Smartphone,
  'camera-mic': Camera,
  privacy: ShieldCheck,
  file: FileText,
  'zero-day': Zap,
  'ai-attacks': Brain,
  deepfake: User,
  'threat-intel': Activity,
  'ddos-monitoring': Network,
  'sql-injection': Database,
  'api-security': Globe,
  siem: Activity,
  compliance: FileText,
  'executive-reporting': BarChart3,
};

const categories: ModuleCategory[] = ['Core Defense', 'Identity & Social', 'Family & Web', 'Network', 'Privacy', 'AI Intelligence'];

const navItems: { screen: AppScreen; label: string; icon: IconComponent }[] = [
  { screen: 'dashboard', label: 'Overview', icon: Home },
  { screen: 'protection', label: 'Protections', icon: ShieldCheck },
  { screen: 'assistant', label: 'AI Chat', icon: Brain },
  { screen: 'alerts', label: 'Alerts', icon: Bell },
  { screen: 'profile', label: 'Account', icon: User },
];

const sidebarManageItems: { screen: AppScreen; label: string; icon: IconComponent }[] = [
  { screen: 'schedule', label: 'Scan Schedule', icon: Calendar },
  { screen: 'subscriptions', label: 'Plan & Features', icon: Crown },
  { screen: 'billing', label: 'Billing', icon: CreditCard },
  { screen: 'tokens', label: 'AI Tokens', icon: Database },
  { screen: 'referrals', label: 'Rewards', icon: Star },
  { screen: 'settings', label: 'Preferences', icon: Settings },
];

const FALLBACK_TIMEZONES = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Riyadh', 'Asia/Dubai', 'Asia/Singapore', 'Australia/Sydney'];
const TIMEZONE_OPTIONS = (() => {
  try {
    const supportedValuesOf = Intl.supportedValuesOf;
    return supportedValuesOf ? supportedValuesOf('timeZone') : FALLBACK_TIMEZONES;
  } catch {
    return FALLBACK_TIMEZONES;
  }
})();
const LANGUAGE_OPTIONS = [
  'English (US)',
  'English (UK)',
  'Arabic',
  'French',
  'Spanish',
  'German',
  'Portuguese',
  'Hindi',
  'Swahili',
  'Chinese (Simplified)',
  'Japanese',
];
const OCCUPATION_OPTIONS = ['Security Manager', 'Parent or Guardian', 'Founder', 'Developer', 'Student', 'Analyst', 'Business Owner', 'IT Administrator', 'Creator', 'Other'];

const vulnerabilityCoverage = [
  { label: 'Public-facing vulns', level: 'Strong', icon: Search, color: '#7ee787' },
  { label: 'Credential theft', level: 'Strong', icon: KeyRound, color: '#95d475' },
  { label: 'Phishing & BEC', level: 'Strong', icon: AlertTriangle, color: '#f2cc60' },
  { label: 'Ransomware', level: 'Strong', icon: ShieldAlert, color: '#ff7b72' },
  { label: 'Cloud identity abuse', level: 'Strong', icon: Fingerprint, color: '#a78bfa' },
  { label: 'Misconfiguration', level: 'Strong', icon: Settings, color: '#7ee787' },
  { label: 'Supply chain / CI-CD', level: 'Meaningful', icon: Database, color: '#95d475' },
  { label: 'IoT / OT / BMS', level: 'Meaningful', icon: Network, color: '#f2cc60' },
  { label: 'Privacy / PII leakage', level: 'Meaningful', icon: Eye, color: '#a78bfa' },
  { label: 'LLM prompt injection', level: 'AI guarded', icon: Brain, color: '#ff7b72' },
  { label: 'Child safety scams', level: 'Guardian guarded', icon: Users, color: '#95d475' },
  { label: 'Website posture drift', level: 'Baseline watched', icon: Globe, color: '#7ee787' },
  { label: 'Personal firewall rules', level: 'Policy guarded', icon: ShieldCheck, color: '#ff7b72' },
];

const PLAN_CAPABILITIES: Record<PlanId, string[]> = {
  free: ['Security score', 'Basic malware scan', 'Device checks', 'Limited AI assistant'],
  premium: ['Real-time protection', 'Dark web monitoring', 'Website baseline', 'Personal firewall'],
  family: ['Child & family safety', 'Social media protection center', 'Identity theft monitoring', 'Shared safety reports'],
  professional: ['Advanced analytics', 'Fraud detection', 'Website monitoring', 'Deepfake analysis'],
  business: ['Team management', 'Compliance tools', 'Threat intelligence', 'Business website monitoring'],
  enterprise: ['DDoS monitoring', 'SQL injection detection', 'API security', 'SIEM integrations', 'Executive reporting'],
};

const TOKEN_OPERATIONS = [
  { title: 'Deep malware scan', detail: 'Full device and file behavior review', tokens: 8, minPlan: 'free' as PlanId, icon: Bug, color: '#ff7b72' },
  { title: 'Fraud investigation', detail: 'Payment, profile, and conversation analysis', tokens: 18, minPlan: 'professional' as PlanId, icon: CreditCard, color: '#f2cc60' },
  { title: 'Dark web analysis', detail: 'Breach, credential, alias, and card exposure review', tokens: 16, minPlan: 'premium' as PlanId, icon: Eye, color: '#a78bfa' },
  { title: 'Security audit', detail: 'Device, account, privacy, and network posture audit', tokens: 24, minPlan: 'business' as PlanId, icon: BarChart3, color: '#7ee787' },
  { title: 'Detailed report', detail: 'Exportable AI risk report with recommendations', tokens: 12, minPlan: 'premium' as PlanId, icon: FileText, color: '#95d475' },
  { title: 'Family safety review', detail: 'Guardian-approved conversation, contact, and youth scam risk analysis', tokens: 14, minPlan: 'family' as PlanId, icon: Users, color: '#95d475' },
  { title: 'Social profile sweep', detail: 'Linked account, fake profile, impersonation, and scam campaign review', tokens: 12, minPlan: 'family' as PlanId, icon: MessageSquare, color: '#7ee787' },
  { title: 'Website baseline', detail: 'SSL/TLS, DNS, headers, reputation, content drift, and exposure review', tokens: 20, minPlan: 'premium' as PlanId, icon: Globe, color: '#7ee787' },
  { title: 'Firewall policy tune-up', detail: 'Malicious links, risky domains, downloads, network filters, and policy recommendations', tokens: 10, minPlan: 'premium' as PlanId, icon: ShieldCheck, color: '#ff7b72' },
];

const SCHEDULED_SECURITY_OPERATIONS = [
  { title: 'Malware scan', detail: 'Files, apps, downloads, and behavior', tokens: 4, minPlan: 'free' as PlanId, icon: Bug, color: '#ff7b72' },
  { title: 'Vulnerability scan', detail: 'Patch level, app risk, and exposed services', tokens: 8, minPlan: 'premium' as PlanId, icon: Search, color: '#f2cc60' },
  { title: 'Dark web scan', detail: 'Credentials, aliases, cards, and breach dumps', tokens: 10, minPlan: 'premium' as PlanId, icon: Eye, color: '#a78bfa' },
  { title: 'Identity monitoring', detail: 'Account recovery, passkeys, credential reuse, and ATO patterns', tokens: 9, minPlan: 'family' as PlanId, icon: Fingerprint, color: '#f2cc60' },
  { title: 'Privacy audit', detail: 'Trackers, broker exposure, and sensitive permissions', tokens: 9, minPlan: 'family' as PlanId, icon: ShieldCheck, color: '#95d475' },
  { title: 'Social media scan', detail: 'Profiles, messages, links, and scam patterns', tokens: 12, minPlan: 'family' as PlanId, icon: Users, color: '#7ee787' },
  { title: 'Caller protection scan', detail: 'Spam calls, vishing, caller reputation, and risky SMS lures', tokens: 7, minPlan: 'premium' as PlanId, icon: Smartphone, color: '#a78bfa' },
  { title: 'Security health review', detail: 'Score, recommendations, and weekly posture', tokens: 14, minPlan: 'premium' as PlanId, icon: Activity, color: '#7ee787' },
  { title: 'Family safety scan', detail: 'Guardian-approved checks for grooming, suspicious contacts, youth scams, and fake giveaways', tokens: 11, minPlan: 'family' as PlanId, icon: Users, color: '#95d475' },
  { title: 'Website posture scan', detail: 'Registered site baseline, SSL/TLS, domain reputation, malware, and malicious changes', tokens: 15, minPlan: 'premium' as PlanId, icon: Globe, color: '#7ee787' },
  { title: 'Firewall policy review', detail: 'Risky domains, scam communications, downloads, and network filtering controls', tokens: 9, minPlan: 'premium' as PlanId, icon: ShieldCheck, color: '#ff7b72' },
];

const RESEARCH_SECURITY_RECOMMENDATIONS = [
  {
    title: 'Phase 1 core defense',
    detail: 'Malware scanning, phishing/URL blocking, credential breach monitoring, and SMS/call spam filtering first.',
    source: 'Threat Protection report',
    minPlan: 'free' as PlanId,
    icon: ShieldCheck,
    color: '#7ee787',
  },
  {
    title: 'Phase 2 social and privacy',
    detail: 'Social scam detection, network defense, VPN checks, camera/mic alerts, and privacy-safe device controls.',
    source: 'Threat Protection report',
    minPlan: 'family' as PlanId,
    icon: Users,
    color: '#95d475',
  },
  {
    title: 'Phase 3 AI and enterprise',
    detail: 'Prompt injection guard, deepfake detection, adversarial ML defense, financial fraud modules, and compliance reporting.',
    source: 'Threat Protection report',
    minPlan: 'business' as PlanId,
    icon: Brain,
    color: '#a78bfa',
  },
  {
    title: 'Visibility before automation',
    detail: 'Start with asset inventory, telemetry, external scanning, vulnerability discovery, and configuration assessment.',
    source: 'Cyber Automation report',
    minPlan: 'premium' as PlanId,
    icon: Search,
    color: '#f2cc60',
  },
  {
    title: 'Identity hardening',
    detail: 'Prioritize MFA/passkeys, token/session revocation, admin hardening, credential reuse checks, and account recovery safety.',
    source: 'Cyber Automation report',
    minPlan: 'premium' as PlanId,
    icon: Fingerprint,
    color: '#ff7b72',
  },
  {
    title: 'Human approval gates',
    detail: 'Keep human review for high-impact AI actions, mass account changes, production patching, OT isolation, and public comms.',
    source: 'Cyber Automation report',
    minPlan: 'business' as PlanId,
    icon: CheckCircle,
    color: '#7ee787',
  },
];

const ECOSYSTEM_CENTER_WORKFLOWS: Partial<Record<SecurityModuleId, { title: string; detail: string; metric: string }[]>> = {
  'family-safety': [
    { title: 'Guardian permission model', detail: 'Maps child profiles, age-appropriate privacy controls, consent boundaries, and guardian escalation rules.', metric: '12 policies' },
    { title: 'Conversation risk analysis', detail: 'Scores grooming cues, secrecy pressure, suspicious contacts, romance pressure, fake giveaways, and recruitment fraud.', metric: '4 flagged' },
    { title: 'Safety coaching', detail: 'Generates plain-language recommendations guardians can discuss with children without exposing unnecessary private content.', metric: '6 actions' },
  ],
  social: [
    { title: 'Linked social scanner', detail: 'Monitors linked accounts, public profiles, business pages, impersonation, compromise risk, and scam campaign patterns.', metric: '5 accounts' },
    { title: 'Submission analysis', detail: 'Profiles, messages, screenshots, links, and conversations receive trust scores, fraud risk, explanations, and recommendations.', metric: '84 reviewed' },
    { title: 'Deception safeguards', detail: 'Uses account reputation, language mismatch, public metadata, and behavior together without relying on nationality or location alone.', metric: '7 alerts' },
  ],
  'website-protection': [
    { title: 'Website registration', detail: 'Creates baselines for business websites, e-commerce stores, portfolios, blogs, and web applications.', metric: '3 sites' },
    { title: 'Security baseline storage', detail: 'Tracks SSL/TLS, DNS, security headers, content posture, exposed services, malware indicators, and reputation.', metric: '82 score' },
    { title: 'Continuous drift monitoring', detail: 'Watches for phishing abuse, malicious changes, suspicious redirects, exposed credentials, and domain risk.', metric: '3 issues' },
  ],
  'personal-firewall': [
    { title: 'Intelligent filtering', detail: 'Screens malicious links, harmful domains, risky websites, fraudulent downloads, and suspicious network activity.', metric: '71 filtered' },
    { title: 'Policy-aware actions', detail: 'Combines protection settings, subscription entitlements, AI analysis, and monitoring modules before recommending action.', metric: '38 rules' },
    { title: 'Proactive alerts', detail: 'Turns scam communications, phishing attempts, and risky sites into explainable alerts and customizable controls.', metric: '14 actions' },
  ],
};

const SCHEDULE_FREQUENCY_OPTIONS: { label: string; value: ScheduleFrequency }[] = [
  { label: 'Once', value: 'once' },
  { label: 'Hourly', value: 'hourly' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
  { label: 'Multi-day', value: 'multiple' },
  { label: 'Interval', value: 'custom' },
  { label: 'Recurring', value: 'recurring' },
];

function isModuleAccessible(module: SecurityModule, plan: PlanId) {
  return PLAN_RANK[plan] >= PLAN_RANK[module.minPlan];
}

function hexWithAlpha(hex: string, alpha: string) {
  return `${hex}${alpha}`;
}

function statusColor(status: SecurityStatus, colors: ThemePalette) {
  if (status === 'Protected') return colors.success;
  if (status === 'Warning') return colors.warning;
  if (status === 'Locked') return colors.textSubtle;
  return colors.primary;
}

function severityColor(severity: string, colors: ThemePalette) {
  if (severity === 'critical') return colors.danger;
  if (severity === 'high') return colors.warning;
  if (severity === 'medium') return colors.purple;
  return colors.primary;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getSpeechRecognitionConstructor() {
  if (Platform.OS !== 'web') return null;

  const speechGlobal = globalThis as typeof globalThis & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };

  return speechGlobal.SpeechRecognition || speechGlobal.webkitSpeechRecognition || null;
}

function formatTranscript(base: string, transcript: string) {
  const nextTranscript = transcript.trim();
  if (!nextTranscript) return base;
  return `${base.trim()}${base.trim() ? ' ' : ''}${nextTranscript}`.trimStart();
}

function calculateProfileCrop(asset: ProfileCropAsset, zoom: number, offset: { x: number; y: number }, rotation: number) {
  const normalizedRotation = ((rotation % 360) + 360) % 360;
  const rotatedSideways = normalizedRotation === 90 || normalizedRotation === 270;
  const width = rotatedSideways ? asset.height : asset.width;
  const height = rotatedSideways ? asset.width : asset.height;
  const baseScale = Math.max(PROFILE_CROP_BOX_SIZE / Math.max(1, width), PROFILE_CROP_BOX_SIZE / Math.max(1, height));
  const cropSize = clampNumber(PROFILE_CROP_BOX_SIZE / (baseScale * zoom), Math.min(width, height) * 0.25, Math.min(width, height));
  const centerX = width / 2 - offset.x / (baseScale * zoom);
  const centerY = height / 2 - offset.y / (baseScale * zoom);

  return {
    originX: Math.round(clampNumber(centerX - cropSize / 2, 0, Math.max(0, width - cropSize))),
    originY: Math.round(clampNumber(centerY - cropSize / 2, 0, Math.max(0, height - cropSize))),
    width: Math.round(cropSize),
    height: Math.round(cropSize),
  };
}

function averageModuleScore(ids: SecurityModuleId[]) {
  const modules = MODULES.filter((module) => ids.includes(module.id));
  if (!modules.length) return 0;

  return Math.round(modules.reduce((total, module) => total + module.score, 0) / modules.length);
}

function buildSecurityScoreModel(activity: SecurityScoreActivity, plan: PlanId): SecurityScoreModel {
  const accessibleModules = MODULES.filter((module) => isModuleAccessible(module, plan));
  const lockedModules = MODULES.length - accessibleModules.length;
  const moduleAverage = Math.round(accessibleModules.reduce((total, module) => total + module.score, 0) / Math.max(1, accessibleModules.length));
  const blockedThreats = RECENT_THREATS.filter((threat) => threat.blocked).length * 11 + activity.completedScans + activity.refreshes * 3;
  const activeIssues = RECENT_THREATS.filter((threat) => !threat.blocked).length + Math.max(0, 6 - activity.resolvedIssues);
  const criticalPenalty = RECENT_THREATS.filter((threat) => threat.severity === 'critical' && !threat.blocked).length * 7;
  const lockedPenalty = Math.min(9, Math.round(lockedModules * 0.35));
  const score = clampNumber(
    Math.round(moduleAverage - activeIssues * 2 - criticalPenalty - lockedPenalty + Math.min(5, activity.completedScans / 8) + Math.min(4, activity.resolvedIssues / 3) + activity.userActivity / 45),
    42,
    99,
  );
  const label = score >= 90 ? 'Excellent' : score >= 80 ? 'Strong' : score >= 68 ? 'Moderate' : 'Needs work';
  const status = score >= 86 ? 'SECURE' : score >= 72 ? 'MONITOR' : 'ACTION';
  const trend = activity.refreshes > 0 ? `+${Math.min(9, activity.refreshes + activity.resolvedIssues)} refreshed` : '+4 this week';
  const breakdown = [
    { label: 'Malware', value: averageModuleScore(['malware', 'ransomware', 'file']), color: '#ff7b72' },
    { label: 'Identity', value: averageModuleScore(['dark-web', 'identity', 'credential-leaks', 'account-takeover', 'social']), color: '#a78bfa' },
    { label: 'Family/Web', value: averageModuleScore(['family-safety', 'website-protection', 'personal-firewall']), color: '#95d475' },
    { label: 'Network', value: averageModuleScore(['network', 'wifi', 'vpn', 'ddos-monitoring', 'api-security']), color: '#7ee787' },
    { label: 'Privacy', value: averageModuleScore(['privacy', 'device', 'camera-mic']), color: '#95d475' },
    { label: 'AI defense', value: averageModuleScore(['zero-day', 'ai-attacks', 'deepfake', 'threat-intel']), color: '#f2cc60' },
  ];
  const trendData = SCORE_HISTORY.map((item, index) => ({
    label: item.label,
    value: clampNumber(score - (SCORE_HISTORY.length - index - 1) * 2 + (index % 2 === 0 ? -1 : 1), 45, 99),
  }));

  return {
    score,
    label,
    status,
    trend,
    updatedAt: activity.refreshes ? 'Updated just now' : 'Auto refresh active',
    detectedThreats: RECENT_THREATS.length + activity.refreshes,
    blockedThreats,
    activeIssues,
    filesScanned: `${(18.4 + activity.completedScans / 10).toFixed(1)}K`,
    activeShields: `${accessibleModules.length}/${MODULES.length}`,
    breakdown,
    trendData,
    insights: [
      `${activity.completedScans} completed scans are feeding this score.`,
      `${activity.resolvedIssues} issues resolved recently improved the posture.`,
      lockedModules > 0 ? `${lockedModules} advanced shields are locked by plan.` : 'All enterprise shields are available.',
    ],
  };
}

function calculateMonthlyRuns(frequency: ScheduleFrequency, timesPerDay: number, intervalHours: number) {
  if (frequency === 'once') return 1;
  if (frequency === 'hourly') return 24 * 30;
  if (frequency === 'daily') return 30;
  if (frequency === 'weekly') return 4;
  if (frequency === 'monthly') return 1;
  if (frequency === 'yearly') return 1;
  if (frequency === 'multiple') return clampNumber(timesPerDay, 2, 12) * 30;
  if (frequency === 'custom') return Math.ceil((24 * 30) / clampNumber(intervalHours, 1, 720));
  return 8;
}

function moduleIdForScheduledOperation(title: string): SecurityModuleId {
  const normalized = title.toLowerCase();
  if (normalized.includes('malware')) return 'malware';
  if (normalized.includes('vulnerability')) return 'vulnerability';
  if (normalized.includes('dark web')) return 'dark-web';
  if (normalized.includes('identity')) return 'identity';
  if (normalized.includes('privacy')) return 'privacy';
  if (normalized.includes('social')) return 'social';
  if (normalized.includes('caller')) return 'scam';
  if (normalized.includes('family')) return 'family-safety';
  if (normalized.includes('website')) return 'website-protection';
  if (normalized.includes('firewall')) return 'personal-firewall';
  return 'threat-intel';
}

function formatPrice(plan: PlanId, cycle: BillingCycle) {
  const info = PLANS.find((item) => item.id === plan);
  if (!info) return '';
  if (info.enterprise) return 'Contact sales';
  const value = cycle === 'yearly' ? info.yearly : info.monthly;
  if (value === 0) return '$0';
  return `$${value?.toFixed(2)}`;
}

function formatAiPromptLimit(plan: PlanId) {
  const limit = PLAN_ENTITLEMENT_PROFILES[plan].aiPromptLimit;
  return limit === 'unlimited' ? 'Unlimited AI usage' : `${limit} guided AI prompts`;
}

function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
  glow?: string;
}) {
  const { colors } = useDeltexTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function useButtonSpinner(onPress: () => void | Promise<void>, disabled?: boolean) {
  const [spinning, setSpinning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handlePress = useCallback(async () => {
    if (disabled || spinning) return;

    setSpinning(true);
    if (timerRef.current) clearTimeout(timerRef.current);

    try {
      await Promise.resolve(onPress());
    } finally {
      timerRef.current = setTimeout(() => setSpinning(false), 520);
    }
  }, [disabled, onPress, spinning]);

  return { spinning, handlePress };
}

function GradientButton({
  label,
  onPress,
  icon: Icon,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void | Promise<void>;
  icon?: IconComponent;
  disabled?: boolean;
  style?: object;
}) {
  const { spinning, handlePress } = useButtonSpinner(onPress, disabled);

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      disabled={disabled || spinning}
      style={() => [{ opacity: disabled ? 0.55 : 1 }, style]}
    >
      {({ pressed }) => (
        <View style={[styles.gradientButton, { backgroundColor: pressed ? PRIMARY_BUTTON_PRESSED : PRIMARY_BUTTON }]}>
          {spinning ? <ActivityIndicator size="small" color="#ffffff" /> : Icon ? <Icon size={16} color="#ffffff" strokeWidth={2.5} /> : null}
          <Text style={styles.gradientButtonText} numberOfLines={1}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

function OutlineButton({
  label,
  onPress,
  icon: Icon,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void | Promise<void>;
  icon?: IconComponent;
  color?: string;
  disabled?: boolean;
  style?: object;
}) {
  const { spinning, handlePress } = useButtonSpinner(onPress, disabled);

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      disabled={disabled || spinning}
      style={({ pressed }) => [
        styles.outlineButton,
        { backgroundColor: pressed ? PRIMARY_BUTTON_PRESSED : PRIMARY_BUTTON, opacity: disabled ? 0.55 : 1 },
        style,
      ]}
    >
      {spinning ? <ActivityIndicator size="small" color="#ffffff" /> : Icon ? <Icon size={16} color="#ffffff" /> : null}
      <Text style={styles.outlineButtonText} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

function BrandLogo({ compact }: { compact?: boolean }) {
  const { colors } = useDeltexTheme();

  return (
    <View style={styles.logoRow}>
      <Image source={logoSource} style={compact ? styles.logoSmall : styles.logoLarge} resizeMode="contain" />
      <View>
        <Text style={[styles.logoText, { color: colors.text, fontSize: compact ? 14 : 20 }]}>Deltex AI</Text>
        {!compact ? <Text style={[styles.logoSubtext, { color: colors.textMuted }]}>Next-Gen Cyber Defense</Text> : null}
      </View>
    </View>
  );
}

function StatusPill({ status }: { status: SecurityStatus }) {
  const { colors } = useDeltexTheme();
  const color = statusColor(status, colors);

  return (
    <View style={[styles.statusPill, { borderColor: hexWithAlpha(color, '55'), backgroundColor: hexWithAlpha(color, '16') }]}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={[styles.statusText, { color }]}>{status}</Text>
    </View>
  );
}

function ScoreRing({ score, color, size = 128 }: { score: number; color: string; size?: number }) {
  const { colors } = useDeltexTheme();
  const radius = (size - 14) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <View style={[styles.ringContainer, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.surfaceStrong} strokeWidth={9} fill="transparent" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={9}
          fill="transparent"
          strokeDasharray={[circumference, circumference]}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={[styles.ringScore, { color }]}>{score}</Text>
        <Text style={[styles.ringLabel, { color: colors.textMuted }]}>score</Text>
      </View>
    </View>
  );
}

function DonutBreakdownChart({ data, size = 112 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const { colors } = useDeltexTheme();
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = Math.max(1, data.reduce((sum, item) => sum + item.value, 0));
  let offset = 0;

  return (
    <View style={[styles.donutShell, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.surfaceStrong} strokeWidth={strokeWidth} fill="transparent" />
        {data.map((item) => {
          const dash = (item.value / total) * circumference;
          const strokeDashoffset = -offset;
          offset += dash;

          return (
            <Circle
              key={item.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={item.color}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={[dash, circumference - dash]}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="butt"
              rotation="-90"
              originX={size / 2}
              originY={size / 2}
            />
          );
        })}
      </Svg>
      <View style={styles.donutCenter}>
        <Text style={[styles.donutValue, { color: colors.text }]}>{Math.round(total / data.length)}</Text>
        <Text style={[styles.donutLabel, { color: colors.textSubtle }]}>avg</Text>
      </View>
    </View>
  );
}

function SectionHeader({
  title,
  subtitle,
  action,
  onAction,
}: {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
}) {
  const { colors } = useDeltexTheme();

  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
      </View>
      {action && onAction ? (
        <Pressable onPress={onAction} style={styles.sectionAction}>
          <Text style={[styles.sectionActionText, { color: colors.primary }]}>{action}</Text>
          <ChevronRight size={14} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const { colors } = useDeltexTheme();

  return (
    <View style={styles.screenHeader}>
      {onBack ? (
        <Pressable onPress={onBack} style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ChevronLeft size={19} color={colors.text} />
        </Pressable>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.screenSubtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const { colors } = useDeltexTheme();

  return (
    <View style={[styles.segmented, { backgroundColor: colors.surfaceStrong, borderColor: colors.border }]}>
      {options.map((option) => {
        const active = value === option.value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segment, active && { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.segmentText, { color: active ? '#ffffff' : colors.textMuted }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function parseDateTimeField(value: string, mode: 'date' | 'time') {
  const date = new Date();

  if (mode === 'date') {
    const parsed = new Date(`${value}T12:00:00`);
    return Number.isNaN(parsed.getTime()) ? date : parsed;
  }

  const [hours, minutes] = value.split(':').map((part) => Number(part));
  if (!Number.isNaN(hours)) date.setHours(hours);
  if (!Number.isNaN(minutes)) date.setMinutes(minutes);
  date.setSeconds(0);
  return date;
}

function formatDateTimeField(date: Date, mode: 'date' | 'time') {
  if (mode === 'date') {
    return date.toISOString().slice(0, 10);
  }

  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function DateTimeField({
  label,
  value,
  mode,
  onChange,
}: {
  label: string;
  value: string;
  mode: 'date' | 'time';
  onChange: (value: string) => void;
}) {
  const { colors } = useDeltexTheme();
  const [open, setOpen] = useState(false);
  const Icon = mode === 'date' ? Calendar : Clock;

  const commitDate = useCallback(
    (date: Date) => {
      onChange(formatDateTimeField(date, mode));
    },
    [mode, onChange],
  );

  return (
    <View style={styles.scheduleField}>
      <Text style={[styles.scheduleFieldLabel, { color: colors.textSubtle }]}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.dateTimeField, { backgroundColor: colors.input, borderColor: colors.border }]}
      >
        <Icon size={15} color={colors.primary} />
        <Text style={[styles.dateTimeFieldText, { color: colors.text }]}>{value}</Text>
      </Pressable>
      {Platform.OS !== 'web' && open ? (
        <DateTimePicker
          value={parseDateTimeField(value, mode)}
          mode={mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, selectedDate) => {
            setOpen(false);
            if (selectedDate) commitDate(selectedDate);
          }}
        />
      ) : null}
      {Platform.OS === 'web' ? (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Select {label.toLowerCase()}</Text>
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder={mode === 'date' ? 'YYYY-MM-DD' : 'HH:MM'}
                placeholderTextColor={colors.textSubtle}
                style={[styles.scheduleInput, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
                {...(Platform.OS === 'web' ? ({ type: mode } as object) : {})}
              />
              <View style={styles.modalActions}>
                <OutlineButton label="Cancel" onPress={() => setOpen(false)} color={colors.textMuted} style={styles.flexButton} />
                <GradientButton label="Done" onPress={() => setOpen(false)} icon={Check} style={styles.flexButton} />
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

function SearchableSelectField({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Select value',
}: {
  label: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
  placeholder?: string;
}) {
  const { colors } = useDeltexTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const filteredOptions = options
    .filter((option) => option.toLowerCase().includes(query.trim().toLowerCase()))
    .slice(0, 80);

  return (
    <View>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Select ${label}`}
        style={[styles.profileInputShell, { backgroundColor: colors.input, borderColor: colors.border }]}
      >
        <Text style={[styles.profileInputLabel, { color: colors.textSubtle }]}>{label}</Text>
        <View style={styles.selectFieldValueRow}>
          <Text style={[styles.selectFieldValue, { color: value ? colors.text : colors.textSubtle }]} numberOfLines={1}>
            {value || placeholder}
          </Text>
          <Search size={15} color={colors.textMuted} />
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.selectModalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{label}</Text>
            <View style={[styles.searchShell, { backgroundColor: colors.input, borderColor: colors.border, marginTop: 12 }]}>
              <Search size={17} color={colors.textMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                autoFocus={Platform.OS === 'web'}
                placeholder="Search"
                placeholderTextColor={colors.textSubtle}
                style={[styles.input, { color: colors.text }]}
              />
            </View>
            <ScrollView style={styles.selectOptionList} keyboardShouldPersistTaps="handled">
              {filteredOptions.map((option) => {
                const active = option === value;

                return (
                  <Pressable
                    key={option}
                    onPress={() => {
                      onSelect(option);
                      setOpen(false);
                      setQuery('');
                    }}
                    style={[styles.selectOptionRow, active && { backgroundColor: colors.primary }]}
                  >
                    <Text style={[styles.selectOptionText, { color: active ? '#ffffff' : colors.text }]} numberOfLines={1}>
                      {option}
                    </Text>
                    {active ? <Check size={16} color="#ffffff" /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
            <OutlineButton label="Cancel" onPress={() => setOpen(false)} color={colors.textMuted} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ThemeModeControl() {
  const { preference, setPreference } = useDeltexTheme();

  return (
    <SegmentedControl<ThemePreference>
      value={preference}
      onChange={(value) => void setPreference(value)}
      options={[
        { label: 'Light', value: 'light' },
        { label: 'Dark', value: 'dark' },
        { label: 'Auto', value: 'system' },
      ]}
    />
  );
}

function GoogleGlyph() {
  return (
    <Svg width={24} height={24} viewBox="0 0 48 48" accessibilityLabel="Google">
      <Path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.7 1.2 9.2 3.6l6.9-6.9C35.9 2.4 30.5 0 24 0 14.6 0 6.5 5.4 2.6 13.2l8 6.2C12.4 13.7 17.7 9.5 24 9.5z"
      />
      <Path
        fill="#4285F4"
        d="M47 24.6c0-1.6-.1-3.1-.4-4.6H24v9h12.9c-.6 3-2.3 5.5-4.8 7.2l7.7 6C44.4 38 47 31.8 47 24.6z"
      />
      <Path
        fill="#FBBC05"
        d="M10.5 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-8-6.2C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.8l7.9-6.2z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.2 1.4-4.9 2.3-8.2 2.3-6.3 0-11.6-4.2-13.5-9.9l-8 6.2C6.5 42.6 14.6 48 24 48z"
      />
    </Svg>
  );
}

function MicrosoftGlyph() {
  return (
    <View style={styles.microsoftGlyph}>
      <View style={[styles.microsoftSquare, { backgroundColor: '#F25022' }]} />
      <View style={[styles.microsoftSquare, { backgroundColor: '#7FBA00' }]} />
      <View style={[styles.microsoftSquare, { backgroundColor: '#00A4EF' }]} />
      <View style={[styles.microsoftSquare, { backgroundColor: '#FFB900' }]} />
    </View>
  );
}

function ProviderButton({
  provider,
  label,
  onPress,
}: {
  provider: AuthProviderName;
  label: string;
  onPress: () => void;
}) {
  const { colors } = useDeltexTheme();
  const brand = {
    google: {
      background: colors.mode === 'dark' ? '#ffffff' : '#ffffff',
      border: '#dadce0',
      text: '#1f1f1f',
      subtext: '#5f6368',
    },
    microsoft: {
      background: colors.mode === 'dark' ? '#171717' : '#ffffff',
      border: colors.mode === 'dark' ? '#3b3b3b' : '#d1d5db',
      text: colors.mode === 'dark' ? '#f8fafc' : '#1f2937',
      subtext: colors.mode === 'dark' ? '#a1a1aa' : '#6b7280',
    },
    apple: {
      background: colors.mode === 'dark' ? '#000000' : '#ffffff',
      border: colors.mode === 'dark' ? '#2f2f2f' : '#000000',
      text: colors.mode === 'dark' ? '#ffffff' : '#000000',
      subtext: colors.mode === 'dark' ? '#d4d4d8' : '#3f3f46',
    },
    passkey: {
      background: colors.card,
      border: colors.border,
      text: colors.text,
      subtext: colors.primary,
    },
    email: {
      background: colors.card,
      border: colors.border,
      text: colors.text,
      subtext: colors.textMuted,
    },
    biometric: {
      background: colors.card,
      border: colors.border,
      text: colors.text,
      subtext: colors.accent,
    },
    mfa: {
      background: colors.card,
      border: colors.border,
      text: colors.text,
      subtext: colors.warning,
    },
  }[provider];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Continue with ${label}`}
      accessibilityHint={`Signs in using ${label}`}
      style={[styles.providerButton, { backgroundColor: brand.background, borderColor: brand.border }]}
    >
      <View style={styles.providerIconSlot}>
        {provider === 'google' ? <GoogleGlyph /> : null}
        {provider === 'microsoft' ? <MicrosoftGlyph /> : null}
        {provider === 'apple' ? <Apple size={19} color={brand.text} fill={brand.text} /> : null}
        {provider === 'passkey' ? <KeyRound size={19} color={colors.primary} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.providerLabel, { color: brand.text }]}>{label}</Text>
        <Text style={[styles.providerSubLabel, { color: brand.subtext }]}>Secure sign in</Text>
      </View>
    </Pressable>
  );
}

function valueForChartPoint(item: Record<string, unknown>, key: string) {
  const value = item[key];
  return typeof value === 'number' ? value : 0;
}

function buildLinePath(points: { x: number; y: number }[]) {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
}

function LineAreaChart({
  data,
  color,
  secondaryColor,
  primaryKey = 'value',
  secondaryKey,
  height = 164,
}: {
  data: Record<string, unknown>[];
  color: string;
  secondaryColor?: string;
  primaryKey?: string;
  secondaryKey?: string;
  height?: number;
}) {
  const { colors } = useDeltexTheme();
  const { width } = useWindowDimensions();
  const fade = useRef(new Animated.Value(0.72)).current;
  const chartWidth = clampNumber(width - 56, 280, 720);
  const chartHeight = height;
  const paddingX = 18;
  const paddingTop = 14;
  const paddingBottom = 28;
  const values = data.flatMap((item) => [
    valueForChartPoint(item, primaryKey),
    secondaryKey ? valueForChartPoint(item, secondaryKey) : 0,
  ]);
  const maxValue = Math.max(...values, 1);
  const innerHeight = chartHeight - paddingTop - paddingBottom;
  const step = data.length > 1 ? (chartWidth - paddingX * 2) / (data.length - 1) : chartWidth - paddingX * 2;
  const makePoints = (key: string) =>
    data.map((item, index) => {
      const value = valueForChartPoint(item, key);
      return {
        x: paddingX + step * index,
        y: paddingTop + innerHeight - (value / maxValue) * innerHeight,
      };
    });
  const primaryPoints = makePoints(primaryKey);
  const secondaryPoints = secondaryKey ? makePoints(secondaryKey) : [];
  const primaryPath = buildLinePath(primaryPoints);
  const secondaryPath = secondaryPoints.length ? buildLinePath(secondaryPoints) : '';
  const areaPath = `${primaryPath} L ${primaryPoints[primaryPoints.length - 1]?.x.toFixed(1) || paddingX} ${chartHeight - paddingBottom} L ${paddingX} ${chartHeight - paddingBottom} Z`;

  useEffect(() => {
    fade.setValue(0.4);
    Animated.timing(fade, {
      toValue: 1,
      duration: 520,
      useNativeDriver: true,
    }).start();
  }, [data, fade, primaryKey, secondaryKey]);

  return (
    <Animated.View style={[styles.lineChartShell, { opacity: fade }]}>
      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <SvgLinearGradient id="lineArea" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </SvgLinearGradient>
        </Defs>
        {[0, 1, 2].map((line) => {
          const y = paddingTop + (innerHeight / 2) * line;
          return <Path key={line} d={`M ${paddingX} ${y} L ${chartWidth - paddingX} ${y}`} stroke={colors.border} strokeWidth={1} opacity={0.8} />;
        })}
        <Path d={areaPath} fill="url(#lineArea)" />
        {secondaryPath ? <Path d={secondaryPath} fill="none" stroke={secondaryColor || colors.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /> : null}
        <Path d={primaryPath} fill="none" stroke={color} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
        {primaryPoints.map((point, index) => (
          <Circle key={`${point.x}-${index}`} cx={point.x} cy={point.y} r={3.2} fill={colors.card} stroke={color} strokeWidth={2} />
        ))}
      </Svg>
      <View style={styles.lineChartLabels}>
        {data.map((item) => (
          <Text key={String(item.label)} style={[styles.chartLabel, { color: colors.textSubtle }]}>
            {String(item.label)}
          </Text>
        ))}
      </View>
    </Animated.View>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  const { colors } = useDeltexTheme();
  const animated = useRef(new Animated.Value(0)).current;
  const clampedValue = clampNumber(value, 0, 100);

  useEffect(() => {
    Animated.timing(animated, {
      toValue: clampedValue,
      duration: 520,
      useNativeDriver: false,
    }).start();
  }, [animated, clampedValue]);

  const width = animated.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.progressTrack, { backgroundColor: colors.surfaceStrong }]}>
      <Animated.View style={[styles.progressFill, { width, backgroundColor: color }]} />
    </View>
  );
}

function ScrollScreen({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const desktopShell = width >= 920;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.scrollContent,
        desktopShell && styles.scrollContentDesktop,
        { paddingBottom: desktopShell ? 34 : Math.max(132, insets.bottom + 118) },
      ]}
    >
      {children}
    </ScrollView>
  );
}

function SplashScreen({ onNext }: { onNext: () => void }) {
  const { colors } = useDeltexTheme();

  useEffect(() => {
    const timer = setTimeout(onNext, 1200);
    return () => clearTimeout(timer);
  }, [onNext]);

  return (
    <LinearGradient colors={[colors.background, colors.background, colors.backgroundSoft]} style={styles.fullScreen}>
      <View style={styles.splashCenter}>
        <View style={styles.splashLogoFrame}>
          <Image source={logoSource} style={styles.splashLogo} resizeMode="contain" />
        </View>
        <View style={styles.loadingDots}>
          {[0, 1, 2].map((item) => (
            <View key={item} style={[styles.loadingDot, { backgroundColor: item === 1 ? colors.accent : colors.primary }]} />
          ))}
        </View>
      </View>
    </LinearGradient>
  );
}

function OnboardingScreen({ onNext }: { onNext: () => void }) {
  const { colors } = useDeltexTheme();
  const consent = useConsent();
  const [step, setStep] = useState(0);
  const [consentChoice, setConsentChoice] = useState<'pending' | 'accepted' | 'declined'>(consent.hasAcceptedConsent ? 'accepted' : 'pending');
  const slides = [
    {
      icon: Brain,
      color: colors.primary,
      title: 'AI-Powered Protection',
      description: 'Deltex AI analyzes threats, explains risk, and recommends clear actions before attackers can use a weakness.',
    },
    {
      icon: ShieldCheck,
      color: colors.accent,
      title: '360 Degree Security Coverage',
      description: 'Malware, phishing, ransomware, identity theft, dark web leaks, Wi-Fi risk, scams, fraud, and deepfakes are monitored together.',
    },
    {
      icon: Zap,
      color: colors.purple,
      title: 'Instant Response',
      description: 'Real-time alerts, trust scores, fraud risk scores, and guided remediation keep every decision understandable.',
    },
  ];
  const isAgreementStep = step >= slides.length;
  const slide = slides[Math.min(step, slides.length - 1)];
  const Icon = slide.icon;
  const canContinue = !isAgreementStep || consent.hasAcceptedConsent || consentChoice === 'accepted';

  const continueOnboarding = async () => {
    if (!isAgreementStep) {
      setStep(step + 1);
      return;
    }

    if (consentChoice !== 'accepted' && !consent.hasAcceptedConsent) return;

    if (!consent.hasAcceptedConsent) {
      await consent.acceptConsent();
    }

    onNext();
  };

  const declineConsent = async () => {
    setConsentChoice('declined');
    await consent.declineConsent();
  };

  return (
    <LinearGradient colors={[hexWithAlpha(slide.color, '24'), colors.background, colors.background]} style={styles.fullScreenPadded}>
      {!isAgreementStep && consent.hasAcceptedConsent ? (
        <Pressable onPress={onNext} style={styles.skipButton}>
          <Text style={[styles.skipText, { color: colors.textMuted }]}>Skip</Text>
        </Pressable>
      ) : (
        <View style={styles.skipButton} />
      )}

      {!isAgreementStep ? (
        <View style={styles.onboardingCenter}>
          <View style={[styles.onboardingOrb, { borderColor: hexWithAlpha(slide.color, '55'), backgroundColor: hexWithAlpha(slide.color, '14') }]}>
            <Icon size={64} color={slide.color} strokeWidth={1.8} />
          </View>
          <Text style={[styles.onboardingTitle, { color: slide.color }]}>{slide.title}</Text>
          <Text style={[styles.onboardingDescription, { color: colors.textMuted }]}>{slide.description}</Text>
          <View style={styles.pager}>
            {[...slides, { title: 'Agreements' }].map((_, index) => (
              <Pressable
                key={index}
                onPress={() => setStep(index)}
                style={[
                  styles.pagerDot,
                  {
                    width: index === step ? 26 : 8,
                    backgroundColor: index === step ? slide.color : colors.surfaceStrong,
                  },
                ]}
              />
            ))}
          </View>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.agreementContent}>
          <View style={[styles.onboardingOrb, { borderColor: hexWithAlpha(colors.primary, '55'), backgroundColor: hexWithAlpha(colors.primary, '14') }]}>
            <FileText size={56} color={colors.primary} strokeWidth={1.8} />
          </View>
          <Text style={[styles.onboardingTitle, { color: colors.primary }]}>Review agreements</Text>
          <Text style={[styles.onboardingDescription, { color: colors.textMuted }]}>
            You must accept the Deltex AI Terms, Privacy Policy, and Data Usage Agreement before creating or accessing an account.
          </Text>
          {consent.agreements.map((agreement) => (
            <Card key={agreement.id} style={styles.agreementCard}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{agreement.title}</Text>
              <Text style={[styles.cardCopy, { color: colors.textMuted }]}>{agreement.summary}</Text>
              <Text style={[styles.reportMetaText, { color: colors.primary, marginTop: 8 }]}>Version {agreement.version}</Text>
            </Card>
          ))}
          <View style={styles.agreementActions}>
            <OutlineButton
              label="I Agree"
              onPress={() => setConsentChoice('accepted')}
              icon={CheckCircle}
              color={consentChoice === 'accepted' ? colors.success : colors.primary}
              style={styles.assistantActionButton}
            />
            <OutlineButton
              label="I Do Not Agree"
              onPress={() => void declineConsent()}
              icon={ShieldAlert}
              color={colors.danger}
              style={styles.assistantActionButton}
            />
          </View>
          {consentChoice === 'declined' ? (
            <Text style={[styles.errorText, { color: colors.danger, textAlign: 'center' }]}>
              Registration is blocked until the required agreements are accepted.
            </Text>
          ) : null}
        </ScrollView>
      )}

      <GradientButton
        label={isAgreementStep ? 'Get Started' : 'Continue'}
        onPress={() => void continueOnboarding()}
        disabled={!canContinue}
      />
    </LinearGradient>
  );
}

function AuthScreen({ onComplete }: { onComplete: () => void }) {
  const { colors } = useDeltexTheme();
  const auth = useAuthContext();
  const referralRewards = useReferralRewards();
  const [email, setEmail] = useState('security@deltex.ai');
  const [password, setPassword] = useState('deltex-secure');
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [referralStatus, setReferralStatus] = useState<string | null>(null);

  const runAuth = useCallback(
    async (action: () => Promise<boolean>) => {
      if (referralCode.trim()) {
        const result = await referralRewards.applyReferralCoupon(referralCode, email);
        setReferralStatus(result.message);
      }

      const signedIn = await action();

      if (signedIn) {
        onComplete();
      }
    },
    [email, onComplete, referralCode, referralRewards],
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollScreen>
        <BrandLogo />
        <View style={styles.authHeader}>
          <Text style={[styles.authTitle, { color: colors.text }]}>Welcome back</Text>
          <Text style={[styles.authSubtitle, { color: colors.textMuted }]}>Sign in to your security command center.</Text>
        </View>

        <View style={styles.providerGrid}>
          <ProviderButton provider="google" label="Google" onPress={() => void runAuth(auth.signInWithGoogle)} />
          <ProviderButton provider="microsoft" label="Microsoft" onPress={() => void runAuth(() => auth.signInWithProvider('microsoft'))} />
          <ProviderButton provider="apple" label="Apple" onPress={() => void runAuth(() => auth.signInWithProvider('apple'))} />
          <ProviderButton provider="passkey" label="Passkey" onPress={() => void runAuth(() => auth.signInWithProvider('passkey'))} />
        </View>

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textSubtle }]}>OR USE EMAIL</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        <View style={styles.inputGroup}>
          <View style={[styles.inputShell, { backgroundColor: colors.input, borderColor: colors.border }]}>
            <Mail size={18} color={colors.textMuted} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Email address"
              placeholderTextColor={colors.textSubtle}
              style={[styles.input, { color: colors.text }]}
            />
          </View>
          <View style={[styles.inputShell, { backgroundColor: colors.input, borderColor: colors.border }]}>
            <Lock size={18} color={colors.textMuted} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="Password"
              placeholderTextColor={colors.textSubtle}
              style={[styles.input, { color: colors.text }]}
            />
            <Pressable onPress={() => setShowPassword((value) => !value)}>
              {showPassword ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
            </Pressable>
          </View>
        </View>

        <Card>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Referral code</Text>
          <Text style={[styles.cardCopy, { color: colors.textMuted }]}>Apply an invite coupon to unlock bonus tokens and trial rewards after setup.</Text>
          <View style={[styles.couponRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
            <TextInput
              value={referralCode}
              onChangeText={(value) => setReferralCode(value.toUpperCase())}
              autoCapitalize="characters"
              placeholder="DLTX-ABCDE-1234"
              placeholderTextColor={colors.textSubtle}
              style={[styles.input, { color: colors.text }]}
            />
            <OutlineButton
              label="Apply"
              onPress={async () => {
                const result = await referralRewards.applyReferralCoupon(referralCode, email);
                setReferralStatus(result.message);
              }}
              color={colors.accent}
            />
          </View>
          {referralStatus ? <Text style={[styles.menuDetail, { color: referralStatus.includes('invalid') ? colors.danger : colors.accent }]}>{referralStatus}</Text> : null}
        </Card>

        {auth.error ? (
          <View style={[styles.errorBox, { borderColor: hexWithAlpha(colors.danger, '55'), backgroundColor: hexWithAlpha(colors.danger, '12') }]}>
            <AlertTriangle size={16} color={colors.danger} />
            <Text style={[styles.errorText, { color: colors.danger }]}>{auth.error}</Text>
          </View>
        ) : null}

        <GradientButton
          label={auth.loading ? 'Signing In...' : 'Sign In Securely'}
          onPress={() => void runAuth(() => auth.signInWithCredentials(email, password))}
          disabled={auth.loading}
          icon={ShieldCheck}
        />

        <Card style={styles.authSecurityCard}>
          <View style={[styles.authSecurityIcon, { backgroundColor: hexWithAlpha(colors.primary, '18') }]}>
            <Fingerprint size={28} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Biometrics, passkeys, and MFA</Text>
            <Text style={[styles.cardCopy, { color: colors.textMuted }]}>Unlock with device biometrics, passkeys, or a multi-factor challenge.</Text>
          </View>
          <OutlineButton label="Unlock" onPress={() => void runAuth(auth.signInWithBiometrics)} color={colors.accent} />
        </Card>
      </ScrollScreen>
    </KeyboardAvoidingView>
  );
}

function SecuritySetupScreen({ onComplete }: { onComplete: () => void }) {
  const { colors } = useDeltexTheme();
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(SETUP_STEPS.map((step) => [step, true])),
  );
  const completion = Math.round((Object.values(enabled).filter(Boolean).length / SETUP_STEPS.length) * 100);

  return (
    <ScrollScreen>
      <ScreenHeader title="Security setup" subtitle="Tune Deltex AI before the first scan." />
      <Card glow={colors.primary}>
        <View style={styles.setupHero}>
          <ScoreRing score={completion} color={colors.primary} size={116} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { color: colors.text }]}>Initial posture ready</Text>
            <Text style={[styles.cardCopy, { color: colors.textMuted }]}>
              Turn on the protections you want. Permissions stay opt-in and analysis is based on multiple signals, never nationality or location alone.
            </Text>
          </View>
        </View>
      </Card>

      <View style={styles.setupList}>
        {SETUP_STEPS.map((step) => (
          <Card key={step} style={styles.setupRow}>
            <View style={[styles.checkBubble, { backgroundColor: enabled[step] ? colors.primary : colors.surfaceStrong }]}>
              <Check size={16} color={enabled[step] ? '#050505' : colors.textMuted} />
            </View>
            <Text style={[styles.setupText, { color: colors.text }]}>{step}</Text>
            <Switch
              value={enabled[step]}
              onValueChange={(value) => setEnabled((current) => ({ ...current, [step]: value }))}
              trackColor={{ false: colors.surfaceStrong, true: hexWithAlpha(colors.primary, '77') }}
              thumbColor={enabled[step] ? colors.accent : colors.textSubtle}
            />
          </Card>
        ))}
      </View>

      <GradientButton label="Run First AI Scan" onPress={onComplete} icon={RefreshCw} />
    </ScrollScreen>
  );
}

function PlanAccessCard({ onUpgrade }: { onUpgrade: () => void }) {
  const { colors } = useDeltexTheme();
  const { currentPlan, effectivePlan, trialBoost, protectionCredits, getLockedFeatures } = useSubscription();
  const plan = PLANS.find((item) => item.id === effectivePlan) || PLANS[0];
  const lockedFeatures = getLockedFeatures();
  const lockedModules = MODULES.filter((module) => !isModuleAccessible(module, effectivePlan)).length;
  const nextPlan = PLANS.find((item) => PLAN_RANK[item.id] === PLAN_RANK[effectivePlan] + 1);
  const entitlementProfile = PLAN_ENTITLEMENT_PROFILES[effectivePlan];

  return (
    <Card glow={plan.color}>
      <View style={styles.accessTopRow}>
        <View style={[styles.accessIcon, { backgroundColor: hexWithAlpha(plan.color, '18') }]}>
          <Crown size={18} color={plan.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{plan.name} feature scaling</Text>
          <Text style={[styles.cardCopy, { color: colors.textMuted }]}>
            {PLAN_CAPABILITIES[effectivePlan].join(', ')}. {lockedModules} modules and {lockedFeatures.length} feature gates are locked. Scan cadence: {entitlementProfile.scanFrequency}.
          </Text>
        </View>
      </View>

      <View style={styles.signalWrap}>
        {PLAN_CAPABILITIES[effectivePlan].map((capability) => (
          <View key={capability} style={[styles.signalChip, { backgroundColor: hexWithAlpha(plan.color, '10'), borderColor: hexWithAlpha(plan.color, '44') }]}>
            <Text style={[styles.signalText, { color: plan.color }]}>{capability}</Text>
          </View>
        ))}
        {trialBoost ? (
          <View style={[styles.signalChip, { backgroundColor: hexWithAlpha(colors.accent, '10'), borderColor: hexWithAlpha(colors.accent, '44') }]}>
            <Text style={[styles.signalText, { color: colors.accent }]}>Trial boost: {trialBoost.plan}</Text>
          </View>
        ) : null}
        <View style={[styles.signalChip, { backgroundColor: hexWithAlpha(colors.purple, '10'), borderColor: hexWithAlpha(colors.purple, '44') }]}>
          <Text style={[styles.signalText, { color: colors.purple }]}>{protectionCredits} protection credits</Text>
        </View>
      </View>

      {nextPlan ? (
        <OutlineButton label={`Upgrade to ${nextPlan.name}`} onPress={onUpgrade} icon={ArrowRight} color={nextPlan.color} />
      ) : (
        <Text style={[styles.cardCopy, { color: colors.textMuted }]}>Enterprise is fully unlocked for advanced threat operations and executive reporting.</Text>
      )}
      {currentPlan !== effectivePlan ? (
        <Text style={[styles.cardCopy, { color: colors.textMuted, marginTop: 8 }]}>Paid plan: {currentPlan}. Effective plan is elevated by a reward or trial.</Text>
      ) : null}
    </Card>
  );
}

function TokenWalletCard({ onManage }: { onManage: () => void }) {
  const { colors } = useDeltexTheme();
  const { effectivePlan, currentPlan, bonusTokens, getTokenAllowance } = useSubscription();
  const plan = PLANS.find((item) => item.id === effectivePlan) || PLANS[0];
  const profile = PLAN_ENTITLEMENT_PROFILES[effectivePlan];
  const allowance = getTokenAllowance();
  const used = Math.min(allowance - 3, Math.round(allowance * (effectivePlan === 'free' ? 0.68 : 0.36)));
  const remaining = Math.max(0, allowance - used);

  return (
    <Card glow={plan.color}>
      <View style={styles.tokenHeader}>
        <View style={[styles.accessIcon, { backgroundColor: hexWithAlpha(colors.accent, '18') }]}>
          <Database size={18} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Monthly security tokens</Text>
          <Text style={[styles.cardCopy, { color: colors.textMuted }]}>
            {remaining} of {allowance} tokens available. {bonusTokens} bonus tokens active. {profile.reportDepth} reporting on {effectivePlan} access.
          </Text>
        </View>
        <Text style={[styles.tokenNumber, { color: colors.accent }]}>{remaining}</Text>
      </View>
      <ProgressBar value={(remaining / allowance) * 100} color={colors.accent} />
      <View style={styles.tokenMetaRow}>
        <Text style={[styles.tokenMetaText, { color: colors.textMuted }]}>{profile.aiPromptLimit === 'unlimited' ? 'Unlimited AI' : `${profile.aiPromptLimit} AI prompts`}</Text>
        <Text style={[styles.tokenMetaText, { color: plan.color }]}>{currentPlan === effectivePlan ? plan.name : `${plan.name} trial`}</Text>
      </View>
      <OutlineButton label="Manage Tokens" onPress={onManage} icon={ChevronRight} color={colors.accent} />
    </Card>
  );
}

function SecurityScoreCard({ model, onRefresh }: { model: SecurityScoreModel; onRefresh: () => void }) {
  const { colors } = useDeltexTheme();
  const statusColorValue = model.score >= 90 ? colors.success : model.score >= 75 ? colors.accent : colors.warning;

  return (
    <Card glow={colors.primary} style={styles.securityScoreCard}>
      <View style={styles.securityScoreTop}>
        <ScoreRing score={model.score} color={colors.primary} size={118} />
        <View style={{ flex: 1 }}>
          <View style={styles.scoreTitleRow}>
            <Text style={[styles.scoreStateTitle, { color: colors.text }]}>{model.label}</Text>
            <View style={[styles.scoreStatusBadge, { backgroundColor: hexWithAlpha(statusColorValue, '18'), borderColor: hexWithAlpha(statusColorValue, '55') }]}>
              <Text style={[styles.scoreStatusText, { color: statusColorValue }]}>{model.status}</Text>
            </View>
          </View>
          <Text style={[styles.cardCopy, { color: colors.textMuted }]}>
            Dynamic score from scans, blocked threats, resolved issues, plan coverage, and recent activity.
          </Text>
          <View style={styles.scoreMiniGrid}>
            {[
              { label: 'Scans', value: `${model.detectedThreats}`, color: colors.primary },
              { label: 'Blocked', value: `${model.blockedThreats}`, color: colors.accent },
              { label: 'Issues', value: `${model.activeIssues}`, color: model.activeIssues > 2 ? colors.warning : colors.success },
            ].map((item) => (
              <View key={item.label} style={[styles.scoreMiniPill, { backgroundColor: hexWithAlpha(item.color, '10'), borderColor: hexWithAlpha(item.color, '36') }]}>
                <Text style={[styles.scoreMiniValue, { color: item.color }]}>{item.value}</Text>
                <Text style={[styles.scoreMiniLabel, { color: colors.textMuted }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      <View style={styles.scoreFooterRow}>
        <Text style={[styles.scoreRefreshText, { color: colors.textSubtle }]}>{model.updatedAt} - {model.trend}</Text>
        <OutlineButton label="Refresh" onPress={onRefresh} icon={RefreshCw} color={colors.primary} />
      </View>
    </Card>
  );
}

function SecurityScoreAnalyticsCard({ model }: { model: SecurityScoreModel }) {
  const { colors } = useDeltexTheme();

  return (
    <Card glow={colors.accent}>
      <View style={styles.scoreAnalyticsHeader}>
        <View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Security Score Analytics</Text>
          <Text style={[styles.cardCopy, { color: colors.textMuted }]}>Figma score breakdown, trend, and live posture insights.</Text>
        </View>
        <Text style={[styles.metricValue, { color: colors.primary }]}>{model.score}</Text>
      </View>
      <View style={styles.scoreAnalyticsBody}>
        <DonutBreakdownChart data={model.breakdown} />
        <View style={styles.scoreLegend}>
          {model.breakdown.map((item) => (
            <View key={item.label} style={styles.scoreLegendRow}>
              <View style={[styles.scoreLegendDot, { backgroundColor: item.color }]} />
              <Text style={[styles.scoreLegendLabel, { color: colors.textMuted }]}>{item.label}</Text>
              <Text style={[styles.scoreLegendValue, { color: item.color }]}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.scoreTrendBlock}>
        <LineAreaChart data={model.trendData} color={colors.primary} primaryKey="value" />
      </View>
      <View style={styles.scoreInsightList}>
        {model.insights.map((insight) => (
          <View key={insight} style={styles.scoreInsightRow}>
            <CheckCircle size={14} color={colors.accent} />
            <Text style={[styles.scoreInsightText, { color: colors.textMuted }]}>{insight}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

function DashboardScreen({
  onNavigate,
  onOpenModule,
}: {
  onNavigate: (screen: AppScreen) => void;
  onOpenModule: (module: SecurityModule) => void;
}) {
  const { colors } = useDeltexTheme();
  const { currentPlan, effectivePlan } = useSubscription();
  const protection = useProtection();
  const plan = PLANS.find((item) => item.id === effectivePlan) || PLANS[0];
  const topModules = MODULES.slice(0, 6);
  const ecosystemModules = MODULES.filter((module) => ['family-safety', 'social', 'website-protection', 'personal-firewall', 'biometrics'].includes(module.id));
  const [chartMetric, setChartMetric] = useState<DashboardChartMetric>('threats');
  const [refreshing, setRefreshing] = useState(false);
  const [scoreActivity, setScoreActivity] = useState<SecurityScoreActivity>({
    completedScans: 18,
    resolvedIssues: 9,
    userActivity: 84,
    refreshes: 0,
  });
  const securityScore = useMemo(() => buildSecurityScoreModel(scoreActivity, effectivePlan), [effectivePlan, scoreActivity]);

  useEffect(() => {
    const timer = setInterval(() => {
      setScoreActivity((current) => ({
        completedScans: current.completedScans + 1,
        resolvedIssues: current.resolvedIssues + (current.completedScans % 3 === 0 ? 1 : 0),
        userActivity: clampNumber(current.userActivity + (current.refreshes % 2 === 0 ? 1 : -1), 72, 98),
        refreshes: current.refreshes + 1,
      }));
    }, 18000);

    return () => clearInterval(timer);
  }, []);

  const refreshSecurityScore = useCallback(() => {
    setRefreshing(true);
    setScoreActivity((current) => ({
      completedScans: current.completedScans + 2,
      resolvedIssues: current.resolvedIssues + 1,
      userActivity: clampNumber(current.userActivity + 3, 72, 99),
      refreshes: current.refreshes + 1,
    }));
    void protection.refreshDashboardData(protection.dashboard.range).finally(() => {
      setTimeout(() => setRefreshing(false), 620);
    });
  }, [protection]);

  const updateDashboardRange = useCallback(
    (range: DashboardTrendRange) => {
      void protection.refreshDashboardData(range);
    },
    [protection],
  );

  const chartColor = chartMetric === 'threats' ? colors.danger : chartMetric === 'scans' ? colors.primary : chartMetric === 'risk' ? colors.warning : colors.purple;
  const chartSubtitle = chartMetric === 'threats'
    ? 'Threats found and blocked over time'
    : chartMetric === 'scans'
      ? 'Completed scans and monitoring checks'
      : chartMetric === 'risk'
        ? 'Risk level after fixes and recommendations'
        : 'Security events from your protections';
  const quickActions = [
    {
      title: 'Protect my device',
      detail: 'Run malware, file, and device safety checks.',
      action: 'Run device check',
      icon: Smartphone,
      color: colors.primary,
      onPress: () => onOpenModule(MODULES.find((module) => module.id === 'malware') || MODULES[0]),
    },
    {
      title: 'Protect my family',
      detail: 'Set child rules, review risks, and create reports.',
      action: 'Open family safety',
      icon: Users,
      color: colors.success,
      onPress: () => onOpenModule(MODULES.find((module) => module.id === 'family-safety') || MODULES[0]),
    },
    {
      title: 'Protect a website',
      detail: 'Add a site, scan it, and watch for changes.',
      action: 'Add website',
      icon: Globe,
      color: colors.accent,
      onPress: () => onOpenModule(MODULES.find((module) => module.id === 'website-protection') || MODULES[0]),
    },
    {
      title: 'Ask Deltex AI',
      detail: 'Get help understanding alerts or suspicious activity.',
      action: 'Open AI chat',
      icon: Brain,
      color: colors.purple,
      onPress: () => onNavigate('assistant'),
    },
  ];

  return (
    <ScrollScreen>
      {refreshing ? (
        <Card style={styles.refreshCard}>
          <View style={styles.refreshRow}>
            <RefreshCw size={17} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>Refreshing protection telemetry</Text>
              <Text style={[styles.menuDetail, { color: colors.textMuted }]}>Updating score, chart trends, alerts, and module activity.</Text>
            </View>
          </View>
          <ProgressBar value={82} color={colors.primary} />
        </Card>
      ) : null}

      <LinearGradient colors={[colors.card, colors.cardAlt]} style={[styles.heroCard, { borderColor: colors.border }]}>
        <View style={styles.railwayHeroGrid}>
          <View style={styles.railwayHeroCopy}>
            <View style={[styles.railwayHeroBadge, { backgroundColor: colors.surfaceStrong, borderColor: colors.border }]}>
              <Text style={[styles.railwayHeroBadgeText, { color: colors.primary }]}>Simple security overview</Text>
            </View>
            <Text style={[styles.railwayHeroTitle, { color: colors.text }]}>Your protection, in one place</Text>
            <Text style={[styles.railwayHeroSubtitle, { color: colors.textMuted }]}>
              Check your score, turn on protections, monitor family safety, scan websites, and review alerts from one clean workspace.
            </Text>
            <View style={styles.heroActions}>
              <GradientButton label="Run Security Check" onPress={refreshSecurityScore} icon={ShieldCheck} style={styles.heroAction} />
              <OutlineButton label="Choose Protections" onPress={() => onNavigate('protection')} icon={ArrowRight} color={colors.text} style={styles.heroAction} />
            </View>
          </View>
          <View style={[styles.railwayProjectPanel, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.railwayPanelHeader}>
              <View>
                <Text style={[styles.railwayPanelTitle, { color: colors.text }]}>Protection summary</Text>
                <Text style={[styles.railwayPanelMeta, { color: colors.textMuted }]}>Status today</Text>
              </View>
              <ScoreRing score={securityScore.score} color={colors.primary} size={78} />
            </View>
            {[
              { label: 'Status', value: `${securityScore.activeShields} protections available`, color: colors.primary },
              { label: 'Device', value: `${securityScore.filesScanned} files scanned`, color: colors.success },
              { label: 'Alerts', value: `${securityScore.activeIssues} need review`, color: colors.warning },
              { label: 'Blocked', value: `${securityScore.blockedThreats} stopped`, color: colors.purple },
              { label: 'Plan', value: plan.name, color: colors.accent },
            ].map((row) => (
              <View key={row.label} style={[styles.railwayDeployRow, { borderTopColor: colors.border }]}>
                <View style={[styles.railwayDeployDot, { backgroundColor: row.color }]} />
                <Text style={[styles.railwayDeployLabel, { color: colors.text }]}>{row.label}</Text>
                <Text style={[styles.railwayDeployValue, { color: colors.textMuted }]}>{row.value}</Text>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>

      <SectionHeader title="Start here" subtitle="Choose the area you want to protect first." />
      <View style={styles.quickActionGrid}>
        {quickActions.map((item) => {
          const Icon = item.icon;

          return (
            <Pressable key={item.title} onPress={item.onPress} style={styles.quickActionPressable}>
              <Card style={styles.quickActionCard} glow={item.color}>
                <View style={[styles.quickActionIcon, { backgroundColor: hexWithAlpha(item.color, '16') }]}>
                  <Icon size={20} color={item.color} />
                </View>
                <Text style={[styles.quickActionTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.quickActionCopy, { color: colors.textMuted }]}>{item.detail}</Text>
                <View style={styles.quickActionFooter}>
                  <Text style={[styles.quickActionText, { color: item.color }]}>{item.action}</Text>
                  <ArrowRight size={14} color={item.color} />
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>

      <SecurityScoreCard model={securityScore} onRefresh={refreshSecurityScore} />

      <PlanAccessCard onUpgrade={() => onNavigate('subscriptions')} />
      <TokenWalletCard onManage={() => onNavigate('tokens')} />

      <SectionHeader title="Protect what matters" subtitle="Family, social accounts, websites, firewall, and biometric safety." action="All protections" onAction={() => onNavigate('protection')} />
      <View style={styles.moduleGrid}>
        {ecosystemModules.map((module) => (
          <ModuleCard key={module.id} module={module} onPress={() => onOpenModule(module)} compact />
        ))}
      </View>

      <View style={styles.metricGrid}>
        {[
          { label: 'Active threats', value: `${securityScore.activeIssues}`, color: colors.warning, icon: AlertTriangle, trend: `${securityScore.detectedThreats} detected` },
          { label: 'Blocked', value: `${securityScore.blockedThreats}`, color: colors.accent, icon: ShieldCheck, trend: securityScore.trend },
          { label: 'Files scanned', value: securityScore.filesScanned, color: colors.purple, icon: Search, trend: 'Auto refresh' },
          { label: 'Plan', value: plan.name, color: plan.color, icon: Crown, trend: currentPlan === effectivePlan ? plan.devices : 'Trial boost' },
        ].map((metric) => {
          const Icon = metric.icon;

          return (
            <Card key={metric.label} style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: hexWithAlpha(metric.color, '18') }]}>
                <Icon size={19} color={metric.color} />
              </View>
              <Text style={[styles.metricValue, { color: colors.text }]} numberOfLines={1}>
                {metric.value}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{metric.label}</Text>
              <Text style={[styles.metricTrend, { color: metric.color }]}>{metric.trend}</Text>
            </Card>
          );
        })}
      </View>

      <SecurityScoreAnalyticsCard model={securityScore} />

      <SectionHeader title="Activity over time" subtitle={chartSubtitle} />
      <Card>
        <SegmentedControl<DashboardTrendRange>
          value={protection.dashboard.range}
          onChange={updateDashboardRange}
          options={[
            { label: '24H', value: '24H' },
            { label: '7D', value: '7D' },
            { label: '30D', value: '30D' },
          ]}
        />
        <SegmentedControl<DashboardChartMetric>
          value={chartMetric}
          onChange={setChartMetric}
          options={[
            { label: 'Threats', value: 'threats' },
            { label: 'Scans', value: 'scans' },
            { label: 'Risk', value: 'risk' },
            { label: 'Events', value: 'events' },
          ]}
        />
        <LineAreaChart
          data={protection.dashboard.trendData}
          color={chartColor}
          secondaryColor={colors.accent}
          primaryKey={chartMetric}
          secondaryKey={chartMetric === 'threats' ? 'blocked' : undefined}
        />
      </Card>

      <SectionHeader title="All protections" subtitle="Malware, scams, identity, privacy, network, family, web, and AI safety." action="View all" onAction={() => onNavigate('protection')} />
      <View style={styles.moduleGrid}>
        {topModules.map((module) => (
          <ModuleCard key={module.id} module={module} onPress={() => onOpenModule(module)} compact />
        ))}
      </View>

      <SectionHeader title="Recent alerts" action="View alerts" onAction={() => onNavigate('alerts')} />
      <Card>
        {RECENT_THREATS.map((threat, index) => {
          const color = severityColor(threat.severity, colors);

          return (
            <View key={`${threat.type}-${threat.time}`} style={[styles.threatRow, index > 0 && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
              <View style={[styles.threatIcon, { backgroundColor: hexWithAlpha(color, '16') }]}>
                {threat.blocked ? <ShieldCheck size={18} color={color} /> : <AlertTriangle size={18} color={color} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.threatTitle, { color: colors.text }]}>{threat.type}</Text>
                <Text style={[styles.threatSource, { color: colors.textMuted }]}>{threat.source}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.threatSeverity, { color }]}>{threat.severity.toUpperCase()}</Text>
                <Text style={[styles.threatTime, { color: colors.textSubtle }]}>{threat.time}</Text>
              </View>
            </View>
          );
        })}
      </Card>
    </ScrollScreen>
  );
}

function ModuleCard({
  module,
  onPress,
  compact,
}: {
  module: SecurityModule;
  onPress: () => void;
  compact?: boolean;
}) {
  const { colors } = useDeltexTheme();
  const { effectivePlan } = useSubscription();
  const protection = useProtection();
  const Icon = moduleIcons[module.id];
  const accessible = isModuleAccessible(module, effectivePlan);
  const moduleState = protection.modules[module.id];
  const score = moduleState?.score ?? module.score;
  const status = moduleState?.status ?? module.status;

  return (
    <Pressable onPress={onPress} style={[styles.moduleCardPressable, compact && styles.moduleCardCompact]}>
      <Card style={[styles.moduleCard, { opacity: accessible ? 1 : 0.72 }]} glow={module.color}>
        <View style={styles.moduleTopRow}>
          <View style={[styles.moduleIcon, { backgroundColor: module.accent }]}>
            <Icon size={22} color={module.color} />
          </View>
          {accessible ? <StatusPill status={status} /> : <StatusPill status="Locked" />}
        </View>
        <Text style={[styles.moduleTitle, { color: colors.text }]} numberOfLines={1}>
          {module.shortTitle}
        </Text>
        <Text style={[styles.moduleDescription, { color: colors.textMuted }]} numberOfLines={compact ? 2 : 3}>
          {module.description}
        </Text>
        <View style={styles.moduleBottomRow}>
          <View style={{ flex: 1 }}>
            <ProgressBar value={score} color={module.color} />
          </View>
          <Text style={[styles.moduleScore, { color: module.color }]}>{score}</Text>
        </View>
      </Card>
    </Pressable>
  );
}

function ProtectionHubScreen({ onOpenModule }: { onOpenModule: (module: SecurityModule) => void }) {
  const { colors } = useDeltexTheme();
  const { effectivePlan } = useSubscription();
  const protection = useProtection();
  const [query, setQuery] = useState('');
  const filtered = MODULES.filter((module) => `${module.title} ${module.description} ${module.category}`.toLowerCase().includes(query.toLowerCase()));
  const protectedCount = MODULES.filter((module) => protection.modules[module.id]?.status === 'Protected').length;

  return (
    <ScrollScreen>
      <ScreenHeader title="Protections" subtitle="Choose what you want to protect, then configure rules, schedules, scans, and alerts." />
      <LinearGradient colors={[colors.card, colors.cardAlt]} style={[styles.coverageHero, { borderColor: colors.border }]}>
        <View style={styles.coverageHeroTop}>
          <View>
            <Text style={[styles.heroEyebrow, { color: colors.accent }]}>Protection center</Text>
            <Text style={[styles.coverageHeroTitle, { color: colors.text }]}>{MODULES.length} ways to stay safer</Text>
          </View>
          <View style={[styles.coverageScoreBadge, { backgroundColor: hexWithAlpha(colors.accent, '14'), borderColor: hexWithAlpha(colors.accent, '55') }]}>
            <Text style={[styles.coverageScoreText, { color: colors.accent }]}>{protectedCount}/{MODULES.length}</Text>
          </View>
        </View>
        <Text style={[styles.coverageHeroCopy, { color: colors.textMuted }]}>
          Device threats, identity risk, family safety, websites, social accounts, privacy, network security, and AI threats are grouped so each area is easier to find and manage.
        </Text>
      </LinearGradient>

      <SectionHeader title="Protection coverage" subtitle="A quick view of the main risk areas Deltex can monitor." />
      <View style={styles.coverageGrid}>
        {vulnerabilityCoverage.map((item) => {
          const Icon = item.icon;

          return (
            <View key={item.label} style={[styles.coverageChip, { backgroundColor: hexWithAlpha(item.color, '10'), borderColor: hexWithAlpha(item.color, '3d') }]}>
              <Icon size={15} color={item.color} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.coverageChipTitle, { color: colors.text }]} numberOfLines={1}>
                  {item.label}
                </Text>
                <Text style={[styles.coverageChipMeta, { color: item.color }]}>{item.level}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <SectionHeader title="Recommended first steps" subtitle="Start with the controls that reduce the most common risks." />
      <View style={styles.researchGrid}>
        {RESEARCH_SECURITY_RECOMMENDATIONS.map((item) => {
          const Icon = item.icon;
          const locked = PLAN_RANK[effectivePlan] < PLAN_RANK[item.minPlan];

          return (
            <Card key={item.title} style={styles.researchCard} glow={item.color}>
              <View style={styles.researchHeader}>
                <View style={[styles.researchIcon, { backgroundColor: hexWithAlpha(item.color, '16') }]}>
                  <Icon size={17} color={item.color} />
                </View>
                <StatusPill status={locked ? 'Locked' : 'Monitoring'} />
              </View>
              <Text style={[styles.moduleTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.moduleDescription, { color: colors.textMuted }]}>{item.detail}</Text>
              <View style={styles.researchFooter}>
                <Text style={[styles.researchSource, { color: item.color }]}>{item.source}</Text>
                <Text style={[styles.researchPlan, { color: locked ? colors.warning : colors.accent }]}>
                  {locked ? `${item.minPlan}+` : 'Active'}
                </Text>
              </View>
            </Card>
          );
        })}
      </View>

      <View style={[styles.searchShell, { backgroundColor: colors.input, borderColor: colors.border }]}>
        <Search size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search malware, scams, family, websites, firewall, VPN..."
          placeholderTextColor={colors.textSubtle}
          style={[styles.input, { color: colors.text }]}
        />
      </View>

      {categories.map((category) => {
        const modules = filtered.filter((module) => module.category === category);
        if (modules.length === 0) return null;

        return (
          <View key={category} style={styles.categoryBlock}>
            <SectionHeader title={category} />
            <View style={styles.moduleGrid}>
              {modules.map((module) => (
                <ModuleCard key={module.id} module={module} onPress={() => onOpenModule(module)} />
              ))}
            </View>
          </View>
        );
      })}
    </ScrollScreen>
  );
}

function ModuleDetailScreen({
  module,
  onBack,
  onUpgrade,
}: {
  module: SecurityModule;
  onBack: () => void;
  onUpgrade: () => void;
}) {
  const { colors } = useDeltexTheme();
  const { effectivePlan } = useSubscription();
  const protection = useProtection();
  const accessible = isModuleAccessible(module, effectivePlan);
  const Icon = moduleIcons[module.id];
  const workflows = ECOSYSTEM_CENTER_WORKFLOWS[module.id] || [];
  const moduleState = protection.modules[module.id];
  const config = moduleState?.configuration;
  const score = moduleState?.score ?? module.score;
  const status = moduleState?.status ?? module.status;
  const findings = moduleState?.findings || [];
  const scanHistory = moduleState?.scanHistory || [];
  const recommendations = Array.from(new Set([...(config?.recommendations || []), ...module.recommendations]));
  const [mode, setMode] = useState<'view' | 'configure'>('view');
  const [scanActive, setScanActive] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const scanTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [siteType, setSiteType] = useState<RegisteredWebsite['type']>('Website');
  const [childName, setChildName] = useState('');
  const [childAgeBand, setChildAgeBand] = useState('10-12');

  useEffect(() => {
    return () => {
      if (scanTimer.current) clearInterval(scanTimer.current);
    };
  }, []);

  const updateConfig = useCallback(
    (patch: Partial<ModuleConfiguration>) => {
      void protection.updateModuleConfig(module.id, patch);
    },
    [module.id, protection],
  );

  const runValidationScan = useCallback(() => {
    if (!accessible || scanActive) return;
    setScanActive(true);
    setScanProgress(8);
    if (scanTimer.current) clearInterval(scanTimer.current);
    scanTimer.current = setInterval(() => {
      setScanProgress((current) => (current >= 92 ? current : current + 8));
    }, 180);

    setTimeout(() => {
      void protection.runModuleScan(module.id, `${module.shortTitle} validation scan`).then(() => {
        if (module.id === 'family-safety') {
          void protection.generateSafetyReport();
        }
        if (scanTimer.current) clearInterval(scanTimer.current);
        setScanProgress(100);
        setTimeout(() => {
          setScanActive(false);
          setScanProgress(0);
        }, 700);
      });
    }, 1450);
  }, [accessible, module.id, module.shortTitle, protection, scanActive]);

  const registerWebsite = useCallback(() => {
    void protection.registerWebsite(websiteUrl, siteType).then((created) => {
      if (created) setWebsiteUrl('');
    });
  }, [protection, siteType, websiteUrl]);

  const saveChildProfile = useCallback(() => {
    const name = childName.trim();
    if (!name) return;

    void protection.saveChildProfile({ name, ageBand: childAgeBand, devices: ['Phone'], riskLevel: 'medium' }).then(() => setChildName(''));
  }, [childAgeBand, childName, protection]);

  return (
    <ScrollScreen>
      <ScreenHeader title={module.shortTitle} subtitle={module.title} onBack={onBack} right={<StatusPill status={accessible ? status : 'Locked'} />} />
      <LinearGradient colors={[hexWithAlpha(module.color, '25'), hexWithAlpha(module.color, '08')]} style={[styles.detailHero, { borderColor: hexWithAlpha(module.color, '44') }]}>
        <View style={[styles.detailIcon, { backgroundColor: module.accent }]}>
          <Icon size={34} color={module.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.heroTitle, { color: colors.text }]}>{module.title}</Text>
          <Text style={[styles.heroCopy, { color: colors.textMuted }]}>{module.description}</Text>
        </View>
        <ScoreRing score={score} color={module.color} size={108} />
      </LinearGradient>

      {!accessible ? (
        <Card glow={module.color}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Upgrade required</Text>
          <Text style={[styles.cardCopy, { color: colors.textMuted }]}>
            {module.title} starts on the {module.minPlan.charAt(0).toUpperCase() + module.minPlan.slice(1)} plan. Your backend logic remains intact; access is controlled by the plan layer.
          </Text>
          <GradientButton label="View Plans" onPress={onUpgrade} icon={Crown} style={{ marginTop: 16 }} />
        </Card>
      ) : null}

      <SegmentedControl<'view' | 'configure'>
        value={mode}
        onChange={setMode}
        options={[
          { label: 'View Mode', value: 'view' },
          { label: 'Configuration Mode', value: 'configure' },
        ]}
      />

      {scanActive ? (
        <Card glow={module.color}>
          <View style={styles.refreshRow}>
            <RefreshCw size={18} color={module.color} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Running {module.shortTitle.toLowerCase()} validation</Text>
              <Text style={[styles.cardCopy, { color: colors.textMuted }]}>Testing configuration, monitoring, findings, alerts, and recommendations.</Text>
            </View>
            <Text style={[styles.operationTokenText, { color: module.color }]}>{scanProgress}%</Text>
          </View>
          <ProgressBar value={scanProgress} color={module.color} />
        </Card>
      ) : null}

      {mode === 'configure' && config ? (
        <>
          <SectionHeader title="Configuration controls" subtitle="Configure settings, enable protections, run scans, and apply validation workflows." />
          <Card>
            {[
              { key: 'enabled' as const, label: 'Protection enabled', detail: 'Turns this protection on across dashboard scoring, alerts, and scans.' },
              { key: 'realtime' as const, label: 'Real-time monitoring', detail: 'Continuously watches available local signals and submitted content.' },
              { key: 'autoScan' as const, label: 'Automatic scans', detail: 'Allows schedules and refreshes to trigger this module.' },
              { key: 'blockHighRisk' as const, label: 'Block high-risk activity', detail: 'Applies local defensive recommendations when findings cross the threshold.' },
              { key: 'requireMfaForChanges' as const, label: 'Require MFA for changes', detail: 'Requires stronger authentication for sensitive configuration updates.' },
            ].map((item, index) => (
              <View key={item.key} style={[styles.settingRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>{item.label}</Text>
                  <Text style={[styles.menuDetail, { color: colors.textMuted }]}>{item.detail}</Text>
                </View>
                <Switch
                  value={!!config[item.key]}
                  onValueChange={(value) => updateConfig({ [item.key]: value })}
                  trackColor={{ false: colors.surfaceStrong, true: hexWithAlpha(module.color, '77') }}
                  thumbColor={config[item.key] ? module.color : colors.textSubtle}
                />
              </View>
            ))}
          </Card>

          <SectionHeader title="Scan cadence" subtitle="Configure how this module should run local validation checks." />
          <SegmentedControl
            value={config.scanFrequency}
            onChange={(value) => updateConfig({ scanFrequency: value as ModuleConfiguration['scanFrequency'] })}
            options={[
              { label: 'Manual', value: 'manual' },
              { label: 'Hourly', value: 'hourly' },
              { label: 'Daily', value: 'daily' },
              { label: 'Weekly', value: 'weekly' },
              { label: 'Monthly', value: 'monthly' },
            ]}
          />

          <SectionHeader title="Risk threshold" />
          <SegmentedControl
            value={config.riskThreshold}
            onChange={(value) => updateConfig({ riskThreshold: value as ModuleConfiguration['riskThreshold'] })}
            options={[
              { label: 'Low', value: 'low' },
              { label: 'Medium', value: 'medium' },
              { label: 'High', value: 'high' },
              { label: 'Critical', value: 'critical' },
            ]}
          />

          <Card>
            <View style={[styles.profileInputShell, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <Text style={[styles.profileInputLabel, { color: colors.textSubtle }]}>Monitoring window</Text>
              <TextInput
                value={config.monitoringWindow}
                onChangeText={(value) => updateConfig({ monitoringWindow: value })}
                placeholder="Always on, 08:00-22:00, weekly..."
                placeholderTextColor={colors.textSubtle}
                style={[styles.profileInput, { color: colors.text }]}
              />
            </View>
          </Card>

          <Card glow={module.color}>
            <View style={styles.scheduleSummaryRow}>
              <View style={[styles.accessIcon, { backgroundColor: hexWithAlpha(module.color, '16') }]}>
                <Icon size={18} color={module.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Validation workflow</Text>
                <Text style={[styles.cardCopy, { color: colors.textMuted }]}>Run a local scan simulation, refresh findings, create alerts, and update the module score.</Text>
              </View>
            </View>
            <GradientButton label={accessible ? 'Run Validation Scan' : 'Upgrade Required'} onPress={runValidationScan} icon={accessible ? RefreshCw : Lock} disabled={!accessible || scanActive} />
          </Card>
        </>
      ) : null}

      <View style={styles.metricGrid}>
        {[
          ...module.metrics,
          { label: 'Configured', value: config?.enabled ? 'On' : 'Off', trend: config?.scanFrequency || 'manual' },
          { label: 'Findings', value: findings.length.toString(), trend: moduleState?.lastScanAt ? 'Updated' : 'Seeded' },
        ].slice(0, 6).map((metric) => (
          <Card key={metric.label} style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: colors.text }]}>{metric.value}</Text>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{metric.label}</Text>
            <Text style={[styles.metricTrend, { color: module.color }]}>{metric.trend}</Text>
          </Card>
        ))}
      </View>

      <SectionHeader title="Live checks" />
      <Card>
        {module.checks.map((check, index) => (
          <View key={check.label} style={[styles.checkRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
            <View style={[styles.checkIcon, { backgroundColor: hexWithAlpha(statusColor(check.status, colors), '16') }]}>
              <CheckCircle size={18} color={statusColor(check.status, colors)} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.checkTitle, { color: colors.text }]}>{check.label}</Text>
              <Text style={[styles.checkDetail, { color: colors.textMuted }]}>{check.detail}</Text>
            </View>
            <StatusPill status={check.status} />
          </View>
        ))}
      </Card>

      <SectionHeader title="AI signals" subtitle="Privacy-compliant indicators used together, never as a single-factor conclusion." />
      <View style={styles.signalWrap}>
        {module.signals.map((signal) => (
          <View key={signal} style={[styles.signalChip, { backgroundColor: module.accent, borderColor: hexWithAlpha(module.color, '44') }]}>
            <Text style={[styles.signalText, { color: module.color }]}>{signal}</Text>
          </View>
        ))}
      </View>

      {workflows.length ? (
        <>
          <SectionHeader title="Protection center workflow" subtitle="How this module analyzes signals, applies policy, and produces recommendations." />
          <Card>
            {workflows.map((workflow, index) => (
              <View key={workflow.title} style={[styles.historyRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                <View style={[styles.menuIcon, { backgroundColor: hexWithAlpha(module.color, '16') }]}>
                  <Icon size={18} color={module.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>{workflow.title}</Text>
                  <Text style={[styles.menuDetail, { color: colors.textMuted }]}>{workflow.detail}</Text>
                </View>
                <Text style={[styles.operationTokenText, { color: module.color }]}>{workflow.metric}</Text>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      <SectionHeader title="Recent findings" subtitle="Local JSON-backed scan findings with actionable next steps." />
      <Card>
        {findings.length === 0 ? (
          <Text style={[styles.cardCopy, { color: colors.textMuted }]}>No unresolved findings. Run a validation scan to update this module.</Text>
        ) : (
          findings.slice(0, 6).map((finding, index) => {
            const findingColor = severityColor(finding.severity, colors);

            return (
              <View key={finding.id} style={[styles.historyRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                <View style={[styles.menuIcon, { backgroundColor: hexWithAlpha(findingColor, '16') }]}>
                  <AlertTriangle size={18} color={findingColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>{finding.title}</Text>
                  <Text style={[styles.menuDetail, { color: colors.textMuted }]}>{finding.detail}</Text>
                  <Text style={[styles.menuDetail, { color: findingColor }]}>{finding.recommendation}</Text>
                </View>
                <Text style={[styles.operationTokenText, { color: findingColor }]}>{finding.severity}</Text>
              </View>
            );
          })
        )}
      </Card>

      <SectionHeader title="Scan history" subtitle="Testing, simulation, scanning, monitoring, and validation activity." />
      <Card>
        {scanHistory.length === 0 ? (
          <Text style={[styles.cardCopy, { color: colors.textMuted }]}>No scans have run yet. Use Configuration Mode to launch a validation scan.</Text>
        ) : (
          scanHistory.slice(0, 6).map((run, index) => (
            <View key={run.id} style={[styles.historyRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
              <View style={[styles.statusDotLarge, { backgroundColor: hexWithAlpha(module.color, '18') }]}>
                <CheckCircle size={16} color={module.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>{run.label}</Text>
                <Text style={[styles.menuDetail, { color: colors.textMuted }]}>{run.completedAt ? new Date(run.completedAt).toLocaleString() : run.status}</Text>
              </View>
              <Text style={[styles.operationTokenText, { color: module.color }]}>{run.score}</Text>
            </View>
          ))
        )}
      </Card>

      {module.id === 'website-protection' ? (
        <>
          <SectionHeader title="Registered websites" subtitle="Add business websites, stores, portfolios, blogs, or apps to create and monitor a security baseline." />
          <Card>
            <SegmentedControl<RegisteredWebsite['type']>
              value={siteType}
              onChange={setSiteType}
              options={[
                { label: 'Website', value: 'Website' },
                { label: 'Store', value: 'E-commerce' },
                { label: 'Blog', value: 'Blog' },
                { label: 'Business', value: 'Business Platform' },
              ]}
            />
            <View style={[styles.couponRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <TextInput
                value={websiteUrl}
                onChangeText={setWebsiteUrl}
                autoCapitalize="none"
                keyboardType="url"
                placeholder="example.com, store.example.com, or app.example.com"
                placeholderTextColor={colors.textSubtle}
                style={[styles.input, { color: colors.text }]}
              />
              <OutlineButton label="Register" onPress={registerWebsite} color={module.color} />
            </View>
            {protection.websites.map((site, index) => (
              <View key={site.id} style={[styles.historyRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                <View style={[styles.menuIcon, { backgroundColor: hexWithAlpha(module.color, '16') }]}>
                  <Globe size={18} color={module.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>{site.url}</Text>
                  <Text style={[styles.menuDetail, { color: colors.textMuted }]}>{site.type} - {site.issue}</Text>
                </View>
                <View style={styles.operationMeta}>
                  <Text style={[styles.operationTokenText, { color: site.status === 'Warning' ? colors.warning : module.color }]}>{site.score}</Text>
                  <Pressable onPress={() => void protection.runWebsiteAssessment(site.id)}>
                    <Text style={[styles.operationLockText, { color: module.color }]}>Assess</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </Card>

          <SectionHeader title="Website assessment history" subtitle="Vulnerability, TLS, DNS, header, reputation, malware, and drift checks." />
          <Card>
            {protection.websites.flatMap((site) => site.assessments.map((assessment) => ({ site, assessment }))).slice(0, 8).length === 0 ? (
              <Text style={[styles.cardCopy, { color: colors.textMuted }]}>No website assessments yet. Tap Assess on a registered site to run a local security assessment.</Text>
            ) : (
              protection.websites.flatMap((site) => site.assessments.map((assessment) => ({ site, assessment }))).slice(0, 8).map(({ site, assessment }, index) => (
                <View key={assessment.id} style={[styles.historyRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                  <View style={[styles.statusDotLarge, { backgroundColor: hexWithAlpha(module.color, '18') }]}>
                    <CheckCircle size={16} color={module.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.menuTitle, { color: colors.text }]}>{site.url}</Text>
                    <Text style={[styles.menuDetail, { color: colors.textMuted }]}>{assessment.summary}</Text>
                  </View>
                  <Text style={[styles.operationTokenText, { color: module.color }]}>{assessment.score}</Text>
                </View>
              ))
            )}
          </Card>
        </>
      ) : null}

      {module.id === 'family-safety' ? (
        <>
          <SectionHeader title="Family safety controls" subtitle="Guardian-managed child profiles, rules, monitoring windows, alerts, and AI safety reports." />
          <Card glow={module.color}>
            <View style={styles.profileFieldGrid}>
              <View style={[styles.profileInputShell, { backgroundColor: colors.input, borderColor: colors.border }]}>
                <Text style={[styles.profileInputLabel, { color: colors.textSubtle }]}>Child name</Text>
                <TextInput
                  value={childName}
                  onChangeText={setChildName}
                  placeholder="Add child profile"
                  placeholderTextColor={colors.textSubtle}
                  style={[styles.profileInput, { color: colors.text }]}
                />
              </View>
              <SegmentedControl
                value={childAgeBand}
                onChange={setChildAgeBand}
                options={[
                  { label: '8-10', value: '8-10' },
                  { label: '10-12', value: '10-12' },
                  { label: '13-15', value: '13-15' },
                  { label: '16-17', value: '16-17' },
                ]}
              />
              <OutlineButton label="Save Child Profile" onPress={saveChildProfile} icon={Plus} color={module.color} />
            </View>
          </Card>

          <View style={styles.metricGrid}>
            {protection.childProfiles.map((child: ChildProfile) => (
              <Card key={child.id} style={styles.metricCard}>
                <Text style={[styles.metricValue, { color: colors.text }]} numberOfLines={1}>{child.name}</Text>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{child.ageBand} - {child.devices.join(', ')}</Text>
                <Text style={[styles.metricTrend, { color: severityColor(child.riskLevel, colors) }]}>{child.riskLevel} risk</Text>
              </Card>
            ))}
          </View>

          <SectionHeader title="Guardian protection rules" />
          <Card>
            {protection.guardianRules.map((rule, index) => (
              <View key={rule.id} style={[styles.settingRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>{rule.label}</Text>
                  <Text style={[styles.menuDetail, { color: colors.textMuted }]}>{rule.detail}</Text>
                </View>
                <Switch
                  value={rule.enabled}
                  onValueChange={(enabled) => void protection.updateFamilyRule(rule.id, { enabled })}
                  trackColor={{ false: colors.surfaceStrong, true: hexWithAlpha(module.color, '77') }}
                  thumbColor={rule.enabled ? module.color : colors.textSubtle}
                />
              </View>
            ))}
          </Card>

          <Card glow={module.color}>
            <View style={styles.scheduleSummaryRow}>
              <View style={[styles.accessIcon, { backgroundColor: hexWithAlpha(module.color, '16') }]}>
                <Users size={18} color={module.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>AI-generated safety report</Text>
                <Text style={[styles.cardCopy, { color: colors.textMuted }]}>Creates a guardian-readable report from configured rules, child profiles, and local risk scenarios.</Text>
              </View>
            </View>
            <GradientButton label="Generate Safety Report" onPress={() => void protection.generateSafetyReport(protection.childProfiles[0]?.id)} icon={FileText} />
          </Card>

          <SectionHeader title="Safety reports" />
          <Card>
            {protection.safetyReports.length === 0 ? (
              <Text style={[styles.cardCopy, { color: colors.textMuted }]}>No safety reports yet. Generate one after configuring profiles and guardian rules.</Text>
            ) : (
              protection.safetyReports.slice(0, 5).map((report, index) => (
                <View key={report.id} style={[styles.historyRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                  <View style={[styles.menuIcon, { backgroundColor: hexWithAlpha(severityColor(report.riskLevel, colors), '16') }]}>
                    <FileText size={18} color={severityColor(report.riskLevel, colors)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.menuTitle, { color: colors.text }]}>{report.title}</Text>
                    <Text style={[styles.menuDetail, { color: colors.textMuted }]}>{report.summary}</Text>
                  </View>
                  <Text style={[styles.operationTokenText, { color: severityColor(report.riskLevel, colors) }]}>{report.riskLevel}</Text>
                </View>
              ))
            )}
          </Card>
        </>
      ) : null}

      <SectionHeader title="Actionable recommendations" subtitle="Apply these steps to improve this module's security posture." />
      <Card>
        {recommendations.map((recommendation, index) => (
          <View key={recommendation} style={[styles.recommendationRow, index > 0 && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
            <Zap size={16} color={module.color} />
            <Text style={[styles.recommendationText, { color: colors.text }]}>{recommendation}</Text>
          </View>
        ))}
      </Card>
    </ScrollScreen>
  );
}

function analyzeSubmission(type: AnalysisType, content: string): AnalysisResult {
  const normalized = content.toLowerCase();
  const riskTerms = [
    'urgent',
    'wire',
    'crypto',
    'gift card',
    'password',
    'verification code',
    'remote access',
    'investment',
    'guaranteed',
    'mpesa',
    'm-pesa',
    'bank',
    'login',
    'secret',
    'child',
    'minor',
    'grooming',
    'giveaway',
    'recruiter',
    'recruitment',
    'impersonation',
    'fake profile',
    'domain',
    'ssl',
    'tls',
    'redirect',
    'firewall',
    'download',
    'malware',
  ];
  const matches = riskTerms.filter((term) => normalized.includes(term));
  const typeRisk: Record<AnalysisType, number> = { message: 16, profile: 20, screenshot: 18, email: 24, link: 28 };
  const risk = Math.min(96, typeRisk[type] + matches.length * 9 + Math.min(24, Math.floor(content.length / 80)));
  const trustScore = Math.max(7, 100 - risk);
  const riskLevel = risk > 78 ? 'Critical' : risk > 58 ? 'High' : risk > 32 ? 'Medium' : 'Low';

  return {
    trustScore,
    fraudRisk: risk,
    riskLevel,
    summary:
      riskLevel === 'Low'
        ? 'No strong scam pattern was found, but keep normal caution and verify identity through a trusted channel.'
        : 'The submission contains multiple deception indicators. Deltex AI recommends pausing the interaction until identity, links, and payment requests are verified.',
    signals: [
      matches.length ? `Matched pressure terms: ${matches.slice(0, 4).join(', ')}` : 'No major urgency keywords detected',
      'Language consistency and social engineering patterns reviewed',
      'Metadata and location-related indicators are treated as supporting context only',
      type === 'link' ? 'URL reputation, redirects, and domain age should be verified before opening' : 'Content intent and requested action were scored',
    ],
    recommendations: [
      'Do not share passwords, MFA codes, bank details, or recovery phrases.',
      'Verify identity through an independent channel before sending money or documents.',
      'Submit additional screenshots or profile links if the conversation continues.',
    ],
  };
}

function inferAnalysisType(prompt: string, attachment: string | null): AnalysisType {
  const text = prompt.toLowerCase();

  if (attachment) return 'screenshot';
  if (text.includes('http://') || text.includes('https://') || text.includes('link') || text.includes('url')) return 'link';
  if (text.includes('@') || text.includes('email') || text.includes('inbox')) return 'email';
  if (text.includes('profile') || text.includes('account') || text.includes('identity')) return 'profile';
  return 'message';
}

function buildAssistantResponse(prompt: string, type: AnalysisType, result: AnalysisResult, plan: PlanId) {
  const text = prompt.toLowerCase();
  const planLabel = PLANS.find((item) => item.id === plan)?.name || 'Free';
  const focus = text.includes('vulnerab') || text.includes('cve') || text.includes('patch')
    ? 'Vulnerability explanation: patch exposed software first, reduce attack surface, and schedule a follow-up scan.'
    : text.includes('child') || text.includes('family') || text.includes('groom') || text.includes('minor') || text.includes('giveaway')
      ? 'Family safety analysis: review guardian permissions, avoid blaming the child, check suspicious contact behavior, and block secrecy, gift, payment, or off-platform pressure.'
      : text.includes('website') || text.includes('domain') || text.includes('ssl') || text.includes('tls') || text.includes('store') || text.includes('portfolio')
        ? 'Website protection: create a baseline, review SSL/TLS, DNS, security headers, reputation, content drift, malware indicators, and exposed credential signals.'
        : text.includes('firewall') || text.includes('download') || text.includes('redirect') || text.includes('domain') || text.includes('block')
          ? 'Personal firewall guidance: filter suspicious links and domains, quarantine risky downloads, tune trusted rules, and explain every automated recommendation before action.'
    : text.includes('dark web') || text.includes('leak') || text.includes('breach')
      ? 'Dark web insight: rotate exposed passwords, turn on MFA, and monitor account recovery attempts.'
      : text.includes('fraud') || text.includes('payment') || text.includes('invoice') || text.includes('bank')
        ? 'Fraud analysis: pause the transaction, verify through an independent channel, and require a second approval.'
        : text.includes('social') || text.includes('profile') || text.includes('romance') || text.includes('investment')
          ? 'Social media risk: verify identity with live proof, avoid off-platform payments, and treat location clues only as supporting context.'
          : text.includes('scam') || text.includes('sms') || text.includes('call')
            ? 'Scam detection: pressure, secrecy, payment requests, and remote-access prompts are the strongest warning signs.'
            : 'Threat analysis: correlate device, identity, network, and content signals before deciding what action to take.';

  return [
    `Analysis complete for ${type}.`,
    `Scores: trust ${result.trustScore}/100, fraud risk ${result.fraudRisk}/100 (${result.riskLevel}).`,
    focus,
    result.summary,
    `Next action: ${result.recommendations[0]}`,
    `Plan context: ${planLabel} plan, ${formatAiPromptLimit(plan)}.`,
  ].join('\n');
}

function AssistantScreen({ onBack, onNavigate }: { onBack: () => void; onNavigate: (screen: AppScreen) => void }) {
  const { colors } = useDeltexTheme();
  const { width } = useWindowDimensions();
  const { effectivePlan } = useSubscription();
  const chat = useAiChat();
  const [prompt, setPrompt] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);
  const [composerHeight, setComposerHeight] = useState(42);
  const [isThinking, setIsThinking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [showDataControls, setShowDataControls] = useState(false);
  const thinkingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const voiceBasePromptRef = useRef('');
  const messages = chat.activeConversation.messages as ChatMessage[];
  const locked = PLAN_RANK[effectivePlan] < PLAN_RANK.premium;
  const plan = PLANS.find((item) => item.id === effectivePlan) || PLANS[0];
  const wideChatLayout = width >= 980;

  useEffect(() => {
    return () => {
      void Speech.stop();
      recognitionRef.current?.abort?.();
      if (thinkingTimer.current) {
        clearTimeout(thinkingTimer.current);
      }
      if (streamTimer.current) {
        clearInterval(streamTimer.current);
      }
    };
  }, []);

  const speakText = useCallback(async (text: string) => {
    await Speech.stop();
    setIsSpeaking(true);
    Speech.speak(text, {
      rate: 0.96,
      pitch: 1,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, []);

  const stopSpeaking = useCallback(() => {
    void Speech.stop().finally(() => setIsSpeaking(false));
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const Recognition = getSpeechRecognitionConstructor();

    if (!Recognition) {
      setVoiceNotice(Platform.OS === 'web' ? 'Voice input is not available in this browser.' : 'Use the keyboard microphone for native dictation in this frontend build.');
      setIsListening(true);
      setTimeout(() => setIsListening(false), 1200);
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;
    voiceBasePromptRef.current = prompt;
    setVoiceNotice('Listening...');

    recognition.onstart = () => setIsListening(true);
    recognition.onerror = () => {
      setVoiceNotice('Voice input stopped. Try again or type your message.');
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
      setVoiceNotice((notice) => (notice === 'Listening...' ? null : notice));
    };
    recognition.onresult = (event) => {
      let transcript = '';

      for (let index = 0; index < event.results.length; index += 1) {
        transcript += event.results[index][0]?.transcript || '';
      }

      setPrompt(formatTranscript(voiceBasePromptRef.current, transcript));
      setVoiceNotice('Voice captured');
    };

    recognition.start();
  }, [isListening, prompt]);

  const pickImage = useCallback(async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      quality: 0.75,
    });

    if (!picked.canceled && picked.assets[0]) {
      setAttachment(picked.assets[0].fileName || 'Screenshot selected');
    }
  }, []);

  const pickDocument = useCallback(async () => {
    const picked = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
    });

    if (!picked.canceled && picked.assets[0]) {
      setAttachment(picked.assets[0].name);
    }
  }, []);

  const sendPrompt = useCallback(
    (value: string) => {
      const text = value.trim();
      if (!text || isThinking || isGenerating) return;

      const type = inferAnalysisType(text, attachment);
      const result = analyzeSubmission(type, `${text} ${attachment ? `Attachment: ${attachment}` : ''}`);
      const response = buildAssistantResponse(text, type, result, effectivePlan);
      const tokens = response.split(/(\s+)/).filter(Boolean);
      const sentAt = Date.now();
      const aiMessageId = `ai-${sentAt}`;
      const conversationId = chat.activeConversationId;

      void chat.appendMessage({ id: `user-${sentAt}`, role: 'user', text }, conversationId);
      setIsThinking(true);
      setPrompt('');
      setAttachment(null);
      setComposerHeight(42);

      if (thinkingTimer.current) {
        clearTimeout(thinkingTimer.current);
      }
      if (streamTimer.current) {
        clearInterval(streamTimer.current);
      }

      thinkingTimer.current = setTimeout(() => {
        let index = 0;
        let streamedText = '';

        void chat.appendMessage({ id: aiMessageId, role: 'ai', text: '', streaming: true }, conversationId);
        setIsThinking(false);
        setIsGenerating(true);

        streamTimer.current = setInterval(() => {
          const nextToken = tokens[index] || '';
          streamedText += nextToken;
          void chat.updateMessage(
            aiMessageId,
            {
              text: streamedText,
              result: index >= tokens.length - 1 ? result : undefined,
              streaming: index < tokens.length - 1,
            },
            conversationId,
          );

          index += 1;

          if (index >= tokens.length) {
            if (streamTimer.current) {
              clearInterval(streamTimer.current);
            }
            setIsGenerating(false);
            if (voiceEnabled) {
              void speakText(response);
            }
          }
        }, 32);
      }, 450);
    },
    [attachment, chat, effectivePlan, isGenerating, isThinking, speakText, voiceEnabled],
  );

  return (
    <ScrollScreen>
      <View style={[styles.aiChatShell, !wideChatLayout && styles.aiChatShellCompact]}>
        <View style={[styles.aiChatSidebar, !wideChatLayout && styles.aiChatSidebarCompact, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.chatSidebarTop}>
            <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back" style={[styles.aiHeaderButton, { backgroundColor: colors.surfaceStrong }]}>
              <ChevronLeft size={18} color={colors.text} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={[styles.chatSidebarTitle, { color: colors.text }]}>Deltex AI</Text>
              <Text style={[styles.chatSidebarMeta, { color: colors.textMuted }]}>Security chat workspace</Text>
            </View>
          </View>

          <Pressable onPress={() => void chat.createConversation()} style={[styles.chatSidebarPrimary, { backgroundColor: PRIMARY_BUTTON }]}>
            <Plus size={16} color="#ffffff" />
            <Text style={styles.chatSidebarPrimaryText}>New chat</Text>
          </Pressable>

          <View style={styles.chatSidebarSection}>
            <Text style={[styles.chatSidebarSectionLabel, { color: colors.textSubtle }]}>Conversations</Text>
            {chat.conversations.slice(0, wideChatLayout ? 8 : 4).map((conversation) => {
              const active = conversation.id === chat.activeConversationId;

              return (
                <Pressable
                  key={conversation.id}
                  onPress={() => chat.setActiveConversation(conversation.id)}
                  style={[
                    styles.chatSidebarConversation,
                    {
                      backgroundColor: active ? hexWithAlpha(colors.primary, '16') : colors.surfaceStrong,
                      borderColor: active ? hexWithAlpha(colors.primary, '55') : colors.border,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.chatSidebarConversationTitle, { color: active ? colors.primary : colors.text }]} numberOfLines={1}>
                      {conversation.title}
                    </Text>
                    <Text style={[styles.chatSidebarMeta, { color: colors.textMuted }]}>{conversation.messages.length} messages</Text>
                  </View>
                  <Pressable onPress={() => void chat.deleteConversation(conversation.id)} hitSlop={8}>
                    <ShieldAlert size={14} color={colors.textSubtle} />
                  </Pressable>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.chatSidebarSection}>
            <Text style={[styles.chatSidebarSectionLabel, { color: colors.textSubtle }]}>Controls</Text>
            <Pressable onPress={() => onNavigate('protection')} style={[styles.chatSidebarTool, { backgroundColor: colors.surfaceStrong, borderColor: colors.border }]}>
              <ShieldCheck size={15} color={colors.accent} />
              <Text style={[styles.chatSidebarToolText, { color: colors.text }]}>Protections</Text>
            </Pressable>
            <Pressable
              onPress={() => setVoiceEnabled((enabled) => !enabled)}
              style={[styles.chatSidebarTool, { backgroundColor: colors.surfaceStrong, borderColor: voiceEnabled ? hexWithAlpha(colors.accent, '55') : colors.border }]}
            >
              {voiceEnabled ? <Volume2 size={15} color={colors.accent} /> : <VolumeX size={15} color={colors.textMuted} />}
              <Text style={[styles.chatSidebarToolText, { color: colors.text }]}>{voiceEnabled ? 'Voice replies on' : 'Voice replies off'}</Text>
            </Pressable>
            <Pressable onPress={() => setShowDataControls(true)} style={[styles.chatSidebarTool, { backgroundColor: colors.surfaceStrong, borderColor: colors.border }]}>
              <Settings size={15} color={colors.textMuted} />
              <Text style={[styles.chatSidebarToolText, { color: colors.text }]}>Data controls</Text>
            </Pressable>
          </View>

          <View style={[styles.chatSidebarAccess, { backgroundColor: hexWithAlpha(plan.color, '10'), borderColor: hexWithAlpha(plan.color, '44') }]}>
            <Text style={[styles.chatSidebarSectionLabel, { color: plan.color }]}>Access</Text>
            <Text style={[styles.chatSidebarAccessText, { color: colors.text }]}>{plan.name} plan</Text>
            <Text style={[styles.chatSidebarMeta, { color: colors.textMuted }]}>{formatAiPromptLimit(effectivePlan)}</Text>
          </View>
        </View>

        <View style={styles.aiChatMain}>
          <View style={[styles.aiWorkspaceHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.chatBotIcon, { backgroundColor: hexWithAlpha(colors.purple, '22') }]}>
              <Brain size={18} color={colors.purple} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.chatTitle, { color: colors.text }]} numberOfLines={1}>
                {chat.activeConversation.title}
              </Text>
              <Text style={[styles.chatStatus, { color: isListening ? colors.purple : isSpeaking ? colors.accent : isThinking || isGenerating ? colors.warning : colors.success }]}>
                {isListening ? 'Listening' : isSpeaking ? 'Speaking' : isThinking ? 'Checking risk' : isGenerating ? 'Writing answer' : 'Ready'}
              </Text>
            </View>
            <View style={styles.voiceHeaderControls}>
              <Pressable
                onPress={() => {
                  if (isSpeaking) {
                    stopSpeaking();
                    return;
                  }
                  setVoiceEnabled((enabled) => !enabled);
                }}
                accessibilityRole="button"
                accessibilityLabel={voiceEnabled ? 'Turn voice responses off' : 'Turn voice responses on'}
                style={[styles.voiceMiniButton, { backgroundColor: voiceEnabled || isSpeaking ? hexWithAlpha(colors.accent, '18') : colors.surfaceStrong, borderColor: voiceEnabled || isSpeaking ? hexWithAlpha(colors.accent, '55') : colors.border }]}
              >
                {voiceEnabled || isSpeaking ? <Volume2 size={15} color={colors.accent} /> : <VolumeX size={15} color={colors.textMuted} />}
              </Pressable>
              <Pressable
                onPress={toggleListening}
                accessibilityRole="button"
                accessibilityLabel={isListening ? 'Stop voice input' : 'Start voice input'}
                style={[styles.voiceMiniButton, { backgroundColor: isListening ? hexWithAlpha(colors.purple, '20') : colors.surfaceStrong, borderColor: isListening ? hexWithAlpha(colors.purple, '66') : colors.border }]}
              >
                {isListening ? <MicOff size={15} color={colors.purple} /> : <Mic size={15} color={colors.textMuted} />}
              </Pressable>
            </View>
            {locked ? (
              <View style={[styles.promptCounter, { backgroundColor: colors.surfaceStrong, borderColor: colors.border }]}>
                <Text style={[styles.promptCounterText, { color: colors.textMuted }]}>5 prompts</Text>
              </View>
            ) : null}
          </View>

          <Card style={styles.chatPanel}>
            {voiceNotice ? (
              <View style={[styles.voiceNotice, { backgroundColor: hexWithAlpha(isListening ? colors.purple : colors.accent, '10'), borderColor: hexWithAlpha(isListening ? colors.purple : colors.accent, '33') }]}>
                <View style={[styles.voicePulseDot, { backgroundColor: isListening ? colors.purple : colors.accent }]} />
                <Text style={[styles.voiceNoticeText, { color: colors.textMuted }]}>{voiceNotice}</Text>
              </View>
            ) : null}

            <View style={styles.chatMessages}>
              {messages.map((message) => {
                const isUser = message.role === 'user';

                return (
                  <View key={message.id} style={[styles.messageRow, isUser && styles.messageRowUser]}>
                    {!isUser ? (
                      <View style={[styles.messageAvatar, { backgroundColor: hexWithAlpha(colors.purple, '22') }]}>
                        <Brain size={15} color={colors.purple} />
                      </View>
                    ) : null}
                    {isUser ? (
                      <View style={[styles.messageBubble, styles.userBubble, { backgroundColor: colors.primary }]}>
                        <Text style={styles.userMessageText}>{message.text}</Text>
                      </View>
                    ) : (
                      <View style={[styles.messageBubble, styles.aiBubble, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
                        <Text style={[styles.aiMessageText, { color: colors.textMuted }]}>
                          {message.text}
                          {message.streaming ? '|' : ''}
                        </Text>
                        {message.result ? (
                          <View style={styles.chatScoreRow}>
                            <View style={[styles.chatScorePill, { borderColor: hexWithAlpha(colors.accent, '55'), backgroundColor: hexWithAlpha(colors.accent, '12') }]}>
                              <Text style={[styles.chatScoreText, { color: colors.accent }]}>Trust {message.result.trustScore}</Text>
                            </View>
                            <View style={[styles.chatScorePill, { borderColor: hexWithAlpha(colors.warning, '55'), backgroundColor: hexWithAlpha(colors.warning, '12') }]}>
                              <Text style={[styles.chatScoreText, { color: colors.warning }]}>Risk {message.result.fraudRisk}</Text>
                            </View>
                          </View>
                        ) : null}
                      </View>
                    )}
                  </View>
                );
              })}
              {isThinking ? (
                <View style={styles.messageRow}>
                  <View style={[styles.messageAvatar, { backgroundColor: hexWithAlpha(colors.purple, '22') }]}>
                    <Brain size={15} color={colors.purple} />
                  </View>
                  <View style={[styles.messageBubble, styles.aiBubble, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
                    <Text style={[styles.aiThinkingText, { color: colors.text }]}>Thinking through the threat...</Text>
                    <Text style={[styles.aiMessageText, { color: colors.textMuted }]}>
                      Checking scam patterns, fraud risk, vulnerability context, dark web signals, and plan access.
                    </Text>
                    <View style={styles.typingDots}>
                      {[0, 1, 2].map((dot) => (
                        <View key={dot} style={[styles.typingDot, { backgroundColor: dot === 1 ? colors.accent : colors.primary }]} />
                      ))}
                    </View>
                  </View>
                </View>
              ) : null}
            </View>
          </Card>

          <View style={[styles.chatComposer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {attachment ? (
              <View style={[styles.composerAttachment, { backgroundColor: colors.surfaceStrong, borderColor: colors.border }]}>
                <FileText size={14} color={colors.primary} />
                <Text style={[styles.attachmentText, { color: colors.textMuted }]} numberOfLines={1}>
                  {attachment}
                </Text>
                <Pressable onPress={() => setAttachment(null)} hitSlop={8}>
                  <Text style={[styles.attachmentRemove, { color: colors.textSubtle }]}>x</Text>
                </Pressable>
              </View>
            ) : null}
            <View style={styles.composerInputRow}>
              <Pressable onPress={() => void pickImage()} accessibilityRole="button" accessibilityLabel="Attach image" style={[styles.composerIconButton, { backgroundColor: colors.surfaceStrong }]}>
                <Upload size={14} color={colors.primary} />
              </Pressable>
              <Pressable onPress={() => void pickDocument()} accessibilityRole="button" accessibilityLabel="Attach file" style={[styles.composerIconButton, { backgroundColor: colors.surfaceStrong }]}>
                <FileText size={14} color={colors.accent} />
              </Pressable>
              <Pressable
                onPress={toggleListening}
                accessibilityRole="button"
                accessibilityLabel={isListening ? 'Stop voice input' : 'Start voice input'}
                style={[styles.composerIconButton, { backgroundColor: isListening ? hexWithAlpha(colors.purple, '20') : colors.surfaceStrong }]}
              >
                {isListening ? <MicOff size={14} color={colors.purple} /> : <Mic size={14} color={colors.textMuted} />}
              </Pressable>
              <TextInput
                value={prompt}
                onChangeText={setPrompt}
                multiline
                scrollEnabled={composerHeight >= 132}
                onContentSizeChange={(event) => setComposerHeight(Math.min(132, Math.max(42, event.nativeEvent.contentSize.height)))}
                placeholder="Message Deltex AI..."
                placeholderTextColor={colors.textSubtle}
                style={[styles.composerTextInput, { color: colors.text, height: composerHeight }]}
                returnKeyType="default"
              />
              <Pressable onPress={() => sendPrompt(prompt)} style={[styles.sendButton, { opacity: isThinking || isGenerating ? 0.55 : 1 }]}>
                <View style={[styles.sendButtonGradient, { backgroundColor: colors.primary }]}>
                  <ArrowRight size={15} color="#ffffff" />
                </View>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      <Modal visible={showDataControls} transparent animationType="fade" onRequestClose={() => setShowDataControls(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Chat Data Controls</Text>
            <Text style={[styles.cardCopy, { color: colors.textMuted }]}>Manage local conversation history stored on this device.</Text>
            <View style={styles.modalActionStack}>
              <GradientButton label="New Chat" onPress={() => void chat.createConversation().then(() => setShowDataControls(false))} icon={Plus} />
              <OutlineButton label="Clear All Conversations" onPress={() => void chat.clearConversations()} icon={ShieldAlert} color={colors.danger} />
            </View>
            <SectionHeader title="Conversations" />
            <ScrollView style={styles.conversationList}>
              {chat.conversations.map((conversation) => {
                const active = conversation.id === chat.activeConversationId;

                return (
                  <View key={conversation.id} style={[styles.conversationRow, { borderColor: colors.border, backgroundColor: active ? hexWithAlpha(colors.primary, '14') : colors.surfaceStrong }]}>
                    <Pressable
                      onPress={() => {
                        chat.setActiveConversation(conversation.id);
                        setShowDataControls(false);
                      }}
                      style={{ flex: 1 }}
                    >
                      <Text style={[styles.menuTitle, { color: active ? colors.primary : colors.text }]} numberOfLines={1}>
                        {conversation.title}
                      </Text>
                      <Text style={[styles.menuDetail, { color: colors.textMuted }]}>{conversation.messages.length} messages</Text>
                    </Pressable>
                    <Pressable onPress={() => void chat.deleteConversation(conversation.id)} accessibilityRole="button" accessibilityLabel={`Delete ${conversation.title}`} style={[styles.aiHeaderButton, { backgroundColor: colors.card }]}>
                      <ShieldAlert size={15} color={colors.danger} />
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>
            <OutlineButton label="Done" onPress={() => setShowDataControls(false)} color={colors.primary} />
          </View>
        </View>
      </Modal>
    </ScrollScreen>
  );
}

function AlertsScreen({ onOpenModule }: { onOpenModule: (module: SecurityModule) => void }) {
  const { colors } = useDeltexTheme();
  const protection = useProtection();
  const unreadAlerts = protection.alerts.filter((alert) => !alert.acknowledged);
  const criticalAlerts = protection.alerts.filter((alert) => alert.severity === 'critical' || alert.severity === 'high');

  return (
    <ScrollScreen>
      <ScreenHeader title="Alerts & Reports" subtitle="Real-time alerts, reports, and monitoring history." />
      <View style={styles.metricGrid}>
        {[
          { label: 'Unread alerts', value: unreadAlerts.length.toString(), color: colors.warning },
          { label: 'Blocked today', value: '34', color: colors.accent },
          { label: 'Reports', value: protection.safetyReports.length.toString(), color: colors.primary },
          { label: 'High risk', value: criticalAlerts.length.toString(), color: colors.danger },
        ].map((item) => (
          <Card key={item.label} style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: item.color }]}>{item.value}</Text>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{item.label}</Text>
          </Card>
        ))}
      </View>

      <SectionHeader title="Notifications" />
      <Card>
        {protection.alerts.slice(0, 10).map((alert, index) => {
          const color = severityColor(alert.severity, colors);
          const alertModule = MODULES.find((item) => item.id === alert.moduleId);

          return (
            <Pressable
              key={alert.id}
              onPress={() => {
                void protection.acknowledgeAlert(alert.id);
                if (alertModule) onOpenModule(alertModule);
              }}
              style={[styles.alertRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}
            >
              <View style={[styles.threatIcon, { backgroundColor: hexWithAlpha(color, '16') }]}>
                <Bell size={18} color={color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.threatTitle, { color: colors.text }]}>{alert.title}</Text>
                <Text style={[styles.threatSource, { color: colors.textMuted }]}>{alert.detail}</Text>
              </View>
              <View style={styles.operationMeta}>
                <Text style={[styles.operationTokenText, { color }]}>{alert.severity}</Text>
                <Text style={[styles.threatTime, { color: alert.acknowledged ? colors.success : colors.textSubtle }]}>
                  {alert.acknowledged ? 'Read' : 'New'}
                </Text>
              </View>
            </Pressable>
          );
        })}
        {RECENT_THREATS.map((threat, index) => {
          const color = severityColor(threat.severity, colors);

          return (
            <Pressable
              key={`${threat.type}-${index}`}
              onPress={() => {
                const module = MODULES.find((item) => threat.type.toLowerCase().includes(item.shortTitle.toLowerCase()) || item.title.toLowerCase().includes(threat.type.toLowerCase()));
                if (module) onOpenModule(module);
              }}
              style={[styles.alertRow, (index > 0 || protection.alerts.length > 0) && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}
            >
              <View style={[styles.threatIcon, { backgroundColor: hexWithAlpha(color, '16') }]}>
                <Bell size={18} color={color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.threatTitle, { color: colors.text }]}>{threat.type} alert</Text>
                <Text style={[styles.threatSource, { color: colors.textMuted }]}>{threat.source}</Text>
              </View>
              <Text style={[styles.threatTime, { color: colors.textSubtle }]}>{threat.time}</Text>
            </Pressable>
          );
        })}
      </Card>

      <SectionHeader title="Security score history" />
      <Card>
        <LineAreaChart data={SCORE_HISTORY} color={colors.accent} primaryKey="value" />
      </Card>

      <SectionHeader title="Available reports" />
      <View style={styles.reportGrid}>
        {SECURITY_REPORTS.map((report) => {
          const Icon =
            report.category === 'Research'
              ? Brain
              : report.category === 'Implementation'
                ? BarChart3
                : report.id.includes('family')
                  ? Users
                  : report.id.includes('website')
                    ? Globe
                    : report.id.includes('firewall')
                      ? ShieldCheck
                : report.id.includes('identity')
                  ? Fingerprint
                  : report.id.includes('social')
                    ? MessageSquare
                    : FileText;
          const statusColorValue = report.status === 'Actionable' ? colors.warning : report.status === 'Monitoring' ? colors.primary : colors.accent;

          return (
            <Card key={report.title} style={styles.reportCard}>
              <View style={[styles.reportIcon, { backgroundColor: hexWithAlpha(statusColorValue, '14') }]}>
                <Icon size={18} color={statusColorValue} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{report.title}</Text>
                <Text style={[styles.cardCopy, { color: colors.textMuted }]}>{report.detail}</Text>
                <View style={styles.reportMetaRow}>
                  <Text style={[styles.reportMetaText, { color: statusColorValue }]}>{report.status}</Text>
                  <Text style={[styles.reportMetaText, { color: colors.textSubtle }]}>{report.kpis.length} KPIs</Text>
                  <Text style={[styles.reportMetaText, { color: colors.textSubtle }]}>{report.actions.length} actions</Text>
                </View>
              </View>
              <Download size={18} color={colors.textMuted} />
            </Card>
          );
        })}
      </View>
    </ScrollScreen>
  );
}

function ProfileScreen({ onNavigate }: { onNavigate: (screen: AppScreen) => void }) {
  const { colors } = useDeltexTheme();
  const auth = useAuthContext();
  const { currentPlan, effectivePlan, trialBoost, bonusTokens, protectionCredits, getTokenAllowance } = useSubscription();
  const { profile, updateProfile, updateNotificationPreferences, updatePrivacyPreferences, updateSecurityPreferences, updateEmergencyContact, addEmergencyContact, copyProfilePhoto } = useProfile();
  const referrals = useReferralRewards();
  const plan = PLANS.find((item) => item.id === effectivePlan) || PLANS[0];
  const paidPlan = PLANS.find((item) => item.id === currentPlan) || PLANS[0];
  const initials = (profile?.displayName || auth.user?.name || 'Deltex AI')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const primaryEmergencyContact = profile?.emergencyContacts[0];
  const [cropAsset, setCropAsset] = useState<ProfileCropAsset | null>(null);
  const [cropZoom, setCropZoom] = useState(1.12);
  const [cropRotation, setCropRotation] = useState(0);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [savingCrop, setSavingCrop] = useState(false);
  const [photoStatus, setPhotoStatus] = useState<string | null>(null);
  const cropOffsetRef = useRef(cropOffset);
  const cropStartRef = useRef(cropOffset);

  useEffect(() => {
    cropOffsetRef.current = cropOffset;
  }, [cropOffset]);

  const cropPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !!cropAsset,
        onMoveShouldSetPanResponder: () => !!cropAsset,
        onPanResponderGrant: () => {
          cropStartRef.current = cropOffsetRef.current;
        },
        onPanResponderMove: (_, gesture) => {
          setCropOffset({
            x: clampNumber(cropStartRef.current.x + gesture.dx, -96, 96),
            y: clampNumber(cropStartRef.current.y + gesture.dy, -96, 96),
          });
        },
      }),
    [cropAsset],
  );

  const pickProfilePhoto = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setPhotoStatus('Photo access is needed to update your profile image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.86,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        const asset = result.assets[0];
        setCropAsset({
          uri: asset.uri,
          width: asset.width || PROFILE_CROP_BOX_SIZE,
          height: asset.height || PROFILE_CROP_BOX_SIZE,
          fileName: asset.fileName,
        });
        setCropZoom(1.12);
        setCropRotation(0);
        setCropOffset({ x: 0, y: 0 });
        setPhotoStatus(null);
      }
    } catch {
      setPhotoStatus('Image picker could not open. Please try again.');
    }
  }, []);

  const cancelProfileCrop = useCallback(() => {
    if (savingCrop) return;
    setCropAsset(null);
    setCropOffset({ x: 0, y: 0 });
    setCropZoom(1.12);
    setCropRotation(0);
    setPhotoStatus(null);
  }, [savingCrop]);

  const completeProfileCrop = useCallback(async () => {
    if (!cropAsset || savingCrop) return;

    setSavingCrop(true);
    try {
      const normalizedRotation = ((cropRotation % 360) + 360) % 360;
      const crop = calculateProfileCrop(cropAsset, cropZoom, cropOffset, normalizedRotation);
      const actions = normalizedRotation
        ? [{ rotate: normalizedRotation }, { crop }, { resize: { width: 512, height: 512 } }]
        : [{ crop }, { resize: { width: 512, height: 512 } }];
      const result = await ImageManipulator.manipulateAsync(cropAsset.uri, actions, {
        compress: 0.88,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      const photoUri = await copyProfilePhoto(result.uri);
      await updateProfile({ photoUri });
      setCropAsset(null);
      setPhotoStatus('Profile photo updated.');
    } catch {
      setPhotoStatus('Could not save the cropped profile photo. Please try again.');
    } finally {
      setSavingCrop(false);
    }
  }, [copyProfilePhoto, cropAsset, cropOffset, cropRotation, cropZoom, savingCrop, updateProfile]);

  const updatePrimaryEmergencyContact = useCallback(
    async (patch: Partial<{ name: string; relationship: string; phone: string; email: string }>) => {
      if (primaryEmergencyContact) {
        await updateEmergencyContact(primaryEmergencyContact.id, patch);
        return;
      }

      await addEmergencyContact({
        name: patch.name || 'Emergency Contact',
        relationship: patch.relationship || 'Trusted contact',
        phone: patch.phone || '',
        email: patch.email || '',
      });
    },
    [addEmergencyContact, primaryEmergencyContact, updateEmergencyContact],
  );

  return (
    <ScrollScreen>
      <ScreenHeader title="Profile" subtitle="Account center, preferences, referrals, rewards, and subscription control." />
      <Card glow={plan.color}>
        <View style={styles.profileHeader}>
          <Pressable onPress={() => void pickProfilePhoto()} style={[styles.profileAvatar, { backgroundColor: colors.primary }]}>
            {profile?.photoUri ? <Image source={{ uri: profile.photoUri }} style={styles.profilePhotoImage} /> : <Text style={styles.profileAvatarText}>{initials}</Text>}
          </Pressable>
          <Text style={[styles.profileName, { color: colors.text }]}>{profile?.displayName || auth.user?.name || 'Deltex User'}</Text>
          <Text style={[styles.profileEmail, { color: colors.textMuted }]}>{profile?.email || auth.user?.email}</Text>
          <View style={[styles.planBadge, { backgroundColor: hexWithAlpha(plan.color, '16'), borderColor: hexWithAlpha(plan.color, '55') }]}>
            <Crown size={14} color={plan.color} />
            <Text style={[styles.planBadgeText, { color: plan.color }]}>{plan.name} Access</Text>
          </View>
          <OutlineButton label="Change Photo" onPress={() => void pickProfilePhoto()} icon={Camera} color={colors.primary} style={styles.compactButton} />
          {photoStatus ? <Text style={[styles.menuDetail, { color: photoStatus.includes('updated') ? colors.success : colors.warning, marginTop: 8 }]}>{photoStatus}</Text> : null}
        </View>
      </Card>

      <Modal visible={!!cropAsset} transparent animationType="fade" onRequestClose={() => undefined}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.cropModalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cropHeader}>
              <View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Adjust Profile Photo</Text>
                <Text style={[styles.cardCopy, { color: colors.textMuted }]}>Preview before saving.</Text>
              </View>
            </View>

            <View style={styles.cropWorkspace}>
              <View style={[styles.cropFrame, { borderColor: hexWithAlpha(colors.primary, '77'), backgroundColor: colors.surfaceStrong }]} {...cropPanResponder.panHandlers}>
                {cropAsset ? (
                  <Image
                    source={{ uri: cropAsset.uri }}
                    resizeMode="cover"
                    style={[
                      styles.cropImage,
                      {
                        transform: [
                          { translateX: cropOffset.x },
                          { translateY: cropOffset.y },
                          { scale: cropZoom },
                          { rotate: `${cropRotation}deg` },
                        ],
                      },
                    ]}
                  />
                ) : null}
                <View pointerEvents="none" style={[styles.cropOverlay, { borderColor: colors.accent }]} />
              </View>

              <View style={styles.cropPreviewColumn}>
                <View style={[styles.cropPreview, { backgroundColor: colors.surfaceStrong, borderColor: colors.border }]}>
                  {cropAsset ? (
                    <Image
                      source={{ uri: cropAsset.uri }}
                      resizeMode="cover"
                      style={[
                        styles.cropPreviewImage,
                        {
                          transform: [
                            { translateX: cropOffset.x * 0.28 },
                            { translateY: cropOffset.y * 0.28 },
                            { scale: cropZoom },
                            { rotate: `${cropRotation}deg` },
                          ],
                        },
                      ]}
                    />
                  ) : null}
                </View>
                <Text style={[styles.menuDetail, { color: colors.textMuted, textAlign: 'center' }]}>Preview</Text>
              </View>
            </View>

            <View style={styles.cropToolbar}>
              <Pressable onPress={() => setCropZoom((value) => clampNumber(value - 0.12, 1, 2.4))} style={[styles.cropToolButton, { backgroundColor: colors.surfaceStrong, borderColor: colors.border }]}>
                <Minus size={16} color={colors.textMuted} />
              </Pressable>
              <View style={[styles.cropZoomTrack, { backgroundColor: colors.surfaceStrong }]}>
                <View style={[styles.cropZoomFill, { backgroundColor: colors.primary, width: `${Math.round(((cropZoom - 1) / 1.4) * 100)}%` }]} />
              </View>
              <Pressable onPress={() => setCropZoom((value) => clampNumber(value + 0.12, 1, 2.4))} style={[styles.cropToolButton, { backgroundColor: colors.surfaceStrong, borderColor: colors.border }]}>
                <Plus size={16} color={colors.primary} />
              </Pressable>
              <Pressable
                onPress={() => setCropRotation((value) => (value + 90) % 360)}
                style={[styles.cropToolButton, { backgroundColor: hexWithAlpha(colors.accent, '12'), borderColor: hexWithAlpha(colors.accent, '44') }]}
              >
                <RotateCcw size={16} color={colors.accent} />
              </Pressable>
            </View>

            <View style={styles.modalActions}>
              <OutlineButton label="Cancel" onPress={cancelProfileCrop} color={colors.textMuted} style={styles.flexButton} />
              <GradientButton label={savingCrop ? 'Saving...' : 'Done'} onPress={() => void completeProfileCrop()} icon={Check} disabled={savingCrop} style={styles.flexButton} />
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.metricGrid}>
        {[
          { label: 'Score', value: '94', color: colors.primary },
          { label: 'Tokens', value: getTokenAllowance().toLocaleString(), color: colors.accent },
          { label: 'Rewards', value: referrals.analytics.earnedRewards.toString(), color: colors.purple },
          { label: 'Devices', value: plan.devices, color: plan.color },
        ].map((stat) => (
          <Card key={stat.label} style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: stat.color }]} numberOfLines={1}>
              {stat.value}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{stat.label}</Text>
          </Card>
        ))}
      </View>

      <SectionHeader title="Theme" subtitle="Light is default. Auto follows your device setting." />
      <ThemeModeControl />
      <TokenWalletCard onManage={() => onNavigate('tokens')} />

      <SectionHeader title="Personal details" subtitle="Provider metadata can prefill fields, but every profile field stays editable." />
      <Card>
        <View style={styles.profileFieldGrid}>
          {[
            { label: 'Display name', value: profile?.displayName || '', patch: (value: string) => updateProfile({ displayName: value }) },
            { label: 'Email', value: profile?.email || '', patch: (value: string) => updateProfile({ email: value }) },
            { label: 'Phone', value: profile?.phone || '', patch: (value: string) => updateProfile({ phone: value }) },
            { label: 'Organization', value: profile?.organization || '', patch: (value: string) => updateProfile({ organization: value }) },
            { label: 'Address', value: profile?.address || '', patch: (value: string) => updateProfile({ address: value }) },
          ].map((field) => (
            <View key={field.label} style={[styles.profileInputShell, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <Text style={[styles.profileInputLabel, { color: colors.textSubtle }]}>{field.label}</Text>
              <TextInput value={field.value} onChangeText={(value) => void field.patch(value)} placeholder={field.label} placeholderTextColor={colors.textSubtle} style={[styles.profileInput, { color: colors.text }]} />
            </View>
          ))}
          <SearchableSelectField
            label="Occupation"
            value={profile?.occupation || ''}
            options={OCCUPATION_OPTIONS}
            onSelect={(value) => void updateProfile({ occupation: value })}
            placeholder="Select role"
          />
          <SearchableSelectField
            label="Timezone"
            value={profile?.timezone || ''}
            options={TIMEZONE_OPTIONS}
            onSelect={(value) => void updateProfile({ timezone: value })}
            placeholder="Select timezone"
          />
          <SearchableSelectField
            label="Language"
            value={profile?.language || ''}
            options={LANGUAGE_OPTIONS}
            onSelect={(value) => void updateProfile({ language: value })}
            placeholder="Select language"
          />
        </View>
      </Card>

      <SectionHeader title="Connected providers" subtitle="Simulated provider metadata is stored now; real provider payloads can replace it later." />
      <Card>
        <View style={styles.signalWrap}>
          {(profile?.connectedProviders.length ? profile.connectedProviders : [auth.user?.provider || 'email']).map((provider) => (
            <View key={provider} style={[styles.paymentChip, { backgroundColor: colors.surfaceStrong, borderColor: colors.border }]}>
              {provider === 'google' ? <GoogleGlyph /> : null}
              {provider === 'microsoft' ? <MicrosoftGlyph /> : null}
              {provider === 'apple' ? <Apple size={15} color={colors.text} fill={colors.text} /> : null}
              {provider === 'passkey' ? <KeyRound size={15} color={colors.primary} /> : null}
              {provider === 'email' ? <Mail size={15} color={colors.primary} /> : null}
              <Text style={[styles.paymentChipText, { color: colors.text }]}>{provider}</Text>
            </View>
          ))}
        </View>
      </Card>

      <SectionHeader title="Privacy & security preferences" />
      <Card>
        {[
          {
            key: 'allowMetadataAnalysis' as const,
            label: 'Use account metadata for risk context',
            detail: 'Permission-based metadata can support scam and fraud analysis without becoming the sole basis for conclusions.',
            value: !!profile?.privacyPreferences.allowMetadataAnalysis,
            toggle: () => updatePrivacyPreferences({ allowMetadataAnalysis: !profile?.privacyPreferences.allowMetadataAnalysis }),
          },
          {
            key: 'allowPublicProfileAnalysis' as const,
            label: 'Analyze public profile signals',
            detail: 'Use public information and language consistency as supporting scam indicators.',
            value: !!profile?.privacyPreferences.allowPublicProfileAnalysis,
            toggle: () => updatePrivacyPreferences({ allowPublicProfileAnalysis: !profile?.privacyPreferences.allowPublicProfileAnalysis }),
          },
          {
            key: 'allowLocationContext' as const,
            label: 'Use location-related indicators',
            detail: 'Location context is optional and never used alone to label deception.',
            value: !!profile?.privacyPreferences.allowLocationContext,
            toggle: () => updatePrivacyPreferences({ allowLocationContext: !profile?.privacyPreferences.allowLocationContext }),
          },
          {
            key: 'shareDiagnostics' as const,
            label: 'Share diagnostics',
            detail: 'Send anonymized stability signals to improve protection quality.',
            value: !!profile?.privacyPreferences.shareDiagnostics,
            toggle: () => updatePrivacyPreferences({ shareDiagnostics: !profile?.privacyPreferences.shareDiagnostics }),
          },
          {
            key: 'biometrics' as const,
            label: 'Biometric unlock',
            detail: 'Use Face ID, Touch ID, fingerprint, or device passcode.',
            value: !!profile?.securityPreferences.biometrics,
            toggle: () => updateSecurityPreferences({ biometrics: !profile?.securityPreferences.biometrics }),
          },
          {
            key: 'mfa' as const,
            label: 'Multi-factor authentication',
            detail: 'Require a second factor for sensitive account changes.',
            value: !!profile?.securityPreferences.mfa,
            toggle: () => updateSecurityPreferences({ mfa: !profile?.securityPreferences.mfa }),
          },
        ].map((item, index) => (
          <View key={item.key} style={[styles.settingRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>{item.label}</Text>
              <Text style={[styles.menuDetail, { color: colors.textMuted }]}>{item.detail}</Text>
            </View>
            <Switch
              value={item.value}
              onValueChange={() => void item.toggle()}
              trackColor={{ false: colors.surfaceStrong, true: hexWithAlpha(colors.primary, '77') }}
              thumbColor={item.value ? colors.accent : colors.textSubtle}
            />
          </View>
        ))}
      </Card>

      <SectionHeader title="Notification preferences" />
      <Card>
        {[
          { key: 'threatAlerts' as const, label: 'Threat alerts', detail: 'Immediate malware, phishing, scam, and fraud warnings' },
          { key: 'scanResults' as const, label: 'Scan results', detail: 'Completed scheduled operations and deep scan outcomes' },
          { key: 'billing' as const, label: 'Billing updates', detail: 'Invoices, payment methods, trials, and coupons' },
          { key: 'referrals' as const, label: 'Referral rewards', detail: 'Reward grants, coupon redemptions, and campaign progress' },
          { key: 'weeklyReports' as const, label: 'Weekly reports', detail: 'Security posture digest and recommended actions' },
        ].map((item, index) => {
          const value = !!profile?.notificationPreferences[item.key];

          return (
            <View key={item.key} style={[styles.settingRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>{item.label}</Text>
                <Text style={[styles.menuDetail, { color: colors.textMuted }]}>{item.detail}</Text>
              </View>
              <Switch
                value={value}
                onValueChange={() => void updateNotificationPreferences({ [item.key]: !value })}
                trackColor={{ false: colors.surfaceStrong, true: hexWithAlpha(colors.primary, '77') }}
                thumbColor={value ? colors.accent : colors.textSubtle}
              />
            </View>
          );
        })}
      </Card>

      <SectionHeader title="Emergency contact" />
      <Card>
        <View style={styles.profileFieldGrid}>
          {[
            { label: 'Name', value: primaryEmergencyContact?.name || '', patch: (value: string) => updatePrimaryEmergencyContact({ name: value }) },
            { label: 'Relationship', value: primaryEmergencyContact?.relationship || '', patch: (value: string) => updatePrimaryEmergencyContact({ relationship: value }) },
            { label: 'Phone', value: primaryEmergencyContact?.phone || '', patch: (value: string) => updatePrimaryEmergencyContact({ phone: value }) },
            { label: 'Email', value: primaryEmergencyContact?.email || '', patch: (value: string) => updatePrimaryEmergencyContact({ email: value }) },
          ].map((field) => (
            <View key={field.label} style={[styles.profileInputShell, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <Text style={[styles.profileInputLabel, { color: colors.textSubtle }]}>{field.label}</Text>
              <TextInput value={field.value} onChangeText={(value) => void field.patch(value)} placeholder={field.label} placeholderTextColor={colors.textSubtle} style={[styles.profileInput, { color: colors.text }]} />
            </View>
          ))}
        </View>
      </Card>

      <SectionHeader title="Subscription & rewards" />
      <Card>
        {[
          { label: 'Paid plan', value: paidPlan.name, color: paidPlan.color },
          { label: 'Effective access', value: plan.name, color: plan.color },
          { label: 'Bonus tokens', value: bonusTokens.toLocaleString(), color: colors.accent },
          { label: 'Protection credits', value: protectionCredits.toLocaleString(), color: colors.purple },
          { label: 'Referral code', value: referrals.referralCode, color: colors.primary },
          { label: 'Trial boost', value: trialBoost ? `${trialBoost.plan} until ${new Date(trialBoost.expiresAt).toLocaleDateString()}` : 'Inactive', color: trialBoost ? colors.success : colors.textSubtle },
        ].map((item, index) => (
          <View key={item.label} style={[styles.summaryRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
            <Text style={[styles.menuDetail, { color: colors.textMuted }]}>{item.label}</Text>
            <Text style={[styles.menuTitle, { color: item.color }]} numberOfLines={1}>
              {item.value}
            </Text>
          </View>
        ))}
      </Card>

      <Card>
        {[
          { label: 'Security settings', detail: 'Theme, biometrics, MFA, privacy controls', icon: Settings, screen: 'settings' as AppScreen },
          { label: 'Subscription plans', detail: 'Free, Premium, Family, Professional, Business, Enterprise', icon: Crown, screen: 'subscriptions' as AppScreen },
          { label: 'Security tokens', detail: 'Monthly AI operations, deep scans, and token packs', icon: Database, screen: 'tokens' as AppScreen },
          { label: 'Referral rewards', detail: 'Invite links, coupon codes, reward grants, and campaigns', icon: Star, screen: 'referrals' as AppScreen },
          { label: 'Scheduled protection', detail: 'Daily, weekly, monthly, or custom security workflows', icon: RefreshCw, screen: 'schedule' as AppScreen },
          { label: 'Billing and invoices', detail: 'Payment methods, coupons, history', icon: CreditCard, screen: 'billing' as AppScreen },
          { label: 'Alerts and reports', detail: 'Notifications and downloadable reports', icon: Bell, screen: 'alerts' as AppScreen },
        ].map((item, index) => {
          const Icon = item.icon;

          return (
            <Pressable key={item.label} onPress={() => onNavigate(item.screen)} style={[styles.menuRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
              <View style={[styles.menuIcon, { backgroundColor: colors.surfaceStrong }]}>
                <Icon size={19} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>{item.label}</Text>
                <Text style={[styles.menuDetail, { color: colors.textMuted }]}>{item.detail}</Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </Pressable>
          );
        })}
      </Card>

      <OutlineButton label="Sign Out" onPress={() => void auth.signOut()} icon={ShieldAlert} color={colors.danger} />
    </ScrollScreen>
  );
}

function SettingsScreen({ onBack }: { onBack: () => void }) {
  const { colors } = useDeltexTheme();
  const chat = useAiChat();
  const [toggles, setToggles] = useState({
    realtime: true,
    browser: true,
    email: true,
    social: true,
    familySafety: true,
    websiteProtection: true,
    personalFirewall: true,
    privacy: true,
    cameraMic: false,
    vpn: false,
    biometrics: true,
    passkeys: true,
    mfa: true,
  });

  const toggle = (key: keyof typeof toggles) => setToggles((current) => ({ ...current, [key]: !current[key] }));

  return (
    <ScrollScreen>
      <ScreenHeader title="Settings" subtitle="Protection, authentication, privacy, and theme." onBack={onBack} />
      <SectionHeader title="Theme" />
      <ThemeModeControl />

      <SectionHeader title="AI data controls" subtitle="Local conversation history and assistant data on this device." />
      <Card>
        <View style={styles.scheduleSummaryRow}>
          <View style={[styles.accessIcon, { backgroundColor: hexWithAlpha(colors.purple, '16') }]}>
            <Brain size={18} color={colors.purple} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Chat history</Text>
            <Text style={[styles.cardCopy, { color: colors.textMuted }]}>
              {chat.conversations.length} conversation(s), {chat.conversations.reduce((total, conversation) => total + conversation.messages.length, 0)} stored message(s).
            </Text>
          </View>
        </View>
        <View style={styles.modalActions}>
          <OutlineButton label="Clear AI History" onPress={() => void chat.clearConversations()} icon={ShieldAlert} color={colors.danger} style={styles.flexButton} />
          <OutlineButton label="Done" onPress={onBack} icon={Check} color={colors.purple} style={styles.flexButton} />
        </View>
      </Card>

      <SectionHeader title="Protection controls" />
      <Card>
        {[
          { key: 'realtime' as const, label: 'Real-time scanning', detail: 'Continuous malware, link, and device monitoring' },
          { key: 'browser' as const, label: 'Browser protection', detail: 'Detect malicious sites and fake login pages' },
          { key: 'email' as const, label: 'Email protection', detail: 'Scan senders, attachments, and suspicious requests' },
          { key: 'social' as const, label: 'Social media protection', detail: 'Analyze profiles, messages, scams, and impersonation' },
          { key: 'familySafety' as const, label: 'Child & family safety', detail: 'Guardian-approved checks for suspicious contacts, grooming cues, youth scams, and fake giveaways' },
          { key: 'websiteProtection' as const, label: 'Website protection', detail: 'Monitor registered websites, stores, blogs, and apps for baseline drift and abuse' },
          { key: 'personalFirewall' as const, label: 'Personal security firewall', detail: 'Filter risky links, harmful domains, scam communications, suspicious downloads, and network activity' },
          { key: 'privacy' as const, label: 'Privacy protection', detail: 'Reduce trackers, broker exposure, and risky permissions' },
          { key: 'cameraMic' as const, label: 'Camera and microphone monitoring', detail: 'Surface sensitive access events' },
          { key: 'vpn' as const, label: 'VPN auto-connect prompts', detail: 'Recommend VPN on untrusted Wi-Fi' },
        ].map((item, index) => (
          <View key={item.key} style={[styles.settingRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>{item.label}</Text>
              <Text style={[styles.menuDetail, { color: colors.textMuted }]}>{item.detail}</Text>
            </View>
            <Switch
              value={toggles[item.key]}
              onValueChange={() => toggle(item.key)}
              trackColor={{ false: colors.surfaceStrong, true: hexWithAlpha(colors.primary, '77') }}
              thumbColor={toggles[item.key] ? colors.accent : colors.textSubtle}
            />
          </View>
        ))}
      </Card>

      <SectionHeader title="Authentication" />
      <Card>
        {[
          { key: 'biometrics' as const, label: 'Biometric unlock', detail: 'Use Face ID, Touch ID, fingerprint, or device passcode' },
          { key: 'passkeys' as const, label: 'Passkeys', detail: 'Prefer phishing-resistant sign-in for protected accounts' },
          { key: 'mfa' as const, label: 'Multi-factor authentication', detail: 'Require a second factor for account changes' },
        ].map((item, index) => (
          <View key={item.key} style={[styles.settingRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>{item.label}</Text>
              <Text style={[styles.menuDetail, { color: colors.textMuted }]}>{item.detail}</Text>
            </View>
            <Switch
              value={toggles[item.key]}
              onValueChange={() => toggle(item.key)}
              trackColor={{ false: colors.surfaceStrong, true: hexWithAlpha(colors.primary, '77') }}
              thumbColor={toggles[item.key] ? colors.accent : colors.textSubtle}
            />
          </View>
        ))}
      </Card>

      <Card>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Responsible AI safeguards</Text>
        <Text style={[styles.cardCopy, { color: colors.textMuted }]}>
          Deltex AI can use permission-based metadata, behavioral patterns, public profile information, language inconsistencies, and location-related indicators only as supporting context. It does not make deception conclusions based solely on nationality or location.
        </Text>
      </Card>
    </ScrollScreen>
  );
}

function SubscriptionsScreen({ onBack, onNavigate }: { onBack: () => void; onNavigate: (screen: AppScreen) => void }) {
  const { colors } = useDeltexTheme();
  const auth = useAuthContext();
  const { currentPlan, effectivePlan, billingCycle, trialBoost, bonusTokens, protectionCredits, setBillingCycle, setPlan, getTokenAllowance } = useSubscription();
  const referrals = useReferralRewards();
  const [coupon, setCoupon] = useState('');
  const [couponStatus, setCouponStatus] = useState<string | null>(null);
  const [successPlan, setSuccessPlan] = useState<PlanId | null>(null);
  const effectivePlanInfo = PLANS.find((item) => item.id === effectivePlan) || PLANS[0];
  const paidPlanInfo = PLANS.find((item) => item.id === currentPlan) || PLANS[0];

  const applyCoupon = useCallback(async () => {
    if (!coupon.trim()) {
      setCouponStatus('Enter a referral coupon code first.');
      return;
    }

    const result = await referrals.applyReferralCoupon(coupon, auth.user?.id);
    setCouponStatus(result.message);

    if (result.ok) {
      setCoupon('');
      await referrals.verifyPendingReferrals();
    }
  }, [auth.user?.id, coupon, referrals]);

  const selectPlan = useCallback(
    async (plan: PlanId) => {
      await setPlan(plan);
      setSuccessPlan(plan);
    },
    [setPlan],
  );

  const successPlanInfo = successPlan ? PLANS.find((item) => item.id === successPlan) : null;

  return (
    <ScrollScreen>
      <ScreenHeader title="Subscriptions" subtitle="Feature-based access control with monthly and yearly billing." onBack={onBack} />
      <SegmentedControl
        value={billingCycle}
        onChange={(value) => void setBillingCycle(value)}
        options={[
          { label: 'Monthly', value: 'monthly' },
          { label: 'Yearly - save 20%', value: 'yearly' },
        ]}
      />

      <Card glow={effectivePlanInfo.color}>
        <View style={styles.tokenHeroRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroEyebrow, { color: colors.accent }]}>Active entitlement</Text>
            <Text style={[styles.planName, { color: colors.text }]}>{effectivePlanInfo.name}</Text>
            <Text style={[styles.cardCopy, { color: colors.textMuted }]}>
              Paid plan: {paidPlanInfo.name}. Monthly allowance: {getTokenAllowance().toLocaleString()} tokens including {bonusTokens.toLocaleString()} bonus tokens and {protectionCredits.toLocaleString()} protection credits.
            </Text>
            {trialBoost ? (
              <Text style={[styles.cardCopy, { color: colors.success }]}>
                Trial boost active until {new Date(trialBoost.expiresAt).toLocaleDateString()}.
              </Text>
            ) : null}
          </View>
          <ScoreRing score={Math.min(100, Math.round((PLAN_RANK[effectivePlan] / PLAN_RANK.enterprise) * 100))} color={effectivePlanInfo.color} size={94} />
        </View>
      </Card>

      <View style={styles.planGrid}>
        {PLANS.map((plan) => {
          const active = plan.id === currentPlan;
          const effective = plan.id === effectivePlan;
          const entitlementProfile = PLAN_ENTITLEMENT_PROFILES[plan.id];
          return (
            <Card key={plan.id} style={[styles.planCard, (active || effective) && { borderColor: plan.color, borderWidth: 1.5 }]} glow={plan.color}>
              <View style={styles.planHeader}>
                <View style={[styles.planIcon, { backgroundColor: hexWithAlpha(plan.color, '18') }]}>
                  {plan.enterprise ? <Building2 size={24} color={plan.color} /> : plan.popular ? <Star size={24} color={plan.color} /> : <Shield size={24} color={plan.color} />}
                </View>
                {plan.popular ? (
                  <View style={[styles.popularPill, { backgroundColor: hexWithAlpha(plan.color, '18'), borderColor: hexWithAlpha(plan.color, '55') }]}>
                    <Text style={[styles.popularText, { color: plan.color }]}>Popular</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
              <Text style={[styles.planTagline, { color: colors.textMuted }]}>{plan.tagline}</Text>
              <Text style={[styles.planPrice, { color: plan.color }]}>{formatPrice(plan.id, billingCycle)}</Text>
              <Text style={[styles.planMeta, { color: colors.textMuted }]}>
                {plan.enterprise ? 'Custom terms' : billingCycle === 'monthly' ? 'per month' : 'per year'} - {plan.devices} - {plan.users}
              </Text>
              <Text style={[styles.planMeta, { color: plan.color }]}>{entitlementProfile.monthlyTokens.toLocaleString()} security tokens / month</Text>
              <Text style={[styles.planMeta, { color: colors.textMuted }]}>{formatAiPromptLimit(plan.id)} - {entitlementProfile.reportDepth} reporting</Text>
              <View style={styles.planFeatures}>
                {Object.entries(plan.features)
                  .slice(0, 6)
                  .map(([feature, access]) => (
                    <View key={feature} style={styles.planFeatureRow}>
                      <Check size={14} color={access ? plan.color : colors.textSubtle} />
                      <Text style={[styles.planFeatureText, { color: access ? colors.textMuted : colors.textSubtle }]}>
                        {feature}
                        {access === 'partial' ? ' (limited)' : ''}
                      </Text>
                    </View>
                  ))}
              </View>
              <OutlineButton
                label={active ? 'Current Plan' : effective ? 'Effective Access' : plan.enterprise ? 'Contact Sales' : 'Select Plan'}
                onPress={() => void selectPlan(plan.id)}
                color={active ? colors.accent : plan.color}
              />
            </Card>
          );
        })}
      </View>

      <SectionHeader title="Payment methods" subtitle="Apple Pay, Google Pay, PayPal, Visa, Mastercard, and M-Pesa are represented in the billing flow." />
      <View style={styles.signalWrap}>
        {PAYMENT_METHODS.map((method) => (
          <View key={method} style={[styles.paymentChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <CreditCard size={15} color={colors.primary} />
            <Text style={[styles.paymentChipText, { color: colors.text }]}>{method}</Text>
          </View>
        ))}
      </View>

      <Card>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Referral coupon</Text>
        <Text style={[styles.cardCopy, { color: colors.textMuted }]}>Apply a referral code from registration or checkout. Verified referrals grant tokens, protection credits, and trial boosts automatically.</Text>
        <View style={[styles.couponRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
          <TextInput
            value={coupon}
            onChangeText={setCoupon}
            autoCapitalize="characters"
            placeholder="Enter referral coupon code"
            placeholderTextColor={colors.textSubtle}
            style={[styles.input, { color: colors.text }]}
          />
          <OutlineButton label="Apply" onPress={() => void applyCoupon()} color={colors.accent} />
        </View>
        {couponStatus ? <Text style={[styles.menuDetail, { color: couponStatus.includes('invalid') ? colors.warning : colors.success }]}>{couponStatus}</Text> : null}
      </Card>

      <Modal visible={!!successPlanInfo} transparent animationType="fade" onRequestClose={() => setSuccessPlan(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: successPlanInfo?.color || colors.border }]}>
            <View style={[styles.planIcon, { backgroundColor: hexWithAlpha(successPlanInfo?.color || colors.primary, '18') }]}>
              <Crown size={24} color={successPlanInfo?.color || colors.primary} />
            </View>
            <Text style={[styles.planName, { color: colors.text }]}>Plan upgraded successfully</Text>
            <Text style={[styles.cardCopy, { color: colors.textMuted }]}>
              Your active plan is now {successPlanInfo?.name}. The centralized subscription context has updated dashboard access, module gates, tokens, and profile details immediately.
            </Text>
            <View style={styles.modalActionStack}>
              <GradientButton
                label="Go to Security Dashboard"
                onPress={() => {
                  setSuccessPlan(null);
                  onNavigate('dashboard');
                }}
                icon={ShieldCheck}
              />
              <View style={styles.modalActions}>
                <OutlineButton
                  label="Explore Features"
                  onPress={() => {
                    setSuccessPlan(null);
                    onNavigate('protection');
                  }}
                  icon={Search}
                  color={successPlanInfo?.color || colors.primary}
                  style={styles.flexButton}
                />
                <OutlineButton
                  label="Configure Protections"
                  onPress={() => {
                    setSuccessPlan(null);
                    onNavigate('settings');
                  }}
                  icon={Settings}
                  color={colors.accent}
                  style={styles.flexButton}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollScreen>
  );
}

function ReferralsScreen({ onBack }: { onBack: () => void }) {
  const { colors } = useDeltexTheme();
  const auth = useAuthContext();
  const { effectivePlan, trialBoost, bonusTokens, protectionCredits } = useSubscription();
  const referrals = useReferralRewards();
  const [friendEmail, setFriendEmail] = useState('');
  const [coupon, setCoupon] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const plan = PLANS.find((item) => item.id === effectivePlan) || PLANS[0];

  const sendInvite = useCallback(async () => {
    const record = await referrals.inviteFriend(friendEmail.trim() || undefined);
    setFriendEmail('');
    setStatus(record.friendEmail ? `Invitation tracked for ${record.friendEmail}.` : 'Share invitation tracked.');
  }, [friendEmail, referrals]);

  const applyCoupon = useCallback(async () => {
    if (!coupon.trim()) {
      setStatus('Enter a referral coupon before applying.');
      return;
    }

    const result = await referrals.applyReferralCoupon(coupon, auth.user?.id);
    setStatus(result.message);

    if (result.ok) {
      setCoupon('');
      await referrals.verifyPendingReferrals();
    }
  }, [auth.user?.id, coupon, referrals]);

  const regenerateCode = useCallback(async () => {
    const code = await referrals.generateReferralCode();
    setStatus(`New referral code generated: ${code}`);
  }, [referrals]);

  return (
    <ScrollScreen>
      <ScreenHeader title="Referral Rewards" subtitle="Invite friends, apply coupons, verify lifecycle events, and unlock bonus protection." onBack={onBack} />

      <Card glow={plan.color}>
        <View style={styles.referralHero}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroEyebrow, { color: colors.accent }]}>Your invite code</Text>
            <Text style={[styles.referralCodeText, { color: colors.text }]}>{referrals.referralCode}</Text>
            <Text style={[styles.referralLinkText, { color: colors.textMuted }]} numberOfLines={2}>
              {referrals.referralLink}
            </Text>
          </View>
          <View style={[styles.planIcon, { backgroundColor: hexWithAlpha(plan.color, '18') }]}>
            <Star size={25} color={plan.color} />
          </View>
        </View>
        <View style={styles.referralActionRow}>
          <OutlineButton label="Share Invite" onPress={() => void referrals.shareInvite()} icon={Upload} color={colors.primary} style={styles.flexButton} />
          <OutlineButton label="New Code" onPress={() => void regenerateCode()} icon={RefreshCw} color={colors.accent} style={styles.flexButton} />
        </View>
      </Card>

      <View style={styles.metricGrid}>
        {[
          { label: 'Sent', value: referrals.analytics.invitationsSent.toString(), color: colors.primary },
          { label: 'Successful', value: referrals.analytics.successfulReferrals.toString(), color: colors.success },
          { label: 'Pending', value: referrals.analytics.pendingReferrals.toString(), color: colors.warning },
          { label: 'Rewards', value: referrals.analytics.earnedRewards.toString(), color: colors.purple },
          { label: 'Redeemed', value: referrals.analytics.redeemedRewards.toString(), color: colors.accent },
          { label: 'Bonus tokens', value: referrals.analytics.totalBonusTokens.toLocaleString(), color: colors.primary },
        ].map((stat) => (
          <Card key={stat.label} style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: stat.color }]} numberOfLines={1}>
              {stat.value}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{stat.label}</Text>
          </Card>
        ))}
      </View>

      <SectionHeader title="Invite a friend" subtitle="Track invitation lifecycle from sent to verified install activation." />
      <Card>
        <View style={[styles.couponRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
          <TextInput value={friendEmail} onChangeText={setFriendEmail} keyboardType="email-address" autoCapitalize="none" placeholder="Friend email (optional)" placeholderTextColor={colors.textSubtle} style={[styles.input, { color: colors.text }]} />
          <OutlineButton label="Invite" onPress={() => void sendInvite()} color={colors.primary} />
        </View>
        <Text style={[styles.cardCopy, { color: colors.textMuted }]}>{referrals.shareMessage}</Text>
      </Card>

      <SectionHeader title="Apply coupon" subtitle="Registration and checkout can both redeem referral coupon codes." />
      <Card>
        <View style={[styles.couponRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
          <TextInput value={coupon} onChangeText={setCoupon} autoCapitalize="characters" placeholder="Referral coupon code" placeholderTextColor={colors.textSubtle} style={[styles.input, { color: colors.text }]} />
          <OutlineButton label="Apply" onPress={() => void applyCoupon()} color={colors.accent} />
        </View>
        {status ? <Text style={[styles.menuDetail, { color: status.includes('invalid') ? colors.warning : colors.success }]}>{status}</Text> : null}
      </Card>

      <SectionHeader title="Reward wallet" subtitle="Referral benefits feed the centralized subscription and entitlement engine." />
      <Card>
        {[
          { label: 'Effective plan', value: plan.name, color: plan.color },
          { label: 'Bonus tokens', value: bonusTokens.toLocaleString(), color: colors.accent },
          { label: 'Protection credits', value: protectionCredits.toLocaleString(), color: colors.purple },
          { label: 'Trial boost', value: trialBoost ? `${trialBoost.plan} until ${new Date(trialBoost.expiresAt).toLocaleDateString()}` : 'Inactive', color: trialBoost ? colors.success : colors.textSubtle },
        ].map((item, index) => (
          <View key={item.label} style={[styles.summaryRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
            <Text style={[styles.menuDetail, { color: colors.textMuted }]}>{item.label}</Text>
            <Text style={[styles.menuTitle, { color: item.color }]}>{item.value}</Text>
          </View>
        ))}
      </Card>

      <SectionHeader title="Campaigns" subtitle="Milestone, seasonal, loyalty, and trial-boost campaigns are modeled locally for now." />
      <View style={styles.planGrid}>
        {referrals.campaigns.map((campaign) => (
          <Card key={campaign.id} style={styles.planCard} glow={campaign.seasonal ? colors.purple : colors.primary}>
            <View style={styles.planHeader}>
              <View style={[styles.planIcon, { backgroundColor: hexWithAlpha(campaign.seasonal ? colors.purple : colors.primary, '18') }]}>
                <Crown size={22} color={campaign.seasonal ? colors.purple : colors.primary} />
              </View>
              <View style={[styles.popularPill, { backgroundColor: hexWithAlpha(campaign.active ? colors.success : colors.textSubtle, '18'), borderColor: hexWithAlpha(campaign.active ? colors.success : colors.textSubtle, '55') }]}>
                <Text style={[styles.popularText, { color: campaign.active ? colors.success : colors.textSubtle }]}>{campaign.active ? 'Active' : 'Paused'}</Text>
              </View>
            </View>
            <Text style={[styles.planName, { color: colors.text }]}>{campaign.name}</Text>
            <Text style={[styles.cardCopy, { color: colors.textMuted }]}>
              Milestone {campaign.milestone}: {campaign.rewardPackage.tokens} tokens, {campaign.rewardPackage.protectionCredits} credits, {campaign.rewardPackage.trialDays}-day {campaign.rewardPackage.trialPlan} trial.
            </Text>
            <View style={styles.signalWrap}>
              {campaign.rewardPackage.featureUnlocks.map((feature) => (
                <View key={feature} style={[styles.signalPill, { backgroundColor: hexWithAlpha(colors.primary, '12'), borderColor: hexWithAlpha(colors.primary, '44') }]}>
                  <Text style={[styles.signalText, { color: colors.primary }]}>{feature}</Text>
                </View>
              ))}
            </View>
          </Card>
        ))}
      </View>

      <SectionHeader title="Referral lifecycle" />
      <Card>
        {referrals.referrals.length === 0 ? (
          <Text style={[styles.cardCopy, { color: colors.textMuted }]}>No referral lifecycle records yet. Send an invite or apply a coupon to start tracking.</Text>
        ) : (
          referrals.referrals.slice(0, 8).map((referral, index) => (
            <View key={referral.id} style={[styles.historyRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
              <View style={[styles.menuIcon, { backgroundColor: hexWithAlpha(referral.rewardGranted ? colors.success : colors.warning, '16') }]}>
                {referral.rewardGranted ? <CheckCircle size={18} color={colors.success} /> : <RefreshCw size={18} color={colors.warning} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>{referral.friendEmail || referral.code}</Text>
                <Text style={[styles.menuDetail, { color: colors.textMuted }]}>
                  {referral.state} - {new Date(referral.updatedAt).toLocaleString()}
                </Text>
              </View>
              <Text style={[styles.operationTokenText, { color: referral.rewardGranted ? colors.success : colors.warning }]}>{referral.rewardGranted ? 'Rewarded' : 'Pending'}</Text>
            </View>
          ))
        )}
      </Card>

      <SectionHeader title="Audit history" />
      <Card>
        {referrals.events.slice(0, 10).map((event, index) => (
          <View key={event.id} style={[styles.historyRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
            <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>{event.state}</Text>
              <Text style={[styles.menuDetail, { color: colors.textMuted }]}>{event.detail}</Text>
            </View>
            <Text style={[styles.threatTime, { color: colors.textSubtle }]}>{new Date(event.timestamp).toLocaleDateString()}</Text>
          </View>
        ))}
      </Card>
    </ScrollScreen>
  );
}

function TokensScreen({ onBack }: { onBack: () => void }) {
  const { colors } = useDeltexTheme();
  const { effectivePlan, bonusTokens, getTokenAllowance } = useSubscription();
  const [extraTokens, setExtraTokens] = useState(0);
  const plan = PLANS.find((item) => item.id === effectivePlan) || PLANS[0];
  const allowance = getTokenAllowance();
  const includedUsed = Math.min(allowance - 3, Math.round(allowance * (effectivePlan === 'free' ? 0.68 : 0.36)));
  const totalTokens = allowance + extraTokens;
  const remaining = Math.max(0, totalTokens - includedUsed);

  return (
    <ScrollScreen>
      <ScreenHeader title="Security Tokens" subtitle="Monthly tokens power advanced AI scans, audits, investigations, and reports." onBack={onBack} />
      <Card glow={plan.color}>
        <View style={styles.tokenHeroRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroEyebrow, { color: colors.accent }]}>Current balance</Text>
            <Text style={[styles.tokenHeroValue, { color: colors.text }]}>{remaining.toLocaleString()}</Text>
            <Text style={[styles.cardCopy, { color: colors.textMuted }]}>
              {allowance.toLocaleString()} entitlement tokens including {bonusTokens.toLocaleString()} bonus + {extraTokens.toLocaleString()} purchased. Used {includedUsed.toLocaleString()} this cycle.
            </Text>
          </View>
          <ScoreRing score={Math.round((remaining / Math.max(1, totalTokens)) * 100)} color={colors.accent} size={104} />
        </View>
      </Card>

      <SectionHeader title="Advanced AI operations" subtitle="Operations scale, lock, or unlock from your subscription plan." />
      <Card>
        {TOKEN_OPERATIONS.map((operation, index) => {
          const Icon = operation.icon;
          const locked = PLAN_RANK[effectivePlan] < PLAN_RANK[operation.minPlan];

          return (
            <View key={operation.title} style={[styles.operationRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
              <View style={[styles.menuIcon, { backgroundColor: hexWithAlpha(operation.color, '16') }]}>
                <Icon size={18} color={operation.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>{operation.title}</Text>
                <Text style={[styles.menuDetail, { color: colors.textMuted }]}>{operation.detail}</Text>
              </View>
              <View style={styles.operationMeta}>
                <Text style={[styles.operationTokenText, { color: operation.color }]}>{operation.tokens} tokens</Text>
                <Text style={[styles.operationLockText, { color: locked ? colors.warning : colors.success }]}>
                  {locked ? `${operation.minPlan}+` : 'Unlocked'}
                </Text>
              </View>
            </View>
          );
        })}
      </Card>

      <SectionHeader title="Buy more tokens" subtitle="Token packs are available for extra deep scans, fraud investigations, audits, and reports." />
      <View style={styles.tokenPackGrid}>
        {[
          { amount: 100, price: '$4.99', label: 'Quick pack' },
          { amount: 500, price: '$19.99', label: 'Investigation pack' },
          { amount: 2000, price: '$69.99', label: 'Business pack' },
        ].map((pack) => (
          <Pressable
            key={pack.amount}
            onPress={() => setExtraTokens((value) => value + pack.amount)}
            style={[styles.tokenPackCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.tokenPackAmount, { color: colors.accent }]}>+{pack.amount}</Text>
            <Text style={[styles.menuTitle, { color: colors.text }]}>{pack.label}</Text>
            <Text style={[styles.menuDetail, { color: colors.textMuted }]}>{pack.price}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollScreen>
  );
}

function ScheduleScreen({ onBack }: { onBack: () => void }) {
  const { colors } = useDeltexTheme();
  const { effectivePlan } = useSubscription();
  const protection = useProtection();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [frequency, setFrequency] = useState<ScheduleFrequency>('daily');
  const [startDate, setStartDate] = useState('2026-06-16');
  const [executionTime, setExecutionTime] = useState('08:00');
  const [secondTime, setSecondTime] = useState('14:00');
  const [thirdTime, setThirdTime] = useState('21:00');
  const [intervalHours, setIntervalHours] = useState('6');
  const [windowStart, setWindowStart] = useState('22:00');
  const [windowEnd, setWindowEnd] = useState('06:00');
  const [recurringUntil, setRecurringUntil] = useState('2026-12-31');
  const operation = SCHEDULED_SECURITY_OPERATIONS[selectedIndex];
  const OperationIcon = operation.icon;
  const locked = PLAN_RANK[effectivePlan] < PLAN_RANK[operation.minPlan];
  const timesPerDay = [executionTime, frequency === 'multiple' ? secondTime : '', frequency === 'multiple' ? thirdTime : ''].filter(Boolean).length;
  const monthlyRuns = calculateMonthlyRuns(frequency, timesPerDay, Number(intervalHours) || 6);
  const estimatedTokens = operation.tokens * monthlyRuns;
  const frequencyLabel = SCHEDULE_FREQUENCY_OPTIONS.find((item) => item.value === frequency)?.label || 'Daily';
  const history = [
    { title: 'Malware scan', time: 'Today, 08:00', status: 'Completed', tokens: 4, color: colors.success },
    { title: 'Vulnerability scan', time: 'Today, 09:30', status: '2 findings', tokens: 8, color: colors.warning },
    { title: 'Dark web scan', time: 'Yesterday, 22:30', status: '1 exposure', tokens: 10, color: colors.warning },
    { title: 'Privacy audit', time: 'Mon, 19:00', status: 'Completed', tokens: 9, color: colors.accent },
    { title: 'Social media scan', time: 'Sun, 18:15', status: 'Low risk', tokens: 12, color: colors.primary },
    { title: 'Identity monitoring', time: 'Hourly', status: 'Watching', tokens: 9, color: colors.purple },
    { title: 'Caller protection scan', time: 'Daily, 07:45', status: '3 spam calls', tokens: 7, color: colors.warning },
  ];
  const scheduleSummary =
    frequency === 'custom'
      ? `Every ${intervalHours || 6} hours from ${startDate}, inside ${windowStart}-${windowEnd}`
      : frequency === 'multiple'
        ? `${frequencyLabel}: ${[executionTime, secondTime, thirdTime].filter(Boolean).join(', ')} from ${startDate}`
        : `${frequencyLabel} at ${executionTime} from ${startDate}`;

  const saveSchedule = useCallback(() => {
    if (locked) return;

    void protection.saveSchedule({
      moduleId: moduleIdForScheduledOperation(operation.title),
      task: operation.title,
      frequency,
      startAt: `${startDate}T${executionTime}:00`,
      executionTimes: [executionTime, frequency === 'multiple' ? secondTime : '', frequency === 'multiple' ? thirdTime : ''].filter(Boolean),
      windowStart,
      windowEnd,
      recurringUntil,
      tokens: estimatedTokens,
      notify: true,
    });
  }, [estimatedTokens, executionTime, frequency, locked, operation.title, protection, recurringUntil, secondTime, startDate, thirdTime, windowEnd, windowStart]);

  return (
    <ScrollScreen>
      <ScreenHeader title="Scheduling Engine" subtitle="Exact execution times, windows, intervals, recurring protection, and token forecasting." onBack={onBack} />
      <SectionHeader title="Choose operation" />
      <View style={styles.scheduleGrid}>
        {SCHEDULED_SECURITY_OPERATIONS.map((item, index) => {
          const Icon = item.icon;
          const active = index === selectedIndex;
          const itemLocked = PLAN_RANK[effectivePlan] < PLAN_RANK[item.minPlan];

          return (
            <Pressable
              key={item.title}
              onPress={() => setSelectedIndex(index)}
              style={[
                styles.scheduleCard,
                {
                  backgroundColor: active ? hexWithAlpha(item.color, '14') : colors.card,
                  borderColor: active ? hexWithAlpha(item.color, '66') : colors.border,
                },
              ]}
            >
              <View style={[styles.menuIcon, { backgroundColor: hexWithAlpha(item.color, '16') }]}>
                <Icon size={18} color={item.color} />
              </View>
              <Text style={[styles.menuTitle, { color: colors.text }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.menuDetail, { color: colors.textMuted }]} numberOfLines={2}>
                {item.detail}
              </Text>
              <Text style={[styles.operationTokenText, { color: itemLocked ? colors.warning : item.color }]}>
                {itemLocked ? `${item.minPlan}+` : `${item.tokens} tokens`}
              </Text>
              <Text style={[styles.scheduleHistoryHint, { color: colors.textSubtle }]}>
                {history.filter((entry) => entry.title === item.title).length || 1} history event
              </Text>
            </Pressable>
          );
        })}
      </View>

      <SectionHeader title="Frequency" subtitle="Once, hourly, daily, weekly, monthly, yearly, multiple daily runs, custom intervals, or recurring windows." />
      <View style={styles.scheduleFrequencyGrid}>
        {SCHEDULE_FREQUENCY_OPTIONS.map((option) => {
          const active = frequency === option.value;

          return (
            <Pressable
              key={option.value}
              onPress={() => setFrequency(option.value)}
              style={[
                styles.scheduleFrequencyChip,
                {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={[styles.scheduleFrequencyText, { color: active ? '#ffffff' : colors.textMuted }]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <SectionHeader title="Execution details" subtitle="Use native date and time selectors with a web modal fallback." />
      <Card>
        <View style={styles.scheduleFieldGrid}>
          <DateTimeField label="Start date" value={startDate} mode="date" onChange={setStartDate} />
          <DateTimeField label="Primary time" value={executionTime} mode="time" onChange={setExecutionTime} />
          <DateTimeField label="Second time" value={secondTime} mode="time" onChange={setSecondTime} />
          <DateTimeField label="Third time" value={thirdTime} mode="time" onChange={setThirdTime} />
          <View style={styles.scheduleField}>
            <Text style={[styles.scheduleFieldLabel, { color: colors.textSubtle }]}>Every N hours</Text>
            <TextInput
              value={intervalHours}
              onChangeText={setIntervalHours}
              placeholder="6"
              placeholderTextColor={colors.textSubtle}
              keyboardType="numeric"
              style={[styles.scheduleInput, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
            />
          </View>
          <DateTimeField label="Recurring until" value={recurringUntil} mode="date" onChange={setRecurringUntil} />
          <DateTimeField label="Window start" value={windowStart} mode="time" onChange={setWindowStart} />
          <DateTimeField label="Window end" value={windowEnd} mode="time" onChange={setWindowEnd} />
        </View>
      </Card>

      <Card glow={operation.color}>
        <View style={styles.scheduleSummaryRow}>
          <View style={[styles.accessIcon, { backgroundColor: hexWithAlpha(operation.color, '16') }]}>
            <OperationIcon size={18} color={operation.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{operation.title}</Text>
            <Text style={[styles.cardCopy, { color: colors.textMuted }]}>
              {scheduleSummary}. Estimated {estimatedTokens} tokens per month across {monthlyRuns} run(s). {locked ? `Requires ${operation.minPlan} plan or higher.` : 'Ready to schedule.'}
            </Text>
          </View>
        </View>
        <View style={styles.scheduleTokenRow}>
          <View style={[styles.scoreMiniPill, { backgroundColor: hexWithAlpha(operation.color, '10'), borderColor: hexWithAlpha(operation.color, '44') }]}>
            <Text style={[styles.scoreMiniValue, { color: operation.color }]}>{operation.tokens}</Text>
            <Text style={[styles.scoreMiniLabel, { color: colors.textMuted }]}>per run</Text>
          </View>
          <View style={[styles.scoreMiniPill, { backgroundColor: hexWithAlpha(colors.accent, '10'), borderColor: hexWithAlpha(colors.accent, '44') }]}>
            <Text style={[styles.scoreMiniValue, { color: colors.accent }]}>{estimatedTokens}</Text>
            <Text style={[styles.scoreMiniLabel, { color: colors.textMuted }]}>monthly</Text>
          </View>
          <View style={[styles.scoreMiniPill, { backgroundColor: hexWithAlpha(colors.purple, '10'), borderColor: hexWithAlpha(colors.purple, '44') }]}>
            <Text style={[styles.scoreMiniValue, { color: colors.purple }]}>{monthlyRuns}</Text>
            <Text style={[styles.scoreMiniLabel, { color: colors.textMuted }]}>runs</Text>
          </View>
        </View>
        <GradientButton label={locked ? 'Upgrade Required' : 'Save Schedule'} onPress={saveSchedule} icon={locked ? Lock : Check} disabled={locked} />
      </Card>

      <SectionHeader title="Saved schedules" subtitle="New schedules appear here with exact time, recurrence, window, and token forecast." />
      <Card>
        {protection.schedules.length === 0 ? (
          <Text style={[styles.cardCopy, { color: colors.textMuted }]}>No schedules saved yet. Configure a task above and tap Save Schedule.</Text>
        ) : (
          protection.schedules.map((item, index) => {
            const scheduleModule = MODULES.find((moduleItem) => moduleItem.id === item.moduleId);
            const scheduleColor = scheduleModule?.color || colors.primary;

            return (
              <View key={item.id} style={[styles.operationRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                <View style={[styles.statusDotLarge, { backgroundColor: hexWithAlpha(scheduleColor, '18') }]}>
                  <CheckCircle size={16} color={scheduleColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>{item.task}</Text>
                  <Text style={[styles.menuDetail, { color: colors.textMuted }]}>
                    {item.frequency} - {item.executionTimes.join(', ')} - Window {item.windowStart}-{item.windowEnd}
                  </Text>
                </View>
                <Text style={[styles.operationTokenText, { color: scheduleColor }]}>{item.tokens} tokens</Text>
              </View>
            );
          })
        )}
      </Card>

      <SectionHeader title="Execution history" subtitle="History is shown for every protection task, not just the selected one." />
      <Card>
        {history.map((item, index) => (
          <View key={`${item.title}-${item.time}`} style={[styles.operationRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
            <View style={[styles.statusDotLarge, { backgroundColor: hexWithAlpha(item.color, '18') }]}>
              <CheckCircle size={16} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.menuDetail, { color: colors.textMuted }]}>{item.time}</Text>
            </View>
            <View style={styles.operationMeta}>
              <Text style={[styles.operationLockText, { color: item.color }]}>{item.status}</Text>
              <Text style={[styles.operationTokenText, { color: colors.textMuted }]}>{item.tokens} tokens</Text>
            </View>
          </View>
        ))}
      </Card>
    </ScrollScreen>
  );
}

function BillingScreen({ onBack }: { onBack: () => void }) {
  const { colors } = useDeltexTheme();
  const { effectivePlan } = useSubscription();
  const plan = PLANS.find((item) => item.id === effectivePlan) || PLANS[0];

  return (
    <ScrollScreen>
      <ScreenHeader title="Billing" subtitle="Payment history, invoices, and payment method." onBack={onBack} />
      <Card glow={plan.color}>
        <View style={styles.billingTop}>
          <View style={[styles.planIcon, { backgroundColor: hexWithAlpha(plan.color, '18') }]}>
            <Crown size={24} color={plan.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{plan.name} Plan</Text>
            <Text style={[styles.cardCopy, { color: colors.textMuted }]}>Active - Renews Jul 1, 2027</Text>
          </View>
          <Text style={[styles.billingPrice, { color: plan.color }]}>{plan.enterprise ? 'Custom' : `$${(plan.yearly || 0).toFixed(2)}`}</Text>
        </View>
      </Card>

      <Card>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Primary payment method</Text>
        <View style={styles.paymentMethodRow}>
          <View style={[styles.cardBrand, { backgroundColor: '#1a56db' }]}>
            <Text style={styles.cardBrandText}>VISA</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>Visa ending in 4242</Text>
            <Text style={[styles.menuDetail, { color: colors.textMuted }]}>Apple Pay and Google Pay available at checkout</Text>
          </View>
        </View>
      </Card>

      <SectionHeader title="Invoice history" />
      <Card>
        {INVOICES.map((invoice, index) => (
          <View key={invoice.date} style={[styles.invoiceRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
            <FileText size={18} color={colors.primary} />
            <Text style={[styles.invoiceDate, { color: colors.text }]}>{invoice.date}</Text>
            <Text style={[styles.invoiceAmount, { color: colors.text }]}>{invoice.amount}</Text>
            <Text style={[styles.invoiceStatus, { color: colors.success }]}>{invoice.status}</Text>
            <Download size={16} color={colors.textMuted} />
          </View>
        ))}
      </Card>
    </ScrollScreen>
  );
}

function AppSidebar({
  screen,
  activeModuleId,
  onNavigate,
  onOpenModule,
}: {
  screen: AppScreen;
  activeModuleId?: SecurityModuleId;
  onNavigate: (screen: AppScreen) => void;
  onOpenModule: (module: SecurityModule) => void;
}) {
  const { colors } = useDeltexTheme();
  const auth = useAuthContext();
  const { profile } = useProfile();
  const { effectivePlan, getTokenAllowance } = useSubscription();
  const plan = PLANS.find((item) => item.id === effectivePlan) || PLANS[0];
  const protectedCount = MODULES.filter((module) => isModuleAccessible(module, effectivePlan)).length;
  const initials = (profile?.displayName || auth.user?.name || 'Deltex AI')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const renderNavItem = (item: { screen: AppScreen; label: string; icon: IconComponent }) => {
    const Icon = item.icon;
    const active = screen === item.screen || (screen === 'module' && item.screen === 'protection');

    return (
      <Pressable
        key={item.screen}
        onPress={() => onNavigate(item.screen)}
        style={[
          styles.sidebarNavItem,
          {
            backgroundColor: active ? PRIMARY_BUTTON : 'transparent',
            borderColor: active ? PRIMARY_BUTTON : 'transparent',
          },
        ]}
      >
        <Icon size={18} color={active ? '#ffffff' : colors.textSubtle} />
        <Text style={[styles.sidebarNavLabel, { color: active ? '#ffffff' : colors.text }]}>{item.label}</Text>
      </Pressable>
    );
  };

  const renderModuleItem = (module: SecurityModule) => {
    const Icon = moduleIcons[module.id];
    const active = screen === 'module' && activeModuleId === module.id;
    const accessible = isModuleAccessible(module, effectivePlan);

    return (
      <Pressable
        key={module.id}
        onPress={() => onOpenModule(module)}
        style={[
          styles.sidebarNavItem,
          styles.sidebarModuleItem,
          {
            backgroundColor: active ? PRIMARY_BUTTON : 'transparent',
            borderColor: active ? PRIMARY_BUTTON : 'transparent',
            opacity: accessible ? 1 : 0.62,
          },
        ]}
      >
        <Icon size={16} color={active ? '#ffffff' : module.color} />
        <Text style={[styles.sidebarNavLabel, styles.sidebarModuleLabel, { color: active ? '#ffffff' : colors.text }]} numberOfLines={1}>
          {module.shortTitle}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.appSidebar, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.sidebarBrandBlock}>
        <BrandLogo compact />
        <View style={[styles.sidebarLivePill, { backgroundColor: hexWithAlpha(colors.success, '12'), borderColor: hexWithAlpha(colors.success, '44') }]}>
          <View style={[styles.sidebarLiveDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.sidebarLiveText, { color: colors.success }]}>Live workspace</Text>
        </View>
      </View>

      <ScrollView style={styles.sidebarScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.sidebarSection}>
          <Text style={[styles.sidebarSectionLabel, { color: colors.textSubtle }]}>Main</Text>
          {navItems.map(renderNavItem)}
        </View>

        <View style={styles.sidebarSection}>
          <Text style={[styles.sidebarSectionLabel, { color: colors.textSubtle }]}>Protection Modules</Text>
          {MODULES.map(renderModuleItem)}
        </View>

        <View style={styles.sidebarSection}>
          <Text style={[styles.sidebarSectionLabel, { color: colors.textSubtle }]}>Account & Tools</Text>
          {sidebarManageItems.map(renderNavItem)}
        </View>
      </ScrollView>

      <View style={styles.sidebarSpacer} />

      <Pressable onPress={() => onNavigate('profile')} style={[styles.sidebarProfileCard, { backgroundColor: colors.surfaceStrong, borderColor: colors.border }]}>
        <View style={[styles.sidebarAvatar, { backgroundColor: PRIMARY_BUTTON }]}>
          {profile?.photoUri ? <Image source={{ uri: profile.photoUri }} style={styles.sidebarAvatarImage} /> : <Text style={styles.sidebarAvatarText}>{initials}</Text>}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.sidebarProfileName, { color: colors.text }]} numberOfLines={1}>
            {profile?.displayName || auth.user?.name || 'Deltex User'}
          </Text>
          <Text style={[styles.sidebarProfileEmail, { color: colors.textMuted }]} numberOfLines={1}>
            {profile?.email || auth.user?.email || 'Local account'}
          </Text>
        </View>
      </Pressable>

      <View style={[styles.sidebarPlanCard, { backgroundColor: hexWithAlpha(plan.color, '10'), borderColor: hexWithAlpha(plan.color, '44') }]}>
        <View style={styles.sidebarPlanTop}>
          <Crown size={17} color={plan.color} />
          <Text style={[styles.sidebarPlanName, { color: plan.color }]}>{plan.name}</Text>
        </View>
        <Text style={[styles.sidebarPlanCopy, { color: colors.textMuted }]}>
          {protectedCount}/{MODULES.length} protections available
        </Text>
        <Text style={[styles.sidebarPlanCopy, { color: colors.textMuted }]}>
          {getTokenAllowance().toLocaleString()} AI tokens this cycle
        </Text>
      </View>
    </View>
  );
}

function AppShellHeader({ screen, onNavigate }: { screen: AppScreen; onNavigate: (screen: AppScreen) => void }) {
  const { colors } = useDeltexTheme();
  const { width } = useWindowDimensions();
  const auth = useAuthContext();
  const { profile } = useProfile();
  const { effectivePlan } = useSubscription();
  const protection = useProtection();
  const plan = PLANS.find((item) => item.id === effectivePlan) || PLANS[0];
  const activeAlerts = protection.alerts.filter((alert) => !alert.acknowledged).length;
  const titleMap: Record<AppScreen, { title: string; subtitle: string }> = {
    dashboard: { title: 'Overview', subtitle: 'Your security score, alerts, scans, and next steps' },
    protection: { title: 'Protections', subtitle: 'Turn protections on, configure rules, and run scans' },
    assistant: { title: 'AI Chat', subtitle: 'Ask questions, review risks, and investigate suspicious activity' },
    alerts: { title: 'Alerts & Reports', subtitle: 'Items that need review, plus generated safety reports' },
    profile: { title: 'Account', subtitle: 'Profile, plan, preferences, and protection status' },
    settings: { title: 'Preferences', subtitle: 'Security, privacy, AI data, and notification controls' },
    subscriptions: { title: 'Plan & Features', subtitle: 'See what is active and unlock more protections' },
    billing: { title: 'Billing', subtitle: 'Payment method, invoices, and renewal details' },
    tokens: { title: 'AI Tokens', subtitle: 'Usage for deep scans, reports, and investigations' },
    schedule: { title: 'Scan Schedule', subtitle: 'Automated scans, monitoring windows, and reminders' },
    referrals: { title: 'Rewards', subtitle: 'Referral bonuses and shared protection credits' },
    module: { title: 'Protection Details', subtitle: 'Review findings, adjust settings, and run validation' },
  };
  const title = titleMap[screen] || titleMap.dashboard;
  const initials = (profile?.displayName || auth.user?.name || 'DA').slice(0, 2).toUpperCase();
  const showSearch = width >= 1180;
  const showPlan = width >= 1040;

  return (
    <View style={[styles.appTopbar, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.appTopbarTitleBlock}>
        <Text style={[styles.appTopbarTitle, { color: colors.text }]}>{title.title}</Text>
        <Text style={[styles.appTopbarSubtitle, { color: colors.textMuted }]}>{title.subtitle}</Text>
      </View>

      {showSearch ? (
        <View style={[styles.appTopbarSearch, { backgroundColor: colors.surfaceStrong, borderColor: colors.border }]}>
          <Search size={16} color={colors.textSubtle} />
          <Text style={[styles.appTopbarSearchText, { color: colors.textMuted }]}>Search protections, alerts, settings</Text>
        </View>
      ) : null}

      <Pressable onPress={() => onNavigate('alerts')} style={[styles.topbarIconButton, { backgroundColor: colors.surfaceStrong, borderColor: colors.border }]}>
        <Bell size={18} color={activeAlerts ? colors.warning : colors.textMuted} />
        {activeAlerts ? (
          <View style={[styles.topbarAlertBadge, { backgroundColor: colors.warning }]}>
            <Text style={styles.topbarAlertText}>{Math.min(9, activeAlerts)}</Text>
          </View>
        ) : null}
      </Pressable>

      {showPlan ? (
        <Pressable onPress={() => onNavigate('subscriptions')} style={[styles.topbarPlanPill, { backgroundColor: hexWithAlpha(plan.color, '12'), borderColor: hexWithAlpha(plan.color, '44') }]}>
          <Crown size={15} color={plan.color} />
          <Text style={[styles.topbarPlanText, { color: plan.color }]}>{plan.name}</Text>
        </Pressable>
      ) : null}

      <Pressable onPress={() => onNavigate('profile')} style={[styles.avatar, { backgroundColor: PRIMARY_BUTTON }]}>
        {profile?.photoUri ? <Image source={{ uri: profile.photoUri }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{initials}</Text>}
      </Pressable>
    </View>
  );
}

function BottomNavigation({ screen, onNavigate }: { screen: AppScreen; onNavigate: (screen: AppScreen) => void }) {
  const { colors } = useDeltexTheme();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 18 : 14);

  return (
    <View style={[styles.bottomNav, { backgroundColor: colors.tab, borderColor: colors.border, paddingBottom: bottomPadding }]}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = screen === item.screen || (screen === 'module' && item.screen === 'protection');

        return (
          <Pressable key={item.screen} onPress={() => onNavigate(item.screen)} style={styles.navItem}>
            <View style={[styles.navIconShell, active && { backgroundColor: colors.primary }]}>
              <Icon size={21} color={active ? '#ffffff' : colors.textSubtle} />
            </View>
            <Text style={[styles.navLabel, { color: active ? colors.primary : colors.textSubtle }]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function CyberBackground({ children, variant = 'cyan' }: { children: React.ReactNode; variant?: 'cyan' | 'purple' }) {
  const { colors } = useDeltexTheme();
  const finalStop = variant === 'purple' ? colors.cardAlt : colors.backgroundSoft;

  return (
    <LinearGradient colors={[colors.background, colors.background, finalStop]} style={styles.appGradient}>
      {children}
    </LinearGradient>
  );
}

export default function DeltexSecurityApp() {
  const { colors } = useDeltexTheme();
  const { width } = useWindowDimensions();
  const auth = useAuthContext();
  const consent = useConsent();
  const referralRewards = useReferralRewards();
  const { attachUserToConsent, hasAcceptedConsent } = consent;
  const [stage, setStage] = useState<FlowStage>('splash');
  const [screen, setScreen] = useState<AppScreen>('dashboard');
  const [selectedModule, setSelectedModule] = useState<SecurityModule>(MODULES[0]);
  const [needsSetup, setNeedsSetup] = useState(false);

  const useSidebarShell = width >= 920;
  const maxWidth = width >= 1100 ? 1120 : width >= 840 ? 860 : undefined;
  const appMaxWidth = useSidebarShell ? Math.min(Math.max(width - 32, 920), 1480) : maxWidth;
  const visibleStage: FlowStage =
    !hasAcceptedConsent && stage !== 'splash'
      ? 'onboarding'
      : !auth.loading && auth.user && !hasAcceptedConsent
        ? 'onboarding'
        : !auth.loading && auth.user && !needsSetup && stage !== 'setup' && stage !== 'auth'
          ? 'app'
          : !auth.loading && !auth.user && stage === 'app'
            ? 'splash'
            : stage;

  const openModule = useCallback((module: SecurityModule) => {
    setSelectedModule(module);
    setScreen('module');
  }, []);

  useEffect(() => {
    if (auth.user && hasAcceptedConsent) {
      void attachUserToConsent(auth.user.id);
    }
  }, [attachUserToConsent, auth.user, hasAcceptedConsent]);

  const renderAppScreen = () => {
    if (screen === 'dashboard') return <DashboardScreen onNavigate={setScreen} onOpenModule={openModule} />;
    if (screen === 'protection') return <ProtectionHubScreen onOpenModule={openModule} />;
    if (screen === 'assistant') return <AssistantScreen onBack={() => setScreen('dashboard')} onNavigate={setScreen} />;
    if (screen === 'alerts') return <AlertsScreen onOpenModule={openModule} />;
    if (screen === 'profile') return <ProfileScreen onNavigate={setScreen} />;
    if (screen === 'settings') return <SettingsScreen onBack={() => setScreen('profile')} />;
    if (screen === 'subscriptions') return <SubscriptionsScreen onBack={() => setScreen('profile')} onNavigate={setScreen} />;
    if (screen === 'billing') return <BillingScreen onBack={() => setScreen('profile')} />;
    if (screen === 'tokens') return <TokensScreen onBack={() => setScreen('profile')} />;
    if (screen === 'schedule') return <ScheduleScreen onBack={() => setScreen('profile')} />;
    if (screen === 'referrals') return <ReferralsScreen onBack={() => setScreen('profile')} />;
    return <ModuleDetailScreen module={selectedModule} onBack={() => setScreen('protection')} onUpgrade={() => setScreen('subscriptions')} />;
  };

  if (auth.loading && visibleStage === 'splash') {
    return (
      <CyberBackground>
        <ActivityIndicator color={colors.primary} size="large" />
      </CyberBackground>
    );
  }

  if (visibleStage === 'splash') {
    return <SplashScreen onNext={() => setStage('onboarding')} />;
  }

  if (visibleStage === 'onboarding') {
    return <OnboardingScreen onNext={() => setStage('auth')} />;
  }

  if (visibleStage === 'auth') {
    return (
      <CyberBackground>
        <SafeAreaView style={[styles.safeArea, { maxWidth }]}>
          <AuthScreen
            onComplete={() => {
              setNeedsSetup(true);
              setStage('setup');
            }}
          />
        </SafeAreaView>
      </CyberBackground>
    );
  }

  if (visibleStage === 'setup') {
    return (
      <CyberBackground>
        <SafeAreaView style={[styles.safeArea, { maxWidth }]}>
          <SecuritySetupScreen
            onComplete={() => {
              setNeedsSetup(false);
              setStage('app');
              setScreen('dashboard');
              void referralRewards.verifyPendingReferrals();
            }}
          />
        </SafeAreaView>
      </CyberBackground>
    );
  }

  return (
    <CyberBackground variant={screen === 'assistant' ? 'purple' : 'cyan'}>
      <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { maxWidth: appMaxWidth }]}>
        {useSidebarShell ? (
          <View style={styles.appShell}>
            <AppSidebar screen={screen} activeModuleId={selectedModule.id} onNavigate={setScreen} onOpenModule={openModule} />
            <View style={styles.appMainPanel}>
              {screen === 'assistant' ? null : <AppShellHeader screen={screen} onNavigate={setScreen} />}
              <View style={styles.appContent}>{renderAppScreen()}</View>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.appContent}>{renderAppScreen()}</View>
            {screen === 'assistant' ? null : <BottomNavigation screen={screen} onNavigate={setScreen} />}
          </>
        )}
      </SafeAreaView>
    </CyberBackground>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  appGradient: {
    flex: 1,
    alignItems: 'center',
  },
  bgGlowTop: {
    position: 'absolute',
    top: -150,
    left: -96,
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.28,
  },
  bgGlowRight: {
    position: 'absolute',
    top: 190,
    right: -120,
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.36,
  },
  bgGrid: {
    position: 'absolute',
    left: 14,
    right: 14,
    top: 72,
    bottom: 78,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    opacity: 0.36,
  },
  safeArea: {
    flex: 1,
    width: '100%',
  },
  appShell: {
    flex: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 12,
  },
  appSidebar: {
    width: 268,
    borderWidth: 1,
    borderRadius: 20,
    padding: 12,
  },
  appMainPanel: {
    flex: 1,
    overflow: 'visible',
  },
  sidebarBrandBlock: {
    gap: 12,
    padding: 6,
    marginBottom: 14,
  },
  sidebarLivePill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sidebarLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
  },
  sidebarLiveText: {
    fontSize: 10,
    fontWeight: '800',
  },
  sidebarSection: {
    gap: 5,
    marginBottom: 16,
  },
  sidebarScroll: {
    flex: 1,
    marginHorizontal: -2,
    paddingHorizontal: 2,
  },
  sidebarSectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 10,
    marginBottom: 4,
  },
  sidebarNavItem: {
    minHeight: 42,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sidebarNavLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  sidebarModuleItem: {
    minHeight: 36,
    paddingHorizontal: 10,
  },
  sidebarModuleLabel: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
  },
  sidebarSpacer: {
    flex: 1,
    minHeight: 14,
  },
  sidebarProfileCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  sidebarAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sidebarAvatarImage: {
    width: 38,
    height: 38,
    borderRadius: 12,
  },
  sidebarAvatarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  sidebarProfileName: {
    fontSize: 12,
    fontWeight: '800',
  },
  sidebarProfileEmail: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  sidebarPlanCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  sidebarPlanTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 7,
  },
  sidebarPlanName: {
    fontSize: 12,
    fontWeight: '900',
  },
  sidebarPlanCopy: {
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '600',
  },
  appTopbar: {
    minHeight: 68,
    borderBottomWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appTopbarTitleBlock: {
    flex: 1,
    minWidth: 190,
  },
  appTopbarTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  appTopbarSubtitle: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  appTopbarSearch: {
    flexBasis: 300,
    maxWidth: 360,
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  appTopbarSearchText: {
    fontSize: 11,
    fontWeight: '700',
  },
  topbarIconButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topbarAlertBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  topbarAlertText: {
    color: '#111111',
    fontSize: 9,
    fontWeight: '900',
  },
  topbarPlanPill: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  topbarPlanText: {
    fontSize: 11,
    fontWeight: '900',
  },
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenPadded: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  appContent: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 116,
  },
  scrollContentDesktop: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  splashCenter: {
    alignItems: 'center',
    paddingHorizontal: 28,
    gap: 18,
  },
  splashLogoFrame: {
    width: 68,
    height: 68,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  splashLogo: {
    width: 54,
    height: 54,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 8,
  },
  loadingDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
  },
  gradientButton: {
    minHeight: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 9,
    alignSelf: 'stretch',
  },
  gradientButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 17,
    textAlign: 'center',
    flexShrink: 1,
  },
  outlineButton: {
    minHeight: 42,
    borderRadius: 8,
    borderWidth: 0,
    paddingHorizontal: 18,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
    alignSelf: 'stretch',
  },
  outlineButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 17,
    textAlign: 'center',
    flexShrink: 1,
  },
  skipButton: {
    alignSelf: 'flex-end',
    padding: 10,
  },
  skipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  onboardingCenter: {
    alignItems: 'center',
    gap: 16,
  },
  onboardingOrb: {
    width: 152,
    height: 152,
    borderRadius: 76,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onboardingTitle: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  onboardingDescription: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  agreementContent: {
    paddingBottom: 16,
    gap: 10,
  },
  agreementCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
  },
  agreementActions: {
    gap: 10,
    marginTop: 12,
  },
  pager: {
    flexDirection: 'row',
    gap: 8,
  },
  pagerDot: {
    height: 8,
    borderRadius: 8,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoLarge: {
    width: 54,
    height: 54,
    borderRadius: 16,
  },
  logoSmall: {
    width: 38,
    height: 38,
    borderRadius: 12,
  },
  logoText: {
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  logoSubtext: {
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  authHeader: {
    marginTop: 20,
    marginBottom: 14,
  },
  authTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -1,
  },
  authSubtitle: {
    fontSize: 12,
    marginTop: 6,
  },
  providerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  providerButton: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 60,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  providerIconSlot: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerLabel: {
    fontSize: 11,
    fontWeight: '900',
  },
  providerSubLabel: {
    fontSize: 8,
    fontWeight: '700',
    marginTop: 1,
  },
  googleGlyph: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  googleG: {
    color: '#4285F4',
    fontSize: 21,
    fontWeight: '900',
  },
  brandDot: {
    width: 4,
    height: 4,
    borderRadius: 4,
    marginLeft: -1,
    marginTop: 16,
  },
  microsoftGlyph: {
    width: 26,
    height: 26,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  microsoftSquare: {
    width: 11,
    height: 11,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 16,
  },
  dividerLine: {
    height: 1,
    flex: 1,
  },
  dividerText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  inputGroup: {
    gap: 9,
    marginBottom: 11,
  },
  inputShell: {
    minHeight: 46,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 13,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 14,
  },
  errorText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
  },
  authSecurityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  authSecurityIcon: {
    width: 50,
    height: 50,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardCopy: {
    fontSize: 11,
    lineHeight: 16,
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  screenSubtitle: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  setupHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  setupList: {
    gap: 10,
    marginVertical: 12,
  },
  setupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 0,
  },
  checkBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  railwayTopNav: {
    minHeight: 58,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  railwayNavLinks: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    flexWrap: 'wrap',
  },
  railwayNavLink: {
    fontSize: 11,
    fontWeight: '800',
  },
  railwayNavActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '900',
  },
  avatarImage: {
    width: 42,
    height: 42,
    borderRadius: 15,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
  },
  railwayHeroGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 16,
    flexWrap: 'wrap',
  },
  railwayHeroCopy: {
    flex: 1,
    minWidth: 280,
    justifyContent: 'center',
    paddingVertical: 6,
  },
  railwayHeroBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 18,
  },
  railwayHeroBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  railwayHeroTitle: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '900',
    letterSpacing: -1.6,
  },
  railwayHeroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 14,
    maxWidth: 560,
  },
  railwayProjectPanel: {
    flexGrow: 1,
    flexBasis: 310,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  railwayPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  railwayPanelTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  railwayPanelMeta: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 3,
  },
  railwayDeployRow: {
    minHeight: 42,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  railwayDeployDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
  },
  railwayDeployLabel: {
    width: 64,
    fontSize: 11,
    fontWeight: '900',
  },
  railwayDeployValue: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroEyebrow: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.6,
    marginBottom: 6,
  },
  heroCopy: {
    fontSize: 11,
    lineHeight: 16,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  heroAction: {
    flex: 1,
  },
  quickActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 6,
  },
  quickActionPressable: {
    flexGrow: 1,
    flexBasis: 230,
  },
  quickActionCard: {
    minHeight: 154,
    marginBottom: 0,
  },
  quickActionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 6,
  },
  quickActionCopy: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },
  quickActionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '900',
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  ringScore: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  ringLabel: {
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  donutShell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  donutValue: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  donutLabel: {
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  securityScoreCard: {
    padding: 14,
  },
  securityScoreTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  scoreTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
    flexWrap: 'wrap',
  },
  scoreStateTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.45,
  },
  scoreStatusBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  scoreStatusText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  scoreMiniGrid: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 11,
  },
  scoreMiniPill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 13,
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  scoreMiniValue: {
    fontSize: 13,
    fontWeight: '900',
  },
  scoreMiniLabel: {
    fontSize: 8,
    fontWeight: '800',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  scoreFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 12,
  },
  scoreRefreshText: {
    flex: 1,
    fontSize: 9,
    fontWeight: '800',
  },
  scoreAnalyticsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  scoreAnalyticsBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  scoreLegend: {
    flex: 1,
    gap: 7,
  },
  scoreLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
  },
  scoreLegendLabel: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
  },
  scoreLegendValue: {
    fontSize: 10,
    fontWeight: '900',
  },
  scoreTrendBlock: {
    marginTop: 10,
    maxHeight: 170,
    overflow: 'hidden',
  },
  scoreInsightList: {
    gap: 8,
    marginTop: 12,
  },
  scoreInsightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  scoreInsightText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '700',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 6,
  },
  metricCard: {
    flexGrow: 1,
    flexBasis: '47%',
    minHeight: 96,
    marginBottom: 0,
  },
  metricIcon: {
    width: 30,
    height: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
  },
  metricTrend: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    marginTop: 12,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.35,
  },
  sectionSubtitle: {
    fontSize: 10,
    lineHeight: 15,
    marginTop: 2,
  },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingBottom: 3,
  },
  sectionActionText: {
    fontSize: 10,
    fontWeight: '800',
  },
  refreshCard: {
    marginTop: -2,
  },
  refreshRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  chart: {
    height: 180,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  chartTrack: {
    width: '100%',
    height: 140,
    borderRadius: 13,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBar: {
    width: '100%',
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
  },
  chartBarOverlay: {
    width: '45%',
    position: 'absolute',
    bottom: 0,
    right: 0,
    opacity: 0.72,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  chartLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  lineChartShell: {
    alignItems: 'center',
    overflow: 'hidden',
  },
  lineChartLabels: {
    width: '100%',
    marginTop: -20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  moduleCardPressable: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  moduleCardCompact: {
    flexBasis: '47%',
  },
  moduleCard: {
    minHeight: 152,
    marginBottom: 0,
  },
  moduleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  moduleIcon: {
    width: 36,
    height: 36,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleTitle: {
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 6,
  },
  moduleDescription: {
    fontSize: 10,
    lineHeight: 15,
    minHeight: 32,
  },
  moduleBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  moduleScore: {
    fontSize: 12,
    fontWeight: '900',
  },
  progressTrack: {
    height: 7,
    borderRadius: 7,
    overflow: 'hidden',
  },
  progressFill: {
    height: 7,
    borderRadius: 7,
  },
  statusPill: {
    minHeight: 21,
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  threatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  threatIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  threatTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  threatSource: {
    fontSize: 10,
    marginTop: 2,
  },
  threatSeverity: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  threatTime: {
    fontSize: 9,
    marginTop: 4,
  },
  searchShell: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  coverageHero: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 13,
    marginBottom: 11,
  },
  coverageHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  coverageHeroTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.35,
  },
  coverageHeroCopy: {
    fontSize: 10,
    lineHeight: 15,
    marginTop: 7,
  },
  coverageScoreBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  coverageScoreText: {
    fontSize: 10,
    fontWeight: '900',
  },
  coverageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  coverageChip: {
    flexBasis: '48%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coverageChipTitle: {
    fontSize: 10,
    fontWeight: '800',
  },
  coverageChipMeta: {
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 2,
  },
  researchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  researchCard: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 172,
    marginBottom: 0,
  },
  researchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  researchIcon: {
    width: 34,
    height: 34,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  researchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  researchSource: {
    flex: 1,
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  researchPlan: {
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryBlock: {
    marginTop: 8,
  },
  detailHero: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 13,
    marginBottom: 11,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  detailIcon: {
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  checkIcon: {
    width: 31,
    height: 31,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  checkDetail: {
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },
  signalWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 11,
  },
  signalChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 9,
  },
  signalPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 9,
  },
  signalText: {
    fontSize: 9,
    fontWeight: '800',
  },
  recommendationRow: {
    flexDirection: 'row',
    gap: 9,
    paddingVertical: 9,
  },
  recommendationText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },
  assistantHero: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 13,
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
  },
  assistantOrb: {
    width: 54,
    height: 54,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmented: {
    minHeight: 40,
    borderRadius: 15,
    borderWidth: 1,
    padding: 4,
    flexDirection: 'row',
    gap: 4,
    marginBottom: 14,
  },
  segment: {
    flex: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  segmentText: {
    fontSize: 9,
    fontWeight: '900',
  },
  textAreaShell: {
    minHeight: 126,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  textArea: {
    flex: 1,
    minHeight: 98,
    fontSize: 12,
    lineHeight: 18,
  },
  assistantActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  assistantActionButton: {
    flex: 1,
  },
  aiChatShell: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  aiChatShellCompact: {
    flexDirection: 'column',
  },
  aiChatSidebar: {
    width: 286,
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    gap: 12,
    alignSelf: 'stretch',
  },
  aiChatSidebarCompact: {
    width: '100%',
  },
  aiChatMain: {
    flex: 1,
    minWidth: 0,
  },
  chatSidebarTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  chatSidebarTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  chatSidebarMeta: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
  },
  chatSidebarPrimary: {
    minHeight: 40,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  chatSidebarPrimaryText: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
  },
  chatSidebarSection: {
    gap: 7,
  },
  chatSidebarSectionLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  chatSidebarConversation: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 12,
    padding: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatSidebarConversationTitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  chatSidebarTool: {
    minHeight: 38,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatSidebarToolText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
  },
  chatSidebarAccess: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 11,
    gap: 3,
  },
  chatSidebarAccessText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
  },
  aiWorkspaceHeader: {
    minHeight: 58,
    borderWidth: 1,
    borderRadius: 20,
    padding: 9,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiHeaderButton: {
    width: 36,
    height: 36,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatPanel: {
    padding: 0,
    overflow: 'hidden',
    borderRadius: 16,
  },
  chatHeader: {
    minHeight: 58,
    borderBottomWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chatBotIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  chatStatus: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
  promptCounter: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  promptCounterText: {
    fontSize: 9,
    fontWeight: '800',
  },
  voiceHeaderControls: {
    flexDirection: 'row',
    gap: 7,
  },
  voiceMiniButton: {
    width: 32,
    height: 32,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceNotice: {
    marginHorizontal: 13,
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voicePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
  },
  voiceNoticeText: {
    flex: 1,
    fontSize: 10,
    fontWeight: '800',
  },
  conversationList: {
    maxHeight: 260,
    marginBottom: 12,
  },
  conversationRow: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatMessages: {
    gap: 10,
    padding: 13,
    minHeight: 430,
  },
  messageRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  aiBubble: {
    borderWidth: 1,
    borderTopLeftRadius: 6,
  },
  userBubble: {
    borderTopRightRadius: 6,
  },
  aiMessageText: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },
  userMessageText: {
    color: '#ffffff',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '800',
  },
  chatScoreRow: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  chatScorePill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chatScoreText: {
    fontSize: 9,
    fontWeight: '900',
  },
  aiThinkingText: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '900',
    marginBottom: 3,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 9,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    opacity: 0.85,
  },
  suggestionRow: {
    gap: 8,
    paddingBottom: 10,
  },
  suggestionChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  suggestionText: {
    fontSize: 10,
    fontWeight: '800',
  },
  chatInputRow: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 16,
    paddingLeft: 12,
    paddingRight: 4,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatInput: {
    flex: 1,
    fontSize: 12,
    minHeight: 42,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentPill: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 11,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attachmentText: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
  },
  chatComposer: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 8,
    marginBottom: 12,
  },
  composerAttachment: {
    borderWidth: 1,
    borderRadius: 13,
    paddingVertical: 7,
    paddingHorizontal: 9,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  attachmentRemove: {
    fontSize: 13,
    fontWeight: '900',
    paddingHorizontal: 4,
  },
  composerInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
  },
  composerIconButton: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerTextInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 132,
    fontSize: 12,
    lineHeight: 17,
    paddingTop: 8,
    paddingBottom: 7,
    paddingHorizontal: 3,
    textAlignVertical: 'top',
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  riskBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  riskBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  scorePair: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  scoreBlock: {
    alignItems: 'center',
    gap: 6,
  },
  scoreCaption: {
    fontSize: 10,
    fontWeight: '800',
  },
  analysisLine: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 10,
  },
  analysisText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  reportGrid: {
    gap: 8,
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 0,
  },
  reportIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 7,
    flexWrap: 'wrap',
  },
  reportMetaText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  profileHeader: {
    alignItems: 'flex-start',
  },
  profileAvatar: {
    width: 66,
    height: 66,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  profilePhotoImage: {
    width: 66,
    height: 66,
    borderRadius: 18,
  },
  profileAvatarText: {
    color: '#050505',
    fontSize: 20,
    fontWeight: '900',
  },
  profileName: {
    fontSize: 17,
    fontWeight: '900',
  },
  profileEmail: {
    fontSize: 11,
    marginTop: 4,
  },
  planBadge: {
    marginTop: 12,
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  compactButton: {
    marginTop: 10,
    alignSelf: 'center',
  },
  cropModalCard: {
    width: '100%',
    maxWidth: 430,
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
  },
  cropHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  cropIconButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropWorkspace: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    flexWrap: 'wrap',
  },
  cropFrame: {
    width: PROFILE_CROP_BOX_SIZE,
    height: PROFILE_CROP_BOX_SIZE,
    borderRadius: 28,
    borderWidth: 1.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropImage: {
    width: PROFILE_CROP_BOX_SIZE,
    height: PROFILE_CROP_BOX_SIZE,
  },
  cropOverlay: {
    position: 'absolute',
    inset: 12,
    borderRadius: 24,
    borderWidth: 1,
  },
  cropPreviewColumn: {
    alignItems: 'center',
    gap: 8,
  },
  cropPreview: {
    width: 82,
    height: 82,
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropPreviewImage: {
    width: 82,
    height: 82,
  },
  cropToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  cropToolButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropZoomTrack: {
    flex: 1,
    height: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cropZoomFill: {
    height: 8,
    borderRadius: 8,
  },
  profileFieldGrid: {
    gap: 10,
  },
  profileInputShell: {
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  profileInputLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  profileInput: {
    minHeight: 24,
    fontSize: 12,
    padding: 0,
  },
  selectFieldValueRow: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectFieldValue: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  selectModalCard: {
    width: '100%',
    maxWidth: 430,
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
  },
  selectOptionList: {
    maxHeight: 330,
    marginBottom: 12,
  },
  selectOptionRow: {
    minHeight: 42,
    borderRadius: 13,
    paddingHorizontal: 12,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectOptionText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
  },
  flexButton: {
    flex: 1,
  },
  referralHero: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  referralCodeText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  referralLinkText: {
    fontSize: 10,
    lineHeight: 15,
    marginTop: 6,
  },
  referralActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  timelineDot: {
    width: 9,
    height: 9,
    borderRadius: 9,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  menuDetail: {
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  accessTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  accessIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  tokenNumber: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  tokenMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 9,
    marginBottom: 12,
  },
  tokenMetaText: {
    fontSize: 9,
    fontWeight: '800',
  },
  planGrid: {
    gap: 12,
  },
  planCard: {
    marginBottom: 0,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popularPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  planName: {
    fontSize: 17,
    fontWeight: '900',
    marginTop: 14,
  },
  planTagline: {
    fontSize: 11,
    marginTop: 4,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 12,
  },
  planMeta: {
    fontSize: 10,
    marginTop: 3,
  },
  planFeatures: {
    gap: 6,
    marginVertical: 11,
  },
  planFeatureRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  planFeatureText: {
    flex: 1,
    fontSize: 10,
    fontWeight: '600',
  },
  paymentChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
  },
  paymentChipText: {
    fontSize: 10,
    fontWeight: '800',
  },
  couponRow: {
    borderWidth: 1,
    borderRadius: 18,
    minHeight: 54,
    paddingLeft: 12,
    paddingRight: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  tokenHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tokenHeroValue: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1.3,
  },
  operationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
  },
  operationMeta: {
    alignItems: 'flex-end',
    gap: 3,
  },
  operationTokenText: {
    fontSize: 10,
    fontWeight: '900',
  },
  operationLockText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tokenPackGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tokenPackCard: {
    flexBasis: '31%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    minHeight: 94,
  },
  tokenPackAmount: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  scheduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  scheduleCard: {
    flexBasis: '47%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    minHeight: 154,
    gap: 7,
  },
  scheduleHistoryHint: {
    fontSize: 8,
    fontWeight: '800',
    marginTop: 2,
  },
  scheduleFrequencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  scheduleFrequencyChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  scheduleFrequencyText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  scheduleFieldGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  scheduleField: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  scheduleFieldLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  scheduleInput: {
    borderWidth: 1,
    borderRadius: 13,
    minHeight: 42,
    paddingHorizontal: 10,
    fontSize: 12,
    fontWeight: '700',
  },
  dateTimeField: {
    borderWidth: 1,
    borderRadius: 13,
    minHeight: 42,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateTimeFieldText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  modalActionStack: {
    gap: 10,
    marginTop: 16,
  },
  scheduleSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  scheduleTokenRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statusDotLarge: {
    width: 34,
    height: 34,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  billingTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  billingPrice: {
    fontSize: 15,
    fontWeight: '900',
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  cardBrand: {
    width: 56,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBrandText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  invoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  invoiceDate: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
  },
  invoiceAmount: {
    fontSize: 11,
    fontWeight: '900',
  },
  invoiceStatus: {
    fontSize: 9,
    fontWeight: '900',
  },
  bottomNav: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 10,
    borderWidth: 1,
    borderRadius: 18,
    paddingTop: 8,
    paddingBottom: Platform.select({ ios: 18, android: 12, default: 12 }),
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  navItem: {
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  navIconShell: {
    width: 34,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 9,
    fontWeight: '900',
  },
});
