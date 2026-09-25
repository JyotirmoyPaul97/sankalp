"use client";

import * as React from "react";
import { useNav } from "@/store/app-store";
import { CandidateSidebar } from "./candidate-sidebar";
import { CandidateTopbar } from "./candidate-topbar";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { CandidateHome } from "./views/candidate-home";
import { SkillPassport } from "./views/skill-passport";
import { EvidenceView } from "./views/evidence-view";
import { TargetRolesView } from "./views/target-roles-view";
import { RoleComparisonView } from "./views/role-comparison-view";
import { SkillGapsView } from "./views/skill-gaps-view";
import { DevelopmentPathView } from "./views/development-path-view";
import { SkillEvolutionView } from "./views/skill-evolution-view";
import { ReadinessView } from "./views/readiness-view";
import { OpportunitiesView } from "./views/opportunities-view";
import { MarketContextView } from "./views/market-context-view";
import { ProfileView } from "./views/profile-view";
import { OneSkillView } from "./views/one-skill-view";
import { CopilotPanel } from "../copilot-panel";

const VIEW_REGISTRY: Record<string, React.ComponentType> = {
  "c-overview": CandidateHome,
  "c-passport": SkillPassport,
  "c-evidence": EvidenceView,
  "c-target-roles": TargetRolesView,
  "c-role-comparison": RoleComparisonView,
  "c-gaps": SkillGapsView,
  "c-development-path": DevelopmentPathView,
  "c-evolution": SkillEvolutionView,
  "c-readiness": ReadinessView,
  "c-opportunities": OpportunitiesView,
  "c-market-context": MarketContextView,
  "c-profile": ProfileView,
};

export function CandidateShell() {
  const activeView = useNav((s) => s.activeView);
  const sidebarOpen = useNav((s) => s.sidebarOpen);
  const setSidebar = useNav((s) => s.setSidebar);

  // Default to overview on first mount (and reset when logging in fresh).
  React.useEffect(() => {
    if (!useNav.getState().activeView || !useNav.getState().activeView.startsWith("c-")) {
      useNav.getState().setActiveView("c-overview");
    }
  }, []);

  let ViewComponent: React.ComponentType;
  if (activeView.startsWith("c-one-skill:")) {
    ViewComponent = OneSkillView;
  } else {
    ViewComponent = VIEW_REGISTRY[activeView] ?? CandidateHome;
  }

  return (
    <div className="min-h-screen w-full bg-muted/30">
      {/* Desktop sidebar */}
      <div className="hidden lg:block fixed inset-y-0 left-0 w-64 z-40">
        <CandidateSidebar />
      </div>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebar}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Candidate workspace navigation</SheetTitle>
          <SheetDescription className="sr-only">Primary navigation for the candidate skill intelligence workspace.</SheetDescription>
          <CandidateSidebar onNavigate={() => setSidebar(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <CandidateTopbar onOpenSidebar={() => setSidebar(true)} />
        <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
          <div className="mx-auto w-full max-w-6xl">
            <ViewComponent />
          </div>
        </main>
        <footer className="mt-auto border-t bg-background px-4 lg:px-8 py-4">
          <div className="mx-auto w-full max-w-6xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-status-attention" />
              <span>Prototype · Synthetic Demonstration Data. Evidence-based readiness — NOT employment guarantees.</span>
            </div>
            <span>KAUSHAL DRISHTI · Candidate Skill Intelligence</span>
          </div>
        </footer>
      </div>

      {/* Intelligence Copilot — candidate context */}
      <CopilotPanel />
    </div>
  );
}
