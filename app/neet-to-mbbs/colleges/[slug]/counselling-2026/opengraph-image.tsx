import sharp from "sharp";
import { getCollegeEvidenceBySlug } from "@/lib/counselling/evidenceService";
import { getPrimaryOpenBenchmark } from "@/lib/counselling/pathwayOrdering";
import { generateCollegeSocialCardSvg } from "@/lib/counselling/collegeSocialCardSvg";

export const runtime = "nodejs";

export const alt = "Medical College NEET-UG 2026 Allotment Evidence & MBBS Seats";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export default async function Image({ params }: Props): Promise<Response> {
  let college = null;
  let primaryBenchmark = null;

  try {
    const resolvedParams = await params;
    const slug = resolvedParams?.slug
      ? decodeURIComponent(resolvedParams.slug).trim().toLowerCase()
      : "";
    if (slug) {
      college = await getCollegeEvidenceBySlug(slug);
      if (college && college.allCategoryProfiles) {
        primaryBenchmark = getPrimaryOpenBenchmark(college.allCategoryProfiles);
      }
    }
  } catch (err) {
    console.error("Error generating college OG image:", err);
  }

  const svg = generateCollegeSocialCardSvg(college, primaryBenchmark);
  const pngBuffer = await sharp(Buffer.from(svg), { density: 150 })
    .resize(1200, 630)
    .png()
    .toBuffer();

  return new Response(pngBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
