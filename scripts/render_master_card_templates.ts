import fs from "fs";
import path from "path";
import sharp from "sharp";

async function renderTemplates() {
  console.log("==================================================================");
  console.log("RENDERING MASTER SOCIAL CARD TEMPLATES TO PNG");
  console.log("==================================================================");

  const tmpDir = path.join(process.cwd(), "tmp");
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  const svgPath = path.join(process.cwd(), "public/images/design-reference/college-social-card-master.svg");
  const masterSvgContent = fs.readFileSync(svgPath, "utf-8");

  // -------------------------------------------------------------
  // 1. SMS Medical College Jaipur (Master Default)
  // -------------------------------------------------------------
  console.log("\n[1] Rendering SMS Medical College Jaipur Master Card...");
  const smsJaipurPngPath = path.join(tmpDir, "college-social-card-master-sms-jaipur.png");
  await sharp(Buffer.from(masterSvgContent), { density: 150 })
    .resize(1200, 630)
    .png()
    .toFile(smsJaipurPngPath);
  console.log(`  ✅ Saved: ${smsJaipurPngPath}`);

  // -------------------------------------------------------------
  // 2. Long Name College (NAMO Medical Education & Research Institute)
  // -------------------------------------------------------------
  console.log("\n[2] Rendering Long Canonical Name College Card...");
  const longNameSvgContent = masterSvgContent
    .replace(
      `<text x="0" y="44" class="font-sans" font-size="48" font-weight="900" fill="#082046" letter-spacing="-0.8">\n        SMS MEDICAL COLLEGE,\n      </text>\n      <text x="0" y="100" class="font-sans" font-size="54" font-weight="900" fill="#082046" letter-spacing="-0.8">\n        JAIPUR\n      </text>`,
      `<text x="0" y="28" class="font-sans" font-size="28" font-weight="900" fill="#082046" letter-spacing="-0.5">\n        NAMO MEDICAL EDUCATION &amp; RESEARCH\n      </text>\n      <text x="0" y="60" class="font-sans" font-size="28" font-weight="900" fill="#082046" letter-spacing="-0.5">\n        INSTITUTE, SILVASSA (UT OF D&amp;NH AND D&amp;D)\n      </text>\n      <text x="0" y="94" class="font-sans" font-size="20" font-weight="700" fill="#64748b">\n        (Formerly Shri Vinoba Bhave Institute of Medical Sciences)\n      </text>`
    )
    .replace(
      `<text x="24" y="16" class="font-sans" font-size="19" font-weight="800" fill="#082046">Jaipur, Rajasthan</text>`,
      `<text x="24" y="16" class="font-sans" font-size="18" font-weight="800" fill="#082046">Silvassa, D&amp;NH and D&amp;D</text>`
    )
    .replace(
      `<text x="160" y="110" text-anchor="middle" class="font-sans" font-size="84" font-weight="900" fill="url(#goldGrad)" letter-spacing="-2">\n          938\n        </text>`,
      `<text x="160" y="110" text-anchor="middle" class="font-sans" font-size="78" font-weight="900" fill="url(#goldGrad)" letter-spacing="-2">\n          8,073\n        </text>`
    )
    .replace(
      `<text x="56" y="112" text-anchor="middle" class="font-sans" font-size="42" font-weight="900" fill="#22c55e">584</text>`,
      `<text x="56" y="112" text-anchor="middle" class="font-sans" font-size="38" font-weight="900" fill="#22c55e">6,979</text>`
    )
    .replace(
      `<text x="48" y="112" text-anchor="middle" class="font-sans" font-size="38" font-weight="900" fill="#38bdf8">1,144</text>`,
      `<text x="48" y="112" text-anchor="middle" class="font-sans" font-size="38" font-weight="900" fill="#38bdf8">9,157</text>`
    )
    .replace(
      `<text x="84" y="68" text-anchor="middle" class="font-sans" font-size="46" font-weight="900" fill="#082046">250</text>`,
      `<text x="84" y="68" text-anchor="middle" class="font-sans" font-size="46" font-weight="900" fill="#082046">177</text>`
    )
    .replace(
      `<text x="84" y="80" text-anchor="middle" class="font-sans" font-size="18" font-weight="900" fill="#082046" letter-spacing="0.5">RAJASTHAN</text>`,
      `<text x="84" y="80" text-anchor="middle" class="font-sans" font-size="16" font-weight="900" fill="#082046" letter-spacing="0.5">D&amp;NH &amp; DD</text>`
    );

  const longNamePngPath = path.join(tmpDir, "college-social-card-master-long-name.png");
  await sharp(Buffer.from(longNameSvgContent), { density: 150 })
    .resize(1200, 630)
    .png()
    .toFile(longNamePngPath);
  console.log(`  ✅ Saved: ${longNamePngPath}`);

  // -------------------------------------------------------------
  // 3. Missing-AIR Fallback State Card (Non-MCC)
  // -------------------------------------------------------------
  console.log("\n[3] Rendering Non-MCC Missing-AIR Fallback Card...");
  const noAirEvidenceBlock = `
      <!-- Deep Navy Rounded Container -->
      <rect x="0" y="0" width="636" height="192" rx="18" ry="18" fill="url(#navyPanelGrad)" stroke="#1e3a8a" stroke-width="1.5" />

      <!-- Center Informational Fallback Block -->
      <g transform="translate(32, 28)">
        <text x="0" y="24" class="font-sans" font-size="15" font-weight="800" fill="#93c5fd" letter-spacing="1.5">
          MCC ROUND-1 AIR EVIDENCE
        </text>
        <text x="0" y="68" class="font-sans" font-size="36" font-weight="900" fill="#ffffff">
          Not Available
        </text>
        <text x="0" y="104" class="font-sans" font-size="15" font-weight="500" fill="#cbd5e1">
          Allotments for this institution are conducted by State Counselling Authorities.
        </text>
        <text x="0" y="132" class="font-sans" font-size="14" font-weight="600" fill="#38bdf8">
          Explore college profile on MBBS Foundation™ for approved seat information.
        </text>
      </g>
  `;

  const noAirSvgContent = masterSvgContent
    .replace(
      `<text x="0" y="44" class="font-sans" font-size="48" font-weight="900" fill="#082046" letter-spacing="-0.8">\n        SMS MEDICAL COLLEGE,\n      </text>\n      <text x="0" y="100" class="font-sans" font-size="54" font-weight="900" fill="#082046" letter-spacing="-0.8">\n        JAIPUR\n      </text>`,
      `<text x="0" y="44" class="font-sans" font-size="44" font-weight="900" fill="#082046" letter-spacing="-0.8">\n        FATHER MULLERS MEDICAL\n      </text>\n      <text x="0" y="98" class="font-sans" font-size="44" font-weight="900" fill="#082046" letter-spacing="-0.8">\n        COLLEGE, MANGALORE\n      </text>`
    )
    .replace(
      `<text x="24" y="16" class="font-sans" font-size="19" font-weight="800" fill="#082046">Jaipur, Rajasthan</text>`,
      `<text x="24" y="16" class="font-sans" font-size="19" font-weight="800" fill="#082046">Mangalore, Karnataka</text>`
    )
    .replace(
      `fill="url(#greenBadgeGrad)"`,
      `fill="#1e293b"`
    )
    .replace(
      `Government Medical College`,
      `Private Medical College`
    )
    .replace(
      `<text x="84" y="68" text-anchor="middle" class="font-sans" font-size="46" font-weight="900" fill="#082046">250</text>`,
      `<text x="84" y="68" text-anchor="middle" class="font-sans" font-size="46" font-weight="900" fill="#082046">150</text>`
    )
    .replace(
      `<text x="84" y="68" text-anchor="middle" class="font-sans" font-size="18" font-weight="900" fill="#15803d" letter-spacing="0.5">GOVERNMENT</text>`,
      `<text x="84" y="68" text-anchor="middle" class="font-sans" font-size="18" font-weight="900" fill="#64748b" letter-spacing="0.5">PRIVATE</text>`
    )
    .replace(
      `<text x="84" y="80" text-anchor="middle" class="font-sans" font-size="18" font-weight="900" fill="#082046" letter-spacing="0.5">RAJASTHAN</text>`,
      `<text x="84" y="80" text-anchor="middle" class="font-sans" font-size="18" font-weight="900" fill="#082046" letter-spacing="0.5">KARNATAKA</text>`
    )
    // Replace the navy evidence panel inner with fallback block
    .replace(
      /<!-- Left Column: BEST AIR -->[\s\S]*?<!-- Bottom Evidence Context Line -->[\s\S]*?<\/g>\s*<\/g>/,
      `${noAirEvidenceBlock}\n    </g>`
    );

  const noAirPngPath = path.join(tmpDir, "college-social-card-master-no-air.png");
  await sharp(Buffer.from(noAirSvgContent), { density: 150 })
    .resize(1200, 630)
    .png()
    .toFile(noAirPngPath);
  console.log(`  ✅ Saved: ${noAirPngPath}`);

  console.log("\n==================================================================");
  console.log("ALL 3 MASTER CARD TEMPLATES RENDERED SUCCESSFULLY");
  console.log("==================================================================");
}

renderTemplates().catch(console.error);
