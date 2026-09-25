"use client";

import * as React from "react";
import { FileText, Award, Briefcase, Activity, ShieldCheck, User, BadgeCheck, ArrowRight, Sparkles } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { LoadingState, ErrorState } from "@/components/kaushal/states";
import { StatusPill } from "@/components/kaushal/status-pill";
import { Badge } from "@/components/ui/badge";
import { useNav } from "@/store/app-store";
import { useCandidateMe } from "../use-candidate";
import { EvidenceDrawer, type EvidenceDetail } from "../evidence-drawer";
import { profLabel, evidenceTypeLabel, freshnessLabel, freshnessTone, gapLabel, gapTone } from "../proficiency";

const EVIDENCE_ICONS: Record<string, React.ReactNode> = {
  SELF_DECLARED: <User className="size-3.5" />,
  ASSESSED: <BadgeCheck className="size-3.5" />,
  CERTIFIED: <Award className="size-3.5" />,
  PROJECT: <Briefcase className="size-3.5" />,
  EXPERIENCE: <Activity className="size-3.5" />,
  EMPLOYER_VERIFIED: <ShieldCheck className="size-3.5" />,
  SYSTEM_INFERRED: <BadgeCheck className="size-3.5" />,
};

const LADDER = ["AWARENESS", "WORKING", "PROFICIENT", "EXPERT"];

interface SkillRow {
  id: string;
  currentProficiency: string;
  proficiencyConfidence: number;
  evidenceStrength: number;
  evidenceCount: number;
  lastVerifiedAt: string | null;
  lastAssessedAt: string | null;
  freshnessStatus: string;
  status: string;
  skill: { id: string; name: string; canonicalName: string; category: string | null; description: string | null };
}
interface EvidenceRow {
  id: string;
  evidenceType: string;
  evidenceSource: string | null;
  evidenceTimestamp: string;
  proficiencyLevel: string;
  verificationStatus: string;
  confidence: number;
  description: string | null;
  skill: { name: string } | null;
}

export function SkillPassport() {
  const { data: me, loading, error } = useCandidateMe();
  const candidateId = me?.candidate.id;
  const targetRoleId = me?.targetRole?.targetRoleId;

  const skillsFetch = useFetch<{ skills: SkillRow[] }>(candidateId ? `/api/v1/candidates/${candidateId}/skills` : null);
  const evidenceFetch = useFetch<{ evidence: EvidenceRow[] }>(candidateId ? `/api/v1/candidates/${candidateId}/evidence` : null);
  const gapsFetch = useFetch<{ gaps: { id: string; requiredProficiency: string; candidateProficiency: string | null; skillId: string; skill: { name: string } | null }[] }>(candidateId ? `/api/v1/candidates/${candidateId}/gaps` : null);

  const [selected, setSelected] = React.useState<EvidenceDetail | null>(null);
  const [open, setOpen] = React.useState(false);
  const setActiveView = useNav((s) => s.setActiveView);

  if (loading) return <LoadingState label="Loading your skill passport…" />;
  if (error || !me) return <ErrorState message={error?.message ?? "Could not load your candidate profile."} />;

  const skills = skillsFetch.data?.skills ?? [];
  const allEvidence = evidenceFetch.data?.evidence ?? [];
  const gaps = gapsFetch.data?.gaps ?? [];

  const requiredBySkill = new Map(gaps.map((g) => [g.skillId ?? "", g.requiredProficiency]));

  const openEvidence = (ev: EvidenceRow) => {
    setSelected(ev as unknown as EvidenceDetail);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2"><Sparkles className="size-5 text-primary" /><h2 className="text-xl font-semibold tracking-tight">My Skill Passport</h2></div>
        <p className="text-sm text-muted-foreground">Every skill below is backed by structured evidence. Tap an evidence item to inspect it.</p>
      </header>

      {skillsFetch.loading ? <LoadingState /> : skills.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No skills in your passport yet.</div>
      ) : (
        <div className="space-y-4">
          {skills.map((s) => {
            const required = requiredBySkill.get(s.skill.id);
            const evidence = allEvidence.filter((e) => e.skill?.name === s.skill.name);
            const gap = required ? gapLabel(required, s.currentProficiency) : "—";
            return (
              <div key={s.id} className="rounded-lg border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{s.skill.name}</p>
                      {s.skill.category ? <Badge className="text-[9px] font-mono uppercase">{s.skill.category}</Badge> : null}
                    </div>
                    {s.skill.description ? <p className="text-[11px] text-muted-foreground leading-snug">{s.skill.description}</p> : null}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {required ? <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Required: <span className="font-semibold text-foreground">{profLabel(required)}</span></span> : null}
                    <StatusPill tone={gapTone(gap)} dot>Gap: {gap}</StatusPill>
                  </div>
                </div>

                {/* Proficiency ladder */}
                <div className="grid grid-cols-4 gap-1.5">
                  {LADDER.map((rung) => {
                    const idx = LADDER.indexOf(s.currentProficiency);
                    const rungIdx = LADDER.indexOf(rung);
                    const isReached = rungIdx <= idx;
                    const isCurrent = rung === s.currentProficiency;
                    const isRequired = rung === required;
                    return (
                      <div key={rung} className={`relative rounded-md border p-2 text-center transition-colors ${isReached ? "border-primary/40 bg-primary/5" : "border-border bg-muted/30"}`}>
                        <p className={`text-[11px] font-medium ${isReached ? "text-foreground" : "text-muted-foreground"}`}>{profLabel(rung)}</p>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          {isCurrent ? <span className="size-1.5 rounded-full bg-primary" title="You are here" /> : null}
                          {isRequired && !isCurrent ? <span className="size-1.5 rounded-full bg-status-attention" title="Role requirement" /> : null}
                          {isRequired && isCurrent ? <span className="size-1.5 rounded-full bg-status-positive" title="Aligned with role" /> : null}
                        </div>
                        {isCurrent ? <p className="text-[8px] text-primary font-medium mt-0.5">YOU</p> : isRequired ? <p className="text-[8px] text-status-attention font-medium mt-0.5">REQUIRED</p> : null}
                      </div>
                    );
                  })}
                </div>

                {/* Evidence */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Evidence ({evidence.length})</p>
                    <div className="flex items-center gap-2">
                      <StatusPill tone={freshnessTone(s.freshnessStatus)}>{freshnessLabel(s.freshnessStatus)}</StatusPill>
                      <span className="text-[10px] text-muted-foreground">Confidence: <span className="font-semibold text-foreground">{Math.round(s.proficiencyConfidence * 100)}%</span></span>
                    </div>
                  </div>
                  {evidence.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground italic">No evidence recorded yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {evidence.map((e) => (
                        <button key={e.id} onClick={() => openEvidence(e)} className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2 py-1 text-[11px] hover:border-primary/40 hover:bg-accent/30 transition-colors">
                          {EVIDENCE_ICONS[e.evidenceType] ?? <FileText className="size-3.5" />}
                          <span className="font-medium">{evidenceTypeLabel(e.evidenceType)}</span>
                          {e.verificationStatus === "VERIFIED" ? <ShieldCheck className="size-3 text-status-positive" /> : null}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button onClick={() => setActiveView(`c-one-skill:${s.skill.id}`)} className="text-[11px] text-primary hover:underline flex items-center gap-1">
                  View full skill intelligence <ArrowRight className="size-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <EvidenceDrawer evidence={selected} open={open} onOpenChange={setOpen} />
    </div>
  );
}
