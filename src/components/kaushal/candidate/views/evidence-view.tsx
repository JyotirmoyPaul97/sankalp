"use client";

import * as React from "react";
import { FileText, Award, Briefcase, Activity, ShieldCheck, User, BadgeCheck, Plus, CheckCircle2 } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { api } from "@/lib/api-client";
import { LoadingState, ErrorState } from "@/components/kaushal/states";
import { StatusPill } from "@/components/kaushal/status-pill";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCandidateMe } from "../use-candidate";
import { EvidenceDrawer, type EvidenceDetail } from "../evidence-drawer";
import { profLabel, evidenceTypeLabel, freshnessLabel, freshnessTone } from "../proficiency";

const EVIDENCE_ICONS: Record<string, React.ReactNode> = {
  SELF_DECLARED: <User className="size-4" />,
  ASSESSED: <BadgeCheck className="size-4" />,
  CERTIFIED: <Award className="size-4" />,
  PROJECT: <Briefcase className="size-4" />,
  EXPERIENCE: <Activity className="size-4" />,
  EMPLOYER_VERIFIED: <ShieldCheck className="size-4" />,
};

interface EvidenceRow {
  id: string;
  evidenceType: string;
  evidenceSource: string | null;
  evidenceTimestamp: string;
  proficiencyLevel: string;
  verificationStatus: string;
  confidence: number;
  description: string | null;
  skill: { id: string; name: string; category: string | null } | null;
}

export function EvidenceView() {
  const { data: me, loading, error } = useCandidateMe();
  const candidateId = me?.candidate.id;
  const { data, loading: evLoading, error: evError, refetch } = useFetch<{ evidence: EvidenceRow[] }>(candidateId ? `/api/v1/candidates/${candidateId}/evidence` : null);

  const [selected, setSelected] = React.useState<EvidenceDetail | null>(null);
  const [open, setOpen] = React.useState(false);
  const [showAdd, setShowAdd] = React.useState(false);

  if (loading) return <LoadingState label="Loading evidence…" />;
  if (error || !me) return <ErrorState message={error?.message ?? "Could not load your candidate profile."} />;

  const evidence = data?.evidence ?? [];
  const verifiedCount = evidence.filter((e) => e.verificationStatus === "VERIFIED").length;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">Evidence, Not Claims</h2>
        <p className="text-sm text-muted-foreground">Every demonstrated proficiency is backed by structured evidence you can inspect. This is the strongest differentiator of KAUSHAL DRISHTI.</p>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone="info" dot>{evidence.length} evidence items</StatusPill>
          <StatusPill tone="positive" dot>{verifiedCount} verified</StatusPill>
          <StatusPill tone="neutral">{evidence.length - verifiedCount} pending</StatusPill>
        </div>
      </header>

      {/* Claimed vs Demonstrated banner */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">CLAIMED vs DEMONSTRATED</p>
            <p className="text-xs text-muted-foreground">Matched on demonstrated capability + evidence, not claimed skills.</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div><span className="text-muted-foreground">Claimed skills:</span> <span className="font-semibold text-foreground">{me.candidate.counts.skills}</span></div>
            <div><span className="text-muted-foreground">Evidence-backed:</span> <span className="font-semibold text-status-positive">{evidence.length > 0 ? new Set(evidence.filter((e) => e.skill).map((e) => e.skill!.id)).size : 0}</span></div>
            <div><span className="text-muted-foreground">Verified:</span> <span className="font-semibold text-status-positive">{verifiedCount}</span></div>
          </div>
        </div>
      </div>

      {/* Add progress event */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Record Progress Event</h3>
          <Button variant="outline" size="sm" onClick={() => setShowAdd(!showAdd)}><Plus className="size-3.5" /> {showAdd ? "Cancel" : "Add evidence"}</Button>
        </div>
        {showAdd ? <AddEvidenceForm candidateId={candidateId!} skills={Array.from(new Set(evidence.map((e) => e.skill?.name).filter(Boolean)))} onDone={() => { setShowAdd(false); refetch(); }} /> : null}
      </div>

      {/* Evidence list */}
      {evLoading ? <LoadingState /> : evError ? <ErrorState message={evError.message} /> : (
        <div className="space-y-2">
          {evidence.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No evidence recorded yet. Add your first progress event above.</div>
          ) : evidence.map((ev) => (
            <button key={ev.id} onClick={() => { setSelected(ev as unknown as EvidenceDetail); setOpen(true); }} className="w-full text-left flex items-start gap-3 rounded-lg border bg-card p-3 hover:border-primary/40 hover:bg-accent/30 transition-colors">
              <div className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground shrink-0">{EVIDENCE_ICONS[ev.evidenceType] ?? <FileText className="size-4" />}</div>
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium">{evidenceTypeLabel(ev.evidenceType)}</p>
                  {ev.skill ? <Badge className="text-[9px] font-mono">{ev.skill.name}</Badge> : null}
                  {ev.verificationStatus === "VERIFIED" ? <StatusPill tone="positive" dot>Verified</StatusPill> : <StatusPill tone="attention" dot>{ev.verificationStatus}</StatusPill>}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">{ev.description ?? ev.evidenceSource ?? "—"}</p>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span>{new Date(ev.evidenceTimestamp).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}</span>
                  <span>· {ev.evidenceSource ?? "—"}</span>
                  <span>· {profLabel(ev.proficiencyLevel)}</span>
                </div>
              </div>
              {ev.verificationStatus === "VERIFIED" ? <CheckCircle2 className="size-4 text-status-positive shrink-0" /> : null}
            </button>
          ))}
        </div>
      )}

      <EvidenceDrawer evidence={selected} open={open} onOpenChange={setOpen} />
    </div>
  );
}

