"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="relative z-50">
      {/* Top Announcement Banner for NEET Counseling & New MBBS Season */}
      <div className="bg-gradient-to-r from-red-700 via-rose-700 to-purple-800 text-white text-xs sm:text-sm py-2 px-4 text-center font-medium shadow-sm">
        <div className="mx-auto max-w-6xl flex items-center justify-center gap-2 flex-wrap">
          <span>🎓 <strong>Heading to Medical College?</strong> Get <em>MBBS Foundation: Your First Book of Medicine</em></span>
          <span className="hidden sm:inline">•</span>
          <span className="bg-white/10 px-2 py-0.5 rounded border border-white/20">
            Use code <code className="font-mono font-bold text-amber-300">FOUNDERCIRCLE</code> for 20% OFF on Notion Press!
          </span>
          <a
            href="https://notionpress.com/author/1356076"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 font-bold hover:text-amber-300 transition ml-1"
          >
            Order Now →
          </a>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-6 py-4">
        <div className="flex items-center justify-between">
          <a href="/" className="block">
            <p className="text-2xl font-bold md:text-3xl">Ayurvigyan Foundation</p>
            <p className="text-sm uppercase tracking-[0.3em] text-red-700">
              Science • Skill • Service
            </p>
          </a>

          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a
  href="/about"
  className={`transition ${
    pathname === "/about"
      ? "text-red-700 font-semibold"
      : "hover:text-slate-950"
  }`}
>
  About
</a>
            <a
  href="/book"
  className={`transition ${
    pathname === "/book"
      ? "text-red-700 font-semibold"
      : "hover:text-slate-950"
  }`}
>
  Book
</a>
            <a
  href="/cprday"
  className={`transition ${
    pathname === "/cprday"
      ? "text-red-700 font-semibold"
      : "hover:text-slate-950"
  }`}
>
  CPR Sanjeevani
</a>
            <a
  href="/resources"
  className={`transition ${
    pathname === "/resources"
      ? "text-red-700 font-semibold"
      : "hover:text-slate-950"
  }`}
>
  Resources
</a>
<a href="/blog">Blog</a>
            <a
  href="/contact"
  className={`transition ${
    pathname === "/contact"
      ? "text-red-700 font-semibold"
      : "hover:text-slate-950"
  }`}
>
  Contact
</a>
            <a
              href="https://notionpress.com/in/read/mbbs-foundation"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-black px-4 py-2 text-white"
            >
              Buy Now
            </a>
          </nav>

          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-3 py-2 text-sm md:hidden"
            aria-label="Toggle menu"
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>

        {open && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:hidden">
            <nav className="flex flex-col gap-4 text-sm">
              <a href="/about" onClick={() => setOpen(false)}>
                About
              </a>
              <a href="/book" onClick={() => setOpen(false)}>
                Book
              </a>
              <a href="/cprday" onClick={() => setOpen(false)}>
                CPR Sanjeevani
              </a>
              <a href="/resources" onClick={() => setOpen(false)}>
                Resources
              </a>
              <a href="/contact" onClick={() => setOpen(false)}>
                Contact
              </a>
              <a
                href="https://notionpress.com/in/read/mbbs-foundation"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="rounded-xl bg-black px-4 py-3 text-center text-white"
              >
                Buy Now
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
    </div>
  );
}