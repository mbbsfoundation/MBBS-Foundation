"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";

export default function MasterAdminHomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [systemHealth, setSystemHealth] = useState<any | null>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(false);

  // Check authentication status on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/cprsanjeevani/auth");
        const data = await res.json();
        if (res.ok && data.authenticated) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      }
    }
    checkAuth();
  }, []);

  // Fetch optional system health when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      async function fetchHealth() {
        try {
          setLoadingHealth(true);
          const res = await fetch("/api/cprday/health");
          if (res.ok) {
            const data = await res.json();
            setSystemHealth(data);
          }
        } catch (e) {
          console.error("Health check error:", e);
        } finally {
          setLoadingHealth(false);
        }
      }
      fetchHealth();
    }
  }, [isAuthenticated]);

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;

    setAuthLoading(true);
    setAuthError(null);

    try {
      const res = await fetch("/api/cprsanjeevani/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setPasswordInput("");
      } else {
        setAuthError(data.error || "Incorrect admin password. Access denied.");
      }
    } catch {
      setAuthError("Network error. Unable to authenticate.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await fetch("/api/cprsanjeevani/auth", { method: "DELETE" });
      setIsAuthenticated(false);
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  // Loading Screen
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></span>
          <span>Verifying Admin Authorization...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated Login View
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 text-slate-100 font-sans">
        <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-br from-red-700 to-rose-900 border border-red-700/80 flex items-center justify-center text-2xl text-white shadow-md">
              ⚡
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Master Admin Portal
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ayurvigyan / MBBS Foundation Operational Console
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Master Admin Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password..."
                className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                autoFocus
              />
            </div>

            {authError && (
              <div className="rounded-xl bg-rose-950/60 border border-rose-800/80 p-3 text-xs text-rose-300 animate-in fade-in">
                ⚠️ {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading || !passwordInput.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-800 hover:to-rose-800 py-3 text-sm font-bold text-white shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {authLoading ? "Unlocking Console..." : "Unlock Master Admin"}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800 text-center">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white transition"
            >
              ← Return to Ayurvigyan Foundation Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Admin Home View
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Reusable Admin Navigation Header */}
      <AdminHeader currentSection="home" onLogout={handleLogout} />

      {/* Main Dashboard Interaction Area */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Control Centre Banner */}
        <section className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-md bg-red-950 border border-red-800 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-red-300">
                Master Admin Portal
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Session Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Operational Control Centre
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Ayurvigyan / MBBS Foundation Operational Console. Manage CPR Sanjeevani certifications, review MBBS Foundation consultation insights, access data exports, and monitor systems.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/admin/mbbs-foundation/consultation"
              className="rounded-xl bg-red-700 hover:bg-red-800 px-4 py-2.5 text-xs sm:text-sm font-bold text-white transition shadow-sm"
            >
              Consultation Dashboard →
            </Link>
            <Link
              href="/cprsanjeevani/generate"
              className="rounded-xl bg-teal-800 hover:bg-teal-700 px-4 py-2.5 text-xs sm:text-sm font-bold text-white transition shadow-sm"
            >
              CPR Console →
            </Link>
          </div>
        </section>

        {/* 4 Main Programme Control Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: CPR SANJEEVANI */}
          <section className="rounded-2xl bg-white p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5 hover:border-teal-400/80 transition flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xl font-bold">
                    🫀
                  </span>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">
                      CPR Sanjeevani
                    </h2>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                      National IAP CPR Day Programme
                    </span>
                  </div>
                </div>
                <span className="rounded-md bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 text-[10px] font-bold">
                  28 States
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Certificate management, programme reports and verification operations across National IAP CPR Day training venues.
              </p>
            </div>

            <div className="space-y-2.5 pt-3 border-t border-slate-100">
              <Link
                href="/cprsanjeevani/generate"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-teal-50/80 border border-slate-200 hover:border-teal-300 text-xs font-bold text-slate-800 hover:text-teal-950 transition group"
              >
                <div className="flex items-center gap-2">
                  <span>📦</span>
                  <span>Certificate Generator &amp; State Reports</span>
                </div>
                <span className="text-slate-400 group-hover:text-teal-700 transition">→</span>
              </Link>

              <Link
                href="/cprsanjeevani"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-teal-50/80 border border-slate-200 hover:border-teal-300 text-xs font-bold text-slate-800 hover:text-teal-950 transition group"
              >
                <div className="flex items-center gap-2">
                  <span>🔍</span>
                  <span>Certificate Search &amp; Master Lookup</span>
                </div>
                <span className="text-slate-400 group-hover:text-teal-700 transition">→</span>
              </Link>

              <Link
                href="/admin/cpr/verifications"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-teal-50/80 border border-slate-200 hover:border-teal-300 text-xs font-bold text-slate-800 hover:text-teal-950 transition group"
              >
                <div className="flex items-center gap-2">
                  <span>📥</span>
                  <span>Coordinator Verification Inbox</span>
                </div>
                <span className="text-slate-400 group-hover:text-teal-700 transition">→</span>
              </Link>
            </div>
          </section>

          {/* Card 2: MBBS FOUNDATION */}
          <section className="rounded-2xl bg-white p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5 hover:border-red-400/80 transition flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 border border-red-200 text-red-800 text-xl font-bold">
                    🩺
                  </span>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">
                      MBBS Foundation
                    </h2>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-red-700">
                      National Consultation Analytics
                    </span>
                  </div>
                </div>
                <span className="rounded-md bg-red-50 text-red-800 border border-red-200 px-2 py-0.5 text-[10px] font-bold">
                  V2 Locked
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Professional Consultation and Student &amp; Intern Voice analytics, contributor pools, readiness ratings, and qualitative reflections.
              </p>
            </div>

            <div className="space-y-2.5 pt-3 border-t border-slate-100">
              <Link
                href="/admin/mbbs-foundation/consultation"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-red-50/80 border border-slate-200 hover:border-red-300 text-xs font-bold text-slate-800 hover:text-red-950 transition group"
              >
                <div className="flex items-center gap-2">
                  <span>📊</span>
                  <span>Consultation Analytics Dashboard</span>
                </div>
                <span className="text-slate-400 group-hover:text-red-700 transition">→</span>
              </Link>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                  <span className="block font-bold text-slate-900 text-xs">Professional</span>
                  <span className="text-[10px] text-slate-500">Faculty &amp; Clinicians</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                  <span className="block font-bold text-slate-900 text-xs">Student Voice</span>
                  <span className="text-[10px] text-slate-500">Students &amp; Interns</span>
                </div>
              </div>
            </div>
          </section>

          {/* Card 3: DATA & EXPORTS */}
          <section id="exports" className="rounded-2xl bg-white p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5 hover:border-slate-400 transition flex flex-col justify-between scroll-mt-20">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xl font-bold">
                    📥
                  </span>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">
                      Data &amp; Exports
                    </h2>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                      Raw CSV Downloads
                    </span>
                  </div>
                </div>
                <span className="rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                  Live Sync
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Direct authenticated CSV data downloads for research, educational innovation, and audit analysis.
              </p>
            </div>

            <div className="space-y-2.5 pt-3 border-t border-slate-100">
              <a
                href="/api/admin/mbbs-foundation/consultation/export"
                download
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-300 text-xs font-bold text-slate-800 hover:text-emerald-950 transition group"
              >
                <div className="flex items-center gap-2">
                  <span>📄</span>
                  <span>Professional Consultation CSV</span>
                </div>
                <span className="text-emerald-700 text-xs font-bold">Download ↓</span>
              </a>

              <a
                href="/api/admin/mbbs-foundation/consultation/student-voice/export"
                download
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-300 text-xs font-bold text-slate-800 hover:text-emerald-950 transition group"
              >
                <div className="flex items-center gap-2">
                  <span>📄</span>
                  <span>Student &amp; Intern Voice CSV</span>
                </div>
                <span className="text-emerald-700 text-xs font-bold">Download ↓</span>
              </a>
            </div>
          </section>

          {/* Card 4: SYSTEM STATUS & TOOLS */}
          <section className="rounded-2xl bg-white p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5 hover:border-slate-400 transition flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xl font-bold">
                    ⚙️
                  </span>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">
                      System &amp; Admin Tools
                    </h2>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Environment &amp; Session Health
                    </span>
                  </div>
                </div>
                <span className="rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold">
                  Healthy
                </span>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Admin Session:</span>
                  <span className="font-bold text-slate-900">Active (HMAC Signed)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>CPR Certificate Engine:</span>
                  <span className="font-bold text-emerald-700">Online</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>MBBS Consultation Engine:</span>
                  <span className="font-bold text-emerald-700">Online</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <a
                href="/api/cprday/health"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-slate-600 hover:text-slate-900 transition underline underline-offset-2"
              >
                Health API Status ↗
              </a>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl bg-slate-900 hover:bg-rose-950 text-white hover:text-rose-200 px-4 py-2 text-xs font-bold transition cursor-pointer"
              >
                Lock Portal 🔒
              </button>
            </div>
          </section>

        </div>

      </main>
    </div>
  );
}
