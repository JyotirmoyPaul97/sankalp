"use client";

import * as React from "react";
import { useNav } from "@/store/app-store";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { OverviewView } from "./views/overview-view";
import { DistrictsView } from "./views/districts-view";
import { DistrictProfileView } from "./views/district-profile-view";
import { LabourMarketView, RoleDemandDetailView, SkillDemandDetailView, EmergingRadarView, EvidenceConvergenceView, MarketTrendsView } from "./views/labour-market-view";
import { SkillsView } from "./views/skills-view";
import { TrainingView } from "./views/training-view";
import { CoursesView } from "./views/courses-view";
import { EmployerValidationView } from "./views/employer-validation-view";
import { PolicySandboxView } from "./views/policy-sandbox-view";
import { DistrictPlansView } from "./views/district-plans-view";
import { OutcomesView } from "./views/outcomes-view";
import { DataSourcesView } from "./views/data-sources-view";
import { AdminView } from "./views/admin-view";
import { UploadView } from "./views/upload-view";
import { ImportBatchesView, BatchDetailView } from "./views/import-batches-view";
import { DataQualityView } from "./views/data-quality-view";
import { RecordsExplorerView } from "./views/records-explorer-view";
import { ProvenanceView } from "./views/provenance-view";
import { AuditLogsView } from "./views/audit-logs-view";
import { SkillIntelligenceView } from "./views/skill-intelligence-view";
import { CompetencyFrameworkView } from "./views/competency-framework-view";
import { GapIntelligenceView, GapDetailView, DistrictGapView, ClusterGapView, GapMatrixView } from "./views/gap-intelligence-view";
import { DeliveryCapabilityView } from "./views/delivery-capability-view";
import { CandidateIntelligenceView } from "./views/candidate-intelligence-view";
import { DistrictTwinView, PolicySandboxView as PolicySandboxDashboard, DistrictOutcomesView } from "./views/district-twin-view";

const VIEW_REGISTRY: Record<string, React.ComponentType> = {
  overview: OverviewView,
  districts: DistrictsView,
  "district-profile": DistrictProfileView,
  "labour-market": LabourMarketView,
  "emerging-radar": EmergingRadarView,
  "market-trends": MarketTrendsView,
  "evidence-convergence": EvidenceConvergenceView,
  skills: SkillsView,
  "skill-intelligence": SkillIntelligenceView,
  "competency-framework": CompetencyFrameworkView,
  "gap-intelligence": GapIntelligenceView,
  "gap-districts": DistrictGapView,
  "gap-clusters": ClusterGapView,
  "gap-matrix": GapMatrixView,
  "delivery-capability": DeliveryCapabilityView,
  "candidate-intelligence": CandidateIntelligenceView,
  "district-twin": DistrictTwinView,
  "policy-sandbox": PolicySandboxDashboard,
  "district-plans": PolicySandboxDashboard,
  outcomes: DistrictOutcomesView,
  training: TrainingView,
  courses: CoursesView,
  "employer-validation": EmployerValidationView,
  "data-sources": DataSourcesView,
  admin: AdminView,
  upload: UploadView,
  "import-batches": ImportBatchesView,
  "data-quality": DataQualityView,
  "records-explorer": RecordsExplorerView,
  provenance: ProvenanceView,
  "audit-logs": AuditLogsView,
};

export function AppShell() {
  const activeView = useNav((s) => s.activeView);
  const sidebarOpen = useNav((s) => s.sidebarOpen);
  const setSidebar = useNav((s) => s.setSidebar);

  // Handle dynamic views: batch-detail:<id>, role-demand:<id>, skill-demand:<id>, gap-skill:<id>, gap-role:<id>
  let ViewComponent: React.ComponentType;
  if (activeView.startsWith("batch-detail:")) {
    ViewComponent = BatchDetailView;
  } else if (activeView.startsWith("role-demand:")) {
    ViewComponent = RoleDemandDetailView;
  } else if (activeView.startsWith("skill-demand:")) {
    ViewComponent = SkillDemandDetailView;
  } else if (activeView.startsWith("gap-skill:") || activeView.startsWith("gap-role:")) {
    ViewComponent = GapDetailView;
  } else {
    ViewComponent = VIEW_REGISTRY[activeView] ?? OverviewView;
  }

  return (
    <div className="min-h-screen w-full bg-muted/30">
      {/* Desktop sidebar */}
      <div className="hidden lg:block fixed inset-y-0 left-0 w-64 z-40">
        <Sidebar />
      </div>

      {/* Mobile sidebar (sheet) */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebar}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">KAUSHAL DRISHTI navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Primary navigation for the skill-intelligence platform.
          </SheetDescription>
          <Sidebar onNavigate={() => setSidebar(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Topbar onOpenSidebar={() => setSidebar(true)} />
        <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">
            <ViewComponent />
          </div>
        </main>
        <footer className="mt-auto border-t bg-background px-4 lg:px-8 py-4">
          <div className="mx-auto w-full max-w-7xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-status-attention" />
              <span>
                Demo Environment — Synthetic Demonstration Data. Not actual Maharashtra Government data.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span>KAUSHAL DRISHTI · Phase 1 Foundation</span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">Maharashtra Skill Intelligence Platform</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
