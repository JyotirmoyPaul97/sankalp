/**
 * KAUSHAL DRISHTI — Phase 3 Skill Normalizer
 * ---------------------------------------------------------------------
 * Resolves a raw skill string (e.g. " PLC ", "plc", "Programmable Logic
 * Controller", "P.L.C.") to a canonical Skill entity.
 *
 * Resolution strategy (deterministic, NO embeddings / NO ML):
 *   1. Normalise the input (trim, collapse whitespace, strip dots in
 *      acronyms like "P.L.C." → "PLC").
 *   2. Exact match on Skill.canonicalName (case-insensitive).
 *   3. Exact match on Skill.name (case-insensitive).
 *   4. Alias match (SkillAlias table) — case-insensitive by default,
 *      case-sensitive only if the alias row has isCaseSensitive=true.
 *   5. Token-substring fallback for "X Programming" / "X Skill" suffixes.
 *
 * If nothing matches, returns { resolved: false } so the caller can
 * prompt the user to map it (Phase 3 is a foundation, not a black box).
 */
import { db } from "@/lib/db";

export interface NormalizeResult {
  resolved: boolean;
  skillId?: string;
  canonicalName?: string;
  matchedVia: "canonical" | "name" | "alias" | "token" | "none";
  aliasType?: string;
  confidence: number; // 0-1
  rawInput: string;
  normalisedInput: string;
}

/** Normalise a raw skill string for matching. */
export function normaliseSkillInput(raw: unknown): string {
  let s = typeof raw === "string" ? raw : String(raw ?? "");
  s = s.trim().replace(/\s+/g, " ");
  // Strip dots from spaced-initialism patterns: "P.L.C." → "PLC"
  s = s.replace(/\b([A-Za-z])\.(?=[A-Za-z]\.|(?:\s|$))/g, "$1");
  return s;
}

/** Resolve a raw skill string to a canonical skill. */
export async function resolveCanonicalSkill(raw: unknown): Promise<NormalizeResult> {
  const rawInput = typeof raw === "string" ? raw : String(raw ?? "");
  const normalised = normaliseSkillInput(rawInput);
  if (!normalised) {
    return { resolved: false, matchedVia: "none", confidence: 0, rawInput, normalisedInput: normalised };
  }
  const lower = normalised.toLowerCase();

  // 1. canonicalName (case-insensitive)
  const byCanonical = await db.skill.findFirst({
    where: { canonicalName: { equals: normalised } },
  });
  if (byCanonical) {
    // SQLite equals is case-sensitive by default for non-ASCII; do a JS-side check too
    if (byCanonical.canonicalName.toLowerCase() === lower) {
      return { resolved: true, skillId: byCanonical.id, canonicalName: byCanonical.canonicalName, matchedVia: "canonical", confidence: 1.0, rawInput, normalisedInput: normalised };
    }
  }
  // broader case-insensitive canonical match
  const byCanonicalCI = await db.skill.findFirst({
    where: { canonicalName: { contains: normalised } },
  });
  if (byCanonicalCI && byCanonicalCI.canonicalName.toLowerCase() === lower) {
    return { resolved: true, skillId: byCanonicalCI.id, canonicalName: byCanonicalCI.canonicalName, matchedVia: "canonical", confidence: 1.0, rawInput, normalisedInput: normalised };
  }

  // 2. Skill.name
  const byName = await db.skill.findFirst({
    where: { name: { equals: normalised } },
  });
  if (byName && byName.name.toLowerCase() === lower) {
    return { resolved: true, skillId: byName.id, canonicalName: byName.canonicalName, matchedVia: "name", confidence: 0.95, rawInput, normalisedInput: normalised };
  }

  // 3. Alias match — fetch all aliases (small set in Phase 3) and compare in JS
  //    so we can do case-insensitive matching (SQLite default collation is case-sensitive).
  const aliases = await db.skillAlias.findMany({ include: { skill: true } });
  for (const a of aliases) {
    const aliasText = a.isCaseSensitive ? a.alias : a.alias.toLowerCase();
    const candidate = a.isCaseSensitive ? normalised : lower;
    if (aliasText === candidate) {
      return { resolved: true, skillId: a.skillId, canonicalName: a.skill.canonicalName, matchedVia: "alias", aliasType: a.aliasType, confidence: 0.9, rawInput, normalisedInput: normalised };
    }
  }

  // 4. Token fallback — strip common suffixes ("Programming", "Skill", "Engineering")
  //    and try again on canonical + aliases. This catches "PLC Programming" vs alias "PLC".
  const suffixStripped = lower.replace(/\s+(programming|skill|skills|engineering|technology|systems?|fundamentals?)$/i, "").trim();
  if (suffixStripped && suffixStripped !== lower) {
    for (const a of aliases) {
      if (!a.isCaseSensitive && a.alias.toLowerCase() === suffixStripped) {
        return { resolved: true, skillId: a.skillId, canonicalName: a.skill.canonicalName, matchedVia: "token", aliasType: a.aliasType, confidence: 0.75, rawInput, normalisedInput: normalised };
      }
    }
    const byStripped = await db.skill.findFirst({
      where: { canonicalName: { contains: suffixStripped } },
    });
    if (byStripped && byStripped.canonicalName.toLowerCase().includes(suffixStripped)) {
      return { resolved: true, skillId: byStripped.id, canonicalName: byStripped.canonicalName, matchedVia: "token", confidence: 0.7, rawInput, normalisedInput: normalised };
    }
  }

  return { resolved: false, matchedVia: "none", confidence: 0, rawInput, normalisedInput: normalised };
}

/** Batch-resolve multiple raw skill strings. */
export async function resolveCanonicalSkills(raws: string[]): Promise<NormalizeResult[]> {
  return Promise.all(raws.map((r) => resolveCanonicalSkill(r)));
}
