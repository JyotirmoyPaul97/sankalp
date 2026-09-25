"use client";

import * as React from "react";

/**
 * MaharashtraIntelligenceBackground — a deterministic, code-generated
 * abstract visual of Maharashtra's district network + industrial clusters
 * + data flows. No external images, no people, no text. Government-grade,
 * premium, minimal. Uses deep navy + subtle saffron/teal accent dots.
 *
 * Used as the hero/workspace background. Subtle enough that overlaid text
 * remains readable.
 */
export function MaharashtraIntelligenceBackground({ variant = "hero", className }: { variant?: "hero" | "government" | "industry" | "training" | "candidate"; className?: string }) {
  // Deterministic pseudo-random nodes so the visual is stable across renders.
  const seed = variant === "hero" ? 42 : variant === "government" ? 17 : variant === "industry" ? 91 : variant === "training" ? 33 : 7;
  const rng = mulberry32(seed);
  const nodeCount = variant === "hero" ? 42 : 28;
  const nodes = React.useMemo(() => Array.from({ length: nodeCount }, () => ({ x: rng() * 100, y: rng() * 100, r: 0.6 + rng() * 1.8, accent: rng() > 0.78 })), [rng, nodeCount]);

  // Edges: connect nearby nodes (data flows).
  const edges = React.useMemo(() => {
    const e: { x1: number; y1: number; x2: number; y2: number; o: number }[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 18) e.push({ x1: nodes[i].x, y1: nodes[i].y, x2: nodes[j].x, y2: nodes[j].y, o: 0.06 + (1 - d / 18) * 0.12 });
      }
    }
    return e;
  }, [nodes]);

  const accent = variant === "industry" ? "#f59e0b" : variant === "training" ? "#14b8a6" : variant === "candidate" ? "#f59e0b" : "#14b8a6";

  return (
    <div className={className} aria-hidden>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id={`bg-${variant}`} cx="50%" cy="40%" r="80%">
            <stop offset="0%" stopColor="#0f1e3d" />
            <stop offset="55%" stopColor="#0a1530" />
            <stop offset="100%" stopColor="#070d20" />
          </radialGradient>
          <linearGradient id={`flow-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.5" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill={`url(#bg-${variant})`} />
        {/* faint Maharashtra-like silhouette suggestion (abstract) */}
        <path d="M 18 30 Q 25 22 38 24 Q 52 20 66 26 Q 80 30 84 42 Q 88 56 82 68 Q 74 80 60 82 Q 44 84 30 78 Q 18 70 14 56 Q 12 42 18 30 Z" fill="#0d1a35" opacity="0.55" />
        {/* edges (data flows) */}
        {edges.map((e, i) => (
          <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke={`url(#flow-${variant})`} strokeWidth="0.08" opacity={e.o} />
        ))}
        {/* nodes (districts + clusters) */}
        {nodes.map((n, i) => (
          <circle key={i} cx={n.x} cy={n.y} r={n.r * 0.5} fill={n.accent ? accent : "#60a5fa"} opacity={n.accent ? 0.85 : 0.55}>
            <animate attributeName="opacity" values="0.3;0.85;0.3" dur={`${3 + (i % 4)}s`} repeatCount="indefinite" begin={`${i * 0.1}s`} />
          </circle>
        ))}
        {/* a few brighter hub nodes */}
        {nodes.filter((_, i) => i % 7 === 0).map((n, i) => (
          <circle key={`hub-${i}`} cx={n.x} cy={n.y} r="1.4" fill={accent} opacity="0.9">
            <animate attributeName="r" values="1.2;1.8;1.2" dur="4s" repeatCount="indefinite" begin={`${i * 0.5}s`} />
          </circle>
        ))}
      </svg>
      {/* subtle vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
    </div>
  );
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
