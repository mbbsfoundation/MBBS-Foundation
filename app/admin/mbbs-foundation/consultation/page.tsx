"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ConsultationDashboardSummary,
  getSourceLabel,
  READINESS_DOMAINS,
} from "@/lib/mbbs-foundation/consultationTypes";
import {
  SURVEY_METADATA,
  generateSurveyPlainText,
} from "@/lib/mbbs-foundation/professionalSurveyConfig";
import StudentVoiceAdminView from "@/components/mbbs-foundation/consultation/StudentVoiceAdminView";
import { StudentVoiceDashboardSummary } from "@/lib/mbbs-foundation/studentVoiceTypes";

export default function ConsultationAdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Active Survey Tab ("survey1" = Professional, "survey2" = Student & Intern Voice)
  const [activeSurveyTab, setActiveSurveyTab] = useState<"survey1" | "survey2">("survey1");

  // Survey 1 Data State
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [summary, setSummary] = useState<ConsultationDashboardSummary | null>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [selectedResponse, setSelectedResponse] = useState<any | null>(null);

  // Survey 2 Data State
  const [loadingStudentData, setLoadingStudentData] = useState<boolean>(false);
  const [studentSummary, setStudentSummary] = useState<StudentVoiceDashboardSummary | null>(null);

  // Active Source Analytics Sub-Tab
  const [sourceTab, setSourceTab] = useState<"performance" | "roles" | "states">("performance");

  // Survey Text Copy & Modal State
  const [copySuccessMessage, setCopySuccessMessage] = useState<string | null>(null);
  const [showSurveyTextModal, setShowSurveyTextModal] = useState<boolean>(false);

  // Filters
  const [filterSource, setFilterSource] = useState<string>("ALL");
  const [filterState, setFilterState] = useState<string>("ALL");
  const [filterContributing, setFilterContributing] = useState<string>("ALL");
  const [filterSharing, setFilterSharing] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

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

  // Fetch Dashboard Data
  const loadDashboardData = async () => {
    setLoadingData(true);
    try {
      const params = new URLSearchParams();
      if (filterSource !== "ALL") params.set("source", filterSource);
      if (filterState !== "ALL") params.set("state", filterState);
      if (filterContributing === "YES") params.set("contributing", "true");
      if (filterContributing === "NO") params.set("contributing", "false");
      if (filterSharing === "YES") params.set("sharing", "true");
      if (filterSharing === "NO") params.set("sharing", "false");
      if (searchQuery.trim().length > 0) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/admin/mbbs-foundation/consultation?${params.toString()}`);
      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setResponses(data.responses || []);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  // Fetch Student Voice Data
  const loadStudentDashboardData = async () => {
    setLoadingStudentData(true);
    try {
      const res = await fetch("/api/admin/mbbs-foundation/consultation/student-voice");
      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setStudentSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to load student voice data:", err);
    } finally {
      setLoadingStudentData(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (activeSurveyTab === "survey1") {
        loadDashboardData();
      } else {
        loadStudentDashboardData();
      }
    }
  }, [isAuthenticated, activeSurveyTab, filterSource, filterState, filterContributing, filterSharing]);

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
        loadDashboardData();
        loadStudentDashboardData();
      } else {
        setAuthError(data.error || "Authentication failed. Please check master password.");
      }
    } catch {
      setAuthError("Network error. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/cprsanjeevani/auth", { method: "DELETE" });
      setIsAuthenticated(false);
      setSummary(null);
      setResponses([]);
      setStudentSummary(null);
    } catch {
      setIsAuthenticated(false);
    }
  };

  const handleExportCsv = () => {
    window.location.href = "/api/admin/mbbs-foundation/consultation/export";
  };

  // Copy Full Survey Text Handler
  const handleCopySurveyText = async () => {
    const text = generateSurveyPlainText();
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setCopySuccessMessage("Complete Survey 1 Text (Q1–Q28) copied to clipboard!");
        setTimeout(() => setCopySuccessMessage(null), 4000);
      } else {
        setShowSurveyTextModal(true);
      }
    } catch {
      setShowSurveyTextModal(true);
    }
  };

  // -------------------------------------------------------------
  // AUTHENTICATION SCREEN
  // -------------------------------------------------------------
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white text-sm">
        <div className="flex items-center gap-3">
          <span className="animate-spin text-xl">⏳</span>
          <span>Verifying admin session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 text-slate-100">
        <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-red-950 border border-red-800/80 flex items-center justify-center text-2xl text-red-400">
              🩺
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              MBBS Foundation Consultation Portal
            </h1>
            <p className="text-xs text-slate-400">
              Enter Administrator Master Password to access Survey 1 results, source analytics, and contributor pools.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Admin Master Password
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
              <div className="rounded-xl bg-rose-950/60 border border-rose-800/80 p-3 text-xs text-rose-300">
                ⚠️ {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading || !passwordInput.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-800 hover:to-rose-800 py-3 text-sm font-bold text-white shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {authLoading ? "Unlocking Portal..." : "Unlock Consultation Admin"}
            </button>
          </form>

          <div className="pt-2 text-center">
            <Link
              href="/mbbs-foundation/consultation"
              className="text-xs text-slate-500 hover:text-slate-300 transition"
            >
              ← Back to Consultation Public Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // AUTHENTICATED DASHBOARD VIEW
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-3.5 shadow-md">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-700 text-white font-black text-sm">
              🩺
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black tracking-tight text-white">
                  MBBS Foundation Admin
                </h1>
                <span className="rounded-full bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  Professional Consultation — {SURVEY_METADATA.version}
                </span>
                <span className="hidden md:inline-block rounded-md bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 text-[9px] font-semibold">
                  Structurally Stable / Content Editable
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                National Medical Faculty &amp; Clinicians Consultation Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySurveyText}
              className="rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3.5 py-2 text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Copy the full Q1–Q28 questionnaire plain-text to clipboard for review or ChatGPT"
            >
              <span>📋</span>
              <span className="hidden sm:inline">Copy Survey Text</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="rounded-xl bg-emerald-700 hover:bg-emerald-800 px-3.5 py-2 text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <span>📥</span>
              <span>Export CSV</span>
            </button>

            <button
              onClick={loadDashboardData}
              disabled={loadingData}
              className="rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-bold text-slate-200 transition border border-slate-700 flex items-center gap-1 cursor-pointer"
            >
              <span className={loadingData ? "animate-spin" : ""}>🔄</span>
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleLogout}
              className="rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-800 px-3 py-2 text-xs font-bold transition cursor-pointer"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Copy Toast Feedback */}
      {copySuccessMessage && (
        <div className="bg-emerald-700 text-white px-4 py-2.5 text-center text-xs font-bold shadow-md flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top duration-150">
          <span>✓</span>
          <span>{copySuccessMessage}</span>
          <button
            onClick={() => setShowSurveyTextModal(true)}
            className="ml-2 underline text-emerald-100 hover:text-white cursor-pointer"
          >
            View text modal
          </button>
        </div>
      )}

      {/* Top Survey Track Switcher */}
      <div className="border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8 py-3 shadow-2xs">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 mr-1">
              Select Survey Module:
            </span>
            <button
              onClick={() => setActiveSurveyTab("survey1")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
                activeSurveyTab === "survey1"
                  ? "bg-red-700 text-white shadow-sm ring-2 ring-red-700/20"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span>🩺</span>
              <span>Survey 1: Professional Consultation</span>
              {summary?.totalResponses !== undefined && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    activeSurveyTab === "survey1"
                      ? "bg-red-950 text-white"
                      : "bg-slate-200 text-slate-800"
                  }`}
                >
                  {summary.totalResponses}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveSurveyTab("survey2");
                if (!studentSummary) loadStudentDashboardData();
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
                activeSurveyTab === "survey2"
                  ? "bg-blue-700 text-white shadow-sm ring-2 ring-blue-700/20"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span>🎓</span>
              <span>Survey 2: Student &amp; Intern Voice</span>
              {studentSummary?.totalResponses !== undefined && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    activeSurveyTab === "survey2"
                      ? "bg-blue-950 text-white"
                      : "bg-slate-200 text-slate-800"
                  }`}
                >
                  {studentSummary.totalResponses}
                </span>
              )}
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            {activeSurveyTab === "survey1" ? (
              <span>Target: Faculty, Clinicians &amp; CPR Network</span>
            ) : (
              <span>Target: Current MBBS Students &amp; Interns</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Dashboard Content for Survey 1 */}
      {activeSurveyTab === "survey1" && (
        <main className="flex-1 mx-auto max-w-7xl w-full p-4 sm:p-6 lg:p-8 space-y-8">
        {/* PROMPT 9: CONSULTATION PAGE ACCESS (ADMIN PREVIEW LINKS) */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base">🚀</span>
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  Consultation Page Access
                </h2>
                <span className="rounded-full bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 text-[10px] font-bold">
                  {SURVEY_METADATA.version} Preview
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Quick preview &amp; testing links for the consultation module. (These remain unlinked from the public header until launch).
              </p>
            </div>

            <button
              onClick={() => setShowSurveyTextModal(true)}
              className="text-xs font-bold text-slate-700 hover:text-red-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
            >
              <span>📄</span>
              <span>View Full Survey Plain-Text</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
            {/* Link 1: Consultation Hub */}
            <a
              href="/mbbs-foundation/consultation"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white hover:border-red-300 hover:shadow-xs p-4 flex flex-col justify-between transition group"
            >
              <div>
                <span className="text-xs font-black text-slate-900 group-hover:text-red-700 flex items-center gap-1">
                  <span>🩺</span>
                  <span>Consultation Hub</span>
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Module shell, overview card &amp; directory of active/upcoming surveys.
                </p>
              </div>
              <span className="font-mono text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span>/consultation</span>
                <span className="text-xs">↗</span>
              </span>
            </a>

            {/* Link 2: Professional Survey Direct */}
            <a
              href="/mbbs-foundation/consultation/professional"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white hover:border-blue-300 hover:shadow-xs p-4 flex flex-col justify-between transition group"
            >
              <div>
                <span className="text-xs font-black text-slate-900 group-hover:text-blue-700 flex items-center gap-1">
                  <span>📝</span>
                  <span>Professional Survey — Direct</span>
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  General consultation entry with standard medical educator introduction.
                </p>
              </div>
              <span className="font-mono text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span>.../professional</span>
                <span className="text-xs">↗</span>
              </span>
            </a>

            {/* Link 3: Faculty Version */}
            <a
              href="/mbbs-foundation/consultation/professional?source=faculty"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-red-200/80 bg-red-50/30 hover:bg-white hover:border-red-400 hover:shadow-xs p-4 flex flex-col justify-between transition group"
            >
              <div>
                <span className="text-xs font-black text-red-950 group-hover:text-red-700 flex items-center gap-1">
                  <span>🎓</span>
                  <span>Survey — Faculty Network</span>
                </span>
                <p className="text-[11px] text-slate-600 mt-1">
                  Tailored with medical college faculty &amp; MEU introductory framing.
                </p>
              </div>
              <span className="font-mono text-[10px] text-red-800/60 mt-3 pt-2 border-t border-red-100 flex items-center justify-between">
                <span>?source=faculty</span>
                <span className="text-xs font-bold text-red-700">↗</span>
              </span>
            </a>

            {/* Link 4: CPR Network Version */}
            <a
              href="/mbbs-foundation/consultation/professional?source=cpr"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-teal-200/80 bg-teal-50/30 hover:bg-white hover:border-teal-400 hover:shadow-xs p-4 flex flex-col justify-between transition group"
            >
              <div>
                <span className="text-xs font-black text-teal-950 group-hover:text-teal-700 flex items-center gap-1">
                  <span>🫀</span>
                  <span>Survey — CPR Network</span>
                </span>
                <p className="text-[11px] text-slate-600 mt-1">
                  Tailored with CPR coordinator &amp; emergency preparedness introduction.
                </p>
              </div>
              <span className="font-mono text-[10px] text-teal-800/60 mt-3 pt-2 border-t border-teal-100 flex items-center justify-between">
                <span>?source=cpr</span>
                <span className="text-xs font-bold text-teal-700">↗</span>
              </span>
            </a>
          </div>
        </section>

        {/* Top Summary Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Responses
            </span>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-950">
              {summary?.totalResponses ?? 0}
            </div>
            <div className="mt-1 text-[11px] text-emerald-700 font-semibold">
              +{summary?.responsesThisWeek ?? 0} in the last 7 days
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Contributors Interested
            </span>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-red-700">
              {summary?.interestedContributors ?? 0}
            </div>
            <div className="mt-1 text-[11px] text-slate-500 font-medium">
              {summary?.totalResponses
                ? Math.round(((summary.interestedContributors || 0) / summary.totalResponses) * 100)
                : 0}
              % of all respondents
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Share Readiness Survey
            </span>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-blue-700">
              {summary?.willingToShareReadiness ?? 0}
            </div>
            <div className="mt-1 text-[11px] text-slate-500 font-medium">
              {summary?.totalResponses
                ? Math.round(((summary.willingToShareReadiness || 0) / summary.totalResponses) * 100)
                : 0}
              % willing to distribute
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              States / UTs
            </span>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
              {summary?.distinctStatesCount ?? 0}
            </div>
            <div className="mt-1 text-[11px] text-slate-500 font-medium">
              Geographic coverage
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Follow-up Consent
            </span>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-purple-700">
              {responses.filter((r) => r.consentForFollowup).length}
            </div>
            <div className="mt-1 text-[11px] text-slate-500 font-medium">
              {summary?.totalResponses
                ? Math.round((responses.filter((r) => r.consentForFollowup).length / summary.totalResponses) * 100)
                : 0}
              % permitted contact
            </div>
          </div>
        </section>

        {/* DEDICATED OUTREACH SOURCE PERFORMANCE & CROSS-TABS */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>
                <h2 className="text-base sm:text-lg font-black text-slate-950">
                  Outreach Source Performance &amp; Attribution
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparative analysis of response volume, contributor engagement, and readiness survey distribution across entry channels.
              </p>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
              <button
                onClick={() => setSourceTab("performance")}
                className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${
                  sourceTab === "performance"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Source Performance
              </button>
              <button
                onClick={() => setSourceTab("roles")}
                className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${
                  sourceTab === "roles"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Source + Role Cross-Tab
              </button>
              <button
                onClick={() => setSourceTab("states")}
                className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${
                  sourceTab === "states"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Source + State Distribution
              </button>
            </div>
          </div>

          {/* TAB 1: OUTREACH SOURCE PERFORMANCE TABLE */}
          {sourceTab === "performance" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-black uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Outreach Source Channel</th>
                      <th className="py-3 px-3 text-right">Responses</th>
                      <th className="py-3 px-3 text-right">% of Total</th>
                      <th className="py-3 px-3 text-right text-red-800">Interested Contributors</th>
                      <th className="py-3 px-3 text-right text-red-800 font-black">Contributor %</th>
                      <th className="py-3 px-3 text-right text-blue-800">Willing to Share</th>
                      <th className="py-3 px-3 text-right text-blue-800 font-black">Share %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summary?.sourcePerformance && summary.sourcePerformance.length > 0 ? (
                      summary.sourcePerformance.map((sp) => (
                        <tr key={sp.source} className="hover:bg-slate-50/70 transition">
                          <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                sp.source === "faculty"
                                  ? "bg-red-700"
                                  : sp.source === "cpr"
                                  ? "bg-teal-600"
                                  : "bg-blue-600"
                              }`}
                            />
                            <span>{sp.label}</span>
                            <span className="font-mono text-[10px] text-slate-400 font-normal">
                              ({sp.source})
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                            {sp.totalResponses}
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono text-slate-600">
                            {sp.percentageOfTotal}%
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono font-bold text-red-800 bg-red-50/30">
                            {sp.interestedContributors}
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono font-black text-red-900 bg-red-50/50">
                            {sp.contributorPercentage}%
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono font-bold text-blue-800 bg-blue-50/30">
                            {sp.willingToShareReadiness}
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono font-black text-blue-900 bg-blue-50/50">
                            {sp.sharePercentage}%
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-400">
                          No source analytics recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: SOURCE + ROLE CROSS-TAB */}
          {sourceTab === "roles" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <p>
                  Composition of professional roles within each source channel.
                </p>
                <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  ℹ️ Respondents may appear in more than one role category
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-black uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Professional Role</th>
                      <th className="py-3 px-3 text-center text-red-800">Faculty Network</th>
                      <th className="py-3 px-3 text-center text-teal-800">CPR Network</th>
                      <th className="py-3 px-3 text-center text-blue-800">Direct / Neutral</th>
                      <th className="py-3 px-4 text-right font-black text-slate-900">Total Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summary?.sourceRoleCrossTab && summary.sourceRoleCrossTab.length > 0 ? (
                      summary.sourceRoleCrossTab.map((r) => (
                        <tr key={r.role} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {r.role}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-semibold text-red-800 bg-red-50/30">
                            {r.facultyCount}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-semibold text-teal-800 bg-teal-50/30">
                            {r.cprCount}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-semibold text-blue-800 bg-blue-50/30">
                            {r.directCount}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-slate-950 bg-slate-50/50">
                            {r.totalCount}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          No role cross-tab data available yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: SOURCE + STATE DISTRIBUTION */}
          {sourceTab === "states" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <p className="text-xs text-slate-500">
                Breakdown of response origin by State/UT across the 3 outreach sources.
              </p>

              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-50 z-10">
                    <tr className="border-b border-slate-200 text-slate-700 font-black uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">State / UT</th>
                      <th className="py-3 px-3 text-center text-red-800">Faculty Network</th>
                      <th className="py-3 px-3 text-center text-teal-800">CPR Network</th>
                      <th className="py-3 px-3 text-center text-blue-800">Direct</th>
                      <th className="py-3 px-4 text-right font-black text-slate-900">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summary?.sourceStateCrossTab && summary.sourceStateCrossTab.length > 0 ? (
                      summary.sourceStateCrossTab.map((st) => (
                        <tr key={st.state} className="hover:bg-slate-50/70 transition">
                          <td className="py-2.5 px-4 font-bold text-slate-900">
                            {st.state}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-semibold text-red-800 bg-red-50/20">
                            {st.facultyCount}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-semibold text-teal-800 bg-teal-50/20">
                            {st.cprCount}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-semibold text-blue-800 bg-blue-50/20">
                            {st.directCount}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-black text-slate-950 bg-slate-50/40">
                            {st.totalCount}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          No geographic responses recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Readiness Gap Summary (14 Domains Analysis) */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-950">
                Readiness Gap Analysis (Q7 — 14 Clinical Transition Domains)
              </h2>
              <p className="text-xs text-slate-500">
                Distribution of preparedness ratings when students begin clinical exposure. <strong>Significant Gap %</strong> = Poorly prepared + Not prepared at all.
              </p>
            </div>

            <span className="text-xs font-bold text-red-800 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
              {summary?.totalResponses ?? 0} Responses Evaluated
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-700 font-black uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 w-12 text-center">Code</th>
                  <th className="py-3 px-3 min-w-[240px]">Competency / Readiness Area</th>
                  <th className="py-3 px-2 text-center text-emerald-700">Well Prepared</th>
                  <th className="py-3 px-2 text-center text-teal-700">Reasonable</th>
                  <th className="py-3 px-2 text-center text-amber-700">Gaps Remain</th>
                  <th className="py-3 px-2 text-center text-rose-700">Poor</th>
                  <th className="py-3 px-2 text-center text-red-800">Not At All</th>
                  <th className="py-3 px-2 text-center text-slate-400">N/A</th>
                  <th className="py-3 px-3 text-right text-red-900 bg-red-50/60 font-black">Significant Gap %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary?.readinessDomainSummary && summary.readinessDomainSummary.length > 0 ? (
                  summary.readinessDomainSummary.map((d) => (
                    <tr key={d.code} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-3 text-center font-black text-slate-900 bg-slate-50/40">
                        {d.code}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800">
                        {d.label}
                      </td>
                      <td className="py-3 px-2 text-center font-mono font-semibold text-emerald-800">
                        {d.ratings["Well prepared"] || 0}
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-teal-800">
                        {d.ratings["Reasonably prepared"] || 0}
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-amber-800">
                        {d.ratings["Some preparation, but important gaps remain"] || 0}
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-rose-800">
                        {d.ratings["Poorly prepared"] || 0}
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-red-800">
                        {d.ratings["Not prepared at all"] || 0}
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-slate-400">
                        {d.ratings["Unable to comment"] || 0}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-red-800 bg-red-50/40">
                        {d.significantGapPercentage}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-slate-400">
                      No readiness ratings submitted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Curricular & Workshop Evaluation Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Q8 Foundation Course Effectiveness */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Q8. Foundation Course Effectiveness
            </h3>
            <div className="space-y-2 pt-1 text-xs">
              {summary?.q8EffectivenessSummary.map((q) => (
                <div key={q.option} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-700 truncate max-w-[170px]" title={q.option}>
                      {q.option}
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {q.count} ({q.percentage}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-red-700 rounded-full" style={{ width: `${q.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Q15 Foundation Course Description */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Q15. Current Institutional Course
            </h3>
            <div className="space-y-2 pt-1 text-xs">
              {summary?.q15DescriptionSummary.map((q) => (
                <div key={q.option} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-700 truncate max-w-[170px]" title={q.option}>
                      {q.option}
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {q.count} ({q.percentage}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-slate-800 rounded-full" style={{ width: `${q.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Q9 Top Priority Emphasis Areas */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Q9. Top Priority Areas
              </h3>
              <span className="text-[10px] text-slate-400">Up to 5</span>
            </div>
            <div className="space-y-2 pt-1 max-h-56 overflow-y-auto pr-1 text-xs">
              {summary?.q9TopPriorityAreas.slice(0, 7).map((p) => (
                <div key={p.code} className="flex items-center justify-between border-b border-slate-50 pb-1 text-[11px]">
                  <span className="text-slate-700 font-medium truncate max-w-[160px]" title={p.label}>
                    <strong>[{p.code}]</strong> {p.label}
                  </span>
                  <span className="font-mono font-bold text-red-800">
                    {p.count} ({p.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Q20 Contributor Pool Types */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Q20. Contributor Interests
            </h3>
            <div className="space-y-2 pt-1 max-h-56 overflow-y-auto pr-1 text-xs">
              {summary?.contributionInterestsSummary.map((c) => (
                <div key={c.type} className="flex items-center justify-between border-b border-slate-50 pb-1 text-[11px]">
                  <span className="text-slate-700 font-medium truncate max-w-[160px]" title={c.type}>
                    {c.type}
                  </span>
                  <span className="font-mono font-bold text-emerald-800">
                    {c.count} ({c.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Filterable Responses Table */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-950">
                Individual Consultation Responses
              </h2>
              <p className="text-xs text-slate-500">
                Showing {responses.length} responses matching active filters.
              </p>
            </div>

            {/* Filter Bar with Human-Friendly Source Labels */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadDashboardData()}
                placeholder="Search name/institution..."
                className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs bg-white text-slate-800 focus:border-red-600 focus:outline-none"
              />

              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs bg-white text-slate-800 focus:border-red-600 focus:outline-none font-medium"
              >
                <option value="ALL">All Outreach Sources</option>
                <option value="faculty">Faculty / Medical Education Network</option>
                <option value="cpr">CPR Course Coordinator / Champion Network</option>
                <option value="direct">Direct / Unattributed</option>
              </select>

              <select
                value={filterContributing}
                onChange={(e) => setFilterContributing(e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs bg-white text-slate-800 focus:border-red-600 focus:outline-none font-medium"
              >
                <option value="ALL">Contributing (All)</option>
                <option value="YES">Interested: Yes</option>
                <option value="NO">Interested: No</option>
              </select>

              <select
                value={filterSharing}
                onChange={(e) => setFilterSharing(e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs bg-white text-slate-800 focus:border-red-600 focus:outline-none font-medium"
              >
                <option value="ALL">Share Readiness (All)</option>
                <option value="YES">Willing: Yes</option>
                <option value="NO">Willing: No</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Respondent</th>
                  <th className="py-3 px-3">Role(s)</th>
                  <th className="py-3 px-3">Specialty</th>
                  <th className="py-3 px-3">Institution</th>
                  <th className="py-3 px-3">State</th>
                  <th className="py-3 px-2 text-center">Source Channel</th>
                  <th className="py-3 px-2 text-center">Contributor</th>
                  <th className="py-3 px-2 text-center">Readiness</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {responses.length > 0 ? (
                  responses.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {r.respondentName || <span className="text-slate-400 italic">Anonymous</span>}
                      </td>
                      <td className="py-3 px-3 text-slate-700 max-w-[180px] truncate" title={Array.isArray(r.roles) ? r.roles.join(", ") : ""}>
                        {Array.isArray(r.roles) ? r.roles[0] : ""}
                        {Array.isArray(r.roles) && r.roles.length > 1 && (
                          <span className="ml-1 text-[10px] bg-slate-100 rounded px-1 text-slate-600 font-mono">
                            +{r.roles.length - 1}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {r.specialty || "-"}
                      </td>
                      <td className="py-3 px-3 text-slate-600 max-w-[150px] truncate" title={r.institutionName || ""}>
                        {r.institutionName || "-"}
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {r.state || "-"}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.source === "faculty"
                            ? "bg-red-50 text-red-800 border border-red-200"
                            : r.source === "cpr"
                            ? "bg-teal-50 text-teal-800 border border-teal-200"
                            : "bg-slate-100 text-slate-700"
                        }`} title={getSourceLabel(r.source)}>
                          {r.source === "faculty" ? "Faculty" : r.source === "cpr" ? "CPR Network" : "Direct"}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {r.interestedInContributing ? (
                          <span className="text-emerald-700 font-bold">✓ Yes</span>
                        ) : (
                          <span className="text-slate-400">No</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {r.willingToShareReadinessSurvey ? (
                          <span className="text-blue-700 font-bold">✓ Yes</span>
                        ) : (
                          <span className="text-slate-400">No</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSelectedResponse(r)}
                          className="rounded-lg bg-slate-900 hover:bg-red-700 text-white px-2.5 py-1 text-[11px] font-bold transition cursor-pointer"
                        >
                          View Detail
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      No responses match the active filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      )}

      {/* Main Dashboard Content for Survey 2 (Student & Intern Voice) */}
      {activeSurveyTab === "survey2" && (
        <main className="flex-1 mx-auto max-w-7xl w-full p-4 sm:p-6 lg:p-8">
          <StudentVoiceAdminView
            summary={studentSummary}
            loading={loadingStudentData}
            onRefresh={loadStudentDashboardData}
          />
        </main>
      )}

      {/* Survey Text Preview Modal (Fallback / Inspection) */}
      {showSurveyTextModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-red-700">
                  {SURVEY_METADATA.version.toUpperCase()} Questionnaire Text
                </span>
                <h3 className="text-lg font-black text-slate-950 mt-0.5">
                  Complete Professional Consultation Plain-Text (V2 Locked)
                </h3>
              </div>
              <button
                onClick={() => setShowSurveyTextModal(false)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 p-5 overflow-y-auto">
              <p className="text-xs text-slate-500 mb-2">
                This plain-text is compiled live from <code>lib/mbbs-foundation/professionalSurveyConfig.ts</code>. You can copy it directly into ChatGPT or text editors for review.
              </p>
              <textarea
                readOnly
                value={generateSurveyPlainText()}
                className="w-full h-96 rounded-xl border border-slate-300 bg-slate-50 p-4 font-mono text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-600 select-all"
              />
            </div>

            <div className="border-t border-slate-200 p-4 bg-slate-50 flex items-center justify-between rounded-b-2xl">
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(generateSurveyPlainText());
                    setCopySuccessMessage("Complete survey text copied to clipboard!");
                    setTimeout(() => setCopySuccessMessage(null), 4000);
                  } catch (e) {
                    console.error("Clipboard write failed", e);
                  }
                }}
                className="rounded-xl bg-red-700 hover:bg-red-800 text-white px-5 py-2 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>📋</span>
                <span>Copy All Text</span>
              </button>

              <button
                onClick={() => setShowSurveyTextModal(false)}
                className="rounded-xl bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Response Detail Modal */}
      {selectedResponse && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-700">
                    Response ID: {selectedResponse.id}
                  </span>
                  <span className="rounded-full bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 text-[10px] font-bold">
                    Source: {getSourceLabel(selectedResponse.source)}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-950 mt-1">
                  {selectedResponse.respondentName || "Anonymous Consultation Response"}
                </h3>
              </div>
              <button
                onClick={() => setSelectedResponse(null)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            {/* Profile & Contact Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
              <div>
                <span className="text-slate-500 font-semibold">Email:</span>{" "}
                <strong className="text-slate-900">{selectedResponse.email || "Not provided"}</strong>
              </div>
              <div>
                <span className="text-slate-500 font-semibold">Mobile/WhatsApp:</span>{" "}
                <strong className="text-slate-900">{selectedResponse.mobileWhatsapp || "Not provided"}</strong>
              </div>
              <div>
                <span className="text-slate-500 font-semibold">Roles:</span>{" "}
                <strong className="text-slate-900">{Array.isArray(selectedResponse.roles) ? selectedResponse.roles.join(", ") : "-"}</strong>
              </div>
              <div>
                <span className="text-slate-500 font-semibold">Specialty:</span>{" "}
                <strong className="text-slate-900">{selectedResponse.specialty || "-"}</strong>
              </div>
              <div>
                <span className="text-slate-500 font-semibold">Teaching Exp:</span>{" "}
                <strong className="text-slate-900">{selectedResponse.teachingExperience || "-"}</strong>
              </div>
              <div>
                <span className="text-slate-500 font-semibold">Institution / Location:</span>{" "}
                <strong className="text-slate-900">
                  {[selectedResponse.institutionName, selectedResponse.city, selectedResponse.state].filter(Boolean).join(", ") || "-"}
                </strong>
              </div>
            </div>

            {/* Qualitative Feedback */}
            <div className="space-y-4 text-xs">
              <h4 className="font-black text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-1">
                Qualitative Insights &amp; Suggestions
              </h4>

              <div className="space-y-1">
                <span className="font-bold text-slate-700">Q13. Wish someone had taught at entry:</span>
                <p className="bg-slate-50 p-3 rounded-lg text-slate-900 font-medium">
                  {(selectedResponse.surveyResponses as any)?.wishTaughtAtEntry || "Not answered"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-700">Q10. One change to most improve Foundation Course:</span>
                <p className="bg-slate-50 p-3 rounded-lg text-slate-900">
                  {(selectedResponse.surveyResponses as any)?.improvementSuggestion || "Not answered"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-700">Q14. Challenge apparent later:</span>
                <p className="bg-slate-50 p-3 rounded-lg text-slate-900">
                  {(selectedResponse.surveyResponses as any)?.laterEmergingChallenge || "Not answered"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-700">Q18. Workshop should definitely include:</span>
                <p className="bg-slate-50 p-3 rounded-lg text-slate-900">
                  {(selectedResponse.surveyResponses as any)?.workshopMustInclude || "Not answered"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-700">Q21. Personal topic of contribution:</span>
                <p className="bg-slate-50 p-3 rounded-lg text-slate-900">
                  {(selectedResponse.surveyResponses as any)?.preferredContributionTopic || "Not answered"}
                </p>
              </div>
            </div>

            {/* Readiness Ratings Matrix */}
            <div className="space-y-2 text-xs">
              <h4 className="font-black text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-1">
                14 Readiness Domain Ratings
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {READINESS_DOMAINS.map((domain) => {
                  const rating = (selectedResponse.surveyResponses as any)?.readinessRatings?.[domain.id];
                  return (
                    <div key={domain.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 flex items-start justify-between gap-2">
                      <span className="font-medium text-slate-700 leading-snug">
                        <strong>[{domain.code}]</strong> {domain.label.substring(0, 45)}...
                      </span>
                      <span className="font-bold text-slate-900 shrink-0 text-[11px]">
                        {rating || "N/A"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 text-right">
              <button
                onClick={() => setSelectedResponse(null)}
                className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 text-xs font-bold transition cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
