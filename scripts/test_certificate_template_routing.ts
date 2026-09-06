import assert from "assert";
import {
  generateUnifiedCertificateSvg,
  resolveCanonicalCertificateCategory,
  isCprDayDate,
} from "../lib/sanjeevaniCertificate";
import { prisma } from "../lib/prisma";

async function runTests() {
  console.log("==================================================");
  console.log("RUNNING FOCUSED CERTIFICATE TEMPLATE ROUTING TESTS");
  console.log("==================================================\n");

  // Test 1: Date detection helper
  console.log("1. Testing Date Detection Helper (isCprDayDate)...");
  assert.strictEqual(isCprDayDate("21 July 2026"), true);
  assert.strictEqual(isCprDayDate("2026-07-21"), true);
  assert.strictEqual(isCprDayDate("21-07-2026"), true);
  assert.strictEqual(isCprDayDate("21/07/2026"), true);
  assert.strictEqual(isCprDayDate("21.07.2026"), true);
  assert.strictEqual(isCprDayDate("21st July 2026"), true);
  assert.strictEqual(isCprDayDate("22 July 2026"), false);
  assert.strictEqual(isCprDayDate("15 August 2026"), false);
  assert.strictEqual(isCprDayDate("2026-08-15"), false);
  console.log("   ✓ Date detection correctly identifies 21 July 2026 formats\n");

  // Test 2: Category Resolver Precedence & Accuracy
  console.log("2. Testing Deterministic Category Resolution...");
  
  // 2a. CPR Day Participant (Chandigarh /CH/ code in ID)
  const cat1 = resolveCanonicalCertificateCategory({
    certificateId: "IAPCPR/PA/CH/1150",
    participantName: "Simranjeet Kaur",
    date: "21 July 2026",
    venue: "Cloudnine Hospital",
    city: "Chandigarh",
    state: "Chandigarh",
  });
  assert.strictEqual(cat1, "CPR_DAY", "IAPCPR/PA/CH/1150 must resolve to CPR_DAY");

  // 2b. CPR Champion (Chandigarh /CH/ code in ID)
  const cat2 = resolveCanonicalCertificateCategory({
    certificateId: "IAPCPR/CH/CH/0151",
    participantName: "Dr. Champion User",
    date: "21 July 2026",
    venue: "Cloudnine Hospital",
    city: "Chandigarh",
    state: "Chandigarh",
  });
  assert.strictEqual(cat2, "CPR_CHAMPION", "IAPCPR/CH/CH/0151 must resolve to CPR_CHAMPION");

  // 2c. Course Coordinator (Chandigarh /CH/ code in ID)
  const cat3 = resolveCanonicalCertificateCategory({
    certificateId: "IAPCPR/CC/CH/0101",
    participantName: "Dr. Coordinator User",
    date: "21 July 2026",
    venue: "Cloudnine Hospital",
    city: "Chandigarh",
    state: "Chandigarh",
  });
  assert.strictEqual(cat3, "COURSE_COORDINATOR", "IAPCPR/CC/CH/0101 must resolve to COURSE_COORDINATOR");

  // 2d. CPR Facility
  const cat4 = resolveCanonicalCertificateCategory({
    certificateId: "IAP-CPR-Day/Venue/CH-1",
    participantName: "Cloudnine Hospital",
    date: "21 July 2026",
    venue: "Cloudnine Hospital",
    city: "Chandigarh",
    state: "Chandigarh",
  });
  assert.strictEqual(cat4, "CPR_FACILITY", "IAP-CPR-Day/Venue/CH-1 must resolve to CPR_FACILITY");

  // 2e. Sanjeevani Participant (Non-21-Jul)
  const cat5 = resolveCanonicalCertificateCategory({
    certificateId: "IAPCPR/Sanjeevani/CH/1001",
    participantName: "Rahul Sharma",
    date: "15 August 2026",
    venue: "General Hospital",
    city: "Chandigarh",
    state: "Chandigarh",
  });
  assert.strictEqual(cat5, "SANJEEVANI", "IAPCPR/Sanjeevani/CH/1001 must resolve to SANJEEVANI");

  console.log("   ✓ Category resolution accurately separates PA vs CH vs CC vs Facility vs Sanjeevani\n");

  // Test 3: SVG Rendering Template Routing
  console.log("3. Testing Dynamic SVG Template Routing...");

  // 3a. Render IAPCPR/PA/CH/1150 (The exact production case)
  const svgParticipant = generateUnifiedCertificateSvg({
    certificateId: "IAPCPR/PA/CH/1150",
    participantName: "Simranjeet Kaur",
    date: "21 July 2026",
    venue: "Cloudnine Hospital",
    city: "Chandigarh",
    state: "Chandigarh",
    category: "CPR Lay Rescuer",
  });

  // Must contain CPR Day specific markers and NOT Champion markers
  assert(svgParticipant.includes("cprday-dynamic-fields"), "Must inject cprday-dynamic-fields layer");
  assert(svgParticipant.includes("Simranjeet Kaur"), "Must contain participant name");
  assert(svgParticipant.includes("IAPCPR/PA/CH/1150"), "Must contain exact certificate ID");
  assert(svgParticipant.includes("viewBox=\"0 0 29756.48 21007.29\"") || svgParticipant.includes("29756.48"), "Must use Lay Rescuer CPR Day.svg template");
  assert(!svgParticipant.includes("cprchampion-dynamic-fields"), "CPR Day participant must NEVER have champion fields");
  assert(!svgParticipant.includes("CPR CHAMPION"), "CPR Day participant must NEVER render CPR CHAMPION text");
  assert(!svgParticipant.includes("CERTIFICATE OF APPRECIATION"), "CPR Day participant must NEVER render Appreciation title");
  console.log("   ✓ IAPCPR/PA/CH/1150 correctly renders with Lay Rescuer CPR Day.svg and contains no Champion branding");

  // 3b. Render IAPCPR/CH/CH/0151 (Champion)
  const svgChampion = generateUnifiedCertificateSvg({
    certificateId: "IAPCPR/CH/CH/0151",
    participantName: "Dr. Champion User",
    date: "21 July 2026",
    venue: "Cloudnine Hospital",
    city: "Chandigarh",
    state: "Chandigarh",
    category: "CPR Champion",
  });

  assert(svgChampion.includes("cprchampion-dynamic-fields"), "Must inject cprchampion-dynamic-fields layer");
  assert(svgChampion.includes("Dr. Champion User"), "Must contain champion name");
  assert(svgChampion.includes("IAPCPR/CH/CH/0151"), "Must contain champion certificate ID");
  assert(!svgChampion.includes("cprday-dynamic-fields"), "Champion must NEVER have participant fields");
  console.log("   ✓ IAPCPR/CH/CH/0151 correctly renders with CPR Champions.svg");

  // 3c. Render IAPCPR/Sanjeevani/PB/1001 (Non-21-Jul Sanjeevani)
  const svgSanjeevani = generateUnifiedCertificateSvg({
    certificateId: "IAPCPR/Sanjeevani/PB/1001",
    participantName: "Aman Deep",
    date: "10 August 2026",
    venue: "Civil Hospital",
    city: "Ludhiana",
    state: "Punjab",
    category: "CPR Sanjeevani Lay Rescuer",
  });

  assert(svgSanjeevani.includes("sanjeevani-dynamic-fields"), "Must inject sanjeevani-dynamic-fields layer");
  assert(svgSanjeevani.includes("Aman Deep"), "Must contain participant name");
  assert(svgSanjeevani.includes("IAPCPR/Sanjeevani/PB/1001"), "Must contain Sanjeevani ID");
  assert(svgSanjeevani.includes("10 August 2026"), "Must contain event date");
  console.log("   ✓ IAPCPR/Sanjeevani/PB/1001 correctly renders with cpr sanjeevani certificate 2.svg");

  // Test 4: Database Audit of Genuine Batch in PostgreSQL
  console.log("\n4. Auditing Database Records for Cloudnine Hospital Genuine Batch...");
  const genuineBatch = await prisma.adminCertificateRecord.findMany({
    where: {
      stateCode: "CH",
      category: "PARTICIPANT",
    },
    orderBy: { certificateId: "asc" },
  });

  console.log(`   Found ${genuineBatch.length} records for Cloudnine Hospital batch.`);
  assert(genuineBatch.length > 0, "Genuine batch must exist in database");
  console.log(`   First ID: ${genuineBatch[0].certificateId}`);
  console.log(`   Last ID: ${genuineBatch[genuineBatch.length - 1].certificateId}`);
  console.log(`   Stored category for all records: ${genuineBatch[0].category}`);
  console.log(`   Stored event date: ${genuineBatch[0].certificateDate}`);
  console.log(`   Stored state code: ${genuineBatch[0].stateCode}`);

  for (const rec of genuineBatch) {
    assert.strictEqual(rec.category, "PARTICIPANT", "Database record category must be PARTICIPANT");
    assert(rec.certificateId.startsWith("IAPCPR/PA/CH/"), `Certificate ID must start with IAPCPR/PA/CH/: ${rec.certificateId}`);
    
    // Test dynamic SVG generation for each record in the genuine batch
    const rendered = generateUnifiedCertificateSvg({
      certificateId: rec.certificateId,
      participantName: rec.name,
      date: rec.certificateDate,
      venue: rec.venueName,
      city: rec.city || "Chandigarh",
      state: rec.state,
      stateCode: rec.stateCode,
    });

    assert(rendered.includes("cprday-dynamic-fields"), `${rec.certificateId} must render with Lay Rescuer CPR Day fields`);
    assert(!rendered.includes("cprchampion-dynamic-fields"), `${rec.certificateId} must NEVER render with champion fields`);
  }

  console.log(`   ✓ Verified all ${genuineBatch.length} genuine batch records render exclusively with Lay Rescuer CPR Day template!`);

  console.log("\n==================================================");
  console.log("ALL FOCUSED CERTIFICATE TEMPLATE TESTS PASSED!");
  console.log("==================================================");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
