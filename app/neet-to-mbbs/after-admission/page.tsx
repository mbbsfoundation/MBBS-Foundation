import type { Metadata } from "next";
import Link from "next/link";
import NeetSubNav from "@/components/neet-to-mbbs/NeetSubNav";
import PrevNextNav from "@/components/neet-to-mbbs/PrevNextNav";
import ShareSection from "@/components/neet-to-mbbs/ShareSection";
import KnowledgeSkillsMindset from "@/components/neet-to-mbbs/KnowledgeSkillsMindset";

export const metadata: Metadata = {
  title: "Preparing for First Year MBBS: Transition, Anatomy, CPR & Clinical Mindset",
  description:
    "What to do between NEET seat allotment and day one of medical college. Master basic CPR, first aid, medical ethics (AETCOM), stethoscope basics, and study rhythm.",
  alternates: {
    canonical: "https://mbbsfoundation.com/neet-to-mbbs/after-admission",
  },
  keywords: [
    "First year MBBS preparation after NEET admission",
    "What to study before starting MBBS",
    "Books for first year MBBS Anatomy Physiology Biochemistry",
    "First day in medical college what to expect",
    "Foundation course NMC curriculum MBBS",
    "CPR and first aid skills for new medical students",
    "AETCOM medical ethics communication modules",
    "Stethoscope buying guide for MBBS students",
    "Cadaver as our first teacher anatomy dissection",
    "MBBS Foundation your first book of medicine",
  ],
  openGraph: {
    title: "Preparing for First Year MBBS: Transition, Anatomy, CPR & Clinical Mindset",
    description:
      "A practical, welcoming guide for new medical students on first-year subjects, clinical culture, study habits, CPR, and transitioning into medical college.",
    url: "https://mbbsfoundation.com/neet-to-mbbs/after-admission",
    siteName: "MBBS Foundation",
    locale: "en_IN",
    type: "article",
    images: [
      {
        url: "https://mbbsfoundation.com/images/neet-to-mbbs/toolkit-preview.png",
        width: 1200,
        height: 630,
        alt: "Preparing for First Year MBBS",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Preparing for First Year MBBS: Transition & Essential Skills",
    description:
      "Everything a new medical student needs before day one: subjects, foundation course, dissection hall, CPR, and hospital culture.",
    images: ["https://mbbsfoundation.com/images/neet-to-mbbs/toolkit-preview.png"],
  },
};

const AFTER_ADMISSION_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      headline: "Preparing for First Year MBBS: Transition, Anatomy, CPR & Clinical Mindset",
      description:
        "A practical guide for students starting MBBS—first-year subjects (Anatomy, Physiology, Biochemistry), Foundation Course, AETCOM, study habits, CPR, and first-day preparation.",
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
        "@id": "https://mbbsfoundation.com/neet-to-mbbs/after-admission",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What subjects are taught in First Year MBBS under the NMC CBME curriculum?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "First Year (Phase 1) MBBS consists of three core pre-clinical subjects: Human Anatomy (Gross Anatomy, Histology, Embryology, Neuroanatomy), Physiology (organ systems, biophysics, practical clinical examination), and Biochemistry (molecular biology, metabolism, clinical pathology). In addition, students undergo the mandatory 1-month Foundation Course, Early Clinical Exposure (ECE), and AETCOM modules.",
          },
        },
        {
          "@type": "Question",
          name: "What is the NMC Foundation Course in First Year MBBS?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The Foundation Course is a dedicated orientation program conducted during the first month of MBBS. It is designed to bridge the transition from school to medical college by introducing medical ethics, doctor-patient communication (AETCOM), national health goals, basic life support (CPR) and first aid, computer literacy, and stress management.",
          },
        },
        {
          "@type": "Question",
          name: "How should a new medical student prepare for the Anatomy Dissection Hall?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Approach the Dissection Hall with deep reverent respect for the cadaver, who is the medical student's first silent teacher. Wear a clean white apron, bring a standard dissection instrument kit, maintain good hydration, and mentally prepare for the formaldehyde odor, which quickly becomes familiar.",
          },
        },
        {
          "@type": "Question",
          name: "Should I buy expensive medical textbooks before college starts?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. Wait until your college starts and your department professors introduce their recommended textbook list. Use the pre-college vacation to rest, learn lifesaving CPR, build communication skills, and read introductory companion books like 'MBBS Foundation: Your First Book of Medicine'.",
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
          name: "After Admission Guide",
          item: "https://mbbsfoundation.com/neet-to-mbbs/after-admission",
        },
      ],
    },
  ],
};

