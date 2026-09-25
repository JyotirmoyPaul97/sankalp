"use client";

import * as React from "react";
import { useState } from "react";
import {
  Activity, ArrowRight, Building2, ShieldCheck, Users, GraduationCap,
  TrendingUp, MapPin, Sparkles, Network, FileText, Award, Briefcase,
  CheckCircle2, ChevronRight, Menu, Target, Gauge, Layers3,
} from "lucide-react";
import { useAuth } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useFetch } from "@/hooks/use-fetch";
import {
  AnimatedCounter, VisualBar, DemandSupplyComparison, EvidenceChain,
  GapMatrix, StatusBadge, SkillDecisionLoop, PrioritySignal,
} from "@/components/kaushal/visual-components";
import { MaharashtraIntelligenceBackground } from "@/components/kaushal/maharashtra-background";
import type { PlatformMeta } from "@/types/domain";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────
//  Public navigation (domain vocabulary, no implementation references)
// ─────────────────────────────────────────────────────────────────────
const PUBLIC_NAV = [
  "Home",
  "Labour Market",
  "Skill Intelligence",
  "Districts",
  "Training Ecosystem",
  "Industry & Employers",
  "About",
];

// ─────────────────────────────────────────────────────────────────────
//  Stakeholder workspaces (kept — labelled with domain vocabulary)
// ─────────────────────────────────────────────────────────────────────
const WORKSPACES = [
  { id: "government", label: "Government", icon: <ShieldCheck className="size-5" />, desc: "State & district intelligence, policy sandbox, planning" },
  { id: "industry", label: "Industry & Employer", icon: <Users className="size-5" />, desc: "Hiring demand, skill validation, industry signals" },
  { id: "training", label: "Training Ecosystem", icon: <GraduationCap className="size-5" />, desc: "Courses, curriculum, trainers, centre readiness" },
  { id: "candidate", label: "Candidate / Beneficiary", icon: <Activity className="size-5" />, desc: "Verified skill passport, gaps, development path" },
];

// ─────────────────────────────────────────────────────────────────────
//  Synthetic demonstration identities (realistic Maharashtra names)
// ─────────────────────────────────────────────────────────────────────
interface DemoAccount {
  email: string;
  password: string;
  name: string;
  role: string;
  description: string;
  icon: React.ReactNode;
  workspace: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: "admin@kaushal-drishti.demo", password: "demo-admin", name: "State Skill Administrator", role: "STATE_ADMIN", description: "Full state-wide intelligence and planning.", icon: <ShieldCheck className="size-4" />, workspace: "government" },
  { email: "planner@kaushal-drishti.demo", password: "demo-planner", name: "Pune District Planner", role: "DISTRICT_PLANNER", description: "District-scoped planning.", icon: <Building2 className="size-4" />, workspace: "government" },
  { email: "employer@kaushal-drishti.demo", password: "demo-employer", name: "Maharashtra Precision Systems", role: "EMPLOYER", description: "Demand validation and feedback.", icon: <Users className="size-4" />, workspace: "industry" },
  { email: "provider@kaushal-drishti.demo", password: "demo-provider", name: "Pune Advanced Manufacturing Centre", role: "TRAINING_PROVIDER", description: "Course and capacity management.", icon: <GraduationCap className="size-4" />, workspace: "training" },
  { email: "arjun.sharma@kaushal-drishti.demo", password: "demo-candidate", name: "Arjun Sharma", role: "CANDIDATE", description: "Target: PLC Technician. Verified skill passport, evidence, gaps, development path.", icon: <Activity className="size-4" />, workspace: "candidate" },
];

