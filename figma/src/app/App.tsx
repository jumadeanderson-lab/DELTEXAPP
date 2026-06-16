import { useState } from "react";
import {
  Shield, ShieldCheck, ShieldAlert, ShieldX,
  Wifi, WifiOff, Eye, EyeOff, Lock, Unlock,
  AlertTriangle, CheckCircle, XCircle, Info,
  Bell, BellOff, Settings, User, CreditCard,
  Smartphone, Globe, Mail, Key, Fingerprint,
  Brain, Zap, Activity, BarChart3, TrendingUp, TrendingDown,
  Bug, Skull, Fish, Database, Server, Network,
  Search, Filter, ChevronRight, ChevronDown, ChevronUp,
  Star, Crown, Building2, Users, ArrowRight, ArrowUp,
  Download, Upload, RefreshCw, MoreVertical, X, Plus,
  Home, Menu, LogOut, HelpCircle, FileText, Award,
  Cpu, Radio, Layers, Target, Crosshair, Swords,
  Clock, Calendar, DollarSign, Check, Minus,
  MessageSquare, Phone, Headphones, MapPin,
  Twitter, Linkedin, Github, Chrome, Apple,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, BarChart, Bar } from "recharts";

// ─── types ────────────────────────────────────────────────
type Screen =
  | "splash" | "onboarding" | "auth" | "security-setup"
  | "dashboard" | "threats" | "malware" | "phishing" | "ransomware"
  | "ddos" | "sqli" | "dark-web" | "identity" | "browser"
  | "network" | "social" | "vulnerability" | "ai-assistant"
  | "notifications" | "profile" | "settings" | "billing"
  | "pricing" | "plan-detail";

type Plan = "free" | "personal" | "family" | "professional" | "business" | "enterprise";

// ─── data ────────────────────────────────────────────────
const threatData = [
  { time: "00:00", threats: 2, blocked: 2 },
  { time: "04:00", threats: 5, blocked: 5 },
  { time: "08:00", threats: 18, blocked: 17 },
  { time: "12:00", threats: 34, blocked: 33 },
  { time: "16:00", threats: 28, blocked: 28 },
  { time: "20:00", threats: 12, blocked: 12 },
  { time: "Now", threats: 7, blocked: 7 },
];

const scoreData = [
  { day: "Mon", score: 72 }, { day: "Tue", score: 76 },
  { day: "Wed", score: 71 }, { day: "Thu", score: 84 },
  { day: "Fri", score: 88 }, { day: "Sat", score: 91 },
  { day: "Sun", score: 94 },
];

const threatBreakdown = [
  { name: "Malware", value: 34, color: "#ff3b5c" },
  { name: "Phishing", value: 28, color: "#f59e0b" },
  { name: "Network", value: 19, color: "#00d4ff" },
  { name: "Dark Web", value: 12, color: "#7c3aed" },
  { name: "Other", value: 7, color: "#0ff4c6" },
];

const recentThreats = [
  { id: 1, type: "Phishing", source: "email: suspicious@hack.ru", severity: "critical", time: "2m ago", blocked: true },
  { id: 2, type: "Malware", source: "app: free-vpn-pro.apk", severity: "high", time: "15m ago", blocked: true },
  { id: 3, type: "SQL Injection", source: "web: banking-app.com/login", severity: "high", time: "1h ago", blocked: true },
  { id: 4, type: "Dark Web", source: "email found: j***@gmail.com", severity: "medium", time: "3h ago", blocked: false },
  { id: 5, type: "Network Scan", source: "IP: 185.220.101.47", severity: "low", time: "6h ago", blocked: true },
];

const plans = [
  {
    id: "free" as Plan,
    name: "Free",
    tagline: "Essential protection",
    price: { monthly: 0, annual: 0 },
    color: "#6b7280",
    glow: "rgba(107,114,128,0.3)",
    icon: Shield,
    devices: 1,
    features: {
      "Basic Malware Scanning": true,
      "Security Score": true,
      "Device Protection (1 device)": true,
      "Limited Vulnerability Checks": "partial",
      "AI Assistant (5/day)": "partial",
      "Real-time Alerts": false,
      "Phishing Protection": false,
      "Ransomware Defense": false,
      "Dark Web Monitoring": false,
      "Browser Security": false,
      "VPN Protection": false,
      "Identity Protection": false,
    },
  },
  {
    id: "personal" as Plan,
    name: "Personal",
    tagline: "Full personal shield",
    price: { monthly: 9.99, annual: 7.99 },
    color: "#00d4ff",
    glow: "rgba(0,212,255,0.3)",
    icon: ShieldCheck,
    devices: 5,
    popular: true,
    features: {
      "Basic Malware Scanning": true,
      "Security Score": true,
      "Device Protection (1 device)": true,
      "Limited Vulnerability Checks": true,
      "AI Assistant (5/day)": true,
      "Real-time Alerts": true,
      "Phishing Protection": true,
      "Ransomware Defense": true,
      "Dark Web Monitoring": true,
      "Browser Security": true,
      "VPN Protection": true,
      "Identity Protection": "partial",
    },
  },
  {
    id: "family" as Plan,
    name: "Family",
    tagline: "Protect everyone you love",
    price: { monthly: 19.99, annual: 15.99 },
    color: "#0ff4c6",
    glow: "rgba(15,244,198,0.3)",
    icon: Users,
    devices: 15,
    features: {
      "Basic Malware Scanning": true,
      "Security Score": true,
      "Device Protection (1 device)": true,
      "Limited Vulnerability Checks": true,
      "AI Assistant (5/day)": true,
      "Real-time Alerts": true,
      "Phishing Protection": true,
      "Ransomware Defense": true,
      "Dark Web Monitoring": true,
      "Browser Security": true,
      "VPN Protection": true,
      "Identity Protection": true,
    },
  },
  {
    id: "professional" as Plan,
    name: "Professional",
    tagline: "Power user grade",
    price: { monthly: 34.99, annual: 27.99 },
    color: "#7c3aed",
    glow: "rgba(124,58,237,0.3)",
    icon: Award,
    devices: 25,
    features: {
      "Basic Malware Scanning": true,
      "Security Score": true,
      "Device Protection (1 device)": true,
      "Limited Vulnerability Checks": true,
      "AI Assistant (5/day)": true,
      "Real-time Alerts": true,
      "Phishing Protection": true,
      "Ransomware Defense": true,
      "Dark Web Monitoring": true,
      "Browser Security": true,
      "VPN Protection": true,
      "Identity Protection": true,
    },
  },
  {
    id: "business" as Plan,
    name: "Business",
    tagline: "Team-wide security",
    price: { monthly: 99.99, annual: 79.99 },
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.3)",
    icon: Building2,
    devices: 250,
    features: {
      "Basic Malware Scanning": true,
      "Security Score": true,
      "Device Protection (1 device)": true,
      "Limited Vulnerability Checks": true,
      "AI Assistant (5/day)": true,
      "Real-time Alerts": true,
      "Phishing Protection": true,
      "Ransomware Defense": true,
      "Dark Web Monitoring": true,
      "Browser Security": true,
      "VPN Protection": true,
      "Identity Protection": true,
    },
  },
  {
    id: "enterprise" as Plan,
    name: "Enterprise",
    tagline: "Unlimited scale",
    price: { monthly: null, annual: null },
    color: "#ff3b5c",
    glow: "rgba(255,59,92,0.3)",
    icon: Crown,
    devices: 9999,
    features: {
      "Basic Malware Scanning": true,
      "Security Score": true,
      "Device Protection (1 device)": true,
      "Limited Vulnerability Checks": true,
      "AI Assistant (5/day)": true,
      "Real-time Alerts": true,
      "Phishing Protection": true,
      "Ransomware Defense": true,
      "Dark Web Monitoring": true,
      "Browser Security": true,
      "VPN Protection": true,
      "Identity Protection": true,
    },
  },
];