// First-Year Subjects
const FIRST_YEAR_SUBJECTS = [
  {
    name: "Anatomy",
    tagline: "Understanding the structure of the human body",
    description:
      "Explores the architecture of human life through Gross Anatomy, Cadaveric Dissection, Histology (microscopic structures), Embryology (development), and Neuroanatomy.",
    color: "border-sky-200 bg-sky-50/40 text-sky-950",
    badgeColor: "bg-sky-100 text-sky-800",
    icon: "🩻",
  },
  {
    name: "Physiology",
    tagline: "Understanding how the human body works",
    description:
      "Investigates the dynamic functional systems—cardiovascular, respiratory, nervous, renal, and endocrine—that maintain homeostasis in health and adapt during disease.",
    color: "border-rose-200 bg-rose-50/40 text-rose-950",
    badgeColor: "bg-rose-100 text-rose-800",
    icon: "🫀",
  },
  {
    name: "Biochemistry",
    tagline: "Understanding the molecular foundations of life",
    description:
      "Decodes cellular metabolism, enzyme kinetics, molecular genetics, nutrition, and laboratory diagnostic markers that explain biological processes at a molecular level.",
    color: "border-amber-200 bg-amber-50/40 text-amber-950",
    badgeColor: "bg-amber-100 text-amber-800",
    icon: "🧬",
  },
];

// Beyond Three Subjects
const BEYOND_SUBJECTS = [
  {
    title: "NMC Foundation Course",
    desc: "A dedicated orientation module at the start of MBBS introducing medical ethics, professional language, hospital systems, and national healthcare goals.",
  },
  {
    title: "AETCOM (Attitude, Ethics & Communication)",
    desc: "A structured, competency-based curriculum teaching empathy, ethical decision-making, patient dignity, and effective clinical communication.",
  },
  {
    title: "Professionalism & Medical Etiquette",
    desc: "Developing punctuality, clinical decorum, mutual respect, accountability, and the lifelong identity of being a trusted healer.",
  },
  {
    title: "Doctor-Patient Communication",
    desc: "Learning how to listen actively, elicit medical histories with sensitivity, and explain clinical situations clearly to patients and families.",
  },
  {
    title: "Early Clinical Exposure (ECE)",
    desc: "Hospital visits from year one that connect basic science concepts (like heart sounds or kidney function) with real patient encounters.",
  },
  {
    title: "Essential Lifesaving Skills (CPR)",
    desc: "Hands-on emergency training so you can respond calmly and effectively when every second counts—even before your clinical postings begin.",
  },
];

// 7 Habits Worth Developing
const SEVEN_HABITS = [
  {
    number: "01",
    title: "Curiosity",
    tagline: "Ask why, not only what.",
    desc: "Move from rote memorization to understanding clinical mechanisms. Understanding why a symptom occurs makes medicine memorable.",
  },
  {
    number: "02",
    title: "Consistency",
    tagline: "Medicine rewards regular learning.",
    desc: "The sheer volume of medical knowledge is immense. Studying consistently every day prevents overwhelming pre-exam exhaustion.",
  },
  {
    number: "03",
    title: "Communication",
    tagline: "Learn to listen as carefully as you speak.",
    desc: "Most clinical diagnoses originate from careful patient history taking. Communication is a clinical skill just like auscultation.",
  },
  {
    number: "04",
    title: "Professionalism",
    tagline: "Your behaviour shapes your medical identity.",
    desc: "Respect for cadavers in dissection labs, punctuality in clinics, and integrity with peers lay the groundwork for patient trust.",
  },
  {
    number: "05",
    title: "Teamwork",
    tagline: "Medicine is rarely practised alone.",
    desc: "Modern healthcare is delivered by multidisciplinary teams. Learn to collaborate, share knowledge, and support your batchmates.",
  },
  {
    number: "06",
    title: "Empathy",
    tagline: "Patients are people before they are diagnoses.",
    desc: "Never reduce a human being to 'Bed Number 4'. Compassion and human dignity are central to true healing.",
  },
  {
    number: "07",
    title: "Lifelong Learning",
    tagline: "Medical education does not end with an exam.",
    desc: "Science evolves continuously. Developing habits of reading original evidence and staying curious lasts throughout your career.",
  },
];

