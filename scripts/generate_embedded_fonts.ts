import fs from "fs";
import path from "path";

const inter400 = fs.readFileSync("lib/counselling/fonts/inter-400.woff").toString("base64");
const inter700 = fs.readFileSync("lib/counselling/fonts/inter-700.woff").toString("base64");
const inter900 = fs.readFileSync("lib/counselling/fonts/inter-900.woff").toString("base64");
const cinzel700 = fs.readFileSync("lib/counselling/fonts/cinzel-700.woff").toString("base64");

const tsContent = `// Auto-generated self-contained embedded font base64 definitions for serverless SVG rasterization
// Open Source SIL Open Font License: Inter and Cinzel
export const INTER_400_BASE64 = "${inter400}";
export const INTER_700_BASE64 = "${inter700}";
export const INTER_900_BASE64 = "${inter900}";
export const CINZEL_700_BASE64 = "${cinzel700}";

export const EMBEDDED_FONT_STYLE = \`
  @font-face {
    font-family: 'CardInter';
    src: url('data:font/woff;charset=utf-8;base64,\${INTER_400_BASE64}') format('woff');
    font-weight: 400;
    font-style: normal;
  }
  @font-face {
    font-family: 'CardInter';
    src: url('data:font/woff;charset=utf-8;base64,\${INTER_700_BASE64}') format('woff');
    font-weight: 600;
    font-style: normal;
  }
  @font-face {
    font-family: 'CardInter';
    src: url('data:font/woff;charset=utf-8;base64,\${INTER_700_BASE64}') format('woff');
    font-weight: 700;
    font-style: normal;
  }
  @font-face {
    font-family: 'CardInter';
    src: url('data:font/woff;charset=utf-8;base64,\${INTER_900_BASE64}') format('woff');
    font-weight: 800;
    font-style: normal;
  }
  @font-face {
    font-family: 'CardInter';
    src: url('data:font/woff;charset=utf-8;base64,\${INTER_900_BASE64}') format('woff');
    font-weight: 900;
    font-style: normal;
  }
  @font-face {
    font-family: 'CardCinzel';
    src: url('data:font/woff;charset=utf-8;base64,\${CINZEL_700_BASE64}') format('woff');
    font-weight: 700;
    font-style: normal;
  }
  @font-face {
    font-family: 'CardCinzel';
    src: url('data:font/woff;charset=utf-8;base64,\${CINZEL_700_BASE64}') format('woff');
    font-weight: 900;
    font-style: normal;
  }
  .font-sans { font-family: 'CardInter', sans-serif; }
  .font-serif { font-family: 'CardCinzel', 'CardInter', serif; }
\`;
`;

fs.writeFileSync("lib/counselling/fonts/embeddedFonts.ts", tsContent);
console.log("Successfully generated lib/counselling/fonts/embeddedFonts.ts!");
