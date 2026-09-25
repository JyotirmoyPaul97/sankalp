"use client";

import * as React from "react";
import { Route, Target, Activity, FileText, Briefcase, Award, ShieldCheck, ArrowRight, GraduationCap, AlertTriangle } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { LoadingState, ErrorState } from "@/components/kaushal/states";
import { StatusPill } from "@/components/kaushal/status-pill";
import { useNav } from "@/store/app-store";
import { useCandidateMe } from "../use-candidate";
import { profLabel } from "../proficiency";

const ACTION_ICONS: Record<string, React.ReactNode> = {
  PRACTICE: <Activity className="size-4" />,
  ASSESSMENT: <FileText className="size-4" />,
  PROJECT: <Briefcase className="size-4" />,
  CERTIFICATION: <Award className="size-4" />,
  MENTORSHIP: <ShieldCheck className="size-4" />,
  COURSE: <GraduationCap className="size-4" />,
};

const STATUS_TONE: Record<string, "positive" | "info" | "neutral"> = {
  COMPLETED: "positive", IN_PROGRESS: "info", PENDING: "neutral", SKIPPED: "neutral",
};

interface PathStep { id: string; sequence: number; actionType: string; status: string; objective: string | null; evidenceRequired: string | null; skill: { name: string } | null; course: { id: string; name: string } | null; }

export function DevelopmentPathView() {
  const { data: me, loading, error } = useCandidateMe();
  const candidateId = me?.candidate.id;
  const pathsFetch = useFetch<{ paths: { id: string; pathwayStatus: string; jobRole: { title: string } | null; steps: PathStep[] }[] }>(candidateId ? `/api/v1/candidates/${candidateId}/development-path` : null);
  const matchesFetch = useFetch<{ matches: { id: string; matchStatus: string; matchConfidence: number; matchReason: string | null; courseRelevance: number; centreReadiness: string; trainerCapability: string; equipmentCapability: string; course: { id: string; name: string; sector: { name: string } | null } | null }[] }>(candidateId ? `/api/v1/candidates/${candidateId}/course-matches` : null);

  const setActiveView = useNav((s) => s.setActiveView);

  if (loading) return <LoadingState label="Loading development path…" />;
  if (error || !me) return <ErrorState message={error?.message ?? "Could not load your candidate profile."} />;

  const paths = pathsFetch.data?.paths ?? [];
  const matches = matchesFetch.data?.matches ?? [];
  const path = paths[0];

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2"><Route className="size-5 text-primary" /><h2 className="text-xl font-semibold tracking-tight">My Development Path</h2></div>
        <p className="text-sm text-muted-foreground">Connects action to measurable evidence — not a simple list of courses.</p>
      </header>

      {/* Visual flow */}
      <div className="rounded-lg border bg-card p-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Development Flow</p>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-1 md:gap-0.5">
          {[
            { icon: <Activity className="size-4" />, label: "Current Capability", detail: profLabel(me.targetRole ? "WORKING" : null), tone: "info" as const },
            { icon: <AlertIcon />, label: "Priority Gap", detail: "Advanced required", tone: "attention" as const },
            { icon: <GraduationCap className="size-4" />, label: "Learning / Practice", detail: "Course + lab", tone: "info" as const },
            { icon: <FileText className="size-4" />, label: "Assessment", detail: "Verify skill", tone: "neutral" as const },
            { icon: <Briefcase className="size-4" />, label: "Project", detail: "Apply skill", tone: "neutral" as const },
            { icon: <ShieldCheck className="size-4" />, label: "Verification", detail: "Employer-verified", tone: "neutral" as const },
            { icon: <Award className="size-4" />, label: "Updated Proficiency", detail: "Advanced", tone: "positive" as const },
          ].map((s, i, arr) => (
            <React.Fragment key={i}>
              <div className="flex-1 rounded-md border bg-background p-2.5 text-center min-w-[100px]">
                <div className="flex justify-center text-primary mb-1">{s.icon}</div>
                <p className="text-[10px] font-medium">{s.label}</p>
                <p className="text-[9px] text-muted-foreground">{s.detail}</p>
              </div>
              {i < arr.length - 1 ? <ArrowRight className="size-3 text-muted-foreground rotate-90 md:rotate-0 shrink-0 mx-auto" /> : null}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Pathway steps */}
      {path ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Target className="size-4 text-primary" /><h3 className="text-sm font-semibold">{path.jobRole?.title ?? "Target Role"} Pathway</h3></div>
            <StatusPill tone={path.pathwayStatus === "ACTIVE" ? "positive" : "neutral"} dot>{path.pathwayStatus}</StatusPill>
          </div>
          <div className="space-y-2">
            {path.steps.map((step) => (
              <div key={step.id} className="flex items-start gap-3 rounded-lg border bg-card p-3">
                <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground shrink-0 font-mono text-xs">{String(step.sequence).padStart(2, "0")}</div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {ACTION_ICONS[step.actionType] ?? <Activity className="size-4" />}
                    <StatusPill tone={STATUS_TONE[step.status] ?? "neutral"} dot>{step.actionType.replace(/_/g, " ")}</StatusPill>
                    <StatusPill tone={STATUS_TONE[step.status] ?? "neutral"}>{step.status}</StatusPill>
                  </div>
                  <p className="text-sm">{step.objective ?? "—"}</p>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    {step.skill ? <span>Skill: <span className="font-medium text-foreground">{step.skill.name}</span></span> : null}
                    {step.course ? <span>Course: <button onClick={() => setActiveView("c-development-path")} className="text-primary hover:underline">{step.course.name}</button></span> : null}
                    {step.evidenceRequired ? <span className="flex items-center gap-1"><FileText className="size-3" />Evidence: {step.evidenceRequired}</span> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Learning recommendations */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2"><GraduationCap className="size-4 text-primary" /> Learning Recommendations</h3>
        <p className="text-[11px] text-muted-foreground">Driven by your skill gaps + target role — not generic "recommended courses".</p>
        {matches.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No course matches yet.</div>
        ) : (
          <div className="space-y-2">
            {matches.slice(0, 4).map((m) => (
              <div key={m.id} className="rounded-lg border bg-card p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-sm font-semibold">{m.course?.name ?? "—"}</p>
                    <p className="text-[11px] text-muted-foreground">{m.course?.sector?.name ?? "—"}</p>
                  </div>
                  <StatusPill tone={m.matchStatus === "STRONG_MATCH" ? "positive" : m.matchStatus === "MATCH" ? "info" : "attention"} dot>{m.matchStatus.replace(/_/g, " ")}</StatusPill>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{m.matchReason ?? "Matched against your skill gaps and target role."}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <Capability label="Centre" value={m.centreReadiness} />
                  <Capability label="Trainer" value={m.trainerCapability} />
                  <Capability label="Equipment" value={m.equipmentCapability} />
                  <Capability label="Relevance" value={Math.round(m.courseRelevance) + "%"} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Capability({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-xs font-medium">{value.replace(/_/g, " ")}</p>
    </div>
  );
}

function AlertIcon() { return <AlertTriangle className="size-4 text-status-attention" />; }
