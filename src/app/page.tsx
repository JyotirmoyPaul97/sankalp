"use client";

import * as React from "react";
import { useAuth } from "@/store/app-store";
import { LandingScreen } from "@/components/kaushal/landing-screen";
import { AppShell } from "@/components/kaushal/app-shell";
import { CandidateShell } from "@/components/kaushal/candidate/candidate-shell";

export default function Page() {
  const user = useAuth((s) => s.user);
  const status = useAuth((s) => s.status);
  const hydrate = useAuth((s) => s.hydrate);

  // Hydrate persisted session on first client render.
  React.useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!user) {
    return <LandingScreen />;
  }

  // Candidate / Beneficiary workspace is a focused beneficiary shell — NOT the
  // government control plane. It reuses the same Skill Intelligence Engine.
  if (user.role === "CANDIDATE") {
    return <CandidateShell />;
  }

  return <AppShell />;
}
