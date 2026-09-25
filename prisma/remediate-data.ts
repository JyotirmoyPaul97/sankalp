/**
 * KAUSHAL DRISHTI — Phase 10.5 Data Remediation
 * Replaces placeholder entity names with realistic synthetic names.
 * ALL DATA IS SYNTHETIC DEMONSTRATION DATA.
 */
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const COURSE_NAMES = [
  "Advanced Industrial Automation — PLC & SCADA",
  "Industrial Robotics Technician Programme",
  "EV Service & Diagnostics Technician",
  "Embedded Systems Engineering Fundamentals",
  "Battery Systems Technician Programme",
  "CNC Automation Specialist",
  "Industrial IoT Technician Programme",
  "Advanced CNC Programming & Operations",
  "Automotive Mechatronics Technician",
  "Predictive Maintenance Specialist",
  "PLC Programming — Advanced Applications",
  "SCADA Systems — Configuration & Operations",
  "Industrial Networking & OT Security",
  "Motor Drive Systems — Operation & Maintenance",
  "Digital Manufacturing Fundamentals",
  "Industrial Safety & Compliance Practices",
  "Software Development — Full Stack Foundations",
  "Data Analytics for Manufacturing",
  "Python for Industrial Automation",
  "SQL for Data-Driven Operations",
  "Industrial Robot Programming — KUKA & ABB",
  "EV Battery Management Systems — Advanced",
  "Programmable Logic Controllers — Certification",
  "Industrial Automation — Level 2",
  "Smart Factory Operations",
  "Predictive Analytics — Condition Monitoring",
  "Manufacturing Execution Systems (MES)",
  "Industrial Cybersecurity Fundamentals",
  "Supply Chain Digital Transformation",
  "Quality Control Automation — Vision Systems",
];

const EMPLOYER_NAMES = [
  "Maharashtra Precision Systems",
  "Pune Automation Works",
  "Vidarbha EV Technologies",
  "Deccan Industrial Controls",
  "Konkan Manufacturing Group",
  "Advanced Robotics India",
  "Marathwada Auto Components",
  "Western Ghats Industries",
  "Pune Tech Solutions",
  "Nashik Mechatronics Ltd",
  "Nagpur Industrial Systems",
  "Mumbai Metro Engineering",
  "Aurangabad Precision Tools",
  "Sahyadri Electronics",
  "Godavari Battery Systems",
  "Tapi Valley Manufacturing",
  "Kaveri Automation Pvt Ltd",
  "Krishna Industrial Tech",
  "Bhima Engineering Works",
  "Wardha Auto Tech",
];

const CENTRE_NAMES = [
  "Pune Advanced Manufacturing Centre",
  "Nagpur Industrial Skills Centre",
  "Nashik Mechatronics Training Hub",
  "Mumbai Polytechnic Skill Lab",
  "Aurangabad Industrial Training Centre",
  "Solapur Technical Skills Institute",
  "Kolhapur Automation Training Centre",
  "Amravati EV Skills Hub",
  "Thane Industrial Training Facility",
  "Ratnagiri Coastal Skills Centre",
];

async function main() {
  console.log("Remediating placeholder entity names…");

  // Replace course names
  const courses = await db.course.findMany({ where: { name: { startsWith: "Demo " } } });
  let courseCount = 0;
  for (const course of courses) {
    const newName = COURSE_NAMES[courseCount % COURSE_NAMES.length];
    await db.course.update({ where: { id: course.id }, data: { name: newName, code: `CRS-${String(courseCount + 1).padStart(4, "0")}` } });
    courseCount++;
  }
  console.log(`  ✓ Updated ${courseCount} course names`);

  // Replace employer names
  const employers = await db.employer.findMany({ where: { name: { startsWith: "Demo " } } });
  let empCount = 0;
  for (const emp of employers) {
    const newName = EMPLOYER_NAMES[empCount % EMPLOYER_NAMES.length];
    await db.employer.update({ where: { id: emp.id }, data: { name: newName, website: `https://example.org/${newName.toLowerCase().replace(/\s+/g, "-")}` } });
    empCount++;
  }
  console.log(`  ✓ Updated ${empCount} employer names`);

  // Replace training centre names
  const centres = await db.trainingCentre.findMany();
  let centreCount = 0;
  for (const centre of centres) {
    const newName = CENTRE_NAMES[centreCount % CENTRE_NAMES.length];
    const suffix = centre.name.includes("—") ? centre.name.split("—")[1]?.trim() : `Centre ${String(centreCount + 1).padStart(2, "0")}`;
    await db.trainingCentre.update({ where: { id: centre.id }, data: { name: `${newName} — ${suffix ?? `Unit ${centreCount + 1}`}` } });
    centreCount++;
  }
  console.log(`  ✓ Updated ${centreCount} training centre names`);

  // Replace institution names (Demo ITI, Demo Polytechnic, etc.)
  const institutions = await db.institution.findMany({ where: { name: { startsWith: "Demo " } } });
  let instCount = 0;
  for (const inst of institutions) {
    const baseName = inst.institutionType === "ITI" ? "Industrial Training Institute" :
      inst.institutionType === "POLYTECHNIC" ? "Polytechnic" :
      inst.institutionType === "SKILL_CENTRE" ? "Skill Development Centre" :
      inst.institutionType === "PRIVATE_TRAINING_PROVIDER" ? "Technical Training Institute" :
      "Industrial Skills Institute";
    // Get district name
    const district = inst.districtId ? await db.district.findUnique({ where: { id: inst.districtId } }) : null;
    const distName = district?.name ?? "Maharashtra";
    const newName = `${distName} ${baseName} ${String(instCount + 1).padStart(2, "0")}`;
    await db.institution.update({ where: { id: inst.id }, data: { name: newName } });
    instCount++;
  }
  console.log(`  ✓ Updated ${instCount} institution names`);

  console.log("✓ Data remediation complete. ALL DATA IS SYNTHETIC.");
}

main().catch(console.error).finally(() => db.$disconnect());
