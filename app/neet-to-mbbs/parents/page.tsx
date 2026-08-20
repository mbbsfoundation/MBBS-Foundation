import type { Metadata } from "next";
import Link from "next/link";
import NeetSubNav from "@/components/neet-to-mbbs/NeetSubNav";
import PrevNextNav from "@/components/neet-to-mbbs/PrevNextNav";
import ShareSection from "@/components/neet-to-mbbs/ShareSection";

export const metadata: Metadata = {
  title: "NEET Counselling & Medical College Guide for Parents: Budget, Bonds & Reality",
  description:
    "Clear, compassionate advice for parents of NEET-qualified students. Budget true 5.5-year MBBS costs, understand bonds, avoid commercial traps, and support your child's medical journey.",
  alternates: {
    canonical: "https://mbbsfoundation.com/neet-to-mbbs/parents",
  },
  keywords: [
    "NEET counselling guide for parents",
    "MBBS total cost calculation private deemed government",
    "Service bond penalty guidance for parents",
    "How parents can support medical students",
    "First year MBBS expenses and hostel fees",
    "Gift for future doctor MBBS student",
    "MBBS admission advice for parents India",
  ],
  openGraph: {
    title: "NEET Counselling & Medical College Guide for Parents: Budget, Bonds & Reality",
    description:
      "A calm, practical guide helping parents evaluate medical colleges, understand real expenses, avoid predatory agents, and support their future doctor.",
    url: "https://mbbsfoundation.com/neet-to-mbbs/parents",
    siteName: "MBBS Foundation",
    locale: "en_IN",
    type: "article",
    images: [
      {
        url: "https://mbbsfoundation.com/images/neet-to-mbbs/toolkit-preview.png",
        width: 1200,
        height: 630,
        alt: "NEET to MBBS Parent Guide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NEET Counselling & Medical College Guide for Parents",
    description:
      "Helpful guide for parents: evaluating medical colleges, budgeting 5.5-year expenses, and supporting your child in MBBS.",
    images: ["https://mbbsfoundation.com/images/neet-to-mbbs/toolkit-preview.png"],
  },
};

const PARENTS_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      headline: "NEET Counselling & Medical College Guide for Parents: Budget, Bonds & Reality",
      description:
        "A practical guide for parents of NEET-qualified students covering medical college selection, multi-year costs, clinical exposure, hostel, bonds, and supporting your future doctor.",
      author: {
        "@type": "Person",
        name: "Dr. Lokesh Tiwari",
        url: "https://mbbsfoundation.com/about",
      },
      publisher: {
        "@type": "Organization",
        name: "Ayurvigyan Foundation",
        url: "https://mbbsfoundation.com",
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": "https://mbbsfoundation.com/neet-to-mbbs/parents",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How can parents calculate the true 5.5-year cost of an MBBS degree?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Do not look only at the annual tuition fee. Calculate: (Annual Tuition × 4.5 or 5 years) + (Annual Hostel & Mess × 5.5 years) + University Exam Fees + Security Deposits + Books, Instruments (Stethoscope, Bone set) & Uniforms + Annual Transportation.",
          },
        },
        {
          "@type": "Question",
          name: "How can parents protect themselves from fraudulent counselling agents and package deals?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "All MBBS admissions in India are legally conducted ONLY through official centralized counselling (MCC for central/deemed seats and state counselling authorities for state seats). No agent, politician, or middleman can 'reserve' or 'guarantee' a seat outside official merit counselling.",
          },
        },
        {
          "@type": "Question",
          name: "What emotional support do new medical students need from parents during 1st year MBBS?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Medical school transitions students from being top toppers to being surrounded by peers of equal or higher merit. Parents should provide unconditional listening, avoid comparing marks, encourage healthy sleep and nutrition, and normalize the steep initial learning curve.",
          },
        },
      ],
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://mbbsfoundation.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "NEET to MBBS 2026",
          item: "https://mbbsfoundation.com/neet-to-mbbs",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Parents Guide",
          item: "https://mbbsfoundation.com/neet-to-mbbs/parents",
        },
      ],
    },
  ],
};

const BREADCRUMB_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "NEET to MBBS 2026",
      item: "https://mbbsfoundation.com/neet-to-mbbs",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Parent Guide",
      item: "https://mbbsfoundation.com/neet-to-mbbs/parents",
    },
  ],
};

