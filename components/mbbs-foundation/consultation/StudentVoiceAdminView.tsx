"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  StudentVoiceDashboardSummary,
} from "@/lib/mbbs-foundation/studentVoiceTypes";
import {
  STUDENT_SURVEY_METADATA,
  generateStudentVoiceSurveyPlainText,
} from "@/lib/mbbs-foundation/studentVoiceSurveyConfig";

interface StudentVoiceAdminViewProps {
  summary: StudentVoiceDashboardSummary | null;
  loading: boolean;
  onRefresh: () => void;
}

export default function StudentVoiceAdminView({
  summary,
  loading,
  onRefresh,
}: StudentVoiceAdminViewProps) {
  const [selectedResponse, setSelectedResponse] = useState<any | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [stageFilter, setStageFilter] = useState<string>("ALL");
  const [quoteFilter, setQuoteFilter] = useState<string>("ALL");
  const [contributorFilter, setContributorFilter] = useState<string>("ALL");

  // Plain-Text Modal State
  const [showSurveyTextModal, setShowSurveyTextModal] = useState<boolean>(false);
  const [copySuccessMessage, setCopySuccessMessage] = useState<string | null>(null);

  const handleCopySurveyText = () => {
    try {
      const text = generateStudentVoiceSurveyPlainText();
      if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
        setCopySuccessMessage("Complete Student Voice V2 survey text copied to clipboard!");
        setTimeout(() => setCopySuccessMessage(null), 3500);
      } else {
        setShowSurveyTextModal(true);
      }
    } catch {
      setShowSurveyTextModal(true);
    }
  };

  if (loading && !summary) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-700"></div>
        <p className="mt-4 text-sm font-semibold text-slate-700">Loading Student &amp; Intern Voice data...</p>
      </div>
    );
  }

  if (!summary || summary.totalResponses === 0) {
    return (
      <div className="space-y-6">
        {/* Header & Access Links */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 border border-blue-300 px-3 py-0.5 text-xs font-black text-blue-950 uppercase tracking-wider">
              🎓 {STUDENT_SURVEY_METADATA.statusBadge}
            </div>
            <h2 className="mt-2 text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              Student Voice V2 Dashboard
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Capturing the lived transition, surprises, challenges, and advice of medical students and interns.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleCopySurveyText}
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-blue-300 px-4 py-2 text-xs font-bold text-blue-900 shadow-xs hover:bg-blue-50 transition cursor-pointer"
            >
              <span>📋</span>
              <span>Copy Student Survey Text</span>
            </button>
            <button
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-black transition cursor-pointer"
            >
              <span>🔄</span>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Empty State */}
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs space-y-3">
          <span className="text-4xl">🎓</span>
          <h3 className="text-lg font-bold text-slate-900">No Student Voice Submissions Yet</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            The Student Voice consultation is live at{" "}
            <Link
              href="/mbbs-foundation/consultation/student-voice"
              target="_blank"
              className="text-blue-700 underline font-semibold"
            >
              /mbbs-foundation/consultation/student-voice
            </Link>
            . Responses will appear here in real time.
          </p>
        </div>
      </div>
    );
  }

  // Filter recent responses
  const filteredResponses = summary.recentResponses.filter((r) => {
    if (stageFilter !== "ALL" && r.trainingStage !== stageFilter) return false;
    if (quoteFilter === "YES" && !r.quotePermission) return false;
    if (quoteFilter === "NO" && r.quotePermission) return false;
    if (contributorFilter === "YES" && !r.interestedInContributing) return false;
    if (contributorFilter === "NO" && r.interestedInContributing) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const matchName = r.respondentName?.toLowerCase().includes(q);
      const matchState = r.state?.toLowerCase().includes(q);
      const matchInst = r.institutionName?.toLowerCase().includes(q);
      const matchWish = r.q10WishSomeoneTold?.toLowerCase().includes(q);
      if (!matchName && !matchState && !matchInst && !matchWish) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {copySuccessMessage && (
        <div className="fixed top-5 right-5 z-50 rounded-xl bg-emerald-900 text-white px-5 py-3 text-xs sm:text-sm font-bold shadow-xl flex items-center gap-2.5 animate-bounce">
          <span>✓</span>
          <span>{copySuccessMessage}</span>
        </div>
      )}

      {/* Top Banner & Quick Access */}
      <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/90 via-white to-indigo-50/70 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 border border-blue-300 px-3 py-0.5 text-xs font-black text-blue-950 uppercase tracking-wider">
            🎓 {STUDENT_SURVEY_METADATA.statusBadge}
          </div>
          <h2 className="mt-2 text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
            Student Voice V2 Dashboard
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Retrospective insights on what makes MBBS exciting, challenging, and what new students should know.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCopySurveyText}
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-blue-300 px-4 py-2.5 text-xs font-bold text-blue-950 shadow-xs hover:bg-blue-50 transition cursor-pointer"
          >
            <span>📋</span>
            <span>Copy Student Survey Text</span>
          </button>
          <a
            href="/api/admin/mbbs-foundation/consultation/student-voice/export"
            download
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-900 px-4 py-2.5 text-xs font-black text-white shadow-xs hover:from-blue-800 hover:to-black transition cursor-pointer"
          >
            <span>📥</span>
            <span>Export Survey 2 CSV</span>
          </a>
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-black transition cursor-pointer"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Consultation Entry Links */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <span>🔗</span> Survey 2 Entry Links (For Outreach &amp; Previews)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <Link
            href="/mbbs-foundation/consultation/student-voice?source=direct"
            target="_blank"
            className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-300 transition text-left text-xs space-y-0.5 block"
          >
            <div className="font-bold text-slate-900">Direct / General Link</div>
            <div className="text-[11px] text-slate-500 font-mono">?source=direct</div>
          </Link>
          <Link
            href="/mbbs-foundation/consultation/student-voice?source=student"
            target="_blank"
            className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-300 transition text-left text-xs space-y-0.5 block"
          >
            <div className="font-bold text-slate-900">Peer / Student Network</div>
            <div className="text-[11px] text-slate-500 font-mono">?source=student</div>
          </Link>
          <Link
            href="/mbbs-foundation/consultation/student-voice?source=faculty"
            target="_blank"
            className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-300 transition text-left text-xs space-y-0.5 block"
          >
            <div className="font-bold text-slate-900">Faculty-Shared Link</div>
            <div className="text-[11px] text-slate-500 font-mono">?source=faculty</div>
          </Link>
          <Link
            href="/mbbs-foundation/consultation/student-voice?source=cpr"
            target="_blank"
            className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-300 transition text-left text-xs space-y-0.5 block"
          >
            <div className="font-bold text-slate-900">CPR Network Link</div>
            <div className="text-[11px] text-slate-500 font-mono">?source=cpr</div>
          </Link>
        </div>
      </div>

      {/* Headline KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Responses */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Responses
          </span>
          <div className="text-3xl font-black text-slate-950">
            {summary.totalResponses}
          </div>
          <span className="text-[11px] font-semibold text-blue-800">
            {summary.v2ResponseCount} V2 submissions • {summary.v1ResponseCount} V1
          </span>
        </div>

        {/* Anonymous Quote Permission */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Quote Permission
          </span>
          <div className="text-3xl font-black text-emerald-700">
            {summary.quotePermissionPercentage}%
          </div>
          <span className="text-[11px] font-semibold text-slate-600">
            {summary.quotePermissionCount} granted anonymous quote permission
          </span>
        </div>

        {/* Interested Contributors */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Student Contributors
          </span>
          <div className="text-3xl font-black text-blue-700">
            {summary.interestedContributorsCount}
          </div>
          <span className="text-[11px] font-semibold text-slate-600">
            {summary.interestedContributorsPercentage}% joined Pass It Forward
          </span>
        </div>

        {/* States Represented */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            States Represented
          </span>
          <div className="text-3xl font-black text-purple-700">
            {summary.distinctStatesCount}
          </div>
          <span className="text-[11px] font-semibold text-slate-600">
            Across India
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VISUAL BREAKDOWNS (SECTIONS 2 THROUGH 6)                  */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Q3: Rewarding Experiences */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              Section 2 — Rewarding Experiences
            </span>
            <h4 className="text-base font-black text-slate-900">
              Q3. What Turned Out More Exciting / Rewarding
            </h4>
          </div>
          <div className="space-y-3 text-xs">
            {summary.q3RewardingBreakdown.slice(0, 8).map((item) => (
              <div key={item.option} className="space-y-1">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span className="pr-2">{item.option}</span>
                  <span className="font-bold text-slate-900 shrink-0">{item.count} ({item.percentage}%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Q4: Harder Than Expected */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Section 2 — Challenges
            </span>
            <h4 className="text-base font-black text-slate-900">
              Q4. Harder Than Expected Aspects
            </h4>
          </div>
          <div className="space-y-3 text-xs">
            {summary.q4HarderBreakdown.slice(0, 8).map((item) => (
              <div key={item.option} className="space-y-1">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span className="pr-2">{item.option}</span>
                  <span className="font-bold text-slate-900 shrink-0">{item.count} ({item.percentage}%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-600 transition-all duration-300"
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Q5: Surprises */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">
              Section 3 — Surprises
            </span>
            <h4 className="text-base font-black text-slate-900">
              Q5. Surprises After Entering Medical College
            </h4>
          </div>
          <div className="space-y-3 text-xs">
            {summary.q5SurprisesBreakdown.slice(0, 8).map((item) => (
              <div key={item.option} className="space-y-1">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span className="pr-2">{item.option}</span>
                  <span className="font-bold text-slate-900 shrink-0">{item.count} ({item.percentage}%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-purple-600 transition-all duration-300"
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Q7: Next Batch Priorities */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              Section 5 — Priorities for Next Batch
            </span>
            <h4 className="text-base font-black text-slate-900">
              Q7. What Students Should Understand in 3 Hours
            </h4>
          </div>
          <div className="space-y-3 text-xs">
            {summary.q7NextBatchBreakdown.slice(0, 8).map((item) => (
              <div key={item.option} className="space-y-1">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span className="pr-2">{item.option}</span>
                  <span className="font-bold text-slate-900 shrink-0">{item.count} ({item.percentage}%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* Q6 Matrix: 8 Evaluation Statements Frequency Table        */}
      {/* ========================================================= */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
            Section 4 — Early Transition Matrix
          </span>
          <h4 className="text-lg font-black text-slate-900">
            Q6. Frequency of Early Experiences in MBBS (8 Locked Statements)
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Ranked by high frequency (Often + Very often) across adjustment, independent study, and emotional confidence.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-black uppercase text-slate-600">
                <th className="py-2.5 px-3">Statement</th>
                <th className="py-2.5 px-2 text-center">Never</th>
                <th className="py-2.5 px-2 text-center">Rarely</th>
                <th className="py-2.5 px-2 text-center">Sometimes</th>
                <th className="py-2.5 px-2 text-center font-bold text-amber-800">Often</th>
                <th className="py-2.5 px-2 text-center font-bold text-red-800">Very Often</th>
                <th className="py-2.5 px-3 text-right">High Freq (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary.q6MatrixBreakdown.map((st) => (
                <tr key={st.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="h-5 w-5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black flex items-center justify-center">
                        {st.code}
                      </span>
                      <span>{st.label}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center text-slate-600">{st.ratings["Never"] || 0}</td>
                  <td className="py-3 px-2 text-center text-slate-600">{st.ratings["Rarely"] || 0}</td>
                  <td className="py-3 px-2 text-center text-slate-600">{st.ratings["Sometimes"] || 0}</td>
                  <td className="py-3 px-2 text-center font-bold text-amber-800">{st.ratings["Often"] || 0}</td>
                  <td className="py-3 px-2 text-center font-bold text-red-800">{st.ratings["Very often"] || 0}</td>
                  <td className="py-3 px-3 text-right font-black text-slate-900">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[11px] ${
                        st.code === "7" || st.code === "8"
                          ? "bg-emerald-100 text-emerald-900"
                          : st.highFrequencyPercentage > 40
                          ? "bg-red-100 text-red-900"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {st.highFrequencyPercentage}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 6: Preparation Formats & Optimal Timing           */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Q8: Useful Preparation Formats */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              Section 6 — Formats
            </span>
            <h4 className="text-base font-black text-slate-900">
              Q8. Useful Preparation Formats
            </h4>
          </div>
          <div className="space-y-3 text-xs">
            {summary.q8PreparationTypesBreakdown.slice(0, 8).map((item) => (
              <div key={item.option} className="space-y-1">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span className="pr-2">{item.option}</span>
                  <span className="font-bold text-slate-900 shrink-0">{item.count} ({item.percentage}%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-teal-600 transition-all duration-300"
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Q9: Optimal Timing & Contributor Pathways */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div>
            <div className="border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                Section 6 — Timing
              </span>
              <h4 className="text-base font-black text-slate-900">
                Q9. When Preparation Helps Most
              </h4>
            </div>
            <div className="space-y-2.5 text-xs pt-3">
              {summary.q9TimingBreakdown.map((item) => (
                <div key={item.option} className="space-y-1">
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span className="pr-2">{item.option}</span>
                    <span className="font-bold text-slate-900 shrink-0">{item.percentage}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-700"
                      style={{ width: `${Math.min(item.percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-2">
              Pass It Forward Contributor Pathways
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {summary.contributionMethodsBreakdown.slice(0, 6).map((item) => (
                <div key={item.option} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex justify-between items-center">
                  <span className="font-medium text-slate-700 pr-1">{item.option}</span>
                  <span className="font-bold text-blue-900 shrink-0">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RECENT STUDENT RESPONSES TABLE                            */}
      {/* ========================================================= */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-950">
              Recent Student &amp; Intern Submissions
            </h3>
            <p className="text-xs text-slate-500">
              Showing {filteredResponses.length} of {summary.totalResponses} responses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Search name, state, reflection..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
            >
              <option value="ALL">All Stages</option>
              <option value="First MBBS">First MBBS</option>
              <option value="Second MBBS">Second MBBS</option>
              <option value="Third MBBS Part I">Third MBBS Part I</option>
              <option value="Final MBBS">Final MBBS</option>
              <option value="Internship">Internship</option>
            </select>
            <select
              value={quoteFilter}
              onChange={(e) => setQuoteFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
            >
              <option value="ALL">All Quote Status</option>
              <option value="YES">Quote Permitted</option>
              <option value="NO">No Permission</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase text-slate-600">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Stage &amp; College</th>
                <th className="py-2.5 px-3">Q10 Reflection</th>
                <th className="py-2.5 px-3 text-center">Quote Permission</th>
                <th className="py-2.5 px-3 text-center">Contributor</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResponses.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-3 text-slate-500 font-mono whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900">
                    <div>{r.trainingStage}</div>
                    <div className="text-[11px] text-slate-500 font-normal">
                      {[r.institutionName, r.collegeType, r.state].filter(Boolean).join(" • ") || "—"}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-700 max-w-xs truncate italic">
                    {r.q10WishSomeoneTold ? `“${r.q10WishSomeoneTold}”` : "—"}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {r.quotePermission ? (
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-bold">
                        ✓ Permitted (Anon)
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px]">
                        Not Granted
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {r.interestedInContributing ? (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold">
                        Yes
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => setSelectedResponse(r)}
                      className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] transition cursor-pointer"
                    >
                      View Full
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RESPONSE DETAIL MODAL                                     */}
      {/* ========================================================= */}
      {selectedResponse && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl animate-fadeIn">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
                  Student Voice Submission Detail ({selectedResponse.surveyVersion?.toUpperCase() || "V2"})
                </span>
                <h3 className="text-xl font-black text-slate-950 mt-0.5">
                  {selectedResponse.respondentName || "Anonymous Student / Intern"}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  ID: {selectedResponse.id} • {selectedResponse.trainingStage} • {selectedResponse.state || "India"}
                </p>
              </div>
              <button
                onClick={() => setSelectedResponse(null)}
                className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Quote Permission Alert */}
            <div
              className={`rounded-xl border p-3.5 text-xs font-bold flex items-center justify-between ${
                selectedResponse.quotePermission
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-slate-50 border-slate-200 text-slate-600"
              }`}
            >
              <span>
                Anonymous Quotation Status:{" "}
                <strong>
                  {selectedResponse.quotePermission ? "PERMITTED (Anonymous)" : "NOT PERMITTED"}
                </strong>
              </span>
              <span className="text-sm">{selectedResponse.quotePermission ? "✓" : "✕"}</span>
            </div>

            {/* Q10 Reflection */}
            {selectedResponse.q10WishSomeoneTold && (
              <div className="rounded-xl bg-blue-50/70 border border-blue-200 p-4 space-y-1">
                <span className="font-bold text-blue-900 uppercase tracking-wider text-[11px]">
                  Q10. “Before I started MBBS, I wish someone had told me that...”
                </span>
                <p className="text-sm font-semibold text-slate-900 italic leading-relaxed pt-1">
                  “{selectedResponse.q10WishSomeoneTold}”
                </p>
              </div>
            )}

            {/* Contributor Contact info if present */}
            {(selectedResponse.email || selectedResponse.mobileWhatsapp || selectedResponse.respondentName) && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs space-y-2">
                <span className="font-bold text-amber-900 uppercase tracking-wider text-[11px]">
                  Pass It Forward Contributor Details
                </span>
                <div className="text-slate-800">
                  Name: <strong>{selectedResponse.respondentName || "N/A"}</strong> | Email:{" "}
                  <strong>{selectedResponse.email || "N/A"}</strong> | Mobile:{" "}
                  <strong>{selectedResponse.mobileWhatsapp || "N/A"}</strong>
                </div>
                {selectedResponse.contributionInterests && selectedResponse.contributionInterests.length > 0 && (
                  <div className="pt-1">
                    <span className="font-bold text-amber-950">Interests:</span>{" "}
                    {selectedResponse.contributionInterests.join(", ")}
                  </div>
                )}
              </div>
            )}

            {/* Answers Breakdown */}
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-slate-700">Q3. Rewarding Experiences:</span>
                <p className="bg-slate-50 p-2.5 rounded-lg text-slate-900 font-medium">
                  {Array.isArray(selectedResponse.surveyResponses?.q3RewardingExperiences)
                    ? selectedResponse.surveyResponses.q3RewardingExperiences.join("; ")
                    : "—"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-700">Q4. Harder Than Expected:</span>
                <p className="bg-slate-50 p-2.5 rounded-lg text-slate-900 font-medium">
                  {Array.isArray(selectedResponse.surveyResponses?.q4HarderAspects)
                    ? selectedResponse.surveyResponses.q4HarderAspects.join("; ")
                    : "—"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-700">Q5. Surprises:</span>
                <p className="bg-slate-50 p-2.5 rounded-lg text-slate-900 font-medium">
                  {Array.isArray(selectedResponse.surveyResponses?.q5Surprises)
                    ? selectedResponse.surveyResponses.q5Surprises.join("; ")
                    : "—"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-700">Q7. Priorities to Prepare Next Batch:</span>
                <p className="bg-slate-50 p-2.5 rounded-lg text-slate-900 font-medium">
                  {Array.isArray(selectedResponse.surveyResponses?.q7NextBatchPriorities)
                    ? selectedResponse.surveyResponses.q7NextBatchPriorities.join("; ")
                    : "—"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-700">Q8. Useful Preparation Formats:</span>
                <p className="bg-slate-50 p-2.5 rounded-lg text-slate-900 font-medium">
                  {Array.isArray(selectedResponse.surveyResponses?.q8UsefulPreparationTypes)
                    ? selectedResponse.surveyResponses.q8UsefulPreparationTypes.join("; ")
                    : "—"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-700">Q9. When Preparation Helps Most:</span>
                <p className="bg-slate-50 p-2.5 rounded-lg text-slate-900 font-medium">
                  {selectedResponse.surveyResponses?.q9BestTiming || "—"}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedResponse(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-black transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PLAIN TEXT SURVEY COPY MODAL                              */}
      {/* ========================================================= */}
      {showSurveyTextModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col p-6 sm:p-8 shadow-2xl animate-fadeIn">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-950">
                  Student Voice V2 Plain Text Questionnaire (Q1–Q10)
                </h3>
                <p className="text-xs text-slate-500">
                  Copy and paste into ChatGPT, Google Docs, or review briefs.
                </p>
              </div>
              <button
                onClick={() => setShowSurveyTextModal(false)}
                className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <pre className="text-[11px] font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
                {generateStudentVoiceSurveyPlainText()}
              </pre>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(generateStudentVoiceSurveyPlainText());
                  setCopySuccessMessage("Copied to clipboard!");
                  setTimeout(() => setCopySuccessMessage(null), 3000);
                  setShowSurveyTextModal(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                Copy to Clipboard &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
