"use client";

import * as React from "react";
import { Target, TrendingUp, MapPin, ArrowRight, Building2, Gauge } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { LoadingState, ErrorState } from "@/components/kaushal/states";
import { StatusPill } from "@/components/kaushal/status-pill";
import { VisualBar } from "@/components/kaushal/visual-components";
import { useNav } from "@/store/app-store";
import { useCandidateMe } from "../use-candidate";
import { profLabel } from "../proficiency";

export function TargetRolesView() {
  const { data: me, loading, error } = useCandidateMe();
  const candidateId = me?.candidate.id;
  const targetRoleId = me?.targetRole?.targetRoleId;

  const targetsFetch = useFetch<{ targetRoles: { targetRoleId: string; jobRole: { id: string; title: string; description: string | null; sector: { name: string } | null }; sector: { name: string } | null; district: { name: string } | null; marketDemandSignal: string; marketConfidence: number }[] }>(candidateId ? `/api/v1/candidates/${candidateId}/target-roles` : null);
  const competencyFetch = useFetch<{ profile: { roleTitle: string; sectorName: string; totalSkills: number; competencies: { skillId: string; skillName: string; importance: number; proficiencyExpected: string }[] } }>(targetRoleId ? `/api/v1/job-roles/${targetRoleId}/competency` : null, [targetRoleId]);

  if (loading) return <LoadingState label="Loading target role…" />;
  if (error || !me) return <ErrorState message={error?.message ?? "Could not load your candidate profile."} />;

  const target = me.targetRole;
  const targets = targetsFetch.data?.targetRoles ?? [];
  const competency = competencyFetch.data?.profile;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2"><Target className="size-5 text-primary" /><h2 className="text-xl font-semibold tracking-tight">Target Role</h2></div>
        <p className="text-sm text-muted-foreground">Your target role requirements come from the shared competency intelligence — not a parallel candidate ontology.</p>
      </header>

      {!target ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No target role set yet.</div>
      ) : (
        <div className="space-y-4">
          {/* Role card */}
          <div className="rounded-lg border bg-card p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">{target.jobRole.title}</h3>
                {target.jobRole.description ? <p className="text-sm text-muted-foreground">{target.jobRole.description}</p> : null}
              </div>
              <StatusPill tone={target.marketDemandSignal === "HIGH" ? "attention" : "info"} dot>{target.marketDemandSignal} demand</StatusPill>
            </div>
            <div className="grid sm:grid-cols-3 gap-3 text-xs">
              <div className="flex items-center gap-2"><Building2 className="size-3.5 text-muted-foreground" /><span className="text-muted-foreground">Sector:</span> <span className="font-medium">{target.jobRole.sector?.name ?? "—"}</span></div>
              <div className="flex items-center gap-2"><MapPin className="size-3.5 text-muted-foreground" /><span className="text-muted-foreground">District:</span> <span className="font-medium">{target.district?.name ?? "—"}</span></div>
              <div className="flex items-center gap-2"><Gauge className="size-3.5 text-muted-foreground" /><span className="text-muted-foreground">Market confidence:</span> <span className="font-medium">{Math.round(target.marketConfidence * 100)}%</span></div>
            </div>
          </div>

          {/* Required competencies */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Required Competencies (from shared competency layer)</h4>
            {competencyFetch.loading ? <LoadingState /> : competency ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {competency.competencies.map((c) => (
                  <div key={c.skillId} className="rounded-lg border bg-card p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{c.skillName}</p>
                      <StatusPill tone="info">{profLabel(c.proficiencyExpected)}</StatusPill>
                    </div>
                    <VisualBar label="Role importance" value={c.importance * 20} tone="info" height="sm" />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Quick links */}
          <div className="grid sm:grid-cols-3 gap-3">
            <button onClick={() => useNav.getState().setActiveView("c-role-comparison")} className="text-left rounded-lg border bg-card p-4 space-y-1.5 hover:border-primary/40 hover:bg-accent/30 transition-colors">
              <div className="flex items-center gap-2 text-primary"><Target className="size-4" /><span className="text-sm font-medium text-foreground">Role Readiness</span></div>
              <p className="text-xs text-muted-foreground">Compare required vs demonstrated.</p>
            </button>
            <button onClick={() => useNav.getState().setActiveView("c-market-context")} className="text-left rounded-lg border bg-card p-4 space-y-1.5 hover:border-primary/40 hover:bg-accent/30 transition-colors">
              <div className="flex items-center gap-2 text-primary"><TrendingUp className="size-4" /><span className="text-sm font-medium text-foreground">Market Context</span></div>
              <p className="text-xs text-muted-foreground">Demand, trend, districts, emerging skills.</p>
            </button>
            <button onClick={() => useNav.getState().setActiveView("c-development-path")} className="text-left rounded-lg border bg-card p-4 space-y-1.5 hover:border-primary/40 hover:bg-accent/30 transition-colors">
              <div className="flex items-center gap-2 text-primary"><ArrowRight className="size-4" /><span className="text-sm font-medium text-foreground">Relevant Training Path</span></div>
              <p className="text-xs text-muted-foreground">Courses + centres + trainers.</p>
            </button>
          </div>

          {/* All target roles (if multiple) */}
          {targets.length > 1 ? (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">All Target Roles</h4>
              <div className="grid sm:grid-cols-2 gap-2">
                {targets.map((t) => (
                  <div key={t.targetRoleId} className="rounded-md border p-3 text-xs">
                    <p className="font-medium text-sm">{t.jobRole.title}</p>
                    <p className="text-muted-foreground">{t.jobRole.sector?.name} · {t.district?.name}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
