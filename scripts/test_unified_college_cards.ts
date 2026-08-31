import "dotenv/config";
import fs from "fs";
import path from "path";
import { getRound1Evidence, searchMedicalCollegesEvidence } from "@/lib/counselling/evidenceService";
import { getPrimaryOpenBenchmark } from "@/lib/counselling/pathwayOrdering";

async function runTests() {
  console.log("==================================================================");
  console.log("SEQUENCE 9G.2 TEST SUITE: Unified Medical College Evidence Cards");
  console.log("==================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      if (detail) console.error(`    Detail: ${detail}`);
      failed++;
    }
  }

  const rootDir = process.cwd();

  // -------------------------------------------------------------
  // Test Group 1: Shared Component Architecture & Single Implementation
  // -------------------------------------------------------------
  console.log("Test Group 1: Shared Component Architecture & Single Implementation");
  const cardPath = path.join(rootDir, "components/neet-to-mbbs/CollegeEvidenceCard.tsx");
  assert(fs.existsSync(cardPath), "CollegeEvidenceCard.tsx component exists");

  const cardContent = fs.readFileSync(cardPath, "utf-8");
  assert(
    cardContent.includes("export default function CollegeEvidenceCard"),
    "CollegeEvidenceCard is default-exported component"
  );

  const r1Path = path.join(rootDir, "components/neet-to-mbbs/Round1EvidenceExplorer.tsx");
  const r1Content = fs.readFileSync(r1Path, "utf-8");
  assert(
    r1Content.includes('import CollegeEvidenceCard from "./CollegeEvidenceCard"'),
    "Round1EvidenceExplorer imports CollegeEvidenceCard"
  );
  assert(
    r1Content.includes("<CollegeEvidenceCard"),
    "Round1EvidenceExplorer renders CollegeEvidenceCard in Explore by AIR domicile section"
  );

  const medPath = path.join(rootDir, "components/neet-to-mbbs/MedicalCollegeExplorer.tsx");
  const medContent = fs.readFileSync(medPath, "utf-8");
  assert(
    medContent.includes('import CollegeEvidenceCard from "./CollegeEvidenceCard"'),
    "MedicalCollegeExplorer imports CollegeEvidenceCard"
  );
  assert(
    medContent.includes("<CollegeEvidenceCard"),
    "MedicalCollegeExplorer renders CollegeEvidenceCard in directory results"
  );

  // -------------------------------------------------------------
  // Test Group 2: Visual Hierarchy Invariants inside CollegeEvidenceCard
  // -------------------------------------------------------------
  console.log("\nTest Group 2: Visual Hierarchy Invariants inside CollegeEvidenceCard");
  const openBenchIndex = cardContent.indexOf("PRIMARY OPEN ROUND-1 AIR BENCHMARK");
  const seatBlockIndex = cardContent.indexOf("SECONDARY 2026 SEAT STRUCTURE");
  const studentCatIndex = cardContent.indexOf("STUDENT-SPECIFIC CATEGORY PROFILE");
  const actionsIndex = cardContent.indexOf("Card Actions");

  assert(
    openBenchIndex > 0 && seatBlockIndex > 0 && studentCatIndex > 0 && actionsIndex > 0,
    "All 4 core sections exist in CollegeEvidenceCard"
  );
  assert(
    openBenchIndex < seatBlockIndex,
    "Primary Open Benchmark appears BEFORE Secondary 2026 Seat Structure"
  );
  assert(
    seatBlockIndex < studentCatIndex,
    "Secondary 2026 Seat Structure appears BEFORE Student-Specific Category Profile"
  );
  assert(
    studentCatIndex < actionsIndex,
    "Student-Specific Category Profile appears BEFORE Card Actions"
  );

  // Dominant Typical (Median) AIR assertion
  assert(
    cardContent.includes("Typical (Median) AIR") &&
      cardContent.includes("text-2xl sm:text-3xl font-black text-blue-700"),
    "Typical (Median) AIR is styled with dominant large typography (text-2xl sm:text-3xl font-black text-blue-700)"
  );

  // Terminology assertions
  assert(cardContent.includes("Best AIR"), "Card includes Best AIR");
  assert(cardContent.includes("Last Observed AIR"), "Card includes Last Observed AIR");
  assert(cardContent.includes("Round-1 Allotments"), "Card includes Round-1 Allotments");
  assert(cardContent.includes("MCC Offered"), "Card includes MCC Offered");
  assert(cardContent.includes("MCC Allotted"), "Card includes MCC Allotted");
  assert(cardContent.includes("Outside Pool"), "Card includes Outside Pool");

  // -------------------------------------------------------------
  // Test Group 3: Subtle Management Light Tints Consistency
  // -------------------------------------------------------------
  console.log("\nTest Group 3: Subtle Management Light Tints Consistency");
  assert(
    cardContent.includes("from-emerald-50/30") && cardContent.includes("border-emerald-200/80"),
    "Government colleges receive subtle mint/emerald tint"
  );
  assert(
    cardContent.includes("from-indigo-50/35") && cardContent.includes("border-indigo-200/80"),
    "INI colleges receive subtle indigo tint"
  );
  assert(
    cardContent.includes("from-purple-50/35") && cardContent.includes("border-purple-200/80"),
    "Deemed colleges receive subtle purple/lavender tint"
  );
  assert(
    cardContent.includes("from-blue-50/35") && cardContent.includes("border-blue-200/80"),
    "Central Universities receive subtle blue tint"
  );
  assert(
    cardContent.includes("from-amber-50/25") && cardContent.includes("border-amber-200/70"),
    "Private colleges receive subtle warm neutral/amber tint"
  );

  // -------------------------------------------------------------
  // Test Group 4: Live Data Parity — AIIMS New Delhi across Both Routes
  // -------------------------------------------------------------
  console.log("\nTest Group 4: Live Data Parity — AIIMS New Delhi across Both Routes");
  const aiimsDirRes = await searchMedicalCollegesEvidence({ query: "AIIMS, New Delhi" });
  assert(aiimsDirRes.items.length > 0, "Found AIIMS New Delhi in directory query");
  const aiimsDir = aiimsDirRes.items[0];

  const aiimsAirRes = await getRound1Evidence({
    air: 50,
    window: 500,
    domicileState: "Delhi",
    category: "OPEN",
    isPwD: false,
  });
  const aiimsAir = aiimsAirRes.domicileSummary?.colleges.find((c) => c.collegeId === aiimsDir.collegeId);
  assert(!!aiimsAir, "Found AIIMS New Delhi in Explore by AIR domicile colleges");

  if (aiimsAir) {
    const dirBench = getPrimaryOpenBenchmark(aiimsDir.allCategoryProfiles);
    const airBench = getPrimaryOpenBenchmark(aiimsAir.allCategoryProfiles);

    assert(!!dirBench && !!airBench, "Primary Open Benchmark resolved for AIIMS Delhi in both routes");
    assert(
      dirBench?.medianAIR === airBench?.medianAIR && dirBench?.medianAIR === 25.5,
      `Typical (Median) AIR matches exactly across both routes (got ${airBench?.medianAIR})`
    );
    assert(
      dirBench?.bestAIR === airBench?.bestAIR && dirBench?.bestAIR === 1,
      `Best AIR matches exactly across both routes (got ${airBench?.bestAIR})`
    );
    assert(
      dirBench?.highestAIR === airBench?.highestAIR && dirBench?.highestAIR === 52,
      `Last Observed AIR matches exactly across both routes (got ${airBench?.highestAIR})`
    );
    assert(
      aiimsDir.totalMBBSSeats2026 === aiimsAir.totalMBBSSeats2026,
      `Total seats match across both routes (${aiimsAir.totalMBBSSeats2026})`
    );
    assert(
      aiimsDir.mccRound1SeatsOffered === aiimsAir.mccRound1SeatsOffered,
      `MCC Offered matches across both routes (${aiimsAir.mccRound1SeatsOffered})`
    );
  }

  // -------------------------------------------------------------
  // Test Group 5: Live Data Parity — SMS Medical College, Jaipur (SC Student)
  // -------------------------------------------------------------
  console.log("\nTest Group 5: Live Data Parity — SMS Medical College, Jaipur (SC Student)");
  const smsDirRes = await searchMedicalCollegesEvidence({ query: "SMS Medical College" });
  assert(smsDirRes.items.length > 0, "Found SMS Medical College in directory query");
  const smsDir = smsDirRes.items[0];

  const smsAirRes = await getRound1Evidence({
    air: 10122,
    window: 500,
    domicileState: "Rajasthan",
    category: "SC",
    isPwD: false,
  });
  const smsAir = smsAirRes.domicileSummary?.colleges.find((c) => c.collegeId === smsDir.collegeId);
  assert(!!smsAir, "Found SMS Medical College in Explore by AIR (Rajasthan SC profile)");

  if (smsAir) {
    const dirBench = getPrimaryOpenBenchmark(smsDir.allCategoryProfiles);
    const airBench = getPrimaryOpenBenchmark(smsAir.allCategoryProfiles);

    assert(
      dirBench?.medianAIR === airBench?.medianAIR && dirBench?.medianAIR === 938,
      `Primary Open Typical (Median) AIR is 938 in both routes (got ${airBench?.medianAIR})`
    );
    assert(
      dirBench?.bestAIR === airBench?.bestAIR && dirBench?.bestAIR === 584,
      `Primary Open Best AIR is 584 in both routes (got ${airBench?.bestAIR})`
    );
    assert(
      dirBench?.highestAIR === airBench?.highestAIR && dirBench?.highestAIR === 1144,
      `Primary Open Last Observed AIR is 1144 in both routes (got ${airBench?.highestAIR})`
    );

    // Reserved Category Profile check
    const scProfile = smsAir.allCategoryProfiles.find((p) => p.seatCategory === "SC" && !p.isPwD);
    assert(!!scProfile, "SC profile exists for SMS Medical College");
    assert(scProfile?.medianAIR === 14776, `SC Typical (Median) AIR is 14,776 (got ${scProfile?.medianAIR})`);
    assert(scProfile?.bestAIR === 9797, `SC Best AIR is 9,797 (got ${scProfile?.bestAIR})`);
    assert(scProfile?.highestAIR === 15696, `SC Last Observed AIR is 15,696 (got ${scProfile?.highestAIR})`);
  }

  // -------------------------------------------------------------
  // Test Group 6: PwD Separation Invariant
  // -------------------------------------------------------------
  console.log("\nTest Group 6: PwD Separation Invariant");
  const pwdAirRes = await getRound1Evidence({
    air: 160000,
    window: 500,
    domicileState: "Maharashtra",
    category: "OBC",
    isPwD: true,
  });
  const collegesWithOpen = pwdAirRes.domicileSummary!.colleges.filter((c) =>
    c.allCategoryProfiles.some((p) => p.seatCategory === "OPEN")
  );
  assert(collegesWithOpen.length > 0, "Found Maharashtra colleges with OPEN profiles");
  const samplePwdCollege = collegesWithOpen[0];
  const sampleOpenBench = getPrimaryOpenBenchmark(samplePwdCollege.allCategoryProfiles);
  assert(
    sampleOpenBench !== null && sampleOpenBench.isPwD === false,
    "Primary Open Benchmark strictly remains non-PwD even for PwD student exploration"
  );

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log("\n==================================================================");
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed with error:", err);
  process.exit(1);
});
