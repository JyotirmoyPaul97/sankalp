"use client";

import * as React from "react";
import { useState } from "react";
import {
  Activity, ArrowRight, Building2, ShieldCheck, Users, GraduationCap,
  TrendingUp, MapPin, Sparkles, Database, ChevronRight, Globe, Accessibility,
  HelpCircle, AlertTriangle, CheckCircle2, Network, Layers3, Target,
  FileText, AlertCircle, Clock, Award, Briefcase, Gauge,
} from "lucide-react";
import { useAuth } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFetch } from "@/hooks/use-fetch";
import { AnimatedCounter, VisualBar, EvidenceChain, StatusBadge, ConfidenceBadge, FlowNode, DemandSupplyComparison, GapMatrix } from "@/components/kaushal/visual-components";
import type { PlatformMeta } from "@/types/domain";

interface DemoAccount { email: string; password: string; name: string; role: string; description: string; icon: React.ReactNode; workspace: string; }
const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: "admin@kaushal-drishti.demo", password: "demo-admin", name: "Demo State Admin", role: "STATE_ADMIN", description: "Full state-wide intelligence and planning.", icon: <ShieldCheck className="size-4" />, workspace: "government" },
  { email: "planner@kaushal-drishti.demo", password: "demo-planner", name: "Demo District Planner", role: "DISTRICT_PLANNER", description: "District-scoped planning.", icon: <Building2 className="size-4" />, workspace: "government" },
  { email: "employer@kaushal-drishti.demo", password: "demo-employer", name: "Demo Employer", role: "EMPLOYER", description: "Demand validation and feedback.", icon: <Users className="size-4" />, workspace: "industry" },
  { email: "provider@kaushal-drishti.demo", password: "demo-provider", name: "Demo Training Provider", role: "TRAINING_PROVIDER", description: "Course and capacity management.", icon: <GraduationCap className="size-4" />, workspace: "training" },
];

const WORKSPACES = [
  { id: "government", label: "Government", icon: <ShieldCheck className="size-5" />, desc: "State & district intelligence, policy sandbox, planning" },
  { id: "industry", label: "Industry & Employer", icon: <Users className="size-5" />, desc: "Hiring demand, skill validation, industry signals" },
  { id: "training", label: "Training Ecosystem", icon: <GraduationCap className="size-5" />, desc: "Courses, curriculum, trainers, centre readiness" },
  { id: "candidate", label: "Candidate / Beneficiary", icon: <Activity className="size-5" />, desc: "Skill passport, gaps, development pathway" },
];

const FLOW_STEPS = [
  { icon: <Users className="size-4" />, label: "Industry & Employer Demand", detail: "Job postings, surveys, consultations" },
  { icon: <TrendingUp className="size-4" />, label: "Market Intelligence", detail: "Demand signals, trends, emerging skills" },
  { icon: <GraduationCap className="size-4" />, label: "Training Ecosystem", detail: "Courses, curriculum, capacity" },
  { icon: <AlertCircle className="size-4" />, label: "Skill Gaps", detail: "Demand–supply mismatch" },
  { icon: <Activity className="size-4" />, label: "Candidate Capability", detail: "Evidence, gaps, readiness" },
  { icon: <CheckCircle2 className="size-4" />, label: "Outcomes", detail: "Placement, certification, feedback" },
  { icon: <ShieldCheck className="size-4" />, label: "Government Planning", detail: "Policy sandbox, district plans" },
];

