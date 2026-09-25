"use client";

import * as React from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { StatusPill } from "@/components/kaushal/status-pill";
import { Badge } from "@/components/ui/badge";
import { evidenceTypeLabel, profLabel, freshnessLabel, freshnessTone } from "./proficiency";
import { ShieldCheck, Clock, FileText, Award, Briefcase, Activity, User, BadgeCheck } from "lucide-react";

export interface EvidenceDetail {
  id: string;
  evidenceType: string;
  evidenceSource: string | null;
  evidenceTimestamp: string;
  proficiencyLevel: string;
  verificationStatus: string;
  confidence: number;
  description: string | null;
  skill?: { name: string } | null;
}

const ICONS: Record<string, React.ReactNode> = {
  User: <User className="size-4" />,
  ClipboardCheck: <BadgeCheck className="size-4" />,
  Award: <Award className="size-4" />,
  Briefcase: <Briefcase className="size-4" />,
  Activity: <Activity className="size-4" />,
  ShieldCheck: <ShieldCheck className="size-4" />,
  BadgeCheck: <BadgeCheck className="size-4" />,
  FileText: <FileText className="size-4" />,
};

export function EvidenceDrawer({ evidence, open, onOpenChange }: { evidence: EvidenceDetail | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const ev = evidence;
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b">
          <DrawerTitle className="flex items-center gap-2">
            {ev ? ICONS[iconKey(ev.evidenceType)] : null}
            <span>{ev ? evidenceTypeLabel(ev.evidenceType) : "Evidence"}</span>
          </DrawerTitle>
          <DrawerDescription>{ev?.evidenceSource ?? "Evidence detail"}</DrawerDescription>
        </DrawerHeader>
        {ev ? (
          <div className="p-6 space-y-4 overflow-y-auto">
            <div className="space-y-1.5">
              <p className="text-base font-semibold leading-snug">{ev.description ?? evidenceTypeLabel(ev.evidenceType)}</p>
              {ev.skill ? <p className="text-xs text-muted-foreground">Skill: <span className="font-medium text-foreground">{ev.skill.name}</span></p> : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <DetailRow label="Evidence Type" value={evidenceTypeLabel(ev.evidenceType)} />
              <DetailRow label="Demonstrated Proficiency" value={profLabel(ev.proficiencyLevel)} />
              <DetailRow label="Date" value={new Date(ev.evidenceTimestamp).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })} icon={<Clock className="size-3" />} />
              <DetailRow label="Evidence Source" value={ev.evidenceSource ?? "—"} />
              <DetailRow label="Verification Status" value={
                <StatusPill tone={ev.verificationStatus === "VERIFIED" ? "positive" : ev.verificationStatus === "REJECTED" ? "critical" : "attention"} dot>{ev.verificationStatus}</StatusPill>
              } />
              <DetailRow label="Confidence" value={
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${ev.confidence * 100}%` }} /></div>
                  <span className="text-xs tabular-nums">{Math.round(ev.confidence * 100)}%</span>
                </div>
              } />
            </div>

            <div className="rounded-md border bg-muted/30 p-3 text-[11px] text-muted-foreground leading-relaxed">
              <ShieldCheck className="size-3 inline mr-1" />
              This evidence item is part of your verified skill passport. Only opportunity-relevant, demonstrated capability is shared with stakeholders — never your private personal information.
            </div>
          </div>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

function iconKey(t: string): string {
  const map: Record<string, string> = {
    SELF_DECLARED: "User", ASSESSED: "ClipboardCheck", CERTIFIED: "Award",
    PROJECT: "Briefcase", EXPERIENCE: "Activity", EMPLOYER_VERIFIED: "ShieldCheck",
    SYSTEM_INFERRED: "BadgeCheck", UNKNOWN: "FileText",
  };
  return map[t] ?? "FileText";
}

function DetailRow({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">{icon}{label}</p>
      <div className="text-sm">{value}</div>
    </div>
  );
}
