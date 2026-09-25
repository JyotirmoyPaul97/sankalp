"use client";

import * as React from "react";
import { Menu, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNav, useAuth } from "@/store/app-store";

const TITLES: Record<string, string> = {
  "c-overview": "Skill Intelligence Overview",
  "c-passport": "My Skill Passport",
  "c-evidence": "Evidence, Not Claims",
  "c-target-roles": "Target Role",
  "c-role-comparison": "Role Readiness",
  "c-gaps": "My Skill Gaps",
  "c-development-path": "My Development Path",
  "c-evolution": "My Skill Evolution",
  "c-readiness": "Candidate Readiness",
  "c-opportunities": "Opportunity Match",
  "c-market-context": "Market Context",
  "c-profile": "Profile",
};

export function CandidateTopbar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const activeView = useNav((s) => s.activeView);
  const user = useAuth((s) => s.user);
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="h-full flex items-center gap-3 px-4 lg:px-8">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenSidebar}>
          <Menu className="size-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold tracking-tight truncate">{TITLES[activeView] ?? "Candidate Workspace"}</h1>
          <p className="text-[11px] text-muted-foreground truncate">Hello, {user?.name?.split(" ")[0] ?? "Candidate"} · Skill Intelligence, not a jobs feed.</p>
        </div>
        <Badge variant="outline" className="hidden sm:inline-flex text-[10px] font-mono">SYNTHETIC</Badge>
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme">
          <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </div>
    </header>
  );
}
