"use client";

import * as React from "react";
import { Users, ShieldCheck, KeyRound, Database, Activity, Upload, History, GaugeCircle, TableProperties, ScrollText, FileSearch } from "lucide-react";
import { PageHeader, SectionLabel } from "@/components/kaushal/page-header";
import { MetricCard } from "@/components/kaushal/metric-card";
import { EvidencePanel } from "@/components/kaushal/evidence-panel";
import { StatusPill } from "@/components/kaushal/status-pill";
import { DataTable, type Column } from "@/components/kaushal/data-table";
import { useFetch } from "@/hooks/use-fetch";
import { LoadingState, ErrorState } from "@/components/kaushal/states";
import { useNav } from "@/store/app-store";
import type { PlatformMeta, DataSource, Paginated } from "@/types/domain";

const ROLE_ROWS = [
  { id: "STATE_ADMIN", label: "State Administrator", scope: "State-wide visibility across districts and sectors." },
  { id: "DISTRICT_PLANNER", label: "District Planner", scope: "District-scoped planning, gaps and plans." },
  { id: "TRAINING_PROVIDER", label: "Training Provider", scope: "Course, capacity and trainer management." },
  { id: "EMPLOYER", label: "Employer", scope: "Demand validation and role-skill feedback." },
  { id: "INSTITUTION", label: "Institution", scope: "Institution-level course delivery." },
  { id: "TRAINER", label: "Trainer", scope: "Course delivery and assessment." },
  { id: "CANDIDATE", label: "Candidate", scope: "Career pathways and readiness." },
  { id: "AUDITOR", label: "Auditor", scope: "Read-only audit and evidence review." },
];

