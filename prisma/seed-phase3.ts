/**
 * KAUSHAL DRISHTI — Phase 3 Synthetic Demonstration Seed
 * ---------------------------------------------------------------------
 * Populates the Knowledge + Competency foundation:
 *  - Skill aliases (alternate surface forms → canonical skill)
 *  - RoleSkill.proficiencyLevel (AWARENESS/WORKING/PROFICIENT/EXPERT)
 *  - Skill clusters (thematic groupings)
 *  - Skill relations (prerequisites + related_to edges)
 *
 * Idempotent: wipes Phase 3 tables only (preserves Phase 1+2 entities).
 *
 * Run: `bun run db:seed:phase3`
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Seeding Phase 3 knowledge + competency foundation…");

  // Wipe Phase 3 tables only
  await db.skillClusterMember.deleteMany();
  await db.skillCluster.deleteMany();
  await db.skillRelation.deleteMany();
  await db.skillAlias.deleteMany();

  // ===== Load existing skills by canonical name =====
  const skills = await db.skill.findMany();
  const byCanonical = new Map(skills.map((s) => [s.canonicalName, s]));
  const get = (canonical: string) => {
    const s = byCanonical.get(canonical);
    if (!s) throw new Error(`Skill '${canonical}' not found — run Phase 1 seed first`);
    return s;
  };

  const plc = get("plc-programming");
  const scada = get("scada");
  const robotics = get("industrial-robotics");
  const iiot = get("industrial-iot");
  const python = get("python");
  const sql = get("sql");
  const bms = get("battery-management-systems");
  const motorDrives = get("electric-motor-drives");
  const embedded = get("embedded-systems");
  const safety = get("workplace-safety");

  // ===== Skill Aliases =====
  const aliasDefs: Array<{ skill: typeof plc; alias: string; type: string; caseSensitive?: boolean }> = [
    { skill: plc, alias: "PLC", type: "ACRONYM", caseSensitive: false },
    { skill: plc, alias: "Programmable Logic Controller", type: "COMMON_NAME" },
    { skill: plc, alias: "P.L.C.", type: "VARIANT" },
    { skill: plc, alias: "Ladder Logic", type: "VARIANT" },
    { skill: scada, alias: "SCADA", type: "ACRONYM" },
    { skill: scada, alias: "Supervisory Control and Data Acquisition", type: "COMMON_NAME" },
    { skill: robotics, alias: "Robotics", type: "VARIANT" },
    { skill: robotics, alias: "Industrial Robots", type: "VARIANT" },
    { skill: iiot, alias: "IIoT", type: "ACRONYM" },
    { skill: iiot, alias: "Industrial Internet of Things", type: "COMMON_NAME" },
    { skill: python, alias: "Python 3", type: "VARIANT" },
    { skill: sql, alias: "SQL", type: "ACRONYM" },
    { skill: sql, alias: "Structured Query Language", type: "COMMON_NAME" },
    { skill: bms, alias: "BMS", type: "ACRONYM", caseSensitive: false },
    { skill: bms, alias: "Battery Management", type: "VARIANT" },
    { skill: motorDrives, alias: "Motor Drives", type: "VARIANT" },
    { skill: motorDrives, alias: "EV Drives", type: "VARIANT" },
    { skill: embedded, alias: "Embedded", type: "VARIANT" },
    { skill: embedded, alias: "Firmware", type: "VARIANT" },
    { skill: safety, alias: "Shop-floor Safety", type: "VARIANT" },
    { skill: safety, alias: "Industrial Safety", type: "VARIANT" },
  ];
  for (const a of aliasDefs) {
    await db.skillAlias.upsert({
      where: { alias_isCaseSensitive: { alias: a.alias, isCaseSensitive: a.caseSensitive ?? false } },
      update: { skillId: a.skill.id, aliasType: a.type },
      create: { skillId: a.skill.id, alias: a.alias, aliasType: a.type, isCaseSensitive: a.caseSensitive ?? false },
    });
  }
  console.log(`  ✓ ${aliasDefs.length} skill aliases`);

  // ===== RoleSkill proficiency levels =====
  // Map importance (1-5) → proficiency level deterministically for the seed.
  const importanceToProficiency = (imp: number): string => {
    if (imp >= 5) return "EXPERT";
    if (imp >= 4) return "PROFICIENT";
    if (imp >= 3) return "WORKING";
    return "AWARENESS";
  };
  const roleSkills = await db.roleSkill.findMany();
  for (const rs of roleSkills) {
    await db.roleSkill.update({
      where: { id: rs.id },
      data: { proficiencyLevel: importanceToProficiency(rs.importance) },
    });
  }
  console.log(`  ✓ ${roleSkills.length} role-skill proficiency levels set`);

  // ===== Skill Clusters =====
  const clusterDefs = [
    {
      name: "Industrial Automation",
      description: "Core skills for automated manufacturing and Industry 4.0.",
      category: "Technical",
      members: [
        { skill: plc, type: "PRIMARY" },
        { skill: scada, type: "PRIMARY" },
        { skill: robotics, type: "PRIMARY" },
        { skill: iiot, type: "SECONDARY" },
        { skill: safety, type: "SECONDARY" },
      ],
    },
    {
      name: "Electric Vehicle Technology",
      description: "EV powertrain, battery, and motor-drive competency cluster.",
      category: "Technical",
      members: [
        { skill: bms, type: "PRIMARY" },
        { skill: motorDrives, type: "PRIMARY" },
        { skill: embedded, type: "SECONDARY" },
        { skill: safety, type: "SECONDARY" },
      ],
    },
    {
      name: "Software & Data",
      description: "Programming and data skills for digital roles.",
      category: "Digital",
      members: [
        { skill: python, type: "PRIMARY" },
        { skill: sql, type: "PRIMARY" },
        { skill: embedded, type: "SECONDARY" },
      ],
    },
    {
      name: "Embedded & Firmware",
      description: "Microcontroller and firmware engineering cluster.",
      category: "Technical",
      members: [
        { skill: embedded, type: "PRIMARY" },
        { skill: python, type: "SECONDARY" },
      ],
    },
  ];
  for (const c of clusterDefs) {
    const cluster = await db.skillCluster.create({ data: { name: c.name, description: c.description, category: c.category } });
    for (const m of c.members) {
      await db.skillClusterMember.create({
        data: { clusterId: cluster.id, skillId: m.skill.id, membershipType: m.type },
      });
    }
  }
  console.log(`  ✓ ${clusterDefs.length} skill clusters`);

  // ===== Skill Relations (knowledge-graph edges) =====
  const relationDefs: Array<{ from: typeof plc; to: typeof plc; type: string; weight?: number }> = [
    // Prerequisites: PLC → SCADA → Robotics (build-up chain)
    { from: plc, to: scada, type: "PREREQUISITE", weight: 2 },
    { from: plc, to: robotics, type: "PREREQUISITE", weight: 2 },
    { from: scada, to: robotics, type: "RELATED_TO", weight: 1 },
    { from: iiot, to: scada, type: "RELATED_TO", weight: 1 },
    { from: iiot, to: plc, type: "RELATED_TO", weight: 1 },
    // Python is a broader skill that helps with IIoT
    { from: python, to: iiot, type: "RELATED_TO", weight: 1 },
    { from: python, to: embedded, type: "RELATED_TO", weight: 1 },
    { from: sql, to: python, type: "RELATED_TO", weight: 1 },
    // EV cluster
    { from: embedded, to: bms, type: "PREREQUISITE", weight: 2 },
    { from: embedded, to: motorDrives, type: "PREREQUISITE", weight: 2 },
    { from: bms, to: motorDrives, type: "RELATED_TO", weight: 1 },
    // Safety is broader — part of all shop-floor work
    { from: safety, to: plc, type: "RELATED_TO", weight: 1 },
    { from: safety, to: robotics, type: "RELATED_TO", weight: 1 },
    { from: safety, to: bms, type: "RELATED_TO", weight: 1 },
    // Hierarchy
    { from: iiot, to: embedded, type: "BROADER_THAN", weight: 1 },
  ];
  for (const r of relationDefs) {
    await db.skillRelation.upsert({
      where: {
        fromSkillId_toSkillId_relationType: {
          fromSkillId: r.from.id,
          toSkillId: r.to.id,
          relationType: r.type,
        },
      },
      update: { weight: r.weight ?? 1 },
      create: { fromSkillId: r.from.id, toSkillId: r.to.id, relationType: r.type, weight: r.weight ?? 1 },
    });
  }
  console.log(`  ✓ ${relationDefs.length} skill relations`);

  console.log("✓ Phase 3 seed complete.");
  console.log(`  Total: ${aliasDefs.length} aliases · ${roleSkills.length} role competencies · ${clusterDefs.length} clusters · ${relationDefs.length} relations`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
