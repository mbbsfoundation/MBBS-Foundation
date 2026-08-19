"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { trackNeetEvent } from "@/lib/analytics";
import InteractiveCollegeComparator from "./InteractiveCollegeComparator";

type ResourceKey = "counselling" | "college-comparison" | "documents" | "first-day";

interface ResourceMeta {
  id: ResourceKey;
  anchor: string;
  title: string;
  shortTitle: string;
  badge: string;
  description: string;
  icon: string;
}

const RESOURCES: ResourceMeta[] = [
  {
    id: "counselling",
    anchor: "counselling-checklist",
    title: "NEET Counselling Checklist",
    shortTitle: "Counselling Checklist",
    badge: "Checklist 01",
    description: "Stay organized through registration, choice filling and allotment.",
    icon: "📋",
  },
  {
    id: "college-comparison",
    anchor: "college-comparison",
    title: "Medical College Comparison Worksheet",
    shortTitle: "Comparison Worksheet",
    badge: "Worksheet 02",
    description: "Compare up to three colleges using the factors that actually matter.",
    icon: "⚖️",
  },
  {
    id: "documents",
    anchor: "documents-checklist",
    title: "Counselling & Admission Documents Checklist",
    shortTitle: "Documents Checklist",
    badge: "Checklist 03",
    description: "Prepare commonly required counselling and admission documents.",
    icon: "📑",
  },
  {
    id: "first-day",
    anchor: "first-day-mbbs",
    title: "Before Your First Day of MBBS Checklist",
    shortTitle: "First Day Checklist",
    badge: "Checklist 04",
    description: "Make the transition from NEET aspirant to medical student.",
    icon: "🩺",
  },
];

