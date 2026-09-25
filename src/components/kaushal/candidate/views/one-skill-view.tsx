"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, TrendingUp, Target, Award, FileText, AlertTriangle, Route, CheckCircle2, ShieldCheck, Activity, MapPin } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { LoadingState, ErrorState } from "@/components/kaushal/states";
import { StatusPill } from "@/components/kaushal/status-pill";
import { VisualBar, FlowNode } from "@/components/kaushal/visual-components";
import { useNav } from "@/store/app-store";
import { profLabel, gapLabel, gapTone, evidenceTypeLabel, freshnessLabel, freshnessTone } from "../proficiency";

interface OneSkillData {
  skill: { id: string; name: string; canonicalName: string; category: string | null; description: string | null };
  market: { signalValue: number | null; direction: string | null; confidence: number | null; periodLabel: string | null; emergingSignal: { status: string; strength: number; trendVelocity: number } | null };
  role: { id: string; title: string } | null;
  required: { proficiency: string | null };
  demonstrated: { proficiency: string; confidence: number; evidenceCount: number; freshness: string; status: string; lastVerifiedAt: string | null; lastAssessedAt: string | null } | null;
  evidence: { id: string; type: string; source: string | null; timestamp: string; proficiency: string; verification: string; confidence: number; description: string | null }[];
  gap: { id: string; type: string; severity: string | null; status: string; required: string; current: string | null; candidateEvidenceConfidence: number; marketRequirementConfidence: number; evidenceCount: number; freshness: string } | null;
  priority: { signal: string; reason: string | null; marketImportance: number; employerSignal: string; emergingSignal: string; trainingAvailability: string } | null;
  developmentPath: { id: string; sequence: number; actionType: string; status: string; objective: string | null; evidenceRequired: string | null; course: { id: string; name: string } | null }[];
}

