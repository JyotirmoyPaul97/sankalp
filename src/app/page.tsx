"use client";

import * as React from "react";
import { useAuth } from "@/store/app-store";
import { LoginScreen } from "@/components/kaushal/login-screen";
import { AppShell } from "@/components/kaushal/app-shell";

export default function Page() {
  const user = useAuth((s) => s.user);
  const status = useAuth((s) => s.status);
  const hydrate = useAuth((s) => s.hydrate);

  // Hydrate persisted session on first client render.
  React.useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!user) {
    return <LoginScreen />;
  }

  return <AppShell />;
}