export default function ToolkitViewer() {
  const [activeTab, setActiveTab] = useState<ResourceKey>("counselling");
  const [copied, setCopied] = useState(false);

  // Sync with URL anchor on mount or hash change
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash === "college-comparison" || hash === "college-comparison-worksheet") {
        setActiveTab("college-comparison");
      } else if (hash === "documents-checklist" || hash === "documents") {
        setActiveTab("documents");
      } else if (hash === "first-day-mbbs" || hash === "first-day") {
        setActiveTab("first-day");
      } else if (hash === "counselling-checklist" || hash === "counselling") {
        setActiveTab("counselling");
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const handlePrint = () => {
    trackNeetEvent("neet_toolkit_print", { resource: activeTab });
    if (typeof window !== "undefined") {
      const originalTitle = document.title;
      if (activeTab === "college-comparison") {
        document.title = "College choice decision matrix_MBBS Foundation";
      }
      window.print();
      if (activeTab === "college-comparison") {
        setTimeout(() => {
          document.title = originalTitle;
        }, 1000);
      }
    }
  };

  const handleCopyLink = () => {
    trackNeetEvent("neet_copy_link", { path: `/neet-to-mbbs/toolkit#${RESOURCES.find((r) => r.id === activeTab)?.anchor || ""}` });
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/neet-to-mbbs/toolkit#${RESOURCES.find((r) => r.id === activeTab)?.anchor || ""}`;
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  return (
    <div className="space-y-10 print:space-y-0">
      {/* 4 Resource Selection Cards */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
        {RESOURCES.map((res) => {
          const isSelected = activeTab === res.id;
          return (
            <button
              key={res.id}
              type="button"
              onClick={() => {
                setActiveTab(res.id);
                window.location.hash = res.anchor;
                trackNeetEvent("neet_toolkit_use", { resource: res.id });
              }}
              className={`text-left rounded-2xl p-4 sm:p-5 border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 ${
                isSelected
                  ? "border-red-700 bg-red-50/70 shadow-sm ring-2 ring-red-700/20"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-block rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      isSelected
                        ? "bg-red-800 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {res.badge}
                  </span>
                  <span className="text-xl" aria-hidden="true">
                    {res.icon}
                  </span>
                </div>
                <h2 className="mt-3 font-bold text-slate-900 text-sm sm:text-base leading-snug">
                  {res.shortTitle}
                </h2>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  {res.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold">
                <span className={isSelected ? "text-red-800" : "text-slate-500"}>
                  {isSelected ? "● Active View" : "View Resource →"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Resource Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 print:hidden border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Current Resource:
          </span>
          <span className="text-sm font-bold text-slate-900">
            {RESOURCES.find((r) => r.id === activeTab)?.title}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `Useful NEET-to-MBBS resource (${RESOURCES.find((r) => r.id === activeTab)?.title}): https://mbbsfoundation.com/neet-to-mbbs/toolkit#${RESOURCES.find((r) => r.id === activeTab)?.anchor || ""}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-2xs"
            aria-label="Share resource on WhatsApp"
          >
            <span>💬</span>
            <span>WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
          >
            <span>🔗</span>
            <span>{copied ? "✓ Link Copied!" : "Copy Link"}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer shadow-xs"
          >
            <span>🖨️</span>
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PRINTABLE RESOURCE CONTAINER */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm print:border-none print:p-0 print:m-0 print:shadow-none">
        {/* Printable Header (Visible on print and screen, but hidden for college-comparison which has its own print layout) */}
        <div className={`border-b border-slate-200 pb-6 mb-8 ${activeTab === "college-comparison" ? "print:hidden" : ""}`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-700">
                NEET to MBBS 2026 • Free Educational Toolkit
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {RESOURCES.find((r) => r.id === activeTab)?.title}
              </h2>
            </div>
            <div className="text-right hidden sm:block">
              <span className="font-mono text-xs font-bold text-slate-400">
                MBBS FOUNDATION
              </span>
              <p className="text-[10px] text-slate-400">mbbsfoundation.com</p>
            </div>
          </div>
        </div>

        {/* 1. RESOURCE A: NEET COUNSELLING CHECKLIST */}
        {activeTab === "counselling" && (
          <div className="space-y-8 text-slate-800 text-sm">
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
              Keep this checklist handy through registration, choice filling, allotment, and reporting.
            </p>

            {/* Before Counselling */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-900 text-white text-xs">1</span>
                <span>Before Counselling Begins</span>
              </h3>
              <ul className="space-y-2.5 pl-2">
                {[
                  "Identify all applicable counselling authorities (MCC for AIQ 15%, Central & Deemed; State DME for 85% State Quota).",
                  "Verify eligibility criteria, category documents, and state domicile requirements.",
                  "Monitor official schedules and registration opening notices on official portals only.",
                  "Complete online registration and note down application number and login credentials safely.",
                  "Arrange original documents along with multiple self-attested photocopies in advance.",
                  "Pay the non-refundable registration fee and refundable security deposit before the deadline.",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-red-700 focus:ring-red-600 shrink-0 cursor-pointer" />
                    <span className="leading-normal">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Before Choice Filling */}
            <div className="space-y-3 pt-2">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-900 text-white text-xs">2</span>
                <span>Before Choice Filling & Locking</span>
              </h3>
              <ul className="space-y-2.5 pl-2">
                {[
                  "Research every shortlisted college for NMC recognition status and approved intake.",
                  "Verify the total all-inclusive fee structure (tuition, hostel, mess, exam, and hidden development charges).",
                  "Check applicable state rural service bond duration and financial exit penalties.",
                  "Verify hostel availability, campus security, and accommodation rules.",
                  "Consider travel connectivity, climate, and local dialect for patient communication.",
                  "Discuss the multi-year financial commitment thoroughly with your family.",
                  "Arrange college choices strictly by genuine preference order (most preferred to least preferred).",
                  "Review and lock choices before the closing window and download a saved confirmation slip.",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-red-700 focus:ring-red-600 shrink-0 cursor-pointer" />
                    <span className="leading-normal">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* After Allotment */}
            <div className="space-y-3 pt-2">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-900 text-white text-xs">3</span>
                <span>After Seat Allotment</span>
              </h3>
              <ul className="space-y-2.5 pl-2">
                {[
                  "Download and carefully read the provisional seat allotment letter.",
                  "Understand the rules for your allotted round (Free Exit, Upgrade willingness, or mandatory reporting).",
                  "Pack all required original certificates, identity proofs, fitness certificate, and bond documentation.",
                  "Report physically to the allotted institution within the designated reporting dates.",
                  "Complete document verification, fee submission, and collect official admission acknowledgement receipts.",
                  "If opting for an upgrade in subsequent rounds, submit your willingness online/offline per active rules.",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-red-700 focus:ring-red-600 shrink-0 cursor-pointer" />
                    <span className="leading-normal">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600 mt-6">
              ⚠️ <strong>Authority Rule:</strong> The active official information bulletin released by MCC or your state counselling authority remains the final and binding legal authority.
            </div>
          </div>
        )}

        {/* 2. RESOURCE B: MEDICAL COLLEGE COMPARISON WORKSHEET / TOOL */}
        {activeTab === "college-comparison" && (
          <InteractiveCollegeComparator />
        )}

        {/* 3. RESOURCE C: COUNSELLING & ADMISSION DOCUMENTS CHECKLIST */}
        {activeTab === "documents" && (
          <div className="space-y-8 text-slate-800 text-sm">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Documents to Keep Ready</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 italic">
                Commonly required documents for verification during NEET counselling and college reporting:
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Category 1 */}
              <div className="rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3 bg-slate-50/40">
                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
                  NEET & Counselling Credentials
                </h4>
                <ul className="space-y-2 text-xs text-slate-700">
                  {[
                    "NEET UG Admit Card",
                    "NEET UG Scorecard / Official Rank Letter",
                    "Counselling Registration Form Confirmation Slip",
                    "Provisional Seat Allotment Letter",
                    "Fee Payment Receipts / Demand Drafts",
                  ].map((doc, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <input type="checkbox" className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-red-700 shrink-0 cursor-pointer" />
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Category 2 */}
              <div className="rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3 bg-slate-50/40">
                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
                  Academic Certificates
                </h4>
                <ul className="space-y-2 text-xs text-slate-700">
                  {[
                    "Class 10 Certificate & Marksheet (Date of Birth proof)",
                    "Class 12 Marksheet & Passing Certificate",
                    "School Leaving / Transfer Certificate (TC)",
                    "Migration Certificate (if switching boards/universities)",
                    "Character / Conduct Certificate from last school",
                  ].map((doc, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <input type="checkbox" className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-red-700 shrink-0 cursor-pointer" />
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Category 3 */}
              <div className="rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3 bg-slate-50/40">
                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
                  Identity & Personal Documentation
                </h4>
                <ul className="space-y-2 text-xs text-slate-700">
                  {[
                    "Government Photo ID (Aadhaar / Passport / Voter ID)",
                    "8–10 Passport-size photographs (matching NEET form)",
                    "Postcard-size photograph (if required by state)",
                    "Medical Fitness Certificate (as per prescribed format)",
                    "Anti-Ragging Undertaking / Affidavit (as required)",
                  ].map((doc, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <input type="checkbox" className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-red-700 shrink-0 cursor-pointer" />
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Category 4 */}
              <div className="rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3 bg-slate-50/40">
                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
                  Category & Domicile (Where Applicable)
                </h4>
                <ul className="space-y-2 text-xs text-slate-700">
                  {[
                    "State Domicile / Residence Proof Certificate",
                    "Category Certificate (SC / ST / OBC-NCL / EWS format)",
                    "Disability Certificate (PwD from designated center)",
                    "Service / Defence / Minority Quota documentation",
                    "Service Bond Undertaking / Non-Judicial Stamp Paper",
                  ].map((doc, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <input type="checkbox" className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-red-700 shrink-0 cursor-pointer" />
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-950">
              <p>
                <strong>Important:</strong> Document requirements vary by counselling authority, category, round and institution. Always use the current official counselling/reporting notice as your final checklist.
              </p>
            </div>
          </div>
        )}

        {/* 4. RESOURCE D: BEFORE YOUR FIRST DAY OF MBBS CHECKLIST */}
        {activeTab === "first-day" && (
          <div className="space-y-8 text-slate-800 text-sm">
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
              A structured checklist to help you transition smoothly from a NEET aspirant to a confident first-year medical student:
            </p>

            {/* 1. Admission Completed */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-900 text-white text-xs">1</span>
                <span>Admission & Reporting Formalities</span>
              </h3>
              <ul className="space-y-2 pl-2 text-xs sm:text-sm">
                {[
                  "Secure and scan digital copies of all submitted documents and official fee receipts.",
                  "Complete college identity card, library registration, and hostel room allotment formalities.",
                  "Note down orientation dates, white-coat ceremony schedule, and Foundation Course timing.",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 text-red-700 shrink-0 cursor-pointer" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 2. Know What You're Entering */}
            <div className="space-y-3 pt-2">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-900 text-white text-xs">2</span>
                <span>Academic Awareness & Mindset</span>
              </h3>
              <ul className="space-y-2 pl-2 text-xs sm:text-sm">
                {[
                  "Know the core first-year subjects: Anatomy, Physiology, and Biochemistry.",
                  "Understand that medical learning is concept-driven and patient-centered, unlike MCQ-speed preparation.",
                  "Familiarize yourself with the NMC Foundation Course and AETCOM (Attitude, Ethics & Communication).",
                  "Prepare mentally for cadaveric dissection, histology labs, and active bedside clinical postings.",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 text-red-700 shrink-0 cursor-pointer" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 3. Practical Preparation */}
            <div className="space-y-3 pt-2">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-900 text-white text-xs">3</span>
                <span>Hostel & Practical Essentials</span>
              </h3>
              <ul className="space-y-2 pl-2 text-xs sm:text-sm">
                {[
                  "Pack formal dress code attire, comfortable footwear for long ward rounds, and essential hostel supplies.",
                  "Obtain basic academic materials and standard dissection kits as advised by departmental faculty.",
                  "Set up safe digital backup folders (cloud/drive) for all medical college documents and lecture notes.",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 text-red-700 shrink-0 cursor-pointer" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 4. Begin Thinking Like a Medical Student */}
            <div className="space-y-3 pt-2">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-900 text-white text-xs">4</span>
                <span>Begin Thinking Like a Medical Student</span>
              </h3>
              <ul className="space-y-2 pl-2 text-xs sm:text-sm">
                {[
                  "Embrace professional conduct, punctuality, and mutual respect with faculty, peers, and hospital staff.",
                  "Build active empathy, compassion, and strict commitment to patient confidentiality.",
                  "Learn basic emergency lifesaving awareness (CPR & First Aid) early in your medical journey.",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 text-red-700 shrink-0 cursor-pointer" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Gentle Closing Note */}
            <div className="mt-8 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 p-6 text-white text-center">
              <p className="text-sm sm:text-base font-bold leading-relaxed">
                &ldquo;You spent years preparing to enter medical college. Now begin preparing for the journey within it.&rdquo;
              </p>
            </div>
          </div>
        )}

        {/* Printable Footer Stamp */}
        <div className="mt-10 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-mono">
          <span>NEET to MBBS 2026 | MBBS Foundation</span>
          <span>https://mbbsfoundation.com/neet-to-mbbs</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. SHARING SECTION: SHARE THE FREE TOOLKIT */}
      {/* ========================================================================= */}
      <section className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6 sm:p-8 text-center print:hidden">
        <div className="max-w-2xl mx-auto space-y-3">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-red-700 tracking-tight">
            Share the Toolkit
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Useful NEET-to-MBBS resources: counselling checklist, medical college comparison worksheet, documents checklist and a before-MBBS checklist.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                "Going through NEET counselling? This free toolkit has a 3-college comparison tool, counselling checklist, document checklist and MBBS preparation guide. Useful for students and parents before finalizing a medical college: https://mbbsfoundation.com/neet-to-mbbs/toolkit"
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition"
              aria-label="Share toolkit on WhatsApp"
            >
              <span>💬</span>
              <span>Share on WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-xs sm:text-sm font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            >
              <span>🔗</span>
              <span>{copied ? "✓ Toolkit Link Copied!" : "Copy Toolkit Link"}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. BOTTOM NAVIGATION BRIDGES */}
      {/* ========================================================================= */}
      <div className="pt-4 flex flex-wrap items-center justify-between gap-4 text-xs font-bold print:hidden">
        <Link
          href="/neet-to-mbbs"
          className="text-slate-600 hover:text-slate-900 transition underline underline-offset-2"
        >
          ← Return to NEET to MBBS Hub
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/neet-to-mbbs/counselling"
            className="text-red-700 hover:text-red-800 transition underline underline-offset-2"
          >
            Counselling Guide →
          </Link>
          <Link
            href="/neet-to-mbbs/choosing-a-medical-college"
            className="text-red-700 hover:text-red-800 transition underline underline-offset-2"
          >
            College Selection Guide →
          </Link>
        </div>
      </div>
    </div>
  );
}
