import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCollegeEvidenceBySlug } from "@/lib/counselling/evidenceService";
import {
  getPrimaryOpenBenchmark,
  getStudentFriendlyQuotaLabel,
  getPathwayGroup,
  isPrimaryOpenBenchmark,
  sortCategoryProfiles,
  getCleanCollegeDisplayName,
} from "@/lib/counselling/pathwayOrdering";
import CollegeEvidenceCard from "@/components/neet-to-mbbs/CollegeEvidenceCard";
import NeetSubNav from "@/components/neet-to-mbbs/NeetSubNav";
import ShareCollegeButton from "@/components/neet-to-mbbs/ShareCollegeButton";
import type { CollegeRound1CategoryProfile } from "@/lib/counselling/evidenceTypes";

export const dynamic = "force-dynamic";

const STATIC_OG_IMAGE_URL = "https://mbbsfoundation.com/images/og-neet-planner-2026-custom.png?v=2";

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const slug = resolvedParams?.slug ? decodeURIComponent(resolvedParams.slug).trim().toLowerCase() : "";
    const college = slug ? await getCollegeEvidenceBySlug(slug) : null;

    if (!college) {
      return {
        title: "Medical College Not Found | MBBS Foundation",
        description: "The requested medical college counselling profile could not be found.",
        openGraph: {
          title: "Medical College Explorer | MBBS Foundation",
          description: "NEET-UG 2026 Medical College Counselling & Round-1 AIR Explorer.",
          images: [
            {
              url: STATIC_OG_IMAGE_URL,
              width: 1200,
              height: 630,
              alt: "NEET-UG 2026 Medical College Explorer | MBBS Foundation",
              type: "image/png",
            },
          ],
        },
        twitter: {
          card: "summary_large_image",
          images: [STATIC_OG_IMAGE_URL],
        },
      };
    }

    const cleanName = getCleanCollegeDisplayName(college.collegeName, college.shortName);
    const openBenchmark = getPrimaryOpenBenchmark(college.allCategoryProfiles || []);
    const medianStr = openBenchmark?.medianAIR ? openBenchmark.medianAIR.toLocaleString("en-IN") : null;
    const seatStr = college.totalMBBSSeats2026 > 0 ? `${college.totalMBBSSeats2026} MBBS seats` : "MBBS capacity";

    const title = `${cleanName} NEET 2026 | Round-1 AIR Pattern & MBBS Seats`;

    let description: string;
    if (openBenchmark && medianStr) {
      if (
        college.isDeemed ||
        openBenchmark.quota.toLowerCase().includes("self-financed") ||
        openBenchmark.quota.toLowerCase().includes("management") ||
        openBenchmark.quota.toLowerCase().includes("paid")
      ) {
        description = `View ${cleanName}, ${college.state} (${seatStr}). Official MCC Round-1 Self-Financed Merit Typical Median AIR: ${medianStr}, Best AIR, Last Observed AIR, and complete category-wise allotment evidence.`;
      } else {
        description = `View ${cleanName}, ${college.state} (${seatStr}). Official MCC Round-1 Open Typical Median AIR: ${medianStr}, Best AIR, Last Observed AIR, and complete category-wise allotment evidence.`;
      }
    } else {
      description = `View ${cleanName}, ${college.state} (${seatStr}). Approved 2026 MBBS intake, management type, and available counselling evidence on MBBS Foundation™.`;
    }

    const canonical = `https://mbbsfoundation.com/neet-to-mbbs/colleges/${college.slug}/counselling-2026`;

    const ogTitle = `${cleanName} — NEET-UG 2026 Round-1 AIR Pattern`;
    const ogDescription = openBenchmark
      ? `Explore Typical (Median) AIR, Best AIR, Last Observed AIR and 2026 MBBS seat information for ${cleanName} using MCC Round-1 evidence.`
      : `Explore 2026 MBBS seat information and available counselling evidence for ${cleanName} on MBBS Foundation™.`;
    const ogImageUrl = STATIC_OG_IMAGE_URL;

    return {
      title,
      description,
      alternates: {
        canonical,
      },
      keywords: [
        `${cleanName} NEET 2026`,
        `${cleanName} cutoff 2026`,
        `${cleanName} closing rank`,
        `${cleanName} Round 1 AIR`,
        `${cleanName} MBBS seats`,
        `${college.state} medical college counselling`,
        "NEET UG 2026 counselling",
      ],
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        url: canonical,
        siteName: "MBBS Foundation",
        locale: "en_IN",
        type: "article",
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `${cleanName} NEET-UG 2026 Round-1 AIR Pattern & MBBS Seats`,
            type: "image/png",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: ogTitle,
        description: ogDescription,
        images: [ogImageUrl],
      },
    };
  } catch (err) {
    return {
      title: "NEET Medical College Counselling 2026 | MBBS Foundation",
      description: "NEET-UG 2026 MCC Round-1 allotment distributions and seat capacity matrix.",
      openGraph: {
        title: "NEET-UG 2026 Medical College Explorer | MBBS Foundation",
        description: "Official MCC Round-1 allotment patterns and 2026 MBBS seat capacity matrix.",
        images: [
          {
            url: STATIC_OG_IMAGE_URL,
            width: 1200,
            height: 630,
            alt: "NEET-UG 2026 Medical College Explorer | MBBS Foundation",
            type: "image/png",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        images: [STATIC_OG_IMAGE_URL],
      },
    };
  }
}

export default async function CollegeCounsellingPage({ params }: Props) {
  let college = null;
  try {
    const resolvedParams = await params;
    const slug = resolvedParams?.slug ? decodeURIComponent(resolvedParams.slug).trim().toLowerCase() : "";
    if (slug) {
      college = await getCollegeEvidenceBySlug(slug);
    }
  } catch (err) {
    console.error("Error loading college evidence in page:", err);
  }

  if (!college) {
    notFound();
  }

  const openBenchmark = getPrimaryOpenBenchmark(college.allCategoryProfiles);
  const sortedProfiles = sortCategoryProfiles(college.allCategoryProfiles, "STANDARD");

  const ordinaryProfiles = sortedProfiles.filter((p) => getPathwayGroup(p.quota) === "ORDINARY");
  const specialProfiles = sortedProfiles.filter((p) => getPathwayGroup(p.quota) === "SPECIAL");

  const ordinaryNonPwd = ordinaryProfiles.filter((p) => !p.isPwD);
  const ordinaryPwd = ordinaryProfiles.filter((p) => p.isPwD);
  const specialNonPwd = specialProfiles.filter((p) => !p.isPwD);
  const specialPwd = specialProfiles.filter((p) => p.isPwD);

  const canonicalUrl = `https://mbbsfoundation.com/neet-to-mbbs/colleges/${college.slug}/counselling-2026`;

  // JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://mbbsfoundation.com",
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "NEET to MBBS",
            "item": "https://mbbsfoundation.com/neet-to-mbbs",
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "Counselling",
            "item": "https://mbbsfoundation.com/neet-to-mbbs/counselling",
          },
          {
            "@type": "ListItem",
            "position": 4,
            "name": "NEET Counselling Planner",
            "item": "https://mbbsfoundation.com/neet-to-mbbs/counselling/round-2-planner",
          },
          {
            "@type": "ListItem",
            "position": 5,
            "name": college.collegeName,
            "item": canonicalUrl,
          },
        ],
      },
      {
        "@type": "EducationalOrganization",
        "name": college.collegeName,
        "address": {
          "@type": "PostalAddress",
          "addressRegion": college.state,
          "addressCountry": "IN",
          ...(college.city ? { "addressLocality": college.city } : {}),
        },
        "description": `Official NEET-UG 2026 Round-1 allotment patterns and MBBS seat capacity details for ${college.collegeName}.`,
      },
    ],
  };

  const renderProfileTable = (profiles: CollegeRound1CategoryProfile[]) => (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-slate-50/90 text-slate-600 font-bold border-b border-slate-200">
          <tr>
            <th className="py-3 px-3.5">Quota / Pathway</th>
            <th className="py-3 px-2">Category</th>
            <th className="py-3 px-2 text-right">Offered / Allotted</th>
            <th className="py-3 px-2 text-right">Best AIR</th>
            <th className="py-3 px-2 text-right font-black text-blue-900">Typical (Median) AIR</th>
            <th className="py-3 px-2 text-right">Last Observed AIR</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium">
          {profiles.map((p, idx) => {
            const isBenchmark = isPrimaryOpenBenchmark(p, college.allCategoryProfiles);
            const friendlyQuota = getStudentFriendlyQuotaLabel(p.quota);

            let catBadgeClass = "bg-slate-100 text-slate-800 border-slate-200";
            if (p.seatCategory === "EWS") catBadgeClass = "bg-amber-50 text-amber-900 border-amber-200";
            else if (p.seatCategory === "OBC") catBadgeClass = "bg-blue-50 text-blue-900 border-blue-200";
            else if (p.seatCategory === "SC") catBadgeClass = "bg-emerald-50 text-emerald-900 border-emerald-200";
            else if (p.seatCategory === "ST") catBadgeClass = "bg-purple-50 text-purple-900 border-purple-200";

            return (
              <tr
                key={`cat-prof-${idx}-${p.quota}-${p.seatCategory}-${p.isPwD}`}
                className={`hover:bg-slate-50/80 transition-colors ${
                  isBenchmark ? "bg-blue-50/40 font-semibold" : ""
                }`}
              >
                <td className="py-3 px-3.5">
                  <div className="font-bold text-slate-900 leading-tight">{friendlyQuota}</div>
                  {friendlyQuota !== p.quota && (
                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">Source: {p.quota}</div>
                  )}
                  {isBenchmark && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 text-blue-900 px-1.5 py-0.5 text-[9px] font-black uppercase mt-1">
                      Primary Open Benchmark
                    </span>
                  )}
                </td>
                <td className="py-3 px-2">
                  <div className="flex items-center gap-1">
                    <span className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${catBadgeClass}`}>
                      {p.seatCategory}
                    </span>
                    {p.isPwD && (
                      <span className="rounded-md bg-purple-100 border border-purple-200 text-purple-800 text-[10px] font-extrabold px-1.5 py-0.5">
                        PwD
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-2 text-right text-slate-600 font-mono">
                  {p.seatsOffered}
                  <span className="text-[10px] text-slate-400 ml-1">/ {p.seatsAllotted}</span>
                </td>
                <td className="py-3 px-2 text-right font-mono text-slate-700">
                  {p.bestAIR !== null ? p.bestAIR.toLocaleString("en-IN") : "—"}
                </td>
                <td className="py-3 px-2 text-right font-mono font-black text-blue-700">
                  {p.medianAIR !== null ? p.medianAIR.toLocaleString("en-IN") : "—"}
                </td>
                <td className="py-3 px-2 text-right font-mono text-slate-700">
                  {p.highestAIR !== null ? p.highestAIR.toLocaleString("en-IN") : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Sub Navigation */}
      <NeetSubNav />

      {/* Main Container */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 pt-6 sm:pt-8 pb-16 space-y-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/neet-to-mbbs" className="hover:text-slate-900 transition">
            NEET to MBBS
          </Link>
          <span>/</span>
          <Link href="/neet-to-mbbs/counselling" className="hover:text-slate-900 transition">
            Counselling
          </Link>
          <span>/</span>
          <Link href="/neet-to-mbbs/counselling/round-2-planner" className="hover:text-slate-900 transition">
            Counselling Planner
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold truncate max-w-xs sm:max-w-md">{college.collegeName}</span>
        </nav>

        {/* Page Header */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-block rounded-md bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-bold text-blue-800">
                {college.managementType}
              </span>
              {college.isINI && (
                <span className="inline-block rounded-md bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-bold text-indigo-700">
                  Institute of National Importance (INI)
                </span>
              )}
              {college.isDeemed && (
                <span className="inline-block rounded-md bg-purple-50 border border-purple-200 px-2.5 py-1 text-xs font-bold text-purple-700">
                  Deemed University
                </span>
              )}
              {college.isCentralUniversity && (
                <span className="inline-block rounded-md bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-bold text-blue-800">
                  Central University
                </span>
              )}
              {college.isESIC && (
                <span className="inline-block rounded-md bg-teal-50 border border-teal-200 px-2.5 py-1 text-xs font-bold text-teal-800">
                  ESIC Institution
                </span>
              )}
              <span className="text-xs text-slate-500 font-semibold">📍 {college.city ? `${college.city}, ${college.state}` : college.state}</span>
            </div>

            <ShareCollegeButton
              collegeName={college.collegeName}
              canonicalUrl={canonicalUrl}
            />
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
            {college.collegeName}
          </h1>

          <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
            NEET-UG 2026 MCC Round-1 allotment distributions, category-wise AIR benchmarks, and MBBS seat capacity
            matrix based on official authorities data.
          </p>
        </div>

        {/* Highlight Factual Card */}
        <div className="max-w-xl">
          <CollegeEvidenceCard college={college} />
        </div>

        {/* Explanatory Methodology Note for Searchers */}
        <div className="rounded-2xl bg-blue-50/50 border border-blue-100 p-4 text-xs text-slate-600 space-y-1.5 leading-relaxed">
          <div className="font-bold text-blue-950 flex items-center gap-1.5">
            <span>ℹ️</span> Understanding NEET Allotment Patterns vs &ldquo;Cutoffs&rdquo;
          </div>
          <p>
            Students and parents frequently search for this information as a <em>NEET cutoff</em> or <em>closing rank</em>.
            In this authoritative analysis, we report the factual <strong>Last Observed AIR</strong> allotted in MCC Round 1,
            along with the <strong>Typical (Median) AIR</strong> to provide a realistic understanding of where allotments clustered.
          </p>
        </div>

        {/* Detailed Category Breakdown Table */}
        <div className="space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              All Quotas &amp; Categories — MCC Round-1 Evidence ({college.allCategoryProfiles.length} Pathways)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Standard hierarchical view prioritizing ordinary merit pathways first, followed by reserved and special categories.
            </p>
          </div>

          {/* 1. Ordinary Non-PwD Profiles */}
          {ordinaryNonPwd.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                1. Standard / General Merit Pathways
              </h3>
              {renderProfileTable(ordinaryNonPwd)}
            </div>
          )}

          {/* 2. Ordinary PwD Profiles */}
          {ordinaryPwd.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>♿</span> 2. Persons with Benchmark Disabilities (PwD) Pathways
              </h3>
              {renderProfileTable(ordinaryPwd)}
            </div>
          )}

          {/* 3. Special / Minority Pathways */}
          {specialNonPwd.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                3. Special / Minority / Institutional Pathways
              </h3>
              {renderProfileTable(specialNonPwd)}
            </div>
          )}

          {/* 4. Special PwD Pathways */}
          {specialPwd.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                4. Special / Institutional PwD Pathways
              </h3>
              {renderProfileTable(specialPwd)}
            </div>
          )}

          {college.allCategoryProfiles.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              No MCC Round-1 allotments recorded for this institution in the current dataset.
            </div>
          )}
        </div>

        {/* CTAs: Interactive Planner & MBBS Foundation Book */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
          {/* Interactive Planner CTA */}
          <div className="rounded-3xl border border-blue-200 bg-linear-to-br from-blue-50/70 via-white to-slate-50 p-6 flex flex-col justify-between space-y-4 shadow-xs">
            <div className="space-y-2">
              <span className="inline-block rounded-md bg-blue-100 text-blue-900 px-2 py-0.5 text-[10px] font-black uppercase">
                Interactive Decision Support
              </span>
              <h3 className="text-base font-extrabold text-slate-900">
                Explore Choices for Your Exact AIR
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter your NEET-UG 2026 All India Rank to view colleges around your rank, explore your domicile state colleges,
                and compare multiple institutions side-by-side.
              </p>
            </div>
            <Link
              href="/neet-to-mbbs/counselling/round-2-planner"
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
            >
              Open NEET Counselling Planner →
            </Link>
          </div>

          {/* MBBS Foundation Book CTA */}
          <div className="rounded-3xl border border-emerald-200 bg-linear-to-br from-emerald-50/60 via-white to-slate-50 p-6 flex flex-col justify-between space-y-4 shadow-xs">
            <div className="space-y-2">
              <span className="inline-block rounded-md bg-emerald-100 text-emerald-900 px-2 py-0.5 text-[10px] font-black uppercase">
                First-Year Medical Guide
              </span>
              <h3 className="text-base font-extrabold text-slate-900">
                MBBS Foundation: Your First Book of Medicine
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Step into medical college with clarity. Learn essential clinical foundations, CPR, first aid, medical ethics,
                and practical survival strategies for first-year MBBS.
              </p>
            </div>
            <Link
              href="/book"
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
            >
              Explore the Book 📖
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
