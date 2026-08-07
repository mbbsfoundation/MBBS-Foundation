import BookFlipPreview from "../../components/BookFlipPreview";
export default function BookPage() {
  const bookSchema = {
    "@context": "https://schema.org",
    "@type": "Book",
    "name": "MBBS Foundation: Your First Book of Medicine",
    "author": {
      "@type": "Person",
      "name": "Dr Lokesh Tiwari",
      "jobTitle": "Clinician & Educator"
    },
    "url": "https://mbbsfoundation.com/book",
    "image": "https://mbbsfoundation.com/book.png",
    "description": "An uptodate guide for MBBS students covering transition into medicine, ethics, CPR, first aid, communication, soft skills, and the hidden curriculum of becoming a doctor.",
    "publisher": {
      "@type": "Organization",
      "name": "Notion Press"
    },
    "inLanguage": "English",
    "offers": [
      {
        "@type": "Offer",
        "seller": {
          "@type": "Organization",
          "name": "Notion Press"
        },
        "url": "https://notionpress.com/author/1356076"
      },
      {
        "@type": "Offer",
        "seller": {
          "@type": "Organization",
          "name": "Amazon India"
        },
        "url": "https://www.amazon.in/dp/B0GTZFSP17?&tag=notionpcom-21"
      }
    ]
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bookSchema) }}
      />
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

            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-4 items-center">
                <a
                  href="https://notionpress.com/author/1356076"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-red-700 px-6 py-3 font-semibold text-white transition hover:bg-red-800 shadow-sm"
                >
                  Buy on Notion Press
                </a>

                <a
                  href="https://www.amazon.in/dp/B0GTZFSP17?&tag=notionpcom-21"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  Buy on Amazon
                </a>
              </div>

              <div className="inline-flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3.5 py-2 text-xs sm:text-sm text-red-800 max-w-fit">
                <span className="font-bold text-red-700">🎉 Special Offer:</span> Use coupon code <code className="rounded bg-white px-2 py-0.5 font-mono font-bold text-red-700 border border-red-300">FOUNDERCIRCLE</code> for 20% discount on Notion Press!
              </div>
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
      { title: "Threshold", img: "/sections/1_threshold.png", bg: "bg-red-50/80 border-red-200 hover:border-red-400", text: "text-red-950 group-hover:text-red-700", sub: "text-red-800/70" },
      { title: "Inception", img: "/sections/2_inception.png", bg: "bg-sky-50/80 border-sky-200 hover:border-sky-400", text: "text-sky-950 group-hover:text-sky-700", sub: "text-sky-800/70" },
      { title: "Genesis", img: "/sections/3_genesis.png", bg: "bg-amber-50/80 border-amber-200 hover:border-amber-400", text: "text-amber-950 group-hover:text-amber-700", sub: "text-amber-800/70" },
      { title: "Synthesis", img: "/sections/4_synthesis.png", bg: "bg-indigo-50/80 border-indigo-200 hover:border-indigo-400", text: "text-indigo-950 group-hover:text-indigo-700", sub: "text-indigo-800/70" },
      { title: "Matrix", img: "/sections/5_matrix.png", bg: "bg-purple-50/80 border-purple-200 hover:border-purple-400", text: "text-purple-950 group-hover:text-purple-700", sub: "text-purple-800/70" },
      { title: "Covenant", img: "/sections/6_covenant.png", bg: "bg-emerald-50/80 border-emerald-200 hover:border-emerald-400", text: "text-emerald-950 group-hover:text-emerald-700", sub: "text-emerald-800/70" },
      { title: "Crossroads", img: "/sections/7_crossroads.png", bg: "bg-rose-50/80 border-rose-200 hover:border-rose-400", text: "text-rose-950 group-hover:text-rose-700", sub: "text-rose-800/70" },
      { title: "Revive", img: "/sections/8_revive.png", bg: "bg-teal-50/80 border-teal-200 hover:border-teal-400", text: "text-teal-950 group-hover:text-teal-700", sub: "text-teal-800/70" },
      { title: "Rescue", img: "/sections/9_rescue.png", bg: "bg-orange-50/80 border-orange-200 hover:border-orange-400", text: "text-orange-950 group-hover:text-orange-700", sub: "text-orange-800/70" },
      { title: "Impact", img: "/sections/10_impact.png", bg: "bg-blue-50/80 border-blue-200 hover:border-blue-400", text: "text-blue-950 group-hover:text-blue-700", sub: "text-blue-800/70" },
      { title: "Tempest", img: "/sections/11_tempest.png", bg: "bg-violet-50/80 border-violet-200 hover:border-violet-400", text: "text-violet-950 group-hover:text-violet-700", sub: "text-violet-800/70" },
      { title: "Illumination", img: "/sections/12_illumination.png", bg: "bg-yellow-50/80 border-yellow-200 hover:border-yellow-400", text: "text-yellow-950 group-hover:text-yellow-700", sub: "text-yellow-900/70" },
      { title: "Resonance", img: "/sections/13_resonance.png", bg: "bg-cyan-50/80 border-cyan-200 hover:border-cyan-400", text: "text-cyan-950 group-hover:text-cyan-700", sub: "text-cyan-800/70" },
      { title: "Hidden Curriculum", img: "/sections/14_hidden.png", bg: "bg-fuchsia-50/80 border-fuchsia-200 hover:border-fuchsia-400", text: "text-fuchsia-950 group-hover:text-fuchsia-700", sub: "text-fuchsia-800/70" },
      { title: "Continuum", img: "/sections/15_continuum.png", bg: "bg-lime-50/80 border-lime-200 hover:border-lime-400", text: "text-lime-950 group-hover:text-lime-800", sub: "text-lime-900/70" },
    ].map((section, i) => (
      <a
        key={i}
        href={section.img}
        target="_blank"
        rel="noopener noreferrer"
        className={`group rounded-2xl border ${section.bg} p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md`}
      >
        <h3 className={`text-lg font-bold transition ${section.text}`}>
          {section.title}
        </h3>
        <p className={`mt-2 text-xs font-medium ${section.sub}`}>
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