"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useAuth, useNav } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, Bell, LogOut, User as UserIcon, Settings, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

const ROLE_LABELS: Record<string, string> = {
  STATE_ADMIN: "State Administrator",
  DISTRICT_PLANNER: "District Planner",
  TRAINING_PROVIDER: "Training Provider",
  EMPLOYER: "Employer",
  INSTITUTION: "Institution",
  TRAINER: "Trainer",
  CANDIDATE: "Candidate",
  AUDITOR: "Auditor",
};

const VIEW_TITLES: Record<string, string> = {
  overview: "Overview",
  "district-intelligence": "District Intelligence",
  districts: "District Intelligence",
  "district-profile": "District Profile",
  "labour-market": "Labour Market Intelligence",
  "emerging-radar": "Emerging Skill Radar",
  "market-trends": "Market Trends",
  "evidence-convergence": "Evidence Convergence",
  skills: "Skills",
  "skill-intelligence": "Skill Intelligence",
  "competency-framework": "Competency Framework",
  "gap-intelligence": "Gap Intelligence",
  "gap-districts": "District Gaps",
  "gap-clusters": "Cluster Gaps",
  "gap-matrix": "Market–Training Matrix",
  "delivery-capability": "Training Delivery Capability",
  "candidate-intelligence": "Candidate Skill Intelligence",
  "district-twin": "District Digital Twin",
  "skill-graph": "Skill Intelligence Graph",
  "data-governance": "Data Governance Centre",
  "system-health": "System Health",
  outcomes: "District Skill Outcomes",
  training: "Training Ecosystem",
  courses: "Courses",
  "employer-validation": "Employer Validation",
  "policy-sandbox": "Policy Sandbox",
  "district-plans": "District Plans",
  outcomes: "Outcomes",
  "data-sources": "Data Sources",
  admin: "Administration",
  upload: "Upload Dataset",
  "import-batches": "Import Batches",
  "data-quality": "Data Quality",
  "records-explorer": "Records Explorer",
  provenance: "Provenance",
  "audit-logs": "Audit Logs",
};

interface TopbarProps {
  onOpenSidebar: () => void;
}

export function Topbar({ onOpenSidebar }: TopbarProps) {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const activeView = useNav((s) => s.activeView);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const initials = (user?.name || "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70 px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden -ml-2"
        onClick={onOpenSidebar}
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </Button>

      <div className="min-w-0 flex-1 flex items-center gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {user?.role === "STATE_ADMIN" || user?.role === "AUDITOR" ? "Government Workspace" :
             user?.role === "DISTRICT_PLANNER" ? "Pune District Workspace" :
             user?.role === "EMPLOYER" ? "Industry & Employer Workspace" :
             user?.role === "TRAINING_PROVIDER" || user?.role === "INSTITUTION" || user?.role === "TRAINER" ? "Training Ecosystem Workspace" :
             user?.role === "CANDIDATE" ? "Candidate Workspace" : "KAUSHAL DRISHTI"}
          </p>
          <h1 className="text-sm font-semibold tracking-tight truncate">
            {VIEW_TITLES[activeView] ?? "Overview"}
          </h1>
        </div>
      </div>

      {/* Environment badge */}
      <Badge
        variant="outline"
        className="hidden sm:inline-flex items-center gap-1.5 surface-attention border-transparent font-medium"
      >
        <span className="size-1.5 rounded-full bg-status-attention" />
        DEMO / SYNTHETIC DATA
      </Badge>

      {/* Theme toggle */}
      <Button
        variant="ghost"
        size="icon"
        aria-label="Toggle theme"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        {mounted && theme === "dark" ? (
          <Sun className="size-4" />
        ) : (
          <Moon className="size-4" />
        )}
      </Button>

      {/* Notifications placeholder */}
      <Button variant="ghost" size="icon" aria-label="Notifications" disabled>
        <Bell className="size-4" />
      </Button>

      {/* Profile */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-accent transition-colors">
            <Avatar className="size-8 border">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left leading-tight">
              <p className="text-xs font-medium truncate max-w-[140px]">{user?.name ?? "User"}</p>
              <p className="text-[10px] text-muted-foreground">
                {user ? ROLE_LABELS[user.role] ?? user.role : ""}
              </p>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel className="flex flex-col gap-1">
            <span className="text-sm font-medium">{user?.name}</span>
            <span className="text-[11px] font-normal text-muted-foreground">{user?.email}</span>
            <Badge
              variant="outline"
              className="surface-info border-transparent w-fit mt-1 text-[10px]"
            >
              {user ? ROLE_LABELS[user.role] ?? user.role : ""}
            </Badge>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <UserIcon className="size-4 mr-2" /> Profile
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <Settings className="size-4 mr-2" /> Preferences
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="text-status-critical focus:text-status-critical">
            <LogOut className="size-4 mr-2" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
