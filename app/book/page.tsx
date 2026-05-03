import BookFlipPreview from "../../components/BookFlipPreview";
export default function BookPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-700">
            Featured Book
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">
            MBBS Foundation: Your First Book of Medicine
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            An uptodate guide for MBBS students covering transition into medicine,
            ethics, CPR, first aid, communication, soft skills, and the hidden
            curriculum of becoming a doctor.
          </p>

          <ul className="mt-8 space-y-3 text-slate-700">
            <li>• Transition into MBBS with confidence</li>
            <li>• Ethics, professionalism, and real-life medicine</li>
            <li>• CPR, first aid, and practical readiness</li>
            <li>• Communication, empathy, and growth</li>
          </ul>

          <div className="mt-8 space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Available on
            </p>

            <div className="flex flex-wrap gap-4">
              <a
                href="https://www.amazon.in/dp/B0GTZFSP17?&tag=notionpcom-21"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-red-700 px-6 py-3 text-white transition hover:bg-red-800"
              >
                Buy on Amazon
              </a>

              <a
                href="https://notionpress.com/author/1356076"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-slate-300 px-6 py-3 text-slate-900 transition hover:bg-slate-50"
              >
                Buy on Notion Press
              </a>
            </div>

            <p className="text-sm text-slate-500">
              Direct purchase from MBBS Foundation coming soon.
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <img
            src="/book.png"
            alt="MBBS Foundation Book"
            className="w-72 rounded-2xl shadow-2xl ring-1 ring-slate-200 md:w-96"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
  <div className="mb-10 max-w-3xl">
    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-700">
      Book Sections
    </p>
    <h2 className="mt-3 text-3xl font-semibold tracking-tight">
      Explore the architecture of the book
    </h2>
    <p className="mt-4 leading-8 text-slate-600">
      Each section opens a new dimension of the medical journey. Click any
      section to preview its threshold page.
    </p>
  </div>

  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
    {[
      { title: "Threshold", img: "/sections/1_threshold.png" },
      { title: "Inception", img: "/sections/2_inception.png" },
      { title: "Genesis", img: "/sections/3_genesis.png" },
      { title: "Synthesis", img: "/sections/4_synthesis.png" },
      { title: "Matrix", img: "/sections/5_matrix.png" },
      { title: "Covenant", img: "/sections/6_covenant.png" },
      { title: "Crossroads", img: "/sections/7_crossroads.png" },
      { title: "Revive", img: "/sections/8_revive.png" },
      { title: "Rescue", img: "/sections/9_rescue.png" },
      { title: "Impact", img: "/sections/10_impact.png" },
      { title: "Tempest", img: "/sections/11_tempest.png" },
      { title: "Illumination", img: "/sections/12_illumination.png" },
      { title: "Resonance", img: "/sections/13_resonance.png" },
      { title: "Hidden Curriculum", img: "/sections/14_hidden.png" },
      { title: "Continuum", img: "/sections/15_continuum.png" },
    ].map((section, i) => (
      <a
        key={i}
        href={section.img}
        target="_blank"
        rel="noopener noreferrer"
        className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-slate-400"
      >
        <h3 className="text-lg font-semibold text-slate-900 transition group-hover:text-red-700">
          {section.title}
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          Click to view section page
        </p>
      </a>
    ))}
  </div>
</section>
    <section className="mx-auto max-w-6xl px-6 py-16">
  <div className="mb-10 max-w-3xl">
    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-700">
      Preview Inside the Book
    </p>
    <h2 className="mt-3 text-3xl font-semibold tracking-tight">
      Explore the table of contents and sample pages
    </h2>
    <p className="mt-4 leading-8 text-slate-600">
      Browse selected preview pages from the book, including contents and
      sample chapters.
    </p>
  </div>

  <BookFlipPreview />
</section>
<p className="mt-4 text-sm text-blue-600">
  Just appeared for NEET? Read the complete guide →
  <a href="/neet" className="underline ml-1">
    After NEET What Next
  </a>
</p>
<section className="mx-auto max-w-4xl px-6 py-16 text-center">

  <p className="text-sm uppercase tracking-[0.2em] text-red-700 font-semibold">
    Share Your Experience
  </p>

  <h2 className="mt-3 text-3xl font-semibold">
    Have you read MBBS Foundation: Your First Book of Medicine?
  </h2>

  <p className="mt-4 text-lg text-slate-600">
    Your feedback helps guide future medical students and strengthens this learning ecosystem.
  </p>

  {/* Star Display */}
  <div className="mt-6 text-3xl text-yellow-500">
    ★★★★★
  </div>

  <p className="mt-2 text-sm text-slate-500">
    Rate your experience and share your thoughts
  </p>

  {/* Button */}
  <div className="mt-8">
    <a
      href="https://forms.gle/SQhXxBX9oMDLg5a36"
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-xl bg-red-700 px-8 py-3 text-white text-lg transition hover:bg-red-800"
    >
      Submit Your Review
    </a>
  </div>

  <p className="mt-4 text-sm text-slate-500">
    Takes less than 1 minute
  </p>

</section>
</main>
  );
}