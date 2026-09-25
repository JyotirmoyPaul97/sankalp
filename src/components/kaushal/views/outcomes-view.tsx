"use client";

import * as React from "react";
import { Target, ArrowRight, CheckCircle2, AlertTriangle, TrendingUp, Activity } from "lucide-react";
import { PageHeader, SectionLabel } from "@/components/kaushal/page-header";
import { EvidencePanel } from "@/components/kaushal/evidence-panel";
import { StatusPill } from "@/components/kaushal/status-pill";
import { StatusBadge, ConfidenceBadge, SkillJourneyFlow } from "@/components/kaushal/visual-components";
import { LoadingState } from "@/components/kaushal/states";
import { useFetch } from "@/hooks/use-fetch";
import { useNav } from "@/store/app-store";

export function OutcomesView() {
  const setActiveView = useNav((s) => s.setActiveView);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Outcome Intelligence"
        description="Placement outcomes, employer satisfaction, intervention results, and the feedback loop that updates district intelligence."
        badge={<StatusBadge status="SYNTHETIC" />}
      />

      {/* Outcome loop visual */}
      <EvidencePanel title="Outcome Feedback Loop" source="Intelligence Engine" confidence="high">
        <SkillJourneyFlow steps={[
          { icon: <Target className="size-4" />, label: "Plan", detail: "District plan approved", tone: "info" },
          { icon: <Activity className="size-4" />, label: "Implement", detail: "Training intervention", tone: "info" },
          { icon: <CheckCircle2 className="size-4" />, label: "Train", detail: "Candidates trained", tone: "neutral" },
          { icon: <TrendingUp className="size-4" />, label: "Assess", detail: "Skill verified", tone: "neutral" },
          { icon: <Target className="size-4" />, label: "Place", detail: "Candidate placed", tone: "positive" },
          { icon: <Activity className="size-4" />, label: "Feedback", detail: "Employer feedback", tone: "positive" },
          { icon: <CheckCircle2 className="size-4" />, label: "Learn", detail: "Intelligence updated", tone: "positive" },
        ]} />
        <p className="text-[11px] text-muted-foreground mt-3">
          The feedback loop connects training outcomes back to market intelligence, gap analysis, and policy simulation — creating continuous improvement.
          Pre/post comparison only. Other factors may have contributed. NO causal claim without valid evaluation design.
        </p>
      </EvidencePanel>

      {/* Navigation to outcome views */}
      <section className="grid sm:grid-cols-3 gap-3">
        <button onClick={() => setActiveView("outcomes")} className="text-left rounded-lg border bg-card p-4 space-y-1.5 hover:border-primary/40 hover:bg-accent/30 transition-colors">
          <div className="flex items-center gap-2 text-primary"><Activity className="size-4" /><span className="text-sm font-medium">District Outcomes</span></div>
          <p className="text-xs text-muted-foreground">Intervention tracking, KPIs, pre/post comparison.</p>
        </button>
        <button onClick={() => setActiveView("district-twin")} className="text-left rounded-lg border bg-card p-4 space-y-1.5 hover:border-primary/40 hover:bg-accent/30 transition-colors">
          <div className="flex items-center gap-2 text-primary"><Target className="size-4" /><span className="text-sm font-medium">Digital Twin</span></div>
          <p className="text-xs text-muted-foreground">Connected district intelligence + intervention state.</p>
        </button>
        <button onClick={() => setActiveView("policy-sandbox")} className="text-left rounded-lg border bg-card p-4 space-y-1.5 hover:border-primary/40 hover:bg-accent/30 transition-colors">
          <div className="flex items-center gap-2 text-primary"><TrendingUp className="size-4" /><span className="text-sm font-medium">Policy Sandbox</span></div>
          <p className="text-xs text-muted-foreground">Simulated scenarios and projected outcomes.</p>
        </button>
      </section>

      {/* Key outcome metrics */}
      <section className="space-y-3">
        <SectionLabel>Key Outcome Indicators</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border bg-card p-4 space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Training Completions</p>
            <p className="text-2xl font-bold tabular-nums">1,847</p>
            <ConfidenceBadge confidence="HIGH" />
          </div>
          <div className="rounded-lg border bg-card p-4 space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Certifications</p>
            <p className="text-2xl font-bold tabular-nums">1,623</p>
            <ConfidenceBadge confidence="HIGH" />
          </div>
          <div className="rounded-lg border bg-card p-4 space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Placements</p>
            <p className="text-2xl font-bold tabular-nums">1,205</p>
            <ConfidenceBadge confidence="MEDIUM" />
          </div>
          <div className="rounded-lg border bg-card p-4 space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Employer Feedback</p>
            <p className="text-2xl font-bold tabular-nums">342</p>
            <ConfidenceBadge confidence="MEDIUM" />
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">All values are SYNTHETIC DEMONSTRATION DATA. Based on ingestion batch records and placement outcome evidence.</p>
      </section>
    </div>
  );
}
