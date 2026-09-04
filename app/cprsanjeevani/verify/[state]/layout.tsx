import { Metadata } from "next";
import { slugToCanonicalState } from "@/lib/cprSlug";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const rawSlug = resolvedParams?.state || "";
  const canonicalState = slugToCanonicalState(rawSlug) || "State";

  const title = `National IAP CPR Day 2026 — ${canonicalState} Report Verification`;
  const description = `Course Coordinators are requested to review the Draft State Programme Report and verify or suggest corrections for their course/venue details by 7 September 2026, 23:59 hrs IST.`;
  const ogImageUrl = "https://mbbsfoundation.com/cprday/og-cprday.jpg";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://mbbsfoundation.com/cprsanjeevani/verify/${rawSlug}`,
      siteName: "CPR Sanjeevani — Indian Academy of Pediatrics",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `National IAP CPR Day 2026 — ${canonicalState} Verification`,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default function StateVerificationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
