"use client";

import * as React from "react";
import { Database, Filter, Plus, Pencil } from "lucide-react";
import { PageHeader } from "@/components/kaushal/page-header";
import { DataTable, type Column } from "@/components/kaushal/data-table";
import { StatusPill, dataStatusTone } from "@/components/kaushal/status-pill";
import { EvidencePanel } from "@/components/kaushal/evidence-panel";
import { useFetch } from "@/hooks/use-fetch";
import { ErrorState } from "@/components/kaushal/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { api, ApiError, getToken } from "@/lib/api-client";
import type { DataSourceV2, Paginated } from "@/types/domain";

const SOURCE_TYPES = [
  "JOB_POSTINGS", "EMPLOYER_SURVEY", "INDUSTRY_CONSULTATION", "SECTOR_GROWTH",
  "PLACEMENT_OUTCOME", "TECHNOLOGY_TREND", "TRAINING_DATA", "COURSE_DATA",
  "INSTITUTION_DATA", "TRAINER_DATA", "EQUIPMENT_DATA", "OTHER",
];
const DATA_STATUSES = ["REAL", "SYNTHETIC", "MODELLED", "DEMO", "UNKNOWN"];
const GEOGRAPHY = ["STATE", "DIVISION", "DISTRICT", "TALUKA", "INSTITUTION", "EMPLOYER", "NATIONAL", "OTHER"];
const FREQUENCY = ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL", "ADHOC"];

