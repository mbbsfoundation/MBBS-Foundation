import "dotenv/config";
import { getAllStateHubSlugs } from "../lib/counselling/stateHubService";
import NeetCounsellingGuidePage from "../app/neet-to-mbbs/counselling/page";
import React from "react";
import ReactDOMServer from "react-dom/server";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`  ✅ PASS: ${msg}`);
}

async function runTests() {
  console.log("==================================================================");
  console.log("TEST SUITE: SEQUENCE 9K.2C — COUNSELLING PAGE UX & STATE DIRECTORY");
  console.log("==================================================================");

  // Render the server component
  const PageElement = await NeetCounsellingGuidePage();
  const html = ReactDOMServer.renderToStaticMarkup(PageElement);

  console.log("\n[TEST GROUP 1] Information Hierarchy & Section Order");
  const stateDirPos = html.indexOf('id="state-directories"');
  const whatIsNeetPos = html.indexOf("What Is NEET Counselling?");
  const whichCounsellingPos = html.indexOf("Which Counselling Applies to Me?");

  assert(stateDirPos !== -1, "1. State Directory section exists with id='state-directories'");
  assert(whatIsNeetPos !== -1, "2. 'What Is NEET Counselling?' section exists");
  assert(whichCounsellingPos !== -1, "3. 'Which Counselling Applies to Me?' section exists");

  assert(stateDirPos < whatIsNeetPos, "4. State Directory appears BEFORE 'What Is NEET Counselling?'");
  assert(whatIsNeetPos < whichCounsellingPos, "5. 'What Is NEET Counselling?' appears BEFORE 'Which Counselling Applies to Me?'");

  console.log("\n[TEST GROUP 2] Public Copy Hygiene");
  assert(!html.includes("server-rendered"), "6. Developer wording 'server-rendered' is removed from public HTML");
  assert(html.includes("Understand the counselling process, explore medical colleges by state"), "7. Compact hero copy is present");
  assert(html.includes("Important Notice:"), "8. Important Notice safety text is preserved");

  console.log("\n[TEST GROUP 3] Crawlability & State Links Coverage");
  const allSlugs = getAllStateHubSlugs();
  let foundCount = 0;
  const missingSlugs: string[] = [];

  for (const slug of allSlugs) {
    const expectedHref = `/neet-to-mbbs/counselling/state/${slug}`;
    if (html.includes(expectedHref)) {
      foundCount++;
    } else {
      missingSlugs.push(slug);
    }
  }

  console.log(`  State links expected: ${allSlugs.length}`);
  console.log(`  State links found in server HTML: ${foundCount}`);
  console.log(`  Missing: ${missingSlugs.length}`);

  assert(foundCount === allSlugs.length, `9. All ${allSlugs.length} state links present in server HTML`);
  assert(missingSlugs.length === 0, "10. Zero missing state links");

  console.log("\n==================================================================");
  console.log("ALL 10 UX & CRAWLABILITY TESTS PASSED SUCCESSFULLY!");
  console.log("==================================================================");
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
