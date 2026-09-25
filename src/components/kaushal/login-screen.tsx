"use client";

import * as React from "react";
import { useState } from "react";
import { Activity, ArrowRight, Building2, ShieldCheck, Users } from "lucide-react";
import { useAuth } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DemoAccount {
  email: string;
  password: string;
  name: string;
  role: string;
  description: string;
  icon: React.ReactNode;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: "admin@kaushal-drishti.demo",
    password: "demo-admin",
    name: "Demo State Admin",
    role: "STATE_ADMIN",
    description: "Full platform visibility across districts and sectors.",
    icon: <ShieldCheck className="size-4" />,
  },
  {
    email: "planner@kaushal-drishti.demo",
    password: "demo-planner",
    name: "Demo District Planner",
    role: "DISTRICT_PLANNER",
    description: "District-scoped planning and gap review.",
    icon: <Building2 className="size-4" />,
  },
  {
    email: "employer@kaushal-drishti.demo",
    password: "demo-employer",
    name: "Demo Employer",
    role: "EMPLOYER",
    description: "Demand validation and role-skill feedback.",
    icon: <Users className="size-4" />,
  },
  {
    email: "provider@kaushal-drishti.demo",
    password: "demo-provider",
    name: "Demo Training Provider",
    role: "TRAINING_PROVIDER",
    description: "Course and capacity management.",
    icon: <Activity className="size-4" />,
  },
];

export function LoginScreen() {
  const login = useAuth((s) => s.login);
  const status = useAuth((s) => s.status);
  const error = useAuth((s) => s.error);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const fillDemo = (acc: DemoAccount) => {
    setEmail(acc.email);
    setPassword(acc.password);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background">
      {/* Left — brand / identity panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-10 text-sidebar-foreground bg-sidebar overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 0, transparent 40%), radial-gradient(circle at 80% 70%, white 0, transparent 35%)",
          }}
        />
        <div className="relative flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground font-semibold text-lg shadow-sm">
            KD
          </div>
          <div>
            <p className="text-base font-semibold tracking-tight">KAUSHAL DRISHTI</p>
            <p className="text-[11px] text-sidebar-foreground/70">
              Maharashtra Skill Intelligence Platform
            </p>
          </div>
        </div>

        <div className="relative space-y-6 max-w-md">
          <h1 className="text-3xl font-semibold tracking-tight leading-tight">
            From Labour-Market Evidence to Better Skill Decisions.
          </h1>
          <p className="text-sm text-sidebar-foreground/80 leading-relaxed">
            A decision-support layer connecting industry demand signals with
            Maharashtra's skill-development ecosystem — districts, sectors,
            courses, trainers, and employers.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-sidebar-accent text-sidebar-accent-foreground border-transparent">
              Phase 1 — Foundation
            </Badge>
            <Badge className="bg-sidebar-accent text-sidebar-accent-foreground border-transparent">
              Synthetic Demonstration Data
            </Badge>
          </div>
        </div>

        <div className="relative space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/60">
            Intelligence Architecture
          </p>
          <ol className="space-y-1.5 text-sm text-sidebar-foreground/80">
            {[
              "Labour-market signals",
              "Skill & role intelligence",
              "Demand vs. training supply",
              "Gap analysis & course review",
              "Policy simulation & district plans",
              "Outcomes & feedback",
            ].map((s, i) => (
              <li key={s} className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-sidebar-foreground/50">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Right — login form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold">
              KD
            </div>
            <div>
              <p className="text-base font-semibold tracking-tight">KAUSHAL DRISHTI</p>
              <p className="text-[11px] text-muted-foreground">
                Maharashtra Skill Intelligence Platform
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
            <p className="text-sm text-muted-foreground">
              Access the Phase 1 demonstration environment.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="you@kaushal-drishti.demo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error ? (
              <div className="rounded-md border border-status-critical/30 bg-status-critical/5 px-3 py-2 text-xs text-status-critical">
                {error}
              </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={status === "loading"}>
              {status === "loading" ? "Signing in…" : "Sign in"}
              <ArrowRight className="size-4" />
            </Button>
          </form>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Use Demo Environment
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemo(acc)}
                  className="text-left rounded-md border bg-card p-3 hover:border-primary/40 hover:bg-accent/40 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-muted-foreground">{acc.icon}</span>
                    <span className="text-sm font-medium truncate">{acc.name}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">{acc.description}</p>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              Demo Accounts — synthetic identities, not actual government users.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