export function DataSourcesView() {
  const toast = useToast().toast;
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("ALL");
  const [sourceType, setSourceType] = React.useState("ALL");
  const [active, setActive] = React.useState("ALL");
  const [editing, setEditing] = React.useState<DataSourceV2 | null>(null);
  const [creating, setCreating] = React.useState(false);

  const path = `/api/v1/data-sources?page=${page}&pageSize=20${search ? `&search=${encodeURIComponent(search)}` : ""}${status !== "ALL" ? `&status=${status}` : ""}${sourceType !== "ALL" ? `&sourceType=${sourceType}` : ""}${active !== "ALL" ? `&active=${active}` : ""}`;
  const { data, loading, error, refetch } = useFetch<Paginated<DataSourceV2>>(path, [page, search, status, sourceType, active]);

  const columns: Column<DataSourceV2>[] = [
    { key: "name", header: "Source", cell: (s) => (
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground"><Database className="size-4" /></div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{s.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">{s.providerName ?? "—"}</p>
        </div>
      </div>
    )},
    { key: "type", header: "Type", cell: (s) => <span className="text-xs font-mono">{s.sourceType.replace(/_/g, " ")}</span>, width: "160px" },
    { key: "geo", header: "Geography", cell: (s) => <span className="text-xs">{s.geographyLevel ?? "—"}</span>, width: "120px" },
    { key: "freq", header: "Frequency", cell: (s) => <span className="text-xs">{s.updateFrequency ?? "—"}</span>, width: "120px" },
    { key: "status", header: "Data Status", cell: (s) => <StatusPill tone={dataStatusTone(s.dataStatus)} dot>{s.dataStatus}</StatusPill>, width: "120px" },
    { key: "active", header: "Active", cell: (s) => <StatusPill tone={s.isActive ? "positive" : "neutral"} dot>{s.isActive ? "Active" : "Inactive"}</StatusPill>, width: "100px" },
    { key: "batches", header: "Batches", cell: (s) => <span className="tabular-nums text-sm">{s._count?.batches ?? 0}</span>, width: "90px" },
    { key: "updated", header: "Last Updated", cell: (s) => <span className="text-[11px] text-muted-foreground tabular-nums">{s.lastUpdatedAt ? new Date(s.lastUpdatedAt).toLocaleDateString() : "—"}</span>, width: "130px" },
    { key: "actions", header: "", cell: (s) => (
      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditing(s); }}><Pencil className="size-3.5" /></Button>
    ), width: "60px" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Sources"
        description="Registered evidence feeds with provenance, provider, geography, frequency, and data-status classification."
        badge={<StatusPill tone="info" dot>Phase 2 — Provenance</StatusPill>}
        actions={
          <Button onClick={() => setCreating(true)}><Plus className="size-4" /> New Source</Button>
        }
      />

      <EvidencePanel title="Provenance Principles" source="Governance">
        <ul className="space-y-1.5 text-xs text-muted-foreground leading-relaxed list-disc pl-4">
          <li>No labour-market figures are hard-coded in application logic — all values come from registered sources.</li>
          <li>Every source declares a <span className="font-mono">data_status</span>: REAL, SYNTHETIC, MODELLED, DEMO, UNKNOWN.</li>
          <li>Phase 2 sources are SYNTHETIC / MODELLED / DEMO. The provenance structure supports future real feeds without architecture changes.</li>
          <li>Providers (SyntheticDataProvider, CSVDataProvider, JSONDataProvider, ManualEntryProvider) plug into the same ingestion pipeline.</li>
        </ul>
      </EvidencePanel>

      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 flex-wrap">
        <Input placeholder="Search sources…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="max-w-xs" />
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="size-4 text-muted-foreground" />
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {DATA_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sourceType} onValueChange={(v) => { setSourceType(v); setPage(1); }}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All types</SelectItem>
              {SOURCE_TYPES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={active} onValueChange={(v) => { setActive(v); setPage(1); }}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Active" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error ? <ErrorState message={error.message} onRetry={refetch} /> : (
        <>
          <DataTable
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(s) => s.id}
            loading={loading && !data}
            onRowClick={(s) => setEditing(s)}
            emptyMessage="No data sources registered."
          />
          {data ? (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Showing {(data.page - 1) * data.pageSize + 1}–{Math.min(data.page * data.pageSize, data.total)} of {data.total}</span>
              <div className="flex items-center gap-2">
                <button disabled={data.page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded border px-2 py-1 disabled:opacity-40 hover:bg-accent">Previous</button>
                <span className="tabular-nums">Page {data.page} / {data.totalPages}</span>
                <button disabled={data.page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded border px-2 py-1 disabled:opacity-40 hover:bg-accent">Next</button>
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* Create/Edit dialog */}
      {(creating || editing) ? (
        <SourceDialog
          source={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { setCreating(false); setEditing(null); refetch(); toast({ title: "Source saved" }); }}
        />
      ) : null}
    </div>
  );
}

function SourceDialog({ source, onClose, onSaved }: { source: DataSourceV2 | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast().toast;
  const [form, setForm] = React.useState({
    name: source?.name ?? "",
    sourceType: source?.sourceType ?? "JOB_POSTINGS",
    description: source?.description ?? "",
    providerName: source?.providerName ?? "ManualEntryProvider",
    sourceUrl: source?.sourceUrl ?? "",
    sourceReference: source?.sourceReference ?? "",
    dataStatus: source?.dataStatus ?? "DEMO",
    geographyLevel: source?.geographyLevel ?? "DISTRICT",
    updateFrequency: source?.updateFrequency ?? "MONTHLY",
    lastUpdatedAt: source?.lastUpdatedAt ? source.lastUpdatedAt.slice(0, 10) : "",
    isActive: source?.isActive ?? true,
  });
  const [saving, setSaving] = React.useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const token = getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const url = source ? `/api/v1/data-sources/${source.id}` : "/api/v1/data-sources";
      const method = source ? "PUT" : "POST";
      const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
      const json = await res.json();
      if (!json.success) throw new ApiError(json.error.code, json.error.message, res.status);
      onSaved();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed";
      toast({ title: "Save failed", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle>{source ? "Edit Data Source" : "New Data Source"}</DialogTitle>
          <DialogDescription>
            {source ? `Editing ${source.name}` : "Register a new evidence feed."} Admin-only.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Source Type *</Label>
            <Select value={form.sourceType} onValueChange={(v) => setForm({ ...form, sourceType: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SOURCE_TYPES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Provider</Label>
            <Input value={form.providerName} onChange={(e) => setForm({ ...form, providerName: e.target.value })} placeholder="e.g. CSVDataProvider" />
          </div>
          <div className="space-y-1.5">
            <Label>Data Status *</Label>
            <Select value={form.dataStatus} onValueChange={(v) => setForm({ ...form, dataStatus: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DATA_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Geography Level</Label>
            <Select value={form.geographyLevel} onValueChange={(v) => setForm({ ...form, geographyLevel: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{GEOGRAPHY.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Update Frequency</Label>
            <Select value={form.updateFrequency} onValueChange={(v) => setForm({ ...form, updateFrequency: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{FREQUENCY.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Last Updated At</Label>
            <Input type="date" value={form.lastUpdatedAt} onChange={(e) => setForm({ ...form, lastUpdatedAt: e.target.value })} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Source URL</Label>
            <Input value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} placeholder="https://…" />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Source Reference</Label>
            <Input value={form.sourceReference} onChange={(e) => setForm({ ...form, sourceReference: e.target.value })} placeholder="External reference code" />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <input id="active" type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="size-4" />
            <Label htmlFor="active">Active</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving || !form.name}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
