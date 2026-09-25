"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, XCircle, Clock, ShieldCheck, FileText, Award, Briefcase, TrendingUp } from "lucide-react";

// ---------------------------------------------------------------------
// 1. VisualBar — animated horizontal bar for demand/supply/gap comparison
// ---------------------------------------------------------------------

interface VisualBarProps {
  label: string;
  value: number;
  max?: number;
  tone?: "positive" | "info" | "attention" | "critical" | "neutral";
  showValue?: boolean;
  height?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

const BAR_TONE: Record<string, string> = {
  positive: "bg-status-positive",
  info: "bg-status-info",
  attention: "bg-status-attention",
  critical: "bg-status-critical",
  neutral: "bg-muted-foreground",
};

const BAR_HEIGHT: Record<string, string> = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export function VisualBar({ label, value, max = 100, tone = "info", showValue = true, height = "md", icon }: VisualBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const [animatedPct, setAnimatedPct] = React.useState(0);

  React.useEffect(() => {
    const timer = setTimeout(() => setAnimatedPct(pct), 100);
    return () => clearTimeout(timer);
  }, [pct]);

  return (
    <div className="space-y-1">
      {label ? (
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            {icon}
            {label}
          </span>
          {showValue ? <span className="tabular-nums font-medium">{Math.round(value)}</span> : null}
        </div>
      ) : null}
      <div className={cn("w-full rounded-full bg-muted overflow-hidden", BAR_HEIGHT[height])}>
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", BAR_TONE[tone])}
          style={{ width: `${animatedPct}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// 2. DemandSupplyComparison — side-by-side visual
// ---------------------------------------------------------------------

interface DemandSupplyComparisonProps {
  skill: string;
  demandValue: number;
  supplyValue: number;
  demandLabel?: string;
  supplyLabel?: string;
  max?: number;
}

export function DemandSupplyComparison({ skill, demandValue, supplyValue, demandLabel = "Market Demand", supplyLabel = "Training Coverage", max = 100 }: DemandSupplyComparisonProps) {
  const gap = demandValue - supplyValue;
  const gapTone = gap > 30 ? "critical" : gap > 10 ? "attention" : "positive";

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{skill}</h4>
        <span className={cn("text-xs font-medium", gap > 30 ? "text-status-critical" : gap > 10 ? "text-status-attention" : "text-status-positive")}>
          {gap > 0 ? `+${Math.round(gap)}` : Math.round(gap)} gap
        </span>
      </div>
      <VisualBar label={demandLabel} value={demandValue} max={max} tone="attention" height="lg" icon={<TrendingUp className="size-3" />} />
      <VisualBar label={supplyLabel} value={supplyValue} max={max} tone="info" height="lg" icon={<ShieldCheck className="size-3" />} />
      <div className="flex items-center gap-2 pt-1">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Signal:</span>
        <span className={cn("text-xs font-medium", `text-status-${gapTone}`)}>
          {gap > 30 ? "HIGH GAP" : gap > 10 ? "MODERATE GAP" : gap > 0 ? "LOW GAP" : "SUPPLY PRESENT"}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// 3. EvidenceChain — visual evidence flow
// ---------------------------------------------------------------------

interface EvidenceChainItem {
  icon: React.ReactNode;
  label: string;
  detail: string;
  verified: boolean;
}

interface EvidenceChainProps {
  items: EvidenceChainItem[];
  demonstratedLevel?: string;
  confidence?: string;
}

export function EvidenceChain({ items, demonstratedLevel, confidence }: EvidenceChainProps) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="size-4 text-primary" />
        <h4 className="text-sm font-semibold">Evidence, Not Claims</h4>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {items.map((item, i) => (
          <div key={i} className={cn("rounded-md border p-2 space-y-1 text-center", item.verified ? "border-status-positive/30 bg-status-positive/5" : "border-muted bg-muted/30")}>
            <div className={cn("flex justify-center", item.verified ? "text-status-positive" : "text-muted-foreground")}>
              {item.verified ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
            </div>
            <p className="text-[10px] font-medium">{item.label}</p>
            <p className="text-[9px] text-muted-foreground">{item.detail}</p>
          </div>
        ))}
      </div>
      {demonstratedLevel ? (
        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Demonstrated</p>
            <p className="text-sm font-bold">{demonstratedLevel}</p>
          </div>
          {confidence ? (
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Confidence</p>
              <p className={cn("text-sm font-bold", confidence === "HIGH" ? "text-status-positive" : confidence === "MEDIUM" ? "text-status-info" : "text-status-attention")}>{confidence}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------
// 4. ProficiencyLadder — visual proficiency comparison
// ---------------------------------------------------------------------

const PROFICIENCY_LEVELS = ["AWARENESS", "WORKING", "PROFICIENT", "EXPERT"];
const PROFICIENCY_LABELS: Record<string, string> = {
  AWARENESS: "Awareness", WORKING: "Working", PROFICIENT: "Proficient", EXPERT: "Expert",
  BEGINNER: "Beginner", BASIC: "Basic", INTERMEDIATE: "Intermediate", ADVANCED: "Advanced",
};

interface ProficiencyLadderProps {
  required?: string;
  current?: string;
  showLabels?: boolean;
}

export function ProficiencyLadder({ required, current, showLabels = true }: ProficiencyLadderProps) {
  const requiredIdx = required ? PROFICIENCY_LEVELS.indexOf(required) : -1;
  const currentIdx = current ? PROFICIENCY_LEVELS.indexOf(current) : -1;

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-1">
        {PROFICIENCY_LEVELS.map((level, i) => {
          const isRequired = i === requiredIdx;
          const isCurrent = i === currentIdx;
          const isBelow = currentIdx >= 0 && i <= currentIdx;
          const isGap = requiredIdx >= 0 && currentIdx >= 0 && i > currentIdx && i <= requiredIdx;

          return (
            <div key={level} className="flex-1 flex flex-col items-center gap-1">
              {showLabels ? (
                <span className={cn("text-[9px] font-medium", isRequired ? "text-status-critical" : isCurrent ? "text-status-info" : "text-muted-foreground")}>
                  {PROFICIENCY_LABELS[level] ?? level}
                </span>
              ) : null}
              <div
                className={cn(
                  "w-full rounded-t transition-all duration-500",
                  isBelow ? "bg-status-info" : isGap ? "bg-status-attention/50" : "bg-muted",
                  isRequired ? "ring-2 ring-status-critical ring-offset-1" : "",
                )}
                style={{ height: `${20 + i * 12}px` }}
              />
              {isRequired ? <div className="text-[8px] text-status-critical font-bold">REQUIRED</div> : null}
              {isCurrent && !isRequired ? <div className="text-[8px] text-status-info font-bold">YOU</div> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// 5. FlowNode — visual intelligence flow node
// ---------------------------------------------------------------------

interface FlowNodeProps {
  icon: React.ReactNode;
  label: string;
  detail?: string;
  active?: boolean;
  onClick?: () => void;
}

export function FlowNode({ icon, label, detail, active, onClick }: FlowNodeProps) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-all min-w-[120px]",
        active ? "border-primary bg-primary/5 shadow-md" : "bg-card hover:border-primary/30 hover:shadow-sm",
        onClick ? "cursor-pointer" : "cursor-default",
      )}
    >
      <div className={cn("rounded-full p-2", active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
        {icon}
      </div>
      <span className="text-[11px] font-medium leading-tight">{label}</span>
      {detail ? <span className="text-[9px] text-muted-foreground leading-tight">{detail}</span> : null}
    </button>
  );
}

// ---------------------------------------------------------------------
// 6. AnimatedCounter — count-up animation for metrics
// ---------------------------------------------------------------------

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({ value, duration = 1000, className }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    let startTime: number | null = null;
    let frameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * eased));
      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return <span className={cn("tabular-nums", className)}>{displayValue.toLocaleString()}</span>;
}

// ---------------------------------------------------------------------
// 7. StatusBadge — compact data status badge
// ---------------------------------------------------------------------

const STATUS_CONFIG: Record<string, { tone: string; icon: React.ReactNode; label: string }> = {
  OBSERVED: { tone: "surface-positive", icon: <CheckCircle2 className="size-2.5" />, label: "OBSERVED" },
  SYNTHETIC: { tone: "surface-attention", icon: <AlertTriangle className="size-2.5" />, label: "SYNTHETIC" },
  SIMULATED: { tone: "surface-info", icon: <Info className="size-2.5" />, label: "SIMULATED" },
  MODELLED: { tone: "surface-info", icon: <TrendingUp className="size-2.5" />, label: "MODELLED" },
  "USER-DEFINED": { tone: "surface-neutral", icon: <Info className="size-2.5" />, label: "USER-DEFINED" },
  DEMO: { tone: "surface-attention", icon: <AlertTriangle className="size-2.5" />, label: "DEMO" },
  UNKNOWN: { tone: "surface-neutral", icon: <Info className="size-2.5" />, label: "UNKNOWN" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.UNKNOWN;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium", config.tone, className)}>
      {config.icon}
      {config.label}
    </span>
  );
}

// ---------------------------------------------------------------------
// 8. ConfidenceBadge — compact confidence indicator
// ---------------------------------------------------------------------

const CONFIDENCE_CONFIG: Record<string, { tone: string; dots: number }> = {
  HIGH: { tone: "surface-positive", dots: 3 },
  MEDIUM: { tone: "surface-info", dots: 2 },
  LOW: { tone: "surface-attention", dots: 1 },
  INSUFFICIENT: { tone: "surface-neutral", dots: 0 },
};

export function ConfidenceBadge({ confidence, className }: { confidence: string; className?: string }) {
  const config = CONFIDENCE_CONFIG[confidence] ?? CONFIDENCE_CONFIG.INSUFFICIENT;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-medium", config.tone, className)} title={`Confidence based on source reliability, freshness, sample size, source diversity and consistency.`}>
      <span className="flex gap-0.5">
        {[1, 2, 3].map((n) => (
          <span key={n} className={cn("size-1.5 rounded-full", n <= config.dots ? "bg-current" : "bg-current/20")} />
        ))}
      </span>
      {confidence}
    </span>
  );
}

// ---------------------------------------------------------------------
// 9. EvidenceTrace — vertical evidence flow
// ---------------------------------------------------------------------

interface EvidenceTraceItem {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

export function EvidenceTrace({ items, finalSignal, confidence }: { items: EvidenceTraceItem[]; finalSignal: string; confidence: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="size-4 text-primary" />
        <h4 className="text-sm font-semibold">Evidence Trace</h4>
      </div>
      <div className="space-y-0">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-[10px]">
                {item.icon ?? i + 1}
              </div>
              {i < items.length - 1 ? <div className="w-px h-6 bg-border" /> : null}
            </div>
            <div className="pb-2">
              <p className="text-[10px] text-muted-foreground">{item.label}</p>
              <p className="text-xs font-medium">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-2 border-t">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Demand Signal</p>
          <p className="text-sm font-bold">{finalSignal}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Confidence</p>
          <ConfidenceBadge confidence={confidence} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// 10. GapMatrix — visual demand-training matrix
// ---------------------------------------------------------------------

interface GapMatrixRow {
  skill: string;
  demand: string;
  supply: string;
  gap: string;
  confidence: string;
}

const GAP_CELL_TONE: Record<string, string> = {
  HIGH: "bg-status-critical/20 text-status-critical",
  MEDIUM: "bg-status-attention/20 text-status-attention",
  LOW: "bg-status-positive/20 text-status-positive",
  "NO_IDENTIFIED_SUPPLY": "bg-status-critical/30 text-status-critical",
  "PROFICIENCY_MISMATCH": "bg-status-attention/20 text-status-attention",
  "GEOGRAPHIC_GAP": "bg-status-attention/20 text-status-attention",
  "SUPPLY_PRESENT": "bg-status-positive/20 text-status-positive",
  "LOW_GAP": "bg-status-positive/20 text-status-positive",
  "MODERATE_GAP": "bg-status-attention/20 text-status-attention",
  "HIGH_GAP": "bg-status-critical/20 text-status-critical",
  "INSUFFICIENT_DATA": "bg-muted text-muted-foreground",
  "UNKNOWN": "bg-muted text-muted-foreground",
};

export function GapMatrix({ rows }: { rows: GapMatrixRow[] }) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="overflow-x-auto scroll-thin">
        <table className="w-full text-xs">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2 font-semibold uppercase tracking-wider text-[10px] text-muted-foreground">Skill</th>
              <th className="text-center p-2 font-semibold uppercase tracking-wider text-[10px] text-muted-foreground">Demand</th>
              <th className="text-center p-2 font-semibold uppercase tracking-wider text-[10px] text-muted-foreground">Supply</th>
              <th className="text-center p-2 font-semibold uppercase tracking-wider text-[10px] text-muted-foreground">Gap</th>
              <th className="text-center p-2 font-semibold uppercase tracking-wider text-[10px] text-muted-foreground">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t hover:bg-accent/30 transition-colors">
                <td className="p-2 font-medium">{row.skill}</td>
                <td className="p-2 text-center"><span className={cn("inline-block rounded px-1.5 py-0.5 text-[10px] font-medium", GAP_CELL_TONE[row.demand] ?? GAP_CELL_TONE.UNKNOWN)}>{row.demand}</span></td>
                <td className="p-2 text-center"><span className={cn("inline-block rounded px-1.5 py-0.5 text-[10px] font-medium", GAP_CELL_TONE[row.supply] ?? GAP_CELL_TONE.UNKNOWN)}>{row.supply}</span></td>
                <td className="p-2 text-center"><span className={cn("inline-block rounded px-1.5 py-0.5 text-[10px] font-medium", GAP_CELL_TONE[row.gap] ?? GAP_CELL_TONE.UNKNOWN)}>{row.gap.replace(/_/g, " ")}</span></td>
                <td className="p-2 text-center"><ConfidenceBadge confidence={row.confidence} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// 11. ScenarioComparison — before/after visual
// ---------------------------------------------------------------------

interface ScenarioMetric {
  label: string;
  baseline: string;
  simulated: string;
  unit?: string;
}

export function ScenarioComparison({ metrics }: { metrics: ScenarioMetric[] }) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Baseline → Simulated</h4>
        <StatusBadge status="SIMULATED" />
      </div>
      <div className="space-y-2">
        {metrics.map((m, i) => (
          <div key={i} className="grid grid-cols-3 items-center gap-2 text-xs">
            <span className="text-muted-foreground">{m.label}</span>
            <div className="flex items-center gap-2">
              <span className="font-medium tabular-nums">{m.baseline}</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-bold tabular-nums text-primary">{m.simulated}</span>
              {m.unit ? <span className="text-[10px] text-muted-foreground">{m.unit}</span> : null}
            </div>
            <div className="flex items-center gap-1">
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-status-info/30" style={{ width: "100%" }} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground italic">SIMULATED RESULT — NOT A FORECAST. Based on explicit user assumptions.</p>
    </div>
  );
}

// ---------------------------------------------------------------------
// 12. SkillJourneyFlow — visual role-to-outcome journey
// ---------------------------------------------------------------------

interface SkillJourneyStep {
  icon: React.ReactNode;
  label: string;
  detail: string;
  tone?: "positive" | "info" | "attention" | "critical" | "neutral";
}

export function SkillJourneyFlow({ steps }: { steps: SkillJourneyStep[] }) {
  return (
    <div className="flex flex-col md:flex-row items-stretch gap-1 overflow-x-auto scroll-thin pb-2">
      {steps.map((step, i, arr) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center gap-1.5 rounded-lg border bg-card p-3 text-center min-w-[130px] shadow-sm">
            <div className={cn(
              "rounded-full p-2",
              step.tone === "positive" ? "bg-status-positive/10 text-status-positive" :
              step.tone === "attention" ? "bg-status-attention/10 text-status-attention" :
              step.tone === "critical" ? "bg-status-critical/10 text-status-critical" :
              "bg-muted text-muted-foreground"
            )}>
              {step.icon}
            </div>
            <span className="text-[11px] font-medium leading-tight">{step.label}</span>
            <span className="text-[9px] text-muted-foreground leading-tight">{step.detail}</span>
          </div>
          {i < arr.length - 1 ? (
            <div className="flex items-center justify-center self-center shrink-0">
              <div className={cn("w-px h-8 md:h-px md:w-8", "bg-border")} />
            </div>
          ) : null}
        </React.Fragment>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------
// 13. DistrictTwinVisual — layered district visualization
// ---------------------------------------------------------------------

export function DistrictTwinVisual({ district, layers }: { district: string; layers: { label: string; icon: React.ReactNode; items: { label: string; value: string | number; tone?: string }[] }[] }) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-bold">{district}</h3>
        <p className="text-[10px] text-muted-foreground">District Skill Digital Twin</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        {layers.map((layer, i) => (
          <div key={i} className="rounded-md border p-3 space-y-2">
            <div className="flex items-center gap-2 text-primary">
              {layer.icon}
              <span className="text-xs font-semibold">{layer.label}</span>
            </div>
            <div className="space-y-1">
              {layer.items.map((item, j) => (
                <div key={j} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className={cn("font-medium", item.tone === "positive" ? "text-status-positive" : item.tone === "critical" ? "text-status-critical" : item.tone === "attention" ? "text-status-attention" : "")}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 pt-2 border-t">
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <StatusBadge status="SYNTHETIC" />
          <span>Period: 2026-09</span>
        </div>
      </div>
    </div>
  );
}
