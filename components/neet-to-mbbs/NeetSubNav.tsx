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
      className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-md print:hidden shadow-2xs"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 overflow-x-auto py-2.5 scrollbar-none">
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <span className="hidden sm:inline-flex items-center rounded-md bg-red-50 border border-red-200/80 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-red-800 mr-2">
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
                  className={`rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-950 hover:bg-slate-100"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-2 shrink-0 text-xs font-semibold text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            <span>NEET Guidance Ecosystem</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
