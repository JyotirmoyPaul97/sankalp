import { ok } from "@/lib/api";
import { listClusters } from "@/lib/intelligence/skill-graph";

/** GET /api/v1/skill-clusters — list clusters with members. */
export async function GET() {
  const clusters = await listClusters();
  return ok({ clusters });
}
