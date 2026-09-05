"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href?: string;
  exact?: boolean;
  disabled?: boolean;
  badge?: string;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Overview",
    href: "/mbbs-foundation/consultation",
    exact: true,
    description: "Explore the MBBS Foundation consultation and choose the pathway relevant to you.",
  },
  {
    label: "Professional Consultation",
    href: "/mbbs-foundation/consultation/professional",
    description: "For faculty, clinicians and medical educators helping identify how students can begin MBBS better prepared.",
  },
  {
    label: "Student & Intern Voice",
    href: "/mbbs-foundation/consultation/student-voice",
    description: "For current MBBS students and interns to share what they wish they had known when they started.",
  },
  {
    label: "Entry Readiness",
    disabled: true,
    badge: "Coming Soon",
    description: "A future readiness experience for students preparing to enter medical college.",
  },
];

export default function ConsultationSubNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="MBBS Foundation Consultation Navigation"
      className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-2xs print:hidden"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center justify-between gap-3 overflow-x-auto py-2.5 scrollbar-none">
          {/* Left Badge + Navigation Links */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <span className="hidden sm:inline-flex h-9 items-center rounded-xl bg-red-50 border border-red-200/90 px-3 text-xs font-black uppercase tracking-wider text-red-800 shrink-0">
              Consultation
            </span>

            {NAV_ITEMS.map((item, idx) => {
              if (item.disabled || !item.href) {
                return (
                  <span
                    key={idx}
                    className="h-9 inline-flex items-center gap-1.5 rounded-xl px-3 sm:px-3.5 text-xs font-medium text-slate-400 bg-slate-100/70 border border-slate-200/60 cursor-not-allowed whitespace-nowrap"
                    title={item.description}
                    aria-label={`${item.label} (${item.badge || "Coming Soon"}) — ${item.description}`}
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200/80 text-slate-500 px-1.5 py-0.5 rounded">
                        {item.badge}
                      </span>
                    )}
                    <span className="sr-only">: {item.description}</span>
                  </span>
                );
              }

              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname?.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.description}
                  aria-label={`${item.label} — ${item.description}`}
                  className={`h-9 inline-flex items-center rounded-xl px-3.5 sm:px-4 text-xs sm:text-sm font-bold transition-all whitespace-nowrap border ${
                    isActive
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-slate-50/90 border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:text-slate-950 hover:border-slate-300"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span>{item.label}</span>
                  <span className="sr-only">: {item.description}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Status Indicator */}
          <div className="hidden xl:flex items-center gap-2 shrink-0 text-xs font-semibold text-slate-500 pl-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>AHA India Collaborative</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
