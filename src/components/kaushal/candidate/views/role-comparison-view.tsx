"use client";

import * as React from "react";
import { GitCompareArrows, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { LoadingState, ErrorState } from "@/components/kaushal/states";
import { DataTable, type Column } from "@/components/kaushal/data-table";
import { useNav } from "@/store/app-store";
import { useCandidateMe } from "../use-candidate";
import { profLabel, gapLabel, gapTone } from "../proficiency";

interface SkillRow { id: string; currentProficiency: string; proficiencyConfidence: number; evidenceCount: number; skill: { id: string; name: string } }
interface GapRow { id: string; gapType: string; requiredProficiency: string; candidateProficiency: string | null; status: string; skill: { name: string } | null; skillId?: string }

export function RoleComparisonView() {
  const { data: me, loading, error } = useCandidateMe();
  const candidateId = me?.candidate.id;
  const targetRoleId = me?.targetRole?.targetRoleId;

  const skillsFetch = useFetch<{ skills: SkillRow[] }>(candidateId ? `/api/v1/candidates/${candidateId}/skills` : null);
  const gapsFetch = useFetch<{ gaps: GapRow[] }>(candidateId ? `/api/v1/candidates/${candidateId}/gaps` : null);
  const competencyFetch = useFetch<{ profile: { competencies: { skillId: string; skillName: string; proficiencyExpected: string; importance: number }[] } }>(targetRoleId ? `/api/v1/job-roles/${targetRoleId}/competency` : null, [targetRoleId]);

  if (loading) return <LoadingState label="Loading role comparison…" />;
  if (error || !me) return <ErrorState message={error?.message ?? "Could not load your candidate profile."} />;

  const skills = skillsFetch.data?.skills ?? [];
  const gaps = gapsFetch.data?.gaps ?? [];
  const competencies = competencyFetch.data?.profile?.competencies ?? [];

  // Build comparison rows: for each required competency, find demonstrated.
  const rows = competencies.map((c) => {
    const skill = skills.find((s) => s.skill.id === c.skillId);
    const gap = gaps.find((g) => g.skill?.name === c.skillName);
    const gapL = gapLabel(c.proficiencyExpected, skill?.currentProficiency);
    return {
      id: c.skillId,
      skill: c.skillName,
      required: profLabel(c.proficiencyExpected),
      demonstrated: skill ? profLabel(skill.currentProficiency) : "—",
      evidence: skill?.evidenceCount ?? 0,
      confidence: skill ? Math.round(skill.proficiencyConfidence * 100) : 0,
      gap: gapL,
      gapTone: gapTone(gapL),
      status: gap?.status ?? (skill ? "ALIGNED" : "MISSING"),
    };
  });

  const aligned = rows.filter((r) => r.gap.startsWith("None")).length;
  const totalGaps = rows.length - aligned;

  const columns: Column<typeof rows[number]>[] = [
    { key: "skill", header: "Skill", cell: (r) => <span className="text-sm font-medium">{r.skill}</span> },
    { key: "required", header: "Required", cell: (r) => <span className="text-xs font-medium">{r.required}</span>, width: "120px" },
    { key: "demonstrated", header: "Demonstrated", cell: (r) => <span className="text-xs">{r.demonstrated}</span>, width: "120px" },
    { key: "evidence", header: "Evidence", cell: (r) => <span className="tabular-nums text-xs">{r.evidence}</span>, width: "80px" },
    { key: "gap", header: "Gap", cell: (r) => <span className={`text-xs font-medium ${r.gapTone === "positive" ? "text-status-positive" : r.gapTone === "critical" ? "text-status-critical" : "text-status-attention"}`}>{r.gap}</span>, width: "120px" },
  ];

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2"><GitCompareArrows className="size-5 text-primary" /><h2 className="text-xl font-semibold tracking-tight">Role Readiness</h2></div>
        <p className="text-sm text-muted-foreground">What is required vs what you can demonstrate — immediately understandable.</p>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border bg-card p-4 text-center">
          <CheckCircle2 className="size-5 mx-auto text-status-positive" />
          <p className="text-2xl font-bold mt-1">{aligned}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Aligned</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <AlertTriangle className="size-5 mx-auto text-status-attention" />
          <p className="text-2xl font-bold mt-1">{totalGaps}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Gaps</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <XCircle className="size-5 mx-auto text-muted-foreground" />
          <p className="text-2xl font-bold mt-1">{rows.length}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total required</p>
        </div>
      </div>

      {competencyFetch.loading ? <LoadingState /> : (
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} emptyMessage="No role competency profile available." />
      )}

      <p className="text-[11px] text-muted-foreground">Role requirements sourced from the shared competency layer. Demonstrated values come from your evidence-backed skill passport.</p>
    </div>
  );
}
