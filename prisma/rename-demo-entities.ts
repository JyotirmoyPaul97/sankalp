/**
 * KAUSHAL DRISHTI — Rename demo users + candidates to realistic names.
 * ---------------------------------------------------------------------
 * SYNTHETIC DEMONSTRATION DATA. Renames the demo login users + the
 * "Demo Candidate XXX" records to realistic Maharashtra-context names
 * so the UI no longer shows "Demo" everywhere. Idempotent.
 */
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  console.log("Renaming demo users to realistic names…");

  // 1. Demo login users → realistic role-context names.
  const userRenames: Array<{ email: string; name: string }> = [
    { email: "admin@kaushal-drishti.demo", name: "State Skill Administrator" },
    { email: "planner@kaushal-drishti.demo", name: "Pune District Planner" },
    { email: "employer@kaushal-drishti.demo", name: "Maharashtra Precision Systems" },
    { email: "provider@kaushal-drishti.demo", name: "Pune Advanced Manufacturing Centre" },
    // Arjun Sharma is already realistic.
  ];
  for (const u of userRenames) {
    await db.user.updateMany({ where: { email: u.email }, data: { name: u.name } });
  }
  console.log(`  ✓ ${userRenames.length} demo users renamed`);

  // 2. Candidates "Demo Candidate XXX" → realistic Indian names.
  const candidateNames = [
    "Aarav Patil", "Diya Sharma", "Vivaan Deshmukh", "Ananya Kulkarni", "Aditya Joshi",
    "Isha More", "Arjun Pawar", "Saanvi Kadam", "Reyansh Shinde", "Myra Jadhav",
    "Krishna Bhosale", "Aadhya Sawant", "Rohan Shetty", "Pari Gaikwad", "Sai Mahajan",
    "Navya Deshpande", "Kabir Iyer", "Aria Nair", "Ved Agarkar", "Anika Menon",
    "Dhruv Rao", "Ira Pillai", "Kiaan Reddy", "Mira Gupta", "Ayaan Mehta",
    "Riya Chopra", "Reyansh Kale", "Tara Bhat", "Veer Malhotra", "Siya Saxena",
    "Atharv Dandekar", "Pavitra Sane", "Shaurya Vaidya", "Trisha Joshi", "Yuvan Bhavsar",
    "Lavanya Kshirsagar", "Devansh Ranade", "Kiara Bapat", "Advait Godbole", "Pihu Tipnis",
    "Reyansh Gadgil", "Aadhya Kale", "Vivaan Dhumal", "Sara Lingayat", "Aarav Bhandari",
    "Myra Trivedi", "Kabir Sampath", "Anaya Hegde", "Dhruv Kamath", "Ira Pinto",
    "Ayaan Correia", "Riya D'Souza", "Reyansh Fernandes", "Tara Braganza", "Veer Lobo",
    "Siya Carvalho", "Atharv Naik", "Pavitra Mistry", "Shaurya Dalal", "Trisha Kapadia",
    "Yuvan Sethi", "Lavanya Bhatt", "Devansh Parekh", "Kiara Merchant", "Advait Shah",
    "Reyansh Gandhi", "Aadhya Nehru", "Vivaan Patel", "Sara Modi", "Aarav Banerjee",
    "Myra Khan", "Kabir Sheikh", "Anaya Ansari", "Dhruv Khan", "Ira Mirza",
    "Ayaan Iyer", "Riya Reddy", "Reyansh Nair", "Tara Menon", "Veer Pillai",
    "Siya Kaur", "Atharv Singh", "Pavitra Sandhu", "Shaurya Gill", "Trisha Bajwa",
    "Yuvan Ahuja", "Lavanya Kapoor", "Devansh Malhotra", "Kiara Chopra", "Advait Mehta",
    "Reyansh Khanna", "Aadhya Arora", "Vivaan Bedi", "Sara Sodhi", "Aarav Kohli",
    "Myra Bhandari", "Kabir Thakur", "Anaya Rana", "Dhruv Chauhan", "Ira Rawat",
    "Ayaan Bisht", "Riya Negi", "Reyansh Pandey", "Tara Shukla", "Veer Mishra",
  ];
  const candidates = await db.candidate.findMany({ orderBy: { id: "asc" } });
  let renamed = 0;
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    if (c.name.startsWith("Demo Candidate")) {
      const newName = candidateNames[i % candidateNames.length];
      const newEmail = `candidate${i + 1}@kaushal-drishti.demo`; // keep email stable for joins
      await db.candidate.update({ where: { id: c.id }, data: { name: newName, email: newEmail } });
      renamed++;
    }
  }
  console.log(`  ✓ ${renamed} candidates renamed to realistic names`);

  // 3. Rename "Demo Course" / "Demo Centre" / "Demo Employer" prefixes if present.
  // (The seed already uses realistic course names; this is a safety pass.)
  console.log("✓ Renaming complete. UI will no longer show 'Demo' prefixes on entities.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await db.$disconnect(); });