// ─── helpers ────────────────────────────────────────────────
const cx = (...classes: (string | false | undefined | null)[]) => classes.filter(Boolean).join(" ");

const SeverityBadge = ({ severity }: { severity: string }) => {
  const map: Record<string, string> = {
    critical: "bg-red-500/20 text-red-400 border border-red-500/30",
    high: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
    low: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  };
  return (
    <span className={cx("text-xs font-mono px-2 py-0.5 rounded-full uppercase tracking-wider", map[severity])}>
      {severity}
    </span>
  );
};

const GlowCard = ({ children, className, glow }: { children: React.ReactNode; className?: string; glow?: string }) => (
  <div
    className={cx("relative rounded-2xl border border-border bg-card p-4 overflow-hidden", className)}
    style={glow ? { boxShadow: `0 0 30px ${glow}` } : undefined}
  >
    {children}
  </div>
);

const ScanRing = ({ score, size = 120, color = "#00d4ff" }: { score: number; size?: number; color?: string }) => {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={8} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 8px ${color})` }}
      />
    </svg>
  );
};

// ─── screens ────────────────────────────────────────────────

function SplashScreen({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full relative overflow-hidden" style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(0,212,255,0.12) 0%, #0a0c12 70%)" }}>
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="absolute rounded-full opacity-10"
            style={{
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              background: "#00d4ff",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `pulse ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.2), rgba(15,244,198,0.1))", border: "1px solid rgba(0,212,255,0.3)", boxShadow: "0 0 60px rgba(0,212,255,0.3)" }}>
            <Shield className="w-12 h-12 text-primary" style={{ filter: "drop-shadow(0 0 12px #00d4ff)" }} />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
            <Brain className="w-3 h-3 text-black" />
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-black tracking-tight" style={{ fontFamily: "'Exo 2', sans-serif", background: "linear-gradient(135deg, #00d4ff, #0ff4c6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            DELTEX AI
          </h1>
          <p className="text-muted-foreground text-sm mt-1 font-mono tracking-widest uppercase">Next-Gen Cyber Defense</p>
        </div>
        <div className="flex gap-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#00d4ff", animationDelay: `${i * 0.3}s` }} />
          ))}
        </div>
      </div>
      <button onClick={onNext} className="absolute bottom-12 w-64 py-4 rounded-2xl text-sm font-bold tracking-wider uppercase text-black transition-all hover:opacity-90 active:scale-95"
        style={{ background: "linear-gradient(135deg, #00d4ff, #0ff4c6)", boxShadow: "0 8px 30px rgba(0,212,255,0.4)" }}>
        Get Protected Now
      </button>
    </div>
  );
}

function OnboardingScreen({ onNext }: { onNext: () => void }) {
  const [step, setStep] = useState(0);
  const slides = [
    {
      icon: Brain,
      color: "#00d4ff",
      title: "AI-Powered Protection",
      desc: "Deltex AI analyzes 10M+ threat signals daily, using neural networks to detect zero-day attacks before they reach you.",
    },
    {
      icon: ShieldCheck,
      color: "#0ff4c6",
      title: "360° Security Coverage",
      desc: "From malware and phishing to dark web leaks and identity theft — every digital threat neutralized in real time.",
    },
    {
      icon: Zap,
      color: "#7c3aed",
      title: "Instant Response",
      desc: "Sub-millisecond threat blocking with automated remediation. Stay safe without lifting a finger.",
    },
  ];
  const slide = slides[step];
  const Icon = slide.icon;

  return (
    <div className="flex flex-col h-full p-6" style={{ background: `radial-gradient(ellipse at 50% 20%, ${slide.color}18 0%, #0a0c12 65%)` }}>
      <div className="flex justify-end">
        <button onClick={onNext} className="text-muted-foreground text-sm font-mono">Skip</button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <div className="relative w-48 h-48 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full opacity-10 animate-ping" style={{ background: slide.color, animationDuration: "2s" }} />
          <div className="absolute inset-4 rounded-full opacity-20" style={{ background: slide.color }} />
          <div className="w-28 h-28 rounded-3xl flex items-center justify-center" style={{ background: `rgba(${slide.color === "#00d4ff" ? "0,212,255" : slide.color === "#0ff4c6" ? "15,244,198" : "124,58,237"},0.15)`, border: `1px solid ${slide.color}40` }}>
            <Icon style={{ width: 52, height: 52, color: slide.color, filter: `drop-shadow(0 0 16px ${slide.color})` }} />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black" style={{ fontFamily: "'Exo 2', sans-serif", color: slide.color }}>{slide.title}</h2>
          <p className="text-muted-foreground mt-3 leading-relaxed text-sm">{slide.desc}</p>
        </div>
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setStep(i)} className="h-2 rounded-full transition-all" style={{ width: i === step ? 24 : 8, background: i === step ? slide.color : "rgba(255,255,255,0.15)" }} />
          ))}
        </div>
      </div>
      <button
        onClick={() => step < slides.length - 1 ? setStep(step + 1) : onNext()}
        className="py-4 rounded-2xl text-sm font-bold tracking-wider uppercase text-black transition-all hover:opacity-90"
        style={{ background: `linear-gradient(135deg, ${slide.color}, #00d4ff)`, boxShadow: `0 8px 30px ${slide.color}50` }}>
        {step < slides.length - 1 ? "Continue" : "Get Started"}
      </button>
    </div>
  );
}

