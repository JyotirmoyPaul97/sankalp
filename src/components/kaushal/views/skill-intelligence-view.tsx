"use client";

import * as React from "react";
import { Network, Sparkles, Search, ArrowRight, GitBranch, Box, Plus } from "lucide-react";
import { PageHeader, SectionLabel } from "@/components/kaushal/page-header";
import { EvidencePanel } from "@/components/kaushal/evidence-panel";
import { StatusPill } from "@/components/kaushal/status-pill";
import { DataTable, type Column } from "@/components/kaushal/data-table";
import { ErrorState, LoadingState } from "@/components/kaushal/states";
import { useFetch } from "@/hooks/use-fetch";
import { api, getToken } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { SkillNeighbourhood, NormalizeResult, Paginated, Skill, SkillCluster as Cluster } from "@/types/domain";

const PROFICIENCY_TONE: Record<string, "neutral" | "info" | "positive" | "attention"> = {
  AWARENESS: "neutral", WORKING: "info", PROFICIENT: "positive", EXPERT: "attention",
};

export function SkillIntelligenceView() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Skill Intelligence"
        description="Canonical skill knowledge graph — aliases, relations, and clusters. The deterministic normalizer resolves raw skill strings to canonical entities (no embeddings / no ML — Phase 3 foundation)."
        badge={<StatusPill tone="info" dot>Phase 3 — Knowledge Graph</StatusPill>}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <SkillNormalizerPlayground />
        <ClustersPanel />
      </div>

      <SkillGraphExplorer />
    </div>
  );
}

