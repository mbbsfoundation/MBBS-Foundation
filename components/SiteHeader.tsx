"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface NavItem {
  label: string;
  href: string;
  isExternal?: boolean;
  special?: "neet" | "cpr";
}

const NAV_ITEMS: NavItem[] = [
  { label: "🎓 NEET to MBBS", href: "/neet-to-mbbs", special: "neet" },
  { label: "About", href: "/about" },
  { label: "Book", href: "/book" },
  { label: "CPR Day", href: "/cprday" },
  { label: "Sanjeevani Certificates", href: "/cprsanjeevani", special: "cpr" },
  { label: "Resources", href: "/resources" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isNavActive = (item: NavItem) => {
    if (!pathname) return false;
    if (item.href === "/neet-to-mbbs") return pathname.startsWith("/neet-to-mbbs");
    if (item.href === "/cprsanjeevani") return pathname.startsWith("/cprsanjeevani");
    if (item.href === "/blog") return pathname.startsWith("/blog");
    if (item.href === "/cprday") return pathname === "/cprday" || (pathname.startsWith("/cprday") && !pathname.startsWith("/cprsanjeevani"));
    return pathname === item.href;
  };

  return (
    <div className="relative z-50 print:hidden">
      {/* Top Announcement Banner for NEET Counselling & New MBBS Season */}
      <div className="bg-gradient-to-r from-red-700 via-rose-700 to-purple-800 text-white text-xs sm:text-sm py-2 px-4 text-center font-medium shadow-sm">
        <div className="mx-auto max-w-7xl flex items-center justify-center gap-2 flex-wrap">
          <span>🎓 <strong>Heading to Medical College?</strong> Get <em>MBBS Foundation: Your First Book of Medicine</em></span>
          <span className="hidden sm:inline">•</span>
          <span className="bg-white/10 px-2 py-0.5 rounded border border-white/20 text-xs">
            Use code <code className="font-mono font-bold text-amber-300">FOUNDERCIRCLE</code> for 20% OFF on Notion Press!
          </span>
          <Link
            href="/neet-to-mbbs"
            className="underline underline-offset-2 font-bold hover:text-amber-300 transition ml-1 inline-flex items-center gap-1"
          >
            NEET to MBBS Guide →
          </Link>
        </div>
      </div>

      {/* Main Header Container */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all duration-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-3 lg:gap-6">
            
            {/* Zone 1: Ayurvigyan Foundation Logo / Branding */}
            <Link href="/" className="block shrink-0 group">
              <p className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 group-hover:text-red-700 transition">
                Ayurvigyan Foundation
              </p>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-red-700">
                Science • Skill • Service
              </p>
            </Link>

            {/* Zone 2: Cohesive Desktop Navigation Group */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5" aria-label="Main Navigation">
              {NAV_ITEMS.map((item) => {
                const active = isNavActive(item);

                // NEET to MBBS Special Tab
                if (item.special === "neet") {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`inline-flex items-center justify-center whitespace-nowrap rounded-xl px-2.5 xl:px-3 py-1.5 text-xs xl:text-[13px] font-bold transition-all duration-150 ${
                        active
                          ? "bg-red-700 text-white shadow-2xs border border-red-700"
                          : "bg-red-50/80 text-red-800 border border-red-200/90 hover:bg-red-100 hover:text-red-900"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                }

                // Sanjeevani Certificates Special Tab
                if (item.special === "cpr") {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`inline-flex items-center justify-center whitespace-nowrap rounded-xl px-2.5 xl:px-3 py-1.5 text-xs xl:text-[13px] font-semibold transition-all duration-150 ${
                        active
                          ? "bg-teal-800 text-white font-bold shadow-2xs border border-teal-800"
                          : "text-slate-700 border border-transparent hover:bg-teal-50 hover:text-teal-900 hover:border-teal-200"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                }

                // Standard Nav Links with subtle button/tab geometry
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-xl px-2.5 xl:px-3 py-1.5 text-xs xl:text-[13px] font-semibold transition-all duration-150 ${
                      active
                        ? "bg-slate-900 text-white font-bold shadow-2xs border border-slate-900"
                        : "text-slate-700 border border-transparent hover:bg-slate-100 hover:text-slate-950 hover:border-slate-200/70"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Zone 3: Far Right - Buy Now CTA & Mobile Hamburger */}
            <div className="flex items-center gap-2.5 shrink-0">
              <a
                href="https://notionpress.com/in/read/mbbs-foundation"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center justify-center whitespace-nowrap rounded-xl bg-slate-950 px-4 py-1.5 text-xs xl:text-[13px] font-bold text-white shadow-xs hover:bg-red-700 hover:shadow-md transition-all duration-150 cursor-pointer"
                aria-label="Buy MBBS Foundation Book on Notion Press"
              >
                <span>Buy Now</span>
              </a>

              {/* Mobile Menu Toggle Button */}
              <button
                type="button"
                onClick={() => setOpen(!open)}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50 transition lg:hidden cursor-pointer"
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
              >
                {open ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Responsive Mobile / Tablet Drawer */}
          {open && (
            <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg lg:hidden">
              <nav className="flex flex-col gap-1.5 text-sm" aria-label="Mobile Navigation">
                {NAV_ITEMS.map((item) => {
                  const active = isNavActive(item);

                  if (item.special === "neet") {
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 font-bold transition ${
                          active
                            ? "bg-red-700 text-white"
                            : "bg-red-50 text-red-800 border border-red-200"
                        }`}
                      >
                        <span>{item.label}</span>
                        <span>→</span>
                      </Link>
                    );
                  }

                  if (item.special === "cpr") {
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 font-semibold transition ${
                          active
                            ? "bg-teal-800 text-white font-bold"
                            : "text-slate-700 bg-teal-50/50 hover:bg-teal-50 hover:text-teal-900 border border-teal-100"
                        }`}
                      >
                        <span>{item.label}</span>
                        <span>→</span>
                      </Link>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 font-medium transition ${
                        active
                          ? "bg-slate-900 text-white font-bold"
                          : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                      }`}
                    >
                      <span>{item.label}</span>
                      <span>→</span>
                    </Link>
                  );
                })}

                <div className="pt-2 mt-2 border-t border-slate-200">
                  <a
                    href="https://notionpress.com/in/read/mbbs-foundation"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-center text-white font-bold hover:bg-red-700 transition"
                  >
                    Buy Now on Notion Press
                  </a>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}