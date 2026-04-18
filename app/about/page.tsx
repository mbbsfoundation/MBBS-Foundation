export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="mx-auto max-w-5xl px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-700">
          About
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">
          About MBBS Foundation
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
          MBBS Foundation is a medical learning ecosystem built to support
          students, young doctors, and future healers through science, skill,
          service, empathy, and practical wisdom.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
            <h2 className="text-2xl font-semibold">Our Vision</h2>
            <p className="mt-4 leading-8 text-slate-600">
              To help shape thoughtful, skilled, ethical, and resilient doctors
              from the very beginning of their journey.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
            <h2 className="text-2xl font-semibold">Our Direction</h2>
            <p className="mt-4 leading-8 text-slate-600">
              Beginning with a flagship book, MBBS Foundation is growing into a
              larger ecosystem of resources, training, CPR education,
              mentorship, and future learning programs.
            </p>
          </div>
        </div>

        <div className="mt-16 rounded-3xl border border-slate-200 bg-slate-50 p-8 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-700">
            Philosophy
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            Medicine is more than knowledge. It is a way of life.
          </h2>
          <p className="mt-5 leading-8 text-slate-600">
            MBBS Foundation exists to bridge the gap between learning medicine
            and becoming a doctor. It is not only about facts and examinations,
            but also about identity, resilience, communication, empathy, and
            readiness for the real world of care.
          </p>
        </div>
      </section>
    </main>
  );
}