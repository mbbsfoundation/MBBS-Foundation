"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Overview", href: "/neet-to-mbbs", exact: true },
  { label: "Counselling", href: "/neet-to-mbbs/counselling" },
  { label: "College Choice", href: "/neet-to-mbbs/choosing-a-medical-college" },
  { label: "Toolkit", href: "/neet-to-mbbs/toolkit" },
  { label: "Parents", href: "/neet-to-mbbs/parents" },
  { label: "MBBS Prep", href: "/neet-to-mbbs/after-admission" },
  { label: "Challenge 🎯", href: "/neet-to-mbbs/readiness-quiz" },
];

export default function NeetSubNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="NEET to MBBS Guide Navigation"
      className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md print:hidden shadow-2xs"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center justify-between gap-3 overflow-x-auto py-2.5 scrollbar-none">
          {/* Left Context Badge + Navigation Tabs */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <span className="hidden sm:inline-flex h-10 items-center rounded-xl bg-red-50 border border-red-200/90 px-3 text-xs font-black uppercase tracking-wider text-red-800 shrink-0">
              NEET 2026
            </span>

            {NAV_ITEMS.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname?.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`h-10 inline-flex items-center rounded-xl px-3.5 sm:px-4 text-xs sm:text-sm font-bold transition-all whitespace-nowrap border ${
                    isActive
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-slate-50/90 border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:text-slate-950 hover:border-slate-300"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right Status */}
          <div className="hidden xl:flex items-center gap-2 shrink-0 text-xs font-semibold text-slate-500 pl-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>NEET Guidance Ecosystem</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
