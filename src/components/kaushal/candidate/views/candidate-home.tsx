"use client";

import * as React from "react";
import { Target, Activity, AlertTriangle, TrendingUp, Award, FileText, Briefcase, ArrowRight, Sparkles } from "lucide-react";
import { useNav } from "@/store/app-store";
import { useFetch } from "@/hooks/use-fetch";
import { LoadingState, ErrorState } from "@/components/kaushal/states";
import { StatusPill } from "@/components/kaushal/status-pill";
import { MetricCard } from "@/components/kaushal/metric-card";
import { VisualBar, FlowNode } from "@/components/kaushal/visual-components";
import { useCandidateMe } from "../use-candidate";
import { profLabel, gapLabel, gapTone } from "../proficiency";

const READINESS_LABEL: Record<string, string> = {
  HIGH_READINESS: "High Readiness", MODERATE_READINESS: "Moderate", DEVELOPING: "Developing",
  LOW_READINESS: "Low Readiness", INSUFFICIENT_DATA: "Insufficient Data",
  READY_FOR_CONSIDERATION: "Ready for Consideration", SIGNIFICANT_GAPS: "Significant Gaps", INSUFFICIENT_EVIDENCE: "Insufficient Evidence",
};
const READINESS_TONE: Record<string, "positive" | "info" | "attention" | "critical" | "neutral"> = {
  HIGH_READINESS: "positive", MODERATE_READINESS: "info", DEVELOPING: "attention", LOW_READINESS: "critical", INSUFFICIENT_DATA: "neutral",
  READY_FOR_CONSIDERATION: "positive", SIGNIFICANT_GAPS: "critical", INSUFFICIENT_EVIDENCE: "neutral",
};

