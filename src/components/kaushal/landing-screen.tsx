"use client";

import * as React from "react";
import { useState } from "react";
import {
  Activity, ArrowRight, Building2, ShieldCheck, Users, GraduationCap,
  TrendingUp, MapPin, Sparkles, Database, ChevronRight, Globe, Accessibility,
  HelpCircle, AlertCircle, CheckCircle2, Network, Layers3,
} from "lucide-react";
import { useAuth } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFetch } from "@/hooks/use-fetch";
import type { PlatformMeta } from "@/types/domain";

interface DemoAccount {
  email: string; password: string; name: string; role: string;
  description: string; icon: React.ReactNode; workspace: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: "admin@kaushal-drishti.demo", password: "demo-admin", name: "Demo State Admin", role: "STATE_ADMIN", description: "Full state-wide intelligence and planning control.", icon: <ShieldCheck className="size-4" />, workspace: "government" },
  { email: "planner@kaushal-drishti.demo", password: "demo-planner", name: "Demo District Planner", role: "DISTRICT_PLANNER", description: "District-scoped planning and gap review.", icon: <Building2 className="size-4" />, workspace: "government" },
  { email: "employer@kaushal-drishti.demo", password: "demo-employer", name: "Demo Employer", role: "EMPLOYER", description: "Demand validation and hiring feedback.", icon: <Users className="size-4" />, workspace: "industry" },
  { email: "provider@kaushal-drishti.demo", password: "demo-provider", name: "Demo Training Provider", role: "TRAINING_PROVIDER", description: "Course, capacity and centre management.", icon: <GraduationCap className="size-4" />, workspace: "training" },
];

const WORKSPACES = [
  { id: "government", label: "Government", icon: <ShieldCheck className="size-5" />, desc: "State & district intelligence, policy sandbox, planning" },
  { id: "industry", label: "Industry & Employer", icon: <Users className="size-5" />, desc: "Hiring demand, skill validation, industry signals" },
  { id: "training", label: "Training Ecosystem", icon: <GraduationCap className="size-5" />, desc: "Courses, curriculum, trainers, centre readiness" },
  { id: "candidate", label: "Candidate / Beneficiary", icon: <Activity className="size-5" />, desc: "Skill passport, gaps, development pathway" },
];

