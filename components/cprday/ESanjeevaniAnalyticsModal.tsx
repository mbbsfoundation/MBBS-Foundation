"use client";

import { useState, useEffect } from "react";

type AnalyticsData = {
  totalSubmissions: number;
  passedSubmissions: number;
  passRatePct: number;
  avgQuizScore: string;
  avgRating: string;
  categoryCounts: Record<string, number>;
  zoneCounts: Record<string, number>;
  stateCounts: Record<string, number>;
  recentFeedbacks: { fullName: string; rating: number; feedback: string; createdAt: string }[];
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ESanjeevaniAnalyticsModal({ isOpen, onClose }: Props) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/cprday/esanjeevani/analytics");
        const json = await res.json();

        if (res.ok && json.success) {
          setData(json.analytics);
        } else {
          setError(json.error || "Failed to fetch analytics data.");
        }
      } catch (err) {
        console.error("Error loading analytics:", err);
        setError("Could not connect to analytics server.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative my-8 w-full max-w-5xl rounded-3xl border border-purple-200 bg-white p-6 sm:p-10 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-purple-100 pb-5">
          <div>
            <span className="inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-purple-800">
              Admin & Organizer Analytics
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
              CPR eSANJEEVANI Reports & Insights
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center">
            <svg className="mx-auto h-10 w-10 animate-spin text-purple-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <p className="mt-4 font-bold text-slate-700">Loading Analytics & Reports...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="my-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700 font-semibold">
            {error}
          </div>
        )}

        {/* Main Analytics Content */}
        {!loading && !error && data && (
          <div className="mt-6 space-y-8">
            {/* Top Bar Action: Download CSV */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-purple-200 bg-purple-50/60 p-4">
              <div>
                <p className="text-sm font-bold text-purple-950">
                  Export Participant & Quiz Analytics Data
                </p>
                <p className="text-xs text-slate-600">
                  Download full Excel/CSV report containing all participant entries, scores, location demographics & feedback.
                </p>
              </div>
              <a
                href="/api/cprday/esanjeevani/analytics?format=csv"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 font-bold text-white shadow-md hover:from-emerald-700 hover:to-teal-700 transition flex items-center gap-2 text-sm"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download CSV Analytics Report
              </a>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-5 text-center">
                <span className="text-xs font-bold uppercase text-sky-800">Total Completions</span>
                <p className="mt-2 text-3xl font-black text-slate-900">{data.totalSubmissions}</p>
                <span className="text-xs text-slate-500 font-semibold">Certificates Issued</span>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-center">
                <span className="text-xs font-bold uppercase text-emerald-800">Pass Rate</span>
                <p className="mt-2 text-3xl font-black text-emerald-900">{data.passRatePct}%</p>
                <span className="text-xs text-emerald-700 font-semibold">{data.passedSubmissions} Qualified (Score ≥ 3/5)</span>
              </div>

              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-5 text-center">
                <span className="text-xs font-bold uppercase text-indigo-800">Avg Quiz Score</span>
                <p className="mt-2 text-3xl font-black text-indigo-950">{data.avgQuizScore} / 5</p>
                <span className="text-xs text-slate-500 font-semibold">Randomized 5-Q Pool</span>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-center">
                <span className="text-xs font-bold uppercase text-amber-800">Module Rating</span>
                <p className="mt-2 text-3xl font-black text-amber-900">★ {data.avgRating}</p>
                <span className="text-xs text-amber-700 font-semibold">Overall Satisfaction</span>
              </div>
            </div>

            {/* Demographics: Zone & Participant Category Distribution */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Zone Distribution */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6">
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-purple-600"></span>
                  Geographic Zone Distribution
                </h3>
                {Object.keys(data.zoneCounts).length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No zone data recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(data.zoneCounts).map(([zone, count]) => {
                      const pct = Math.round((count / data.totalSubmissions) * 100);
                      return (
                        <div key={zone}>
                          <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                            <span>{zone}</span>
                            <span>{count} ({pct}%)</span>
                          </div>
                          <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-600 rounded-full" style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Category Breakdown */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6">
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-sky-600"></span>
                  Participant Category Breakdown
                </h3>
                {Object.keys(data.categoryCounts).length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No category data recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(data.categoryCounts).map(([cat, count]) => {
                      const pct = Math.round((count / data.totalSubmissions) * 100);
                      return (
                        <div key={cat}>
                          <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                            <span>{cat}</span>
                            <span>{count} ({pct}%)</span>
                          </div>
                          <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-sky-600 rounded-full" style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Feedback Feed */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-600"></span>
                Recent Participant Feedback & Comments ({data.recentFeedbacks.length})
              </h3>
              {data.recentFeedbacks.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No feedback entries submitted yet.</p>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {data.recentFeedbacks.map((item, idx) => (
                    <div key={idx} className="rounded-xl border border-sky-100 bg-sky-50/30 p-3.5 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900">{item.fullName}</span>
                        <span className="font-bold text-amber-700">★ {item.rating}/5</span>
                      </div>
                      <p className="text-slate-700 italic">"{item.feedback}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
