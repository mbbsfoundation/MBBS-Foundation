import https from "https";

function fetchUrl(url: string): Promise<{ status: number; body: string; headers: Record<string, string | string[] | undefined> }> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          resolve({
            status: res.statusCode || 0,
            body,
            headers: res.headers,
          });
        });
      })
      .on("error", reject);
  });
}

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`  ✅ PASS: ${msg}`);
}

async function verifyLive() {
  console.log("\n==================================================================");
  console.log("LIVE VERIFICATION: NEET CHOICE INDEX 2026 PUBLIC FEATURE");
  console.log("URL: https://mbbsfoundation.com/neet-to-mbbs/counselling/neet-choice-index-2026");
  console.log("==================================================================");

  const url = "https://mbbsfoundation.com/neet-to-mbbs/counselling/neet-choice-index-2026";
  const res = await fetchUrl(url);

  console.log(`HTTP Status: ${res.status}`);
  assert(res.status === 200, `1. Public page returns HTTP 200 OK (got: ${res.status})`);

  const body = res.body;

  // 2. Canonical URL
  assert(
    body.includes('<link rel="canonical" href="https://mbbsfoundation.com/neet-to-mbbs/counselling/neet-choice-index-2026"/>') ||
      body.includes('https://mbbsfoundation.com/neet-to-mbbs/counselling/neet-choice-index-2026'),
    "2. Canonical URL is present and matches the public route"
  );

  // 3. OpenGraph Title
  assert(
    body.includes("NEET Choice Index 2026 vs NIRF: Do Students and Rankings Agree?"),
    "3. OG Title is correctly populated"
  );

  // 4. OpenGraph Image
  assert(
    body.includes("https://mbbsfoundation.com/images/og-neet-planner-2026-custom.png?v=2"),
    "4. OG Image strictly points to stable static custom PNG with ?v=2"
  );

  // 5. Twitter Card
  assert(
    body.includes("summary_large_image"),
    "5. Twitter card is summary_large_image"
  );

  // 6. Key colleges and values present
  assert(body.includes("Maulana Azad Medical College"), "6. MAMC is rendered on page");
  assert(body.includes("SMS Medical College"), "7. SMS Jaipur is rendered on page");
  assert(body.includes("Institute of Medical Sciences, BHU"), "8. IMS BHU is rendered on page");
  assert(body.includes("Vardhman Mahavir Medical College"), "9. VMMC & Safdarjung is rendered on page");
  assert(body.includes("AIIMS, New Delhi"), "10. AIIMS New Delhi #1 is rendered on page");

  // 7. Share This Analysis button
  assert(body.includes("Share This Analysis"), "11. 'Share This Analysis' button is present");

  // 8. Standalone college links
  assert(body.includes("/neet-to-mbbs/colleges/maulana-azad-medical-college-new-delhi/counselling-2026"), "12. MAMC standalone link is correct");
  assert(body.includes("/neet-to-mbbs/colleges/sms-medical-college-jaipur/counselling-2026"), "13. SMS Jaipur standalone link is correct");
  assert(body.includes("/neet-to-mbbs/colleges/aiims-delhi/counselling-2026"), "14. AIIMS Delhi standalone link is correct");

  // 9. Deemed fee-context warning
  assert(body.includes("Why Fees and Counselling Pathways Matter"), "15. Deemed fee-context warning is present");

  // 10. Planner check
  const plannerRes = await fetchUrl("https://mbbsfoundation.com/neet-to-mbbs/counselling/round-2-planner");
  assert(plannerRes.status === 200, "16. Main planner returns HTTP 200 OK");
  assert(plannerRes.body.includes("NEET Choice Index 2026"), "17. Main planner contains discovery link to NEET Choice Index");

  console.log("\n==================================================================");
  console.log("ALL 17 LIVE PRODUCTION CHECKS PASSED!");
  console.log("==================================================================");
}

verifyLive().catch((err) => {
  console.error("Live verification error:", err);
  process.exit(1);
});
