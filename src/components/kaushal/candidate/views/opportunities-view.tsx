"use client";

import * as React from "react";
import { Briefcase, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight, TrendingUp } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { LoadingState, ErrorState } from "@/components/kaushal/states";
import { StatusPill } from "@/components/kaushal/status-pill";
import { VisualBar } from "@/components/kaushal/visual-components";
import { useCandidateMe } from "../use-candidate";
import { profLabel } from "../proficiency";

const READINESS_TONE: Record<string, "positive" | "info" | "attention" | "critical" | "neutral"> = {
  READY_FOR_CONSIDERATION: "positive", DEVELOPING: "attention", SIGNIFICANT_GAPS: "critical", INSUFFICIENT_EVIDENCE: "neutral",
};

interface Opportunity {
  id: string; type: string; title: string; employer: string; district: string;
  matchStatus: string; matchReason: string;
  strengths: { skill: string; demonstrated: string | null; evidence?: number }[];
  remainingGaps: { skill: string; required: string; demonstrated: string | null; gap: string }[];
  evidenceMatch: { evidenceBacked: number; claimed: number; note: string };
}

export function OpportunitiesView() {
  const { data: me, loading, error } = useCandidateMe();
  const { data, loading: oppLoading, error: oppError } = useFetch<{ targetRole: { id: string; title: string; sector: string | null } | null; readiness: { signal: string; roleReadiness: number; skillReadiness: number; evidenceReadiness: number; criticalGaps: number; highGaps: number } | null; opportunities: Opportunity[]; claimedVsDemonstrated: { claimedSkills: number; evidenceBackedSkills: number; verifiedSkills: number } }>("/api/v1/candidate/opportunities");

  if (loading) return <LoadingState label="Loading opportunities…" />;
  if (error || !me) return <ErrorState message={error?.message ?? "Could not load your candidate profile."} />;

  const opportunities = data?.opportunities ?? [];
  const cvd = data?.claimedVsDemonstrated;
  const readiness = data?.readiness;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2"><Briefcase className="size-5 text-primary" /><h2 className="text-xl font-semibold tracking-tight">Opportunity Match</h2></div>
        <p className="text-sm text-muted-foreground">Matched on <strong>demonstrated capability + evidence</strong>, not claimed skills. Opportunities are secondary to capability intelligence.</p>
      </header>

      {/* Claimed vs Demonstrated banner */}
      {cvd ? (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Claimed vs Demonstrated</p>
          <div className="grid grid-cols-3 gap-3">
            <div><p className="text-2xl font-bold">{cvd.claimedSkills}</p><p className="text-[10px] text-muted-foreground">Claimed skills</p></div>
            <div><p className="text-2xl font-bold text-status-info">{cvd.evidenceBackedSkills}</p><p className="text-[10px] text-muted-foreground">Evidence-backed</p></div>
            <div><p className="text-2xl font-bold text-status-positive">{cvd.verifiedSkills}</p><p className="text-[10px] text-muted-foreground">Verified</p></div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">Matched on demonstrated capability, NOT claims.</p>
        </div>
      ) : null}

      {/* Readiness summary */}
      {readiness ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border bg-card p-3"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Signal</p><StatusPill tone={READINESS_TONE[readiness.signal] ?? "neutral"} dot>{readiness.signal.replace(/_/g, " ")}</StatusPill></div>
          <div className="rounded-lg border bg-card p-3"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Role readiness</p><p className="text-lg font-bold">{Math.round(readiness.roleReadiness * 100)}%</p></div>
          <div className="rounded-lg border bg-card p-3"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Evidence</p><p className="text-lg font-bold">{Math.round(readiness.evidenceReadiness * 100)}%</p></div>
          <div className="rounded-lg border bg-card p-3"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">High gaps</p><p className="text-lg font-bold">{readiness.highGaps}</p></div>
        </div>
      ) : null}

      {/* Opportunities */}
      {oppLoading ? <LoadingState /> : oppError ? <ErrorState message={oppError.message} /> : opportunities.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No matched opportunities yet. Set a target role and build evidence first.</div>
      ) : (
        <div className="space-y-4">
          {opportunities.map((opp) => (
            <div key={opp.id} className="rounded-lg border bg-card p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Briefcase className="size-4 text-primary" />
                    <h3 className="text-sm font-semibold">{opp.title}</h3>
                    <StatusPill tone="info">{opp.type}</StatusPill>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{opp.employer} · {opp.district}</p>
                </div>
                <StatusPill tone={READINESS_TONE[opp.matchStatus] ?? "neutral"} dot>{opp.matchStatus.replace(/_/g, " ")}</StatusPill>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">{opp.matchReason}</p>

              {/* Required role / skills */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-status-positive flex items-center gap-1"><CheckCircle2 className="size-3" /> Strengths</p>
                  {opp.strengths.length === 0 ? <p className="text-[11px] text-muted-foreground">None yet.</p> : opp.strengths.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span>{s.skill}</span>
                      <span className="text-muted-foreground">{profLabel(s.demonstrated)}{s.evidence !== undefined ? ` · ${s.evidence} ev.` : ""}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-status-attention flex items-center gap-1"><AlertTriangle className="size-3" /> Remaining Gap</p>
                  {opp.remainingGaps.length === 0 ? <p className="text-[11px] text-muted-foreground">None — fully ready.</p> : opp.remainingGaps.map((g, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span>{g.skill}</span>
                      <span className="text-muted-foreground">{profLabel(g.demonstrated)} → {profLabel(g.required)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evidence match */}
              <div className="rounded-md bg-muted/40 p-2.5 text-[11px] text-muted-foreground">
                <ShieldCheck className="size-3 inline mr-1" />
                {opp.evidenceMatch.note} {opp.evidenceMatch.evidenceBacked}/{opp.evidenceMatch.claimed} skills evidence-backed.
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground flex items-center gap-1"><TrendingUp className="size-3" /> Opportunities are matched on demonstrated evidence. This is NOT a jobs feed.</p>
    </div>
  );
}