/** Interactive normalizer playground: type a raw skill string → see resolution. */
function SkillNormalizerPlayground() {
  const [input, setInput] = React.useState("PLC");
  const [result, setResult] = React.useState<NormalizeResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const resolve = async () => {
    if (!input.trim()) return;
    setLoading(true); setError(null);
    try {
      const r = await api.get<NormalizeResult>(`/api/v1/skills/canonical?name=${encodeURIComponent(input)}`);
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally { setLoading(false); }
  };

  React.useEffect(() => { resolve(); }, []);

  const examples = ["PLC", "Programmable Logic Controller", "P.L.C.", "plc", "SCADA", "BMS", "Battery Management", "Python 3"];

  return (
    <EvidencePanel title="Skill Normalizer" source="Deterministic" confidence="high">
      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
        Type any raw skill string. The resolver normalises whitespace + dots, then matches on canonical name → name → alias → token-suffix. No embeddings, no ML.
      </p>
      <div className="flex items-center gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && resolve()} placeholder="e.g. Programmable Logic Controller" />
        <Button onClick={resolve} disabled={loading}><Search className="size-4" /> Resolve</Button>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {examples.map((ex) => (
          <button key={ex} onClick={() => { setInput(ex); }} className="text-[11px] rounded-full border bg-muted/40 px-2 py-0.5 hover:bg-accent transition-colors font-mono">{ex}</button>
        ))}
      </div>

      {loading ? <LoadingState label="Resolving…" /> : error ? <ErrorState message={error} /> : result ? (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded border p-2"><p className="text-muted-foreground">Raw input</p><p className="font-mono">{result.rawInput}</p></div>
            <div className="rounded border p-2"><p className="text-muted-foreground">Normalised</p><p className="font-mono">{result.normalisedInput}</p></div>
          </div>
          {result.resolved ? (
            <div className="rounded-md border border-status-positive/40 bg-status-positive/5 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Resolved → {result.canonicalName}</span>
                <StatusPill tone="positive" dot>resolved</StatusPill>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>via <span className="font-mono font-medium text-foreground">{result.matchedVia}</span></span>
                {result.aliasType ? <span>· type <span className="font-mono">{result.aliasType}</span></span> : null}
                <span>· confidence <span className="tabular-nums">{Math.round(result.confidence * 100)}%</span></span>
              </div>
              <Button variant="outline" size="sm" onClick={() => { window.location.hash = `skill-${result.skillId}`; }}>
                View in graph <ArrowRight className="size-3" />
              </Button>
            </div>
          ) : (
            <div className="rounded-md border border-status-attention/40 bg-status-attention/5 p-3 text-sm">
              <p className="font-medium text-status-attention">No canonical skill matched.</p>
              <p className="text-xs text-muted-foreground mt-1">Phase 3 is a foundation — unresolved strings can be mapped manually in a later phase.</p>
            </div>
          )}
        </div>
      ) : null}
    </EvidencePanel>
  );
}

function ClustersPanel() {
  const { data, loading, error } = useFetch<{ clusters: Cluster[] }>("/api/v1/skill-clusters");
  if (loading) return <EvidencePanel title="Skill Clusters"><LoadingState /></EvidencePanel>;
  if (error) return <EvidencePanel title="Skill Clusters"><ErrorState message={error.message} /></EvidencePanel>;
  return (
    <EvidencePanel title="Skill Clusters" source="Knowledge Graph">
      <div className="space-y-2">
        {(data?.clusters ?? []).map((c) => (
          <div key={c.id} className="rounded-md border bg-card p-3 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2"><Box className="size-4 text-primary" /><span className="text-sm font-medium">{c.name}</span></div>
              <StatusPill tone="info" dot>{c.memberCount} skills</StatusPill>
            </div>
            {c.description ? <p className="text-xs text-muted-foreground">{c.description}</p> : null}
            <div className="flex flex-wrap gap-1">
              {(c.skills ?? []).map((s) => (
                <span key={s.skillId} className="text-[10px] rounded bg-muted px-1.5 py-0.5">{s.skillName}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </EvidencePanel>
  );
}

function SkillGraphExplorer() {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const { data: skillsData } = useFetch<Paginated<Skill>>("/api/v1/skills?pageSize=100");
  const { data: nb, loading, error } = useFetch<SkillNeighbourhood>(
    selectedId ? `/api/v1/skills/${selectedId}/graph` : null,
    [selectedId],
  );

  // Auto-select first skill
  React.useEffect(() => {
    if (!selectedId && skillsData?.items?.length) setSelectedId(skillsData.items[0].id);
  }, [skillsData, selectedId]);

  const edgeCols: Column<SkillNeighbourhood["outgoing"][number]>[] = [
    { key: "from", header: "From", cell: (e) => <span className="text-xs">{e.from.name}</span> },
    { key: "type", header: "Relation", cell: (e) => <StatusPill tone={e.relationType === "PREREQUISITE" ? "attention" : "info"} dot>{e.relationType.replace(/_/g, " ")}</StatusPill>, width: "150px" },
    { key: "to", header: "To", cell: (e) => <span className="text-xs font-medium">{e.to.name}</span> },
    { key: "weight", header: "Weight", cell: (e) => <span className="tabular-nums text-xs">{e.weight}</span>, width: "80px" },
  ];

  return (
    <section className="space-y-4">
      <SectionLabel>Skill Knowledge Graph — 1-Hop Neighbourhood</SectionLabel>
      <div className="grid lg:grid-cols-4 gap-4">
        {/* Skill picker */}
        <div className="space-y-2">
          <Label htmlFor="skill-pick">Center skill</Label>
          <Select value={selectedId ?? ""} onValueChange={setSelectedId}>
            <SelectTrigger id="skill-pick"><SelectValue placeholder="Choose a skill" /></SelectTrigger>
            <SelectContent>
              {(skillsData?.items ?? []).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {nb ? (
            <div className="space-y-1.5 pt-2">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Aliases</p>
              {nb.aliases.length === 0 ? <p className="text-xs text-muted-foreground">None</p> : (
                <ul className="space-y-0.5">
                  {nb.aliases.map((a) => (
                    <li key={a.id} className="text-xs"><span className="font-mono">{a.alias}</span> <span className="text-muted-foreground">· {a.aliasType}</span></li>
                  ))}
                </ul>
              )}
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground pt-2">Clusters</p>
              {nb.clusters.length === 0 ? <p className="text-xs text-muted-foreground">None</p> : (
                <ul className="space-y-0.5">
                  {nb.clusters.map((c) => <li key={c.id} className="text-xs">{c.name} <span className="text-muted-foreground">· {c.membershipType}</span></li>)}
                </ul>
              )}
            </div>
          ) : null}
        </div>

        {/* Graph */}
        <div className="lg:col-span-3 space-y-3">
          {!nb ? (
            <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
              Select a skill to explore its graph neighbourhood.
            </div>
          ) : loading ? <LoadingState /> : error ? <ErrorState message={error.message} /> : (
            <>
              <div className="flex items-center gap-2">
                <Network className="size-4 text-primary" />
                <span className="text-sm font-medium">{nb.center.name}</span>
                <span className="text-xs text-muted-foreground font-mono">{nb.center.canonicalName}</span>
                {nb.center.category ? <StatusPill tone="info">{nb.center.category}</StatusPill> : null}
              </div>
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Outgoing edges ({nb.outgoing.length})</h4>
                  <DataTable columns={edgeCols} rows={nb.outgoing} rowKey={(e) => e.id} emptyMessage="No outgoing relations." />
                </div>
                {nb.incoming.length > 0 ? (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Incoming edges ({nb.incoming.length})</h4>
                    <DataTable columns={edgeCols} rows={nb.incoming} rowKey={(e) => e.id} emptyMessage="No incoming relations." />
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
