"use client";

import * as React from "react";
import { useState } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Loader2, ArrowRight, ArrowLeft, Database } from "lucide-react";
import { PageHeader } from "@/components/kaushal/page-header";
import { StatusPill } from "@/components/kaushal/status-pill";
import { MetricCard } from "@/components/kaushal/metric-card";
import { DataTable, type Column } from "@/components/kaushal/data-table";
import { ErrorState } from "@/components/kaushal/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api, ApiError } from "@/lib/api-client";
import { useNav } from "@/store/app-store";
import type { DataSourceV2, UploadPreview, ConfirmResult, Paginated } from "@/types/domain";

const STEPS = ["Select Source", "Upload File", "Preview", "Confirm", "Result"] as const;

export function UploadView() {
  const toast = useToast().toast;
  const setActiveView = useNav((s) => s.setActiveView);
  const openDistrict = useNav((s) => s.openDistrict);
  void openDistrict;
  const [step, setStep] = useState(0);
  const [sources, setSources] = useState<DataSourceV2[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(true);
  const [sourceId, setSourceId] = useState("");
  const [importMode, setImportMode] = useState("UPSERT");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<UploadPreview | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<ConfirmResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load sources on mount
  React.useEffect(() => {
    api.get<Paginated<DataSourceV2>>("/api/v1/data-sources?pageSize=100&active=true")
      .then((d) => setSources(d.items))
      .catch(() => setSources([]))
      .finally(() => setSourcesLoading(false));
  }, []);

  const onSelectSource = () => {
    if (!sourceId) { setError("Please select a data source"); return; }
    setError(null); setStep(1);
  };
  const onUpload = async () => {
    if (!file) { setError("Please choose a CSV or JSON file"); return; }
    if (!sourceId) { setError("Select a data source first"); return; }
    setUploading(true); setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("dataSourceId", sourceId);
      form.append("importMode", importMode);
      const token = typeof window !== "undefined" ? localStorage.getItem("kd_token") : null;
      const res = await fetch("/api/v1/ingestion/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const json = await res.json();
      if (!json.success) throw new ApiError(json.error.code, json.error.message, res.status, json.error.details);
      setPreview(json.data as UploadPreview);
      setStep(2);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      setError(msg);
      toast({ title: "Upload failed", description: msg, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };
  const onConfirm = async () => {
    if (!preview) return;
    setConfirming(true); setError(null);
    try {
      const r = await api.post<ConfirmResult>("/api/v1/ingestion/confirm", { batchCode: preview.batchCode });
      setResult(r);
      setStep(4);
      toast({ title: "Import confirmed", description: `${r.accepted} records stored` });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Confirm failed";
      setError(msg);
      toast({ title: "Confirm failed", description: msg, variant: "destructive" });
    } finally {
      setConfirming(false);
    }
  };

  const errorCols: Column<UploadPreview["sampleErrors"][number]>[] = [
    { key: "row", header: "Row", cell: (r) => <span className="tabular-nums text-xs font-mono">{r.rowNumber}</span>, width: "70px" },
    { key: "status", header: "Status", cell: (r) => <StatusPill tone={r.accepted ? "positive" : r.qualityStatus === "DUPLICATE" ? "attention" : "critical"} dot>{r.qualityStatus}</StatusPill>, width: "150px" },
    { key: "issues", header: "Issues", cell: (r) => (
      <ul className="space-y-0.5">
        {r.issues.map((iss, i) => (
          <li key={i} className="text-xs">
            <span className={iss.severity === "ERROR" ? "text-status-critical" : iss.severity === "WARNING" ? "text-status-attention" : "text-muted-foreground"}>
              {iss.severity}
            </span>
            <span className="text-muted-foreground"> · {iss.field}: </span>
            <span>{iss.problem}</span>
          </li>
        ))}
      </ul>
    )},
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Upload Dataset"
        description="Ingest CSV or JSON evidence into a registered data source. Admin-only — protected by JWT."
        badge={<StatusPill tone="info" dot>Live Intelligence</StatusPill>}
      />

      {/* Stepper */}
      <div className="flex items-center gap-1 overflow-x-auto scroll-thin pb-2">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs whitespace-nowrap ${i === step ? "bg-primary text-primary-foreground border-primary" : i < step ? "bg-status-positive/10 text-status-positive border-status-positive/30" : "text-muted-foreground"}`}>
              <span className="font-mono">{String(i + 1).padStart(2, "0")}</span>
              {s}
              {i < step ? <CheckCircle2 className="size-3" /> : null}
            </div>
            {i < STEPS.length - 1 ? <ArrowRight className="size-3 text-muted-foreground shrink-0" /> : null}
          </React.Fragment>
        ))}
      </div>

      {error ? (
        <div className="rounded-md border border-status-critical/30 bg-status-critical/5 px-3 py-2 text-xs text-status-critical">
          {error}
        </div>
      ) : null}

      {/* Step 1: Select Source */}
      {step === 0 ? (
        <div className="space-y-4 max-w-2xl">
          <div className="space-y-2">
            <Label htmlFor="source">Data Source</Label>
            {sourcesLoading ? (
              <div className="text-sm text-muted-foreground">Loading sources…</div>
            ) : sources.length === 0 ? (
              <ErrorState title="No active data sources" message="Create a data source on the Data Sources page first." />
            ) : (
              <Select value={sourceId} onValueChange={setSourceId}>
                <SelectTrigger><SelectValue placeholder="Choose a data source" /></SelectTrigger>
                <SelectContent>
                  {sources.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} · {s.sourceType.replace(/_/g, " ")} · {s.dataStatus}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="mode">Import Mode</Label>
            <Select value={importMode} onValueChange={setImportMode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="UPSERT">UPSERT (safe — update or insert, never delete)</SelectItem>
                <SelectItem value="APPEND">APPEND (add new records only)</SelectItem>
                <SelectItem value="REPLACE">REPLACE (use with caution)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={onSelectSource} disabled={!sourceId}>
            Continue <ArrowRight className="size-4" />
          </Button>
        </div>
      ) : null}

      {/* Step 2: Upload File */}
      {step === 1 ? (
        <div className="space-y-4 max-w-2xl">
          <div className="rounded-md border bg-muted/30 p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Selected source</p>
            <p className="text-sm font-medium">{sources.find((s) => s.id === sourceId)?.name}</p>
            <p className="text-xs text-muted-foreground">Mode: <span className="font-mono">{importMode}</span></p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">File (.csv or .json only — max 25 MB)</Label>
            <Input id="file" type="file" accept=".csv,.json" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            {file ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="size-3.5" />
                {file.name} · {(file.size / 1024).toFixed(1)} KB
              </div>
            ) : null}
            <p className="text-[11px] text-muted-foreground">
              Executable file types (.exe, .sh, .py, .js, .php, …) are rejected. MIME is validated by extension.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setStep(0)}><ArrowLeft className="size-4" /> Back</Button>
            <Button onClick={onUpload} disabled={!file || uploading}>
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
              {uploading ? "Validating…" : "Upload & Validate"}
            </Button>
          </div>
        </div>
      ) : null}

      {/* Step 3/4: Preview */}
      {step === 2 && preview ? (
        <div className="space-y-5">
          <div>
            <h3 className="text-base font-semibold mb-1">Preview & Validation</h3>
            <p className="text-xs text-muted-foreground">
              File <span className="font-mono">{preview.fileName}</span> · {preview.fileType.toUpperCase()} · {(preview.fileSize / 1024).toFixed(1)} KB · checksum <span className="font-mono">{preview.checksum.slice(0, 12)}…</span>
              {preview.isDuplicateUpload ? <span className="ml-2 text-status-attention">⚠ identical to a previous upload</span> : null}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <MetricCard label="Records Found" value={preview.summary.recordsReceived} tone="default" />
            <MetricCard label="Valid" value={preview.summary.recordsAccepted} tone="positive" />
            <MetricCard label="Warnings" value={preview.summary.recordsWarning} tone="attention" />
            <MetricCard label="Duplicates" value={preview.summary.recordsDuplicate} tone="attention" />
            <MetricCard label="Rejected" value={preview.summary.recordsRejected} tone="critical" />
          </div>

          {/* Quality score */}
          <div className="rounded-lg border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Data Quality Score</span>
              <StatusPill tone={preview.summary.qualityScore.overall >= 85 ? "positive" : preview.summary.qualityScore.overall >= 60 ? "attention" : "critical"} dot>
                {preview.summary.qualityScore.overall} / 100
              </StatusPill>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {[
                { k: "Completeness", v: preview.summary.qualityScore.completeness },
                { k: "Validity", v: preview.summary.qualityScore.validity },
                { k: "Uniqueness", v: preview.summary.qualityScore.uniqueness },
                { k: "Consistency", v: preview.summary.qualityScore.consistency },
              ].map((d) => (
                <div key={d.k} className="space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">{d.k}</span><span className="tabular-nums">{d.v}%</span></div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${d.v}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Errors/warnings table */}
          {preview.sampleErrors.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Sample Issues ({preview.sampleErrors.length} shown)</h4>
              <DataTable columns={errorCols} rows={preview.sampleErrors} rowKey={(r) => String(r.rowNumber)} />
            </div>
          ) : (
            <div className="rounded-md border border-status-positive/30 bg-status-positive/5 px-4 py-3 text-sm text-status-positive flex items-center gap-2">
              <CheckCircle2 className="size-4" /> No validation issues detected.
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="size-4" /> Back</Button>
            <Button onClick={onConfirm} disabled={confirming || preview.summary.recordsAccepted === 0}>
              {confirming ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              {confirming ? "Importing…" : `Import ${preview.summary.recordsAccepted} valid record${preview.summary.recordsAccepted === 1 ? "" : "s"}`}
            </Button>
          </div>
        </div>
      ) : null}

      {/* Step 5: Result */}
      {step === 4 && result ? (
        <div className="space-y-5 max-w-2xl">
          <div className="rounded-lg border border-status-positive/40 bg-status-positive/5 p-6 space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-8 text-status-positive" />
              <div>
                <p className="text-lg font-semibold">Import Successful</p>
                <p className="text-sm text-muted-foreground">{result.accepted} records stored to the database.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Batch ID</span><br /><span className="font-mono">{preview?.batchCode}</span></div>
              <div><span className="text-muted-foreground">Status</span><br /><StatusPill tone={result.status === "COMPLETED" ? "positive" : "attention"} dot>{result.status.replace(/_/g, " ")}</StatusPill></div>
              <div><span className="text-muted-foreground">Source</span><br />{preview?.dataSource.name}</div>
              <div><span className="text-muted-foreground">Data Status</span><br /><StatusPill tone="info" dot>{preview?.dataSource.dataStatus}</StatusPill></div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setActiveView("import-batches")}>
              View in Import History <ArrowRight className="size-4" />
            </Button>
            <Button variant="outline" onClick={() => setActiveView("data-quality")}>Open Data Quality</Button>
            <Button variant="outline" onClick={() => setActiveView("records-explorer")}>Open Records Explorer</Button>
            <Button variant="ghost" onClick={() => { setStep(0); setFile(null); setPreview(null); setResult(null); setSourceId(""); }}>
              Upload another file
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
