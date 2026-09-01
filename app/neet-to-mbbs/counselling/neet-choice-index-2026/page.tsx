import type { Metadata } from "next";
import Link from "next/link";
import NeetSubNav from "@/components/neet-to-mbbs/NeetSubNav";
import ShareChoiceIndexButton from "@/components/neet-to-mbbs/ShareChoiceIndexButton";
import {
  getChoiceIndexTop25,
  getHeadlineContrasts,
  type ChoiceIndexItem,
} from "@/lib/counselling/choiceIndexData";

export const metadata: Metadata = {
  title: "NEET Choice Index 2026 vs NIRF | MBBS Foundation",
  description:
    "Compare MCC NEET-UG 2026 Round-1 allotment AIR patterns with NIRF Medical Rankings 2025. See where India's leading medical colleges stand in the NEET Choice Index 2026.",
  alternates: {
    canonical: "https://mbbsfoundation.com/neet-to-mbbs/counselling/neet-choice-index-2026",
  },
  keywords: [
    "NEET Choice Index 2026",
    "NEET medical college ranking",
    "NEET 2026 college AIR",
    "NIRF medical ranking 2025",
    "MCC Round-1 medical colleges",
    "NEET UG counselling 2026",
    "top medical colleges in India",
    "AIIMS NEET cutoff 2026",
    "MAMC vs NIRF",
  ],
  openGraph: {
    title: "NEET Choice Index 2026 vs NIRF: Do Students and Rankings Agree?",
    description:
      "Compare MCC NEET-UG 2026 Round-1 allotment AIR patterns with NIRF Medical Rankings 2025. See where India's leading medical colleges stand.",
    url: "https://mbbsfoundation.com/neet-to-mbbs/counselling/neet-choice-index-2026",
    siteName: "MBBS Foundation",
    locale: "en_IN",
    type: "article",
    images: [
      {
        url: "https://mbbsfoundation.com/images/og-neet-planner-2026-custom.png?v=2",
        width: 1200,
        height: 630,
        alt: "NEET Choice Index 2026 vs NIRF | MBBS Foundation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NEET Choice Index 2026 vs NIRF: Do Students and Rankings Agree?",
    description:
      "Compare MCC NEET-UG 2026 Round-1 allotment AIR patterns with NIRF Medical Rankings 2025. See where India's leading medical colleges stand.",
    images: ["https://mbbsfoundation.com/images/og-neet-planner-2026-custom.png?v=2"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "name": "MBBS Foundation",
      "url": "https://mbbsfoundation.com",
    },
    {
      "@type": "WebPage",
      "name": "NEET Choice Index 2026 vs NIRF Medical Rankings",
      "url": "https://mbbsfoundation.com/neet-to-mbbs/counselling/neet-choice-index-2026",
      "description":
        "Allotment-based comparison of NEET-UG 2026 Round-1 AIR patterns and NIRF 2025 Medical Rankings.",
    },
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
          "name": "NEET Choice Index 2026",
          "item": "https://mbbsfoundation.com/neet-to-mbbs/counselling/neet-choice-index-2026",
        },
      ],
    },
  ],
};

