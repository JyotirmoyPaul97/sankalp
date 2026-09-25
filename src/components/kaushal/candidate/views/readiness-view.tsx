"use client";

import * as React from "react";
import { Award, Activity, FileText, Briefcase, TrendingUp, ShieldCheck, AlertTriangle } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { LoadingState, ErrorState } from "@/components/kaushal/states";
import { StatusPill } from "@/components/kaushal/status-pill";
import { VisualBar } from "@/components/kaushal/visual-components";
import { useCandidateMe } from "../use-candidate";
import { profLabel } from "../proficiency";

const READINESS_LABEL: Record<string, string> = {
  HIGH_READINESS: "High Readiness", MODERATE_READINESS: "Moderate Readiness", DEVELOPING: "Developing",
  LOW_READINESS: "Low Readiness", INSUFFICIENT_DATA: "Insufficient Data",
  READY_FOR_CONSIDERATION: "Ready for Consideration", SIGNIFICANT_GAPS: "Significant Gaps", INSUFFICIENT_EVIDENCE: "Insufficient Evidence",
};
const READINESS_TONE: Record<string, "positive" | "info" | "attention" | "critical" | "neutral"> = {
  HIGH_READINESS: "positive", MODERATE_READINESS: "info", DEVELOPING: "attention", LOW_READINESS: "critical", INSUFFICIENT_DATA: "neutral",
  READY_FOR_CONSIDERATION: "positive", SIGNIFICANT_GAPS: "critical", INSUFFICIENT_EVIDENCE: "neutral",
};

