"use client";

import { useFetch } from "@/hooks/use-fetch";

export interface CandidateMe {
  candidate: {
    id: string;
    name: string;
    email: string;
    educationLevel: string | null;
    experienceYears: number | null;
    district: { id: string; name: string } | null;
    status: string;
    dataStatus: string;
    createdAt: string;
    counts: { skills: number; evidence: number; assessments: number; skillGaps: number };
  };
  targetRole: {
    targetRoleId: string;
    jobRole: { id: string; title: string; description: string | null; sector: { id: string; name: string } | null };
    sector: { id: string; name: string } | null;
    district: { id: string; name: string } | null;
    marketDemandSignal: string;
    marketConfidence: number;
  } | null;
}

export function useCandidateMe() {
  return useFetch<CandidateMe>("/api/v1/candidate/me");
}
