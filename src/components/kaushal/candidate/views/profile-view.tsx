"use client";

import * as React from "react";
import { User, Mail, MapPin, GraduationCap, Briefcase, Calendar, ShieldCheck, Activity, Database, TrendingUp } from "lucide-react";
import { LoadingState, ErrorState } from "@/components/kaushal/states";
import { StatusPill } from "@/components/kaushal/status-pill";
import { VisualBar } from "@/components/kaushal/visual-components";
import { useAuth } from "@/store/app-store";
import { useCandidateMe } from "../use-candidate";
import { useFetch } from "@/hooks/use-fetch";

export function ProfileView() {
  const { data: me, loading, error } = useCandidateMe();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const aggFetch = useFetch<{ candidateId: string; targetRole: { id: string; title: string } | null; skillAggregates: { skill: string; candidateProficiency: string; populationTotal: number; populationByProficiency: Record<string, number>; candidatePercentile: number | null }[]; populationSummary: { totalCandidatesInSystem: number; candidatesSharingMySkills: number }; contribution: { message: string; evidenceCount: number } }>("/api/v1/candidate/aggregated");

  if (loading) return <LoadingState label="Loading profile…" />;
  if (error || !me) return <ErrorState message={error?.message ?? "Could not load your profile."} />;

  const c = me.candidate;
  const agg = aggFetch.data;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2"><User className="size-5 text-primary" /><h2 className="text-xl font-semibold tracking-tight">Profile</h2></div>
        <p className="text-sm text-muted-foreground">Your personal skill intelligence profile.</p>
      </header>

      {/* Identity */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">{c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</div>
            <div>
              <h3 className="text-lg font-semibold">{c.name}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="size-3" />{c.email}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2"><GraduationCap className="size-3.5 text-muted-foreground" /><div><p className="text-[9px] uppercase tracking-wider text-muted-foreground">Education</p><p className="font-medium">{c.educationLevel ?? "—"}</p></div></div>
          <div className="flex items-center gap-2"><Briefcase className="size-3.5 text-muted-foreground" /><div><p className="text-[9px] uppercase tracking-wider text-muted-foreground">Experience</p><p className="font-medium">{c.experienceYears ?? 0} years</p></div></div>
          <div className="flex items-center gap-2"><MapPin className="size-3.5 text-muted-foreground" /><div><p className="text-[9px] uppercase tracking-wider text-muted-foreground">District</p><p className="font-medium">{c.district?.name ?? "—"}</p></div></div>
          <div className="flex items-center gap-2"><Calendar className="size-3.5 text-muted-foreground" /><div><p className="text-[9px] uppercase tracking-wider text-muted-foreground">Joined</p><p className="font-medium">{new Date(c.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</p></div></div>
        </div>
      </div>

      {/* Target role */}
      {me.targetRole ? (
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <h3 className="text-sm font-semibold">Target Role</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-medium">{me.targetRole.jobRole.title}</p>
              <p className="text-xs text-muted-foreground">{me.targetRole.jobRole.sector?.name ?? "—"} · {me.targetRole.district?.name ?? "—"}</p>
            </div>
            <StatusPill tone={me.targetRole.marketDemandSignal === "HIGH" ? "attention" : "info"} dot>{me.targetRole.marketDemandSignal} demand</StatusPill>
          </div>
        </div>
      ) : null}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border bg-card p-3 text-center"><Activity className="size-4 mx-auto text-primary" /><p className="text-xl font-bold mt-1">{c.counts.skills}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Skills</p></div>
        <div className="rounded-lg border bg-card p-3 text-center"><ShieldCheck className="size-4 mx-auto text-primary" /><p className="text-xl font-bold mt-1">{c.counts.evidence}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Evidence</p></div>
        <div className="rounded-lg border bg-card p-3 text-center"><Database className="size-4 mx-auto text-primary" /><p className="text-xl font-bold mt-1">{c.counts.assessments}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Assessments</p></div>
        <div className="rounded-lg border bg-card p-3 text-center"><TrendingUp className="size-4 mx-auto text-primary" /><p className="text-xl font-bold mt-1">{c.counts.skillGaps}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Skill gaps</p></div>
      </div>

      {/* Aggregated intelligence contribution */}
      {agg ? (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Database className="size-4 text-primary" /> Your Contribution to Shared Intelligence</h3>
          <div className="rounded-md bg-muted/40 p-3 text-[11px] text-muted-foreground leading-relaxed">
            <ShieldCheck className="size-3 inline mr-1" />
            {agg.contribution.message}
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><p className="text-[9px] uppercase tracking-wider text-muted-foreground">Total candidates in system</p><p className="text-lg font-bold">{agg.populationSummary.totalCandidatesInSystem}</p></div>
            <div><p className="text-[9px] uppercase tracking-wider text-muted-foreground">Candidates sharing your skills</p><p className="text-lg font-bold">{agg.populationSummary.candidatesSharingMySkills}</p></div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Your percentile by skill (privacy-preserving aggregation)</p>
            {agg.skillAggregates.map((s) => (
              <div key={s.skill} className="flex items-center gap-3">
                <span className="text-xs w-32 truncate">{s.skill}</span>
                <div className="flex-1"><VisualBar value={s.candidatePercentile ?? 0} tone="info" height="sm" showValue={false} /></div>
                <span className="text-xs tabular-nums w-12 text-right">{s.candidatePercentile ?? 0}%ile</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Privacy */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
        <h3 className="text-sm font-semibold flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> Privacy & Visibility</h3>
        <ul className="space-y-1 text-[11px] text-muted-foreground leading-relaxed list-disc pl-4">
          <li>You see: your own data and relevant market information.</li>
          <li>Employers see: only capability relevant to an opportunity/application.</li>
          <li>Training ecosystem sees: learning/capability info necessary for training workflows.</li>
          <li>Government uses aggregated intelligence — no individual identities where aggregation suffices.</li>
        </ul>
      </div>

      <div className="flex justify-end">
        <button onClick={() => logout()} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Sign out</button>
      </div>
    </div>
  );
}
