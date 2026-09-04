async function verifyLiveCounsellingPage() {
  console.log("==================================================================");
  console.log("LIVE PRODUCTION VERIFICATION: SEQUENCE 9K.2C COUNSELLING PAGE UX");
  console.log("==================================================================");

  const url = "https://mbbsfoundation.com/neet-to-mbbs/counselling";
  console.log(`Checking live page: ${url}`);
  const res = await fetch(url, { cache: "no-store" });
  console.log(`HTTP Status: ${res.status}`);

  if (res.status !== 200) {
    console.error(`❌ Non-200 status code: ${res.status}`);
    process.exit(1);
  }

  const html = await res.text();

  // 1. Check Section Order
  const stateDirPos = html.indexOf('id="state-directories"');
  const whatIsNeetPos = html.indexOf("What Is NEET Counselling?");
  const whichCounsellingPos = html.indexOf("Which Counselling Applies to Me?");

  console.log(`\nSection Positions in live HTML:`);
  console.log(`  State Directory: index ${stateDirPos}`);
  console.log(`  What Is NEET Counselling: index ${whatIsNeetPos}`);
  console.log(`  Which Counselling Applies to Me: index ${whichCounsellingPos}`);

  const orderCorrect = stateDirPos !== -1 && whatIsNeetPos !== -1 && stateDirPos < whatIsNeetPos && whatIsNeetPos < whichCounsellingPos;
  console.log(`  Order Correct (State Directory BEFORE educational content): ${orderCorrect ? "YES ✓" : "NO ❌"}`);

  // 2. Check Copy
  const hasServerRendered = html.includes("server-rendered");
  console.log(`  'server-rendered' removed from public copy: ${!hasServerRendered ? "YES ✓" : "NO ❌"}`);

  const hasCompactHero = html.includes("Understand the counselling process, explore medical colleges by state");
  console.log(`  Compact Hero copy present: ${hasCompactHero ? "YES ✓" : "NO ❌"}`);

  // 3. Check State Links
  const testStates = ["rajasthan", "delhi", "uttar-pradesh", "maharashtra", "karnataka", "tamil-nadu"];
  for (const st of testStates) {
    const hasLink = html.includes(`/neet-to-mbbs/counselling/state/${st}`);
    console.log(`  Contains ${st} state link: ${hasLink ? "YES ✓" : "NO ❌"}`);
  }

  console.log("\n==================================================================");
  console.log("LIVE VERIFICATION COMPLETE!");
  console.log("==================================================================");
}

verifyLiveCounsellingPage().catch(console.error);