function AuthScreen({ onNext }: { onNext: () => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.1) 0%, #0a0c12 60%)" }}>
      <div className="p-6 flex-1">
        <div className="flex items-center gap-2 mb-8">
          <Shield className="text-primary w-6 h-6" style={{ filter: "drop-shadow(0 0 6px #00d4ff)" }} />
          <span className="font-black text-lg" style={{ fontFamily: "'Exo 2', sans-serif" }}>DELTEX AI</span>
        </div>
        <h2 className="text-3xl font-black mb-1" style={{ fontFamily: "'Exo 2', sans-serif" }}>
          {mode === "signin" ? "Welcome back" : "Create account"}
        </h2>
        <p className="text-muted-foreground text-sm mb-8">
          {mode === "signin" ? "Sign in to your security hub" : "Start your 14-day free trial"}
        </p>

        {/* Social auth */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Google", icon: "G", color: "#4285F4" },
            { label: "Microsoft", icon: "M", color: "#00A4EF" },
            { label: "Apple", icon: "⌘", color: "#ffffff" },
          ].map((p) => (
            <button key={p.label} className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-border bg-card hover:border-primary/40 transition-all text-xs font-medium">
              <span className="text-lg font-bold" style={{ color: p.color }}>{p.icon}</span>
              <span className="text-muted-foreground">{p.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-muted-foreground text-xs font-mono">OR</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="flex flex-col gap-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-card border border-border text-sm focus:border-primary focus:outline-none transition-colors"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type={showPass ? "text" : "password"}
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-10 pr-12 py-3.5 rounded-xl bg-card border border-border text-sm focus:border-primary focus:outline-none transition-colors"
            />
            <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2">
              {showPass ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
            </button>
          </div>
          {mode === "signin" && (
            <button className="text-primary text-xs text-right -mt-2">Forgot password?</button>
          )}
          <button onClick={onNext} className="py-4 rounded-2xl text-sm font-bold tracking-wider uppercase text-black transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #00d4ff, #0ff4c6)", boxShadow: "0 8px 30px rgba(0,212,255,0.4)" }}>
            {mode === "signin" ? "Sign In Securely" : "Create Account"}
          </button>
        </div>

        <div className="mt-6 flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
          <Fingerprint className="w-8 h-8 text-primary flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold">Biometric Authentication</p>
            <p className="text-xs text-muted-foreground">Use Face ID or fingerprint to sign in faster</p>
          </div>
          <button className="ml-auto text-xs text-primary font-semibold">Enable</button>
        </div>

        <p className="text-center text-muted-foreground text-xs mt-6">
          {mode === "signin" ? "New to Deltex? " : "Already have an account? "}
          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-primary font-semibold">
            {mode === "signin" ? "Create account" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

function SecuritySetupScreen({ onNext }: { onNext: () => void }) {
  const [granted, setGranted] = useState<Record<string, boolean>>({});
  const perms = [
    { id: "notifications", icon: Bell, label: "Notifications", desc: "Real-time threat alerts" },
    { id: "location", icon: MapPin, label: "Location", desc: "Network location security" },
    { id: "storage", icon: Database, label: "Storage", desc: "File and app scanning" },
    { id: "network", icon: Wifi, label: "Network", desc: "Traffic monitoring" },
    { id: "biometric", icon: Fingerprint, label: "Biometrics", desc: "Secure authentication" },
  ];
  const allGranted = perms.every(p => granted[p.id]);

  return (
    <div className="flex flex-col h-full p-6 overflow-y-auto" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(15,244,198,0.08) 0%, #0a0c12 60%)" }}>
      <div className="mb-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.25)" }}>
          <Lock className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-2xl font-black" style={{ fontFamily: "'Exo 2', sans-serif" }}>Security Setup</h2>
        <p className="text-muted-foreground text-sm mt-1">Grant permissions to enable full protection</p>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        {perms.map(p => {
          const Icon = p.icon;
          const isGranted = granted[p.id];
          return (
            <div key={p.id} className={cx("flex items-center gap-4 p-4 rounded-xl border transition-all", isGranted ? "border-primary/40 bg-primary/5" : "border-border bg-card")}>
              <div className={cx("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", isGranted ? "bg-primary/20" : "bg-muted")}>
                <Icon className={cx("w-5 h-5", isGranted ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{p.label}</p>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </div>
              <button
                onClick={() => setGranted(g => ({ ...g, [p.id]: !g[p.id] }))}
                className={cx("px-3 py-1.5 rounded-lg text-xs font-bold transition-all", isGranted ? "text-black" : "text-primary border border-primary/40 bg-transparent")}
                style={isGranted ? { background: "linear-gradient(135deg, #00d4ff, #0ff4c6)" } : {}}
              >
                {isGranted ? "Granted" : "Allow"}
              </button>
            </div>
          );
        })}
      </div>

      <button onClick={onNext} className={cx("mt-6 py-4 rounded-2xl text-sm font-bold tracking-wider uppercase transition-all", allGranted ? "text-black" : "text-muted-foreground border border-border bg-card")}
        style={allGranted ? { background: "linear-gradient(135deg, #00d4ff, #0ff4c6)", boxShadow: "0 8px 30px rgba(0,212,255,0.4)" } : {}}>
        {allGranted ? "Complete Setup" : `Grant All Permissions (${Object.values(granted).filter(Boolean).length}/${perms.length})`}
      </button>
    </div>
  );
}

function DashboardScreen({ onNavigate, plan }: { onNavigate: (s: Screen) => void; plan: Plan }) {
  const planInfo = plans.find(p => p.id === plan)!;
  const score = 94;

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between sticky top-0 z-10" style={{ background: "rgba(10,12,18,0.9)", backdropFilter: "blur(12px)" }}>
        <div>
          <p className="text-muted-foreground text-xs font-mono">ACTIVE PROTECTION</p>
          <h2 className="font-black text-lg" style={{ fontFamily: "'Exo 2', sans-serif" }}>Security Hub</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onNavigate("notifications")} className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center relative">
            <Bell className="w-4 h-4" />
            <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          </button>
          <button onClick={() => onNavigate("profile")} className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-black font-bold text-sm">JD</span>
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Security Score */}
        <GlowCard glow="rgba(0,212,255,0.15)" className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <ScanRing score={score} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black" style={{ fontFamily: "'Exo 2', sans-serif", color: "#00d4ff" }}>{score}</span>
              <span className="text-xs text-muted-foreground font-mono">SCORE</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-black" style={{ fontFamily: "'Exo 2', sans-serif" }}>Excellent</span>
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-mono border border-green-500/30">SECURE</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">All systems operational. 3 threats blocked today.</p>
            <div className="flex gap-2">
              {[["Malware", true], ["Phishing", true], ["Network", true]].map(([label, ok]) => (
                <div key={label as string} className="flex items-center gap-1">
                  {ok ? <CheckCircle className="w-3 h-3 text-green-400" /> : <XCircle className="w-3 h-3 text-red-400" />}
                  <span className="text-xs text-muted-foreground">{label as string}</span>
                </div>
              ))}
            </div>
          </div>
        </GlowCard>

        {/* Plan badge */}
        <button onClick={() => onNavigate("pricing")} className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${planInfo.color}10, ${planInfo.color}05)`, borderColor: `${planInfo.color}30` }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${planInfo.color}20` }}>
            {(() => { const I = planInfo.icon; return <I className="w-4 h-4" style={{ color: planInfo.color }} />; })()}
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs font-bold" style={{ color: planInfo.color }}>{planInfo.name} Plan</p>
            <p className="text-xs text-muted-foreground">{plan === "free" ? "Upgrade for full protection" : `${planInfo.devices} devices protected`}</p>
          </div>
          {plan === "free" && (
            <span className="text-xs text-black font-bold px-3 py-1 rounded-full" style={{ background: "linear-gradient(135deg, #00d4ff, #0ff4c6)" }}>Upgrade</span>
          )}
          {plan !== "free" && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </button>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Threats Blocked", value: "2,847", icon: ShieldCheck, color: "#00d4ff" },
            { label: "Files Scanned", value: "18.4K", icon: Search, color: "#0ff4c6" },
            { label: "Active Shields", value: "7/7", icon: Layers, color: "#7c3aed" },
          ].map(s => {
            const I = s.icon;
            return (
              <div key={s.label} className="bg-card border border-border rounded-xl p-3 flex flex-col gap-2">
                <I className="w-4 h-4" style={{ color: s.color }} />
                <p className="text-lg font-black" style={{ fontFamily: "'Exo 2', sans-serif", color: s.color }}>{s.value}</p>
                <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Threat chart */}
        <GlowCard>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold">Threat Activity</p>
            <span className="text-xs text-muted-foreground font-mono">24H</span>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={threatData}>
              <defs>
                <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#111420", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 8, fontSize: 11 }} />
              <Area type="monotone" dataKey="threats" stroke="#ff3b5c" strokeWidth={2} fill="none" name="Detected" />
              <Area type="monotone" dataKey="blocked" stroke="#00d4ff" strokeWidth={2} fill="url(#tg)" name="Blocked" />
            </AreaChart>
          </ResponsiveContainer>
        </GlowCard>

        {/* Protection modules */}
        <div>
          <p className="text-sm font-bold mb-3">Protection Modules</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Malware", icon: Bug, screen: "malware" as Screen, active: true, color: "#ff3b5c" },
              { label: "Phishing", icon: Fish, screen: "phishing" as Screen, active: true, color: "#f59e0b" },
              { label: "Ransomware", icon: Skull, screen: "ransomware" as Screen, active: true, color: "#7c3aed" },
              { label: "Dark Web", icon: Eye, screen: "dark-web" as Screen, active: plan !== "free", color: "#00d4ff" },
              { label: "Network", icon: Network, screen: "network" as Screen, active: true, color: "#0ff4c6" },
              { label: "Identity", icon: User, screen: "identity" as Screen, active: plan !== "free", color: "#f59e0b" },
              { label: "Browser", icon: Chrome, screen: "browser" as Screen, active: plan !== "free", color: "#00d4ff" },
              { label: "Social", icon: Twitter, screen: "social" as Screen, active: plan === "family" || plan === "professional" || plan === "business" || plan === "enterprise", color: "#7c3aed" },
            ].map(m => {
              const I = m.icon;
              return (
                <button key={m.label} onClick={() => m.active ? onNavigate(m.screen) : onNavigate("pricing")}
                  className="relative flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/30 transition-all text-left">
                  {!m.active && (
                    <div className="absolute inset-0 rounded-xl bg-black/50 flex items-center justify-center z-10">
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground font-mono">Upgrade</span>
                      </div>
                    </div>
                  )}
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${m.color}15` }}>
                    <I className="w-4 h-4" style={{ color: m.active ? m.color : "#6b7280" }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold">{m.label}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className={cx("w-1.5 h-1.5 rounded-full", m.active ? "bg-green-400" : "bg-muted-foreground")} />
                      <span className="text-xs text-muted-foreground">{m.active ? "Active" : "Locked"}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent threats */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold">Recent Threats</p>
            <button onClick={() => onNavigate("threats")} className="text-xs text-primary">View All</button>
          </div>
          <div className="flex flex-col gap-2">
            {recentThreats.slice(0, 3).map(t => (
              <div key={t.id} className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border">
                <div className={cx("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", t.blocked ? "bg-green-500/10" : "bg-red-500/10")}>
                  {t.blocked ? <ShieldCheck className="w-4 h-4 text-green-400" /> : <ShieldAlert className="w-4 h-4 text-red-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold">{t.type}</span>
                    <SeverityBadge severity={t.severity} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{t.source}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{t.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Assistant CTA */}
        <button onClick={() => onNavigate("ai-assistant")} className="flex items-center gap-4 p-4 rounded-2xl text-left"
          style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(0,212,255,0.1))", border: "1px solid rgba(124,58,237,0.3)" }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(124,58,237,0.2)" }}>
            <Brain className="w-6 h-6 text-purple-400" style={{ filter: "drop-shadow(0 0 8px #7c3aed)" }} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">Ask Deltex AI</p>
            <p className="text-xs text-muted-foreground">"Am I safe from the latest malware?"</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="h-4" />
      </div>
    </div>
  );
}

function ThreatsScreen({ onBack }: { onBack: () => void }) {
  const [filter, setFilter] = useState("all");
  const filters = ["all", "critical", "high", "medium", "low"];
  const filtered = filter === "all" ? recentThreats : recentThreats.filter(t => t.severity === filter);

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      <div className="p-4 sticky top-0 z-10" style={{ background: "rgba(10,12,18,0.9)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center">
            <ChevronDown className="w-4 h-4 rotate-90" />
          </button>
          <div>
            <h2 className="font-black" style={{ fontFamily: "'Exo 2', sans-serif" }}>Threat Monitor</h2>
            <p className="text-xs text-muted-foreground font-mono">Real-time threat intelligence</p>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cx("px-3 py-1.5 rounded-lg text-xs font-mono uppercase whitespace-nowrap transition-all flex-shrink-0", filter === f ? "text-black" : "text-muted-foreground bg-card border border-border")}
              style={filter === f ? { background: "linear-gradient(135deg, #00d4ff, #0ff4c6)" } : {}}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Pie chart */}
        <GlowCard className="flex gap-4 items-center">
          <PieChart width={100} height={100}>
            <Pie data={threatBreakdown} cx={45} cy={45} innerRadius={30} outerRadius={45} dataKey="value">
              {threatBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
          </PieChart>
          <div className="flex flex-col gap-1.5">
            {threatBreakdown.map(t => (
              <div key={t.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: t.color }} />
                <span className="text-xs text-muted-foreground">{t.name}</span>
                <span className="text-xs font-mono ml-auto" style={{ color: t.color }}>{t.value}%</span>
              </div>
            ))}
          </div>
        </GlowCard>

        <div className="flex flex-col gap-2">
          {filtered.map(t => (
            <div key={t.id} className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border">
              <div className={cx("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", t.blocked ? "bg-green-500/10" : "bg-red-500/10")}>
                {t.blocked ? <ShieldCheck className="w-5 h-5 text-green-400" /> : <ShieldAlert className="w-5 h-5 text-red-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold">{t.type}</span>
                  <SeverityBadge severity={t.severity} />
                </div>
                <p className="text-xs text-muted-foreground">{t.source}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-muted-foreground font-mono">{t.time}</span>
                  <span className={cx("text-xs font-mono", t.blocked ? "text-green-400" : "text-red-400")}>
                    {t.blocked ? "● BLOCKED" : "● DETECTED"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProtectionScreen({ title, icon: Icon, color, items, onBack, locked }: {
  title: string; icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
  color: string; items: { label: string; status: string; detail: string }[];
  onBack: () => void; locked?: boolean;
}) {
  if (locked) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 gap-6">
        <button onClick={onBack} className="absolute top-4 left-4 w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center">
          <ChevronDown className="w-4 h-4 rotate-90" />
        </button>
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
          <Lock className="w-10 h-10" style={{ color }} />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-black mb-2" style={{ fontFamily: "'Exo 2', sans-serif" }}>{title}</h2>
          <p className="text-muted-foreground text-sm">This feature requires a Premium plan or higher. Upgrade to unlock advanced protection.</p>
        </div>
        <button className="w-full py-4 rounded-2xl text-sm font-bold text-black" style={{ background: "linear-gradient(135deg, #00d4ff, #0ff4c6)" }}>
          Upgrade to Unlock
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      <div className="p-4 sticky top-0 z-10" style={{ background: "rgba(10,12,18,0.9)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center">
            <ChevronDown className="w-4 h-4 rotate-90" />
          </button>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <h2 className="font-black" style={{ fontFamily: "'Exo 2', sans-serif" }}>{title}</h2>
          <div className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400 font-mono">ACTIVE</span>
          </div>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-3">
        {items.map((item, i) => (
          <div key={i} className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold">{item.label}</span>
              <span className={cx("text-xs font-mono", item.status === "Protected" || item.status === "Scanning" ? "text-green-400" : item.status === "Warning" ? "text-yellow-400" : "text-muted-foreground")}>
                {item.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{item.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIAssistantScreen({ onBack, plan }: { onBack: () => void; plan: Plan }) {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hi! I'm Deltex AI. I've analyzed your security profile and have 3 active recommendations. What would you like to know?" },
  ]);
  const [input, setInput] = useState("");
  const suggestions = [
    "Am I at risk from the new zero-day?",
    "Scan my device now",
    "Check dark web for my email",
    "Why was this threat blocked?",
  ];

  const send = (text: string) => {
    setMessages(m => [
      ...m,
      { role: "user", text },
      { role: "ai", text: "Analyzing your query... Based on your current threat profile and the latest global threat intelligence, I've identified that your device shows no indicators of compromise. Your security score remains at 94/100. I recommend enabling 2FA on all connected accounts for optimal protection." },
    ]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.08) 0%, #0a0c12 60%)" }}>
      <div className="p-4 flex items-center gap-3 border-b border-border">
        <button onClick={onBack} className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center">
          <ChevronDown className="w-4 h-4 rotate-90" />
        </button>
        <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center">
          <Brain className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <h2 className="font-black text-sm" style={{ fontFamily: "'Exo 2', sans-serif" }}>Deltex AI Assistant</h2>
          <p className="text-xs text-green-400 font-mono">● Online • Analyzing threats</p>
        </div>
        {plan === "free" && (
          <span className="ml-auto text-xs font-mono text-muted-foreground bg-card border border-border px-2 py-1 rounded-full">5/5 left</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" style={{ scrollbarWidth: "none" }}>
        {messages.map((m, i) => (
          <div key={i} className={cx("flex gap-3", m.role === "user" ? "flex-row-reverse" : "flex-row")}>
            {m.role === "ai" && (
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Brain className="w-4 h-4 text-purple-400" />
              </div>
            )}
            <div className={cx("max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed", m.role === "ai" ? "bg-card border border-border rounded-tl-sm" : "rounded-tr-sm text-black")}
              style={m.role === "user" ? { background: "linear-gradient(135deg, #00d4ff, #0ff4c6)" } : {}}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex gap-2 overflow-x-auto mb-3" style={{ scrollbarWidth: "none" }}>
          {suggestions.map(s => (
            <button key={s} onClick={() => send(s)} className="whitespace-nowrap text-xs px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary transition-all flex-shrink-0">
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && input && send(input)}
            placeholder="Ask about your security..."
            className="flex-1 px-4 py-3 rounded-xl bg-card border border-border text-sm focus:border-primary focus:outline-none"
          />
          <button onClick={() => input && send(input)} className="w-11 h-11 rounded-xl flex items-center justify-center text-black"
            style={{ background: "linear-gradient(135deg, #00d4ff, #0ff4c6)" }}>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function PricingScreen({ onBack, currentPlan, onSelectPlan }: { onBack: () => void; currentPlan: Plan; onSelectPlan: (p: Plan) => void }) {
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const [selected, setSelected] = useState<Plan | null>(null);

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth: "none", background: "radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.08) 0%, #0a0c12 70%)" }}>
      <div className="p-4 sticky top-0 z-10" style={{ background: "rgba(10,12,18,0.95)", backdropFilter: "blur(16px)" }}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center">
            <ChevronDown className="w-4 h-4 rotate-90" />
          </button>
          <div>
            <h2 className="font-black" style={{ fontFamily: "'Exo 2', sans-serif" }}>Choose Your Plan</h2>
            <p className="text-xs text-muted-foreground">AI-powered protection tiers</p>
          </div>
        </div>
        <div className="flex p-1 rounded-xl bg-card border border-border gap-1">
          {["monthly", "annual"].map(b => (
            <button key={b} onClick={() => setBilling(b as "monthly" | "annual")}
              className={cx("flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all")}
              style={billing === b ? { background: "linear-gradient(135deg, #00d4ff, #0ff4c6)", color: "#040608" } : { color: "#6b7280" }}>
              {b} {b === "annual" && <span className="text-[10px]">-20%</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* AI recommendation */}
        <div className="p-4 rounded-2xl border flex gap-3" style={{ background: "rgba(124,58,237,0.08)", borderColor: "rgba(124,58,237,0.25)" }}>
          <Brain className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-purple-300">AI Recommendation</p>
            <p className="text-xs text-muted-foreground mt-0.5">Based on your threat profile (score: 94) and usage patterns, we recommend the <span className="text-primary font-semibold">Personal Plan</span> — it covers all detected risk vectors at optimal value.</p>
          </div>
        </div>

        {plans.map(plan => {
          const Icon = plan.icon;
          const price = billing === "annual" ? plan.price.annual : plan.price.monthly;
          const isCurrent = plan.id === currentPlan;
          const isSelected = selected === plan.id;

          return (
            <button key={plan.id} onClick={() => setSelected(plan.id)}
              className={cx("relative w-full text-left rounded-2xl border p-4 transition-all")}
              style={{
                borderColor: isSelected ? plan.color : isCurrent ? `${plan.color}50` : "rgba(255,255,255,0.08)",
                background: isSelected ? `linear-gradient(135deg, ${plan.color}15, ${plan.color}05)` : "rgba(17,20,32,0.8)",
                boxShadow: isSelected ? `0 0 30px ${plan.glow}` : undefined,
              }}>
              {plan.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <span className="text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full text-black" style={{ background: "linear-gradient(135deg, #00d4ff, #0ff4c6)" }}>Most Popular</span>
                </div>
              )}
              {isCurrent && (
                <div className="absolute top-3 right-3">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border" style={{ color: plan.color, borderColor: `${plan.color}40`, background: `${plan.color}10` }}>Current</span>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${plan.color}20` }}>
                  <Icon className="w-5 h-5" style={{ color: plan.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <h3 className="font-black text-base" style={{ fontFamily: "'Exo 2', sans-serif", color: plan.color }}>{plan.name}</h3>
                    <span className="text-xs text-muted-foreground">{plan.tagline}</span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    {price === null ? (
                      <span className="text-xl font-black" style={{ fontFamily: "'Exo 2', sans-serif" }}>Custom</span>
                    ) : price === 0 ? (
                      <span className="text-xl font-black text-green-400" style={{ fontFamily: "'Exo 2', sans-serif" }}>Free</span>
                    ) : (
                      <>
                        <span className="text-xl font-black" style={{ fontFamily: "'Exo 2', sans-serif", color: plan.color }}>${price}</span>
                        <span className="text-xs text-muted-foreground">/mo</span>
                      </>
                    )}
                    {price !== null && price > 0 && billing === "annual" && (
                      <span className="text-xs text-green-400 font-mono ml-1">Save 20%</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <Smartphone className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{plan.devices >= 9999 ? "Unlimited" : `Up to ${plan.devices}`} devices</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-1.5">
                {Object.entries(plan.features).slice(0, 6).map(([feat, val]) => (
                  <div key={feat} className="flex items-center gap-1.5">
                    {val === true ? <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                      : val === "partial" ? <div className="w-3 h-3 rounded-full border border-yellow-400/60 flex-shrink-0" />
                        : <XCircle className="w-3 h-3 text-red-500/40 flex-shrink-0" />}
                    <span className="text-xs text-muted-foreground truncate">{feat.split(" ")[0]} {feat.split(" ")[1] || ""}</span>
                  </div>
                ))}
              </div>

              {isSelected && !isCurrent && (
                <button onClick={() => { onSelectPlan(plan.id); onBack(); }}
                  className="mt-3 w-full py-3 rounded-xl text-xs font-bold tracking-wider uppercase text-black transition-all"
                  style={{ background: `linear-gradient(135deg, ${plan.color}, ${plan.id === "enterprise" ? "#ff8c00" : plan.color}cc)` }}>
                  {plan.id === "enterprise" ? "Contact Sales" : `Upgrade to ${plan.name}`}
                </button>
              )}
            </button>
          );
        })}

        {/* Payment methods */}
        <div className="p-4 rounded-2xl bg-card border border-border">
          <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Accepted Payment Methods</p>
          <div className="flex flex-wrap gap-2">
            {["Visa", "Mastercard", "PayPal", "Apple Pay", "Google Pay", "M-Pesa", "Corporate"].map(pm => (
              <span key={pm} className="text-xs px-3 py-1.5 rounded-lg bg-muted/50 border border-border font-mono">{pm}</span>
            ))}
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          <p>All plans include a 14-day free trial. Cancel anytime.</p>
          <p className="mt-1">Have a coupon? <button className="text-primary font-semibold">Apply here</button></p>
        </div>
        <div className="h-4" />
      </div>
    </div>
  );
}

