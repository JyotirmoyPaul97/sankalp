/**
 * KAUSHAL DRISHTI — Phase 3 Skill Knowledge Graph
 * ---------------------------------------------------------------------
 * Deterministic 1-hop neighbourhood traversal around a skill.
 * NO embeddings, NO similarity scoring, NO semantic inference — just
 * the explicit edges stored in SkillRelation + cluster membership.
 *
 * Later phases may add embedding-based similarity on top of this graph;
 * Phase 3 only exposes what is explicitly declared.
 */
import { db } from "@/lib/db";

export interface SkillGraphNode {
  id: string;
  name: string;
  canonicalName: string;
  category: string | null;
}

export interface SkillGraphEdge {
  id: string;
  from: SkillGraphNode;
  to: SkillGraphNode;
  relationType: string;
  weight: number;
}

export interface SkillNeighbourhood {
  center: SkillGraphNode;
  clusters: { id: string; name: string; membershipType: string }[];
  outgoing: SkillGraphEdge[]; // edges FROM the center
  incoming: SkillGraphEdge[]; // edges TO the center
  aliases: { id: string; alias: string; aliasType: string }[];
}

export async function getSkillNeighbourhood(skillId: string): Promise<SkillNeighbourhood | null> {
  const skill = await db.skill.findUnique({ where: { id: skillId } });
  if (!skill) return null;

  const [outgoingRaw, incomingRaw, clusterMembers, aliases] = await Promise.all([
    db.skillRelation.findMany({
      where: { fromSkillId: skillId },
      include: { toSkill: true },
    }),
    db.skillRelation.findMany({
      where: { toSkillId: skillId },
      include: { fromSkill: true },
    }),
    db.skillClusterMember.findMany({
      where: { skillId },
      include: { cluster: true },
    }),
    db.skillAlias.findMany({ where: { skillId } }),
  ]);

  const toNode = (s: { id: string; name: string; canonicalName: string; category: string | null }): SkillGraphNode => ({
    id: s.id, name: s.name, canonicalName: s.canonicalName, category: s.category,
  });

  return {
    center: toNode(skill),
    clusters: clusterMembers.map((m) => ({
      id: m.cluster.id,
      name: m.cluster.name,
      membershipType: m.membershipType,
    })),
    outgoing: outgoingRaw.map((e) => ({
      id: e.id,
      from: toNode(skill),
      to: toNode(e.toSkill),
      relationType: e.relationType,
      weight: e.weight,
    })),
    incoming: incomingRaw.map((e) => ({
      id: e.id,
      from: toNode(e.fromSkill),
      to: toNode(skill),
      relationType: e.relationType,
      weight: e.weight,
    })),
    aliases: aliases.map((a) => ({ id: a.id, alias: a.alias, aliasType: a.aliasType })),
  };
}

/** List all clusters with their member counts. */
export async function listClusters() {
  const clusters = await db.skillCluster.findMany({
    include: {
      _count: { select: { members: true } },
      members: { include: { skill: true } },
    },
    orderBy: { name: "asc" },
  });
  return clusters.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    category: c.category,
    memberCount: c._count.members,
    skills: c.members.map((m) => ({
      skillId: m.skillId,
      skillName: m.skill.name,
      canonicalName: m.skill.canonicalName,
      category: m.skill.category,
      membershipType: m.membershipType,
    })),
  }));
}
