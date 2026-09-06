import { execSync } from "child_process";

const testScripts = [
  "scripts/test_cpr_reporting_reconciliation.ts",
  "scripts/test_certificate_generation_db_persistence.ts",
  "scripts/test_certificate_template_routing.ts",
  "scripts/test_step5c_closed_loop.ts",
  "scripts/test_step6_system_freeze.ts",
  "scripts/test_step6_comprehensive_audit.ts",
  "scripts/test_persistence_bridge_reconciliation.ts",
];

console.log("================================================================================");
console.log("MASTER TEST RUNNER: ALL CPR RECONCILIATION & PERSISTENCE TEST SUITES");
console.log("================================================================================\n");

let allPassed = true;

for (const script of testScripts) {
  console.log(`\n>>> RUNNING: ${script}...`);
  try {
    const output = execSync(`npx tsx ${script}`, {
      stdio: "inherit",
      encoding: "utf-8",
    });
    console.log(`>>> SUCCESS: ${script}`);
  } catch (err) {
    console.error(`>>> FAILED: ${script}`);
    allPassed = false;
    process.exit(1);
  }
}

console.log("\n================================================================================");
console.log("ALL CPR RECONCILIATION SUITES COMPLETED WITH 100% PASS RATE!");
console.log("================================================================================\n");
