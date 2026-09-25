/**
 * KAUSHAL DRISHTI — Phase 6 Part 2 Trainer + Equipment + Centre Capability Intelligence
 * ---------------------------------------------------------------------
 * Computes delivery capability signals by comparing course requirements
 * with trainer proficiency, equipment availability, and centre capacity.
 *
 * Outputs: TrainerCapabilityGap, TrainingCentreCapabilityProfile, DeliveryCapabilityGap
 * NO recommendations. Diagnostic intelligence only.
 */
import { db } from "@/lib/db";

const PROFICIENCY_RANK: Record<string, number> = { AWARENESS: 1, WORKING: 2, PROFICIENT: 3, EXPERT: 4 };

export async function computeCapability(period: string): Promise<{ gapsCreated: number }> {
  await db.trainerCapabilityGap.deleteMany({ where: { observationPeriod: period } });
  await db.deliveryCapabilityGap.deleteMany({ where: { observationPeriod: period } });
  await db.trainingCentreCapabilityProfile.deleteMany({ where: { observationPeriod: period } });

  const centres = await db.trainingCentre.findMany({
    include: {
      trainers: { include: { skillMappings: true, competencyMappings: true } },
      equipment: { include: { skillMappings: true, courseMappings: true } },
      courseOfferings: { include: { course: { include: { courseSkills: true } } } },
    },
  });

  let count = 0;

  for (const centre of centres) {
    let curriculumAligned = 0;
    let trainerAligned = 0;
    let equipmentAligned = 0;
    let totalCourses = 0;

    // For each course offering at this centre
    for (const off of centre.courseOfferings) {
      const course = off.course;
      totalCourses++;

      // Check curriculum alignment (has active curriculum version)
      const curriculumVersions = await db.curriculumVersion.findMany({ where: { courseId: course.id, status: "ACTIVE" } });
      const curriculumStatus = curriculumVersions.length > 0 ? "ALIGNED" : "INSUFFICIENT_DATA";
      if (curriculumStatus === "ALIGNED") curriculumAligned++;

      // Check trainer capability for each course skill
      let trainerStatus = "INSUFFICIENT_DATA";
      const trainerSkillStatuses: string[] = [];
      for (const cs of course.courseSkills) {
        // Find trainers at this centre with this skill
        const trainers = centre.trainers.filter((t) => t.skillMappings.some((tsm) => tsm.skillId === cs.skillId));
        if (trainers.length === 0) {
          trainerSkillStatuses.push("INSUFFICIENT_DATA");
          continue;
        }
        // Check if any trainer has proficiency >= course requirement
        const requiredProf = cs.expectedProficiency ?? "WORKING";
        const requiredRank = PROFICIENCY_RANK[requiredProf] ?? 0;
        const trainerRanks = trainers.flatMap((t) => t.skillMappings.filter((tsm) => tsm.skillId === cs.skillId).map((tsm) => PROFICIENCY_RANK[tsm.proficiencyLevel] ?? 0));
        const maxTrainerRank = Math.max(...trainerRanks, 0);
        if (maxTrainerRank >= requiredRank && requiredRank > 0) trainerSkillStatuses.push("ALIGNED");
        else if (maxTrainerRank > 0) trainerSkillStatuses.push("LOWER_THAN_REQUIRED");
        else trainerSkillStatuses.push("UNKNOWN");
      }
      const alignedCount = trainerSkillStatuses.filter((s) => s === "ALIGNED").length;
      const lowCount = trainerSkillStatuses.filter((s) => s === "LOWER_THAN_REQUIRED").length;
      if (trainerSkillStatuses.every((s) => s === "INSUFFICIENT_DATA")) trainerStatus = "INSUFFICIENT_DATA";
      else if (lowCount === 0 && alignedCount > 0) trainerStatus = "ALIGNED";
      else if (lowCount > 0 && alignedCount > 0) trainerStatus = "PARTIAL";
      else trainerStatus = "LIMITED";
      if (trainerStatus === "ALIGNED") trainerAligned++;

      // Check equipment capability for course skills
      let equipmentStatus = "INSUFFICIENT_DATA";
      const courseEquipment = centre.equipment.filter((e) => e.courseMappings.some((ecm) => ecm.courseId === course.id));
      if (courseEquipment.length > 0) {
        const operational = courseEquipment.filter((e) => e.conditionStatus === "OPERATIONAL").length;
        equipmentStatus = operational === courseEquipment.length ? "AVAILABLE" : operational > 0 ? "PARTIAL" : "LIMITED";
        if (equipmentStatus === "AVAILABLE") equipmentAligned++;
      }

      // Check capacity
      const capacityStatus = off.plannedSeats > 0 ? "ADEQUATE" : "INSUFFICIENT_DATA";

      // Overall readiness
      const statuses = [curriculumStatus, trainerStatus, equipmentStatus, capacityStatus];
      const allAligned = statuses.every((s) => s === "ALIGNED" || s === "AVAILABLE" || s === "ADEQUATE");
      const hasLimited = statuses.some((s) => s === "LIMITED" || s === "INSUFFICIENT_DATA");
      const overallStatus = allAligned ? "COURSE_DELIVERY_READY" : hasLimited ? "LIMITED_READINESS" : "PARTIALLY_READY";

      const confidence = Math.min(1, (trainerSkillStatuses.length / 5) * 0.4 + (courseEquipment.length / 3) * 0.3 + 0.3);

      await db.deliveryCapabilityGap.create({
        data: {
          trainingCentreId: centre.id, courseId: course.id,
          curriculumStatus, trainerStatus, equipmentStatus, capacityStatus,
          overallCapabilityStatus: overallStatus, confidence,
          observationPeriod: period, dataStatus: off.dataStatus,
        },
      });
      count++;
    }

    // Create centre capability profile
    const trainerCount = centre.trainers.filter((t) => t.status === "ACTIVE").length;
    const equipmentCount = centre.equipment.filter((e) => e.status === "ACTIVE").length;
    const readiness = totalCourses === 0 ? "INSUFFICIENT_DATA" :
      curriculumAligned === totalCourses && trainerAligned === totalCourses && equipmentAligned === totalCourses ? "READY" :
      (curriculumAligned + trainerAligned + equipmentAligned) / (totalCourses * 3) >= 0.6 ? "PARTIALLY_READY" : "LIMITED_READINESS";
    const confidence = Math.min(1, (trainerCount / 5) * 0.4 + (equipmentCount / 5) * 0.3 + (totalCourses / 5) * 0.3);

    await db.trainingCentreCapabilityProfile.create({
      data: {
        trainingCentreId: centre.id,
        trainerCapability: trainerCount > 0 ? (trainerAligned / Math.max(1, totalCourses) > 0.5 ? "ADEQUATE" : "LIMITED") : "UNKNOWN",
        equipmentCapability: equipmentCount > 0 ? (equipmentAligned / Math.max(1, totalCourses) > 0.5 ? "ADEQUATE" : "LIMITED") : "UNKNOWN",
        capacity: centre.courseOfferings.reduce((s, o) => s + o.plannedSeats, 0),
        centreReadinessSignal: readiness,
        confidence,
        observationPeriod: period,
        dataStatus: "SYNTHETIC",
      },
    });
  }

  return { gapsCreated: count };
}
