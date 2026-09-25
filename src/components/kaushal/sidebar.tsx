"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useNav, useAuth } from "@/store/app-store";
import {
  LayoutDashboard,
  Building2,
  TrendingUp,
  Sparkles,
  GraduationCap,
  BookOpen,
  ShieldCheck,
  FlaskConical,
  ClipboardList,
  Target,
  Database,
  Settings,
  ChevronRight,
  Upload,
  History,
  GaugeCircle,
  TableProperties,
  ScrollText,
  FileSearch,
  Network,
  Layers3,
  Radar,
  LineChart,
  Gauge,
  GitCompareArrows,
  Truck,
  User,
  Building,
  Activity,
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  phase: number;
  active: boolean;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    id: "intelligence",
    label: "Intelligence",
    items: [
      { id: "overview", label: "Overview", icon: <LayoutDashboard className="size-4" />, phase: 1, active: true },
      { id: "labour-market", label: "Labour Market", icon: <TrendingUp className="size-4" />, phase: 4, active: true },
      { id: "emerging-radar", label: "Emerging Radar", icon: <Radar className="size-4" />, phase: 4, active: true },
      { id: "market-trends", label: "Market Trends", icon: <LineChart className="size-4" />, phase: 4, active: true },
      { id: "evidence-convergence", label: "Evidence Convergence", icon: <Gauge className="size-4" />, phase: 4, active: true },
      { id: "skills", label: "Skills", icon: <Sparkles className="size-4" />, phase: 1, active: true },
      { id: "skill-intelligence", label: "Skill Intelligence", icon: <Building2 className="size-4" />, phase: 3, active: true },
      { id: "competency-framework", label: "Competency Framework", icon: <Layers3 className="size-4" />, phase: 3, active: true },
    ],
  },
  {
    id: "training",
    label: "Training",
    items: [
      { id: "training", label: "Training Ecosystem", icon: <GraduationCap className="size-4" />, phase: 1, active: true },
      { id: "courses", label: "Courses", icon: <BookOpen className="size-4" />, phase: 1, active: true },
    ],
  },
  {
    id: "decision-support",
    label: "Decision Support",
    items: [
      { id: "gap-intelligence", label: "Gap Intelligence", icon: <GitCompareArrows className="size-4" />, phase: 5, active: true },
      { id: "delivery-capability", label: "Delivery Capability", icon: <Truck className="size-4" />, phase: 6, active: true },
      { id: "gap-districts", label: "District Gaps", icon: <Building2 className="size-4" />, phase: 5, active: true },
      { id: "gap-clusters", label: "Cluster Gaps", icon: <Building2 className="size-4" />, phase: 5, active: true },
      { id: "gap-matrix", label: "Market–Training Matrix", icon: <Gauge className="size-4" />, phase: 5, active: true },
      { id: "district-twin", label: "District Digital Twin", icon: <Building className="size-4" />, phase: 8, active: true },
      { id: "policy-sandbox", label: "Policy Sandbox", icon: <FlaskConical className="size-4" />, phase: 8, active: true },
      { id: "district-plans", label: "District Plans", icon: <ClipboardList className="size-4" />, phase: 8, active: true },
      { id: "districts", label: "District Intelligence", icon: <Building2 className="size-4" />, phase: 1, active: true },
    ],
  },
  {
    id: "collaboration",
    label: "Collaboration",
    items: [
      { id: "candidate-intelligence", label: "Candidate Intelligence", icon: <User className="size-4" />, phase: 7, active: true },
      { id: "employer-validation", label: "Employer Validation", icon: <ShieldCheck className="size-4" />, phase: 7, active: false },
    ],
  },
  {
    id: "outcomes",
    label: "Outcomes",
    items: [
      { id: "outcomes", label: "District Outcomes", icon: <Activity className="size-4" />, phase: 8, active: true },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      { id: "data-sources", label: "Data Sources", icon: <Database className="size-4" />, phase: 2, active: true },
      { id: "admin", label: "Administration", icon: <Settings className="size-4" />, phase: 1, active: true },
    ],
  },
  {
    id: "data-operations",
    label: "Data Operations",
    items: [
      { id: "upload", label: "Upload Dataset", icon: <Upload className="size-4" />, phase: 2, active: true },
      { id: "import-batches", label: "Import Batches", icon: <History className="size-4" />, phase: 2, active: true },
      { id: "data-quality", label: "Data Quality", icon: <GaugeCircle className="size-4" />, phase: 2, active: true },
      { id: "records-explorer", label: "Records Explorer", icon: <TableProperties className="size-4" />, phase: 2, active: true },
      { id: "provenance", label: "Provenance", icon: <FileSearch className="size-4" />, phase: 2, active: true },
      { id: "audit-logs", label: "Audit Logs", icon: <ScrollText className="size-4" />, phase: 2, active: true },
    ],
  },
];

