"use client";

import * as React from "react";
import {
  ArrowRight,
  Building2,
  GraduationCap,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  FlaskConical,
  Briefcase,
  Target,
  Map as MapIcon,
} from "lucide-react";
import { PageHeader, SectionLabel } from "@/components/kaushal/page-header";
import { MetricCard } from "@/components/kaushal/metric-card";
import { EvidencePanel } from "@/components/kaushal/evidence-panel";
import { StatusPill } from "@/components/kaushal/status-pill";
import { useFetch } from "@/hooks/use-fetch";
import { LoadingState } from "@/components/kaushal/states";
import { useNav } from "@/store/app-store";
import {
  AnimatedCounter,
  ConfidenceBadge,
  DemandSupplyComparison,
  EvidenceChain,
  PrioritySignal,
  StatusBadge,
  VisualBar,
} from "@/components/kaushal/visual-components";
import { MaharashtraIntelligenceBackground } from "@/components/kaushal/maharashtra-background";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import type {
  DistrictGapSummary,
  MarketDemandSkill,
  PlatformMeta,
} from "@/types/domain";

// ---------------------------------------------------------------------
// Layers toggle for the Maharashtra Intelligence Map
// ---------------------------------------------------------------------

const LAYERS = [
  { id: "gap", label: "Skill Gap", hint: "High-gap + no-supply signals" },
  { id: "demand", label: "Demand Pressure", hint: "Volume of demand-supply signals" },
  { id: "coverage", label: "Training Coverage", hint: "Share of skills covered" },
  { id: "emerging", label: "Emerging Skills", hint: "Skills with no identified supply" },
  { id: "readiness", label: "Centre Readiness", hint: "Proficiency mismatch signals" },
  { id: "outcome", label: "Outcome Signal", hint: "Inverse of high-gap intensity" },
] as const;

type LayerId = (typeof LAYERS)[number]["id"];

const LAYER_COLOR: Record<LayerId, string> = {
  gap: "#dc2626",
  demand: "#f59e0b",
  coverage: "#10b981",
  emerging: "#14b8a6",
  readiness: "#0ea5e9",
  outcome: "#6366f1",
};

function intensityFor(layer: LayerId, d: DistrictGapSummary): number {
  const total = Math.max(1, d.totalGaps);
  switch (layer) {
    case "gap":
      return Math.min(1, (d.highGapCount + d.noSupplyCount * 0.8 + d.proficiencyMismatchCount * 0.5) / total);
    case "demand":
      return Math.min(1, d.totalGaps / 30);
    case "coverage":
      return d.coveredCount / total;
    case "emerging":
      return Math.min(1, d.noSupplyCount / 5);
    case "readiness":
      return Math.min(1, d.proficiencyMismatchCount / 8);
    case "outcome":
      return Math.max(0, 1 - d.highGapCount / total);
  }
}

// ---------------------------------------------------------------------
// Maharashtra Skill Intelligence Map (SVG district grid heat-map)
// ---------------------------------------------------------------------

interface MapCell {
  id: string;
  name: string;
  row: number;
  col: number;
  intensity: number;
  raw: { highGap: number; totalGaps: number; covered: number; noSupply: number };
}

/** 6×6 grid positions, evoking Maharashtra's wide-north / tapering-south shape. */
const SHAPE_MASK: number[][] = [
  [1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 0, 0],
];

