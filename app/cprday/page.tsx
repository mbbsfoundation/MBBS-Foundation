import Link from "next/link";
import CertificateAccessSection from "@/components/cprday/CertificateAccessSection";
import CPReSanjeevaniSection from "@/components/cprday/CPReSanjeevaniSection";
import ReviveSectionPreview from "@/components/cprday/ReviveSectionPreview";

export default function CPRDayPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
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

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto items-stretch">
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
              href="/cprday/participant-registration-template.xlsx"
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