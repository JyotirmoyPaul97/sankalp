"use client";

import * as React from "react";
import { AlertTriangle, ArrowRight, Lightbulb, TrendingUp, ShieldCheck } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { LoadingState, ErrorState } from "@/components/kaushal/states";
import { StatusPill } from "@/components/kaushal/status-pill";
import { VisualBar } from "@/components/kaushal/visual-components";
import { useNav } from "@/store/app-store";
import { useCandidateMe } from "../use-candidate";
import { profLabel, gapLabel, gapTone } from "../proficiency";

const PRIORITY_TONE: Record<string, "critical" | "attention" | "info" | "neutral"> = {
  CRITICAL: "critical", HIGH: "attention", MEDIUM: "info", LOW: "neutral", INFORMATIONAL: "neutral",
};

interface GapRow {
  id: string; gapType: string; gapSeverity: string | null; requiredProficiency: string;
  candidateProficiency: string | null; candidateEvidenceConfidence: number; marketRequirementConfidence: number;
  evidenceCount: number; freshness: string; status: string; skillId?: string; skill: { id: string; name: string } | null;
}
interface PriorityRow {
  id: string; gapId: string; prioritySignal: string; priorityReason: string | null;
  marketImportance: number; employerSignal: string; emergingSignal: string; trainingAvailability: string;
}

export function SkillGapsView() {
  const { data: me, loading, error } = useCandidateMe();
  const candidateId = me?.candidate.id;
  const gapsFetch = useFetch<{ gaps: GapRow[] }>(candidateId ? `/api/v1/candidates/${candidateId}/gaps` : null);
  const prioritiesFetch = useFetch<{ priorities: PriorityRow[] }>(candidateId ? `/api/v1/candidates/${candidateId}/gap-priorities` : null);

  const setActiveView = useNav((s) => s.setActiveView);

  if (loading) return <LoadingState label="Loading skill gaps…" />;
  if (error || !me) return <ErrorState message={error?.message ?? "Could not load your candidate profile."} />;

  const gaps = gapsFetch.data?.gaps ?? [];
  const priorities = prioritiesFetch.data?.priorities ?? [];
  const priorityByGap = new Map(priorities.map((p) => [p.gapId, p]));

  const openGaps = gaps.filter((g) => g.gapType !== "ALIGNED" && g.status !== "RESOLVED");
  const aligned = gaps.filter((g) => g.gapType === "ALIGNED" || g.status === "RESOLVED");

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2"><AlertTriangle className="size-5 text-primary" /><h2 className="text-xl font-semibold tracking-tight">My Skill Gaps</h2></div>
        <p className="text-sm text-muted-foreground">Every gap explains WHY it matters — role requirement, market demand, current proficiency, evidence confidence, gap magnitude.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border bg-card p-3 text-center"><p className="text-xl font-bold">{openGaps.length}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Open gaps</p></div>
        <div className="rounded-lg border bg-card p-3 text-center"><p className="text-xl font-bold text-status-positive">{aligned.length}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Aligned</p></div>
        <div className="rounded-lg border bg-card p-3 text-center"><p className="text-xl font-bold text-status-attention">{priorities.filter((p) => p.prioritySignal === "HIGH" || p.prioritySignal === "CRITICAL").length}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">High priority</p></div>
        <div className="rounded-lg border bg-card p-3 text-center"><p className="text-xl font-bold">{priorities.filter((p) => p.emergingSignal !== "NONE" && p.emergingSignal !== "INSUFFICIENT_EVIDENCE").length}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Emerging</p></div>
      </div>

      {/* Priority gaps */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2"><Lightbulb className="size-4 text-primary" /> Priority Gaps — and WHY</h3>
        {priorities.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No prioritised gaps.</div>
        ) : (
          <div className="space-y-3">
            {priorities.map((p) => {
              const gap = gaps.find((g) => g.id === p.gapId);
              if (!gap || !gap.skill) return null;
              const gapL = gapLabel(gap.requiredProficiency, gap.candidateProficiency);
              return (
                <div key={p.id} className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{gap.skill.name}</p>
                        <StatusPill tone={PRIORITY_TONE[p.prioritySignal] ?? "neutral"} dot>{p.prioritySignal}</StatusPill>
                        {p.emergingSignal !== "NONE" && p.emergingSignal !== "INSUFFICIENT_EVIDENCE" ? <StatusPill tone="attention" dot>Emerging</StatusPill> : null}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{profLabel(gap.requiredProficiency)} required · <span className="font-medium text-foreground">{profLabel(gap.candidateProficiency)}</span> demonstrated</p>
                    </div>
                    <StatusPill tone={gapTone(gapL)} dot>Gap: {gapL}</StatusPill>
                  </div>

                  {/* WHY — the priority reasoning */}
                  <div className="rounded-md bg-muted/40 p-3 space-y-1.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Why this is prioritised</p>
                    <p className="text-xs text-foreground leading-relaxed">{p.priorityReason ?? "—"}</p>
                  </div>

                  {/* Factors */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <Factor label="Market importance" value={Math.round(p.marketImportance * 100) + "%"} bar={p.marketImportance * 100} tone="attention" />
                    <Factor label="Employer signal" value={p.employerSignal} />
                    <Factor label="Evidence conf." value={Math.round((gap.candidateEvidenceConfidence ?? 0) * 100) + "%"} bar={(gap.candidateEvidenceConfidence ?? 0) * 100} tone="info" />
                    <Factor label="Training avail." value={p.trainingAvailability} tone={p.trainingAvailability === "AVAILABLE" ? "positive" : "neutral"} />
                  </div>

                  <button onClick={() => setActiveView(`c-one-skill:${gap.skill!.id}`)} className="text-[11px] text-primary hover:underline flex items-center gap-1">
                    View development path for this gap <ArrowRight className="size-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* All gaps table */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">All Skill Gaps</h3>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2">Skill</th>
                <th className="text-left px-3 py-2">Required</th>
                <th className="text-left px-3 py-2">Current</th>
                <th className="text-left px-3 py-2">Gap</th>
                <th className="text-left px-3 py-2">Evidence</th>
                <th className="text-left px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {gaps.map((g) => {
                const gapL = gapLabel(g.requiredProficiency, g.candidateProficiency);
                return (
                  <tr key={g.id} className="hover:bg-accent/30">
                    <td className="px-3 py-2 font-medium text-sm">{g.skill?.name ?? "—"}</td>
                    <td className="px-3 py-2 text-xs">{profLabel(g.requiredProficiency)}</td>
                    <td className="px-3 py-2 text-xs">{profLabel(g.candidateProficiency)}</td>
                    <td className="px-3 py-2"><StatusPill tone={gapTone(gapL)}>{gapL}</StatusPill></td>
                    <td className="px-3 py-2 text-xs tabular-nums">{g.evidenceCount}</td>
                    <td className="px-3 py-2"><StatusPill tone={g.status === "RESOLVED" ? "positive" : g.status === "OPEN" ? "attention" : "neutral"} dot>{g.status}</StatusPill></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Factor({ label, value, bar, tone = "neutral" }: { label: string; value: string; bar?: number; tone?: "positive" | "info" | "attention" | "neutral" }) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      {bar !== undefined ? <VisualBar value={bar} tone={tone} height="sm" showValue={false} /> : null}
      <p className="text-xs font-medium">{value}</p>
    </div>
  );
}
