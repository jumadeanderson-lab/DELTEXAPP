import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as BackgroundTask from 'expo-background-task';
import * as SecureStore from 'expo-secure-store';
import * as TaskManager from 'expo-task-manager';

import { MODULES, SecurityModuleId, SecurityStatus } from '@/constants/security-platform';
import {
  CHILD_SAFETY_SCENARIOS,
  DASHBOARD_TREND_SEEDS,
  DEFAULT_MODULE_CONFIGURATION,
  ProtectionRiskLevel,
  WEBSITE_BASELINE_SEEDS,
  WebsiteBaselineSeed,
} from '@/data/protection-seed';

type TrendRange = keyof typeof DASHBOARD_TREND_SEEDS;
type ScanStatus = 'queued' | 'running' | 'completed' | 'failed';
type ScheduleFrequency = 'once' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'multiple' | 'custom' | 'recurring';

export interface Finding {
  id: string;
  moduleId: SecurityModuleId;
  title: string;
  detail: string;
  severity: ProtectionRiskLevel;
  recommendation: string;
  createdAt: string;
  resolved: boolean;
}

export interface ScanRun {
  id: string;
  moduleId: SecurityModuleId;
  label: string;
  status: ScanStatus;
  startedAt: string;
  completedAt?: string;
  score: number;
  findings: Finding[];
}

export interface ModuleConfiguration {
  enabled: boolean;
  realtime: boolean;
  autoScan: boolean;
  monitoringWindow: string;
  scanFrequency: 'manual' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  riskThreshold: ProtectionRiskLevel;
  notifyGuardian?: boolean;
  blockHighRisk?: boolean;
  requireMfaForChanges?: boolean;
  recommendations: string[];
}

export interface ProtectionModuleState {
  moduleId: SecurityModuleId;
  enabled: boolean;
  status: SecurityStatus;
  score: number;
  lastScanAt: string | null;
  configuration: ModuleConfiguration;
  findings: Finding[];
  scanHistory: ScanRun[];
}

export interface SecurityAlert {
  id: string;
  moduleId: SecurityModuleId;
  title: string;
  detail: string;
  severity: ProtectionRiskLevel;
  createdAt: string;
  acknowledged: boolean;
}

export interface ChildProfile {
  id: string;
  name: string;
  ageBand: string;
  devices: string[];
  riskLevel: ProtectionRiskLevel;
  lastReviewAt: string | null;
}

export interface GuardianRule {
  id: string;
  label: string;
  detail: string;
  enabled: boolean;
  severity: ProtectionRiskLevel;
}

export interface SafetyReport {
  id: string;
  childId: string;
  title: string;
  summary: string;
  riskLevel: ProtectionRiskLevel;
  signals: string[];
  recommendations: string[];
  createdAt: string;
}

export interface WebsiteAssessment {
  id: string;
  websiteId: string;
  createdAt: string;
  score: number;
  status: SecurityStatus;
  findings: Finding[];
  summary: string;
}

export interface RegisteredWebsite {
  id: string;
  url: string;
  type: WebsiteBaselineSeed['type'];
  score: number;
  status: SecurityStatus;
  issue: string;
  monitoringEnabled: boolean;
  lastAssessmentAt: string | null;
  assessments: WebsiteAssessment[];
}

export interface ProtectionSchedule {
  id: string;
  moduleId: SecurityModuleId;
  task: string;
  frequency: ScheduleFrequency;
  startAt: string;
  executionTimes: string[];
  windowStart: string;
  windowEnd: string;
  recurringUntil: string | null;
  tokens: number;
  notify: boolean;
  notificationId?: string;
  createdAt: string;
}

interface DashboardActivity {
  range: TrendRange;
  refreshes: number;
  lastRefreshAt: string | null;
  trendData: typeof DASHBOARD_TREND_SEEDS[TrendRange];
}

interface ProtectionState {
  modules: Record<SecurityModuleId, ProtectionModuleState>;
  alerts: SecurityAlert[];
  childProfiles: ChildProfile[];
  guardianRules: GuardianRule[];
  safetyReports: SafetyReport[];
  websites: RegisteredWebsite[];
  schedules: ProtectionSchedule[];
  dashboard: DashboardActivity;
  backgroundTaskEnabled: boolean;
}