// 7 Questions Parents Should Ask
const SEVEN_PARENT_QUESTIONS = [
  {
    number: "01",
    title: "Is the Institution Appropriate and Properly Verified?",
    description:
      "Verify the medical college's current status and approved intake on the National Medical Commission (NMC) directory. Confirm whether it is established or operating under initial permission, and verify its affiliating university directly rather than relying on hearsay.",
    icon: "🏛️",
  },
  {
    number: "02",
    title: "What Will MBBS Really Cost Over 5.5 Years?",
    description:
      "Look beyond the first-year tuition fee. Calculate the cumulative 5.5-year expenditure including mandatory hostel charges, mess fees, examination charges, university registration, caution deposits, and regular travel expenses.",
    icon: "💳",
  },
  {
    number: "03",
    title: "What Clinical Learning Environment Will My Child Enter?",
    description:
      "A medical student learns clinical care at the bedside. Inquire about the attached teaching hospital, its daily patient footfall (OPD and IPD), trauma volume, and the breadth of clinical departments available for undergraduate postings.",
    icon: "🏥",
  },
  {
    number: "04",
    title: "Is There a Mandatory Service Bond or Penalty?",
    description:
      "Several state government and private institutions enforce mandatory rural or state service bonds (ranging from 1 to 5 years) with substantial financial exit penalties (₹5 Lakhs to ₹50 Lakhs). Verify the exact active bond rules through official state gazettes.",
    icon: "📜",
  },
  {
    number: "05",
    title: "Where Will My Child Live and Study?",
    description:
      "Medical education involves demanding study routines. Check hostel room availability, food hygiene, safety and security measures, study room access, and everyday campus living conditions.",
    icon: "🏡",
  },
  {
    number: "06",
    title: "How Important Is Distance From Home?",
    description:
      "Discuss travel feasibility, connectivity during family emergencies, local climate, and language differences. Being closer or farther from home involves personal trade-offs that every family evaluates differently.",
    icon: "📍",
  },
  {
    number: "07",
    title: "What Does My Child Actually Prefer?",
    description:
      "Listen closely to your child's academic aspirations, learning style, and personal comfort. Avoid choosing an institution purely based on social prestige, relatives' opinions, or previous cutoffs.",
    icon: "🤝",
  },
];

