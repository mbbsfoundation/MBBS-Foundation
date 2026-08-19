import React from "react";
import Link from "next/link";

interface NavLinkItem {
  title: string;
  href: string;
  label?: string;
}

interface PrevNextNavProps {
  prev?: NavLinkItem;
  next?: NavLinkItem;
  parallel?: NavLinkItem;
  hubHref?: string;
}

export default function PrevNextNav({
  prev,
  next,
  parallel,
  hubHref = "/neet-to-mbbs",
}: PrevNextNavProps) {
  return (
    <div className="border-t border-slate-200 bg-white py-8 px-4 sm:px-6 print:hidden">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Previous Page */}
          {prev ? (
            <Link
              href={prev.href}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 transition hover:border-slate-300 hover:bg-white group"
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                ← {prev.label || "Previous Guide"}
              </span>
              <p className="mt-1 text-sm sm:text-base font-bold text-slate-900 group-hover:text-red-700 transition">
                {prev.title}
              </p>
            </Link>
          ) : (
            <Link
              href={hubHref}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 transition hover:border-slate-300 hover:bg-white group"
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                ← Return to
              </span>
              <p className="mt-1 text-sm sm:text-base font-bold text-slate-900 group-hover:text-red-700 transition">
                NEET to MBBS 2026 Hub
              </p>
            </Link>
          )}

          {/* Next Page */}
          {next ? (
            <Link
              href={next.href}
              className="flex flex-col justify-between rounded-2xl border-2 border-slate-900 bg-slate-900 p-4 sm:p-5 text-white transition hover:bg-slate-800 group text-right"
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-400">
                {next.label || "Next Guide"} →
              </span>
              <p className="mt-1 text-sm sm:text-base font-bold text-white group-hover:text-slate-100 transition">
                {next.title}
              </p>
            </Link>
          ) : parallel ? (
            <Link
              href={parallel.href}
              className="flex flex-col justify-between rounded-2xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5 transition hover:border-amber-300 hover:bg-amber-50 group text-right"
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                {parallel.label || "Related Resource"} →
              </span>
              <p className="mt-1 text-sm sm:text-base font-bold text-slate-900 group-hover:text-amber-900 transition">
                {parallel.title}
              </p>
            </Link>
          ) : null}
        </div>

        {/* Global Ecosystem Quick Bar */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-600">
          <Link href="/neet-to-mbbs" className="hover:text-slate-950 underline underline-offset-2">
            🏠 NEET to MBBS Master Hub
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/neet-to-mbbs/counselling" className="text-slate-600 hover:text-red-700">
              Counselling
            </Link>
            <span>•</span>
            <Link href="/neet-to-mbbs/choosing-a-medical-college" className="text-slate-600 hover:text-red-700">
              College Choice
            </Link>
            <span>•</span>
            <Link href="/neet-to-mbbs/toolkit" className="text-slate-600 hover:text-red-700">
              Free Toolkit
            </Link>
            <span>•</span>
            <Link href="/neet-to-mbbs/parents" className="text-slate-600 hover:text-red-700">
              Parents
            </Link>
            <span>•</span>
            <Link href="/neet-to-mbbs/after-admission" className="text-slate-600 hover:text-red-700">
              MBBS Prep
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