export function CandidateHome() {
  const { data: me, loading, error } = useCandidateMe();
  const setActiveView = useNav((s) => s.setActiveView);
  const candidateId = me?.candidate.id;
  const targetRoleId = me?.targetRole?.targetRoleId;

  const skillsFetch = useFetch<{ skills: { id: string; currentProficiency: string; proficiencyConfidence: number; evidenceCount: number; freshnessStatus: string; status: string; skill: { name: string } }[] }>(
    candidateId ? `/api/v1/candidates/${candidateId}/skills` : null,
  );
  const gapsFetch = useFetch<{ gaps: { id: string; gapType: string; gapSeverity: string | null; requiredProficiency: string; candidateProficiency: string | null; skill: { name: string } | null }[] }>(
    candidateId ? `/api/v1/candidates/${candidateId}/gaps` : null,
  );
  const readinessFetch = useFetch<{ readiness: { overallReadinessSignal: string; skillCoverage: number; evidenceConfidence: number; criticalGapCount: number; highGapCount: number; jobRole: { title: string } | null }[] }>(
    candidateId ? `/api/v1/candidates/${candidateId}/readiness` : null,
  );
  const oppFetch = useFetch<{ readiness: { overallReadinessSignal: string; roleReadiness: number; evidenceReadiness: number }[] }>(
    candidateId ? `/api/v1/candidates/${candidateId}/opportunity-readiness` : null,
  );
  const prioritiesFetch = useFetch<{ priorities: { id: string; prioritySignal: string; priorityReason: string | null }[] }>(
    candidateId ? `/api/v1/candidates/${candidateId}/gap-priorities` : null,
  );

  if (loading) return <LoadingState label="Loading your skill intelligence…" />;
  if (error || !me) return <ErrorState message={error?.message ?? "Could not load your candidate profile."} />;

  const readiness = readinessFetch.data?.readiness[0];
  const skills = skillsFetch.data?.skills ?? [];
  const gaps = gapsFetch.data?.gaps ?? [];
  const openGaps = gaps.filter((g) => g.gapType !== "ALIGNED" && g.status !== "RESOLVED");
  const opp = oppFetch.data?.readiness[0];
  const priority = prioritiesFetch.data?.priorities.find((p) => p.prioritySignal === "HIGH" || p.prioritySignal === "CRITICAL");

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="rounded-xl border bg-gradient-to-br from-primary/5 via-card to-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Hello, {me.candidate.name.split(" ")[0]}</p>
            <h2 className="text-2xl font-bold tracking-tight">Your Skill Intelligence Overview</h2>
            <p className="text-sm text-muted-foreground">Capability first. Jobs later. Every level below is backed by evidence.</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill tone="attention" dot>Synthetic Demonstration</StatusPill>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="rounded-lg border bg-card p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-primary"><Target className="size-4" /><span className="text-[10px] uppercase tracking-wider text-muted-foreground">Target Role</span></div>
            <p className="text-lg font-semibold">{me.targetRole?.jobRole.title ?? "Not set"}</p>
            <p className="text-xs text-muted-foreground">{me.targetRole?.jobRole.sector?.name ?? "—"}</p>
          </div>
          <div className="rounded-lg border bg-card p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-primary"><Award className="size-4" /><span className="text-[10px] uppercase tracking-wider text-muted-foreground">Current Readiness</span></div>
            <p className="text-lg font-semibold">{readiness ? READINESS_LABEL[readiness.overallReadinessSignal] ?? readiness.overallReadinessSignal.replace(/_/g, " ") : "—"}</p>
            <p className="text-xs text-muted-foreground">{readiness ? `${Math.round(readiness.skillCoverage * 100)}% skill coverage` : "insufficient data"}</p>
          </div>
          <div className="rounded-lg border bg-card p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-primary"><AlertTriangle className="size-4" /><span className="text-[10px] uppercase tracking-wider text-muted-foreground">Priority Gap</span></div>
            <p className="text-lg font-semibold">{priority ? priority.prioritySignal : "None"}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">{priority?.priorityReason ?? "No high-priority gaps."}</p>
          </div>
        </div>
      </section>

      {/* Metric cards */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard label="Skill Coverage" value={readiness ? `${Math.round(readiness.skillCoverage * 100)}%` : "—"} icon={<Sparkles className="size-4" />} tone="info" />
        <MetricCard label="Evidence Coverage" value={readiness ? `${Math.round(readiness.evidenceConfidence * 100)}%` : "—"} icon={<FileText className="size-4" />} tone="positive" />
        <MetricCard label="Open Gaps" value={openGaps.length} icon={<AlertTriangle className="size-4" />} tone={openGaps.length > 0 ? "attention" : "positive"} />
        <MetricCard label="Critical/High" value={readiness ? readiness.criticalGapCount + readiness.highGapCount : "—"} icon={<AlertTriangle className="size-4" />} tone={(readiness && (readiness.criticalGapCount + readiness.highGapCount) > 0) ? "critical" : "positive"} />
        <MetricCard label="Opportunity" value={opp ? READINESS_LABEL[opp.overallReadinessSignal] ?? opp.overallReadinessSignal.replace(/_/g, " ") : "—"} icon={<Briefcase className="size-4" />} tone={opp ? READINESS_TONE[opp.overallReadinessSignal] as never : "neutral"} />
      </section>

      {/* Skill passport preview */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Skill Passport — Demonstrated Capability</h3>
          <button onClick={() => setActiveView("c-passport")} className="text-xs text-primary hover:underline flex items-center gap-1">View passport <ArrowRight className="size-3" /></button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {skills.slice(0, 6).map((s) => (
            <div key={s.id} className="rounded-lg border bg-card p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium truncate">{s.skill.name}</p>
                <StatusPill tone={s.freshnessStatus === "CURRENT" || s.freshnessStatus === "RECENT" ? "positive" : "attention"}>{s.freshnessStatus}</StatusPill>
              </div>
              <VisualBar label="Demonstrated proficiency" value={(["AWARENESS","WORKING","PROFICIENT","EXPERT"].indexOf(s.currentProficiency) + 1) * 25} tone="info" height="md" />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{profLabel(s.currentProficiency)}</span>
                <span>{s.evidenceCount} evidence</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Priority gap callout */}
      {priority ? (
        <section className="rounded-lg border border-status-attention/30 bg-status-attention/5 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-status-attention" />
            <h4 className="text-sm font-semibold">Why this gap is prioritized</h4>
            <StatusPill tone={priority.prioritySignal === "CRITICAL" ? "critical" : "attention"} dot>{priority.prioritySignal}</StatusPill>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{priority.priorityReason}</p>
          <button onClick={() => setActiveView("c-gaps")} className="text-xs text-primary hover:underline flex items-center gap-1">See full gap analysis <ArrowRight className="size-3" /></button>
        </section>
      ) : null}

      {/* Development flow */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Development Flow</h3>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-0.5 flex-wrap">
            {[
              { icon: <Activity className="size-4" />, label: "Current Capability", detail: profLabel(skills[0]?.currentProficiency), tone: "info" as const },
              { icon: <AlertTriangle className="size-4" />, label: "Priority Gap", detail: openGaps[0]?.skill?.name ?? "—", tone: "attention" as const },
              { icon: <TrendingUp className="size-4" />, label: "Learning", detail: "Practice + Course", tone: "info" as const },
              { icon: <FileText className="size-4" />, label: "Assessment", detail: "Verify skill", tone: "neutral" as const },
              { icon: <Award className="size-4" />, label: "Updated Capability", detail: "Advanced", tone: "positive" as const },
            ].map((s, i, arr) => (
              <React.Fragment key={i}>
                <FlowNode icon={s.icon} label={s.label} detail={s.detail} tone={s.tone} />
                {i < arr.length - 1 ? <ArrowRight className="size-3 text-muted-foreground rotate-90 md:rotate-0 shrink-0" /> : null}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Quick navigation */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { id: "c-passport", label: "Skill Passport", desc: "Demonstrated proficiency + evidence", icon: <Sparkles className="size-4" /> },
          { id: "c-gaps", label: "My Skill Gaps", desc: "What's missing, why it matters", icon: <AlertTriangle className="size-4" /> },
          { id: "c-development-path", label: "Development Path", desc: "Practice → Assess → Project → Verify", icon: <Target className="size-4" /> },
          { id: "c-opportunities", label: "Opportunities", desc: "Matched on demonstrated evidence", icon: <Briefcase className="size-4" /> },
        ].map((q) => (
          <button key={q.id} onClick={() => setActiveView(q.id)} className="text-left rounded-lg border bg-card p-4 space-y-1.5 hover:border-primary/40 hover:bg-accent/30 transition-colors">
            <div className="flex items-center gap-2 text-primary">{q.icon}<span className="text-sm font-medium text-foreground">{q.label}</span></div>
            <p className="text-xs text-muted-foreground leading-snug">{q.desc}</p>
          </button>
        ))}
      </section>
    </div>
  );
}