export default function NeetParentsGuidePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PARENTS_STRUCTURED_DATA) }}
      />
      <NeetSubNav />

      {/* ========================================================================= */}
      {/* 1. HEADER & BREADCRUMB */}
      {/* ========================================================================= */}
      <section className="border-b border-slate-100 bg-gradient-to-b from-amber-50/40 via-slate-50/30 to-white px-4 pt-8 pb-12 sm:px-6 sm:pt-12 sm:pb-16">
        <div className="mx-auto max-w-4xl">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
            <Link
              href="/neet-to-mbbs"
              className="text-red-700 hover:text-red-800 transition underline underline-offset-2"
            >
              NEET to MBBS 2026
            </Link>
            <span aria-hidden="true">→</span>
            <span className="text-slate-700 font-bold">Parent Guide</span>
          </nav>

          {/* Eyebrow */}
          <div className="mt-6 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/80 border border-amber-200 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-900">
              <span>👨‍👩‍👧</span> For Parents & Guardians
            </span>
            <span className="text-xs font-medium text-slate-500">
              Calm, Objective & Supportive
            </span>
          </div>

          {/* Heading */}
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl leading-tight">
            A Parent&apos;s Guide to the Journey from NEET to MBBS
          </h1>

          {/* Subheading */}
          <p className="mt-4 text-base sm:text-lg md:text-xl text-slate-600 leading-relaxed font-normal">
            Your child has crossed an important milestone. Now help them choose thoughtfully, prepare realistically, and begin medical college with confidence.
          </p>

          {/* Two Quick Pathways */}
          <div className="mt-8 grid gap-3.5 sm:grid-cols-2">
            <Link
              href="/neet-to-mbbs/choosing-a-medical-college"
              className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs transition hover:border-slate-300 hover:shadow-xs flex items-center justify-between gap-3 group"
            >
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-700">
                  Decision Support
                </span>
                <p className="text-sm font-bold text-slate-900 group-hover:text-red-700 transition">
                  Still choosing a medical college?
                </p>
                <p className="text-xs text-slate-500">
                  Compare institutions using the 8-factor framework →
                </p>
              </div>
              <span className="text-slate-400 group-hover:text-red-700 transition font-bold">↗</span>
            </Link>

            <Link
              href="/neet-to-mbbs/after-admission"
              className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs transition hover:border-slate-300 hover:shadow-xs flex items-center justify-between gap-3 group"
            >
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-700">
                  Confirmed Seat
                </span>
                <p className="text-sm font-bold text-slate-900 group-hover:text-red-700 transition">
                  Admission already confirmed?
                </p>
                <p className="text-xs text-slate-500">
                  Preparing for First Day of MBBS →
                </p>
              </div>
              <span className="text-slate-400 group-hover:text-red-700 transition font-bold">↗</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. THE PARENT'S ROLE CHANGES NOW */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-white border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-amber-50/30 p-6 sm:p-8 md:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">
              A Natural Transition
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
              The Parent&apos;s Role Changes Now
            </h2>

            <div className="mt-4 space-y-3 text-sm sm:text-base leading-relaxed text-slate-700">
              <p>
                During NEET preparation, parents often took on the role of managing daily schedules, coordinating coaching, tracking test series, and maintaining continuous motivation.
              </p>
              <p>
                After NEET, your role gradually shifts: from <strong>managing the preparation</strong> to <strong>helping your child make well-informed decisions and become increasingly independent</strong>.
              </p>
            </div>

            <div className="mt-6 rounded-2xl bg-white border border-slate-200 p-5 shadow-2xs">
              <blockquote className="text-base sm:text-lg font-bold text-slate-900 leading-snug border-l-4 border-amber-500 pl-4 py-0.5">
                &ldquo;Medical college is not only the next academic course. It is the beginning of your child&apos;s professional journey.&rdquo;
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SEVEN QUESTIONS PARENTS SHOULD ASK */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-slate-50/50 border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">
            Due Diligence
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            Seven Questions Parents Should Ask Before Choosing a College
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Before finalizing preferences, evaluate every shortlisted option through these seven practical perspectives:
          </p>

          <div className="mt-8 space-y-4">
            {SEVEN_PARENT_QUESTIONS.map((q) => (
              <div
                key={q.number}
                className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-start gap-4 transition hover:border-slate-300"
              >
                <div className="flex items-center gap-3 shrink-0">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 font-mono text-sm font-bold text-white">
                    {q.number}
                  </span>
                  <span className="text-2xl sm:hidden" aria-hidden="true">
                    {q.icon}
                  </span>
                </div>

                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {q.title}
                    </h3>
                    <span className="text-xl hidden sm:inline" aria-hidden="true">
                      {q.icon}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {q.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. COST VS VALUE: DON'T COMPARE TUITION FEES ALONE */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-white border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6 sm:p-8 md:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">
              Financial Clarity
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
              Don&apos;t Compare Tuition Fees Alone
            </h2>

            <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-700">
              Two medical colleges with seemingly identical tuition fees can have significantly different overall financial impacts on your family. A realistic budget must account for the full multi-year commitment:
            </p>

            {/* Financial Formula Card */}
            <div className="mt-6 rounded-2xl bg-white border border-slate-200 p-5 shadow-2xs">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                The Real Total Cost Equation:
              </p>
              <div className="text-xs sm:text-sm font-mono font-bold text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                Tuition + Hostel + Mess + Caution Deposits + University/Exam Charges + Living & Travel + Applicable Bond Implications
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <p className="text-xs sm:text-sm text-slate-600">
                Use our printable comparison matrix to evaluate your shortlisted colleges side-by-side:
              </p>
              <Link
                href="/neet-to-mbbs/toolkit#college-comparison"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition shrink-0"
              >
                <span>📊</span>
                <span>Use College Comparison Worksheet →</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. HELP WITHOUT ADDING PRESSURE */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-slate-50/50 border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">
            Family Harmony
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            Your Child Is Making a Big Decision Too
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Counselling can be an emotionally taxing period filled with rank anxieties and conflicting advice. Here is how parents can offer supportive guidance:
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              {
                title: "Discuss Options Openly Rather Than Imposing",
                desc: "Treat the college preference list as a joint project. Encourage your child to share their thought process and reasons.",
              },
              {
                title: "Separate Facts from Social Prestige",
                desc: "Relatives and neighbours often judge colleges solely by brand names. Focus on the actual clinical training your child will receive.",
              },
              {
                title: "Allow Space to Express Concerns",
                desc: "Anxiety about moving away from home, hostel life, or academic rigor in MBBS is completely normal. Listen with reassurance.",
              },
              {
                title: "Discuss Family Finances Transparently",
                desc: "Clear financial boundaries prevent last-minute stress during fee payment deadlines and ensure multi-year continuity.",
              },
              {
                title: "Avoid Repetitive Peer Comparisons",
                desc: "Constantly comparing your child's rank or allotted college with peers adds unproductive pressure at this threshold.",
              },
              {
                title: "Verify Facts Before Reacting to Rumours",
                desc: "Social media groups frequently circulate unverified cutoff rumors. Always cross-check with official counselling notices together.",
              },
            ].map((tip, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-1.5">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {tip.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {tip.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. WHAT CHANGES AFTER ADMISSION? */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-white border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-8 md:p-10 text-white shadow-lg">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">
              The Next Phase
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-white">
              The Seat Is Only the Beginning
            </h2>

            <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
              Once admission is confirmed, the nature of your child&apos;s learning changes entirely. In medical college, they will soon encounter:
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 text-xs sm:text-sm text-slate-200">
              <div className="flex items-start gap-2.5 bg-white/5 border border-white/10 p-3 rounded-xl">
                <span className="text-emerald-400 font-bold">•</span>
                <span>First-year foundations: Anatomy, Physiology & Biochemistry</span>
              </div>
              <div className="flex items-start gap-2.5 bg-white/5 border border-white/10 p-3 rounded-xl">
                <span className="text-emerald-400 font-bold">•</span>
                <span>The NMC Foundation Course & White Coat transition</span>
              </div>
              <div className="flex items-start gap-2.5 bg-white/5 border border-white/10 p-3 rounded-xl">
                <span className="text-emerald-400 font-bold">•</span>
                <span>AETCOM: Attitude, Ethics & Doctor-Patient Communication</span>
              </div>
              <div className="flex items-start gap-2.5 bg-white/5 border border-white/10 p-3 rounded-xl">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Independent adult learning and clinical responsibility</span>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-800 text-center">
              <p className="text-xs sm:text-sm font-semibold text-slate-300">
                &ldquo;NEET prepares students to compete for a medical seat. Medical college begins preparing them to become doctors.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. WHAT DOES A NEW MEDICAL STUDENT ACTUALLY NEED? */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-slate-50/50 border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">
            Practical Preparation
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            What Does a New Medical Student Actually Need?
          </h2>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {/* Things Worth Preparing */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">
                  ✓
                </span>
                <h3 className="text-base font-bold text-emerald-950">
                  Things Worth Preparing Early
                </h3>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-emerald-950">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">•</span>
                  <span>Complete original document sets and digital backups</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">•</span>
                  <span>Essential hostel supplies and formal dress code attire</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">•</span>
                  <span>Realistic understanding of medical college life and culture</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">•</span>
                  <span>Healthy sleep, nutrition, and stress management routines</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">•</span>
                  <span>Basic lifesaving awareness (CPR & First Aid principles)</span>
                </li>
              </ul>
            </div>

            {/* Things You Don't Need to Rush Into */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-white font-bold text-xs">
                  ⏳
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Things You Don&apos;t Need to Rush Into
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Parents often feel pressured to purchase every medical textbook, dissection instrument, or senior-recommended device before classes even start.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                It is generally better to wait for the college orientation where departmental faculty will recommend specific standard textbooks and instruments aligned with their teaching curriculum.
              </p>
            </div>
          </div>

          {/* Subtle Lifesaving Awareness Note for Parents */}
          <div className="mt-6 rounded-2xl border border-rose-200/80 bg-rose-50/40 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-block rounded-md bg-rose-100 text-rose-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                Lifesaving Skills
              </span>
              <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                A future medical student can begin developing practical lifesaving awareness even before formal clinical training through standardized CPR modules.
              </p>
            </div>

            <Link
              href="/cprday#cpr-esanjeevani"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-white px-4 py-2 text-xs font-bold text-rose-900 shadow-2xs hover:bg-rose-50 transition shrink-0"
            >
              <span>Explore CPR eSanjeevani</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FREE PARENT RESOURCES (TOOLKIT BRIDGE) */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-white border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-1.5">
                <span className="inline-block rounded-lg bg-red-100 text-red-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  Free Downloads
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Download Free Parent Checklists & Worksheets
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
                  Access our printable Counselling Checklist, 3-College Comparison Matrix, Admission Documents Tracker, and First Day MBBS Guide.
                </p>
              </div>

              <div className="shrink-0">
                <Link
                  href="/neet-to-mbbs/toolkit"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-slate-800 transition"
                >
                  <span>🖨️</span>
                  <span>Explore Toolkit →</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. A FIRST GIFT FOR YOUR FUTURE DOCTOR */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 bg-gradient-to-b from-slate-50/60 via-white to-white border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">
              A Meaningful Blessing
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              A First Gift for Your Future Doctor
            </h2>

            <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
              An MBBS admission marks the beginning of a lifelong calling. A meaningful gift helps a student understand the professional world they are about to enter—not simply celebrate the seat they have earned.
            </p>

            {/* Book Presentation Grid */}
            <div className="mt-8 grid gap-8 md:grid-cols-12 items-center">
              {/* Left Column: Book Details */}
              <div className="md:col-span-7 space-y-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Recommended Reading
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                    MBBS Foundation: Your First Book of Medicine
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    By Dr. Lokesh Tiwari (Clinician & Educator)
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Written specifically for students transitioning from school and NEET into medical college, this book introduces the core mindset, ethics, and essential clinical readiness required from Day One.
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-red-700 font-bold">✓</span>
                    <span>Transition into MBBS</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-red-700 font-bold">✓</span>
                    <span>CPR & First Aid Readiness</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-red-700 font-bold">✓</span>
                    <span>AETCOM & Medical Ethics</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-red-700 font-bold">✓</span>
                    <span>The Hidden Curriculum</span>
                  </div>
                </div>

                {/* Primary & Secondary Action Buttons */}
                <div className="mt-6 flex flex-wrap items-center gap-3 pt-2">
                  <Link
                    href="/book"
                    className="inline-flex items-center justify-center rounded-xl bg-red-700 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-red-800 transition"
                  >
                    Explore MBBS Foundation →
                  </Link>

                  <a
                    href="https://www.amazon.in/dp/B0GTZFSP17?&tag=notionpcom-21"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-xs sm:text-sm font-semibold text-slate-800 hover:bg-slate-50 transition"
                  >
                    Gift on Amazon ↗
                  </a>
                </div>
              </div>

              {/* Right Column: Book Asset Image */}
              <div className="md:col-span-5 flex justify-center">
                <div className="w-52 sm:w-64 rounded-2xl overflow-hidden shadow-xl ring-1 ring-slate-200 bg-white">
                  <img
                    src="/book.png"
                    alt="MBBS Foundation Book Cover"
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. ADMISSION CONFIRMED TRANSITION */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-white border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-slate-200 bg-slate-900 p-8 sm:p-10 text-white shadow-md">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">
              Looking Ahead
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-white">
              Admission Confirmed?
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              The next question is no longer &ldquo;Which medical college?&rdquo; It becomes &ldquo;How do I prepare to enter medicine?&rdquo;
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                href="/neet-to-mbbs/after-admission"
                className="inline-flex items-center rounded-xl bg-white px-5 py-3 text-xs sm:text-sm font-bold text-slate-900 shadow-sm hover:bg-slate-100 transition"
              >
                Next: Preparing for Your First Day of MBBS →
              </Link>

              <Link
                href="/neet-to-mbbs"
                className="inline-flex items-center rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-xs sm:text-sm font-semibold text-slate-200 hover:bg-slate-700 transition"
              >
                ← Return to Hub
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. SHARING SECTION */}
      {/* ========================================================================= */}
      <ShareSection
        eyebrow="Help Another Family"
        heading="Know Another Parent Navigating NEET Counselling?"
        subheading="Share this guide with a family navigating the same decisions."
        sharePath="/neet-to-mbbs/parents"
        whatsappMessage="If your child is going through NEET counselling, this parent guide may help with choosing a medical college, understanding costs, bonds, hostel and preparing for the transition to MBBS: [URL]"
      />

      {/* ========================================================================= */}
      {/* 12. PREV / NEXT NAVIGATION */}
      {/* ========================================================================= */}
      <PrevNextNav
        prev={{
          title: "How to Choose the Right Medical College",
          href: "/neet-to-mbbs/choosing-a-medical-college",
          label: "College Selection",
        }}
        next={{
          title: "Got Your MBBS Seat? How to Prepare for Medical College",
          href: "/neet-to-mbbs/after-admission",
          label: "Next: MBBS Prep",
        }}
        parallel={{
          title: "NEET to MBBS Decision Toolkit & Worksheets",
          href: "/neet-to-mbbs/toolkit",
          label: "Toolkit",
        }}
      />
    </main>
  );
}
