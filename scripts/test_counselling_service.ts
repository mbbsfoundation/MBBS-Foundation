import "dotenv/config";
import { prisma } from "../lib/prisma";
import {
  StudentCounsellingProfile,
  getCounsellingEvidenceForStudent,
  getMccEvidenceForStudent,
  getStateCapacityEvidenceForStudent,
  searchColleges,
  getCollegeById,
} from "../lib/counselling/counsellingService";
import { CounsellingSeatCategory } from "../lib/generated/prisma/client";

export async function runServiceTests() {
  console.log("===============================================================");
  console.log("SEQUENCE 5A.1: TARGETED ELIGIBILITY & PwD CORRECTION TESTS");
  console.log("===============================================================\n");

  // 1. Test College Institutional Queries
  console.log("1. Testing College Institutional Queries...");
  const searchRes = await searchColleges({ query: "AIIMS", limit: 5 });
  console.log(`- searchColleges('AIIMS'): Found ${searchRes.total} total, returned ${searchRes.colleges.length} ✅`);
  if (searchRes.total < 20) throw new Error("Expected at least 20 AIIMS colleges!");

  const sampleCollege = searchRes.colleges[0];
  const fetchedCollege = await getCollegeById(sampleCollege.id);
  console.log(`- getCollegeById('${sampleCollege.collegeName.substring(0, 30)}'): Found with ${fetchedCollege?.analyticsSnapshots.length} snapshots ✅`);

  // 2. Define Profiles for Targeted Eligibility Testing
  const profiles: { name: string; profile: StudentCounsellingProfile }[] = [
    {
      name: "Profile A: OPEN Non-PwD (AIR 5,000, UP Domicile)",
      profile: {
        air: 5000,
        category: CounsellingSeatCategory.OPEN,
        isPwD: false,
        domicileState: "Uttar Pradesh",
        goal: "GET_SEAT",
      },
    },
    {
      name: "Profile B: OPEN PwD (AIR 250,000, Karnataka Domicile)",
      profile: {
        air: 250000,
        category: CounsellingSeatCategory.OPEN,
        isPwD: true,
        domicileState: "Karnataka",
        goal: "GET_SEAT",
      },
    },
    {
      name: "Profile C: OBC PwD (AIR 180,000, Maharashtra Domicile)",
      profile: {
        air: 180000,
        category: CounsellingSeatCategory.OBC,
        isPwD: true,
        domicileState: "Maharashtra",
        goal: "GET_SEAT",
      },
    },
    {
      name: "Profile D: SC PwD (AIR 350,000, Rajasthan Domicile)",
      profile: {
        air: 350000,
        category: CounsellingSeatCategory.SC,
        isPwD: true,
        domicileState: "Rajasthan",
        goal: "GET_SEAT",
      },
    },
    {
      name: "Profile E: Ordinary Delhi OPEN Student WITHOUT DU Eligibility (AIR 8,000, Delhi Domicile)",
      profile: {
        air: 8000,
        category: CounsellingSeatCategory.OPEN,
        isPwD: false,
        domicileState: "Delhi",
        goal: "GET_SEAT",
        // No specialPathwayEligibility
      },
    },
    {
      name: "Profile F: Delhi OPEN Student EXPLICITLY ELIGIBLE for DU Internal Quota (AIR 8,000, Delhi Domicile)",
      profile: {
        air: 8000,
        category: CounsellingSeatCategory.OPEN,
        isPwD: false,
        domicileState: "Delhi",
        goal: "GET_SEAT",
        specialPathwayEligibility: { isInternalDU: true },
      },
    },
  ];

  console.log("\n2. Evaluating Student Evidence Retrieval across Profiles...");

  for (const { name, profile } of profiles) {
    const t0 = Date.now();
    const result = await getCounsellingEvidenceForStudent(profile);
    const duration = Date.now() - t0;

    console.log(`\n===============================================================`);
    console.log(`${name}`);
    console.log(`===============================================================`);
    console.log(`- Total Evidence Returned: ${result.evidence.length} (MCC: ${result.totalMccRecords}, State Est: ${result.totalStateEstimateRecords}) in ${duration}ms`);

    const mccRecords = result.evidence.filter((e) => e.route === "MCC");
    const stateRecords = result.evidence.filter((e) => e.route === "STATE_ESTIMATE");

    // Quota Counts
    const quotaCounts: Record<string, number> = {};
    mccRecords.forEach((e) => {
      quotaCounts[e.quota] = (quotaCounts[e.quota] || 0) + 1;
    });
    console.log(`- MCC Quota Breakdown:`, quotaCounts);

    // Categories & PwD distribution
    const catPwDCounts: Record<string, number> = {};
    mccRecords.forEach((e) => {
      const key = `${e.seatCategory} (isPwD: ${e.isPwD})`;
      catPwDCounts[key] = (catPwDCounts[key] || 0) + 1;
    });
    console.log(`- Category & PwD Breakdown:`, catPwDCounts);

    // Verify Invariants based on Profile
    if (!profile.isPwD && profile.category === CounsellingSeatCategory.OPEN) {
      // Profile A & E & F
      mccRecords.forEach((e) => {
        if (e.isPwD !== false || e.seatCategory !== CounsellingSeatCategory.OPEN) {
          throw new Error(`STOP: Open non-PwD received invalid category or PwD cell!`);
        }
      });
    }

    if (profile.isPwD && profile.category === CounsellingSeatCategory.OPEN) {
      // Profile B (OPEN PwD): Must have both OPEN non-PwD (Ordinary Merit) and OPEN PwD (Reserved PwD)
      const openNonPwD = mccRecords.filter((e) => e.seatCategory === CounsellingSeatCategory.OPEN && !e.isPwD);
      const openPwD = mccRecords.filter((e) => e.seatCategory === CounsellingSeatCategory.OPEN && e.isPwD);

      console.log(`  * OPEN Non-PwD (Ordinary Merit): ${openNonPwD.length} records`);
      console.log(`  * OPEN PwD (Reserved PwD): ${openPwD.length} records`);

      if (openNonPwD.length === 0 || openPwD.length === 0) {
        throw new Error(`STOP: OPEN PwD candidate must receive BOTH ordinary merit and PwD reserved records!`);
      }
    }

    if (profile.isPwD && profile.category === CounsellingSeatCategory.OBC) {
      // Profile C (OBC PwD): Must have OPEN non-PwD, OBC non-PwD, OPEN PwD, OBC PwD
      const openNonPwD = mccRecords.filter((e) => e.seatCategory === CounsellingSeatCategory.OPEN && !e.isPwD);
      const obcNonPwD = mccRecords.filter((e) => e.seatCategory === CounsellingSeatCategory.OBC && !e.isPwD);
      const openPwD = mccRecords.filter((e) => e.seatCategory === CounsellingSeatCategory.OPEN && e.isPwD);
      const obcPwD = mccRecords.filter((e) => e.seatCategory === CounsellingSeatCategory.OBC && e.isPwD);

      console.log(`  * OPEN Non-PwD (Open Merit): ${openNonPwD.length}`);
      console.log(`  * OBC Non-PwD (Category Merit): ${obcNonPwD.length}`);
      console.log(`  * OPEN PwD (Open PwD Reserved): ${openPwD.length}`);
      console.log(`  * OBC PwD (Category PwD Reserved): ${obcPwD.length}`);

      if (openNonPwD.length === 0 || obcNonPwD.length === 0 || openPwD.length === 0 || obcPwD.length === 0) {
        throw new Error(`STOP: OBC PwD candidate missing one of 4 eligible pathways!`);
      }
    }

    // AIIMS Delhi Check for PwD profiles
    if (profile.isPwD) {
      const aiimsDelhiRecords = mccRecords.filter((e) => e.collegeName.includes("AIIMS, New Delhi"));
      console.log(`  * AIIMS New Delhi records returned for PwD candidate: ${aiimsDelhiRecords.length}`);
      aiimsDelhiRecords.forEach((e) => {
        console.log(`    - [${e.quota}] Cat: ${e.seatCategory}, isPwD: ${e.isPwD} | Best: ${e.bestAIR}, Med: ${e.medianAIR}, High: ${e.highestAIR} | Flags: [${e.reasonFlags.join(", ")}]`);
      });

      const aiimsOpenNonPwD = aiimsDelhiRecords.find((e) => e.seatCategory === CounsellingSeatCategory.OPEN && !e.isPwD);
      const aiimsOpenPwD = aiimsDelhiRecords.find((e) => e.seatCategory === CounsellingSeatCategory.OPEN && e.isPwD);

      if (!aiimsOpenNonPwD || !aiimsOpenPwD) {
        throw new Error("STOP: AIIMS Delhi dual-pathway missing for PwD student!");
      }
      if (aiimsOpenNonPwD.highestAIR !== 52 || aiimsOpenPwD.bestAIR !== 4162) {
        throw new Error("STOP: AIIMS Delhi distributions contaminated!");
      }
    }
  }

  // 3. Detailed Audit: Profile E (Ordinary Delhi) vs Profile F (DU-Eligible Delhi)
  console.log("\n===============================================================");
  console.log("3. AUDIT OF DELHI UNIVERSITY QUOTA ELIGIBILITY");
  console.log("===============================================================");

  const resE = await getCounsellingEvidenceForStudent(profiles[4].profile);
  const resF = await getCounsellingEvidenceForStudent(profiles[5].profile);

  const duE = resE.evidence.filter((e) => e.quota === "Delhi University Quota");
  const duF = resF.evidence.filter((e) => e.quota === "Delhi University Quota");

  console.log(`- Profile E (Ordinary Delhi Open, No DU declared):`);
  console.log(`  * Total Evidence: ${resE.evidence.length} (MCC: ${resE.totalMccRecords}, State: ${resE.totalStateEstimateRecords})`);
  console.log(`  * Delhi University Quota Records: ${duE.length} ✅`);

  console.log(`- Profile F (Delhi Open, isInternalDU: true):`);
  console.log(`  * Total Evidence: ${resF.evidence.length} (MCC: ${resF.totalMccRecords}, State: ${resF.totalStateEstimateRecords})`);
  console.log(`  * Delhi University Quota Records: ${duF.length} ✅`);

  if (duE.length !== 0) {
    throw new Error("STOP: Ordinary Delhi student incorrectly received DU Quota!");
  }
  if (duF.length !== 3) {
    throw new Error(`STOP: DU-eligible Open student expected 3 DU Open records (LHMC, MAMC, UCMS), got ${duF.length}!`);
  }
  if (resF.totalMccRecords !== resE.totalMccRecords + 3) {
    throw new Error("STOP: Profile F MCC count should be exactly Profile E + 3!");
  }

  console.log(`\n- Result: Ordinary Delhi profile has ${resE.totalMccRecords} MCC records (0 DU records).`);
  console.log(`- Result: DU-eligible Delhi profile has ${resF.totalMccRecords} MCC records (+3 DU records: LHMC, MAMC, UCMS).`);
  console.log(`- The previous identical count in Sequence 5A occurred because domicileState === 'Delhi' had automatically activated DU quota for both profiles. This is now fixed and verified! ✅`);

  console.log("\n===============================================================");
  console.log("SEQUENCE 5A.1 TESTS COMPLETED AND 100% VALIDATED!");
  console.log("===============================================================\n");
}

if (require.main === module) {
  runServiceTests()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("Service tests failed:", err);
      await prisma.$disconnect();
      process.exit(1);
    });
}