function NotificationsScreen({ onBack }: { onBack: () => void }) {
  const notifs = [
    { id: 1, type: "critical", icon: ShieldAlert, color: "#ff3b5c", title: "Critical Threat Blocked", desc: "Ransomware attempt from mail attachment neutralized", time: "2 min ago" },
    { id: 2, type: "warning", icon: AlertTriangle, color: "#f59e0b", title: "Dark Web Alert", desc: "Email address detected in breach database", time: "1h ago" },
    { id: 3, type: "info", icon: Activity, color: "#00d4ff", title: "Weekly Report Ready", desc: "Your security summary for this week is ready to view", time: "3h ago" },
    { id: 4, type: "success", icon: CheckCircle, color: "#0ff4c6", title: "VPN Connected", desc: "Secure tunnel established via Frankfurt node", time: "5h ago" },
    { id: 5, type: "info", icon: RefreshCw, color: "#7c3aed", title: "Threat Database Updated", desc: "276,481 new threat signatures added", time: "Yesterday" },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      <div className="p-4 sticky top-0 z-10 flex items-center gap-3" style={{ background: "rgba(10,12,18,0.9)", backdropFilter: "blur(12px)" }}>
        <button onClick={onBack} className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center">
          <ChevronDown className="w-4 h-4 rotate-90" />
        </button>
        <h2 className="font-black" style={{ fontFamily: "'Exo 2', sans-serif" }}>Notifications</h2>
        <button className="ml-auto text-xs text-primary">Mark all read</button>
      </div>
      <div className="p-4 flex flex-col gap-2">
        {notifs.map(n => {
          const I = n.icon;
          return (
            <div key={n.id} className="flex gap-3 p-4 rounded-xl bg-card border border-border hover:border-border/80 transition-all">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${n.color}15` }}>
                <I className="w-5 h-5" style={{ color: n.color }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
                <p className="text-xs text-muted-foreground font-mono mt-1.5">{n.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProfileScreen({ onBack, onNavigate, plan }: { onBack: () => void; onNavigate: (s: Screen) => void; plan: Plan }) {
  const planInfo = plans.find(p => p.id === plan)!;
  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      <div className="p-4 sticky top-0 z-10 flex items-center gap-3" style={{ background: "rgba(10,12,18,0.9)", backdropFilter: "blur(12px)" }}>
        <button onClick={onBack} className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center">
          <ChevronDown className="w-4 h-4 rotate-90" />
        </button>
        <h2 className="font-black" style={{ fontFamily: "'Exo 2', sans-serif" }}>Profile</h2>
      </div>
      <div className="p-4">
        <div className="flex flex-col items-center gap-3 mb-8 pt-2">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center" style={{ boxShadow: "0 0 30px rgba(0,212,255,0.3)" }}>
            <span className="text-black font-black text-2xl">JD</span>
          </div>
          <div className="text-center">
            <h3 className="font-black text-lg" style={{ fontFamily: "'Exo 2', sans-serif" }}>James Donovan</h3>
            <p className="text-muted-foreground text-sm">james.donovan@example.com</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border" style={{ borderColor: `${planInfo.color}40`, background: `${planInfo.color}10` }}>
            {(() => { const I = planInfo.icon; return <I className="w-3 h-3" style={{ color: planInfo.color }} />; })()}
            <span className="text-xs font-bold" style={{ color: planInfo.color }}>{planInfo.name} Plan</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Score", value: "94", color: "#00d4ff" },
            { label: "Threats", value: "2.8K", color: "#0ff4c6" },
            { label: "Days", value: "127", color: "#7c3aed" },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-xl font-black" style={{ fontFamily: "'Exo 2', sans-serif", color: s.color }}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {[
          { label: "Security Settings", icon: Settings, screen: "settings" as Screen },
          { label: "Billing & Subscription", icon: CreditCard, screen: "billing" as Screen },
          { label: "Upgrade Plan", icon: Crown, screen: "pricing" as Screen },
          { label: "Notifications", icon: Bell, screen: "notifications" as Screen },
          { label: "Help & Support", icon: HelpCircle, screen: null },
          { label: "Privacy Policy", icon: FileText, screen: null },
        ].map(item => {
          const I = item.icon;
          return (
            <button key={item.label} onClick={() => item.screen && onNavigate(item.screen)}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-card border border-border mb-2 hover:border-border/80 transition-all">
              <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                <I className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          );
        })}

        <button className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 mt-2">
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-semibold">Sign Out</span>
        </button>
      </div>
    </div>
  );
}

function BillingScreen({ onBack, plan }: { onBack: () => void; plan: Plan }) {
  const planInfo = plans.find(p => p.id === plan)!;
  const invoices = [
    { date: "Jun 1, 2026", amount: "$7.99", status: "Paid" },
    { date: "May 1, 2026", amount: "$7.99", status: "Paid" },
    { date: "Apr 1, 2026", amount: "$7.99", status: "Paid" },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      <div className="p-4 sticky top-0 z-10 flex items-center gap-3" style={{ background: "rgba(10,12,18,0.9)", backdropFilter: "blur(12px)" }}>
        <button onClick={onBack} className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center">
          <ChevronDown className="w-4 h-4 rotate-90" />
        </button>
        <h2 className="font-black" style={{ fontFamily: "'Exo 2', sans-serif" }}>Billing</h2>
      </div>
      <div className="p-4 flex flex-col gap-4">
        <div className="p-4 rounded-2xl border" style={{ background: `linear-gradient(135deg, ${planInfo.color}15, ${planInfo.color}05)`, borderColor: `${planInfo.color}30` }}>
          <div className="flex items-center gap-3 mb-3">
            {(() => { const I = planInfo.icon; return <I className="w-5 h-5" style={{ color: planInfo.color }} />; })()}
            <div>
              <p className="font-bold text-sm" style={{ color: planInfo.color }}>{planInfo.name} Plan</p>
              <p className="text-xs text-muted-foreground">Annual billing · Renews Jul 1, 2027</p>
            </div>
            <span className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-mono border border-green-500/30">Active</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black" style={{ fontFamily: "'Exo 2', sans-serif", color: planInfo.color }}>$95.88</span>
            <span className="text-sm text-muted-foreground">/year</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Next charge: Jul 1, 2027</p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Payment Method</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-7 rounded bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-black">VISA</span>
            </div>
            <div>
              <p className="text-sm font-semibold">•••• •••• •••• 4242</p>
              <p className="text-xs text-muted-foreground">Expires 09/28</p>
            </div>
            <button className="ml-auto text-xs text-primary font-semibold">Change</button>
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            {["Apple Pay", "Google Pay", "PayPal", "M-Pesa"].map(pm => (
              <span key={pm} className="text-xs px-2 py-1 rounded-lg bg-muted/50 border border-border font-mono">{pm}</span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-bold mb-3">Invoice History</p>
          {invoices.map((inv, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border mb-2">
              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm flex-1">{inv.date}</span>
              <span className="text-sm font-semibold font-mono">{inv.amount}</span>
              <span className="text-xs text-green-400 font-mono">{inv.status}</span>
              <Download className="w-4 h-4 text-muted-foreground" />
            </div>
          ))}
        </div>

        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Promo Code</p>
          <div className="flex gap-2">
            <input placeholder="Enter coupon code" className="flex-1 px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm focus:border-primary focus:outline-none" />
            <button className="px-4 py-2 rounded-lg text-xs font-bold text-black" style={{ background: "linear-gradient(135deg, #00d4ff, #0ff4c6)" }}>Apply</button>
          </div>
        </div>

        <button className="w-full py-3 rounded-xl text-sm text-red-400 border border-red-500/20 bg-red-500/5">
          Cancel Subscription
        </button>
      </div>
    </div>
  );
}

function SettingsScreen({ onBack }: { onBack: () => void }) {
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    realtime: true, notifications: true, darkweb: true, autoblock: true, vpn: false, biometric: true, analytics: false,
  });
  const toggle = (k: string) => setToggles(t => ({ ...t, [k]: !t[k] }));

  const sections = [
    {
      title: "Protection", items: [
        { id: "realtime", label: "Real-time Scanning", desc: "Continuous threat monitoring" },
        { id: "autoblock", label: "Auto-block Threats", desc: "Block without confirmation" },
        { id: "darkweb", label: "Dark Web Monitoring", desc: "Monitor credential leaks" },
        { id: "vpn", label: "VPN Auto-connect", desc: "Protect on untrusted networks" },
      ]
    },
    {
      title: "Security", items: [
        { id: "biometric", label: "Biometric Lock", desc: "Use Face ID / fingerprint" },
        { id: "notifications", label: "Push Notifications", desc: "Threat alerts and updates" },
        { id: "analytics", label: "Share Analytics", desc: "Help improve AI models" },
      ]
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      <div className="p-4 sticky top-0 z-10 flex items-center gap-3" style={{ background: "rgba(10,12,18,0.9)", backdropFilter: "blur(12px)" }}>
        <button onClick={onBack} className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center">
          <ChevronDown className="w-4 h-4 rotate-90" />
        </button>
        <h2 className="font-black" style={{ fontFamily: "'Exo 2', sans-serif" }}>Settings</h2>
      </div>
      <div className="p-4 flex flex-col gap-6">
        {sections.map(s => (
          <div key={s.title}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{s.title}</p>
            <div className="flex flex-col gap-2">
              {s.items.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <button onClick={() => toggle(item.id)} className={cx("w-12 h-6 rounded-full transition-all relative flex-shrink-0", toggles[item.id] ? "" : "bg-muted")}
                    style={toggles[item.id] ? { background: "linear-gradient(135deg, #00d4ff, #0ff4c6)" } : {}}>
                    <div className={cx("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all", toggles[item.id] ? "right-0.5" : "left-0.5")} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── bottom nav ────────────────────────────────────────────────
const navItems = [
  { screen: "dashboard" as Screen, icon: Home, label: "Home" },
  { screen: "threats" as Screen, icon: ShieldAlert, label: "Threats" },
  { screen: "ai-assistant" as Screen, icon: Brain, label: "AI" },
  { screen: "notifications" as Screen, icon: Bell, label: "Alerts" },
  { screen: "profile" as Screen, icon: User, label: "Profile" },
];

// ─── main ────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [plan, setPlan] = useState<Plan>("free");
  const isAuth = !["splash", "onboarding", "auth", "security-setup"].includes(screen);

  const malwareItems = [
    { label: "Real-time Scanner", status: "Protected", detail: "Active monitoring of 18,431 files across device storage" },
    { label: "App Integrity Check", status: "Protected", detail: "All 47 installed apps verified against threat database" },
    { label: "Download Shield", status: "Scanning", detail: "Scanning incoming downloads before execution" },
    { label: "Behavior Analysis", status: "Protected", detail: "AI anomaly detection watching 3,200+ behavior signals" },
  ];

  const phishingItems = [
    { label: "Email Protection", status: "Protected", detail: "Scanned 847 emails — 3 phishing attempts blocked" },
    { label: "URL Scanner", status: "Protected", detail: "Real-time URL reputation checking for all links" },
    { label: "Clone Site Detection", status: "Protected", detail: "Visual AI detects fake login pages instantly" },
    { label: "SMS Phishing", status: "Protected", detail: "Smishing protection active on all SMS" },
  ];

  const ransomwareItems = [
    { label: "File Encryption Monitor", status: "Protected", detail: "Zero unauthorized encryption events detected" },
    { label: "Backup Shield", status: "Protected", detail: "Secure backup of 2.4GB critical files maintained" },
    { label: "Network Isolation", status: "Protected", detail: "Auto-isolation triggers if ransomware detected" },
  ];

  const darkWebItems = [
    { label: "Email Monitoring", status: "Protected", detail: "j***@gmail.com — no new leaks in 24h" },
    { label: "Password Breach Check", status: "Warning", detail: "1 password found in breach database — change recommended" },
    { label: "Credit Card Monitor", status: "Protected", detail: "No card data found in monitored databases" },
    { label: "Identity Scan", status: "Protected", detail: "Personal ID data not detected in dark web forums" },
  ];

  const networkItems = [
    { label: "Wi-Fi Security", status: "Protected", detail: "Connected to trusted network — WPA3 secured" },
    { label: "DNS Protection", status: "Protected", detail: "Encrypted DNS active — preventing hijacking" },
    { label: "Firewall", status: "Protected", detail: "28 ports monitored — all unauthorized traffic blocked" },
    { label: "VPN Status", status: "Inactive", detail: "VPN not connected — enable for public networks" },
  ];

  const navigate = (s: Screen) => setScreen(s);
  const goBack = () => setScreen("dashboard");

  return (
    <div className="flex items-center justify-center w-full h-full bg-black" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Phone frame */}
      <div className="relative w-[390px] h-[844px] rounded-[44px] overflow-hidden bg-background shadow-2xl border border-white/10"
        style={{ boxShadow: "0 0 80px rgba(0,212,255,0.1), 0 0 0 1px rgba(255,255,255,0.08)" }}>
        {/* Status bar */}
        <div className="flex items-center justify-between px-6 py-2 bg-background/80" style={{ backdropFilter: "blur(12px)" }}>
          <span className="text-xs font-mono text-muted-foreground">9:41 AM</span>
          <div className="w-24 h-6 rounded-full bg-black" />
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3 h-3 text-muted-foreground" />
            <div className="text-xs font-mono text-muted-foreground">100%</div>
          </div>
        </div>

        {/* Screen content */}
        <div className="absolute inset-0 top-10 bottom-0 overflow-hidden">
          {screen === "splash" && <SplashScreen onNext={() => setScreen("onboarding")} />}
          {screen === "onboarding" && <OnboardingScreen onNext={() => setScreen("auth")} />}
          {screen === "auth" && <AuthScreen onNext={() => setScreen("security-setup")} />}
          {screen === "security-setup" && <SecuritySetupScreen onNext={() => setScreen("dashboard")} />}
          {screen === "dashboard" && <DashboardScreen onNavigate={navigate} plan={plan} />}
          {screen === "threats" && <ThreatsScreen onBack={goBack} />}
          {screen === "malware" && <ProtectionScreen title="Malware Protection" icon={Bug} color="#ff3b5c" items={malwareItems} onBack={goBack} />}
          {screen === "phishing" && <ProtectionScreen title="Phishing Detection" icon={Fish} color="#f59e0b" items={phishingItems} onBack={goBack} />}
          {screen === "ransomware" && <ProtectionScreen title="Ransomware Defense" icon={Skull} color="#7c3aed" items={ransomwareItems} onBack={goBack} />}
          {screen === "dark-web" && <ProtectionScreen title="Dark Web Monitor" icon={Eye} color="#00d4ff" items={darkWebItems} onBack={goBack} locked={plan === "free"} />}
          {screen === "network" && <ProtectionScreen title="Network Security" icon={Network} color="#0ff4c6" items={networkItems} onBack={goBack} />}
          {screen === "identity" && <ProtectionScreen title="Identity Protection" icon={User} color="#f59e0b" items={darkWebItems} onBack={goBack} locked={plan === "free"} />}
          {screen === "browser" && <ProtectionScreen title="Browser Security" icon={Chrome} color="#00d4ff" items={phishingItems} onBack={goBack} locked={plan === "free"} />}
          {screen === "social" && <ProtectionScreen title="Social Media Guard" icon={Twitter} color="#7c3aed" items={phishingItems} onBack={goBack} locked={plan === "free" || plan === "personal"} />}
          {screen === "vulnerability" && <ProtectionScreen title="Vulnerability Scan" icon={Search} color="#ff3b5c" items={malwareItems} onBack={goBack} />}
          {screen === "ai-assistant" && <AIAssistantScreen onBack={goBack} plan={plan} />}
          {screen === "notifications" && <NotificationsScreen onBack={goBack} />}
          {screen === "profile" && <ProfileScreen onBack={goBack} onNavigate={navigate} plan={plan} />}
          {screen === "billing" && <BillingScreen onBack={goBack} plan={plan} />}
          {screen === "settings" && <SettingsScreen onBack={goBack} />}
          {screen === "pricing" && <PricingScreen onBack={goBack} currentPlan={plan} onSelectPlan={p => { setPlan(p); }} />}
        </div>

        {/* Bottom nav (only in app screens) */}
        {isAuth && !["profile", "billing", "settings", "notifications", "pricing", "plan-detail", "malware", "phishing", "ransomware", "dark-web", "network", "identity", "browser", "social", "vulnerability", "ai-assistant", "threats"].includes(screen) && (
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 pt-3 flex items-center justify-around"
            style={{ background: "rgba(10,12,18,0.95)", backdropFilter: "blur(16px)", borderTop: "1px solid rgba(0,212,255,0.1)" }}>
            {navItems.map(item => {
              const I = item.icon;
              const active = screen === item.screen;
              return (
                <button key={item.screen} onClick={() => navigate(item.screen)} className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all">
                  <div className={cx("w-8 h-8 rounded-xl flex items-center justify-center", active ? "" : "")}
                    style={active ? { background: "rgba(0,212,255,0.15)" } : {}}>
                    <I className="w-5 h-5" style={{ color: active ? "#00d4ff" : "#6b7280", filter: active ? "drop-shadow(0 0 6px #00d4ff)" : undefined }} />
                  </div>
                  <span className="text-[10px] font-mono" style={{ color: active ? "#00d4ff" : "#6b7280" }}>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Home indicator */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full bg-white/20" />
      </div>

      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-5" style={{ background: "radial-gradient(circle, #00d4ff, transparent)" }} />
      </div>
    </div>
  );
}
