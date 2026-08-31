import "dotenv/config";
import { prisma } from "../lib/prisma";
import {
  CALCULATION_VERSION,
  generateAnalyticsSnapshotRecords,
} from "../lib/counselling/analyticsEngine";
import { CounsellingRoundType, CounsellingAuthorityType } from "../lib/generated/prisma/client";

export async function buildAnalyticsSnapshots(
  academicYear: number = 2026,
  roundType: CounsellingRoundType = CounsellingRoundType.ROUND_1,
  authorityType: CounsellingAuthorityType = CounsellingAuthorityType.MCC,
  calculationVersion: string = CALCULATION_VERSION
) {
  const startTime = Date.now();
  console.log("===============================================================");
  console.log(`BUILDING ANALYTICS SNAPSHOTS: Academic Year ${academicYear} | ${roundType} | ${authorityType}`);
  console.log(`Calculation Version: ${calculationVersion}`);
  console.log("===============================================================\n");

  // 1. Generate snapshot records from active PostgreSQL source data
  console.log("1. Generating analytical distributions from active PostgreSQL records...");
  const { round, snapshotDataList, totalOffered, totalAllotted, totalGap } =
    await generateAnalyticsSnapshotRecords(academicYear, roundType, authorityType, calculationVersion);

  console.log(`- Generated Snapshots Count: ${snapshotDataList.length}`);
  console.log(`- Total Seats Offered: ${totalOffered} (Expected: 27,292)`);
  console.log(`- Total Seats Allotted: ${totalAllotted} (Expected: 25,635)`);
  console.log(`- Total Observed Gap: ${totalGap} (Expected: 1,657)`);

  if (snapshotDataList.length !== 3093 || totalOffered !== 27292 || totalAllotted !== 25635 || totalGap !== 1657) {
    throw new Error("STOP: Analytics reconciliation totals mismatch before ingestion!");
  }

  // 2. Transactional Idempotent Ingestion
  console.log("\n2. Ingesting AnalyticsSnapshot records into PostgreSQL (Transactional Rebuild)...");

  await prisma.$transaction(async (tx) => {
    // Delete existing snapshots for this round and calculation version
    await tx.analyticsSnapshot.deleteMany({
      where: {
        roundId: round.id,
        calculationVersion,
      },
    });

    // Ingest in chunks of 500
    const chunkSize = 500;
    for (let i = 0; i < snapshotDataList.length; i += chunkSize) {
      const chunk = snapshotDataList.slice(i, i + chunkSize);
      await tx.analyticsSnapshot.createMany({ data: chunk });
    }
  });

  const durationMs = Date.now() - startTime;

  // 3. Verify in PostgreSQL
  console.log("\n3. Verifying Database Snapshot Records...");
  const dbSnapshotCount = await prisma.analyticsSnapshot.count({
    where: { roundId: round.id, calculationVersion },
  });
  console.log(`- Database Snapshots in PostgreSQL: ${dbSnapshotCount} (Expected: 3,093) ✅`);
  console.log(`- Execution Duration: ${durationMs}ms ✅`);

  if (dbSnapshotCount !== 3093) {
    throw new Error(`STOP: Snapshot count mismatch in database! Found ${dbSnapshotCount}`);
  }

  console.log("\n===============================================================");
  console.log("ANALYTICS SNAPSHOT REBUILD COMPLETED AND VERIFIED SUCCESSFULLY!");
  console.log("===============================================================\n");

  return {
    count: dbSnapshotCount,
    totalOffered,
    totalAllotted,
    totalGap,
    durationMs,
  };
}

if (require.main === module) {
  buildAnalyticsSnapshots()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("Analytics snapshot build failed:", err);
      await prisma.$disconnect();
      process.exit(1);
    });
}
