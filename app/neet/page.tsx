export const metadata = {
  title: "After NEET What Next? Complete Guide for MBBS Students | MBBS Foundation",
  description:
    "Confused after NEET? Learn what to do next, how to prepare for MBBS, and start your medical journey with clarity, CPR, first aid, ethics, and clinical thinking.",
};

export default function NeetPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="mx-auto max-w-4xl px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-700">
          NEET to MBBS
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">
          After NEET, What Next?
        </h1>

        <p className="mt-6 text-lg leading-8 text-slate-600">
          Appearing for NEET is a major milestone, but it is not the end of the
          journey. For many students and parents, the period after NEET brings a
          new question: how should one prepare for MBBS and medical college?
        </p>

        <p className="mt-4 text-lg leading-8 text-slate-600">
          MBBS is very different from school learning. It requires a new mindset,
          disciplined study habits, communication skills, ethics, clinical
          thinking, CPR and first aid awareness, and emotional readiness.
        </p>

        <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">
            Why the transition after NEET matters
          </h2>
          <p className="mt-4 leading-8 text-slate-600">
            Students spend years preparing for NEET, but very little time
            preparing for life after NEET. Medical college brings a new academic
            culture, new expectations, hostel life, professional identity, and
            the first steps toward patient care.
          </p>
        </div>

        <div className="mt-12 space-y-10">
          <section>
            <h2 className="text-2xl font-semibold">
              1. Understand that MBBS is not just another course
            </h2>
            <p className="mt-3 leading-8 text-slate-600">
              MBBS is the beginning of becoming a doctor. It is not only about
              anatomy, physiology, and biochemistry. It is also about
              responsibility, discipline, compassion, and lifelong learning.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">
              2. Prepare for first-year MBBS subjects
            </h2>
            <p className="mt-3 leading-8 text-slate-600">
              First-year MBBS usually introduces students to anatomy,
              physiology, and biochemistry. These subjects form the foundation
              of medical thinking. Focus on understanding concepts, drawing
              diagrams, revising regularly, and linking basic science with real
              patients.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">
              3. Learn essential life-saving skills early
            </h2>
            <p className="mt-3 leading-8 text-slate-600">
              CPR and first aid are not optional extras. Every future doctor
              should learn the first life-saving actions that matter in an
              emergency. These skills build confidence and connect medical
              knowledge with real-world action.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">
              4. Build communication and soft skills
            </h2>
            <p className="mt-3 leading-8 text-slate-600">
              Medicine is deeply human. Students should begin developing
              communication, empathy, teamwork, professionalism, and emotional
              resilience early in their journey. These qualities shape the kind
              of doctor patients trust.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">
              5. Avoid common mistakes after entering MBBS
            </h2>
            <ul className="mt-3 space-y-3 leading-8 text-slate-600">
              <li>• Waiting too long to develop study discipline</li>
              <li>• Comparing yourself constantly with classmates</li>
              <li>• Ignoring sleep, health, and emotional balance</li>
              <li>• Thinking soft skills are less important than marks</li>
              <li>• Studying only for exams instead of understanding medicine</li>
            </ul>
          </section>
        </div>

        <div className="mt-14 rounded-3xl bg-slate-950 p-8 text-white md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-400">
            Your next step
          </p>
          <h2 className="mt-3 text-3xl font-semibold">
            Start MBBS with clarity, confidence, and purpose.
          </h2>
          <p className="mt-5 max-w-2xl leading-8 text-slate-300">
            MBBS Foundation: Your First Book of Medicine is designed to help
            students transition from NEET to medical college with knowledge,
            skills, values, and practical readiness.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="/book"
              className="rounded-xl bg-white px-6 py-3 text-slate-950"
            >
              Explore the Book
            </a>

            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSeu6FIbHPzutVTxC-yhQ0hc09yniIgWRTuIYPYDkZMWx_aptA/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-slate-700 px-6 py-3 text-white"
            >
              CPR Training
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}