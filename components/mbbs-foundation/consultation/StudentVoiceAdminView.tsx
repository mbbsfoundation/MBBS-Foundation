"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  StudentVoiceDashboardSummary,
  StudentOptionMetric,
  StudentQ8StatementMetric,
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
  const [contributorFilter, setContributorFilter] = useState<string>("ALL");

  // Plain-Text Modal State
  const [showSurveyTextModal, setShowSurveyTextModal] = useState<boolean>(false);
  const [copySuccessMessage, setCopySuccessMessage] = useState<string | null>(null);

  const handleCopySurveyText = () => {
    try {
      const text = generateStudentVoiceSurveyPlainText();
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
        setCopySuccessMessage("Complete Survey 2 text copied to clipboard!");
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
              Survey 2 — Student &amp; Intern Voice Dashboard
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Capturing the lived experience, surprises, challenges, and guidance needs of medical students.
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
          <h3 className="text-lg font-bold text-slate-900">No Student &amp; Intern Responses Yet</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            The Student &amp; Intern Voice survey is live at{" "}
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
    if (contributorFilter === "YES" && !r.interestedInContributing) return false;
    if (contributorFilter === "NO" && r.interestedInContributing) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const matchName = r.respondentName?.toLowerCase().includes(q);
      const matchState = r.state?.toLowerCase().includes(q);
      const matchWish = r.q18OneThingWishTold?.toLowerCase().includes(q);
      if (!matchName && !matchState && !matchWish) return false;
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
            Survey 2 — Student &amp; Intern Voice Dashboard
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

      {/* Consultation Page Access Links */}
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

      {/* 5 Headline KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Responses */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Responses
          </span>
          <div className="text-3xl font-black text-slate-950">
            {summary.totalResponses}
          </div>
          <span className="text-[11px] font-semibold text-blue-800">
            Student &amp; Intern voices
          </span>
        </div>

        {/* Transition Difficult / Challenging */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Difficult Transition
          </span>
          <div className="text-3xl font-black text-amber-700">
            {summary.difficultTransitionPercentage}%
          </div>
          <span className="text-[11px] font-semibold text-slate-600">
            {summary.difficultTransitionCount} of {summary.totalResponses} respondents
          </span>
        </div>

        {/* Prior Knowledge Benefit */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Prior Knowledge Benefit
          </span>
          <div className="text-3xl font-black text-emerald-700">
            {summary.priorKnowledgeHelpPercentage}%
          </div>
          <span className="text-[11px] font-semibold text-slate-600">
            Saying Definitely / Probably Yes
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
            {summary.interestedContributorsPercentage}% interested in helping
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
      {/* SECTION: Student Voice: What the Data Is Telling Us        */}
      {/* ========================================================= */}
      <div className="rounded-3xl border-2 border-blue-900/20 bg-gradient-to-br from-slate-900 to-blue-950 p-6 sm:p-8 text-white shadow-md space-y-6">
        <div>
          <span className="inline-block rounded-full bg-blue-800/80 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-blue-200">
            Factual Summary Metrics
          </span>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-white">
            Student Voice: What the Data Is Telling Us
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-300">
            Objective calculations strictly derived from respondent selections (no pre-assumed narratives).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white/10 p-4 space-y-1.5 backdrop-blur-xs border border-white/10">
            <span className="text-xs text-blue-200 font-medium">Initial Months Experience</span>
            <div className="text-2xl font-black text-white">
              {summary.calculatedInsights.pctExcitingChallengingOrMixed}%
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              Reported first months were exciting but challenging, overwhelming, or mixed.
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 p-4 space-y-1.5 backdrop-blur-xs border border-white/10">
            <span className="text-xs text-blue-200 font-medium">Academic Adjustment</span>
            <div className="text-2xl font-black text-white">
              {summary.calculatedInsights.pctMajorAcademicChallenges}%
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              Identified major academic challenges (volume, study methods, self-directed learning).
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 p-4 space-y-1.5 backdrop-blur-xs border border-white/10">
            <span className="text-xs text-blue-200 font-medium">Personal &amp; Social Gaps</span>
            <div className="text-2xl font-black text-white">
              {summary.calculatedInsights.pctPersonalSocialChallenges}%
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              Identified personal/social challenges (hostel life, time management, stress, comparison).
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 p-4 space-y-1.5 backdrop-blur-xs border border-white/10">
            <span className="text-xs text-blue-200 font-medium">Early Guidance Timing</span>
            <div className="text-2xl font-black text-white">
              {summary.calculatedInsights.pctWantingGuidanceEarly}%
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              Stated guidance would be most useful before joining, during admissions, or in month 1.
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 p-4 space-y-1.5 backdrop-blur-xs border border-white/10">
            <span className="text-xs text-blue-200 font-medium">Value of Structured Guide</span>
            <div className="text-2xl font-black text-white">
              {summary.calculatedInsights.pctGuideVeryOrExtremelyUseful}%
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              Rated a structured guide on MBBS academic/social reality as Very or Extremely Useful.
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 p-4 space-y-1.5 backdrop-blur-xs border border-white/10">
            <span className="text-xs text-blue-200 font-medium">Advance Knowledge Impact</span>
            <div className="text-2xl font-black text-emerald-400">
              {summary.calculatedInsights.pctAdvanceKnowledgeDefinitelyOrProbablyHelped}%
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              Confirmed that knowing about challenges in advance would definitely/probably have helped.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* DETAILED SURVEY 2 VISUAL BREAKDOWNS                       */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* A. Rewarding Experiences (Q4) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              Section 2 — The Good Part
            </span>
            <h4 className="text-base font-black text-slate-900">
              Q4. Most Exciting &amp; Rewarding Experiences
            </h4>
          </div>
          <div className="space-y-3 text-xs">
            {summary.q4RewardingBreakdown.slice(0, 8).map((item) => (
              <div key={item.option} className="space-y-1">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>{item.option}</span>
                  <span className="font-bold text-slate-900">{item.count} ({item.percentage}%)</span>
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

        {/* Overall First Month Feeling (Q5) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              Section 2 — Initial Months Feeling
            </span>
            <h4 className="text-base font-black text-slate-900">
              Q5. Overall First Months of MBBS
            </h4>
          </div>
          <div className="space-y-3 text-xs">
            {summary.q5FeelingBreakdown.map((item) => (
              <div key={item.option} className="space-y-1">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>{item.option}</span>
                  <span className="font-bold text-slate-900">{item.count} ({item.percentage}%)</span>
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

        {/* B. Harder-Than-Expected Aspects (Q6) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Section 3 — Challenges
            </span>
            <h4 className="text-base font-black text-slate-900">
              Q6. Harder Than Expected Aspects
            </h4>
          </div>
          <div className="space-y-3 text-xs">
            {summary.q6HarderBreakdown.slice(0, 8).map((item) => (
              <div key={item.option} className="space-y-1">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>{item.option}</span>
                  <span className="font-bold text-slate-900">{item.count} ({item.percentage}%)</span>
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

        {/* C. Most Unexpected (Q7) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">
              Section 3 — Surprises
            </span>
            <h4 className="text-base font-black text-slate-900">
              Q7. Most Different from Imagined
            </h4>
          </div>
          <div className="space-y-3 text-xs">
            {summary.q7UnexpectedBreakdown.slice(0, 8).map((item) => (
              <div key={item.option} className="space-y-1">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>{item.option}</span>
                  <span className="font-bold text-slate-900">{item.count} ({item.percentage}%)</span>
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
      </div>

      {/* ========================================================= */}
      {/* D. Q8 Matrix: 10 Statement Adjustment & Emotional Feelings */}
      {/* ========================================================= */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
            Section 3 — First-Year Adjustment Matrix
          </span>
          <h4 className="text-lg font-black text-slate-900">
            Q8. Frequency of First-Year Experiences (10 Evaluation Statements)
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Ranked by high frequency (Often + Very Often) across academic, emotional, and positive growth domains.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-black uppercase text-slate-600">
                <th className="py-2.5 px-3">Statement</th>
                <th className="py-2.5 px-2 text-center">Never</th>
                <th className="py-2.5 px-2 text-center">Occasionally</th>
                <th className="py-2.5 px-2 text-center">Sometimes</th>
                <th className="py-2.5 px-2 text-center font-bold text-amber-800">Often</th>
                <th className="py-2.5 px-2 text-center font-bold text-red-800">Very Often</th>
                <th className="py-2.5 px-3 text-right">High Freq (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary.q8RatingsBreakdown.map((st) => (
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
                  <td className="py-3 px-2 text-center text-slate-600">{st.ratings["Occasionally"] || 0}</td>
                  <td className="py-3 px-2 text-center text-slate-600">{st.ratings["Sometimes"] || 0}</td>
                  <td className="py-3 px-2 text-center font-bold text-amber-800">{st.ratings["Often"] || 0}</td>
                  <td className="py-3 px-2 text-center font-bold text-red-800">{st.ratings["Very often"] || 0}</td>
                  <td className="py-3 px-3 text-right font-black text-slate-900">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[11px] ${
                        st.category === "positive_growth"
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
      {/* E & F: Guidance Needs, Optimal Formats & Timing            */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Q9: Understand Before */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              Section 4 — Core Priorities
            </span>
            <h4 className="text-sm font-black text-slate-900">
              Q9. What Students Must Understand Before Starting
            </h4>
          </div>
          <div className="space-y-2.5 text-xs">
            {summary.q9UnderstandBeforeBreakdown.slice(0, 6).map((item) => (
              <div key={item.option} className="space-y-1">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span className="pr-2">{item.option}</span>
                  <span className="font-bold text-slate-900">{item.percentage}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-700"
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Q10: Guidance Formats */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              Section 4 — Formats
            </span>
            <h4 className="text-sm font-black text-slate-900">
              Q10. Preferred Guidance Formats
            </h4>
          </div>
          <div className="space-y-2.5 text-xs">
            {summary.q10GuidanceTypesBreakdown.slice(0, 6).map((item) => (
              <div key={item.option} className="space-y-1">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span className="pr-2">{item.option}</span>
                  <span className="font-bold text-slate-900">{item.percentage}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-teal-700"
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Q11: Optimal Timing */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              Section 4 — Timing
            </span>
            <h4 className="text-sm font-black text-slate-900">
              Q11. Optimal Guidance Timing
            </h4>
          </div>
          <div className="space-y-2.5 text-xs">
            {summary.q11TimingBreakdown.map((item) => (
              <div key={item.option} className="space-y-1">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span className="pr-2">{item.option}</span>
                  <span className="font-bold text-slate-900">{item.percentage}%</span>
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
      </div>

      {/* ========================================================= */}
      {/* G & H: Structured Guide Value & Transition Evaluation      */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Q12 & Q13: Guide Value & Essential Components */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              Section 4 — Guide Content
            </span>
            <h4 className="text-base font-black text-slate-900">
              Q13. Essential Components for MBBS Guide
            </h4>
          </div>
          <div className="space-y-3 text-xs">
            {summary.q13ComponentsBreakdown.slice(0, 8).map((item) => (
              <div key={item.option} className="space-y-1">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>{item.option}</span>
                  <span className="font-bold text-slate-900">{item.percentage}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Q14 & Q15: Overall Transition & Contributor Interests */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div>
            <div className="border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                Section 5 — Transition Reflections
              </span>
              <h4 className="text-base font-black text-slate-900">
                Q14. Overall Transition Fit
              </h4>
            </div>
            <div className="space-y-2.5 text-xs pt-3">
              {summary.q14TransitionBreakdown.map((item) => (
                <div key={item.option} className="space-y-1">
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span className="pr-2">{item.option}</span>
                    <span className="font-bold text-slate-900">{item.percentage}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-700"
                      style={{ width: `${Math.min(item.percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-2">
              Q17. How Students Want to Help (Contributors)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {summary.q17HelpMethodsBreakdown.slice(0, 6).map((item) => (
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
              Recent Student &amp; Intern Responses
            </h3>
            <p className="text-xs text-slate-500">
              Showing {filteredResponses.length} of {summary.totalResponses} submissions.
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
              <option value="Third MBBS — Part I">Third MBBS — Part I</option>
              <option value="Final MBBS / Third MBBS — Part II">Final MBBS</option>
              <option value="Internship / CRRI">Internship / CRRI</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase text-slate-600">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Stage &amp; State</th>
                <th className="py-2.5 px-3">First Months (Q5)</th>
                <th className="py-2.5 px-3">Prior Knowledge (Q15)</th>
                <th className="py-2.5 px-3">One Thing Wish Told (Q18)</th>
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
                      {[r.collegeType, r.state].filter(Boolean).join(" • ") || "—"}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-700">
                    <span className="font-medium">{r.q5FirstMonthsFeeling}</span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    {r.q15PriorKnowledgeWouldHaveHelped}
                  </td>
                  <td className="py-3 px-3 text-slate-600 max-w-xs truncate italic">
                    {r.q18OneThingWishTold ? `"${r.q18OneThingWishTold}"` : "—"}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {r.interestedInContributing ? (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
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
                  Student Voice Submission Detail
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

            {/* Contact info if present */}
            {(selectedResponse.email || selectedResponse.mobileWhatsapp) && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs space-y-1">
                <span className="font-bold text-amber-900 uppercase tracking-wider text-[11px]">
                  Contributor Contact Information
                </span>
                <div className="text-slate-800">
                  Email: <strong>{selectedResponse.email || "N/A"}</strong> | Mobile:{" "}
                  <strong>{selectedResponse.mobileWhatsapp || "N/A"}</strong>
                </div>
              </div>
            )}

            {/* Q18 Reflection */}
            {selectedResponse.q18OneThingWishTold && (
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 space-y-1">
                <span className="font-bold text-blue-900 uppercase tracking-wider text-[11px]">
                  Q18. One Thing Wish Told Before Starting:
                </span>
                <p className="text-sm font-semibold text-slate-900 italic">
                  "{selectedResponse.q18OneThingWishTold}"
                </p>
              </div>
            )}

            {/* Answers Breakdown */}
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-slate-700">Q4. Rewarding Experiences:</span>
                <p className="bg-slate-50 p-2.5 rounded-lg text-slate-900 font-medium">
                  {Array.isArray(selectedResponse.surveyResponses?.q4RewardingExperiences)
                    ? selectedResponse.surveyResponses.q4RewardingExperiences.join(", ")
                    : "—"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-700">Q6. Harder Than Expected:</span>
                <p className="bg-slate-50 p-2.5 rounded-lg text-slate-900 font-medium">
                  {Array.isArray(selectedResponse.surveyResponses?.q6HarderAspects)
                    ? selectedResponse.surveyResponses.q6HarderAspects.join(", ")
                    : "—"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-700">Q7. Most Unexpected:</span>
                <p className="bg-slate-50 p-2.5 rounded-lg text-slate-900 font-medium">
                  {Array.isArray(selectedResponse.surveyResponses?.q7UnexpectedAspects)
                    ? selectedResponse.surveyResponses.q7UnexpectedAspects.join(", ")
                    : "—"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-700">Q9. Must Understand Before:</span>
                <p className="bg-slate-50 p-2.5 rounded-lg text-slate-900 font-medium">
                  {Array.isArray(selectedResponse.surveyResponses?.q9ShouldUnderstandBefore)
                    ? selectedResponse.surveyResponses.q9ShouldUnderstandBefore.join(", ")
                    : "—"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-700">Q13. Guide Essential Components:</span>
                <p className="bg-slate-50 p-2.5 rounded-lg text-slate-900 font-medium">
                  {Array.isArray(selectedResponse.surveyResponses?.q13GuideEssentialComponents)
                    ? selectedResponse.surveyResponses.q13GuideEssentialComponents.join(", ")
                    : "—"}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedResponse(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-black transition"
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
                  Survey 2 Plain Text Questionnaire (Q1–Q18)
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
                className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition"
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
