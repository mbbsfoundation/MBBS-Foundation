import React, { Suspense } from "react";
import { Metadata } from "next";
import ReviveModuleInterface from "./ReviveModuleInterface";

export const metadata: Metadata = {
  title: "Module 7: REVIVE — Resuscitation & Emergency CPR | MBBS Foundation LMS",
  description:
    "Interactive learning module covering resuscitation science, chest compression mechanics, AED deployment, reversible causes of arrest, and resuscitation team dynamics.",
};

export default function ReviveModulePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-500 text-sm font-medium">
          <div className="flex items-center gap-3">
            <span className="h-5 w-5 border-2 border-teal-700 border-t-transparent rounded-full animate-spin"></span>
            <span>Loading Module 7: REVIVE...</span>
          </div>
        </div>
      }
    >
      <ReviveModuleInterface />
    </Suspense>
  );
}
