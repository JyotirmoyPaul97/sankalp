"use client";

import * as React from "react";
import {
  ArrowLeft,
  ArrowRight,
  FlaskConical,
  GraduationCap,
  Briefcase,
  Boxes,
  Sparkles,
  Users,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { PageHeader, SectionLabel } from "@/components/kaushal/page-header";
import { MetricCard } from "@/components/kaushal/metric-card";
import { EvidencePanel } from "@/components/kaushal/evidence-panel";
import { StatusPill } from "@/components/kaushal/status-pill";
import { useFetch } from "@/hooks/use-fetch";
import { ErrorState, LoadingState } from "@/components/kaushal/states";
import { useNav } from "@/store/app-store";
import {
  ConfidenceBadge,
  PrioritySignal,
  StatusBadge,
  VisualBar,
  DemandSupplyComparison,
} from "@/components/kaushal/visual-components";
import type { DistrictDetail } from "@/types/domain";

interface DistrictTwin {
  district: { name: string; division: string | null };
  observationPeriod: string;
  market: {
    topSkills: { name: string; signal: number }[];
    emergingSkills: { name: string; status: string }[];
    sectorGrowth: { sector: string; growth: number | null }[];
  };
  training: {
    institutions: number;
    centres: number;
    plannedCapacity: number;
    enrolled: number;
    completed: number;
    certified: number;
    courseOfferings: number;
  };
  capability: {
    readyCourses: number;
    partiallyReadyCourses: number;
    limitedReadinessCourses: number;
    totalDeliveryGaps: number;
  };
  gaps: {
    highGapCount: number;
    moderateGapCount: number;
    proficiencyMismatchCount: number;
    coveredCount: number;
    totalGaps: number;
  };
  candidates: {
    totalCandidates: number;
    highReadiness: number;
    moderateReadiness: number;
    developing: number;
  };
  confidence: number;
  freshness: string;
  dataStatus: string;
}

interface DistrictSkillGap {
  id: string;
  skill: { id: string; name: string; canonicalName: string } | null;
  gapSignal: string;
  gapScore: number;
  confidenceLevel: string;
  marketDemandSignal: string;
  trainingSupplySignal: string;
  marketDemandStrength: number;
  trainingSupplyStrength: number;
  coverageStatus: string;
  capacityStatus: string;
  proficiencyStatus: string;
  plannedCapacity: number;
}

const DEMAND_LABEL: Record<string, string> = {
  HIGH: "High demand",
  MEDIUM: "Steady demand",
  LOW: "Low demand",
  NONE: "No signal",
};

const SUPPLY_LABEL: Record<string, string> = {
  HIGH: "Coverage available",
  MEDIUM: "Partial coverage",
  LOW: "Limited coverage",
  NONE: "No supply identified",
};

const GAP_TONE: Record<string, "critical" | "attention" | "info" | "positive" | "neutral"> = {
  HIGH_GAP: "critical",
  NO_IDENTIFIED_SUPPLY: "critical",
  PROFICIENCY_MISMATCH: "attention",
  GEOGRAPHIC_GAP: "attention",
  MODERATE_GAP: "attention",
  SUPPLY_LIMITED: "attention",
  LOW_GAP: "positive",
  SUPPLY_PRESENT: "positive",
  INSUFFICIENT_DATA: "neutral",
};

export function DistrictProfileView() {
  const districtId = useNav((s) => s.activeDistrictId);
  const setActiveView = useNav((s) => s.setActiveView);

  const {
    data: district,
    loading: districtLoading,
    error: districtError,
    refetch,
  } = useFetch<DistrictDetail>(districtId ? `/api/v1/districts/${districtId}` : null);

  const { data: twin, loading: twinLoading, error: twinError } = useFetch<DistrictTwin>(
    districtId ? `/api/v1/district-twin/${districtId}` : null,
  );

  const { data: gapData } = useFetch<{ skills: DistrictSkillGap[] }>(
    districtId ? `/api/v1/gaps/skills?districtId=${districtId}` : null,
  );

  if (districtLoading && !district) return <LoadingState label="Loading district profile…" />;
  if (districtError) return <ErrorState message={districtError.message} onRetry={refetch} />;
  if (!district)
    return (
      <ErrorState
        title="District not selected"
        message="No district was selected. Return to the district list to choose one."
        onRetry={() => setActiveView("districts")}
      />
    );

  // Compose the 6 compact skill-profile metrics
  const topGaps = (gapData?.skills ?? []).slice(0, 5);
  const totalDemandSignals = twin?.market.topSkills.length ?? 0;
  const totalTrainingSeats = twin?.training.plannedCapacity ?? 0;
  const highGapCount = twin?.gaps.highGapCount ?? 0;
  const moderateGapCount = twin?.gaps.moderateGapCount ?? 0;
  const readyCourses = twin?.capability.readyCourses ?? 0;
  const partiallyReadyCourses = twin?.capability.partiallyReadyCourses ?? 0;
  const limitedReadinessCourses = twin?.capability.limitedReadinessCourses ?? 0;
  const emergingCount = twin?.market.emergingSkills.length ?? 0;
  const candidateTotal = twin?.candidates.totalCandidates ?? 0;
  const candidateHigh = twin?.candidates.highReadiness ?? 0;

  type MetricTone = "default" | "info" | "positive" | "attention" | "critical";
  const skillProfileMetrics: { label: string; value: number; hint: string; icon: React.ReactNode; tone: MetricTone }[] = [
    {
      label: "Market Demand",
      value: totalDemandSignals,
      hint: "top demand skills",
      icon: <TrendingUp className="size-4" />,
      tone: "info",
    },
    {
      label: "Training Capacity",
      value: totalTrainingSeats,
      hint: `${twin?.training.centres ?? 0} centres`,
      icon: <GraduationCap className="size-4" />,
      tone: "default",
    },
    {
      label: "Critical Skill Gaps",
      value: highGapCount,
      hint: `${moderateGapCount} moderate`,
      icon: <AlertTriangle className="size-4" />,
      tone: highGapCount > 0 ? "critical" : "positive",
    },
    {
      label: "Centre Readiness",
      value: readyCourses,
      hint: `${partiallyReadyCourses + limitedReadinessCourses} need work`,
      icon: <Boxes className="size-4" />,
      tone: readyCourses > 0 ? "positive" : "attention",
    },
    {
      label: "Emerging Skills",
      value: emergingCount,
      hint: "radar signals",
      icon: <Sparkles className="size-4" />,
      tone: "default",
    },
    {
      label: "Candidate Readiness",
      value: candidateHigh,
      hint: `${candidateTotal} total candidates`,
      icon: <Users className="size-4" />,
      tone: candidateHigh > 0 ? "positive" : "attention",
    },
  ];

  // Build priority signals from top district gaps
  const priorityActions = topGaps.map((g) => {
    const skillName = g.skill?.name ?? "—";
    const market = DEMAND_LABEL[g.marketDemandSignal] ?? "Demand signal";
    const training = SUPPLY_LABEL[g.trainingSupplySignal] ?? "Training signal";
    const isCritical = g.gapSignal === "HIGH_GAP" || g.gapSignal === "NO_IDENTIFIED_SUPPLY";

    let cause = "Mismatch between market demand and training supply";
    if (g.coverageStatus === "NO_IDENTIFIED_SUPPLY") {
      cause = "No training supply identified for this skill";
    } else if (g.coverageStatus === "LIMITED_COVERAGE") {
      cause = "Limited course coverage across institutions";
    } else if (g.proficiencyStatus === "LOWER_THAN_MARKET") {
      cause = "Training proficiency below market requirement";
    } else if (g.capacityStatus === "WEAK" || g.capacityStatus === "NO_CAPACITY") {
      cause = "Insufficient training capacity — weak or no equipment/trainer readiness";
    } else if (g.gapSignal === "GEOGRAPHIC_GAP") {
      cause = "Training exists outside target geography";
    }

    let action = "Audit and address gap — see Policy Sandbox";
    if (g.trainingSupplySignal === "NONE") {
      action = "Build new training supply — see Policy Sandbox";
    } else if (g.trainingSupplySignal === "LOW") {
      action = "Scale training capacity — see Policy Sandbox";
    } else if (g.proficiencyStatus === "LOWER_THAN_MARKET") {
      action = "Upgrade trainer proficiency — see Policy Sandbox";
    }

    return {
      title: skillName,
      market,
      training,
      cause,
      action,
      onClick: () => setActiveView("policy-sandbox"),
      tone: GAP_TONE[g.gapSignal] ?? "neutral",
      confidence: g.confidenceLevel,
      gapScore: g.gapScore,
    };
  });

  return (
    <div className="space-y-6">
      <button
        onClick={() => setActiveView("districts")}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" /> Back to districts
      </button>

      <PageHeader
        title={district.name}
        description={`District code ${district.code} · ${twin?.district.division ?? "—"} Division · Period: ${twin?.observationPeriod ?? "—"}.`}
        badge={
          <div className="flex items-center gap-2">
            <ConfidenceBadge confidence={twin && twin.confidence >= 0.6 ? "HIGH" : "MEDIUM"} />
            <StatusBadge status="SYNTHETIC" />
          </div>
        }
      />

      {/* District Skill Profile — 6 compact metrics */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>District Skill Profile</SectionLabel>
          {twinLoading ? <span className="text-[11px] text-muted-foreground">Loading intelligence…</span> : null}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {skillProfileMetrics.map((m) => (
            <MetricCard
              key={m.label}
              label={m.label}
              value={m.value}
              hint={m.hint}
              icon={m.icon}
              tone={m.tone}
              loading={twinLoading && !twin}
            />
          ))}
        </div>
      </section>

      {/* Twin error */}
      {twinError ? (
        <ErrorState
          title="District intelligence unavailable"
          message={twinError.message}
          onRetry={() => useNav.getState().setActiveView("districts")}
        />
      ) : null}

      {/* Demand vs Supply (district-level top 3 gaps) */}
      {topGaps.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionLabel>Where demand meets training</SectionLabel>
            <button
              onClick={() => setActiveView("gap-intelligence")}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              All skills <ArrowRight className="size-3" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topGaps.slice(0, 3).map((g) => (
              <DemandSupplyComparison
                key={g.id}
                skill={g.skill?.name ?? "—"}
                demandValue={Math.round(g.marketDemandStrength)}
                supplyValue={Math.round(g.trainingSupplyStrength)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* Priority Actions */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>Priority actions for this district</SectionLabel>
          <span className="text-[11px] text-muted-foreground">
            {priorityActions.length} signals · derived from gap intelligence
          </span>
        </div>
        {priorityActions.length === 0 ? (
          <LoadingState label="Computing priority actions…" />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {priorityActions.map((s) => (
              <div key={s.title} className="space-y-1.5">
                <PrioritySignal
                  title={s.title}
                  market={s.market}
                  training={s.training}
                  cause={s.cause}
                  action={s.action}
                  onClick={s.onClick}
                />
                <div className="flex items-center gap-2 px-1 text-[10px] text-muted-foreground">
                  <span>Gap score:</span>
                  <span className="tabular-nums font-medium">{Math.round(s.gapScore)}</span>
                  <span>·</span>
                  <span>Confidence:</span>
                  <span className="font-medium">{s.confidence}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Top demand skills + emerging + training capability visual */}
      {twin ? (
        <section className="grid lg:grid-cols-3 gap-4">
          <EvidencePanel title="Top demand skills" source="Market Intelligence" lastUpdated={twin.freshness}>
            <div className="space-y-2.5 pt-1">
              {twin.market.topSkills.length === 0 ? (
                <p className="text-xs text-muted-foreground">No market signals observed in this district.</p>
              ) : (
                twin.market.topSkills.slice(0, 5).map((s) => {
                  const tone = s.signal > 60 ? "attention" : s.signal > 30 ? "info" : "neutral";
                  return (
                    <div key={s.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{s.name}</span>
                        <span className="tabular-nums text-muted-foreground">{s.signal}</span>
                      </div>
                      <VisualBar label="" value={s.signal} tone={tone as never} height="sm" showValue={false} />
                    </div>
                  );
                })
              )}
            </div>
          </EvidencePanel>

          <EvidencePanel title="Emerging skills" source="Market Radar">
            <div className="space-y-2 pt-1">
              {twin.market.emergingSkills.length === 0 ? (
                <p className="text-xs text-muted-foreground">No emerging signals in this district.</p>
              ) : (
                twin.market.emergingSkills.map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <span className="font-medium">{s.name}</span>
                    <StatusPill
                      tone={
                        s.status === "ACCELERATING"
                          ? "critical"
                          : s.status === "EMERGING"
                            ? "attention"
                            : "info"
                      }
                      dot
                    >
                      {s.status.replace(/_/g, " ").toLowerCase()}
                    </StatusPill>
                  </div>
                ))
              )}
            </div>
          </EvidencePanel>

          <EvidencePanel title="Centre readiness" source="Capability Intelligence">
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <ShieldCheck className="size-3.5" /> Delivery ready
                </span>
                <StatusPill tone="positive" dot>{twin.capability.readyCourses}</StatusPill>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Boxes className="size-3.5" /> Partially ready
                </span>
                <StatusPill tone="attention" dot>{twin.capability.partiallyReadyCourses}</StatusPill>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <AlertTriangle className="size-3.5" /> Limited readiness
                </span>
                <StatusPill tone="critical" dot>{twin.capability.limitedReadinessCourses}</StatusPill>
              </div>
            </div>
          </EvidencePanel>
        </section>
      ) : null}

      {/* Drill-down actions */}
      <section className="grid sm:grid-cols-3 gap-3">
        <button
          onClick={() => setActiveView("district-twin")}
          className="text-left rounded-lg border bg-card p-4 space-y-1.5 hover:border-primary/40 hover:bg-accent/30 transition-colors"
        >
          <div className="flex items-center gap-2 text-primary">
            <Boxes className="size-4" />
            <span className="text-sm font-medium">District Digital Twin</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Layered view of market, training, capability, candidates, and outcomes.
          </p>
        </button>
        <button
          onClick={() => setActiveView("policy-sandbox")}
          className="text-left rounded-lg border bg-card p-4 space-y-1.5 hover:border-primary/40 hover:bg-accent/30 transition-colors"
        >
          <div className="flex items-center gap-2 text-primary">
            <FlaskConical className="size-4" />
            <span className="text-sm font-medium">Policy Sandbox</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Simulate interventions and compare alternatives for this district.
          </p>
        </button>
        <button
          onClick={() => setActiveView("district-plans")}
          className="text-left rounded-lg border bg-card p-4 space-y-1.5 hover:border-primary/40 hover:bg-accent/30 transition-colors"
        >
          <div className="flex items-center gap-2 text-primary">
            <Briefcase className="size-4" />
            <span className="text-sm font-medium">District Plans</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Evidence-linked planning for the district.
          </p>
        </button>
      </section>

      <div className="flex items-center gap-2 text-[11px] text-muted-foreground border-t pt-3">
        <ShieldCheck className="size-3.5" />
        <span>
          All values derived from existing intelligence — labour-market signals, training capacity,
          and demand-supply gap computation. No forecasting. No automatic recommendations.
        </span>
      </div>
    </div>
  );
}
