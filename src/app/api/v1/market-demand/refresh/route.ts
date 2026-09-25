import { ok, fail } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { computeMarketSignals, computeDemandSnapshots, computeEmergingSkills, computeSkillSectorPresence } from "@/lib/intelligence/market";

/**
 * POST /api/v1/market-demand/refresh
 * Admin-only. Recomputes MarketSignals, DemandSnapshots, EmergingSkills,
 * and SkillSectorPresence for a given period (or all periods).
 */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return fail("UNAUTHORIZED", "Admin authentication required");

  const url = new URL(req.url);
  const period = url.searchParams.get("period");

  // If no period given, recompute for the latest 12 months
  let periods: { label: string; start: Date; end: Date }[];
  if (period) {
    periods = [parsePeriod(period)];
  } else {
    periods = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      periods.push({ label, start, end });
    }
  }

  const results: Array<{ period: string; signals: number; snapshots: number }> = [];
  for (let i = 0; i < periods.length; i++) {
    const p = periods[i];
    const prev = i > 0 ? periods[i - 1] : undefined;
    const sig = await computeMarketSignals({
      periodLabel: p.label,
      periodStart: p.start,
      periodEnd: p.end,
      previousPeriodLabel: prev?.label,
      previousPeriodStart: prev?.start,
      previousPeriodEnd: prev?.end,
    });
    const snap = await computeDemandSnapshots(p.label);
    results.push({ period: p.label, signals: sig.signalsCreated, snapshots: snap.snapshots });
  }

  // Emerging skills + skill-sector presence
  const emerging = await computeEmergingSkills();
  const presence = await computeSkillSectorPresence();

  return ok({
    periodsProcessed: results,
    emergingSkillsUpdated: emerging.updated,
    skillSectorPresenceUpdated: presence.updated,
    refreshedAt: new Date().toISOString(),
  });
}

function parsePeriod(label: string): { label: string; start: Date; end: Date } {
  // Expecting "YYYY-MM"
  const [y, m] = label.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0, 23, 59, 59);
  return { label, start, end };
}