interface ProtectionContextValue extends ProtectionState {
  updateModuleConfig: (moduleId: SecurityModuleId, patch: Partial<ModuleConfiguration>) => Promise<void>;
  runModuleScan: (moduleId: SecurityModuleId, label?: string) => Promise<ScanRun>;
  saveSchedule: (schedule: Omit<ProtectionSchedule, 'id' | 'createdAt' | 'notificationId'>) => Promise<ProtectionSchedule>;
  registerWebsite: (url: string, type?: RegisteredWebsite['type']) => Promise<RegisteredWebsite | null>;
  runWebsiteAssessment: (websiteId: string) => Promise<WebsiteAssessment | null>;
  saveChildProfile: (profile: Partial<ChildProfile> & Pick<ChildProfile, 'name' | 'ageBand'>) => Promise<ChildProfile>;
  updateFamilyRule: (id: string, patch: Partial<GuardianRule>) => Promise<void>;
  generateSafetyReport: (childId?: string) => Promise<SafetyReport>;
  acknowledgeAlert: (id: string) => Promise<void>;
  refreshDashboardData: (range?: TrendRange) => Promise<void>;
}

const STORE_KEY = 'deltex_ai_protection_state_v1';
const BACKGROUND_TASK_IDENTIFIER = 'deltex-protection-schedule-worker';

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function riskRank(level: ProtectionRiskLevel) {
  return { low: 1, medium: 2, high: 3, critical: 4 }[level];
}

function statusFromFindings(findings: Finding[]): SecurityStatus {
  if (findings.some((finding) => finding.severity === 'critical' || finding.severity === 'high')) return 'Warning';
  if (findings.length) return 'Monitoring';
  return 'Protected';
}

function scoreFromFindings(baseScore: number, findings: Finding[]) {
  const penalty = findings.reduce((total, finding) => total + riskRank(finding.severity) * 4, 0);
  return Math.max(42, Math.min(99, baseScore - penalty + Math.min(5, findings.length ? 0 : 3)));
}

function normalizeUrl(url: string) {
  return url.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '').toLowerCase();
}

function inferWebsiteType(url: string): RegisteredWebsite['type'] {
  const normalized = url.toLowerCase();
  if (normalized.includes('store') || normalized.includes('shop') || normalized.includes('commerce')) return 'E-commerce';
  if (normalized.includes('blog') || normalized.includes('news')) return 'Blog';
  if (normalized.includes('portfolio') || normalized.includes('creator')) return 'Portfolio';
  if (normalized.includes('app') || normalized.includes('portal') || normalized.includes('platform')) return 'Business Platform';
  return 'Website';
}

function createFinding(moduleId: SecurityModuleId, seed: { title: string; detail: string; severity: ProtectionRiskLevel; recommendation: string }): Finding {
  return {
    id: createId('finding'),
    moduleId,
    title: seed.title,
    detail: seed.detail,
    severity: seed.severity,
    recommendation: seed.recommendation,
    createdAt: nowIso(),
    resolved: false,
  };
}

function createModuleState(moduleId: SecurityModuleId): ProtectionModuleState {
  const module = MODULES.find((item) => item.id === moduleId);
  const seed = DEFAULT_MODULE_CONFIGURATION[moduleId];
  const findings = seed.findings.map((finding) => createFinding(moduleId, finding));

  return {
    moduleId,
    enabled: seed.enabled,
    status: statusFromFindings(findings),
    score: scoreFromFindings(module?.score || 84, findings),
    lastScanAt: null,
    configuration: {
      enabled: seed.enabled,
      realtime: seed.realtime,
      autoScan: seed.autoScan,
      monitoringWindow: seed.monitoringWindow,
      scanFrequency: seed.scanFrequency,
      riskThreshold: seed.riskThreshold,
      notifyGuardian: moduleId === 'family-safety',
      blockHighRisk: true,
      requireMfaForChanges: moduleId === 'biometrics',
      recommendations: seed.recommendations,
    },
    findings,
    scanHistory: [],
  };
}