function AddEvidenceForm({ candidateId, skills, onDone }: { candidateId: string; skills: string[]; onDone: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const { data: skillsData } = useFetch<{ items: { id: string; name: string }[] } & Record<string, unknown>>(`/api/v1/skills?pageSize=100`);

  const [skillId, setSkillId] = React.useState("");
  const [actionType, setActionType] = React.useState("PRACTICE_EVIDENCE_ADDED");
  const [evidenceType, setEvidenceType] = React.useState("EXPERIENCE");
  const [title, setTitle] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [proficiency, setProficiency] = React.useState("WORKING");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillId || !title) { toast({ title: "Skill and title are required", variant: "destructive" }); return; }
    setLoading(true);
    try {
      await api.post("/api/v1/candidate/progress-event", {
        skillId, actionType, evidenceType, title, description: desc,
        proficiencyLevel: proficiency, verificationStatus: "PENDING", confidence: 0.5,
      });
      toast({ title: "Progress event recorded", description: "Evidence added to your skill passport." });
      onDone();
    } catch (err) {
      toast({ title: "Could not record event", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-lg border bg-card p-4 space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="skill">Skill</Label>
          <Select value={skillId} onValueChange={setSkillId}>
            <SelectTrigger><SelectValue placeholder="Select skill…" /></SelectTrigger>
            <SelectContent>
              {(skillsData?.items ?? []).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="action">Progress Action</Label>
          <Select value={actionType} onValueChange={setActionType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PRACTICE_EVIDENCE_ADDED">Completed practice</SelectItem>
              <SelectItem value="ASSESSMENT_COMPLETED">Completed assessment</SelectItem>
              <SelectItem value="PROJECT_ADDED">Completed project</SelectItem>
              <SelectItem value="CERTIFICATE_ADDED">Added certificate</SelectItem>
              <SelectItem value="LEARNING_ACTIVITY">Completed learning activity</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="etype">Evidence Type</Label>
          <Select value={evidenceType} onValueChange={setEvidenceType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="EXPERIENCE">Practice / Activity</SelectItem>
              <SelectItem value="ASSESSED">Assessment</SelectItem>
              <SelectItem value="PROJECT">Project</SelectItem>
              <SelectItem value="CERTIFIED">Certificate</SelectItem>
              <SelectItem value="SELF_DECLARED">Self Declaration</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="prof">Demonstrated Proficiency</Label>
          <Select value={proficiency} onValueChange={setProficiency}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="AWARENESS">Basic</SelectItem>
              <SelectItem value="WORKING">Intermediate</SelectItem>
              <SelectItem value="PROFICIENT">Advanced</SelectItem>
              <SelectItem value="EXPERT">Expert</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Advanced PLC practice lab session" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="desc">Description (optional)</Label>
        <Textarea id="desc" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What did you do? What did you demonstrate?" rows={2} />
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onDone}>Cancel</Button>
        <Button type="submit" size="sm" disabled={loading}>{loading ? "Recording…" : "Record evidence"}</Button>
      </div>
      <p className="text-[10px] text-muted-foreground">This event will be added to your evidence ledger and the skill evolution timeline.</p>
    </form>
  );
}
