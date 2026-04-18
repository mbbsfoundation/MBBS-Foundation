export default function ResourcesPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-700">
          Resources
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">
          Resources for Students and Young Doctors
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
          This space will grow into a practical collection of guidance,
          articles, skill resources, and tools for medical learners.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
            <h2 className="text-xl font-semibold">Transition to MBBS</h2>
            <p className="mt-3 leading-7 text-slate-600">
              Starting strong in medical college with clarity and confidence.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
            <h2 className="text-xl font-semibold">CPR & First Aid</h2>
            <p className="mt-3 leading-7 text-slate-600">
              Life-saving awareness, readiness, and practical learning.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
            <h2 className="text-xl font-semibold">Soft Skills</h2>
            <p className="mt-3 leading-7 text-slate-600">
              Communication, empathy, resilience, and professional identity.
            </p>
          </div>
        </div>

        <div className="mt-16 rounded-3xl bg-slate-50 p-8 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-700">
            Coming Soon
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            A growing knowledge hub
          </h2>
          <p className="mt-4 max-w-3xl leading-8 text-slate-600">
            In future updates, this section will include articles, downloadable
            resources, student guidance, CPR awareness content, and practical
            tools designed for real medical journeys.
          </p>
        </div>
      </section>
    </main>
  );
}