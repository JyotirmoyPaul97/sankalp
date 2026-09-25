import { ok, fail } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { computeTrainingSupplySignals } from "@/lib/intelligence/training";

/** POST /api/v1/training/refresh — admin-only. Recomputes supply signals for a period. */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return fail("UNAUTHORIZED", "Admin authentication required");

  const url = new URL(req.url);
  const period = url.searchParams.get("period");

  let periods: { label: string; start: Date; end: Date }[];
  if (period) {
    periods = [parsePeriod(period)];
  } else {
    // Recompute for the latest 12 months
    periods = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      periods.push({ label, start: new Date(d.getFullYear(), d.getMonth(), 1), end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59) });
    }
  }

  const results: Array<{ period: string; signals: number }> = [];
  for (const p of periods) {
    const r = await computeTrainingSupplySignals({ periodLabel: p.label, periodStart: p.start, periodEnd: p.end });
    results.push({ period: p.label, signals: r.signalsCreated });
  }

  return ok({ periodsProcessed: results, refreshedAt: new Date().toISOString() });
}

function parsePeriod(label: string): { label: string; start: Date; end: Date } {
  const [y, m] = label.split("-").map(Number);
  return { label, start: new Date(y, m - 1, 1), end: new Date(y, m, 0, 23, 59, 59) };
}
