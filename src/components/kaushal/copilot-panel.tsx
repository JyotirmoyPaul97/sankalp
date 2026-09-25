"use client";

import * as React from "react";
import { Search, Sparkles, ArrowRight, ExternalLink, ShieldCheck, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/store/app-store";
import { useNav } from "@/store/app-store";
import { api, getToken } from "@/lib/api-client";

interface CopilotResponse {
  question: string;
  intent: string;
  response: {
    answer: string;
    evidence: { source: string; detail: string; type: string }[];
    confidence: string;
    dataPeriod: string;
    dataStatus: string;
    sources: string[];
    exploreLinks: { label: string; view: string; id?: string }[];
    unsupported?: boolean;
    disclaimer?: string;
  };
}

const ROLE_QUESTIONS: Record<string, string[]> = {
  STATE_ADMIN: [
    "Which districts have high-confidence skill gaps?",
    "What skills are emerging statewide?",
    "Why does Pune show a training gap?",
    "What is the state of skill intelligence?",
  ],
  DISTRICT_PLANNER: [
    "What skills have high demand in Pune?",
    "What are the emerging skills?",
    "Why does Pune show a training gap?",
    "What is the training coverage for PLC Programming?",
  ],
  EMPLOYER: [
    "What skills does Automation Engineer require?",
    "What is the demand for PLC Programming?",
    "Which skills are emerging in manufacturing?",
    "What proficiency do employers report?",
  ],
  TRAINING_PROVIDER: [
    "Which courses are aligned to current demand?",
    "Why is my centre partially ready?",
    "What is the training coverage for PLC Programming?",
    "Which emerging skills are not in curriculum?",
  ],
  CANDIDATE: [
    "Why do I have a skill gap?",
    "What evidence supports my skill level?",
    "What does my target role require?",
    "What skills are emerging?",
  ],
};

const CONFIDENCE_TONE: Record<string, "positive" | "info" | "attention" | "neutral"> = {
  HIGH: "positive", MEDIUM: "info", LOW: "attention", INSUFFICIENT: "neutral",
};

export function CopilotPanel() {
  const user = useAuth((s) => s.user);
  const setActiveView = useNav((s) => s.setActiveView);
  const [open, setOpen] = React.useState(false);
  const [question, setQuestion] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [response, setResponse] = React.useState<CopilotResponse | null>(null);
  const [showEvidence, setShowEvidence] = React.useState(false);

  const suggestions = ROLE_QUESTIONS[user?.role ?? ""] ?? ROLE_QUESTIONS.STATE_ADMIN;

  const ask = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setQuestion(q);
    setOpen(true);
    try {
      const token = getToken();
      const res = await fetch("/api/v1/copilot/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ question: q }),
      });
      const json = await res.json();
      if (json.success) {
        setResponse(json.data as CopilotResponse);
        setShowEvidence(false);
      } else {
        setResponse(null);
      }
    } catch {
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2.5 shadow-lg hover:shadow-xl transition-all text-sm font-medium"
      >
        <Sparkles className="size-4" />
        {open ? "Close" : "Ask Kaushal Drishti"}
      </button>

      {/* Panel */}
      {open ? (
        <div className="fixed bottom-16 right-4 z-40 w-[400px] max-w-[calc(100vw-2rem)] max-h-[70vh] flex flex-col rounded-lg border bg-card shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="size-3.5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Skill Intelligence Assistant</p>
              <p className="text-[10px] text-muted-foreground">Evidence-grounded · No hallucination</p>
            </div>
          </div>

          {/* Input */}
          <div className="p-3 border-b">
            <form onSubmit={(e) => { e.preventDefault(); ask(question); }} className="flex gap-2">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about skills, demand, gaps, districts..."
                className="text-sm"
                disabled={loading}
              />
              <Button type="submit" size="icon" disabled={loading || !question.trim()}>
                <Search className="size-4" />
              </Button>
            </form>
          </div>

          {/* Suggestions */}
          {!response && !loading ? (
            <div className="p-3 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Suggested Questions</p>
              {suggestions.map((s) => (
                <button key={s} onClick={() => ask(s)} className="block w-full text-left text-xs rounded-md border px-3 py-2 hover:bg-accent transition-colors">
                  {s}
                </button>
              ))}
            </div>
          ) : null}

          {/* Response */}
          {loading ? (
            <div className="p-4 space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
            </div>
          ) : response ? (
            <div className="flex-1 overflow-y-auto scroll-thin p-3 space-y-3">
              {/* Answer */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={cn(
                    "text-[10px] border-transparent",
                    response.response.confidence === "HIGH" ? "surface-positive" :
                    response.response.confidence === "MEDIUM" ? "surface-info" :
                    response.response.confidence === "LOW" ? "surface-attention" : "surface-neutral"
                  )}>
                    {response.response.confidence} confidence
                  </Badge>
                  <Badge className="surface-attention text-[10px] border-transparent">{response.response.dataStatus}</Badge>
                  <span className="text-[10px] text-muted-foreground">{response.response.dataPeriod}</span>
                </div>
                <p className="text-sm leading-relaxed">{response.response.answer}</p>
                {response.response.unsupported ? (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <AlertCircle className="size-3" /> Try a more specific question.
                  </div>
                ) : null}
                {response.response.disclaimer ? (
                  <p className="text-[10px] text-muted-foreground italic border-l-2 pl-2">{response.response.disclaimer}</p>
                ) : null}
              </div>

              {/* Evidence */}
              {response.response.evidence.length > 0 ? (
                <div className="space-y-1">
                  <button onClick={() => setShowEvidence(!showEvidence)} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
                    {showEvidence ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                    Evidence ({response.response.evidence.length})
                  </button>
                  {showEvidence ? (
                    <ul className="space-y-1 pl-2 border-l-2">
                      {response.response.evidence.map((e, i) => (
                        <li key={i} className="text-[11px] pl-2">
                          <span className="font-medium">{e.source}</span>
                          <p className="text-muted-foreground">{e.detail}</p>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}

              {/* Explore links */}
              {response.response.exploreLinks.length > 0 ? (
                <div className="space-y-1 pt-2 border-t">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Explore Further</p>
                  {response.response.exploreLinks.map((link) => (
                    <button key={link.view} onClick={() => { setActiveView(link.view); setOpen(false); }} className="flex items-center gap-1 text-xs text-primary hover:underline">
                      <ExternalLink className="size-3" /> {link.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