function createWebsite(seed: WebsiteBaselineSeed): RegisteredWebsite {
  return {
    id: createId('site'),
    url: seed.url,
    type: seed.type,
    score: seed.score,
    status: seed.status,
    issue: seed.issue,
    monitoringEnabled: true,
    lastAssessmentAt: null,
    assessments: [],
  };
}

function defaultState(): ProtectionState {
  const modules = MODULES.reduce((acc, module) => {
    acc[module.id] = createModuleState(module.id);
    return acc;
  }, {} as Record<SecurityModuleId, ProtectionModuleState>);

  const familyFindings = modules['family-safety']?.findings || [];
  const websiteFindings = modules['website-protection']?.findings || [];

  return {
    modules,
    alerts: [
      ...familyFindings.slice(0, 1).map((finding) => ({
        id: createId('alert'),
        moduleId: finding.moduleId,
        title: finding.title,
        detail: finding.detail,
        severity: finding.severity,
        createdAt: finding.createdAt,
        acknowledged: false,
      })),
      ...websiteFindings.slice(0, 1).map((finding) => ({
        id: createId('alert'),
        moduleId: finding.moduleId,
        title: finding.title,
        detail: finding.detail,
        severity: finding.severity,
        createdAt: finding.createdAt,
        acknowledged: false,
      })),
    ],
    childProfiles: [
      { id: 'child-maya', name: 'Maya', ageBand: '10-12', devices: ['Tablet', 'Family laptop'], riskLevel: 'medium', lastReviewAt: null },
      { id: 'child-noah', name: 'Noah', ageBand: '13-15', devices: ['Phone', 'Console'], riskLevel: 'low', lastReviewAt: null },
    ],
    guardianRules: [
      { id: 'rule-secrecy', label: 'Secrecy pressure', detail: 'Alert when contacts ask children to hide conversations or gifts.', enabled: true, severity: 'high' },
      { id: 'rule-payments', label: 'Payments and gift cards', detail: 'Block payment, crypto, gift card, and giveaway requests from unknown contacts.', enabled: true, severity: 'high' },
      { id: 'rule-late-night', label: 'Late-night contact', detail: 'Notify guardians when new contacts message outside the monitoring window.', enabled: true, severity: 'medium' },
      { id: 'rule-links', label: 'Risky links', detail: 'Scan links in youth chats for phishing, malware, and fake reward pages.', enabled: true, severity: 'medium' },
    ],
    safetyReports: [],
    websites: WEBSITE_BASELINE_SEEDS.map(createWebsite),
    schedules: [],
    dashboard: {
      range: '24H',
      refreshes: 0,
      lastRefreshAt: null,
      trendData: DASHBOARD_TREND_SEEDS['24H'],
    },
    backgroundTaskEnabled: false,
  };
}

async function getStoredState() {
  if (Platform.OS === 'web') {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(STORE_KEY);
  }

  return SecureStore.getItemAsync(STORE_KEY);
}

async function setStoredState(state: ProtectionState) {
  const value = JSON.stringify(state);

  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORE_KEY, value);
    }
    return;
  }

  await SecureStore.setItemAsync(STORE_KEY, value);
}

function mergeStoredState(stored: ProtectionState): ProtectionState {
  const base = defaultState();
  const storedModules = stored.modules || {};
  const modules = MODULES.reduce((acc, module) => {
    const baseModule = base.modules[module.id];
    const storedModule = storedModules[module.id];

    acc[module.id] = storedModule
      ? {
          ...baseModule,
          ...storedModule,
          configuration: {
            ...baseModule.configuration,
            ...(storedModule.configuration || {}),
          },
          findings: Array.isArray(storedModule.findings) ? storedModule.findings : baseModule.findings,
          scanHistory: Array.isArray(storedModule.scanHistory) ? storedModule.scanHistory : baseModule.scanHistory,
        }
      : baseModule;

    return acc;
  }, {} as Record<SecurityModuleId, ProtectionModuleState>);

  return {
    ...base,
    ...stored,
    modules,
    alerts: Array.isArray(stored.alerts) ? stored.alerts : base.alerts,
    childProfiles: Array.isArray(stored.childProfiles) ? stored.childProfiles : base.childProfiles,
    guardianRules: Array.isArray(stored.guardianRules) ? stored.guardianRules : base.guardianRules,
    safetyReports: Array.isArray(stored.safetyReports) ? stored.safetyReports : base.safetyReports,
    websites: Array.isArray(stored.websites) ? stored.websites : base.websites,
    schedules: Array.isArray(stored.schedules) ? stored.schedules : base.schedules,
    dashboard: stored.dashboard || base.dashboard,
  };
}

