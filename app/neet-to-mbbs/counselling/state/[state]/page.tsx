import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import NeetSubNav from "@/components/neet-to-mbbs/NeetSubNav";
import {
  getStateHubData,
  getAllStateHubSlugs,
  CANONICAL_STATES,
} from "@/lib/counselling/stateHubService";

export const dynamic = "force-dynamic";

const STATIC_OG_IMAGE_URL = "https://mbbsfoundation.com/images/og-neet-planner-2026-custom.png?v=2";

interface Props {
  params: Promise<{
    state: string;
  }>;
}

export async function generateStaticParams() {
  return getAllStateHubSlugs().map((slug) => ({ state: slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const stateSlug = resolvedParams?.state ? decodeURIComponent(resolvedParams.state).trim().toLowerCase() : "";
    const data = stateSlug ? await getStateHubData(stateSlug) : null;

    if (!data) {
      return {
        title: "State Medical Colleges Not Found | MBBS Foundation",
        description: "The requested state medical college counselling directory could not be found.",
        openGraph: {
          title: "NEET Counselling State Directory | MBBS Foundation",
          description: "Explore state-wise medical colleges, approved MBBS seats, and NEET-UG 2026 counselling evidence.",
          images: [
            {
              url: STATIC_OG_IMAGE_URL,
              width: 1200,
              height: 630,
              alt: "NEET-UG 2026 State Counselling Directory | MBBS Foundation",
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

    const title = `${data.stateName} NEET 2026 Counselling & Medical Colleges | MBBS Foundation`;
    const description = `Explore ${data.summary.totalColleges} medical colleges and approximately ${data.summary.totalSeats.toLocaleString("en-IN")} approved MBBS seats in ${data.stateName}, with available MCC NEET-UG 2026 Round-1 AIR patterns and college-level evidence.`;
    const canonical = `https://mbbsfoundation.com/neet-to-mbbs/counselling/state/${data.stateSlug}`;

    const ogTitle = `${data.stateName} NEET-UG 2026 Counselling & Medical Colleges`;
    const ogDescription = `Explore ${data.summary.totalColleges} medical colleges in ${data.stateName} with approved MBBS intake, government vs private seat capacity, and MCC Round-1 allotment AIR patterns.`;

    return {
      title,
      description,
      alternates: {
        canonical,
      },
      keywords: [
        `${data.stateName} NEET counselling 2026`,
        `${data.stateName} medical colleges 2026`,
        `MBBS colleges in ${data.stateName}`,
        `${data.stateName} MBBS seats 2026`,
        `${data.stateName} NEET Round 1 AIR patterns`,
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
            url: STATIC_OG_IMAGE_URL,
            width: 1200,
            height: 630,
            alt: `${data.stateName} NEET-UG 2026 Counselling & Medical Colleges`,
            type: "image/png",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: ogTitle,
        description: ogDescription,
        images: [STATIC_OG_IMAGE_URL],
      },
    };
  } catch (err) {
    return {
      title: "State Medical Colleges NEET 2026 | MBBS Foundation",
      description: "NEET-UG 2026 state-wise medical colleges, approved MBBS seats, and MCC Round-1 allotment distributions.",
      openGraph: {
        title: "NEET-UG 2026 State Counselling Directory | MBBS Foundation",
        images: [{ url: STATIC_OG_IMAGE_URL, width: 1200, height: 630 }],
      },
      twitter: {
        card: "summary_large_image",
        images: [STATIC_OG_IMAGE_URL],
      },
    };
  }
}

export default async function StateCounsellingPage({ params }: Props) {
  let data = null;
  try {
    const resolvedParams = await params;
    const stateSlug = resolvedParams?.state ? decodeURIComponent(resolvedParams.state).trim().toLowerCase() : "";
    if (stateSlug) {
      data = await getStateHubData(stateSlug);
    }
  } catch (err) {
    console.error("Error loading state hub data:", err);
  }

  if (!data) {
    notFound();
  }

  const canonicalUrl = `https://mbbsfoundation.com/neet-to-mbbs/counselling/state/${data.stateSlug}`;

  // Structured Data (BreadcrumbList & CollectionPage)
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
            "name": data.stateName,
            "item": canonicalUrl,
          },
        ],
      },
      {
        "@type": "CollectionPage",
        "name": `${data.stateName} Medical Colleges & NEET 2026 Counselling Directory`,
        "url": canonicalUrl,
        "description": `Factual counselling evidence and seat capacity matrix for ${data.summary.totalColleges} medical colleges in ${data.stateName}.`,
        "mainEntity": {
          "@type": "ItemList",
          "numberOfItems": data.colleges.length,
          "itemListElement": data.colleges.map((c, idx) => ({
            "@type": "ListItem",
            "position": idx + 1,
            "name": c.cleanName,
            "url": `https://mbbsfoundation.com/neet-to-mbbs/colleges/${c.slug}/counselling-2026`,
          })),
        },
      },
    ],
  };

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
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/neet-to-mbbs" className="hover:text-slate-900 transition">
            NEET to MBBS
          </Link>
          <span>/</span>
          <Link href="/neet-to-mbbs/counselling" className="hover:text-slate-900 transition">
            Counselling
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">{data.stateName}</span>
        </nav>

        {/* Page Hero Header */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-block rounded-md bg-blue-100 border border-blue-200 px-2.5 py-1 text-xs font-bold text-blue-900 uppercase tracking-wider">
              State Counselling Hub
            </span>
            <span className="text-xs font-semibold text-slate-500">
              📍 {data.stateName} ({data.summary.totalColleges} Institutions)
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
            {data.stateName} NEET-UG 2026 Counselling &amp; Medical Colleges
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
            Explore {data.summary.totalColleges} MBBS medical colleges and approximately{" "}
            <strong className="font-semibold text-slate-900">
              {data.summary.totalSeats.toLocaleString("en-IN")} approved MBBS seats
            </strong>{" "}
            in {data.stateName}, along with official MCC Round-1 allotment distributions and college-level evidence.
          </p>
        </div>

        {/* State Evidence Snapshot Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Colleges</p>
            <p className="text-2xl font-black text-slate-950">{data.summary.totalColleges}</p>
            <p className="text-[11px] text-slate-500 font-medium">In {data.stateName}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Approved Seats</p>
            <p className="text-2xl font-black text-blue-900">~{data.summary.totalSeats.toLocaleString("en-IN")}</p>
            <p className="text-[11px] text-slate-500 font-medium">Total MBBS intake</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Government</p>
            <p className="text-2xl font-black text-emerald-900">{data.summary.govtColleges}</p>
            <p className="text-[11px] text-slate-500 font-medium">{data.summary.govtSeats.toLocaleString("en-IN")} MBBS seats</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Private / Trust</p>
            <p className="text-2xl font-black text-purple-900">{data.summary.privateColleges}</p>
            <p className="text-[11px] text-slate-500 font-medium">{data.summary.privateSeats.toLocaleString("en-IN")} MBBS seats</p>
          </div>

          {data.summary.deemedColleges > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Deemed Univ.</p>
              <p className="text-2xl font-black text-amber-900">{data.summary.deemedColleges}</p>
              <p className="text-[11px] text-slate-500 font-medium">{data.summary.deemedSeats.toLocaleString("en-IN")} MBBS seats</p>
            </div>
          )}

          {data.summary.centralIniColleges > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Central / INI</p>
              <p className="text-2xl font-black text-indigo-900">{data.summary.centralIniColleges}</p>
              <p className="text-[11px] text-slate-500 font-medium">{data.summary.centralIniSeats.toLocaleString("en-IN")} MBBS seats</p>
            </div>
          )}

          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-2xs space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-900">MCC R1 Evidence</p>
            <p className="text-2xl font-black text-blue-950">{data.summary.collegesWithMccEvidence}</p>
            <p className="text-[11px] text-blue-700 font-medium">Colleges with AIR data</p>
          </div>
        </div>

        {/* Counselling & Domicile Advisory Notice */}
        <div className="rounded-2xl bg-amber-50/70 border border-amber-200/90 p-4 text-xs text-amber-950 space-y-1.5 leading-relaxed">
          <div className="font-bold text-amber-950 flex items-center gap-1.5">
            <span>ℹ️</span> Domicile &amp; State Counselling Advisory
          </div>
          <p>
            State-level seat distribution and candidate eligibility depend on the relevant state counselling authority,
            state domicile regulations, institutional category, and specific quota rules.
            The evidence below combines verified institutional MBBS capacity with available MCC Round-1 All India
            and Central counselling allotment data.
          </p>
          <p className="text-[11px] text-amber-900">
            <strong>Note on AIR Benchmarks:</strong> Observed Round-1 AIRs represent factual allotment distribution benchmarks
            and should not be interpreted as guaranteed or official future closing cutoffs.
          </p>
        </div>

        {/* Medical College Directory Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-950">
                Medical Colleges in {data.stateName} ({data.colleges.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Ordered by MCC Round-1 Typical (Median) AIR benchmark where available, followed by alphabetical listing.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 shrink-0">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <span>MCC Evidence: {data.summary.collegesWithMccEvidence}/{data.colleges.length}</span>
            </div>
          </div>

          {/* Responsive College Table / List */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Medical College</th>
                  <th className="py-3.5 px-3">Location &amp; Type</th>
                  <th className="py-3.5 px-2 text-right">MBBS Seats</th>
                  <th className="py-3.5 px-3 text-right">Best AIR</th>
                  <th className="py-3.5 px-3 text-right font-black text-blue-900">Typical (Median) AIR</th>
                  <th className="py-3.5 px-3 text-right">Last Observed AIR</th>
                  <th className="py-3.5 px-4 text-right">Evidence Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {data.colleges.map((c, idx) => {
                  let badgeColor = "bg-slate-100 text-slate-800 border-slate-200";
                  if (c.isINI || c.isCentralUniversity) badgeColor = "bg-indigo-50 text-indigo-900 border-indigo-200";
                  else if (c.isDeemed) badgeColor = "bg-amber-50 text-amber-900 border-amber-200";
                  else if (c.managementType === "GOVERNMENT") badgeColor = "bg-emerald-50 text-emerald-900 border-emerald-200";
                  else badgeColor = "bg-purple-50 text-purple-900 border-purple-200";

                  const typeLabel = c.isINI
                    ? "INI"
                    : c.isCentralUniversity
                    ? "Central Univ."
                    : c.isDeemed
                    ? "Deemed Univ."
                    : c.managementType === "GOVERNMENT"
                    ? "Government"
                    : "Private";

                  return (
                    <tr
                      key={c.id || c.slug}
                      className="hover:bg-slate-50/90 transition-colors group"
                    >
                      <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                        <Link
                          href={`/neet-to-mbbs/colleges/${c.slug}/counselling-2026`}
                          className="font-bold text-slate-950 group-hover:text-blue-600 transition block leading-snug"
                        >
                          {c.cleanName}
                        </Link>
                        {c.primaryBenchmark && (
                          <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                            Pathway: <span className="font-semibold text-slate-600">{c.primaryBenchmark.friendlyQuota}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold ${badgeColor}`}>
                            {typeLabel}
                          </span>
                          <span className="text-[11px] text-slate-500 font-normal">
                            {c.city ? `${c.city}` : data.stateName}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-2 text-right font-mono font-bold text-slate-800">
                        {c.approvedSeats > 0 ? c.approvedSeats.toLocaleString("en-IN") : "—"}
                      </td>

                      {c.hasMccEvidence && c.primaryBenchmark ? (
                        <>
                          <td className="py-3.5 px-3 text-right font-mono text-slate-700">
                            {c.primaryBenchmark.bestAIR !== null ? c.primaryBenchmark.bestAIR.toLocaleString("en-IN") : "—"}
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono font-black text-blue-700 bg-blue-50/30">
                            {c.primaryBenchmark.medianAIR !== null ? c.primaryBenchmark.medianAIR.toLocaleString("en-IN") : "—"}
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono text-slate-700">
                            {c.primaryBenchmark.highestAIR !== null ? c.primaryBenchmark.highestAIR.toLocaleString("en-IN") : "—"}
                          </td>
                        </>
                      ) : (
                        <td colSpan={3} className="py-3.5 px-3 text-center text-[11px] text-slate-400 italic bg-slate-50/40">
                          State / Non-MCC Counselling Pool
                        </td>
                      )}

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/neet-to-mbbs/colleges/${c.slug}/counselling-2026`}
                          className="inline-flex items-center gap-1 rounded-xl bg-slate-900 group-hover:bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-2xs transition shrink-0"
                        >
                          <span>Evidence</span>
                          <span aria-hidden="true">→</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Discovery & Decision Support CTAs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/80 via-white to-slate-50 p-5 flex flex-col justify-between space-y-3 shadow-2xs">
            <div className="space-y-1">
              <span className="inline-block rounded-md bg-blue-100 text-blue-900 px-2 py-0.5 text-[10px] font-black uppercase">
                Rank-Based Support
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                NEET Counselling Planner
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter your NEET-UG All India Rank to explore eligible colleges around your rank and compare multiple options.
              </p>
            </div>
            <Link
              href="/neet-to-mbbs/counselling/round-2-planner"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
            >
              Open Counselling Planner →
            </Link>
          </div>

          <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/80 via-white to-slate-50 p-5 flex flex-col justify-between space-y-3 shadow-2xs">
            <div className="space-y-1">
              <span className="inline-block rounded-md bg-purple-100 text-purple-900 px-2 py-0.5 text-[10px] font-black uppercase">
                Student Preferences
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                NEET Choice Index 2026
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                See where India&apos;s top-ranked medical aspirants landed across all 515 colleges vs. NIRF Medical Rankings.
              </p>
            </div>
            <Link
              href="/neet-to-mbbs/counselling/neet-choice-index-2026"
              className="inline-flex items-center justify-center rounded-xl bg-purple-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-800 transition"
            >
              View NEET Choice Index →
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-5 flex flex-col justify-between space-y-3 shadow-2xs">
            <div className="space-y-1">
              <span className="inline-block rounded-md bg-slate-200 text-slate-800 px-2 py-0.5 text-[10px] font-black uppercase">
                National Directory
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                All States &amp; UTs Directory
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Explore medical college directories and seat matrices across all 34 States and Union Territories of India.
              </p>
            </div>
            <Link
              href="/neet-to-mbbs/counselling#state-directories"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
            >
              View All States →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
