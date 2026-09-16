import Link from "next/link";
import type { Metadata } from "next";
import CertificateAccessSection from "@/components/cprday/CertificateAccessSection";
import CPReSanjeevaniSection from "@/components/cprday/CPReSanjeevaniSection";
import ReviveSectionPreview from "@/components/cprday/ReviveSectionPreview";

export const metadata: Metadata = {
  metadataBase: new URL("https://mbbsfoundation.com"),
  title: "CPR Sanjeevani Certificate Portal — Indian Academy of Pediatrics",
  description:
    "Official CPR Sanjeevani Certificate Access Portal by the Indian Academy of Pediatrics. Verify and download your CPR Sanjeevani training completion certificate.",
  openGraph: {
    title: "CPR Sanjeevani Certificate Portal — Access & Download Certificate",
    description:
      "Verify, view and download your official National IAP CPR Sanjeevani participation, champion, and course coordinator certificates.",
    url: "https://mbbsfoundation.com/cprday",
    siteName: "CPR Sanjeevani — MBBS Foundation",
    images: [
      {
        url: "https://mbbsfoundation.com/cprday/og-cprday.jpg",
        width: 1200,
        height: 630,
        alt: "CPR Sanjeevani Certificate Portal Banner",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CPR Sanjeevani Certificate Portal — Access & Download Certificate",
    description:
      "Verify, view and download your official National IAP CPR Sanjeevani participation, champion, and course coordinator certificates.",
    images: ["https://mbbsfoundation.com/cprday/og-cprday.jpg"],
  },
};

export default function CPRDayPage() {
  const cprCourseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "National IAP CPR Sanjeevani Training Program",
    "description": "Nationwide CPR & Emergency Resuscitation Training Initiative by the Indian Academy of Pediatrics.",
    "provider": {
      "@type": "Organization",
      "name": "Indian Academy of Pediatrics",
      "sameAs": "https://mbbsfoundation.com/cprday"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "bestRating": "5",
      "worstRating": "1",
      "ratingCount": "1250",
      "reviewCount": "1250"
    }
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(cprCourseSchema) }}
      />
      {/* Hero */}

      <section className="bg-gradient-to-br from-sky-100 via-purple-50 to-indigo-100 border-b border-purple-200/60 px-6 py-20 text-slate-900">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-sky-800 bg-sky-100/90 border border-sky-300 inline-block px-4 py-1.5 rounded-full">
            Indian Academy of Pediatrics Initiative
          </p>

          <h1 className="mt-6 text-4xl font-black uppercase tracking-tight sm:text-5xl md:text-7xl text-slate-900">
            <span className="block bg-gradient-to-r from-sky-700 via-indigo-700 to-purple-700 bg-clip-text text-transparent">
              CPR Sanjeevani
            </span>
          </h1>

          <h2 className="mt-6 text-2xl font-extrabold sm:text-3xl text-purple-950">
            Every Citizen Can Save a Life
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-700">
            A nationwide initiative of the Indian Academy of Pediatrics to
            empower citizens with lifesaving CPR skills through standardised
            awareness, demonstration and supervised hands-on training.
          </p>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto items-stretch">
            <a
              href="#certificate-access"
              className="flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 px-5 py-4 text-center font-bold text-white shadow-lg transition hover:from-sky-700 hover:to-purple-700 text-sm sm:text-base leading-snug"
            >
              Access your IAP CPR Day Participation Certificate
            </a>

            <a
              href="#cpr-esanjeevani"
              className="flex items-center justify-center rounded-xl border-2 border-sky-300 bg-white px-5 py-4 text-center font-bold text-sky-900 shadow-sm transition hover:bg-sky-50 text-sm sm:text-base leading-snug"
            >
              🎓 CPR eSANJEEVANI Online Module
            </a>

            <a
              href="#jk-video"
              className="flex items-center justify-center rounded-xl bg-red-600 px-5 py-4 text-center font-bold text-white shadow-lg transition hover:bg-red-700 text-sm sm:text-base leading-snug gap-2"
            >
              <span>▶</span> CPR Day in Jammu and Kashmir
            </a>

            <a
              href="https://www.facebook.com/share/g/1DF14f2Npr/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center rounded-xl bg-sky-600 px-5 py-4 text-center font-bold text-white shadow-lg transition hover:bg-sky-700 text-sm sm:text-base leading-snug"
            >
              CPR Sanjeevani Facebook Group
            </a>
          </div>
        </div>
      </section>

      {/* Certificate Portal with Radio Buttons */}
      <CertificateAccessSection />

      {/* CPR eSANJEEVANI Online Module */}
      <CPReSanjeevaniSection />

      {/* Field Video Coverage — CPR Day in Jammu and Kashmir */}
      <section id="jk-video" className="scroll-mt-24 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-6 py-16 text-white border-y border-indigo-900/50 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-64 bg-red-600/10 blur-[100px] pointer-events-none rounded-full" />
        
        <div className="mx-auto max-w-4xl text-center relative z-10">
          <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-rose-400 bg-rose-950/80 border border-rose-500/30 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full shadow-inner">
            <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            Field Action &amp; Media Coverage
          </p>

          <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl md:text-5xl text-white">
            CPR Day in Jammu and Kashmir
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-base sm:text-lg text-slate-300 leading-relaxed">
            Watch the inspiring on-ground CPR training and community awareness sessions conducted across Jammu &amp; Kashmir under the National IAP CPR Sanjeevani initiative.
          </p>

          <div className="mt-8 rounded-2xl overflow-hidden border border-indigo-500/30 bg-slate-950 shadow-2xl shadow-indigo-950/50">
            <div className="relative w-full aspect-video">
              <iframe
                src="https://www.youtube.com/embed/vyjUhEK8RxA"
                title="CPR Day in Jammu and Kashmir"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://www.youtube.com/watch?v=vyjUhEK8RxA"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-6 py-3 font-bold text-white shadow-lg shadow-red-900/40 transition hover:scale-[1.02]"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              Watch Directly on YouTube
            </a>
          </div>
        </div>
      </section>

      {/* Recommended Reading Excerpt — Revive (CPR) Section of MBBS Foundation */}
      <ReviveSectionPreview />

      {/* Downloads */}

      <section id="downloads" className="scroll-mt-24 bg-white px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-700">
              Official Resources
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Download Centre
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              Download the official CPR Day posters, guidance documents,
              orientation material and participant attendance sheet.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <DownloadCard
              title="CPR Day in Jammu and Kashmir"
              description="Official video coverage of National CPR Day training across Jammu & Kashmir."
              href="https://www.youtube.com/watch?v=vyjUhEK8RxA"
              type="YouTube Video"
            />
            <DownloadCard
              title="Public Poster — English"
              description="Official English public-awareness poster."
              href="/cprday/CPR%20Day%20Public%20English.jpeg"
              type="Image"
            />

            <DownloadCard
              title="Public Poster — Hindi"
              description="Official Hindi public-awareness poster."
              href="/cprday/CPR%20Day%20Public%20Hindi.jpg"
              type="Image"
            />

            <DownloadCard
              title="CPR Sanjeevani 2026"
              description="Official campaign guidance and programme information."
              href="/cprday/IAP%20CPR%20Sanjeevani%202026.pdf"
              type="PDF"
            />

            <DownloadCard
              title="Frequently Asked Questions"
              description="Answers to common questions about National IAP CPR Day."
              href="/cprday/FAQs%20IAP%20CPR%20Day%202026.pdf"
              type="PDF"
            />

            <DownloadCard
              title="Coordinator Orientation"
              description="Orientation material for course coordinators and training teams."
              href="/cprday/Sanjeevani_Orientation.pdf"
              type="PDF"
            />

            <DownloadCard
              title="Participant Attendance Sheet"
              description="Standard Excel sheet for participant details and attendance."
              href="/cprday/Participant%20attendence%20sheet.xlsx"
              type="Excel"
            />
          </div>
        </div>
      </section>

      {/* About */}

      <section className="bg-gradient-to-br from-indigo-900 via-purple-900 to-sky-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-black">About CPR Sanjeevani</h2>

          <p className="mt-5 text-lg leading-8 text-purple-100">
            CPR Sanjeevani brings together IAP branches, healthcare
            institutions, medical professionals, instructors, CPR Champions,
            schools and community organisations to improve public recognition
            of cardiac arrest and encourage prompt lifesaving action.
          </p>

          <p className="mt-8 text-sm font-bold uppercase tracking-[0.18em] text-sky-300">
            Indian Academy of Pediatrics · IAP ALS–BLS Group
          </p>
        </div>
      </section>
    </main>
  );
}

type DownloadCardProps = {
  title: string;
  description: string;
  href: string;
  type: string;
};

function DownloadCard({
  title,
  description,
  href,
  type,
}: DownloadCardProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 group-hover:text-sky-700">
            {title}
          </h3>

          <p className="mt-3 leading-7 text-slate-600">{description}</p>
        </div>

        <span className="shrink-0 rounded-full bg-sky-100 px-3 py-1 text-xs font-bold uppercase text-sky-700">
          {type}
        </span>
      </div>

      <p className="mt-5 font-bold text-sky-700">Open or download →</p>
    </a>
  );
}