export function OneSkillView() {
  const activeView = useNav((s) => s.activeView);
  const setActiveView = useNav((s) => s.setActiveView);
  const skillId = activeView.startsWith("c-one-skill:") ? activeView.split(":")[1] : null;

  const { data, loading, error } = useFetch<OneSkillData>(skillId ? `/api/v1/candidate/one-skill/${skillId}` : null, [skillId]);

  if (!skillId) return <ErrorState message="No skill selected." />;
  if (loading) return <LoadingState label="Loading one-skill intelligence…" />;
  if (error || !data) return <ErrorState message={error?.message ?? "Could not load skill intelligence."} />;

  const s = data.skill;
  const gap = data.gap ? gapLabel(data.required.proficiency, data.demonstrated?.proficiency) : "—";
  const demandLevel = data.market.signalValue != null ? (data.market.signalValue >= 50 ? "HIGH" : data.market.signalValue >= 20 ? "MEDIUM" : "LOW") : null;

  return (
    <div className="space-y-6">
      <button onClick={() => setActiveView("c-passport")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="size-3.5" /> Back to Skill Passport
      </button>

      {/* Hero — skill name */}
      <section className="rounded-xl border bg-gradient-to-br from-primary/5 via-card to-card p-6 space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight">{s.name.toUpperCase()}</h2>
          {s.category ? <StatusPill tone="info">{s.category}</StatusPill> : null}
        </div>
        {s.description ? <p className="text-sm text-muted-foreground">{s.description}</p> : null}
      </section>

      {/* Unified 8-block view */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* MARKET */}
        <Block icon={<TrendingUp className="size-4" />} label="Market" tone="attention">
          <p className="text-lg font-bold">{demandLevel ?? "—"} DEMAND</p>
          <p className="text-[11px] text-muted-foreground">Trend: {data.market.direction ?? "—"} · Signal {data.market.signalValue ?? "—"}</p>
          {data.market.emergingSignal ? <StatusPill tone="attention" dot>{data.market.emergingSignal.status}</StatusPill> : null}
        </Block>

        {/* ROLE */}
        <Block icon={<Target className="size-4" />} label="Role" tone="info">
          <p className="text-lg font-bold">{data.role?.title ?? "—"}</p>
          <p className="text-[11px] text-muted-foreground">Target role</p>
        </Block>

        {/* REQUIRED */}
        <Block icon={<Award className="size-4" />} label="Required" tone="info">
          <p className="text-lg font-bold">{profLabel(data.required.proficiency)}</p>
          <p className="text-[11px] text-muted-foreground">Role requirement</p>
        </Block>

        {/* CANDIDATE */}
        <Block icon={<Activity className="size-4" />} label="Candidate" tone="positive">
          <p className="text-lg font-bold">{data.demonstrated ? profLabel(data.demonstrated.proficiency) : "—"}</p>
          <p className="text-[11px] text-muted-foreground">{data.demonstrated ? `${data.demonstrated.evidenceCount} evidence · ${freshnessLabel(data.demonstrated.freshness)}` : "Not demonstrated"}</p>
        </Block>

        {/* EVIDENCE */}
        <Block icon={<FileText className="size-4" />} label="Evidence" tone="neutral">
          {data.evidence.length === 0 ? <p className="text-sm">No evidence</p> : (
            <div className="space-y-0.5">
              {data.evidence.slice(0, 4).map((e) => (
                <p key={e.id} className="text-[11px] flex items-center gap-1">
                  {e.verification === "VERIFIED" ? <CheckCircle2 className="size-3 text-status-positive" /> : <FileText className="size-3" />}
                  {evidenceTypeLabel(e.type)}
                </p>
              ))}
            </div>
          )}
        </Block>

        {/* GAP */}
        <Block icon={<AlertTriangle className="size-4" />} label="Gap" tone={gapTone(gap)}>
          <p className="text-lg font-bold">{gap === "None (aligned)" ? "NONE" : gap.toUpperCase()}</p>
          <p className="text-[11px] text-muted-foreground">{data.gap ? `${data.gap.type.replace(/_/g, " ")}` : "—"}</p>
        </Block>

        {/* PATH */}
        <Block icon={<Route className="size-4" />} label="Path" tone="info">
          {data.developmentPath.length === 0 ? <p className="text-sm">No path</p> : (
            <p className="text-[11px] leading-snug">{data.developmentPath.map((p) => p.actionType).join(" → ")}</p>
          )}
        </Block>

        {/* OUTCOME */}
        <Block icon={<CheckCircle2 className="size-4" />} label="Outcome" tone="positive">
          <p className="text-sm font-medium">Updated capability</p>
          <p className="text-[11px] text-muted-foreground">After path completion</p>
        </Block>
      </div>

      {/* Priority reason */}
      {data.priority ? (
        <section className="rounded-lg border border-status-attention/30 bg-status-attention/5 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-status-attention" />
            <h3 className="text-sm font-semibold">Why this gap is prioritised</h3>
            <StatusPill tone={data.priority.signal === "CRITICAL" ? "critical" : "attention"} dot>{data.priority.signal}</StatusPill>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{data.priority.reason}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div><p className="text-[9px] uppercase tracking-wider text-muted-foreground">Market importance</p><p className="font-medium">{Math.round(data.priority.marketImportance * 100)}%</p></div>
            <div><p className="text-[9px] uppercase tracking-wider text-muted-foreground">Employer signal</p><p className="font-medium">{data.priority.employerSignal}</p></div>
            <div><p className="text-[9px] uppercase tracking-wider text-muted-foreground">Emerging signal</p><p className="font-medium">{data.priority.emergingSignal}</p></div>
            <div><p className="text-[9px] uppercase tracking-wider text-muted-foreground">Training</p><p className="font-medium">{data.priority.trainingAvailability}</p></div>
          </div>
        </section>
      ) : null}

      {/* Development flow visual */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2"><Route className="size-4 text-primary" /> Development Path — Action to Evidence</h3>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-0.5 flex-wrap">
            {[
              { icon: <Activity className="size-4" />, label: "Current", detail: data.demonstrated ? profLabel(data.demonstrated.proficiency) : "—", tone: "info" as const },
              { icon: <AlertTriangle className="size-4" />, label: "Gap", detail: gap === "None (aligned)" ? "None" : gap, tone: "attention" as const },
              { icon: <Route className="size-4" />, label: "Practice", detail: "Hands-on lab", tone: "info" as const },
              { icon: <FileText className="size-4" />, label: "Assessment", detail: "Verify", tone: "neutral" as const },
              { icon: <CheckCircle2 className="size-4" />, label: "Project", detail: "Apply", tone: "neutral" as const },
              { icon: <ShieldCheck className="size-4" />, label: "Verify", detail: "Employer-verified", tone: "neutral" as const },
              { icon: <Award className="size-4" />, label: "Updated", detail: profLabel(data.required.proficiency), tone: "positive" as const },
            ].map((step, i, arr) => (
              <React.Fragment key={i}>
                <FlowNode icon={step.icon} label={step.label} detail={step.detail} tone={step.tone} />
                {i < arr.length - 1 ? <ArrowRight className="hidden md:block size-3 text-muted-foreground shrink-0" /> : null}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Path steps detail */}
        {data.developmentPath.length > 0 ? (
          <div className="space-y-2">
            {data.developmentPath.map((step) => (
              <div key={step.id} className="flex items-start gap-3 rounded-lg border bg-card p-3">
                <div className="flex size-7 items-center justify-center rounded-md bg-muted text-muted-foreground shrink-0 font-mono text-[10px]">{String(step.sequence).padStart(2, "0")}</div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <StatusPill tone={step.status === "COMPLETED" ? "positive" : step.status === "IN_PROGRESS" ? "info" : "neutral"} dot>{step.actionType}</StatusPill>
                    <StatusPill tone="neutral">{step.status}</StatusPill>
                  </div>
                  <p className="text-xs">{step.objective ?? "—"}</p>
                  {step.course ? <p className="text-[11px] text-primary">{step.course.name}</p> : null}
                  {step.evidenceRequired ? <p className="text-[10px] text-muted-foreground">Evidence: {step.evidenceRequired}</p> : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {/* Evidence list */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Supporting Evidence</h3>
        <div className="rounded-lg border divide-y">
          {data.evidence.map((e) => (
            <div key={e.id} className="flex items-center gap-3 px-3 py-2">
              {e.verification === "VERIFIED" ? <ShieldCheck className="size-4 text-status-positive" /> : <FileText className="size-4 text-muted-foreground" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{evidenceTypeLabel(e.type)}</span>
                  <StatusPill tone="neutral">{profLabel(e.proficiency)}</StatusPill>
                </div>
                <p className="text-[11px] text-muted-foreground">{e.description ?? e.source ?? "—"} · {new Date(e.timestamp).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</p>
              </div>
              <div className="text-right"><VisualBar value={e.confidence * 100} tone="info" height="sm" showValue={false} /><p className="text-[10px] text-muted-foreground">{Math.round(e.confidence * 100)}%</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* Market districts note */}
      <section className="rounded-lg border bg-card p-4 space-y-2">
        <h3 className="text-sm font-semibold flex items-center gap-2"><MapPin className="size-4 text-primary" /> Market Intelligence Snapshot</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div><p className="text-[9px] uppercase tracking-wider text-muted-foreground">Demand signal</p><p className="font-medium">{data.market.signalValue ?? "—"}</p></div>
          <div><p className="text-[9px] uppercase tracking-wider text-muted-foreground">Direction</p><p className="font-medium">{data.market.direction ?? "—"}</p></div>
          <div><p className="text-[9px] uppercase tracking-wider text-muted-foreground">Confidence</p><p className="font-medium">{data.market.confidence != null ? Math.round(data.market.confidence * 100) + "%" : "—"}</p></div>
          <div><p className="text-[9px] uppercase tracking-wider text-muted-foreground">Period</p><p className="font-medium">{data.market.periodLabel ?? "—"}</p></div>
        </div>
      </section>
    </div>
  );
}

function Block({ icon, label, tone, children }: { icon: React.ReactNode; label: string; tone: "positive" | "info" | "attention" | "critical" | "neutral"; children: React.ReactNode }) {
  const toneClass: Record<string, string> = {
    positive: "border-status-positive/30 bg-status-positive/5",
    info: "border-status-info/30 bg-status-info/5",
    attention: "border-status-attention/30 bg-status-attention/5",
    critical: "border-status-critical/30 bg-status-critical/5",
    neutral: "border-border bg-muted/20",
  };
  const iconClass: Record<string, string> = {
    positive: "text-status-positive", info: "text-status-info", attention: "text-status-attention", critical: "text-status-critical", neutral: "text-muted-foreground",
  };
  return (
    <div className={`rounded-lg border p-3 space-y-1.5 ${toneClass[tone]}`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">{icon && <span className={iconClass[tone]}>{icon}</span>}{label}</div>
      {children}
    </div>
  );
}
