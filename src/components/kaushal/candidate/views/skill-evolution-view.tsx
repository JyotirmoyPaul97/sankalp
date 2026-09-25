"use client";

import * as React from "react";
import { TrendingUp, Award, Activity, FileText, Briefcase, ShieldCheck, User } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { LoadingState, ErrorState } from "@/components/kaushal/states";
import { StatusPill } from "@/components/kaushal/status-pill";
import { useCandidateMe } from "../use-candidate";
import { profLabel, evidenceTypeLabel } from "../proficiency";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  ASSESSMENT: <FileText className="size-3.5" />,
  PROJECT: <Briefcase className="size-3.5" />,
  CERTIFIED: <Award className="size-3.5" />,
  EXPERIENCE: <Activity className="size-3.5" />,
  EMPLOYER_VERIFIED: <ShieldCheck className="size-3.5" />,
  SELF_DECLARED: <User className="size-3.5" />,
};

interface EvoSkill {
  skillId: string; skillName: string;
  events: { date: string; type: string; source: string | null; proficiency: string; confidence: number; description: string | null; verified: boolean }[];
  progression: { date: string; proficiency: string; label: string; index: number }[];
}

export function SkillEvolutionView() {
  const { data: me, loading, error } = useCandidateMe();
  const evoFetch = useFetch<{ skills: EvoSkill[]; resolutionEvents: { id: string; actionType: string; timestamp: string }[] }>("/api/v1/candidate/skill-evolution");

  if (loading) return <LoadingState label="Loading skill evolution…" />;
  if (error || !me) return <ErrorState message={error?.message ?? "Could not load your candidate profile."} />;

  const skills = evoFetch.data?.skills ?? [];
  const resolutions = evoFetch.data?.resolutionEvents ?? [];

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2"><TrendingUp className="size-5 text-primary" /><h2 className="text-xl font-semibold tracking-tight">My Skill Evolution</h2></div>
        <p className="text-sm text-muted-foreground">Timeline of evidence events behind your progression. Synthetic demonstration values clearly labelled.</p>
      </header>

      <div className="rounded-lg border border-status-attention/30 bg-status-attention/5 p-3 flex items-center gap-2">
        <StatusPill tone="attention" dot>Synthetic demonstration data</StatusPill>
        <p className="text-[11px] text-muted-foreground">Dates and progression are synthetic for this prototype.</p>
      </div>

      {skills.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No evolution events yet. Record progress events to build your timeline.</div>
      ) : (
        <div className="space-y-4">
          {skills.map((s) => (
            <div key={s.skillId} className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{s.skillName}</h3>
                {s.progression.length > 0 ? <StatusPill tone="info">{profLabel(s.progression[s.progression.length - 1].proficiency)}</StatusPill> : null}
              </div>

              {/* Progression ladder visual */}
              {s.progression.length > 0 ? (
                <div className="relative">
                  <div className="flex items-center justify-between gap-1">
                    {s.progression.map((p, i) => (
                      <React.Fragment key={i}>
                        <div className="flex flex-col items-center text-center min-w-[60px]">
                          <div className={`size-3 rounded-full ${p.verified ? "bg-primary" : "bg-muted-foreground/40"} ring-2 ring-background`} />
                          <p className="text-[10px] font-medium mt-1">{profLabel(p.proficiency)}</p>
                          <p className="text-[9px] text-muted-foreground">{new Date(p.date).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })}</p>
                          <p className="text-[8px] text-muted-foreground uppercase">{p.label}</p>
                        </div>
                        {i < s.progression.length - 1 ? <div className="flex-1 h-px bg-border" /> : null}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Event list */}
              <div className="space-y-1.5">
                {s.events.map((ev, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <div className="flex size-6 items-center justify-center rounded bg-muted text-muted-foreground shrink-0">{TYPE_ICONS[ev.type] ?? <FileText className="size-3.5" />}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{evidenceTypeLabel(ev.type)}</span>
                        <span className="text-muted-foreground">{new Date(ev.date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>
                        {ev.verified ? <ShieldCheck className="size-3 text-status-positive" /> : null}
                        <StatusPill tone="neutral">{profLabel(ev.proficiency)}</StatusPill>
                      </div>
                      {ev.description ? <p className="text-muted-foreground leading-snug">{ev.description}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {resolutions.length > 0 ? (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Resolution Events Log</h3>
          <div className="rounded-lg border divide-y text-xs">
            {resolutions.slice(0, 10).map((r) => (
              <div key={r.id} className="flex items-center justify-between px-3 py-2">
                <span className="font-medium">{r.actionType.replace(/_/g, " ")}</span>
                <span className="text-muted-foreground">{new Date(r.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