export function LandingScreen() {
  const login = useAuth((s) => s.login);
  const status = useAuth((s) => s.status);
  const error = useAuth((s) => s.error);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
  const { data: meta } = useFetch<PlatformMeta>("/api/v1/meta");

  const counts = meta?.counts ?? {};
  const dh = meta?.dataHealth ?? {};
  const kh = meta?.knowledgeHealth ?? {};
  const mh = meta?.marketHealth ?? {};

  const metrics = [
    { label: "Districts Monitored", value: counts.districts ?? 0, icon: <MapPin className="size-4" /> },
    { label: "Skills Mapped", value: counts.skills ?? 0, icon: <Sparkles className="size-4" /> },
    { label: "Job Roles Tracked", value: counts.jobRoles ?? 0, icon: <Users className="size-4" /> },
    { label: "Training Centres", value: counts.trainingCentres ?? 0, icon: <GraduationCap className="size-4" /> },
    { label: "Market Signals", value: mh.marketSignals ?? 0, icon: <TrendingUp className="size-4" /> },
    { label: "Emerging Skills", value: mh.emergingSignals ?? 0, icon: <Network className="size-4" /> },
  ];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  const fillDemo = (acc: DemoAccount) => { setEmail(acc.email); setPassword(acc.password); };

  return (
    <div className="min-h-screen bg-background">
      {/* Top utility strip */}
      <div className="border-b bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-4 py-1.5 text-[11px]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-status-attention animate-pulse" /> Prototype Environment · Synthetic Data</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="hover:underline">English</button>
            <span className="opacity-50">|</span>
            <button className="hover:underline">मराठी</button>
            <span className="opacity-50">|</span>
            <button className="flex items-center gap-1 hover:underline"><Accessibility className="size-3" /> Accessibility</button>
            <span className="opacity-50">|</span>
            <button className="flex items-center gap-1 hover:underline"><HelpCircle className="size-3" /> Help</button>
          </div>
        </div>
      </div>

      {/* Main header */}
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
            {["Home", "Skill Intelligence", "Labour Market", "Districts", "Training Ecosystem", "Industry & Employers", "Reports"].map((item, i) => (
              <button key={item} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${i === 0 ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>{item}</button>
            ))}
          </nav>
          <Button size="sm" onClick={() => setShowLogin(true)}><ShieldCheck className="size-3.5" /> Government Access</Button>
        </div>
      </header>

      {/* Hero section */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-24 relative">
          <div className="max-w-3xl space-y-6">
            <Badge className="surface-info border-transparent text-[11px]">Prototype · Synthetic Demonstration Environment</Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
              KAUSHAL DRISHTI
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              <strong className="text-foreground">From Labour-Market Evidence to Better Skill Decisions.</strong>
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              An evidence-driven intelligence platform connecting industry demand, Maharashtra's training ecosystem, candidate capability and district-level planning through one continuously updated skill intelligence layer.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button size="lg" onClick={() => document.getElementById("intelligence-preview")?.scrollIntoView({ behavior: "smooth" })}>
                <TrendingUp className="size-4" /> Explore Skill Intelligence
              </Button>
              <Button size="lg" variant="outline" onClick={() => setShowLogin(true)}>
                <ShieldCheck className="size-4" /> Government Access
              </Button>
              <Button size="lg" variant="ghost" onClick={() => document.getElementById("district-explorer")?.scrollIntoView({ behavior: "smooth" })}>
                <MapPin className="size-4" /> View District Intelligence
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Intelligence flow */}
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <h2 className="text-xl font-semibold text-center mb-8">How KAUSHAL DRISHTI Works</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-1">
            {[
              { label: "Industry & Employer Demand", icon: <Users className="size-4" /> },
              { label: "Market Intelligence", icon: <TrendingUp className="size-4" /> },
              { label: "Training Ecosystem", icon: <GraduationCap className="size-4" /> },
              { label: "Skill Gaps", icon: <AlertCircle className="size-4" /> },
              { label: "Candidate Capability", icon: <Activity className="size-4" /> },
              { label: "Outcomes", icon: <CheckCircle2 className="size-4" /> },
              { label: "Government Planning", icon: <ShieldCheck className="size-4" /> },
            ].map((step, i, arr) => (
              <React.Fragment key={step.label}>
                <div className="flex flex-col items-center gap-1.5 rounded-lg border bg-card p-3 text-center min-w-[140px] shadow-sm">
                  <div className="text-primary">{step.icon}</div>
                  <span className="text-[11px] font-medium">{step.label}</span>
                </div>
                {i < arr.length - 1 ? <ArrowRight className="size-4 text-muted-foreground rotate-90 md:rotate-0 shrink-0" /> : null}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Intelligence preview with live data */}
      <section id="intelligence-preview" className="border-b">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Maharashtra Skill Intelligence</h2>
              <p className="text-sm text-muted-foreground mt-1">Live from the KAUSHAL DRISHTI intelligence engine.</p>
            </div>
            <Badge className="surface-attention border-transparent text-[11px]"><span className="size-1.5 rounded-full bg-status-attention mr-1" /> Synthetic Demonstration Data</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {metrics.map((m) => (
              <Card key={m.label} className="p-4 space-y-2 shadow-sm">
                <div className="flex items-center gap-2 text-primary">{m.icon}<span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{m.label}</span></div>
                <p className="text-2xl font-bold tabular-nums">{m.value}</p>
              </Card>
            ))}
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mt-6">
            <Card className="p-4 space-y-1 shadow-sm">
              <div className="flex items-center gap-2"><Database className="size-4 text-primary" /><span className="text-sm font-medium">Data Sources</span></div>
              <p className="text-2xl font-bold tabular-nums">{counts.dataSources ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">{dh.activeSources ?? 0} active · {dh.totalBatches ?? 0} ingestion batches</p>
            </Card>
            <Card className="p-4 space-y-1 shadow-sm">
              <div className="flex items-center gap-2"><Network className="size-4 text-primary" /><span className="text-sm font-medium">Knowledge Graph</span></div>
              <p className="text-2xl font-bold tabular-nums">{kh.skillAliases ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">skill aliases · {kh.skillClusters ?? 0} clusters</p>
            </Card>
            <Card className="p-4 space-y-1 shadow-sm">
              <div className="flex items-center gap-2"><Layers3 className="size-4 text-primary" /><span className="text-sm font-medium">Training Ecosystem</span></div>
              <p className="text-2xl font-bold tabular-nums">{counts.trainingProviders ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">providers · {counts.trainingCentres ?? 0} centres · {counts.courses ?? 0} courses</p>
            </Card>
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
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-status-attention" />
            <span>Prototype Environment · Synthetic Demonstration Data. Not actual Maharashtra Government data.</span>
          </div>
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
                  <div>
                    <h3 className="text-lg font-semibold">Access KAUSHAL DRISHTI</h3>
                    <p className="text-xs text-muted-foreground">{selectedWorkspace ? WORKSPACES.find(w => w.id === selectedWorkspace)?.label + " Workspace" : "Select workspace and sign in"}</p>
                  </div>
                  <button onClick={() => setShowLogin(false)} className="text-muted-foreground hover:text-foreground text-xl">×</button>
                </div>

                {/* Workspace tabs */}
                <div className="grid grid-cols-2 gap-1.5">
                  {WORKSPACES.map((ws) => (
                    <button key={ws.id} onClick={() => setSelectedWorkspace(ws.id)} className={`flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors ${selectedWorkspace === ws.id ? "border-primary bg-primary/5 text-primary" : "text-muted-foreground hover:bg-accent"}`}>
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
                  {error ? <div className="rounded-md border border-status-critical/30 bg-status-critical/5 px-3 py-2 text-xs text-status-critical">{error}</div> : null}
                  <Button type="submit" className="w-full" disabled={status === "loading"}>
                    {status === "loading" ? "Signing in…" : "Sign in"} <ArrowRight className="size-4" />
                  </Button>
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
                  <p className="text-[10px] text-muted-foreground text-center pt-1">Demo Accounts — synthetic identities, not actual government users.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
