"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface AdminHeaderProps {
  currentSection?: "home" | "cpr" | "mbbs" | "data" | "system";
  onLogout?: () => void;
}

export default function AdminHeader({ currentSection, onLogout }: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogoutClick = async () => {
    if (onLogout) {
      onLogout();
      return;
    }
    try {
      setLoggingOut(true);
      await fetch("/api/cprsanjeevani/auth", { method: "DELETE" });
      router.push("/admin");
      router.refresh();
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      setLoggingOut(false);
    }
  };

  // Determine active states
  const isHome = currentSection === "home" || pathname === "/admin";
  const isCpr = currentSection === "cpr" || pathname?.startsWith("/cprsanjeevani") || pathname?.startsWith("/admin/cpr");
  const isMbbs = currentSection === "mbbs" || pathname?.startsWith("/admin/mbbs-foundation");
  const isData = currentSection === "data";

  return (
    <header className="sticky top-0 z-40 bg-slate-950 text-white border-b border-slate-800 shadow-md font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between gap-3">
          
          {/* Brand / Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/admin"
              className="flex items-center gap-2.5 group transition"
              title="Admin Portal Home"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-700 text-white font-black text-sm shadow-xs group-hover:bg-red-600 transition">
                ⚡
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm sm:text-base font-black tracking-tight text-white group-hover:text-red-300 transition">
                    Admin Portal
                  </span>
                  <span className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.2 text-[9px] font-bold text-slate-300 uppercase tracking-wider">
                    Master
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-1.5" aria-label="Admin Navigation">
            {/* 1. Dashboard / Home */}
            <Link
              href="/admin"
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 border ${
                isHome
                  ? "bg-slate-800 text-white border-slate-700 shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-slate-900 border-transparent"
              }`}
            >
              <span>🏠</span>
              <span>Dashboard</span>
            </Link>

            {/* 2. CPR Sanjeevani */}
            <div className="relative group">
              <Link
                href="/cprsanjeevani/generate"
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 border ${
                  isCpr
                    ? "bg-teal-950 text-teal-200 border-teal-800 shadow-xs"
                    : "text-slate-300 hover:text-white hover:bg-slate-900 border-transparent"
                }`}
              >
                <span>🫀</span>
                <span>CPR Sanjeevani</span>
              </Link>
            </div>

            {/* 3. MBBS Foundation */}
            <Link
              href="/admin/mbbs-foundation/consultation"
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 border ${
                isMbbs
                  ? "bg-red-950 text-red-200 border-red-800 shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-slate-900 border-transparent"
              }`}
            >
              <span>🩺</span>
              <span>MBBS Foundation</span>
            </Link>

            {/* 4. Data & Exports */}
            <Link
              href="/admin#exports"
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 border ${
                isData
                  ? "bg-slate-800 text-white border-slate-700 shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-slate-900 border-transparent"
              }`}
            >
              <span>📥</span>
              <span>Data &amp; Exports</span>
            </Link>
          </nav>

          {/* Right Actions: Public Site Link & Logout */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 text-[11px] font-semibold text-slate-400 hover:text-slate-200 transition"
              title="Open public website in new tab"
            >
              <span>↗</span>
              <span>Public Site</span>
            </Link>

            <button
              type="button"
              onClick={handleLogoutClick}
              disabled={loggingOut}
              className="rounded-xl border border-rose-900/60 bg-rose-950/40 hover:bg-rose-900/60 px-3 py-1.5 text-xs font-bold text-rose-200 hover:text-white transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
              title="Log out and lock Admin Portal"
            >
              <span>🔒</span>
              <span className="hidden sm:inline">{loggingOut ? "Locking..." : "Log Out"}</span>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 p-1.5 text-slate-300 hover:bg-slate-800 transition"
              aria-label="Toggle Admin Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 pt-2 border-t border-slate-800 space-y-1 text-xs">
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className={`block rounded-xl px-3 py-2 font-bold transition ${
                isHome ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-900"
              }`}
            >
              🏠 Dashboard
            </Link>

            <Link
              href="/cprsanjeevani/generate"
              onClick={() => setMobileMenuOpen(false)}
              className={`block rounded-xl px-3 py-2 font-bold transition ${
                isCpr ? "bg-teal-950 text-teal-200" : "text-slate-300 hover:bg-slate-900"
              }`}
            >
              🫀 CPR Sanjeevani (Generator &amp; Reports)
            </Link>

            <Link
              href="/cprsanjeevani"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-xl px-3 py-2 font-semibold text-slate-400 hover:bg-slate-900 pl-6"
            >
              ↳ Certificate Search &amp; Lookup
            </Link>

            <Link
              href="/admin/cpr/verifications"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-xl px-3 py-2 font-semibold text-slate-400 hover:bg-slate-900 pl-6"
            >
              ↳ Verification Inbox
            </Link>

            <Link
              href="/admin/mbbs-foundation/consultation"
              onClick={() => setMobileMenuOpen(false)}
              className={`block rounded-xl px-3 py-2 font-bold transition ${
                isMbbs ? "bg-red-950 text-red-200" : "text-slate-300 hover:bg-slate-900"
              }`}
            >
              🩺 MBBS Foundation Consultation
            </Link>

            <Link
              href="/admin#exports"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-xl px-3 py-2 font-bold text-slate-300 hover:bg-slate-900"
            >
              📥 Data &amp; Exports
            </Link>

            <div className="pt-2 border-t border-slate-800">
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-xl px-3 py-2 font-semibold text-slate-400 hover:bg-slate-900"
              >
                ↗ Open Public Website
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
