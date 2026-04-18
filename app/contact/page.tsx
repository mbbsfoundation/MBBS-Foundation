export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="mx-auto max-w-5xl px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-700">
          Contact
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">
          Get in touch
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
          For collaborations, academic engagement, training ideas, speaking
          invitations, or general queries, connect with MBBS Foundation.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-8 shadow-sm">
            <h2 className="text-2xl font-semibold">Email</h2>
            <a
              href="mailto:admin@mbbsfoundation.com"
              className="mt-4 inline-block text-lg text-red-700 hover:underline"
            >
              admin@mbbsfoundation.com
            </a>
            <p className="mt-4 leading-8 text-slate-600">
              Reach out for partnerships, academic opportunities, and future
              collaboration.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
            <h2 className="text-2xl font-semibold">Looking ahead</h2>
            <p className="mt-4 leading-8 text-slate-600">
              MBBS Foundation is growing into a larger ecosystem of books,
              resources, mentorship, CPR education, and medical learning
              programs.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}