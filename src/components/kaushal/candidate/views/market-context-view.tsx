"use client";

import * as React from "react";
import { TrendingUp, MapPin, Sparkles, Target, BarChart3 } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { LoadingState, ErrorState } from "@/components/kaushal/states";
import { StatusPill } from "@/components/kaushal/status-pill";
import { VisualBar } from "@/components/kaushal/visual-components";
import { useCandidateMe } from "../use-candidate";
import { profLabel } from "../proficiency";

export function MarketContextView() {
  const { data: me, loading, error } = useCandidateMe();
  const { data, loading: mLoading, error: mError } = useFetch<{
    role: { id: string; title: string; description: string | null; sector: string | null } | null;
    demand: { level: string | null; trend: string | null; signalValue: number | null; confidence: number | null; period: string | null };
    districts: string[];
    emerging: { skill: string; status: string; strength: number; trendVelocity: number }[];
    requiredSkills: { name: string; required: string; importance: number }[];
  }>("/api/v1/candidate/market-context");

  if (loading) return <LoadingState label="Loading market context…" />;
  if (error || !me) return <ErrorState message={error?.message ?? "Could not load your candidate profile."} />;

  const role = data?.role;
  const demand = data?.demand;
  const districts = data?.districts ?? [];
  const emerging = data?.emerging ?? [];
  const required = data?.requiredSkills ?? [];

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2"><BarChart3 className="size-5 text-primary" /><h2 className="text-xl font-semibold tracking-tight">Market Context</h2></div>
        <p className="text-sm text-muted-foreground">How your target role maps to the real market — from the same Market Intelligence Engine.</p>
      </header>

      {!role ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No target role set.</div>
      ) : (
        <div className="space-y-4">
          {/* Role + demand */}
          <div className="rounded-lg border bg-card p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">{role.title}</h3>
                {role.description ? <p className="text-sm text-muted-foreground">{role.description}</p> : null}
              </div>
              {demand?.level ? <StatusPill tone={demand.level === "HIGH" ? "attention" : demand.level === "MEDIUM" ? "info" : "neutral"} dot>{demand.level} demand</StatusPill> : null}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Demand</p><p className="text-sm font-semibold">{demand?.level ?? "—"}</p></div>
              <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Trend</p><p className="text-sm font-semibold">{demand?.trend ?? "—"}</p></div>
              <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Signal value</p><p className="text-sm font-semibold tabular-nums">{demand?.signalValue ?? "—"}</p></div>
              <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Confidence</p><p className="text-sm font-semibold tabular-nums">{demand?.confidence ? Math.round(demand.confidence * 100) + "%" : "—"}</p></div>
            </div>
            {demand?.period ? <p className="text-[11px] text-muted-foreground">Latest observation: {demand.period}</p> : null}
          </div>

          {/* Relevant districts */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2"><MapPin className="size-4 text-primary" /> Relevant Districts</h3>
            {districts.length === 0 ? <p className="text-[11px] text-muted-foreground">No district-level signals.</p> : (
              <div className="flex flex-wrap gap-2">
                {districts.map((d) => <StatusPill key={d} tone="info" dot>{d}</StatusPill>)}
              </div>
            )}
          </section>

          {/* Emerging related skills */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Sparkles className="size-4 text-primary" /> Emerging Related Skills</h3>
            {emerging.length === 0 ? <p className="text-[11px] text-muted-foreground">No emerging signals for your role's skills.</p> : (
              <div className="grid sm:grid-cols-2 gap-2">
                {emerging.map((e, i) => (
                  <div key={i} className="rounded-lg border bg-card p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{e.skill}</p>
                      <StatusPill tone={e.status === "ACCELERATING" ? "attention" : e.status === "EMERGING" ? "info" : "neutral"} dot>{e.status}</StatusPill>
                    </div>
                    <VisualBar label="Signal strength" value={e.strength} tone="info" height="sm" />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Required skills from market */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Target className="size-4 text-primary" /> Required Proficiency (from shared competency)</h3>
            <div className="rounded-lg border divide-y">
              {required.map((r, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="font-medium">{r.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{profLabel(r.required)}</span>
                    <div className="w-20"><VisualBar value={r.importance * 20} tone="info" height="sm" showValue={false} /></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Cross-stakeholder connection visual */}
          <section className="rounded-lg border bg-card p-4 space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="size-4 text-primary" /> Cross-Stakeholder Connection</h3>
            <p className="text-[11px] text-muted-foreground">Your target role connects demand, training, and your capability in one intelligence loop:</p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="rounded-md border bg-muted/30 p-2"><p className="font-medium">Employer</p><p className="text-muted-foreground">Requires Advanced PLC</p></div>
              <div className="rounded-md border bg-muted/30 p-2"><p className="font-medium">Market Intelligence</p><p className="text-muted-foreground">PLC demand HIGH</p></div>
              <div className="rounded-md border bg-muted/30 p-2"><p className="font-medium">Training</p><p className="text-muted-foreground">Advanced PLC capability PARTIAL</p></div>
              <div className="rounded-md border bg-primary/5 p-2"><p className="font-medium text-primary">You</p><p className="text-muted-foreground">Demonstrate Intermediate</p></div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