// ─────────────────────────────────────────────────────────────────────
//  Skill Decision Loop — explanatory side-notes
// ─────────────────────────────────────────────────────────────────────
const LOOP_NOTES = [
  { n: 1, label: "Industry Demand", detail: "Job postings, employer surveys, sector consultations." },
  { n: 2, label: "Role", detail: "Mapped to required competencies and proficiency levels." },
  { n: 3, label: "Skills", detail: "Disaggregated into assessable skill units." },
  { n: 4, label: "Training Capability", detail: "Curriculum, trainer, equipment, capacity." },
  { n: 5, label: "Skill Gap", detail: "Demand vs supply, proficiency mismatch, geographic gap." },
  { n: 6, label: "Candidate Evidence", detail: "Verified skill passport and demonstrated proficiency." },
  { n: 7, label: "Intervention", detail: "Course, assessment, certification, mentorship." },
  { n: 8, label: "Outcome", detail: "Placement, certification, employer validation." },
];

// ─────────────────────────────────────────────────────────────────────
//  Stylised Maharashtra district grid (36 districts)
//  Each cell shows gap intensity — visual, not numeric.
// ─────────────────────────────────────────────────────────────────────
const DISTRICT_GRID: { code: string; name: string; intensity: "critical" | "high" | "moderate" | "low" | "none" }[] = [
  { code: "DH", name: "Dhule", intensity: "moderate" },
  { code: "ND", name: "Nandurbar", intensity: "low" },
  { code: "JL", name: "Jalgaon", intensity: "high" },
  { code: "BK", name: "Buldhana", intensity: "moderate" },
  { code: "AK", name: "Akola", intensity: "moderate" },
  { code: "AM", name: "Amravati", intensity: "high" },
  { code: "WD", name: "Wardha", intensity: "low" },
  { code: "NG", name: "Nagpur", intensity: "critical" },
  { code: "BS", name: "Bhandara", intensity: "low" },
  { code: "GD", name: "Gondia", intensity: "low" },
  { code: "CG", name: "Chandrapur", intensity: "moderate" },
  { code: "GDH", name: "Gadchiroli", intensity: "none" },
  { code: "NS", name: "Nashik", intensity: "high" },
  { code: "AH", name: "Ahmednagar", intensity: "moderate" },
  { code: "JN", name: "Jalna", intensity: "low" },
  { code: "AU", name: "Aurangabad", intensity: "critical" },
  { code: "PB", name: "Parbhani", intensity: "moderate" },
  { code: "HN", name: "Hingoli", intensity: "low" },
  { code: "NDM", name: "Nanded", intensity: "high" },
  { code: "LD", name: "Latur", intensity: "moderate" },
  { code: "OS", name: "Osmanabad", intensity: "low" },
  { code: "SL", name: "Solapur", intensity: "high" },
  { code: "SD", name: "Satara", intensity: "moderate" },
  { code: "ST", name: "Sangli", intensity: "moderate" },
  { code: "KL", name: "Kolhapur", intensity: "high" },
  { code: "RN", name: "Ratnagiri", intensity: "low" },
  { code: "SDH", name: "Sindhudurg", intensity: "none" },
  { code: "PN", name: "Pune", intensity: "critical" },
  { code: "RG", name: "Raigad", intensity: "high" },
  { code: "RU", name: "Ratnagiri Coast", intensity: "low" },
  { code: "MB", name: "Mumbai", intensity: "critical" },
  { code: "MS", name: "Mumbai Suburban", intensity: "critical" },
  { code: "TH", name: "Thane", intensity: "high" },
  { code: "PL", name: "Palghar", intensity: "moderate" },
  { code: "BG", name: "Beed", intensity: "moderate" },
  { code: "OT", name: "Other", intensity: "none" },
];

const GRID_INTENSITY_TONE: Record<string, { cell: string; dot: string; label: string }> = {
  critical: { cell: "bg-status-critical/25 border-status-critical/50 text-status-critical", dot: "bg-status-critical", label: "Critical Gap" },
  high: { cell: "bg-status-attention/25 border-status-attention/50 text-status-attention", dot: "bg-status-attention", label: "High Gap" },
  moderate: { cell: "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-400", dot: "bg-amber-500", label: "Moderate Gap" },
  low: { cell: "bg-status-positive/15 border-status-positive/40 text-status-positive", dot: "bg-status-positive", label: "Low Gap" },
  none: { cell: "bg-muted/40 border-border text-muted-foreground", dot: "bg-muted-foreground/40", label: "Insufficient Data" },
};

