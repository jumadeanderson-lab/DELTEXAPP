import { SecurityModuleId } from '@/constants/security-platform';

export type ProtectionRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ProtectionSeedFinding {
  title: string;
  detail: string;
  severity: ProtectionRiskLevel;
  recommendation: string;
}

export interface ProtectionModuleSeed {
  enabled: boolean;
  realtime: boolean;
  autoScan: boolean;
  monitoringWindow: string;
  scanFrequency: 'manual' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  riskThreshold: ProtectionRiskLevel;
  recommendations: string[];
  findings: ProtectionSeedFinding[];
}

export interface ChildSafetyScenario {
  childName: string;
  ageBand: string;
  signal: string;
  risk: ProtectionRiskLevel;
  action: string;
}

export interface WebsiteBaselineSeed {
  url: string;
  type: 'Website' | 'Portfolio' | 'Blog' | 'E-commerce' | 'Business Platform';
  score: number;
  status: 'Protected' | 'Monitoring' | 'Warning';
  issue: string;
}

export const DEFAULT_MODULE_CONFIGURATION: Record<SecurityModuleId, ProtectionModuleSeed> = {
  malware: {
    enabled: true,
    realtime: true,
    autoScan: true,
    monitoringWindow: 'Always on',
    scanFrequency: 'daily',
    riskThreshold: 'medium',
    recommendations: ['Keep automatic app and file scanning enabled.', 'Review quarantined files before restoring them.'],
    findings: [
      {
        title: 'Quarantine review needed',
        detail: 'Two downloaded files are isolated and waiting for user review.',
        severity: 'medium',
        recommendation: 'Delete files you do not recognize and rescan downloads after cleanup.',
      },
    ],
  },
  ransomware: {
    enabled: true,
    realtime: true,
    autoScan: true,
    monitoringWindow: 'Always on',
    scanFrequency: 'weekly',
    riskThreshold: 'high',
    recommendations: ['Enable protected backups for important documents.', 'Keep auto-isolation ready for suspicious encryption bursts.'],
    findings: [],
  },
  phishing: {
    enabled: true,
    realtime: true,
    autoScan: true,
    monitoringWindow: '08:00-23:00',
    scanFrequency: 'daily',
    riskThreshold: 'medium',
    recommendations: ['Submit payment or login links before opening them.', 'Use passkeys for financial and admin portals.'],
    findings: [
      {
        title: 'Lookalike checkout blocked',
        detail: 'A payment page used a suspicious redirect chain and mismatched brand spelling.',
        severity: 'high',
        recommendation: 'Use the merchant app or type the known domain directly.',
      },
    ],
  },
  browser: {
    enabled: true,
    realtime: true,
    autoScan: true,
    monitoringWindow: 'Always on',
    scanFrequency: 'daily',
    riskThreshold: 'medium',
    recommendations: ['Keep malicious link blocking enabled.', 'Use VPN prompts on public Wi-Fi.'],
    findings: [],
  },
  email: {
    enabled: true,
    realtime: true,
    autoScan: true,
    monitoringWindow: 'Business hours',
    scanFrequency: 'daily',
    riskThreshold: 'medium',
    recommendations: ['Quarantine macro attachments by default.', 'Verify new bank details outside email.'],
    findings: [],
  },
  'dark-web': {
    enabled: true,
    realtime: false,
    autoScan: true,
    monitoringWindow: 'Every night',
    scanFrequency: 'daily',
    riskThreshold: 'high',
    recommendations: ['Rotate passwords for accounts that appear in breach results.', 'Enable MFA anywhere a leak appears.'],
    findings: [
      {
        title: 'Older email exposure',
        detail: 'An email alias appeared in a newly indexed combo list.',
        severity: 'medium',
        recommendation: 'Change reused passwords and enable MFA on the affected services.',
      },
    ],
  },
  identity: {
    enabled: true,
    realtime: true,
    autoScan: true,
    monitoringWindow: 'Always on',
    scanFrequency: 'daily',
    riskThreshold: 'medium',
    recommendations: ['Add recovery email and trusted phone numbers.', 'Review account recovery attempts weekly.'],
    findings: [],
  },
  biometrics: {
    enabled: true,
    realtime: true,
    autoScan: true,
    monitoringWindow: 'Always on',
    scanFrequency: 'weekly',
    riskThreshold: 'medium',
    recommendations: [
      'Keep biometric unlock paired with a strong device passcode.',
      'Enable MFA for subscription, billing, and protection changes.',
      'Remove old trusted devices and rotate recovery codes after device loss.',
    ],
    findings: [
      {
        title: 'Trusted-device review',
        detail: 'One trusted device has not checked in for 32 days.',
        severity: 'medium',
        recommendation: 'Remove stale trusted devices and require MFA on next sign-in.',
      },
    ],
  },
  social: {
    enabled: true,
    realtime: true,
    autoScan: true,
    monitoringWindow: '16:00-23:00',
    scanFrequency: 'daily',
    riskThreshold: 'medium',
    recommendations: ['Verify identity through live proof before payments.', 'Treat location clues only as supporting context.'],
    findings: [
      {
        title: 'Suspicious profile drift',
        detail: 'A linked public profile changed name, avatar, and bio in a short window.',
        severity: 'medium',
        recommendation: 'Review recent sessions and verify the account owner independently.',
      },
    ],
  },
  'family-safety': {
    enabled: true,
    realtime: true,
    autoScan: true,
    monitoringWindow: '15:00-22:00',
    scanFrequency: 'daily',
    riskThreshold: 'medium',
    recommendations: ['Discuss alerts supportively with the child.', 'Block secrecy, payment, gift card, and off-platform requests from unknown contacts.'],
    findings: [
      {
        title: 'Unknown contact pressure',
        detail: 'A new contact requested secrecy and moved the conversation to another platform.',
        severity: 'high',
        recommendation: 'Review the conversation with the child and block the contact if identity cannot be verified.',
      },
    ],
  },
  'website-protection': {
    enabled: true,
    realtime: true,
    autoScan: true,
    monitoringWindow: 'Every 6 hours',
    scanFrequency: 'daily',
    riskThreshold: 'medium',
    recommendations: ['Add a strict Content-Security-Policy header.', 'Monitor TLS expiry and domain reputation drift.'],
    findings: [
      {
        title: 'Weak security headers',
        detail: 'One registered site is missing a strict Content-Security-Policy baseline.',
        severity: 'medium',
        recommendation: 'Add CSP, X-Frame-Options, Referrer-Policy, and Permissions-Policy headers.',
      },
    ],
  },
  'personal-firewall': {
    enabled: true,
    realtime: true,
    autoScan: true,
    monitoringWindow: 'Always on',
    scanFrequency: 'daily',
    riskThreshold: 'medium',
    recommendations: ['Keep high-risk domain blocking enabled.', 'Review allowed domains monthly.'],
    findings: [],
  },
  scam: {
    enabled: true,
    realtime: true,
    autoScan: true,
    monitoringWindow: 'Always on',
    scanFrequency: 'daily',
    riskThreshold: 'medium',
    recommendations: ['Pause when messages include secrecy, urgency, or payment pressure.', 'Verify unusual requests through a trusted channel.'],
    findings: [],
  },
  fraud: {
    enabled: true,
    realtime: false,
    autoScan: true,
    monitoringWindow: 'Business hours',
    scanFrequency: 'weekly',
    riskThreshold: 'high',
    recommendations: ['Require second approval for payment changes.', 'Check invoice and vendor identity outside email.'],
    findings: [],
  },
  'account-takeover': {
    enabled: true,
    realtime: true,
    autoScan: true,
    monitoringWindow: 'Always on',
    scanFrequency: 'daily',
    riskThreshold: 'high',
    recommendations: ['Enable passkeys on primary accounts.', 'Review impossible-travel and recovery events.'],
    findings: [],
  },
  'credential-leaks': {
    enabled: true,
    realtime: false,
    autoScan: true,
    monitoringWindow: 'Nightly',
    scanFrequency: 'daily',
    riskThreshold: 'high',
    recommendations: ['Use unique passwords for every critical account.', 'Move API keys into a secrets manager.'],
    findings: [],
  },
  network: {
    enabled: true,
    realtime: true,
    autoScan: true,
    monitoringWindow: 'Always on',
    scanFrequency: 'daily',
    riskThreshold: 'medium',
    recommendations: ['Use trusted DNS and avoid unknown Wi-Fi.', 'Segment smart-home devices from personal devices.'],
    findings: [],
  },
  wifi: {
    enabled: true,
    realtime: true,
    autoScan: true,
    monitoringWindow: 'Always on',
    scanFrequency: 'daily',
    riskThreshold: 'medium',
    recommendations: ['Prefer WPA3 networks.', 'Avoid entering credentials on captive portals you do not trust.'],
    findings: [],
  },
  vpn: {
    enabled: false,
    realtime: false,
    autoScan: false,
    monitoringWindow: 'Public Wi-Fi only',
    scanFrequency: 'manual',
    riskThreshold: 'medium',
    recommendations: ['Prompt for VPN on public Wi-Fi.', 'Use trusted VPN providers for sensitive browsing.'],
    findings: [],
  },
  vulnerability: {
    enabled: true,
    realtime: false,
    autoScan: true,
    monitoringWindow: 'Weekly',
    scanFrequency: 'weekly',
    riskThreshold: 'high',
    recommendations: ['Patch exposed software first.', 'Run a follow-up scan after remediation.'],
    findings: [
      {
        title: 'Outdated package fingerprint',
        detail: 'A website plugin fingerprint maps to an older vulnerable release.',
        severity: 'high',
        recommendation: 'Update the plugin and remove unused extensions.',
      },
    ],
  },
  device: {
    enabled: true,
    realtime: true,
    autoScan: true,
    monitoringWindow: 'Always on',
    scanFrequency: 'daily',
    riskThreshold: 'medium',
    recommendations: ['Keep OS auto-updates enabled.', 'Use a strong lock screen and device encryption.'],
    findings: [],
  },
  'camera-mic': {
    enabled: false,
    realtime: false,
    autoScan: false,
    monitoringWindow: 'Manual review',
    scanFrequency: 'manual',
    riskThreshold: 'medium',
    recommendations: ['Review camera and microphone access monthly.', 'Remove permissions from apps that do not need them.'],
    findings: [],
  },
  privacy: {
    enabled: true,
    realtime: true,
    autoScan: true,
    monitoringWindow: 'Weekly',
    scanFrequency: 'weekly',
    riskThreshold: 'medium',
    recommendations: ['Start opt-out for exposed broker listings.', 'Use approximate location unless precise location is necessary.'],
    findings: [
      {
        title: 'Broker opt-out ready',
        detail: 'Three data broker listings are ready for opt-out review.',
        severity: 'medium',
        recommendation: 'Submit opt-out requests and recheck in seven days.',
      },
    ],
  },
  file: {
    enabled: true,
    realtime: true,
    autoScan: true,
    monitoringWindow: 'Always on',
    scanFrequency: 'weekly',
    riskThreshold: 'medium',
    recommendations: ['Move tax and identity documents into a vault.', 'Avoid sharing sensitive screenshots in public chats.'],
    findings: [],
  },
  'zero-day': {
    enabled: true,
    realtime: true,
    autoScan: true,
    monitoringWindow: 'Always on',
    scanFrequency: 'daily',
    riskThreshold: 'high',
    recommendations: ['Review anomaly timelines.', 'Keep auto-containment enabled for critical assets.'],
    findings: [],
  },
  'ai-attacks': {
    enabled: true,
    realtime: true,
    autoScan: true,
    monitoringWindow: 'Always on',
    scanFrequency: 'daily',
    riskThreshold: 'medium',
    recommendations: ['Never paste secret keys into untrusted AI tools.', 'Verify unusual personalized requests.'],
    findings: [],
  },
  deepfake: {
    enabled: true,
    realtime: false,
    autoScan: true,
    monitoringWindow: 'Manual submissions',
    scanFrequency: 'manual',
    riskThreshold: 'medium',
    recommendations: ['Use a live verification call for high-risk requests.', 'Do not rely on one image as proof of identity.'],
    findings: [],
  },
  'threat-intel': {
    enabled: true,
    realtime: true,
    autoScan: true,
    monitoringWindow: 'Always on',
    scanFrequency: 'daily',
    riskThreshold: 'medium',
    recommendations: ['Review threat reports weekly.', 'Enable business-wide alerts for executive impersonation campaigns.'],
    findings: [],
  },
  'ddos-monitoring': {
    enabled: true,
    realtime: true,
    autoScan: true,
    monitoringWindow: 'Always on',
    scanFrequency: 'hourly',
    riskThreshold: 'high',
    recommendations: ['Run quarterly DDoS tabletop exercises.', 'Keep emergency rate-limit rules reviewed.'],
    findings: [],
  },
  'sql-injection': {
    enabled: true,
    realtime: true,
    autoScan: true,
    monitoringWindow: 'Always on',
    scanFrequency: 'daily',
    riskThreshold: 'high',
    recommendations: ['Keep parameterized queries mandatory.', 'Add regression tests for risky search and filter endpoints.'],
    findings: [],
  },
  'api-security': {
    enabled: true,
    realtime: true,
    autoScan: true,
    monitoringWindow: 'Always on',
    scanFrequency: 'daily',
    riskThreshold: 'high',
    recommendations: ['Rotate API keys on schedule.', 'Require least-privilege scopes for service tokens.'],
    findings: [],
  },
  siem: {
    enabled: true,
    realtime: true,
    autoScan: true,
    monitoringWindow: 'Always on',
    scanFrequency: 'daily',
    riskThreshold: 'medium',
    recommendations: ['Test SIEM delivery weekly.', 'Map critical alerts to incident queues.'],
    findings: [],
  },
  compliance: {
    enabled: true,
    realtime: false,
    autoScan: true,
    monitoringWindow: 'Monthly',
    scanFrequency: 'monthly',
    riskThreshold: 'medium',
    recommendations: ['Close evidence gaps.', 'Schedule monthly access review reminders.'],
    findings: [],
  },
  'executive-reporting': {
    enabled: true,
    realtime: false,
    autoScan: true,
    monitoringWindow: 'Monthly',
    scanFrequency: 'monthly',
    riskThreshold: 'medium',
    recommendations: ['Review executive reports monthly.', 'Link high-risk findings to remediation owners.'],
    findings: [],
  },
};

