export const metadata = {
  title: "After NEET What Next? Complete Guide for MBBS Students | MBBS Foundation",
  description:
    "Confused after NEET? Learn what to do next, how to prepare for MBBS, and start your medical journey with clarity.",
};

export default function NeetPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 px-6 py-16">
      <div className="mx-auto max-w-3xl">

        <h1 className="text-3xl md:text-4xl font-bold">
          After NEET, What Next?
        </h1>

        <p className="mt-6 text-lg text-slate-600">
          You’ve just appeared for NEET. For many students, this is the most uncertain moment.
          What comes next? How do you prepare for MBBS?
        </p>

        <p className="mt-4 text-slate-600">
          MBBS is very different from school learning. It demands clarity, discipline,
          practical skills, and a completely new way of thinking.
        </p>

        <p className="mt-4 text-slate-600">
          Most students enter medical college unprepared for this transition.
          That is where MBBS Foundation helps.
        </p>

        <div className="mt-8">
          <a
            href="/book"
            className="inline-block rounded-xl bg-black px-6 py-3 text-white"
          >
            Explore MBBS Foundation
          </a>
        </div>

      </div>
    </main>
  );
}