function MaharashtraDistrictGrid() {
  const counts = DISTRICT_GRID.reduce(
    (acc, d) => { acc[d.intensity] = (acc[d.intensity] ?? 0) + 1; return acc; },
    {} as Record<string, number>,
  );
  return (
    <div className="rounded-lg border bg-card p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">District Skill Gap Intensity</p>
          <h4 className="text-sm font-semibold">Maharashtra · 36 Districts</h4>
        </div>
        <StatusBadge status="SYNTHETIC" />
      </div>
      <div className="grid grid-cols-6 sm:grid-cols-9 lg:grid-cols-12 gap-1.5">
        {DISTRICT_GRID.map((d) => {
          const tone = GRID_INTENSITY_TONE[d.intensity];
          return (
            <div
              key={d.code + d.name}
              title={`${d.name} — ${tone.label}`}
              className={cn(
                "aspect-square rounded-md border flex flex-col items-center justify-center gap-0.5 transition-transform hover:scale-105 hover:shadow-sm cursor-default",
                tone.cell,
              )}
            >
              <span className="size-1.5 rounded-full" style={{ backgroundColor: "currentColor" }} />
              <span className="text-[8px] font-bold tracking-tight">{d.code}</span>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 border-t text-[10px]">
        {Object.entries(GRID_INTENSITY_TONE).map(([k, v]) => (
          <span key={k} className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span className={cn("size-2 rounded-full", v.dot)} />
            {v.label}
            <span className="font-medium text-foreground/70">({counts[k] ?? 0})</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  Section label — small "01 / Labour Market Pulse" prefix
// ─────────────────────────────────────────────────────────────────────
function SectionLabel({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="font-mono font-bold text-primary tabular-nums">{index}</span>
      <span className="h-px w-6 bg-primary/30" />
      <span className="uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  Labour Market Pulse — four trend bars
// ─────────────────────────────────────────────────────────────────────
function LabourMarketPulse() {
  return (
    <div className="rounded-lg border bg-card p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Live Market Signals</p>
          <h4 className="text-sm font-semibold">Maharashtra · Q1 2026</h4>
        </div>
        <StatusBadge status="SYNTHETIC" />
      </div>
      <div className="space-y-3">
        <VisualBar label="Demand Trend (Industrial Automation)" value={88} tone="attention" height="md" icon={<TrendingUp className="size-3" />} />
        <VisualBar label="Emerging Skills (IoT, Robotics, EV)" value={72} tone="info" height="md" icon={<Sparkles className="size-3" />} />
        <VisualBar label="Top Roles Hiring (PLC / Robotics Tech)" value={81} tone="info" height="md" icon={<Briefcase className="size-3" />} />
        <VisualBar label="District Pressure (Hotspot Districts)" value={64} tone="critical" height="md" icon={<MapPin className="size-3" />} />
      </div>
      <div className="grid grid-cols-3 gap-2 pt-3 border-t">
        {[
          { l: "Demand ↑", v: "Strong", t: "text-status-attention" },
          { l: "Coverage", v: "Partial", t: "text-status-info" },
          { l: "Confidence", v: "HIGH", t: "text-status-positive" },
        ].map((s) => (
          <div key={s.l} className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.l}</p>
            <p className={cn("text-sm font-bold", s.t)}>{s.v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  Evidence + Gap preview side-by-side
// ─────────────────────────────────────────────────────────────────────
function EvidencePreview() {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <EvidenceChain
        items={[
          { icon: <FileText className="size-3" />, label: "Assessment", detail: "Scored", verified: true },
          { icon: <Briefcase className="size-3" />, label: "Project", detail: "Built", verified: true },
          { icon: <Award className="size-3" />, label: "Certificate", detail: "Issued", verified: true },
          { icon: <Activity className="size-3" />, label: "Practice", detail: "Logged", verified: true },
          { icon: <Users className="size-3" />, label: "Employer Validation", detail: "Verified", verified: true },
        ]}
        demonstratedLevel="DEMONSTRATED PROFICIENCY"
        confidence="HIGH"
      />
      <div className="rounded-lg border bg-card p-4 space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Target className="size-4 text-primary" />
          <h4 className="text-sm font-semibold">Gap Matrix Preview</h4>
        </div>
        <GapMatrix rows={[
          { skill: "PLC Programming", demand: "HIGH", supply: "MEDIUM", gap: "MODERATE_GAP", confidence: "HIGH" },
          { skill: "SCADA", demand: "MEDIUM", supply: "MEDIUM", gap: "LOW_GAP", confidence: "MEDIUM" },
          { skill: "Industrial IoT", demand: "HIGH", supply: "LOW", gap: "HIGH_GAP", confidence: "MEDIUM" },
          { skill: "Robotics", demand: "MEDIUM", supply: "LOW", gap: "MODERATE_GAP", confidence: "LOW" },
        ]} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  Government intervention signals
// ─────────────────────────────────────────────────────────────────────
const GOV_SIGNALS = [
  {
    title: "Industrial IoT (Pune · Nagpur)",
    market: "Demand +95 / Supply 20",
    training: "No public course in 5 districts",
    cause: "Curriculum last revised 2021; trainers lack IoT bench kits.",
    action: "Authorise IoT bench procurement + 2 new courses in Pune/Nagpur.",
  },
  {
    title: "Robotics Technician (Mumbai · Thane)",
    market: "Demand +78 / Supply 31",
    training: "Equipment readiness LOW in 4 centres",
    cause: "Trainers certified on legacy PLCs only.",
    action: "Cross-train 18 trainers on cobots; certify 2 master-trainers.",
  },
  {
    title: "EV Service Technician (Aurangabad · Nashik)",
    market: "Demand +66 / Supply 22",
    training: "Course PARTIAL in 3 centres",
    cause: "OEM partnership not yet activated.",
    action: "Activate OEM MoU; equip 3 centres with EV training rigs.",
  },
];

// ─────────────────────────────────────────────────────────────────────
//  Main component
// ─────────────────────────────────────────────────────────────────────
export function LandingScreen() {
  const login = useAuth((s) => s.login);
  const status = useAuth((s) => s.status);
  const error = useAuth((s) => s.error);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
  const [activeLoop, setActiveLoop] = useState<number | undefined>(undefined);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { data: meta } = useFetch<PlatformMeta>("/api/v1/meta");

  const counts = meta?.counts ?? {};
  const mh = meta?.marketHealth ?? {};

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };
  const fillDemo = (acc: DemoAccount) => {
    setEmail(acc.email);
    setPassword(acc.password);
  };

  const openLogin = (workspace?: string) => {
    if (workspace) setSelectedWorkspace(workspace);
    setShowLogin(true);
  };

  const heroStats = [
    { label: "Districts", value: counts.districts ?? 0, icon: <MapPin className="size-3.5" /> },
    { label: "Skills", value: counts.skills ?? 0, icon: <Sparkles className="size-3.5" /> },
    { label: "Market Signals", value: mh.marketSignals ?? 0, icon: <TrendingUp className="size-3.5" /> },
    { label: "Training Centres", value: counts.trainingCentres ?? 0, icon: <GraduationCap className="size-3.5" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ─────────── Header ─────────── */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between gap-4">
          <a href="#top" className="flex items-center gap-3 shrink-0">
            <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm shadow-sm">KD</div>
            <div className="hidden sm:block">
              <p className="text-base font-bold tracking-tight leading-none">KAUSHAL DRISHTI</p>
              <p className="text-[10px] text-muted-foreground leading-tight mt-1">Maharashtra Skill Intelligence & Planning Platform</p>
            </div>
          </a>

          <nav className="hidden lg:flex items-center gap-1">
            {PUBLIC_NAV.map((item, i) => (
              <a
                key={item}
                href={i === 0 ? "#top" : `#${item.toLowerCase().replace(/[^a-z]+/g, "-")}`}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  i === 0 ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" onClick={() => openLogin()}>
              <ShieldCheck className="size-3.5" /> Login
            </Button>
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button size="icon" variant="outline" className="lg:hidden" aria-label="Open navigation">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetTitle className="px-1 pt-2 text-base font-bold">KAUSHAL DRISHTI</SheetTitle>
                <SheetDescription className="px-1 text-[11px]">Maharashtra Skill Intelligence</SheetDescription>
                <nav className="flex flex-col gap-1 px-1">
                  {PUBLIC_NAV.map((item, i) => (
                    <a
                      key={item}
                      href={i === 0 ? "#top" : `#${item.toLowerCase().replace(/[^a-z]+/g, "-")}`}
                      onClick={() => setMobileNavOpen(false)}
                      className="px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      {item}
                    </a>
                  ))}
                </nav>
                <div className="mt-auto p-2">
                  <Button size="sm" className="w-full" onClick={() => { setMobileNavOpen(false); openLogin(); }}>
                    <ShieldCheck className="size-3.5" /> Access Workspace
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* ─────────── Hero ─────────── */}
      <section id="top" className="relative overflow-hidden border-b">
        <MaharashtraIntelligenceBackground variant="hero" className="absolute inset-0 opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/30 to-background" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 md:py-24 lg:py-28 text-center">
          <Badge variant="outline" className="mb-6 border-primary/30 bg-background/60 backdrop-blur text-primary">
            <span className="size-1.5 rounded-full bg-status-positive mr-1.5" />
            Maharashtra Skill Intelligence
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-none text-foreground">
            KAUSHAL DRISHTI
          </h1>
          <p className="mt-3 text-base sm:text-lg lg:text-xl font-semibold text-primary">
            Maharashtra Skill Intelligence &amp; Planning Platform
          </p>
          <p className="mt-5 text-base sm:text-lg lg:text-xl font-medium text-foreground max-w-2xl mx-auto">
            From Labour-Market Evidence to Better Skill Decisions.
          </p>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Connect industry demand, workforce skills and training capability to make evidence-based skill development decisions.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" onClick={() => document.getElementById("labour-market")?.scrollIntoView({ behavior: "smooth" })}>
              <TrendingUp className="size-4" /> Explore Skill Intelligence
            </Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById("districts")?.scrollIntoView({ behavior: "smooth" })}>
              <MapPin className="size-4" /> Explore Districts
            </Button>
            <Button size="lg" variant="ghost" onClick={() => openLogin()}>
              <ShieldCheck className="size-4" /> Access Workspace
            </Button>
          </div>

          {/* Minimal live intelligence preview (4 numbers — visual, not numeric dump) */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {heroStats.map((s) => (
              <div key={s.label} className="rounded-lg border bg-background/70 backdrop-blur p-3 shadow-sm">
                <div className="flex items-center justify-center text-primary mb-1">{s.icon}</div>
                <p className="text-xl font-bold tabular-nums">
                  <AnimatedCounter value={s.value} />
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── Skill Decision Loop ─────────── */}
      <section className="border-b bg-background">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-5 order-2 lg:order-1">
            <SectionLabel index="00" label="Conceptual Identity" />
            <div>
              <h2 className="text-2xl lg:text-4xl font-bold tracking-tight">The Skill Decision Loop</h2>
              <p className="mt-3 text-base text-muted-foreground max-w-lg">
                One intelligence loop connecting every stakeholder.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 pt-2">
              {LOOP_NOTES.map((n) => (
                <button
                  key={n.n}
                  onClick={() => setActiveLoop(activeLoop === n.n - 1 ? undefined : n.n - 1)}
                  className={cn(
                    "text-left flex items-start gap-2 rounded-md p-2 transition-colors",
                    activeLoop === n.n - 1 ? "bg-primary/5" : "hover:bg-accent/60",
                  )}
                >
                  <span className={cn(
                    "flex size-6 items-center justify-center rounded-full text-[11px] font-bold shrink-0",
                    activeLoop === n.n - 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}>
                    {n.n}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold">{n.label}</span>
                    <span className="block text-[11px] text-muted-foreground leading-snug">{n.detail}</span>
                  </span>
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => openLogin()}>
              Explore the loop in your workspace <ArrowRight className="size-3.5" />
            </Button>
          </div>
          <div className="order-1 lg:order-2">
            <div className="rounded-2xl border bg-gradient-to-br from-card to-muted/30 p-6 lg:p-10 shadow-sm">
              <SkillDecisionLoop size="lg" activeStep={activeLoop} onStepClick={(i) => setActiveLoop(activeLoop === i ? undefined : i)} />
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── 5 Visual Intelligence Blocks ─────────── */}

      {/* Block 01 — Labour Market Pulse */}
      <section id="labour-market" className="border-b bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <SectionLabel index="01" label="Labour Market Pulse" />
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">Where the demand is — today and tomorrow.</h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
              Live market signals aggregated from job postings, employer surveys and industry consultations across Maharashtra — visualised, not tabulated.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="secondary" className="gap-1"><TrendingUp className="size-3 text-status-attention" /> Industrial Automation ↑</Badge>
              <Badge variant="secondary" className="gap-1"><Sparkles className="size-3 text-status-info" /> IoT · Robotics · EV</Badge>
              <Badge variant="secondary" className="gap-1"><Network className="size-3 text-status-positive" /> 10 Emerging Skills</Badge>
            </div>
          </div>
          <LabourMarketPulse />
        </div>
      </section>

      {/* Block 02 — Where are the skill gaps? */}
      <section id="districts" className="border-b bg-background">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-4 order-2 lg:order-1">
            <SectionLabel index="02" label="Where Are The Skill Gaps?" />
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">See the gaps the way the State sees them.</h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
              Every district&apos;s skill gap visualised by intensity and confidence — from critical hotspots in Mumbai, Pune, Nagpur and Aurangabad to emerging gaps in industrial belts.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-md border bg-card p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Critical Districts</p>
                <p className="text-lg font-bold text-status-critical tabular-nums">4</p>
              </div>
              <div className="rounded-md border bg-card p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">High-Intensity Districts</p>
                <p className="text-lg font-bold text-status-attention tabular-nums">8</p>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <MaharashtraDistrictGrid />
          </div>
        </div>
      </section>

      {/* Block 03 — Demand vs Training */}
      <section id="skill-intelligence" className="border-b bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
          <div className="max-w-2xl mb-8">
            <SectionLabel index="03" label="Demand vs Training" />
            <h2 className="mt-3 text-2xl lg:text-3xl font-bold tracking-tight">High demand. Low training coverage.</h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Side-by-side visualisation of market demand versus current training coverage — the demand–supply gap that drives every planning decision.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <DemandSupplyComparison skill="PLC Programming" demandValue={88} supplyValue={65} />
            <DemandSupplyComparison skill="SCADA" demandValue={72} supplyValue={58} />
            <DemandSupplyComparison skill="Industrial IoT" demandValue={95} supplyValue={20} />
          </div>
        </div>
      </section>

      {/* Block 04 — Evidence, Not Claims */}
      <section id="training-ecosystem" className="border-b bg-background">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
          <div className="max-w-2xl mb-8">
            <SectionLabel index="04" label="Evidence, Not Claims" />
            <h2 className="mt-3 text-2xl lg:text-3xl font-bold tracking-tight">Every proficiency is demonstrated, not declared.</h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              A candidate&apos;s skill level is only as trustworthy as the evidence behind it. Each proficiency flows through a structured chain — Assessment → Project → Certificate → Practice → Employer Validation → Demonstrated Proficiency.
            </p>
          </div>
          <EvidencePreview />
        </div>
      </section>

      {/* Block 05 — What Should Government Do? */}
      <section id="industry-&-employers" className="border-b bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
          <div className="max-w-2xl mb-8">
            <SectionLabel index="05" label="What Should Government Do?" />
            <h2 className="mt-3 text-2xl lg:text-3xl font-bold tracking-tight">From gap to intervention to projected effect.</h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Each priority signal traces the causal chain: Gap → Cause → Possible Intervention → Projected Effect. Open the Policy Sandbox to simulate scenarios before committing state resources.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {GOV_SIGNALS.map((sig) => (
              <PrioritySignal
                key={sig.title}
                title={sig.title}
                market={sig.market}
                training={sig.training}
                cause={sig.cause}
                action={sig.action}
                onClick={() => openLogin("government")}
              />
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button onClick={() => openLogin("government")}>
              <ShieldCheck className="size-4" /> Open Policy Sandbox
            </Button>
            <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1.5">
              <StatusBadge status="SIMULATED" />
              Projected effects are scenario outputs, not forecasts.
            </span>
          </div>
        </div>
      </section>

      {/* ─────────── About / Access ─────────── */}
      <section id="about" className="border-b bg-background">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:py-20 text-center space-y-6">
          <SectionLabel index="06" label="Access The Platform" />
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight max-w-2xl mx-auto">One intelligence engine. Different stakeholder workspaces.</h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Select a workspace to enter KAUSHAL DRISHTI with the appropriate intelligence scope and decision rights.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 max-w-5xl mx-auto">
            {WORKSPACES.map((ws) => (
              <button
                key={ws.id}
                onClick={() => openLogin(ws.id)}
                className="text-left rounded-lg border bg-card p-5 space-y-3 hover:border-primary/40 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-2 text-primary">
                  {ws.icon}
                  <span className="text-sm font-semibold">{ws.label}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{ws.desc}</p>
                <div className="flex items-center gap-1 text-xs text-primary font-medium">
                  <span>Access workspace</span>
                  <ArrowRight className="size-3" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── Footer (ONE subtle note only) ─────────── */}
      <footer className="mt-auto border-t bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-status-attention" />
            Prototype environment using synthetic demonstration data.
          </span>
          <span>KAUSHAL DRISHTI · Maharashtra Skill Intelligence &amp; Planning Platform</span>
        </div>
      </footer>

      {/* ─────────── Login Modal ─────────── */}
      {showLogin ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowLogin(false)}
        >
          <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <Card className="shadow-xl">
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Access KAUSHAL DRISHTI</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedWorkspace ? WORKSPACES.find((w) => w.id === selectedWorkspace)?.label + " Workspace" : "Select a workspace and sign in"}
                    </p>
                  </div>
                  <button onClick={() => setShowLogin(false)} className="text-muted-foreground hover:text-foreground text-xl leading-none" aria-label="Close">×</button>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {WORKSPACES.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={() => setSelectedWorkspace(ws.id)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors",
                        selectedWorkspace === ws.id ? "border-primary bg-primary/5 text-primary" : "text-muted-foreground hover:bg-accent",
                      )}
                    >
                      {ws.icon} {ws.label}
                    </button>
                  ))}
                </div>

                <form onSubmit={submit} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="you@kaushal-drishti.demo" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  {error ? (
                    <div className="rounded-md border border-status-critical/30 bg-status-critical/5 px-3 py-2 text-xs text-status-critical">{error}</div>
                  ) : null}
                  <Button type="submit" className="w-full" disabled={status === "loading"}>
                    {status === "loading" ? "Signing in…" : "Sign in"} <ArrowRight className="size-4" />
                  </Button>
                </form>

                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Quick Access</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1 scroll-thin">
                    {DEMO_ACCOUNTS.filter((a) => !selectedWorkspace || a.workspace === selectedWorkspace).map((acc) => (
                      <button
                        key={acc.email}
                        onClick={() => fillDemo(acc)}
                        className="text-left rounded-md border p-2 hover:bg-accent/40 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center gap-1.5 mb-0.5 text-muted-foreground">
                          {acc.icon}
                          <span className="text-xs font-medium truncate">{acc.name}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-snug">{acc.description}</p>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center pt-1">Synthetic demonstration identities.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
