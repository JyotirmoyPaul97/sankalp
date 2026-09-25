"use client";

import * as React from "react";
import {
  ShieldCheck, TrendingUp, ArrowRight, MapPin,
  Briefcase, CheckCircle2, AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/kaushal/page-header";
import { StatusPill } from "@/components/kaushal/status-pill";
import { EvidencePanel } from "@/components/kaushal/evidence-panel";
import { MetricCard } from "@/components/kaushal/metric-card";
import { LoadingState, ErrorState } from "@/components/kaushal/states";
import {
  StatusBadge, ConfidenceBadge, VisualBar, PrioritySignal,
} from "@/components/kaushal/visual-components";
import { MaharashtraIntelligenceBackground } from "@/components/kaushal/maharashtra-background";
import { useFetch } from "@/hooks/use-fetch";
import { useNav } from "@/store/app-store";
import { Card } from "@/components/ui/card";

interface EmergingSkill {
  skillId: string;
  skillName: string;
  emergenceStatus: string;
  signalStrength: number;
  trendVelocity: string;
  confidence: string;
  evidenceCount: number;
  sourceDiversity: number;
}
interface SectorDemand {
  sector: { id: string; name: string; code: string; employerCount: number; courseCount: number; roleCount: number };
  demandSignal: string;
  signalStrength: number;
  trend: string;
  growthDirection: string;
  observedGrowth: number | null;
  confidence: string;
}
interface ClusterDemand {
  cluster: { id: string; name: string; district: string | null; sector: string | null; employerCount: number };
  demandSignal: string;
  signalStrength: number;
  trend: string;
  confidence: string;
  topRoles: { name: string; signal: number }[];
}
interface RoleHiring {
  role: { id: string; title: string; sector: string | null; competencyCount: number };
  demandSignal: string;
  signalStrength: number;
  trend: string;
  confidence: string;
  uniqueEmployers: number;
  uniquePostings: number;
}

const SIGNAL_TONE: Record<string, "positive" | "info" | "attention" | "critical" | "neutral"> = {
  HIGH: "attention", MEDIUM: "info", LOW: "neutral", NONE: "neutral",
};

export function EmployerValidationView() {
  const setActiveView = useNav((s) => s.setActiveView);

  const emergingFetch = useFetch<{ entries: EmergingSkill[]; disclaimer: string }>("/api/v1/market-demand/emerging-skills");
  const sectorsFetch = useFetch<{ sectors: SectorDemand[] }>("/api/v1/market-demand/sectors");
  const clustersFetch = useFetch<{ clusters: ClusterDemand[] }>("/api/v1/market-demand/clusters");
  const rolesFetch = useFetch<{ roles: RoleHiring[] }>("/api/v1/market-demand/roles");

  const emerging = emergingFetch.data?.entries ?? [];
  const topEmerging = emerging.slice(0, 6);
  const sectors = sectorsFetch.data?.sectors ?? [];
  const topSectors = sectors.slice(0, 4);
  const clusters = clustersFetch.data?.clusters ?? [];
  const topClusters = clusters.slice(0, 4);
  const roles = rolesFetch.data?.roles ?? [];
  const topRoles = roles.slice(0, 6);

  return (
    <div className="space-y-6 relative">
      {/* Subtle workspace background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-xl opacity-[0.06]">
        <MaharashtraIntelligenceBackground variant="industry" />
      </div>

      <PageHeader
        title="Industry Demand & Employer Validation"
        description="What industry needs, what employers are hiring for, and a structured way to validate demand signals against the shared Market Intelligence layer."
        badge={<StatusBadge status="OBSERVED" />}
      />

      {/* THREE MAJOR ACTIONS */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* 1. WHAT INDUSTRY NEEDS */}
        <Card className="shadow-none flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b bg-gradient-to-br from-status-attention/5 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-status-attention" />
                <h3 className="text-sm font-semibold">What Industry Needs</h3>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Signal strength</span>
            </div>
          </div>
          <div className="p-4 space-y-3 flex-1">
            <p className="text-[11px] text-muted-foreground">
              Top emerging skills observed across employer demand signals. Bars show signal strength (0–100).
            </p>
            {emergingFetch.loading ? <LoadingState /> :
             emergingFetch.error ? <ErrorState message={emergingFetch.error.message} /> :
             topEmerging.length === 0 ? <p className="text-xs text-muted-foreground">No emerging skills observed.</p> :
             (
              <div className="space-y-2.5">
                {topEmerging.map((s) => (
                  <button key={s.skillId} onClick={() => setActiveView(`skill-demand:${s.skillId}`)}
                    className="w-full text-left rounded-md border bg-card p-2.5 hover:border-primary/40 hover:bg-accent/30 transition-colors">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-medium truncate">{s.skillName}</span>
                      <StatusPill tone={s.emergenceStatus === "ACCELERATING" ? "critical" : s.emergenceStatus === "EMERGING" ? "attention" : "info"} dot>
                        {s.emergenceStatus.replace(/_/g, " ")}
                      </StatusPill>
                    </div>
                    <VisualBar label="" value={s.signalStrength} tone="attention" height="sm" showValue />
                    <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
                      <span>{s.evidenceCount} evidence · {s.sourceDiversity} sources</span>
                      <ConfidenceBadge confidence={s.confidence} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="px-4 py-2 border-t bg-muted/30 text-[10px] text-muted-foreground flex items-center justify-between">
            <span>{emerging.length} emerging skills tracked</span>
            <button onClick={() => setActiveView("emerging-radar")} className="text-primary hover:underline inline-flex items-center gap-1">
              Open Emerging Radar <ArrowRight className="size-3" />
            </button>
          </div>
        </Card>

        {/* 2. WHAT EMPLOYERS ARE HIRING FOR */}
        <Card className="shadow-none flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b bg-gradient-to-br from-status-info/5 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="size-4 text-status-info" />
                <h3 className="text-sm font-semibold">What Employers Are Hiring For</h3>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Hiring demand</span>
            </div>
          </div>
          <div className="p-4 space-y-3 flex-1">
            <p className="text-[11px] text-muted-foreground">
              Roles ranked by observed hiring demand — bars combine employer count, posting volume, and signal strength.
            </p>
            {rolesFetch.loading ? <LoadingState /> :
             rolesFetch.error ? <ErrorState message={rolesFetch.error.message} /> :
             topRoles.length === 0 ? <p className="text-xs text-muted-foreground">No hiring roles observed.</p> :
             (
              <div className="space-y-2">
                {topRoles.map((r) => (
                  <button key={r.role.id} onClick={() => setActiveView(`role-demand:${r.role.id}`)}
                    className="w-full text-left rounded-md border bg-card p-2.5 hover:border-primary/40 hover:bg-accent/30 transition-colors">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-xs font-medium truncate">{r.role.title}</p>
                      <StatusPill tone={SIGNAL_TONE[r.demandSignal] ?? "neutral"} dot>{r.demandSignal}</StatusPill>
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-1.5">
                      {r.role.sector ?? "—"} · {r.uniqueEmployers} employers · {r.uniquePostings} postings
                    </p>
                    <VisualBar label="" value={r.signalStrength} tone={r.demandSignal === "HIGH" ? "attention" : r.demandSignal === "MEDIUM" ? "info" : "neutral"} height="sm" showValue />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="px-4 py-2 border-t bg-muted/30 text-[10px] text-muted-foreground flex items-center justify-between">
            <span>{roles.length} roles tracked across sectors</span>
            <button onClick={() => setActiveView("labour-market")} className="text-primary hover:underline inline-flex items-center gap-1">
              Open Labour Market <ArrowRight className="size-3" />
            </button>
          </div>
        </Card>

        {/* 3. VALIDATE DEMAND */}
        <Card className="shadow-none flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b bg-gradient-to-br from-status-positive/5 to-transparent">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-status-positive" />
              <h3 className="text-sm font-semibold">Validate Demand</h3>
            </div>
          </div>
          <div className="p-4 space-y-3 flex-1">
            <p className="text-[11px] text-muted-foreground">
              Employer-confirmed demand strengthens Market Intelligence confidence. Validate role, skill, proficiency, location, and hiring volume.
            </p>
            <div className="rounded-md border bg-card p-3 space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Validation dimensions</p>
              <div className="space-y-1.5">
                {[
                  { label: "Role", value: "Confirm role is in demand" },
                  { label: "Skill", value: "Confirm skill is required" },
                  { label: "Proficiency", value: "Confirm expected level" },
                  { label: "Location", value: "Confirm district scope" },
                  { label: "Hiring volume", value: "Confirm posting volume" },
                ].map((d) => (
                  <div key={d.label} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{d.label}</span>
                    <span className="font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <MetricCard label="Confirmed" value={6} tone="positive" icon={<CheckCircle2 className="size-4" />} />
              <MetricCard label="Pending" value={4} tone="attention" icon={<AlertCircle className="size-4" />} />
              <MetricCard label="Modified" value={2} tone="info" icon={<ShieldCheck className="size-4" />} />
            </div>
          </div>
          <div className="px-4 py-2 border-t bg-muted/30">
            <button onClick={() => setActiveView("emerging-radar")}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-xs font-medium py-2 hover:bg-primary/90 transition-colors">
              <ShieldCheck className="size-3.5" /> Submit Employer Validation
            </button>
          </div>
        </Card>
      </div>

      {/* Insight strip — demand by sector and cluster */}
      <div className="grid lg:grid-cols-2 gap-4">
        <EvidencePanel title="Sector Demand" source="Market Intelligence" confidence="high">
          <div className="space-y-2.5">
            {sectorsFetch.loading ? <LoadingState /> :
             sectorsFetch.error ? <ErrorState message={sectorsFetch.error.message} /> :
             topSectors.map((s) => (
              <div key={s.sector.id} className="rounded-md border p-2.5 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium">{s.sector.name}</span>
                  <StatusPill tone={SIGNAL_TONE[s.demandSignal] ?? "neutral"} dot>{s.demandSignal}</StatusPill>
                </div>
                <VisualBar label="" value={s.signalStrength} tone={s.demandSignal === "HIGH" ? "attention" : "info"} height="sm" showValue />
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{s.sector.employerCount} employers · {s.sector.roleCount} roles</span>
                  <span>Trend: {s.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </EvidencePanel>

        <EvidencePanel title="Cluster Requirements" source="Economic Cluster Intelligence" confidence="medium">
          <div className="space-y-2.5">
            {clustersFetch.loading ? <LoadingState /> :
             clustersFetch.error ? <ErrorState message={clustersFetch.error.message} /> :
             topClusters.map((c) => (
              <div key={c.cluster.id} className="rounded-md border p-2.5 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{c.cluster.name}</p>
                    <p className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                      <MapPin className="size-3" /> {c.cluster.district ?? "—"} · {c.cluster.sector ?? "—"}
                    </p>
                  </div>
                  <StatusPill tone={SIGNAL_TONE[c.demandSignal] ?? "neutral"} dot>{c.demandSignal}</StatusPill>
                </div>
                {c.topRoles.length > 0 ? (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {c.topRoles.slice(0, 3).map((r, i) => (
                      <span key={i} className="text-[10px] rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{r.name}</span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </EvidencePanel>
      </div>

      {/* Validation flow visual */}
      <EvidencePanel title="How Demand Validation Closes the Loop" source="Employer Consensus" confidence="high">
        <div className="grid md:grid-cols-3 gap-3">
          <PrioritySignal
            title="PLC Programming"
            market="HIGH demand · 38 employers"
            training="Partial supply across Pune, Nashik, Aurangabad"
            cause="Job postings require EXPERT proficiency; current training delivers PROFICIENT."
            action="Employers confirm EXPERT requirement"
          />
          <PrioritySignal
            title="Industrial IoT"
            market="HIGH demand · 24 employers"
            training="No supply identified in 7 districts"
            cause="Emerging skill — curriculum has not yet been updated."
            action="Employers validate urgency + role scope"
          />
          <PrioritySignal
            title="SCADA Systems"
            market="HIGH demand · 32 employers"
            training="Limited supply — trainer capacity constrained"
            cause="Trainers proficient but capacity lower than demand."
            action="Employers confirm proficiency expectation"
          />
        </div>
        <p className="text-[11px] text-muted-foreground pt-3 border-t mt-3">
          Collective industry demand feeds the same Market Intelligence layer as employer-specific demand. Both contribute to shared evidence.
        </p>
      </EvidencePanel>
    </div>
  );
}
