export const metadata = {
  title: "How to Choose the Right Medical College After NEET | Complete Guide",
  description:
    "Confused about which medical college to choose after NEET? Learn how to select the right MBBS college based on rank, fees, location, and future goals.",
};

export default function ChooseCollegePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 px-6 py-16">
      <div className="mx-auto max-w-4xl">

        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-700">
          NEET College Selection
        </p>

        <h1 className="mt-4 text-3xl md:text-5xl font-bold">
          How to Choose the Right Medical College After NEET
        </h1>

        <p className="mt-6 text-lg text-slate-600 leading-8">
          After NEET results, one of the biggest questions for students and parents is:
          which medical college should you choose?
        </p>

        <p className="mt-4 text-lg text-slate-600 leading-8">
          This decision shapes not just your MBBS journey, but your future as a doctor.
          A good choice goes beyond rank—it involves clarity, awareness, and long-term thinking.
        </p>

        {/* Factor 1 */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold">
            1. Rank vs realistic expectations
          </h2>
          <p className="mt-3 text-slate-600 leading-8">
            Your NEET rank plays a major role, but it should be aligned with realistic
            expectations. Understanding previous year cut-offs helps in making informed choices.
          </p>
        </section>

        {/* Factor 2 */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold">
            2. Government vs private colleges
          </h2>
          <p className="mt-3 text-slate-600 leading-8">
            Government colleges are preferred due to lower fees and high patient exposure.
            Private colleges may offer better infrastructure but come with higher costs.
            Balance your priorities carefully.
          </p>
        </section>

        {/* Factor 3 */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold">
            3. Location and environment
          </h2>
          <p className="mt-3 text-slate-600 leading-8">
            Consider whether you are comfortable staying away from home.
            Climate, language, and support systems matter more than students initially realise.
          </p>
        </section>

        {/* Factor 4 */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold">
            4. Patient exposure and clinical learning
          </h2>
          <p className="mt-3 text-slate-600 leading-8">
            A good medical college provides strong clinical exposure.
            More patients mean more real-world learning—this is crucial for becoming a confident doctor.
          </p>
        </section>

        {/* Factor 5 */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold">
            5. Academic environment and peer group
          </h2>
          <p className="mt-3 text-slate-600 leading-8">
            The quality of peers and academic culture can influence your motivation,
            discipline, and overall growth during MBBS.
          </p>
        </section>

        {/* Mistakes */}
        <section className="mt-14">
          <h2 className="text-2xl font-semibold">
            Common mistakes while choosing a medical college
          </h2>
          <ul className="mt-4 space-y-3 text-slate-600 leading-8">
            <li>• Choosing based only on brand name</li>
            <li>• Ignoring long-term affordability</li>
            <li>• Following others blindly</li>
            <li>• Not researching enough</li>
          </ul>
        </section>

        {/* Transition */}
        <section className="mt-14">
          <h2 className="text-2xl font-semibold">
            After choosing a college, what next?
          </h2>
          <p className="mt-3 text-slate-600 leading-8">
            Once you secure your medical college, the next challenge is preparing for MBBS life.
            Most students feel unprepared at this stage.
          </p>

          <p className="mt-4 text-slate-600 leading-8">
            👉 Read next:
            <a href="/blog/prepare-mbbs" className="ml-1 text-blue-600 underline">
              How to Prepare for MBBS Before College Starts
            </a>
          </p>
        </section>

        {/* CTA */}
        <div className="mt-16 rounded-2xl bg-slate-950 p-8 text-white">
          <h2 className="text-2xl font-semibold">
            Make the right start to your MBBS journey
          </h2>

          <p className="mt-4 text-slate-300">
            Choosing a college is just the first step. What you do after joining matters even more.
          </p>

          <div className="mt-6 flex gap-4 flex-wrap">
            <a
              href="/book"
              className="rounded-xl bg-white px-6 py-3 text-slate-900"
            >
              Explore MBBS Foundation
            </a>

            <a
              href="/neet"
              className="rounded-xl border border-slate-600 px-6 py-3 text-white"
            >
              After NEET Guide
            </a>
          </div>
        </div>

      </div>
    </main>
  );
}