export function LandingScreen() {
  const login = useAuth((s) => s.login);
  const status = useAuth((s) => s.status);
  const error = useAuth((s) => s.error);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
  const [activeFlowStep, setActiveFlowStep] = useState<number | null>(null);
  const { data: meta } = useFetch<PlatformMeta>("/api/v1/meta");

  const counts = meta?.counts ?? {};
  const mh = meta?.marketHealth ?? {};

  const metrics = [
    { label: "Districts", value: counts.districts ?? 0, icon: <MapPin className="size-4" /> },
    { label: "Skills", value: counts.skills ?? 0, icon: <Sparkles className="size-4" /> },
    { label: "Market Signals", value: mh.marketSignals ?? 0, icon: <TrendingUp className="size-4" /> },
    { label: "Training Centres", value: counts.trainingCentres ?? 0, icon: <GraduationCap className="size-4" /> },
    { label: "Emerging Skills", value: mh.emergingSignals ?? 0, icon: <Network className="size-4" /> },
  ];

  const submit = async (e: React.FormEvent) => { e.preventDefault(); await login(email, password); };
  const fillDemo = (acc: DemoAccount) => { setEmail(acc.email); setPassword(acc.password); };

  return (
    <div className="min-h-screen bg-background">
      {/* Top utility strip */}
      <div className="border-b bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-4 py-1.5 text-[11px]">
          <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-status-attention animate-pulse" /> Prototype · Synthetic Data</span>
          <div className="flex items-center gap-3">
            <button className="hover:underline">English</button><span className="opacity-50">|</span>
            <button className="hover:underline">मराठी</button><span className="opacity-50">|</span>
            <button className="flex items-center gap-1 hover:underline"><Accessibility className="size-3" /> Accessibility</button><span className="opacity-50">|</span>
            <button className="flex items-center gap-1 hover:underline"><HelpCircle className="size-3" /> Help</button>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">KD</div>
            <div>
              <p className="text-base font-bold tracking-tight">KAUSHAL DRISHTI</p>
              <p className="text-[10px] text-muted-foreground leading-tight">Maharashtra Skill Intelligence & Planning Platform</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {["Home", "Skill Intelligence", "Districts", "Training", "Industry", "Reports"].map((item, i) => (
              <button key={item} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${i === 0 ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"}`}>{item}</button>
            ))}
          </nav>
          <Button size="sm" onClick={() => setShowLogin(true)}><ShieldCheck className="size-3.5" /> Government Access</Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-20 relative grid lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <Badge className="surface-info border-transparent text-[11px]"><span className="size-1.5 rounded-full bg-status-info mr-1 animate-pulse" /> Prototype · Synthetic Demonstration</Badge>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">KAUSHAL DRISHTI</h1>
              <p className="text-lg font-semibold text-primary mt-2">Maharashtra Skill Intelligence & Planning Platform</p>
            </div>
            <p className="text-base font-medium text-foreground"><strong>From Labour-Market Evidence to Better Skill Decisions.</strong></p>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">One evidence-driven intelligence layer connecting industry demand, Maharashtra's training ecosystem, candidate capability and government skill planning.</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={() => document.getElementById("intelligence")?.scrollIntoView({ behavior: "smooth" })}><TrendingUp className="size-4" /> Explore Skill Intelligence</Button>
              <Button size="lg" variant="outline" onClick={() => setShowLogin(true)}><ShieldCheck className="size-4" /> Government Access</Button>
              <Button size="lg" variant="ghost" onClick={() => document.getElementById("map")?.scrollIntoView({ behavior: "smooth" })}><MapPin className="size-4" /> Explore Districts</Button>
            </div>
          </div>

          {/* Animated intelligence flow */}
          <div className="relative">
            <div className="rounded-2xl border bg-card p-6 shadow-lg">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-4 text-center">Intelligence Flow</p>
              <div className="flex flex-col items-center gap-1">
                {FLOW_STEPS.map((step, i) => (
                  <React.Fragment key={i}>
                    <FlowNode icon={step.icon} label={step.label} detail={step.detail} active={activeFlowStep === i} onClick={() => setActiveFlowStep(activeFlowStep === i ? null : i)} />
                    {i < FLOW_STEPS.length - 1 ? <div className="flex flex-col items-center"><div className="w-px h-3 bg-border" /><ArrowRight className="size-3 text-muted-foreground rotate-90" /></div> : null}
                  </React.Fragment>
                ))}
                <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground"><span className="size-1.5 rounded-full bg-status-attention" /> Feedback Loop</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Intelligence snapshot with animated counters */}
      <section id="intelligence" className="border-b bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <div><h2 className="text-xl font-semibold">Maharashtra Skill Intelligence</h2><p className="text-sm text-muted-foreground mt-1">Live from the intelligence engine.</p></div>
            <StatusBadge status="SYNTHETIC" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {metrics.map((m) => (
              <Card key={m.label} className="p-4 space-y-2 shadow-sm text-center">
                <div className="flex justify-center text-primary">{m.icon}</div>
                <p className="text-3xl font-bold"><AnimatedCounter value={m.value} /></p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — visual flow */}
      <section className="border-b">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <h2 className="text-xl font-semibold text-center mb-2">How KAUSHAL DRISHTI Works</h2>
          <p className="text-sm text-muted-foreground text-center mb-8">One intelligence engine. Different stakeholder workspaces.</p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-1 flex-wrap">
            {FLOW_STEPS.map((step, i, arr) => (
              <React.Fragment key={i}>
                <FlowNode icon={step.icon} label={step.label} detail={step.detail} />
                {i < arr.length - 1 ? <ArrowRight className="size-4 text-muted-foreground rotate-90 md:rotate-0 shrink-0" /> : null}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Visual demand vs supply */}
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <h2 className="text-xl font-semibold mb-2">Where Demand Meets Training</h2>
          <p className="text-sm text-muted-foreground mb-6">Visual comparison of market demand vs training coverage.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <DemandSupplyComparison skill="PLC Programming" demandValue={88} supplyValue={65} />
            <DemandSupplyComparison skill="SCADA" demandValue={72} supplyValue={58} />
            <DemandSupplyComparison skill="Industrial IoT" demandValue={95} supplyValue={20} />
          </div>
        </div>
      </section>

      {/* Evidence visualization */}
      <section className="border-b">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <h2 className="text-xl font-semibold mb-2">Evidence, Not Claims</h2>
          <p className="text-sm text-muted-foreground mb-6">Every skill level is backed by structured evidence.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <EvidenceChain
              items={[
                { icon: <FileText className="size-3" />, label: "Self-Declared", detail: "Advanced", verified: true },
                { icon: <Award className="size-3" />, label: "Assessment", detail: "Intermediate", verified: true },
                { icon: <Briefcase className="size-3" />, label: "Project", detail: "Advanced", verified: true },
                { icon: <ShieldCheck className="size-3" />, label: "Certificate", detail: "Verified", verified: true },
                { icon: <Users className="size-3" />, label: "Employer", detail: "Verified", verified: false },
              ]}
              demonstratedLevel="INTERMEDIATE"
              confidence="HIGH"
            />
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2"><Target className="size-4 text-primary" /><h4 className="text-sm font-semibold">Gap Matrix Preview</h4></div>
              <GapMatrix rows={[
                { skill: "PLC Programming", demand: "HIGH", supply: "MEDIUM", gap: "MODERATE_GAP", confidence: "HIGH" },
                { skill: "SCADA", demand: "MEDIUM", supply: "MEDIUM", gap: "LOW_GAP", confidence: "MEDIUM" },
                { skill: "Industrial IoT", demand: "HIGH", supply: "LOW", gap: "HIGH_GAP", confidence: "MEDIUM" },
                { skill: "Robotics", demand: "MEDIUM", supply: "LOW", gap: "MODERATE_GAP", confidence: "LOW" },
              ]} />
            </div>
          </div>
        </div>
      </section>

      {/* Workspace selector */}
      <section id="workspaces" className="border-b bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <h2 className="text-xl font-semibold text-center mb-2">Access KAUSHAL DRISHTI</h2>
          <p className="text-sm text-muted-foreground text-center mb-8">One intelligence engine. Different stakeholder workspaces.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {WORKSPACES.map((ws) => (
              <button key={ws.id} onClick={() => { setSelectedWorkspace(ws.id); setShowLogin(true); }} className="text-left rounded-lg border bg-card p-5 space-y-3 hover:border-primary/40 hover:shadow-md transition-all">
                <div className="flex items-center gap-2 text-primary">{ws.icon}<span className="text-sm font-semibold">{ws.label}</span></div>
                <p className="text-xs text-muted-foreground leading-relaxed">{ws.desc}</p>
                <div className="flex items-center gap-1 text-xs text-primary font-medium"><span>Access workspace</span><ArrowRight className="size-3" /></div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-status-attention" /><span>Prototype · Synthetic Data. Not actual Maharashtra Government data.</span></div>
          <span>KAUSHAL DRISHTI · Maharashtra Skill Intelligence & Planning Platform</span>
        </div>
      </footer>

      {/* Login modal */}
      {showLogin ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowLogin(false)}>
          <div className="w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <Card className="shadow-xl">
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div><h3 className="text-lg font-semibold">Access KAUSHAL DRISHTI</h3><p className="text-xs text-muted-foreground">{selectedWorkspace ? WORKSPACES.find(w => w.id === selectedWorkspace)?.label + " Workspace" : "Select workspace and sign in"}</p></div>
                  <button onClick={() => setShowLogin(false)} className="text-muted-foreground hover:text-foreground text-xl">×</button>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {WORKSPACES.map((ws) => (
                    <button key={ws.id} onClick={() => setSelectedWorkspace(ws.id)} className={`flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors ${selectedWorkspace === ws.id ? "border-primary bg-primary/5 text-primary" : "text-muted-foreground hover:bg-accent"}`}>{ws.icon} {ws.label}</button>
                  ))}
                </div>
                <form onSubmit={submit} className="space-y-3">
                  <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="you@kaushal-drishti.demo" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                  <div className="space-y-1.5"><Label htmlFor="password">Password</Label><Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                  {error ? <div className="rounded-md border border-status-critical/30 bg-status-critical/5 px-3 py-2 text-xs text-status-critical">{error}</div> : null}
                  <Button type="submit" className="w-full" disabled={status === "loading"}>{status === "loading" ? "Signing in…" : "Sign in"} <ArrowRight className="size-4" /></Button>
                </form>
                <div className="space-y-2">
                  <div className="flex items-center gap-3"><div className="h-px flex-1 bg-border" /><span className="text-[10px] uppercase tracking-wider text-muted-foreground">Quick Demo Access</span><div className="h-px flex-1 bg-border" /></div>
                  <div className="grid sm:grid-cols-2 gap-1.5">
                    {DEMO_ACCOUNTS.filter(a => !selectedWorkspace || a.workspace === selectedWorkspace).map((acc) => (
                      <button key={acc.email} onClick={() => fillDemo(acc)} className="text-left rounded-md border p-2 hover:bg-accent/40 transition-colors">
                        <div className="flex items-center gap-1.5 mb-0.5 text-muted-foreground">{acc.icon}<span className="text-xs font-medium truncate">{acc.name}</span></div>
                        <p className="text-[10px] text-muted-foreground leading-snug">{acc.description}</p>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center pt-1">Demo Accounts — synthetic identities.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
