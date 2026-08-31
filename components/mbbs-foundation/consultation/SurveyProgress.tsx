"use client";

import React from "react";

interface SurveyProgressProps {
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
}

export default function SurveyProgress({
  currentStep,
  totalSteps,
  stepTitle,
}: SurveyProgressProps) {
  const percentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center rounded-lg bg-red-700 text-white text-xs font-black px-2.5 py-1">
            Section {currentStep} of {totalSteps}
          </span>
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
            {stepTitle}
          </h2>
        </div>

        <span className="text-xs font-semibold text-slate-500 font-mono">
          {percentage}% Completed
        </span>
      </div>

      {/* Progress Track */}
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
        <div
          className="h-full bg-gradient-to-r from-red-700 to-rose-600 transition-all duration-300 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