export default function NeetAfterAdmissionPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(AFTER_ADMISSION_STRUCTURED_DATA) }}
      />
      <NeetSubNav />

      {/* ========================================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="border-b border-slate-100 bg-gradient-to-b from-red-50/50 via-slate-50/30 to-white px-4 pt-8 pb-12 sm:px-6 sm:pt-14 sm:pb-20">
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
            <span className="text-slate-700 font-bold">After Admission</span>
          </nav>

          {/* Eyebrow */}
          <div className="mt-6 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 text-red-900 border border-red-200 px-3.5 py-1 text-xs font-bold uppercase tracking-widest">
              <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse"></span>
              Your MBBS Journey Begins
            </span>
            <span className="text-xs font-medium text-slate-500 hidden sm:inline">
              • The Transition Phase
            </span>
          </div>

          {/* Heading */}
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl lg:text-6xl leading-[1.12]">
            Congratulations. <br />
            <span className="text-red-700">You&apos;re Going to Medical School.</span>
          </h1>

          {/* Subheading */}
          <p className="mt-5 text-base sm:text-lg md:text-xl text-slate-600 leading-relaxed max-w-3xl font-normal">
            NEET helped you earn your place. Now comes a very different journey—learning how to think, learn, communicate and grow as a medical student.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#practical-things"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-slate-800 transition"
            >
              <span>Prepare for Your First Day</span>
              <span>↓</span>
            </a>

            <Link
              href="/neet-to-mbbs/counselling"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition underline underline-offset-2 py-2"
            >
              Still completing counselling? → Counselling Guide
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. COMPLETE THE PRACTICAL THINGS */}
      {/* ========================================================================= */}
      <section id="practical-things" className="py-12 sm:py-16 px-4 sm:px-6 bg-white border-b border-slate-100 scroll-mt-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6 sm:p-8 md:p-10">
            <div className="flex items-center gap-2">
              <span className="inline-block rounded-lg bg-slate-900 text-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                Step 1
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Administrative & Practical Checklist
              </span>
            </div>

            <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">
              Before College Starts: Complete the Practical Things
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Take care of these operational items first so you can arrive at orientation relaxed and focused:
            </p>

            <ul className="mt-6 space-y-3 text-xs sm:text-sm text-slate-700">
              {[
                "Complete all physical reporting, fee deposit, and admission formalities within your allotted round window.",
                "Safely preserve and scan digital backups (cloud/drive) of all submitted certificates, allotment letters, and payment receipts.",
                "Carefully check your college website for official joining instructions, orientation schedule, and reporting dates.",
                "Understand hostel room allocation rules, mess arrangements, and what the institution asks students to bring.",
                "Arrange formal dress code attire and comfortable footwear suited for long hours in hospital wards and dissection halls.",
                "Avoid rushing to buy every textbook or surgical instrument before receiving guidance from your departmental professors.",
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mt-0.5">
                    ✓
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 pt-5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-600">
                Need a printable checklist for your bag?
              </span>
              <Link
                href="/neet-to-mbbs/toolkit#first-day-mbbs"
                className="inline-flex items-center gap-1.5 font-bold text-xs text-red-700 hover:text-red-800 underline underline-offset-2"
              >
                <span>🖨️</span> Open Before Your First Day of MBBS Checklist →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. MBBS IS NOT NEET PART 2 */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-slate-50/50 border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border-2 border-red-100 bg-gradient-to-br from-red-50/40 via-white to-slate-50 p-6 sm:p-8 md:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">
              The Mindset Shift
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
              MBBS Is Not NEET Part 2
            </h2>

            <div className="mt-4 space-y-3.5 text-xs sm:text-sm sm:text-base leading-relaxed text-slate-700">
              <p>
                NEET preparation was largely structured around entrance-examination performance—memorizing facts, speed, eliminating negative marking, and competitive ranking.
              </p>
              <p>
                Medical education is fundamentally different. It progressively requires <strong>deep conceptual understanding, connecting bodily systems, clinical communication, ethical responsibility, and teamwork</strong>.
              </p>
            </div>

            <div className="mt-6 rounded-2xl bg-white border border-slate-200 p-5 shadow-2xs">
              <blockquote className="text-base sm:text-lg font-bold text-slate-900 leading-snug border-l-4 border-red-700 pl-4 py-0.5">
                &ldquo;The goal is no longer simply to score enough to enter medicine. You are beginning to learn how to become a doctor.&rdquo;
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. MEET YOUR FIRST-YEAR SUBJECTS */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-white border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">
            Academic Foundations
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            Meet Your First-Year Pre-Clinical Subjects
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Your first year introduces the three classical foundational pillars of medicine:
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {FIRST_YEAR_SUBJECTS.map((subj) => (
              <div
                key={subj.name}
                className={`rounded-2xl border p-5 shadow-xs flex flex-col justify-between space-y-3 ${subj.color}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`inline-block rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${subj.badgeColor}`}>
                      Pre-Clinical
                    </span>
                    <span className="text-xl" aria-hidden="true">
                      {subj.icon}
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-bold text-slate-900">
                    {subj.name}
                  </h3>

                  <p className="text-xs font-semibold text-slate-700 mt-0.5">
                    {subj.tagline}
                  </p>

                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    {subj.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl bg-slate-50 border border-slate-200 p-4 text-center text-xs text-slate-600">
            💡 <strong>Reassurance:</strong> You do not need to master these subjects before college starts. Simply knowing what lies ahead is more than enough.
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. MORE THAN THREE SUBJECTS */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-slate-50/50 border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">
            The Complete Doctor
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            Medical College Teaches More Than Anatomy, Physiology & Biochemistry
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            The modern Competency-Based Medical Education (CBME) curriculum recognizes that technical knowledge alone does not make a physician:
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BEYOND_SUBJECTS.map((item, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-1.5">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. SEVEN HABITS WORTH DEVELOPING */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-white border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">
            Personal Growth
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            Start Building These Habits Early
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Seven practical attitudes that help students thrive throughout their 5.5 years and beyond:
          </p>

          <div className="mt-8 space-y-3.5">
            {SEVEN_HABITS.map((habit) => (
              <div
                key={habit.number}
                className="rounded-2xl border border-slate-200 bg-slate-50/40 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-start gap-4 transition hover:border-slate-300 hover:bg-white"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 font-mono text-xs font-bold text-white">
                  {habit.number}
                </span>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {habit.title}
                    </h3>
                    <span className="text-xs font-semibold text-red-700">
                      — {habit.tagline}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {habit.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. YOUR FIRST LIFESAVING SKILL (CPR TEASER) */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-gradient-to-br from-sky-50 via-slate-50 to-blue-50/40 border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-sky-200 bg-white p-6 sm:p-8 md:p-10 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="inline-block rounded-lg bg-sky-100 text-sky-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                Emergency Response
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Hands-on Readiness
              </span>
            </div>

            <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">
              Could You Help if Someone Collapsed Today?
            </h2>

            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              You don&apos;t have to wait for your final-year emergency posting to learn how to save a life. Cardiopulmonary Resuscitation (CPR) and basic first aid are skills every future doctor can understand from Day One.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                href="/cprday"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:from-sky-700 hover:to-indigo-700 transition"
              >
                <span>❤️</span>
                <span>Learn CPR with IAP CPR Sanjeevani →</span>
              </Link>

              <Link
                href="/cprsanjeevani"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition underline underline-offset-2 py-2"
              >
                Verify CPR Certificates
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. YOUR FIRST BOOK OF MEDICINE (PRINCIPAL CONVERSION SECTION) */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 bg-white border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border-2 border-slate-900 bg-slate-950 p-6 sm:p-10 text-white shadow-2xl">
            <div className="grid gap-8 md:grid-cols-12 items-center">
              {/* Left Details */}
              <div className="md:col-span-7 space-y-4">
                <span className="inline-block rounded-lg bg-red-500/20 border border-red-400/40 text-red-300 px-3 py-1 text-xs font-bold uppercase tracking-widest">
                  Featured Educational Companion
                </span>

                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  MBBS Foundation: <br />
                  <span className="text-red-400">Your First Book of Medicine</span>
                </h2>

                <p className="text-xs font-semibold text-slate-400">
                  By Dr. Lokesh Tiwari (Clinician, Educator & Professor)
                </p>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  NEET prepared you to enter medical college. <em>MBBS Foundation</em> is designed to help you understand the world you are entering.
                </p>

                <p className="text-xs text-slate-400 leading-relaxed italic border-l-2 border-red-500 pl-3">
                  Not a replacement for Anatomy, Physiology, or Biochemistry textbooks—it is your personal bridge into medical education, ethics, communication, and clinical thinking.
                </p>

                {/* Topics Covered */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-200 pt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-red-400 font-bold">✓</span>
                    <span>Transitioning into MBBS</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-red-400 font-bold">✓</span>
                    <span>NMC Foundation Course</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-red-400 font-bold">✓</span>
                    <span>AETCOM & Medical Ethics</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-red-400 font-bold">✓</span>
                    <span>CPR & Practical First Aid</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-red-400 font-bold">✓</span>
                    <span>Clinical Communication</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-red-400 font-bold">✓</span>
                    <span>The Hidden Curriculum</span>
                  </div>
                </div>

                {/* Purchase CTAs */}
                <div className="mt-8 flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800">
                  <Link
                    href="/book"
                    className="inline-flex items-center justify-center rounded-xl bg-red-600 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-red-700 transition"
                  >
                    Explore MBBS Foundation →
                  </Link>

                  <a
                    href="https://www.amazon.in/dp/B0GTZFSP17?&tag=notionpcom-21"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-xs sm:text-sm font-semibold text-slate-200 hover:bg-slate-800 transition"
                  >
                    Get on Amazon ↗
                  </a>

                  <a
                    href="https://notionpress.com/author/1356076"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-xs sm:text-sm font-semibold text-slate-200 hover:bg-slate-800 transition"
                  >
                    Get on Notion Press ↗
                  </a>
                </div>
              </div>

              {/* Right Image */}
              <div className="md:col-span-5 flex justify-center">
                <div className="w-56 sm:w-64 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-700 bg-white">
                  <img
                    src="/book.png"
                    alt="MBBS Foundation Book Cover"
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Why Start With MBBS Foundation Sub-Section */}
          <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50/70 p-6 sm:p-8">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              Why Read It Before or Early in MBBS?
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 text-xs sm:text-sm text-slate-700">
              <div>
                <strong className="text-slate-900 block font-bold">1. Understand the system before entering it:</strong>
                <p className="mt-0.5 text-slate-600">Get oriented to the expectations, vocabulary, and culture of medical college.</p>
              </div>
              <div>
                <strong className="text-slate-900 block font-bold">2. Start beyond textbooks:</strong>
                <p className="mt-0.5 text-slate-600">Build clinical communication, ethics, and professional conduct from Day One.</p>
              </div>
              <div>
                <strong className="text-slate-900 block font-bold">3. Learn what students often discover late:</strong>
                <p className="mt-0.5 text-slate-600">Gain practical insights into hostel life, dissection room anxiety, and study balance.</p>
              </div>
              <div>
                <strong className="text-slate-900 block font-bold">4. Begin with perspective:</strong>
                <p className="mt-0.5 text-slate-600">Understand where your first year fits into the larger journey of becoming a compassionate doctor.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. PARENT GIFT PATHWAY CARD */}
      {/* ========================================================================= */}
      <section className="py-10 sm:py-14 px-4 sm:px-6 bg-amber-50/30 border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-amber-200 bg-white p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-1">
                <span className="inline-block rounded-lg bg-amber-100 text-amber-900 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  For Parents
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  A Parent of a New Medical Student?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
                  Mark the beginning of their medical journey with a gift created to help them navigate the profession they are entering.
                </p>
              </div>

              <div className="shrink-0">
                <Link
                  href="/neet-to-mbbs/parents"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
                >
                  Explore the Gift Idea →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. FREE RESOURCES & TOOLKIT BRIDGE */}
      {/* ========================================================================= */}
      <section className="py-10 sm:py-14 px-4 sm:px-6 bg-white border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Still Getting Ready for College?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Download the printable <em>Before Your First Day of MBBS Checklist</em> and <em>Documents Checklist</em>.
              </p>
            </div>

            <Link
              href="/neet-to-mbbs/toolkit"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition shrink-0"
            >
              <span>🖨️</span> Open Toolkit →
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. YOUR FIRST LIFESAVING SKILL */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-rose-50/40 border-b border-rose-100/80">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-rose-200/80 bg-white p-6 sm:p-10 shadow-xs space-y-6">
            <div className="space-y-2">
              <span className="inline-block rounded-lg bg-rose-100 text-rose-900 border border-rose-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                Practical Competence
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Your First Lifesaving Skill
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl font-normal">
                Medical education is about more than books. Basic lifesaving skills are among the earliest practical abilities worth developing before you enter hospital corridors.
              </p>
            </div>

            {/* 3 Concise Reasons */}
            <div className="grid gap-4 sm:grid-cols-3 pt-1 text-xs sm:text-sm text-slate-700">
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 space-y-1.5">
                <span className="text-xl">⚡</span>
                <strong className="block text-slate-900 font-bold">1. Early Recognition</strong>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Recognizing cardiac arrest and agonal gasping instantly is the critical first link in survival.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 space-y-1.5">
                <span className="text-xl">🩺</span>
                <strong className="block text-slate-900 font-bold">2. Core Lifesaving Skill</strong>
                <p className="text-xs text-slate-600 leading-relaxed">
                  High-quality chest compressions and early defibrillation maintain crucial tissue perfusion until circulation returns.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 space-y-1.5">
                <span className="text-xl">🛡️</span>
                <strong className="block text-slate-900 font-bold">3. Practical Confidence</strong>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Learning standardized emergency response builds clinical responsibility and readiness from Day One.
                </p>
              </div>
            </div>

            {/* Certification Disclaimer & CTA */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                Complete the CPR eSanjeevani learning pathway and assessment to earn the programme&apos;s applicable certificate, where eligible.
              </p>

              <Link
                href="/cprday#cpr-esanjeevani"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-700 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-rose-800 transition shrink-0"
              >
                <span>Start CPR eSanjeevani</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 12. FUTURE DOCTOR CHALLENGE CTA */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-slate-50/50 border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 text-center space-y-3 shadow-xs">
            <span className="inline-block rounded-lg bg-red-100 text-red-900 border border-red-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              Interactive Challenge Live
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              How Ready Are You for Medical College?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
              Not another biology test. A 10-question challenge on medical education, clinical ethics, applied human biology, and lifesaving CPR awareness.
            </p>
            <div className="pt-2">
              <Link
                href="/neet-to-mbbs/readiness-quiz"
                className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-red-800 transition"
              >
                <span>Take the Future Doctor Challenge</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* 3-Pillar Bridge */}
          <div className="mt-10">
            <KnowledgeSkillsMindset />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 12. END WITH IDENTITY, NOT SELLING */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 bg-slate-950 text-white">
        <div className="mx-auto max-w-4xl text-center space-y-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">
            A Lifelong Milestone
          </p>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
            From NEET Aspirant to Medical Student
          </h2>

          <p className="text-xs sm:text-sm md:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Getting the seat is an achievement. What you learn, practise and become from here will define the journey ahead. Welcome to medicine.
          </p>

          <div className="pt-4 flex flex-wrap justify-center gap-3">
            <Link
              href="/neet-to-mbbs/toolkit"
              className="inline-flex items-center rounded-xl bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-950 hover:bg-slate-100 transition"
            >
              Explore Toolkit
            </Link>

            <Link
              href="/cprday"
              className="inline-flex items-center rounded-xl border border-slate-700 bg-slate-900 px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 transition"
            >
              Learn About CPR
            </Link>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 13. SHARING SECTION */}
      {/* ========================================================================= */}
      <ShareSection
        eyebrow="Help Your Batchmates"
        heading="Know Someone Else Starting MBBS?"
        subheading="Share this guide with batchmates or friends who have confirmed their MBBS seats."
        sharePath="/neet-to-mbbs/after-admission"
        whatsappMessage="Got an MBBS seat? Congratulations! This guide explains what to expect before starting medical college—from first-year subjects and Foundation Course to professionalism, communication and preparing for your first day: [URL]"
      />

      {/* ========================================================================= */}
      {/* 14. PREV / NEXT NAVIGATION */}
      {/* ========================================================================= */}
      <PrevNextNav
        prev={{
          title: "NEET to MBBS Toolkit & Checklists",
          href: "/neet-to-mbbs/toolkit",
          label: "Toolkit",
        }}
        parallel={{
          title: "A Parent's Guide to the Journey from NEET to MBBS",
          href: "/neet-to-mbbs/parents",
          label: "Parent Guide",
        }}
      />
    </main>
  );
}