export const CHILD_SAFETY_SCENARIOS: ChildSafetyScenario[] = [
  {
    childName: 'Maya',
    ageBand: '10-12',
    signal: 'Unknown profile requested secrecy and gift cards after a game chat.',
    risk: 'high',
    action: 'Guardian review, block contact, discuss safety script.',
  },
  {
    childName: 'Noah',
    ageBand: '13-15',
    signal: 'Giveaway link asks for login and parent payment card.',
    risk: 'medium',
    action: 'Block link and enable stricter payment-request alerts.',
  },
  {
    childName: 'Ari',
    ageBand: '8-10',
    signal: 'Late-night messaging outside configured monitoring window.',
    risk: 'medium',
    action: 'Move social monitoring window earlier and notify guardian.',
  },
];

export const WEBSITE_BASELINE_SEEDS: WebsiteBaselineSeed[] = [
  {
    url: 'store.deltex.ai',
    type: 'E-commerce',
    score: 84,
    status: 'Monitoring',
    issue: 'Add stricter Content-Security-Policy and renew TLS in 21 days.',
  },
  {
    url: 'portfolio.example',
    type: 'Portfolio',
    score: 91,
    status: 'Protected',
    issue: 'Baseline stable. No malicious redirects detected.',
  },
  {
    url: 'blog.example',
    type: 'Blog',
    score: 78,
    status: 'Warning',
    issue: 'Outdated plugin fingerprint and weak security headers found.',
  },
];

