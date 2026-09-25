"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useNav, useAuth } from "@/store/app-store";
import {
  LayoutDashboard, BookCheck, FileText, Target, GitCompareArrows,
  Route, TrendingUp, Award, Briefcase, BarChart3, User, ChevronRight, Activity,
} from "lucide-react";

interface NavItem { id: string; label: string; icon: React.ReactNode; }
const NAV: NavItem[] = [
  { id: "c-overview", label: "Overview", icon: <LayoutDashboard className="size-4" /> },
  { id: "c-passport", label: "Skill Passport", icon: <BookCheck className="size-4" /> },
  { id: "c-evidence", label: "Evidence", icon: <FileText className="size-4" /> },
  { id: "c-target-roles", label: "Target Roles", icon: <Target className="size-4" /> },
  { id: "c-role-comparison", label: "Role Readiness", icon: <GitCompareArrows className="size-4" /> },
  { id: "c-gaps", label: "Skill Gaps", icon: <GitCompareArrows className="size-4" /> },
  { id: "c-development-path", label: "Development Path", icon: <Route className="size-4" /> },
  { id: "c-evolution", label: "Skill Evolution", icon: <TrendingUp className="size-4" /> },
  { id: "c-readiness", label: "Readiness", icon: <Award className="size-4" /> },
  { id: "c-opportunities", label: "Opportunities", icon: <Briefcase className="size-4" /> },
  { id: "c-market-context", label: "Market Context", icon: <BarChart3 className="size-4" /> },
  { id: "c-profile", label: "Profile", icon: <User className="size-4" /> },
];

const GROUPS: { id: string; label: string; items: NavItem[] }[] = [
  { id: "capability", label: "Capability", items: NAV.slice(0, 3) },
  { id: "roles", label: "Target Role", items: NAV.slice(3, 6) },
  { id: "development", label: "Development", items: NAV.slice(6, 9) },
  { id: "opportunity", label: "Opportunity", items: NAV.slice(9, 11) },
  { id: "account", label: "Account", items: NAV.slice(11) },
];

interface SidebarProps { onNavigate?: () => void; }

export function CandidateSidebar({ onNavigate }: SidebarProps) {
  const activeView = useNav((s) => s.activeView);
  const setActiveView = useNav((s) => s.setActiveView);
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  return (
    <aside className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border shrink-0">
        <div className="flex size-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground font-semibold text-sm">KD</div>
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight truncate">Candidate Workspace</p>
          <p className="text-[10px] text-sidebar-foreground/60 truncate">KAUSHAL DRISHTI · Beneficiary</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scroll-thin px-3 py-4 space-y-5">
        {GROUPS.map((group) => (
          <div key={group.id} className="space-y-1">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">{group.label}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = activeView === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => { setActiveView(item.id); onNavigate?.(); }}
                      className={cn(
                        "group flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <span className={cn("shrink-0", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/55")}>{item.icon}</span>
                      <span className="flex-1 truncate text-left">{item.label}</span>
                      {isActive ? <ChevronRight className="size-3.5 text-sidebar-foreground/60" /> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-3 space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50">Environment</span>
          <span className="text-[11px] font-mono text-sidebar-foreground/70">Prototype</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-status-attention" />
          <span className="text-[10px] text-sidebar-foreground/55 leading-snug">Synthetic demonstration data only.</span>
        </div>
        {user ? (
          <div className="flex items-center justify-between pt-1 border-t border-sidebar-border/60">
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{user.name}</p>
              <p className="text-[10px] text-sidebar-foreground/55 truncate">{user.email}</p>
            </div>
            <button onClick={() => logout()} className="text-[10px] text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors">Sign out</button>
          </div>
        ) : null}
        <p className="text-[10px] text-sidebar-foreground/40 flex items-center gap-1"><Activity className="size-3" /> Evidence, not claims.</p>
      </div>
    </aside>
  );
}
