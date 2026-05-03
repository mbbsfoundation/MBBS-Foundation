export const metadata = {
  title: "Medical Student Guides | MBBS Foundation Blog",
  description:
    "Guides for MBBS students covering NEET transition, first-year preparation, CPR, and real-world medical learning.",
};

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 px-6 py-16">
      <div className="mx-auto max-w-4xl">

        <h1 className="text-3xl md:text-4xl font-bold">
          MBBS Foundation Blog
        </h1>

        <p className="mt-4 text-lg text-slate-600">
          Practical guides for students stepping into medicine.
        </p>

        <div className="mt-10 space-y-6">

          <a href="/neet" className="block rounded-xl border p-6 hover:shadow-lg">
            <h2 className="text-xl font-semibold">
              After NEET What Next? Complete Guide
            </h2>
            <p className="mt-2 text-slate-600">
              Learn how to transition from NEET to MBBS with clarity and confidence.
            </p>
          </a>
          <a href="/blog/prepare-mbbs" className="block rounded-xl border p-6 hover:shadow-lg">
  <h2 className="text-xl font-semibold">
    How to Prepare for MBBS Before College Starts
  </h2>
  <p className="mt-2 text-slate-600">
    A complete guide to prepare for MBBS after NEET with clarity and confidence.
  </p>
</a>
<a href="/blog/neet-counselling" className="block rounded-xl border p-6 hover:shadow-lg">
  <h2 className="text-xl font-semibold">
    NEET Counselling Process Explained
  </h2>
  <p className="mt-2 text-slate-600">
    Step-by-step guide to NEET counselling, college selection, and admission.
  </p>
</a>

        </div>

      </div>
    </main>
  );
}