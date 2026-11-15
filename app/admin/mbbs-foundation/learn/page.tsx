"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import type {
  LearnerAdminItem,
  LearnerAdminSummary,
} from "@/lib/mbbs-foundation/learnerAdmin";

export default function OnlineLearningAdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Data states
  const [loading, setLoading] = useState<boolean>(false);
  const [summary, setSummary] = useState<LearnerAdminSummary | null>(null);
  const [learners, setLearners] = useState<LearnerAdminItem[]>([]);
  const [availableColleges, setAvailableColleges] = useState<string[]>([]);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<
    { value: string; label: string }[]
  >([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCollege, setSelectedCollege] = useState<string>("ALL");
  const [selectedState, setSelectedState] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedCertified, setSelectedCertified] = useState<"ALL" | "YES" | "NO">("ALL");
  const [selectedVerified, setSelectedVerified] = useState<"ALL" | "YES" | "NO">("ALL");

  // Check initial authentication
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

  // Fetch learners and summary
  const fetchLearners = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (selectedCollege !== "ALL") params.set("college", selectedCollege);
      if (selectedState !== "ALL") params.set("state", selectedState);
      if (selectedCategory !== "ALL") params.set("category", selectedCategory);
      if (selectedCertified !== "ALL") params.set("certified", selectedCertified);
      if (selectedVerified !== "ALL") params.set("verified", selectedVerified);

      const res = await fetch(`/api/admin/mbbs-foundation/learn?${params.toString()}`);
      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setLearners(data.learners || []);
        if (data.availableColleges) setAvailableColleges(data.availableColleges);
        if (data.availableStates) setAvailableStates(data.availableStates);
        if (data.availableCategories) setAvailableCategories(data.availableCategories);
      }
    } catch (e) {
      console.error("Failed to fetch learner records:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchLearners();
    }
  }, [
    isAuthenticated,
    searchQuery,
    selectedCollege,
    selectedState,
    selectedCategory,
    selectedCertified,
    selectedVerified,
  ]);

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

  // Clear filters
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCollege("ALL");
    setSelectedState("ALL");
    setSelectedCategory("ALL");
    setSelectedCertified("ALL");
    setSelectedVerified("ALL");
  };

  // Export URL with current filters
  const exportUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedCollege !== "ALL") params.set("college", selectedCollege);
    if (selectedState !== "ALL") params.set("state", selectedState);
    if (selectedCategory !== "ALL") params.set("category", selectedCategory);
    if (selectedCertified !== "ALL") params.set("certified", selectedCertified);
    const queryString = params.toString();
    return `/api/admin/mbbs-foundation/learn/export${queryString ? `?${queryString}` : ""}`;
  }, [selectedCollege, selectedState, selectedCategory, selectedCertified]);

  // Format dates
  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "—";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  // Unauthenticated Loading State
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent"></span>
          <span>Verifying Admin Authorization...</span>
        </div>
      </div>
    );
  }

  // Login Gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white font-sans">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-950 border border-amber-800 text-2xl font-bold text-amber-300">
              🎓
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Online Learning Admin Console
            </h1>
            <p className="text-xs text-slate-400">
              MBBS Foundation Learner Directory &amp; Certification Portal
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="adminPassword"
                className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5"
              >
                Master Admin Password
              </label>
              <input
                id="adminPassword"
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password..."
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                autoFocus
              />
            </div>

            {authError && (
              <div className="rounded-xl bg-rose-950/60 border border-rose-800 p-3 text-xs text-rose-300">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black py-2.5 text-sm transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {authLoading ? "Authorizing..." : "Unlock Learner Console →"}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800 text-center">
            <Link
              href="/admin"
              className="text-xs text-slate-400 hover:text-white transition"
            >
              ← Return to Master Admin Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Console View
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <AdminHeader currentSection="learn" onLogout={handleLogout} />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/admin" className="hover:text-slate-900 transition font-medium">
              Admin Portal
            </Link>
            <span>/</span>
            <span className="font-bold text-slate-900">Online Learning Programme</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchLearners}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs cursor-pointer"
            >
              <span className={loading ? "animate-spin" : ""}>🔄</span>
              <span>{loading ? "Refreshing..." : "Refresh"}</span>
            </button>
            <a
              href={exportUrl}
              download
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-3.5 py-1.5 text-xs font-bold text-white transition shadow-xs cursor-pointer"
            >
              <span>📥</span>
              <span>Download CSV</span>
            </a>
          </div>
        </div>

        {/* Top Operational Banner */}
        <section className="rounded-3xl bg-slate-900 text-white p-6 sm:p-7 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-md bg-amber-950 border border-amber-800 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-300">
                Online Learning Programme
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Database Records
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Learner Directory &amp; Certifications
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Official records of registered learners across medical institutions, email verification status, and module certifications.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/mbbs-foundation/learn"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3.5 py-2 text-xs font-bold text-slate-200 transition"
            >
              View Learning Hub ↗
            </Link>
            <Link
              href="/mbbs-foundation/learn/modules/revive"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-red-700 hover:bg-red-600 px-3.5 py-2 text-xs font-bold text-white transition"
            >
              View REVIVE Module ↗
            </Link>
          </div>
        </section>

        {/* Summary Metrics Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1: Total Registered */}
          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Registered Learners
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                {summary ? summary.totalRegistered : "—"}
              </span>
              <span className="rounded-md bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px] font-bold">
                Profiles
              </span>
            </div>
            <p className="text-[11px] text-slate-500">MBBSLearningProfile records</p>
          </div>

          {/* Metric 2: Email-Verified */}
          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Email-Verified
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-emerald-700">
                {summary ? summary.totalVerified : "—"}
              </span>
              {summary && summary.totalRegistered > 0 && (
                <span className="rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                  {Math.round((summary.totalVerified / summary.totalRegistered) * 100)}% Verified
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">Magic-link confirmed learners</p>
          </div>

          {/* Metric 3: Medical Colleges */}
          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Institutions Represented
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                {summary ? summary.totalColleges : "—"}
              </span>
              <span className="rounded-md bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 text-[10px] font-bold">
                Campuses
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Medical institutions &amp; AIIMS</p>
          </div>

          {/* Metric 4: REVIVE Certificates */}
          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              REVIVE Certificates
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-red-700">
                {summary ? summary.totalCertificates : "—"}
              </span>
              <span className="rounded-md bg-red-50 text-red-800 border border-red-200 px-2 py-0.5 text-[10px] font-bold">
                Passed ≥ 70%
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Issued verifiable certificates</p>
          </div>
        </section>

        {/* Search & Filters Card */}
        <section className="rounded-2xl bg-white p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <span>🔍</span>
              <span>Filter Learner Records</span>
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-medium">
                Showing <strong className="text-slate-900">{learners.length}</strong> of{" "}
                <strong className="text-slate-900">{summary?.totalRegistered || 0}</strong> registered learners
              </span>
              {(searchQuery ||
                selectedCollege !== "ALL" ||
                selectedState !== "ALL" ||
                selectedCategory !== "ALL" ||
                selectedCertified !== "ALL" ||
                selectedVerified !== "ALL") && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-bold text-red-700 hover:text-red-900 transition underline cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by learner name, email, medical college, state, city, or certificate ID..."
              className="w-full rounded-xl bg-slate-50 border border-slate-300 px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
            />
          </div>

          {/* Dropdown Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Institution Filter */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Medical College
              </label>
              <select
                value={selectedCollege}
                onChange={(e) => setSelectedCollege(e.target.value)}
                className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              >
                <option value="ALL">All Colleges ({availableColleges.length})</option>
                {availableColleges.map((col) => (
                  <option key={col} value={col}>
                    {col.length > 40 ? col.substring(0, 40) + "..." : col}
                  </option>
                ))}
              </select>
            </div>

            {/* State Filter */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                State / UT
              </label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              >
                <option value="ALL">All States ({availableStates.length})</option>
                {availableStates.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Learner Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              >
                <option value="ALL">All Categories</option>
                {availableCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Certificate Status Filter */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                REVIVE Certificate
              </label>
              <select
                value={selectedCertified}
                onChange={(e) =>
                  setSelectedCertified(e.target.value as "ALL" | "YES" | "NO")
                }
                className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              >
                <option value="ALL">All Learners</option>
                <option value="YES">Certified Only (Passed)</option>
                <option value="NO">Not Yet Certified</option>
              </select>
            </div>

            {/* Email Verification Filter */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Email Verification
              </label>
              <select
                value={selectedVerified}
                onChange={(e) =>
                  setSelectedVerified(e.target.value as "ALL" | "YES" | "NO")
                }
                className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              >
                <option value="ALL">All Verification States</option>
                <option value="YES">Verified Only</option>
                <option value="NO">Pending Verification</option>
              </select>
            </div>
          </div>
        </section>

        {/* Learner Directory Table Card */}
        <section className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Learner Directory
              </h2>
              <p className="text-xs text-slate-500">
                Registered participant profiles, institutional affiliations, and certification credentials.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 rounded-lg px-2.5 py-1">
              {learners.length} {learners.length === 1 ? "Record" : "Records"}
            </span>
          </div>

          {learners.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-400">
                🔎
              </span>
              <h3 className="text-sm font-bold text-slate-800">
                No matching learner records found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try modifying your search criteria or resetting filters to view all registered learners.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-xl bg-slate-900 text-white px-4 py-2 text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Learner</th>
                    <th className="py-3 px-4">Medical College &amp; Location</th>
                    <th className="py-3 px-4">Category &amp; Stage</th>
                    <th className="py-3 px-4">Email Verification</th>
                    <th className="py-3 px-4">REVIVE Certificate</th>
                    <th className="py-3 px-4">Registered Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {learners.map((learner) => (
                    <tr
                      key={learner.id}
                      className="hover:bg-slate-50/80 transition"
                    >
                      {/* Column 1: Learner Name & Contact */}
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="font-bold text-slate-900 text-sm">
                          {learner.fullName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                          <span>✉️</span>
                          <span>{learner.email}</span>
                        </div>
                        {learner.mobileNumber && (
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                            <span>📱</span>
                            <span>{learner.mobileNumber}</span>
                          </div>
                        )}
                      </td>

                      {/* Column 2: College & Location */}
                      <td className="py-3.5 px-4 space-y-0.5 max-w-xs">
                        <div className="font-semibold text-slate-900 leading-snug">
                          {learner.institutionName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {learner.city ? `${learner.city}, ` : ""}
                          <strong className="text-slate-700">{learner.state}</strong>
                          {learner.pinCode ? ` - ${learner.pinCode}` : ""}
                        </div>
                      </td>

                      {/* Column 3: Category & Stage */}
                      <td className="py-3.5 px-4 space-y-1">
                        <span className="inline-block rounded-md bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 text-[10px] font-bold">
                          {learner.learnerCategoryLabel}
                        </span>
                        {(learner.mbbsYear || learner.departmentDesignation) && (
                          <div className="text-[11px] text-slate-500">
                            {learner.mbbsYear || learner.departmentDesignation}
                          </div>
                        )}
                      </td>

                      {/* Column 4: Email Verification */}
                      <td className="py-3.5 px-4">
                        {learner.emailVerified ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                              <span>✓</span>
                              <span>Verified</span>
                            </span>
                            {learner.emailVerifiedAt && (
                              <div className="text-[10px] text-slate-400">
                                {formatDate(learner.emailVerifiedAt)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-[10px] font-bold">
                            <span>⏳</span>
                            <span>Pending</span>
                          </span>
                        )}
                      </td>

                      {/* Column 5: REVIVE Certificate */}
                      <td className="py-3.5 px-4">
                        {learner.reviveCertificate ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                                <span>🏆</span>
                                <span>Certified ({learner.reviveCertificate.percentage}%)</span>
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium">
                                Score: {learner.reviveCertificate.score}/20
                              </span>
                            </div>
                            <div className="text-[10px] font-mono text-slate-700">
                              <Link
                                href={`/mbbs-foundation/learn/verify/${learner.reviveCertificate.certificateId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-red-700 hover:text-red-900 font-bold underline transition"
                                title="Open verification page in new tab"
                              >
                                {learner.reviveCertificate.certificateId} ↗
                              </Link>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Issued: {formatDate(learner.reviveCertificate.issuedAt)}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-block rounded-md bg-slate-100 text-slate-500 px-2 py-0.5 text-[10px] font-medium">
                            Not Yet Certified
                          </span>
                        )}
                      </td>

                      {/* Column 6: Registered Date */}
                      <td className="py-3.5 px-4 text-[11px] text-slate-500 whitespace-nowrap">
                        {formatDate(learner.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