if (Platform.OS !== 'web' && !TaskManager.isTaskDefined(BACKGROUND_TASK_IDENTIFIER)) {
  TaskManager.defineTask(BACKGROUND_TASK_IDENTIFIER, () => Promise.resolve(BackgroundTask.BackgroundTaskResult.Success));
}

async function ensureBackgroundTask() {
  if (Platform.OS === 'web') return false;

  try {
    await BackgroundTask.registerTaskAsync(BACKGROUND_TASK_IDENTIFIER, { minimumInterval: 15 });
    return true;
  } catch {
    return false;
  }
}

async function scheduleLocalNotification(schedule: Omit<ProtectionSchedule, 'id' | 'createdAt' | 'notificationId'>) {
  if (Platform.OS === 'web' || !schedule.notify) return undefined;

  try {
    const Notifications = await import('expo-notifications');
    const permission = await Notifications.requestPermissionsAsync();
    if (!permission.granted) return undefined;

    const triggerDate = new Date(schedule.startAt);
    if (Number.isNaN(triggerDate.getTime()) || triggerDate.getTime() <= Date.now()) {
      triggerDate.setMinutes(triggerDate.getMinutes() + 1);
    }

    return Notifications.scheduleNotificationAsync({
      content: {
        title: 'Deltex AI protection task',
        body: `${schedule.task} is ready to run.`,
        data: { moduleId: schedule.moduleId, scheduleId: schedule.task },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
  } catch {
    return undefined;
  }
}

const ProtectionContext = createContext<ProtectionContextValue | null>(null);

export function ProtectionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProtectionState>(() => defaultState());
  const stateRef = useRef<ProtectionState>(state);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      try {
        const stored = await getStoredState();
        const nextState = stored ? mergeStoredState(JSON.parse(stored) as ProtectionState) : defaultState();

        if (mounted) {
          stateRef.current = nextState;
          setState(nextState);
        }
      } catch {
        const fallback = defaultState();
        if (mounted) {
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

  const persist = useCallback(async (updater: (current: ProtectionState) => ProtectionState) => {
    const next = updater(stateRef.current);
    stateRef.current = next;
    setState(next);
    await setStoredState(next);
    return next;
  }, []);

  const updateModuleConfig = useCallback(
    async (moduleId: SecurityModuleId, patch: Partial<ModuleConfiguration>) => {
      await persist((current) => {
        const moduleState = current.modules[moduleId] || createModuleState(moduleId);
        const configuration = { ...moduleState.configuration, ...patch };

        return {
          ...current,
          modules: {
            ...current.modules,
            [moduleId]: {
              ...moduleState,
              enabled: configuration.enabled,
              status: configuration.enabled ? moduleState.status : 'Monitoring',
              configuration,
            },
          },
        };
      });
    },
    [persist],
  );

  const runModuleScan = useCallback(
    async (moduleId: SecurityModuleId, label = 'Manual protection scan') => {
      const module = MODULES.find((item) => item.id === moduleId);
      const seed = DEFAULT_MODULE_CONFIGURATION[moduleId];
      const generatedFinding = seed.findings[0]
        ? createFinding(moduleId, seed.findings[(Date.now() + seed.findings.length) % seed.findings.length])
        : moduleId === 'biometrics'
          ? createFinding(moduleId, {
              title: 'Authentication posture validated',
              detail: 'Biometric unlock, MFA, passkeys, and recovery controls were checked.',
              severity: 'low',
              recommendation: 'Keep MFA enabled for subscription and billing changes.',
            })
          : createFinding(moduleId, {
              title: 'No critical exposure found',
              detail: `${module?.shortTitle || 'Protection'} scan completed with no critical issue.`,
              severity: 'low',
              recommendation: 'Keep monitoring and scheduled scans enabled.',
            });
      const findings = generatedFinding.severity === 'low' ? [] : [generatedFinding];
      const score = scoreFromFindings(module?.score || 86, findings);
      const run: ScanRun = {
        id: createId('scan'),
        moduleId,
        label,
        status: 'completed',
        startedAt: nowIso(),
        completedAt: nowIso(),
        score,
        findings,
      };

      await persist((current) => {
        const moduleState = current.modules[moduleId] || createModuleState(moduleId);
        const nextFindings = [...findings, ...moduleState.findings].slice(0, 12);
        const newAlerts = findings.map((finding) => ({
          id: createId('alert'),
          moduleId,
          title: finding.title,
          detail: finding.detail,
          severity: finding.severity,
          createdAt: finding.createdAt,
          acknowledged: false,
        }));

        return {
          ...current,
          modules: {
            ...current.modules,
            [moduleId]: {
              ...moduleState,
              score,
              status: statusFromFindings(nextFindings),
              lastScanAt: nowIso(),
              findings: nextFindings,
              scanHistory: [run, ...moduleState.scanHistory].slice(0, 20),
            },
          },
          alerts: [...newAlerts, ...current.alerts].slice(0, 50),
        };
      });

      return run;
    },
    [persist],
  );

  const saveSchedule = useCallback(
    async (schedule: Omit<ProtectionSchedule, 'id' | 'createdAt' | 'notificationId'>) => {
      const notificationId = await scheduleLocalNotification(schedule);
      const backgroundTaskEnabled = await ensureBackgroundTask();
      const created: ProtectionSchedule = {
        ...schedule,
        id: createId('schedule'),
        notificationId,
        createdAt: nowIso(),
      };

      await persist((current) => ({
        ...current,
        schedules: [created, ...current.schedules].slice(0, 30),
        backgroundTaskEnabled: current.backgroundTaskEnabled || backgroundTaskEnabled,
      }));

      return created;
    },
    [persist],
  );

  const registerWebsite = useCallback(
    async (url: string, type?: RegisteredWebsite['type']) => {
      const normalized = normalizeUrl(url);
      if (!normalized) return null;

      const created = createWebsite({
        url: normalized,
        type: type || inferWebsiteType(normalized),
        score: 76,
        status: 'Monitoring',
        issue: 'New baseline queued for SSL/TLS, DNS, security headers, malware indicators, reputation, and content drift.',
      });
      const initialFinding = createFinding('website-protection', {
        title: 'Initial website baseline',
        detail: 'Security headers, TLS, DNS, malware reputation, and content drift checks were initialized for the registered site.',
        severity: 'medium',
        recommendation: 'Run a follow-up assessment after adding CSP, HSTS, DNSSEC, and renewal alerts.',
      });
      const initialAssessment: WebsiteAssessment = {
        id: createId('assessment'),
        websiteId: created.id,
        createdAt: nowIso(),
        score: created.score,
        status: created.status,
        findings: [initialFinding],
        summary: 'Initial website baseline completed with setup recommendations.',
      };
      const websiteWithBaseline: RegisteredWebsite = {
        ...created,
        issue: initialAssessment.summary,
        lastAssessmentAt: initialAssessment.createdAt,
        assessments: [initialAssessment],
      };

      await persist((current) => ({
        ...current,
        websites: [websiteWithBaseline, ...current.websites.filter((site) => site.url !== normalized)].slice(0, 40),
        modules: {
          ...current.modules,
          'website-protection': {
            ...(current.modules['website-protection'] || createModuleState('website-protection')),
            findings: [initialFinding, ...(current.modules['website-protection']?.findings || [])].slice(0, 12),
            lastScanAt: initialAssessment.createdAt,
            score: created.score,
            status: created.status,
          },
        },
        alerts: [
          {
            id: createId('alert'),
            moduleId: 'website-protection' as SecurityModuleId,
            title: initialFinding.title,
            detail: `${created.url}: ${initialFinding.detail}`,
            severity: initialFinding.severity,
            createdAt: initialFinding.createdAt,
            acknowledged: false,
          },
          ...current.alerts,
        ].slice(0, 50),
      }));

      return websiteWithBaseline;
    },
    [persist],
  );

  const runWebsiteAssessment = useCallback(
    async (websiteId: string) => {
      let created: WebsiteAssessment | null = null;

      await persist((current) => {
        const website = current.websites.find((site) => site.id === websiteId);
        if (!website) return current;

        const siteScore = Math.max(52, Math.min(98, website.score + (website.url.length % 7) - 3));
        const findingSeeds = [
          {
            title: 'Security header gap',
            detail: 'Content-Security-Policy or Permissions-Policy is missing from the baseline.',
            severity: 'medium' as ProtectionRiskLevel,
            recommendation: 'Add CSP, HSTS, X-Frame-Options, Referrer-Policy, and Permissions-Policy.',
          },
          {
            title: 'TLS renewal watch',
            detail: 'Certificate expiry is inside the monitoring horizon.',
            severity: 'medium' as ProtectionRiskLevel,
            recommendation: 'Renew TLS early and enable renewal failure alerts.',
          },
          {
            title: 'Baseline stable',
            detail: 'No malware indicators, redirect drift, or reputation issues were found.',
            severity: 'low' as ProtectionRiskLevel,
            recommendation: 'Keep continuous drift monitoring enabled.',
          },
        ];
        const findings = siteScore < 88 ? [createFinding('website-protection', findingSeeds[website.url.length % 2])] : [];
        const status = statusFromFindings(findings);

        created = {
          id: createId('assessment'),
          websiteId,
          createdAt: nowIso(),
          score: siteScore,
          status,
          findings,
          summary: findings.length
            ? 'Website assessment found actionable posture improvements.'
            : 'Website assessment completed with a stable baseline.',
        };
        const assessmentScan: ScanRun = {
          id: createId('scan'),
          moduleId: 'website-protection' as SecurityModuleId,
          label: `${website.url} website assessment`,
          status: 'completed',
          startedAt: created.createdAt,
          completedAt: created.createdAt,
          score: siteScore,
          findings,
        };

        return {
          ...current,
          websites: current.websites.map((site) =>
            site.id === websiteId
              ? {
                  ...site,
                  score: siteScore,
                  status,
                  issue: created?.summary || site.issue,
                  lastAssessmentAt: created?.createdAt || nowIso(),
                  assessments: created ? [created, ...site.assessments].slice(0, 12) : site.assessments,
                }
              : site,
          ),
          modules: {
            ...current.modules,
            'website-protection': {
              ...(current.modules['website-protection'] || createModuleState('website-protection')),
              score: siteScore,
              status,
              lastScanAt: created.createdAt,
              findings: [...findings, ...(current.modules['website-protection']?.findings || [])].slice(0, 12),
              scanHistory: [assessmentScan, ...(current.modules['website-protection']?.scanHistory || [])].slice(0, 20),
            },
          },
          alerts: findings.length
            ? [
                {
                  id: createId('alert'),
                  moduleId: 'website-protection' as SecurityModuleId,
                  title: findings[0].title,
                  detail: `${website.url}: ${findings[0].detail}`,
                  severity: findings[0].severity,
                  createdAt: findings[0].createdAt,
                  acknowledged: false,
                },
                ...current.alerts,
              ].slice(0, 50)
            : current.alerts,
        };
      });

      return created;
    },
    [persist],
  );

  const saveChildProfile = useCallback(
    async (profile: Partial<ChildProfile> & Pick<ChildProfile, 'name' | 'ageBand'>) => {
      const created: ChildProfile = {
        id: profile.id || createId('child'),
        name: profile.name,
        ageBand: profile.ageBand,
        devices: profile.devices || ['Phone'],
        riskLevel: profile.riskLevel || 'medium',
        lastReviewAt: profile.lastReviewAt || null,
      };

      await persist((current) => ({
        ...current,
        childProfiles: [created, ...current.childProfiles.filter((child) => child.id !== created.id)].slice(0, 12),
      }));

      return created;
    },
    [persist],
  );

  const updateFamilyRule = useCallback(
    async (id: string, patch: Partial<GuardianRule>) => {
      await persist((current) => ({
        ...current,
        guardianRules: current.guardianRules.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)),
      }));
    },
    [persist],
  );

  const generateSafetyReport = useCallback(
    async (childId?: string) => {
      const current = stateRef.current;
      const child = current.childProfiles.find((profile) => profile.id === childId) || current.childProfiles[0] || {
        id: 'child-default',
        name: 'Family profile',
        ageBand: 'All ages',
        riskLevel: 'medium' as ProtectionRiskLevel,
      };
      const scenario = CHILD_SAFETY_SCENARIOS[Math.abs(child.name.length + current.safetyReports.length) % CHILD_SAFETY_SCENARIOS.length];
      const report: SafetyReport = {
        id: createId('report'),
        childId: child.id,
        title: `${child.name} safety report`,
        summary: `${scenario.signal} Recommended action: ${scenario.action}`,
        riskLevel: scenario.risk,
        signals: ['Suspicious contact behavior', 'Payment or secrecy pressure', 'Monitoring-window policy', 'Link reputation'],
        recommendations: [
          scenario.action,
          'Review the alert with calm, age-appropriate language.',
          'Keep guardian permissions explicit and update rules after the discussion.',
        ],
        createdAt: nowIso(),
      };

      await persist((state) => ({
        ...state,
        safetyReports: [report, ...state.safetyReports].slice(0, 20),
        childProfiles: state.childProfiles.map((profile) =>
          profile.id === child.id ? { ...profile, riskLevel: report.riskLevel, lastReviewAt: report.createdAt } : profile,
        ),
        alerts: [
          {
            id: createId('alert'),
            moduleId: 'family-safety' as SecurityModuleId,
            title: report.title,
            detail: report.summary,
            severity: report.riskLevel,
            createdAt: report.createdAt,
            acknowledged: false,
          },
          ...state.alerts,
        ].slice(0, 50),
      }));

      return report;
    },
    [persist],
  );

  const acknowledgeAlert = useCallback(
    async (id: string) => {
      await persist((current) => ({
        ...current,
        alerts: current.alerts.map((alert) => (alert.id === id ? { ...alert, acknowledged: true } : alert)),
      }));
    },
    [persist],
  );

  const refreshDashboardData = useCallback(
    async (range: TrendRange = stateRef.current.dashboard.range) => {
      await persist((current) => ({
        ...current,
        dashboard: {
          range,
          refreshes: current.dashboard.refreshes + 1,
          lastRefreshAt: nowIso(),
          trendData: DASHBOARD_TREND_SEEDS[range].map((point, index) => ({
            ...point,
            threats: point.threats + ((current.dashboard.refreshes + index) % 3),
            blocked: Math.min(point.threats + ((current.dashboard.refreshes + index) % 3), point.blocked + ((current.dashboard.refreshes + index) % 2)),
            scans: point.scans + current.dashboard.refreshes + index,
            risk: Math.max(18, point.risk - Math.min(8, current.dashboard.refreshes)),
            events: point.events + ((current.dashboard.refreshes + index) % 4),
          })),
        },
      }));
    },
    [persist],
  );

  const value = useMemo<ProtectionContextValue>(
    () => ({
      ...state,
      updateModuleConfig,
      runModuleScan,
      saveSchedule,
      registerWebsite,
      runWebsiteAssessment,
      saveChildProfile,
      updateFamilyRule,
      generateSafetyReport,
      acknowledgeAlert,
      refreshDashboardData,
    }),
    [
      acknowledgeAlert,
      generateSafetyReport,
      refreshDashboardData,
      registerWebsite,
      runModuleScan,
      runWebsiteAssessment,
      saveChildProfile,
      saveSchedule,
      state,
      updateFamilyRule,
      updateModuleConfig,
    ],
  );

  return <ProtectionContext.Provider value={value}>{children}</ProtectionContext.Provider>;
}

export function useProtection() {
  const context = useContext(ProtectionContext);

  if (!context) {
    throw new Error('useProtection must be used within ProtectionProvider');
  }

  return context;
}