interface SidebarProps {
  onNavigate?: () => void;
}

// Role-aware workspace filtering
function getGroupsForRole(role: string | undefined): NavGroup[] {
  if (!role) return GROUPS;

  // Government: full access (STATE_ADMIN, DISTRICT_PLANNER, AUDITOR)
  if (["STATE_ADMIN", "DISTRICT_PLANNER", "AUDITOR"].includes(role)) {
    return [
      { id: "command", label: "Command", items: [
        { id: "overview", label: "Command Centre", icon: <LayoutDashboard className="size-4" />, phase: 9, active: true },
        { id: "district-twin", label: "District Digital Twin", icon: <Building className="size-4" />, phase: 8, active: true },
        { id: "skill-graph", label: "Skill Intelligence Graph", icon: <Network className="size-4" />, phase: 10, active: true },
      ]},
      { id: "intelligence", label: "Intelligence", items: [
        { id: "labour-market", label: "Labour Market", icon: <TrendingUp className="size-4" />, phase: 4, active: true },
        { id: "emerging-radar", label: "Emerging Radar", icon: <Radar className="size-4" />, phase: 4, active: true },
        { id: "skills", label: "Skills", icon: <Sparkles className="size-4" />, phase: 1, active: true },
        { id: "skill-intelligence", label: "Skill Intelligence", icon: <Building2 className="size-4" />, phase: 3, active: true },
        { id: "competency-framework", label: "Competency Framework", icon: <Layers3 className="size-4" />, phase: 3, active: true },
      ]},
      { id: "decision-support", label: "Decision Support", items: [
        { id: "gap-intelligence", label: "Gap Intelligence", icon: <GitCompareArrows className="size-4" />, phase: 5, active: true },
        { id: "delivery-capability", label: "Delivery Capability", icon: <Truck className="size-4" />, phase: 6, active: true },
        { id: "gap-districts", label: "District Gaps", icon: <Building2 className="size-4" />, phase: 5, active: true },
        { id: "gap-clusters", label: "Cluster Gaps", icon: <Building2 className="size-4" />, phase: 5, active: true },
        { id: "gap-matrix", label: "Market–Training Matrix", icon: <Gauge className="size-4" />, phase: 5, active: true },
        { id: "policy-sandbox", label: "Policy Sandbox", icon: <FlaskConical className="size-4" />, phase: 8, active: true },
        { id: "district-plans", label: "District Plans", icon: <ClipboardList className="size-4" />, phase: 8, active: true },
        { id: "districts", label: "District Intelligence", icon: <Building2 className="size-4" />, phase: 1, active: true },
      ]},
      { id: "outcomes", label: "Outcomes", items: [
        { id: "outcomes", label: "District Outcomes", icon: <Activity className="size-4" />, phase: 8, active: true },
      ]},
      { id: "system", label: "System", items: [
        { id: "data-governance", label: "Data Governance", icon: <Settings className="size-4" />, phase: 10, active: true },
        { id: "system-health", label: "System Health", icon: <Activity className="size-4" />, phase: 10, active: true },
        { id: "data-sources", label: "Data Sources", icon: <Database className="size-4" />, phase: 2, active: true },
        { id: "admin", label: "Administration", icon: <Settings className="size-4" />, phase: 1, active: true },
      ]},
      { id: "data-operations", label: "Data Operations", items: [
        { id: "upload", label: "Upload Dataset", icon: <Upload className="size-4" />, phase: 2, active: true },
        { id: "import-batches", label: "Import Batches", icon: <History className="size-4" />, phase: 2, active: true },
        { id: "data-quality", label: "Data Quality", icon: <GaugeCircle className="size-4" />, phase: 2, active: true },
        { id: "records-explorer", label: "Records Explorer", icon: <TableProperties className="size-4" />, phase: 2, active: true },
        { id: "provenance", label: "Provenance", icon: <FileSearch className="size-4" />, phase: 2, active: true },
        { id: "audit-logs", label: "Audit Logs", icon: <ScrollText className="size-4" />, phase: 2, active: true },
      ]},
    ];
  }

  // Industry & Employer
  if (["EMPLOYER"].includes(role)) {
    return [
      { id: "employer", label: "Industry & Employer", items: [
        { id: "labour-market", label: "Market Intelligence", icon: <TrendingUp className="size-4" />, phase: 4, active: true },
        { id: "emerging-radar", label: "Emerging Skills", icon: <Radar className="size-4" />, phase: 4, active: true },
        { id: "skills", label: "Skills", icon: <Sparkles className="size-4" />, phase: 1, active: true },
        { id: "employer-validation", label: "Employer Validation", icon: <ShieldCheck className="size-4" />, phase: 7, active: true },
      ]},
    ];
  }

  // Training Ecosystem (TRAINING_PROVIDER, INSTITUTION, TRAINER)
  if (["TRAINING_PROVIDER", "INSTITUTION", "TRAINER"].includes(role)) {
    return [
      { id: "training-eco", label: "Training Ecosystem", items: [
        { id: "training", label: "Training Overview", icon: <GraduationCap className="size-4" />, phase: 1, active: true },
        { id: "courses", label: "Courses", icon: <BookOpen className="size-4" />, phase: 1, active: true },
        { id: "delivery-capability", label: "Centre Readiness", icon: <Truck className="size-4" />, phase: 6, active: true },
        { id: "labour-market", label: "Market Demand", icon: <TrendingUp className="size-4" />, phase: 4, active: true },
        { id: "gap-intelligence", label: "Training Gaps", icon: <GitCompareArrows className="size-4" />, phase: 5, active: true },
      ]},
    ];
  }

  // Candidate
  if (["CANDIDATE"].includes(role)) {
    return [
      { id: "candidate", label: "My Skill Intelligence", items: [
        { id: "candidate-intelligence", label: "Skill Passport", icon: <User className="size-4" />, phase: 7, active: true },
        { id: "skills", label: "Browse Skills", icon: <Sparkles className="size-4" />, phase: 1, active: true },
        { id: "labour-market", label: "Market Context", icon: <TrendingUp className="size-4" />, phase: 4, active: true },
      ]},
    ];
  }

  return GROUPS;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const activeView = useNav((s) => s.activeView);
  const setActiveView = useNav((s) => s.setActiveView);
  const userRole = useAuth((s) => s.user?.role);
  const groups = getGroupsForRole(userRole);

  return (
    <aside className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border shrink-0">
        <div className="flex size-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground font-semibold text-sm">
          KD
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight truncate">KAUSHAL DRISHTI</p>
          <p className="text-[10px] text-sidebar-foreground/60 truncate">
            Maharashtra Skill Intelligence
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scroll-thin px-3 py-4 space-y-5">
        {groups.map((group) => (
          <div key={group.id} className="space-y-1">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = activeView === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        setActiveView(item.id);
                        onNavigate?.();
                      }}
                      className={cn(
                        "group flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <span className={cn("shrink-0", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/55")}>
                        {item.icon}
                      </span>
                      <span className="flex-1 truncate text-left">{item.label}</span>
                      {!item.active ? (
                        <span className="text-[9px] font-mono uppercase tracking-wide text-sidebar-foreground/40">
                          P{item.phase}
                        </span>
                      ) : isActive ? (
                        <ChevronRight className="size-3.5 text-sidebar-foreground/60" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer — phase + provenance */}
      <div className="border-t border-sidebar-border px-4 py-3 space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50">
            Build Phase
          </span>
          <span className="text-[11px] font-mono text-sidebar-foreground/70">Phase 1</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-status-attention" />
          <span className="text-[10px] text-sidebar-foreground/55 leading-snug">
            Synthetic demonstration data only.
          </span>
        </div>
        <Link
          href="#"
          onClick={(e) => e.preventDefault()}
          className="block text-[10px] text-sidebar-foreground/40 hover:text-sidebar-foreground/70 transition-colors"
        >
          KAUSHAL DRISHTI · Maharashtra Skill Intelligence & Planning Platform
        </Link>
      </div>
    </aside>
  );
}