export default function NeetChoiceIndexPage() {
  const top25 = getChoiceIndexTop25();
  const contrastColleges = getHeadlineContrasts();

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
      <main className="mx-auto max-w-5xl px-4 sm:px-6 pt-6 sm:pt-8 pb-24 space-y-8">
        {/* Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs font-semibold text-slate-500"
        >
          <Link href="/neet-to-mbbs" className="hover:text-slate-900 transition">
            NEET to MBBS
          </Link>
          <span>/</span>
          <Link href="/neet-to-mbbs/counselling" className="hover:text-slate-900 transition">
            Counselling
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">NEET Choice Index 2026</span>
        </nav>

        {/* 1. Compact Hero Header */}
        <section className="rounded-3xl border border-slate-200 bg-linear-to-b from-white via-slate-50/50 to-blue-50/20 p-5 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
            <div className="max-w-2xl space-y-2.5">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-blue-900">
                <span>📊</span>
                <span>Allotment Analysis • 2026</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900">
                NEET Choice Index 2026
              </h1>
              <p className="text-base sm:text-lg font-bold text-slate-700">
                Where are India's top-ranked MBBS aspirants actually landing?
              </p>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                An allotment-based view of medical colleges using MCC NEET-UG 2026 Round-1 AIR
                patterns — compared with NIRF Medical Rankings 2025.
              </p>
            </div>

            <div className="shrink-0 sm:pt-1">
              <ShareChoiceIndexButton canonicalUrl="https://mbbsfoundation.com/neet-to-mbbs/counselling/neet-choice-index-2026" />
            </div>
          </div>
        </section>

        {/* 2. Opening Curiosity Narrative */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs space-y-3">
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span>💡</span>
            <span>Do India's institutional rankings match where the strongest NEET AIRs land?</span>
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
            MBBS Foundation™ analysed MCC NEET-UG 2026 Round-1 allotments and arranged medical
            colleges according to their <strong>Typical (Median) AIR</strong> in their primary
            ordinary Open pathway. Then we compared those observed positions with the Ministry of
            Education's <strong>NIRF Medical Rankings 2025</strong>.
          </p>
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
            <span className="font-bold text-blue-950">At the very top, there is agreement: </span>
            <strong>AIIMS New Delhi is #1 in both.</strong> Further down the list, however, the
            picture becomes much more interesting.
          </div>
        </section>

        {/* 3. Headline Contrast Cards */}
        <section className="space-y-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-blue-900">
              <span>⚡</span>
              <span>Positional Insights</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Where Do the Two Lists Differ?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              A side-by-side look at colleges showing distinctive positional differences between
              observed Round-1 candidate allotments and institutional ranking scorecards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contrastColleges.map((col) => {
              const isHigherInNeet = (col.rankDifference ?? 0) > 0;
              return (
                <div
                  key={col.collegeId}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header with Title & State */}
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        {col.state} • {col.instituteType}
                      </span>
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug pt-0.5">
                        {col.collegeName}
                      </h3>
                    </div>

                    {/* Rank Comparison Badges */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-2.5 text-center">
                        <div className="text-[10px] font-bold uppercase text-blue-950">
                          NEET Choice
                        </div>
                        <div className="text-lg font-black text-blue-900">
                          #{col.choiceIndexRank}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-center">
                        <div className="text-[10px] font-bold uppercase text-slate-700">
                          NIRF 2025
                        </div>
                        <div className="text-lg font-black text-slate-800">
                          {col.nirf2025Rank ? `#${col.nirf2025Rank}` : "Not in Top 50"}
                        </div>
                      </div>
                    </div>

                    {/* Evidence Points */}
                    <div className="space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-2.5">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Typical (Median) AIR:</span>
                        <span className="font-bold text-slate-900">{col.medianAIR}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Primary Pathway:</span>
                        <span className="font-semibold text-slate-800">{col.primaryQuota}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Positional Difference:</span>
                        <span className="font-bold text-slate-900">
                          {isHigherInNeet
                            ? `+${col.rankDifference} places in Choice Index`
                            : `${col.rankDifference} places in Choice Index`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Link to College Page */}
                  <Link
                    href={`/neet-to-mbbs/colleges/${col.slug}/counselling-2026`}
                    className="inline-flex items-center justify-between w-full pt-2 text-xs font-bold text-blue-700 hover:text-blue-900 group"
                  >
                    <span>View College Page</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. Top 25 Section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-blue-900">
                <span>🏆</span>
                <span>Observed Allotments</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Top 25 — NEET Choice Index 2026
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Arranged by Typical (Median) AIR observed in MCC NEET-UG 2026 Round-1 primary ordinary Open pathways.
              </p>
            </div>
            <div className="text-xs text-slate-600 font-medium">
              Showing 25 of 515 evaluated colleges
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-3.5 text-center w-12">Rank</th>
                    <th className="py-3.5 px-4 min-w-[240px]">Medical College</th>
                    <th className="py-3.5 px-3 text-center min-w-[110px]">Typical (Median) AIR</th>
                    <th className="py-3.5 px-3 text-center min-w-[90px]">NIRF 2025</th>
                    <th className="py-3.5 px-3.5 min-w-[120px]">Primary Pathway</th>
                    <th className="py-3.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {top25.map((col) => {
                    return (
                      <tr key={col.collegeId} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-3.5 text-center font-black text-slate-900">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${
                              col.choiceIndexRank <= 3
                                ? "bg-blue-600 text-white font-black"
                                : col.choiceIndexRank <= 10
                                ? "bg-blue-100 text-blue-900 font-bold"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {col.choiceIndexRank}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <Link
                            href={`/neet-to-mbbs/colleges/${col.slug}/counselling-2026`}
                            className="font-bold text-slate-900 hover:text-blue-700 transition"
                          >
                            {col.collegeName}
                          </Link>
                          <div className="text-[11px] text-slate-600 font-normal">
                            {col.state} • <span className="font-semibold">{col.instituteType}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-center font-black text-slate-900">
                          {col.medianAIR}
                          <div className="text-[10px] font-normal text-slate-600">
                            Range: {col.bestAIR ?? "-"} – {col.lastObservedAIR ?? "-"}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          {col.nirf2025Rank ? (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md font-bold text-xs bg-slate-100 text-slate-800 border border-slate-200">
                              #{col.nirf2025Rank}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-600 font-medium">
                              Not in Top 50
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3.5 text-slate-700">
                          <div className="font-semibold text-xs">{col.primaryQuota}</div>
                          <div className="text-[10px] text-slate-600 font-normal">
                            Intake: {col.totalMBBSSeats2026} seats
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <Link
                            href={`/neet-to-mbbs/colleges/${col.slug}/counselling-2026`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900"
                          >
                            <span>View</span>
                            <span>→</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 5. Two Different Lenses */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Two Different Lenses
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Understanding why institutional scorecards and candidate allotment patterns measure different aspects of medical education.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Left Lens: NIRF */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase text-slate-700">
                <span>🏛️</span>
                <span>NIRF Medical Rankings 2025</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                NIRF evaluates institutions across multiple weighted dimensions including Teaching,
                Learning & Resources (TLR), Research & Professional Practice (RPC), Graduation
                Outcomes (GO), Outreach & Inclusivity (OI), and Peer Perception.
              </p>
            </div>

            {/* Right Lens: NEET Choice Index */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5 space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase text-blue-950">
                <span>🎯</span>
                <span>NEET Choice Index 2026</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                The NEET Choice Index reflects the <strong>Typical (Median) AIR</strong> observed in
                MCC NEET-UG 2026 Round-1 allotments for the college's primary ordinary Open
                pathway (All India Quota, Open Seat Quota, or Self-Financed Merit).
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-center text-xs sm:text-sm font-semibold text-slate-700">
            Neither measure answers exactly the same question — rankings evaluate institutional
            resources and research, while allotment patterns reflect candidate choices, location,
            quotas, and clinical exposure.
          </div>
        </section>

        {/* 6. Why Fees and Counselling Pathways Matter */}
        <section className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 sm:p-6 shadow-2xs space-y-2">
          <h2 className="text-sm sm:text-base font-extrabold text-amber-950 flex items-center gap-2">
            <span>⚠️</span>
            <span>Why Fees and Counselling Pathways Matter</span>
          </h2>
          <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
            A high NIRF-ranked institution may show a very different MCC allotment AIR profile when
            seats are offered through a high-fee Self-Financed Merit pathway. For this reason,
            Deemed University AIR patterns should not be interpreted in the same way as government
            AIQ or INI Open Seat allotments. Several factors may influence allotment patterns,
            including eligibility rules, seat availability, counselling pathway, geography, and fee
            structure.
          </p>
        </section>

        {/* 7. Expandable Methodology */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer font-extrabold text-sm sm:text-base text-slate-900 select-none">
              <span className="flex items-center gap-2">
                <span>📐</span>
                <span>How is the NEET Choice Index calculated?</span>
              </span>
              <span className="text-slate-600 text-xs font-semibold group-open:rotate-180 transition-transform">
                ▼
              </span>
            </summary>
            <div className="pt-4 space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 mt-3">
              <p>
                The <strong>NEET Choice Index 2026</strong> is an independent educational analysis
                derived from verified <strong>MCC NEET-UG 2026 Round-1</strong> allotment data.
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Primary Indicator:</strong> Arranged in ascending order of Typical
                  (Median) All-India Rank (AIR) in the college's primary ordinary non-PwD Open pathway.
                </li>
                <li>
                  <strong>Ordinary Pathways Only:</strong> Uses All India Quota, Open Seat Quota, or
                  Self-Financed Merit. Excludes NRI, PwD, minority, foreign, and restricted
                  internal sub-quotas from the headline benchmark.
                </li>
                <li>
                  <strong>Supporting Context:</strong> Retains Best AIR, Last Observed AIR, and
                  allotment sample count (n) with every record.
                </li>
                <li>
                  <strong>Tie-Breaking Rule:</strong> 1. Lower Median AIR → 2. Lower Best AIR → 3.
                  Lower Last Observed AIR → 4. Larger allotment count → 5. Stable canonical ID.
                </li>
                <li>
                  <strong>Allotment ≠ Submitted Preference:</strong> Allotment outcomes reflect the
                  intersection of candidate eligibility, seat availability, fees, and counselling
                  rules; they do not represent candidates' raw preference sheets or an official MCC
                  ranking.
                </li>
              </ul>
            </div>
          </details>
        </section>

        {/* 8. Second Share Action */}
        <section className="rounded-3xl border border-blue-200 bg-linear-to-r from-blue-900 to-indigo-900 p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Surprised by the list?
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              Share it with a student, parent, doctor or medical-college alumnus and see what
              surprises them.
            </p>
          </div>
          <div className="shrink-0">
            <ShareChoiceIndexButton
              canonicalUrl="https://mbbsfoundation.com/neet-to-mbbs/counselling/neet-choice-index-2026"
              variant="secondary"
            />
          </div>
        </section>

        {/* 9. Discovery Link Back to Planner */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <div className="text-xs font-bold text-slate-900">
              Planning your NEET-UG choices for Round 2?
            </div>
            <div className="text-xs text-slate-600">
              Explore your personalised opportunity bands and college-wise closing AIRs.
            </div>
          </div>
          <Link
            href="/neet-to-mbbs/counselling/round-2-planner"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border border-blue-700 bg-blue-700 hover:bg-blue-800 text-white transition shadow-2xs shrink-0"
          >
            <span>Open NEET Counselling Planner</span>
            <span>→</span>
          </Link>
        </section>

        {/* 10. Disclaimer & Attribution */}
        <footer className="pt-4 border-t border-slate-200 text-[11px] text-slate-600 leading-relaxed space-y-2">
          <p>
            <strong>Disclaimer:</strong> The NEET Choice Index 2026 is an independent MBBS
            Foundation™ educational analysis of MCC NEET-UG 2026 Round-1 allotment patterns. It is
            not an official MCC, NMC or NIRF ranking and does not represent candidates' submitted
            preference order. Counselling pathways, eligibility, seat availability, fees and other
            factors may influence allotment patterns.
          </p>
          <p>
            <strong>Attribution:</strong> NIRF Medical Ranking 2025 is attributed to the National
            Institutional Ranking Framework, Ministry of Education, Government of India.
          </p>
          <p className="text-slate-600">
            © {new Date().getFullYear()} MBBS Foundation™. All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  );
}