export function AdminView() {
  const { data: meta, loading } = useFetch<PlatformMeta>("/api/v1/meta");
  const { data: health } = useFetch<{ status: string; database: string; redis: string; environment: string }>(
    "/api/v1/health",
  );
  const { data: sources } = useFetch<Paginated<DataSource>>("/api/v1/data-sources?pageSize=50");

  const roleCols: Column<(typeof ROLE_ROWS)[number]>[] = [
    {
      key: "role",
      header: "Role",
      cell: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <ShieldCheck className="size-4" />
          </div>
          <div>
            <p className="text-sm font-medium">{r.label}</p>
            <p className="text-[11px] text-muted-foreground font-mono">{r.id}</p>
          </div>
        </div>
      ),
    },
    { key: "scope", header: "Scope", cell: (r) => <span className="text-xs text-muted-foreground">{r.scope}</span> },
    {
      key: "status",
      header: "Status",
      cell: () => <StatusPill tone="info" dot>Foundation</StatusPill>,
      width: "120px",
    },
  ];

  const counts = meta?.counts ?? {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administration"
        description="Platform foundation status: roles, RBAC, health, environment, data provenance, and Phase 2 ingestion operations."
        badge={<StatusPill tone="info" dot>Phase 2 — Ingestion Layer</StatusPill>}
      />

      {loading ? (
        <LoadingState label="Loading platform meta…" />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Registered Districts" value={counts.districts ?? 0} icon={<Database className="size-4" />} tone="default" />
          <MetricCard label="Registered Courses" value={counts.courses ?? 0} icon={<Database className="size-4" />} tone="default" />
          <MetricCard label="RBAC Roles" value={ROLE_ROWS.length} icon={<Users className="size-4" />} tone="info" />
          <MetricCard label="Data Sources" value={counts.dataSources ?? 0} icon={<Activity className="size-4" />} tone="default" />
        </div>
      )}

      {/* Data Operations quick links (Phase 2) */}
      <section className="space-y-3">
        <SectionLabel>Data Operations</SectionLabel>
        <DataOperationsGrid />
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        <EvidencePanel title="System Health" source="/api/v1/health">
          <dl className="space-y-2.5 text-sm">
            {[
              { k: "Status", v: health?.status ?? "—" },
              { k: "Environment", v: health?.environment ?? process.env.APP_ENV ?? "development" },
              { k: "Database", v: health?.database ?? "—" },
              { k: "Redis", v: health?.redis ?? "not-configured" },
              { k: "Phase", v: health ? "phase-1" : "—" },
            ].map((row) => (
              <div key={row.k} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                <dt className="text-xs text-muted-foreground">{row.k}</dt>
                <dd className="text-xs font-mono inline-flex items-center gap-2">
                  {row.v === "connected" || row.v === "healthy" ? (
                    <span className="size-1.5 rounded-full bg-status-positive" />
                  ) : row.v === "not-configured" ? (
                    <span className="size-1.5 rounded-full bg-status-attention" />
                  ) : null}
                  {row.v}
                </dd>
              </div>
            ))}
          </dl>
        </EvidencePanel>

        <EvidencePanel title="Authentication" source="Phase 1 — JWT foundation">
          <ul className="space-y-1.5 text-xs text-muted-foreground leading-relaxed list-disc pl-4">
            <li>JWT-based foundation (HMAC-SHA256). Replace with Keycloak / OAuth2 in a later phase without touching route contracts.</li>
            <li>Demo users live in the <span className="font-mono">users</span> table; clearly labelled, not actual government identities.</li>
            <li>Tokens carry <span className="font-mono">sub, email, name, role, iat, exp</span>.</li>
            <li>Protected routes read <span className="font-mono">Authorization: Bearer &lt;token&gt;</span>.</li>
          </ul>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
            <KeyRound className="size-3.5" />
            Extension point: <span className="font-mono">src/lib/auth.ts</span>
          </div>
        </EvidencePanel>
      </div>

      <section className="space-y-3">
        <SectionLabel>RBAC Roles</SectionLabel>
        <DataTable columns={roleCols} rows={ROLE_ROWS} rowKey={(r) => r.id} />
      </section>

      {sources && sources.items.length > 0 ? (
        <section className="space-y-3">
          <SectionLabel>Registered Data Sources</SectionLabel>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sources.items.map((s) => (
              <div key={s.id} className="rounded-md border bg-card p-3 space-y-1.5 shadow-none">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  <StatusPill tone={s.dataStatus === "DEMO" ? "attention" : "info"} dot>
                    {s.dataStatus}
                  </StatusPill>
                </div>
                <p className="text-[11px] text-muted-foreground">{s.sourceType.replace(/_/g, " ")}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function DataOperationsGrid() {
  const setActiveView = useNav((s) => s.setActiveView);
  const ops = [
    { id: "data-sources", label: "Data Sources", desc: "Register and manage evidence feeds.", icon: <Database className="size-4" /> },
    { id: "upload", label: "Upload Dataset", desc: "Ingest CSV / JSON through the validation pipeline.", icon: <Upload className="size-4" /> },
    { id: "import-batches", label: "Import Batches", desc: "History of every ingestion operation.", icon: <History className="size-4" /> },
    { id: "data-quality", label: "Data Quality", desc: "Per-batch quality dashboard + error breakdown.", icon: <GaugeCircle className="size-4" /> },
    { id: "records-explorer", label: "Records Explorer", desc: "Search every ingested evidence table.", icon: <TableProperties className="size-4" /> },
    { id: "provenance", label: "Provenance", desc: "Source → Batch → Record traceability.", icon: <FileSearch className="size-4" /> },
    { id: "audit-logs", label: "Audit Logs", desc: "Ingestion + admin action trail.", icon: <ScrollText className="size-4" /> },
  ];
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {ops.map((o) => (
        <button key={o.id} onClick={() => setActiveView(o.id)} className="text-left rounded-lg border bg-card p-4 space-y-1.5 shadow-none hover:border-primary/40 hover:bg-accent/30 transition-colors">
          <div className="flex items-center gap-2 text-primary">{o.icon}<span className="text-sm font-medium text-foreground">{o.label}</span></div>
          <p className="text-xs text-muted-foreground leading-snug">{o.desc}</p>
        </button>
      ))}
    </div>
  );
}
