"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-6 py-4">
        <div className="flex items-center justify-between">
          <a href="/" className="block">
            <p className="text-2xl font-bold md:text-3xl">MBBS Foundation</p>
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
  href="/resources"
  className={`transition ${
    pathname === "/resources"
      ? "text-red-700 font-semibold"
      : "hover:text-slate-950"
  }`}
>
  Resources
</a>
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
  );
}