export const DASHBOARD_TREND_SEEDS = {
  '24H': [
    { label: '00', threats: 2, blocked: 2, scans: 4, risk: 31, events: 6 },
    { label: '04', threats: 5, blocked: 5, scans: 6, risk: 34, events: 8 },
    { label: '08', threats: 18, blocked: 17, scans: 12, risk: 43, events: 22 },
    { label: '12', threats: 34, blocked: 33, scans: 18, risk: 52, events: 39 },
    { label: '16', threats: 28, blocked: 28, scans: 23, risk: 45, events: 31 },
    { label: '20', threats: 12, blocked: 12, scans: 28, risk: 37, events: 16 },
    { label: 'Now', threats: 7, blocked: 7, scans: 31, risk: 29, events: 10 },
  ],
  '7D': [
    { label: 'Mon', threats: 14, blocked: 13, scans: 19, risk: 42, events: 23 },
    { label: 'Tue', threats: 22, blocked: 21, scans: 24, risk: 46, events: 30 },
    { label: 'Wed', threats: 18, blocked: 17, scans: 29, risk: 39, events: 26 },
    { label: 'Thu', threats: 31, blocked: 30, scans: 32, risk: 49, events: 36 },
    { label: 'Fri', threats: 27, blocked: 27, scans: 36, risk: 41, events: 31 },
    { label: 'Sat', threats: 15, blocked: 15, scans: 41, risk: 35, events: 20 },
    { label: 'Sun', threats: 9, blocked: 9, scans: 44, risk: 28, events: 13 },
  ],
  '30D': [
    { label: 'W1', threats: 48, blocked: 46, scans: 87, risk: 44, events: 64 },
    { label: 'W2', threats: 55, blocked: 53, scans: 103, risk: 41, events: 71 },
    { label: 'W3', threats: 39, blocked: 39, scans: 118, risk: 34, events: 52 },
    { label: 'W4', threats: 31, blocked: 30, scans: 139, risk: 29, events: 44 },
  ],
};