export function ReadinessView() {
  const { data: me, loading, error } = useCandidateMe();
  const candidateId = me?.candidate.id;
  const readinessFetch = useFetch<{ readiness: { overallReadinessSignal: string; skillCoverage: number; competencyCoverage: number; proficiencyAlignment: number; evidenceConfidence: number; criticalGapCount: number; highGapCount: number; moderateGapCount: number; marketConfidence: number; candidateConfidence: number; jobRole: { title: string } | null }[] }>(candidateId ? `/api/v1/candidates/${candidateId}/readiness` : null);
  const oppFetch = useFetch<{ readiness: { overallReadinessSignal: string; roleReadiness: number; skillReadiness: number; competencyReadiness: number; evidenceReadiness: number; criticalGapCount: number; highGapCount: number }[] }>(candidateId ? `/api/v1/candidates/${candidateId}/opportunity-readiness` : null);

  if (loading) return <LoadingState label="Loading readiness…" />;
  if (error || !me) return <ErrorState message={error?.message ?? "Could not load your candidate profile."} />;

  const r = readinessFetch.data?.readiness[0];
  const opp = oppFetch.data?.readiness[0];

  if (!r) {
    return <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Insufficient data to compute readiness. Add skills and evidence first.</div>;
  }

  const factors = [
    { label: "Skill Coverage", value: r.skillCoverage, icon: <Activity className="size-4" />, tone: "info" as const, detail: `${Math.round(r.skillCoverage * 100)}% of required skills demonstrated` },
    { label: "Evidence Strength", value: r.evidenceConfidence, icon: <FileText className="size-4" />, tone: "positive" as const, detail: `Evidence confidence ${Math.round(r.evidenceConfidence * 100)}%` },
    { label: "Proficiency Alignment", value: r.proficiencyAlignment, icon: <TrendingUp className="size-4" />, tone: "attention" as const, detail: `Alignment ${Math.round(r.proficiencyAlignment * 100)}%` },
    { label: "Competency Coverage", value: r.competencyCoverage, icon: <Award className="size-4" />, tone: "info" as const, detail: `${Math.round(r.competencyCoverage * 100)}% competency coverage` },
    { label: "Market Demand", value: r.marketConfidence, icon: <TrendingUp className="size-4" />, tone: "attention" as const, detail: `Market confidence ${Math.round(r.marketConfidence * 100)}%` },
  ];

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2"><Award className="size-5 text-primary" /><h2 className="text-xl font-semibold tracking-tight">Candidate Readiness</h2></div>
        <p className="text-sm text-muted-foreground">Understand WHY the system reports your current readiness state — not a mysterious single score.</p>
      </header>

      {/* Readiness summary */}
      <div className="rounded-xl border bg-gradient-to-br from-primary/5 via-card to-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Target Role</p>
            <p className="text-lg font-semibold">{me.targetRole?.jobRole.title ?? "—"}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Readiness State</p>
            <StatusPill tone={READINESS_TONE[r.overallReadinessSignal] ?? "neutral"} dot>{READINESS_LABEL[r.overallReadinessSignal] ?? r.overallReadinessSignal.replace(/_/g, " ")}</StatusPill>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Current Capability</p><p className="text-sm font-semibold">Developing</p></div>
          <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Required</p><p className="text-sm font-semibold">{me.targetRole?.jobRole.title ? "Advanced+" : "—"}</p></div>
          <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Critical Gaps</p><p className="text-sm font-semibold">{r.criticalGapCount}</p></div>
          <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">High Gaps</p><p className="text-sm font-semibold">{r.highGapCount}</p></div>
        </div>
      </div>

      {/* Supporting factors */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Supporting Factors</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {factors.map((f) => (
            <div key={f.label} className="rounded-lg border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary">{f.icon}<span className="text-sm font-medium text-foreground">{f.label}</span></div>
                <span className="text-sm font-bold tabular-nums">{Math.round(f.value * 100)}%</span>
              </div>
              <VisualBar value={f.value * 100} tone={f.tone} height="md" showValue={false} />
              <p className="text-[11px] text-muted-foreground">{f.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Opportunity readiness */}
      {opp ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Briefcase className="size-4 text-primary" /> Opportunity Readiness</h3>
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Market-referenced readiness signal</span>
              <StatusPill tone={READINESS_TONE[opp.overallReadinessSignal] ?? "neutral"} dot>{READINESS_LABEL[opp.overallReadinessSignal] ?? opp.overallReadinessSignal.replace(/_/g, " ")}</StatusPill>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Factor label="Role Readiness" value={opp.roleReadiness} />
              <Factor label="Skill Readiness" value={opp.skillReadiness} />
              <Factor label="Evidence Readiness" value={opp.evidenceReadiness} />
              <Factor label="Critical/High Gaps" value={(opp.criticalGapCount + opp.highGapCount) / 5} display={`${opp.criticalGapCount + opp.highGapCount}`} />
            </div>
            <p className="text-[11px] text-muted-foreground">NOT a guaranteed hiring outcome. Based on evidence-backed comparison of your skills with role requirements.</p>
          </div>
        </section>
      ) : null}

      {/* Assessment status */}
      <section className="rounded-lg border bg-card p-4 space-y-2">
        <h3 className="text-sm font-semibold flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> Assessment & Project Evidence</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div><p className="text-[9px] uppercase tracking-wider text-muted-foreground">Assessments</p><p className="text-sm font-medium">{me.candidate.counts.assessments}</p></div>
          <div><p className="text-[9px] uppercase tracking-wider text-muted-foreground">Evidence items</p><p className="text-sm font-medium">{me.candidate.counts.evidence}</p></div>
          <div><p className="text-[9px] uppercase tracking-wider text-muted-foreground">Skills</p><p className="text-sm font-medium">{me.candidate.counts.skills}</p></div>
          <div><p className="text-[9px] uppercase tracking-wider text-muted-foreground">Open gaps</p><p className="text-sm font-medium">{me.candidate.counts.skillGaps}</p></div>
        </div>
      </section>
    </div>
  );
}

function Factor({ label, value, display }: { label: string; value: number; display?: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <VisualBar value={value * 100} tone={value >= 0.7 ? "positive" : value >= 0.4 ? "info" : "attention"} height="sm" showValue={false} />
      <p className="text-xs font-medium">{display ?? Math.round(value * 100) + "%"}</p>
    </div>
  );
}
