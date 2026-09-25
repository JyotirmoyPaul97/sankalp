import { z } from "zod";
import { ok, fail } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { detectIntent, executeQuery, logCopilotQuery } from "@/lib/intelligence/copilot";

const QuerySchema = z.object({
  question: z.string().min(1).max(500),
  context: z.object({
    districtId: z.string().optional(),
    skillId: z.string().optional(),
    roleId: z.string().optional(),
    candidateId: z.string().optional(),
  }).optional(),
});

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return fail("UNAUTHORIZED", "Authentication required");

  let body: unknown;
  try { body = await req.json(); } catch { return fail("BAD_REQUEST", "Invalid JSON"); }
  const parsed = QuerySchema.safeParse(body);
  if (!parsed.success) return fail("VALIDATION_ERROR", "Validation failed", parsed.error.flatten());

  const question = parsed.data.question;
  const detected = detectIntent(question);
  const response = await executeQuery(detected, user.role, user.email);

  await logCopilotQuery({
    userId: user.sub,
    userEmail: user.email,
    question,
    intent: detected.intent,
    responseStatus: response.unsupported ? "UNSUPPORTED" : "SUCCESS",
    sources: response.sources,
    confidence: response.confidence,
  });

  return ok({ question, intent: detected.intent, response });
}
