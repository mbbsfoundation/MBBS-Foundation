import Link from "next/link";export default function CPRDayPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Hero */}

      <section className="bg-gradient-to-br from-slate-950 via-red-950 to-slate-950 px-6 py-20 text-white">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-red-300">
            Indian Academy of Pediatrics
          </p>

          <h1 className="mt-6 text-4xl font-black uppercase tracking-tight sm:text-5xl md:text-7xl">
            National IAP
            <span className="block text-red-500">CPR Day 2026</span>
          </h1>

          <p className="mt-6 text-2xl font-bold text-white">
            21 July 2026
          </p>

          <h2 className="mt-8 text-2xl font-bold sm:text-3xl">
            Every Citizen Can Save a Life
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            A nationwide initiative of the Indian Academy of Pediatrics to
            empower citizens with lifesaving CPR skills through standardised
            awareness, demonstration and supervised hands-on training.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="#coordinator-portal"
              className="rounded-xl bg-red-600 px-7 py-4 font-bold text-white shadow-lg transition hover:bg-red-500"
            >
              Course Coordinator Portal
            </a>

            <a
              href="#downloads"
              className="rounded-xl border border-white/30 bg-white/10 px-7 py-4 font-bold text-white transition hover:bg-white/20"
            >
              Download Centre
            </a>
          </div>
        </div>
      </section>

      {/* Coordinator portal */}

      <section
        id="coordinator-portal"
        className="scroll-mt-24 bg-slate-50 px-6 py-16"
      >
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-700">
              Course Coordinators
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight">
              Course Coordinator Portal
            </h2>

            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              Course coordinators will use one simple portal to create courses,
              review their course details, download the attendance sheet and
              upload the completed attendance record after training.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                "Login",
                "Create Course",
                "Download Sheet",
                "Conduct Training",
                "Upload Attendance",
              ].map((step, index) => (
                <div
                  key={step}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 font-black text-red-700">
                    {index + 1}
                  </div>

                  <p className="mt-4 font-bold text-slate-900">{step}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-sky-200 bg-sky-50 p-6 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h3 className="text-lg font-bold text-slate-900">
      Course Coordinator Portal
    </h3>

    <p className="mt-1 text-slate-600">
      Sign in to create courses, review course details and manage attendance.
    </p>
  </div>

  <div className="flex flex-col gap-3 sm:flex-row">
    <Link
      href="/cprday/login"
      className="rounded-xl bg-sky-700 px-5 py-3 text-center font-semibold text-white hover:bg-sky-800"
    >
      Coordinator Login
    </Link>

    <Link
      href="/cprday/signup"
      className="rounded-xl border border-sky-700 px-5 py-3 text-center font-semibold text-sky-700 hover:bg-white"
    >
      Create Account
    </Link>
  </div>
</div>
          </div>
        </div>
      </section>

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

      <section className="bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-black">About National IAP CPR Day</h2>

          <p className="mt-5 text-lg leading-8 text-slate-300">
            National IAP CPR Day brings together IAP branches, healthcare
            institutions, medical professionals, instructors, CPR Champions,
            schools and community organisations to improve public recognition
            of cardiac arrest and encourage prompt lifesaving action.
          </p>

          <p className="mt-8 text-sm font-bold uppercase tracking-[0.18em] text-red-300">
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