function MaharashtraIntelligenceMap({
  districts,
  layer,
  onLayerChange,
  onDistrictClick,
}: {
  districts: DistrictGapSummary[];
  layer: LayerId;
  onLayerChange: (l: LayerId) => void;
  onDistrictClick: (id: string) => void;
}) {
  // Assign districts to grid cells in a deterministic order
  const sorted = React.useMemo(
    () => [...districts].sort((a, b) => a.district.name.localeCompare(b.district.name)),
    [districts],
  );

  const cells: MapCell[] = React.useMemo(() => {
    const out: MapCell[] = [];
    let idx = 0;
    for (let r = 0; r < SHAPE_MASK.length; r++) {
      for (let c = 0; c < SHAPE_MASK[r].length; c++) {
        if (SHAPE_MASK[r][c] === 0) continue;
        const d = sorted[idx];
        idx += 1;
        if (!d) continue;
        out.push({
          id: d.district.id,
          name: d.district.name,
          row: r,
          col: c,
          intensity: intensityFor(layer, d),
          raw: {
            highGap: d.highGapCount,
            totalGaps: d.totalGaps,
            covered: d.coveredCount,
            noSupply: d.noSupplyCount,
          },
        });
      }
    }
    return out;
  }, [sorted, layer]);

  const cols = 6;
  const rows = 6;
  const cellSize = 56;
  const gap = 6;
  const padX = 16;
  const padY = 16;
  const width = padX * 2 + cols * cellSize + (cols - 1) * gap;
  const height = padY * 2 + rows * cellSize + (rows - 1) * gap;
  const activeColor = LAYER_COLOR[layer];

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <MapIcon className="size-4 text-primary" />
            <h3 className="text-sm font-semibold">Maharashtra Skill Intelligence Map</h3>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {cells.length} districts · intensity by layer · click a district to drill in
          </p>
        </div>
        <StatusPill tone="info" dot>Live Intelligence</StatusPill>
      </div>

      {/* Layer toggle / legend */}
      <div className="flex flex-wrap items-center gap-1.5">
        {LAYERS.map((l) => {
          const active = l.id === layer;
          return (
            <button
              key={l.id}
              onClick={() => onLayerChange(l.id)}
              title={l.hint}
              className={
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors " +
                (active
                  ? "border-foreground/20 bg-foreground/5 text-foreground"
                  : "border-border bg-transparent text-muted-foreground hover:bg-accent/40")
              }
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: LAYER_COLOR[l.id] }}
              />
              {l.label}
            </button>
          );
        })}
      </div>

      {/* SVG grid */}
      <div className="w-full overflow-x-auto scroll-thin">
        <TooltipProvider delayDuration={120}>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto"
            style={{ maxWidth: width, maxHeight: height }}
            role="img"
            aria-label="Maharashtra district skill-intensity heat-map"
          >
            <defs>
              <linearGradient id="map-fade" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={activeColor} stopOpacity="0.05" />
                <stop offset="100%" stopColor={activeColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width={width} height={height} fill="url(#map-fade)" rx="8" />
            {cells.map((cell) => {
              const x = padX + cell.col * (cellSize + gap);
              const y = padY + cell.row * (cellSize + gap);
              // For coverage layer, higher is greener; for others higher = stronger color
              const isCoverage = layer === "coverage";
              const opacity = isCoverage ? 0.2 + cell.intensity * 0.7 : 0.15 + cell.intensity * 0.8;
              const fill = cell.intensity === 0 && !isCoverage ? "transparent" : activeColor;
              return (
                <Tooltip key={cell.id}>
                  <TooltipTrigger asChild>
                    <g
                      onClick={() => onDistrictClick(cell.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <rect
                        x={x}
                        y={y}
                        width={cellSize}
                        height={cellSize}
                        rx={8}
                        fill={fill}
                        fillOpacity={opacity}
                        stroke={activeColor}
                        strokeOpacity={0.35}
                        strokeWidth={1}
                        className="transition-all hover:stroke-foreground hover:stroke-opacity-80"
                      />
                      <text
                        x={x + cellSize / 2}
                        y={y + cellSize / 2 + 4}
                        textAnchor="middle"
                        fontSize={9}
                        fill="currentColor"
                        className="font-medium"
                        style={{ pointerEvents: "none" }}
                      >
                        {cell.name.slice(0, 6)}
                      </text>
                    </g>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <div className="space-y-0.5">
                      <p className="font-semibold">{cell.name}</p>
                      <p className="text-muted-foreground">
                        High gaps: <span className="tabular-nums font-medium text-foreground">{cell.raw.highGap}</span>
                      </p>
                      <p className="text-muted-foreground">
                        Total signals: <span className="tabular-nums font-medium text-foreground">{cell.raw.totalGaps}</span>
                      </p>
                      <p className="text-muted-foreground">
                        Covered: <span className="tabular-nums font-medium text-foreground">{cell.raw.covered}</span>
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </svg>
        </TooltipProvider>
      </div>

      {/* Intensity legend */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Low intensity</span>
        <div className="flex items-center gap-1">
          {[0.1, 0.3, 0.5, 0.7, 0.9].map((o) => (
            <span
              key={o}
              className="size-3 rounded-sm"
              style={{ backgroundColor: activeColor, opacity: 0.15 + o * 0.8 }}
            />
          ))}
        </div>
        <span>High intensity</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------

export function OverviewView() {
  const { data: meta, loading } = useFetch<PlatformMeta>("/api/v1/meta");
  const { data: gapData } = useFetch<{ districts: DistrictGapSummary[] }>("/api/v1/gaps/districts");
  const { data: skillGaps } = useFetch<{ skills: Array<{ id: string; skill: { id: string; name: string } | null; marketDemandStrength: number; trainingSupplyStrength: number; gapScore: number; gapSignal: string; confidenceLevel: string }> }>("/api/v1/gaps/skills");
  const { data: marketSkills } = useFetch<{ skills: MarketDemandSkill[] }>("/api/v1/market-demand/skills");
  const setActiveView = useNav((s) => s.setActiveView);
  const openDistrict = useNav((s) => s.openDistrict);

  const [layer, setLayer] = React.useState<LayerId>("gap");

  const counts = meta?.counts ?? {};

  // Headline metric strip — 4 numbers, derived from live intelligence
  const headlineMetrics = [
    { label: "Districts", value: counts.districts ?? 0, hint: "monitored", icon: <Building2 className="size-4" />, tone: "info" as const, view: "districts" },
    { label: "Skills tracked", value: counts.skills ?? 0, hint: "canonical", icon: <Sparkles className="size-4" />, tone: "default" as const, view: "skills" },
    { label: "Market signals", value: meta?.marketHealth?.marketSignals ?? 0, hint: "aggregated", icon: <TrendingUp className="size-4" />, tone: "default" as const, view: "labour-market" },
    { label: "Training centres", value: counts.trainingCentres ?? 0, hint: "active", icon: <GraduationCap className="size-4" />, tone: "default" as const, view: "training" },
  ];

  // Top priority signals (statewide) — aggregated from district gap summaries
  const prioritySignals = React.useMemo(() => {
    const districts = gapData?.districts ?? [];
    const map = new Map<
      string,
      {
        skill: string;
        gapSignal: string;
        marketDemand: string;
        trainingSupply: string;
        totalGaps: number;
        highCount: number;
        noSupplyCount: number;
        districtsAffected: number;
      }
    >();
    for (const d of districts) {
      for (const g of d.topGaps) {
        const existing = map.get(g.skill) ?? {
          skill: g.skill,
          gapSignal: g.gapSignal,
          marketDemand: g.marketDemand,
          trainingSupply: g.trainingSupply,
          totalGaps: 0,
          highCount: 0,
          noSupplyCount: 0,
          districtsAffected: 0,
        };
        existing.totalGaps += 1;
        if (g.gapSignal === "HIGH_GAP") existing.highCount += 1;
        existing.districtsAffected += 1;
        map.set(g.skill, existing);
      }
    }
    const sorted = [...map.values()]
      .sort((a, b) => b.highCount - a.highCount || b.totalGaps - a.totalGaps)
      .slice(0, 5);

    return sorted.map((s) => {
      const isHigh = s.gapSignal === "HIGH_GAP" || s.gapSignal === "NO_IDENTIFIED_SUPPLY";
      const marketLabel =
        s.marketDemand === "HIGH" ? "High demand" :
        s.marketDemand === "MEDIUM" ? "Steady demand" :
        s.marketDemand === "LOW" ? "Low demand" : "Demand signal";
      const trainingLabel =
        s.trainingSupply === "NO_IDENTIFIED_SUPPLY" ? "No supply identified" :
        s.trainingSupply === "LOW" ? "Partial coverage" :
        s.trainingSupply === "MEDIUM" ? "Partial coverage" :
        s.trainingSupply === "HIGH" ? "Coverage available" : "Training signal";

      const cause = isHigh
        ? `${s.highCount} high-priority gaps across ${s.districtsAffected} districts`
        : `Mismatch signals across ${s.districtsAffected} districts`;

      const action = s.trainingSupply === "NO_IDENTIFIED_SUPPLY"
        ? "Build training supply — see Policy Sandbox"
        : s.trainingSupply === "LOW"
          ? "Scale training capacity — see Policy Sandbox"
          : "Audit proficiency alignment — see Policy Sandbox";

      return {
        title: s.skill,
        market: marketLabel,
        training: trainingLabel,
        cause,
        action,
      };
    });
  }, [gapData]);

  // Demand vs Supply for 3 highest-gap skills statewide
  const demandSupply = React.useMemo(() => {
    const gaps = skillGaps?.skills ?? [];
    if (gaps.length === 0) return [];
    // Aggregate by skill name
    const byName = new Map<string, { name: string; demand: number; supply: number; gapScore: number }>();
    for (const g of gaps) {
      if (!g.skill) continue;
      const e = byName.get(g.skill.name) ?? { name: g.skill.name, demand: 0, supply: 0, gapScore: 0 };
      e.demand = Math.max(e.demand, g.marketDemandStrength);
      e.supply = Math.max(e.supply, g.trainingSupplyStrength);
      e.gapScore = Math.max(e.gapScore, g.gapScore);
      byName.set(g.skill.name, e);
    }
    return [...byName.values()]
      .sort((a, b) => b.gapScore - a.gapScore)
      .slice(0, 3)
      .map((s) => ({
        skill: s.name,
        demandValue: Math.round(s.demand),
        supplyValue: Math.round(s.supply),
      }));
  }, [skillGaps]);

  // Top emerging skills (statewide) — small visual
  const topEmerging = React.useMemo(() => {
    const list = marketSkills?.skills ?? [];
    return list
      .filter((s) => s.trend && s.trend !== "FLAT" && s.trend !== "UNKNOWN")
      .slice(0, 5)
      .map((s) => ({ name: s.skill.name, trend: s.trend, strength: s.signalStrength }));
  }, [marketSkills]);

  return (
    <div className="space-y-8">
      {/* Headline + intelligence banner */}
      <div className="relative overflow-hidden rounded-xl border bg-card">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <MaharashtraIntelligenceBackground variant="hero" />
        </div>
        <div className="relative p-6 lg:p-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">
                  Maharashtra Skill Intelligence
                </h1>
                <StatusBadge status="SYNTHETIC" />
              </div>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Live intelligence across districts, skills and training — what is happening right now,
                where the gaps are, and what should be done.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="size-2 rounded-full bg-status-positive animate-pulse" />
              <span className="text-[11px] text-muted-foreground">Intelligence engine active · Period: 2026-09</span>
              <ConfidenceBadge confidence="HIGH" />
            </div>
          </div>

          {/* 4 headline metrics */}
          {loading ? (
            <LoadingState label="Loading intelligence…" />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              {headlineMetrics.map((m) => (
                <button
                  key={m.label}
                  onClick={() => setActiveView(m.view)}
                  className="text-left transition-transform hover:-translate-y-0.5"
                >
                  <MetricCard
                    label={m.label}
                    value={<AnimatedCounter value={m.value} />}
                    hint={m.hint}
                    icon={m.icon}
                    tone={m.tone}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Primary visual: Maharashtra Intelligence Map */}
      <section className="space-y-3">
        <SectionLabel>What is happening across Maharashtra?</SectionLabel>
        <MaharashtraIntelligenceMap
          districts={gapData?.districts ?? []}
          layer={layer}
          onLayerChange={setLayer}
          onDistrictClick={(id) => openDistrict(id)}
        />
        <div className="flex items-center justify-end">
          <button
            onClick={() => setActiveView("gap-districts")}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Open district gap intelligence <ArrowRight className="size-3" />
          </button>
        </div>
      </section>

      {/* Priority signals */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>Priority signals for government action</SectionLabel>
          <span className="text-[11px] text-muted-foreground">
            {prioritySignals.length} signals · derived from district gap intelligence
          </span>
        </div>
        {prioritySignals.length === 0 ? (
          <LoadingState label="Computing priority signals…" />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {prioritySignals.map((s) => (
              <PrioritySignal
                key={s.title}
                title={s.title}
                market={s.market}
                training={s.training}
                cause={s.cause}
                action={s.action}
                onClick={() => setActiveView("gap-intelligence")}
              />
            ))}
          </div>
        )}
      </section>

      {/* Demand vs Supply */}
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
        {demandSupply.length === 0 ? (
          <LoadingState label="Loading demand vs supply…" />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {demandSupply.map((s) => (
              <DemandSupplyComparison
                key={s.skill}
                skill={s.skill}
                demandValue={s.demandValue}
                supplyValue={s.supplyValue}
              />
            ))}
          </div>
        )}
      </section>

      {/* Evidence chain + emerging skills + policy call to action */}
      <section className="grid lg:grid-cols-3 gap-4">
        <EvidencePanel title="Evidence, not claims" source="Skill Intelligence" lastUpdated="2026-09">
          <EvidenceChain
            items={[
              { icon: null, label: "Self-Declared", detail: "Advanced", verified: true },
              { icon: null, label: "Assessment", detail: "Intermediate", verified: true },
              { icon: null, label: "Project", detail: "Advanced", verified: true },
              { icon: null, label: "Certificate", detail: "Verified", verified: true },
              { icon: null, label: "Employer", detail: "Pending", verified: false },
            ]}
            demonstratedLevel="INTERMEDIATE"
            confidence="HIGH"
          />
        </EvidencePanel>

        <EvidencePanel title="Emerging skills" source="Market Radar">
          {topEmerging.length === 0 ? (
            <LoadingState label="Watching signals…" />
          ) : (
            <div className="space-y-3 pt-1">
              {topEmerging.map((s) => {
                const tone =
                  s.trend === "RISING" ? "attention" :
                  s.trend === "ACCELERATING" ? "critical" :
                  s.trend === "EMERGING" ? "info" : "neutral";
                return (
                  <div key={s.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{s.name}</span>
                      <StatusPill tone={tone as never} dot>{s.trend}</StatusPill>
                    </div>
                    <VisualBar label="" value={s.strength} tone={tone as never} height="sm" showValue={false} />
                  </div>
                );
              })}
              <button
                onClick={() => setActiveView("emerging-radar")}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
              >
                Open emerging radar <ArrowRight className="size-3" />
              </button>
            </div>
          )}
        </EvidencePanel>

        <EvidencePanel title="What should government do?" source="Policy Sandbox">
          <div className="space-y-3 pt-1">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Turn these signals into action — simulate interventions, compare alternatives, and choose
              what to fund. Simulated outcomes, not forecasts.
            </p>
            <PrioritySignal
              title="Scale advanced PLC training"
              market="High demand"
              training="Partial coverage"
              cause="Equipment + advanced trainer gap across multiple districts"
              action="Open Policy Sandbox"
              onClick={() => setActiveView("policy-sandbox")}
            />
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setActiveView("district-plans")}
                className="rounded-md border bg-card p-3 text-left hover:bg-accent/40 transition-colors"
              >
                <div className="flex items-center gap-1.5 text-primary mb-1">
                  <Target className="size-3.5" />
                  <span className="text-[11px] font-semibold">District plans</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-snug">Evidence-linked planning</p>
              </button>
              <button
                onClick={() => setActiveView("outcomes")}
                className="rounded-md border bg-card p-3 text-left hover:bg-accent/40 transition-colors"
              >
                <div className="flex items-center gap-1.5 text-primary mb-1">
                  <Briefcase className="size-3.5" />
                  <span className="text-[11px] font-semibold">Outcomes</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-snug">Plan vs actual</p>
              </button>
            </div>
          </div>
        </EvidencePanel>
      </section>

      {/* Footer integrity line */}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground border-t pt-3">
        <ShieldCheck className="size-3.5" />
        <span>
          All signals are derived from existing intelligence — labour-market evidence, training capacity,
          and demand-supply gap computation. No forecasting. No automatic recommendations.
        </span>
      </div>
    </div>
  );
}
