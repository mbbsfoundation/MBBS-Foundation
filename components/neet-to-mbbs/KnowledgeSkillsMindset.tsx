import React from "react";
import Link from "next/link";

interface KnowledgeSkillsMindsetProps {
  className?: string;
}

export default function KnowledgeSkillsMindset({
  className = "my-10",
}: KnowledgeSkillsMindsetProps) {
  return (
    <section
      aria-label="Three Dimensions of Medical Readiness"
      className={`rounded-3xl border border-slate-200/90 bg-gradient-to-b from-slate-50/80 via-white to-slate-50/40 p-6 sm:p-8 space-y-6 shadow-xs ${className}`}
    >
      <div className="text-center space-y-1.5 max-w-2xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">
          The Three Pillars of Medical Readiness
        </p>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
          Knowledge • Skills • Mindset
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Entering medical college is a holistic transformation. Balance your preparation across all three dimensions before your first day of MBBS.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {/* Pillar 1: Knowledge */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 border border-sky-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-800">
              <span>📖</span> 1. Knowledge
            </span>
            <h4 className="text-sm font-bold text-slate-900">
              Prepare for Medical College
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Understand first-year basic sciences (Anatomy, Physiology, Biochemistry), Foundation Course, and academic habits with <em>MBBS Foundation</em>.
            </p>
          </div>

          <Link
            href="/book"
            className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
          >
            <span>Explore Book</span>
            <span>→</span>
          </Link>
        </div>

        {/* Pillar 2: Skills */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-800">
              <span>🩺</span> 2. Skills
            </span>
            <h4 className="text-sm font-bold text-slate-900">
              Learn Your First Lifesaving Skill
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Begin learning emergency recognition and Cardiopulmonary Resuscitation (CPR) through the <em>CPR eSanjeevani</em> online module.
            </p>
          </div>

          <Link
            href="/cprday#cpr-esanjeevani"
            className="inline-flex items-center justify-center gap-1 rounded-xl bg-rose-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-800 transition"
          >
            <span>Start CPR Module</span>
            <span>→</span>
          </Link>
        </div>

        {/* Pillar 3: Mindset */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
              <span>🎯</span> 3. Mindset
            </span>
            <h4 className="text-sm font-bold text-slate-900">
              Think Like a Future Doctor
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Test your clinical reasoning, medical ethics, patient communication, and professional awareness with the <em>Future Doctor Challenge</em>.
            </p>
          </div>

          <Link
            href="/neet-to-mbbs/readiness-quiz"
            className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 transition"
          >
            <span>Take Challenge</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
