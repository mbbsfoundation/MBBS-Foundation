"use client";

import React, { useState } from "react";
import Link from "next/link";
import { trackNeetEvent } from "@/lib/analytics";
import {
  MCC_ROUND_2_DATA,
  type MccRound2Dataset,
} from "@/lib/counselling/mccRound2Data";

interface MccRound2DecisionCentreProps {
  dataset?: MccRound2Dataset;
}

export default function MccRound2DecisionCentre({
  dataset = MCC_ROUND_2_DATA,
}: MccRound2DecisionCentreProps) {
  const {
    metadata,
    notices,
    schedule,
    newlyAddedSeats,
    clearVacancies,
    virtualVacancies,
    decisionPathways,
  } = dataset;

  const [showNewlyAddedList, setShowNewlyAddedList] = useState(false);

  const handleCtaClick = (eventName: string, href: string) => {
    trackNeetEvent(eventName, { destination: href });
  };

  return (
    <div className="w-full space-y-10 sm:space-y-14 pb-20">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================================= */}
      <section
        aria-labelledby="r2-hero-title"
        className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white via-slate-50/50 to-slate-100/60 p-6 sm:p-8 lg:p-10 shadow-xs"
      >
        <div className="max-w-4xl space-y-4">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-blue-900">
            <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span>NEET UG 2026 • MCC Counselling</span>
          </div>

          {/* Heading */}
          <h1
            id="r2-hero-title"
            className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 leading-[1.15]"
          >
            MCC Round 2 Decision Centre
          </h1>

          {/* Supporting Philosophy Quote */}
          <p className="text-base sm:text-lg text-slate-700 font-medium leading-relaxed max-w-3xl">
            &ldquo;Round 2 is not only about finding a vacant seat. It is about deciding whether that seat is the right choice for you.&rdquo;
          </p>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
            Official MCC Round 2 vacancy datasets, newly added seats, and circulars verified from official releases. Use tailored decision pathways to choose the right exploration or comparison tool.
          </p>

          {/* Official Source & Live Data Status Strip */}
          <div className="mt-6 pt-5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="font-bold text-slate-900">Official Source:</span>
                <a
                  href={metadata.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:text-blue-900 underline underline-offset-2 font-semibold"
                >
                  {metadata.sourceName} ↗
                </a>
              </div>

              <span className="hidden sm:inline text-slate-300">•</span>

              <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-emerald-950 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                <span>{metadata.statusMessage}</span>
              </div>
            </div>

            {metadata.lastUpdated && (
              <span className="text-slate-500 font-mono text-[11px]">
                Official data checked: {metadata.lastUpdated}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. WHAT DO YOU NEED TO DO? (3 Decision Pathways) */}
      {/* ========================================================================= */}
      <section aria-labelledby="r2-pathways-title" className="space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-700">
            <span>🧭</span>
            <span>Tailored Decision Pathways</span>
          </div>
          <h2
            id="r2-pathways-title"
            className="mt-1 text-xl sm:text-2xl font-black text-slate-900"
          >
            What do you need to do in Round 2?
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Select your current situation to follow the recommended evaluation roadmap.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {decisionPathways.map((pathway) => (
            <div
              key={pathway.id}
              className="group relative flex flex-col justify-between rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-xs hover:border-slate-400 hover:shadow-md transition-all duration-200"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-slate-100 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-slate-700">
                    {pathway.tag}
                  </span>
                </div>

                <h3 className="text-lg font-black text-slate-900 leading-snug group-hover:text-blue-900 transition">
                  {pathway.heading}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {pathway.summary}
                </p>

                {/* Key Guidance Bullets */}
                <ul className="pt-2 space-y-2 text-xs text-slate-700">
                  {pathway.guidancePoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold mt-0.5">•</span>
                      <span className="leading-normal">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pathway CTAs */}
              <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                <Link
                  href={pathway.primaryCta.href}
                  onClick={() =>
                    handleCtaClick(
                      pathway.primaryCta.analyticsEvent,
                      pathway.primaryCta.href
                    )
                  }
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
                >
                  <span>{pathway.primaryCta.label}</span>
                  <span>→</span>
                </Link>

                {pathway.secondaryCta && (
                  <Link
                    href={pathway.secondaryCta.href}
                    onClick={() =>
                      handleCtaClick(
                        pathway.secondaryCta!.analyticsEvent,
                        pathway.secondaryCta!.href
                      )
                    }
                    className="w-full inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                  >
                    <span>{pathway.secondaryCta.label}</span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. OFFICIAL ROUND 2 INFORMATION (Verified Official Data Cards) */}
      {/* ========================================================================= */}
      <section aria-labelledby="r2-official-info-title" className="space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">
            <span>🏛️</span>
            <span>Verified Official Datasets</span>
          </div>
          <h2
            id="r2-official-info-title"
            className="mt-1 text-xl sm:text-2xl font-black text-slate-900"
          >
            Official Round 2 Seat &amp; Vacancy Information
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Authoritative data normalized from official MCC releases. Seat counts for MBBS are calculated strictly from MBBS rows and segregated from BDS and B.Sc Nursing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: Important Notices */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xl">📢</span>
                <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-900">
                  Official Circulars
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Important MCC Notices
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Official releases and circulars for NEET-UG Round 2 counselling.
              </p>
              <div className="pt-2 border-t border-slate-100 space-y-3">
                {notices.map((n) => (
                  <div key={n.id} className="text-xs space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-slate-800">{n.title}</span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-bold text-slate-600 uppercase">
                        {n.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 leading-relaxed">
                      {n.shortDescription}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <a
              href="https://mcc.nic.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 pt-2 border-t border-slate-100"
            >
              <span>View Notices on MCC Portal</span>
              <span>↗</span>
            </a>
          </div>

          {/* Card 2: Round 2 Schedule */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xl">📅</span>
                <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-900">
                  Timeline
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Round 2 Schedule
              </h3>
              <div className="pt-1 space-y-2.5">
                {schedule.map((item) => (
                  <div
                    key={item.id}
                    className="border-b border-slate-100 pb-2 last:border-0 last:pb-0"
                  >
                    <div className="flex items-start justify-between gap-2 text-xs">
                      <span className="font-medium text-slate-800">{item.label}</span>
                      <span
                        className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          item.status === "ACTIVE"
                            ? "bg-blue-100 text-blue-900"
                            : item.status === "CONCLUDED"
                            ? "bg-slate-100 text-slate-700"
                            : "bg-amber-50 text-amber-900"
                        }`}
                      >
                        {item.dateDisplay}
                      </span>
                    </div>
                    {item.note && (
                      <p className="text-[10px] text-slate-500 mt-0.5">{item.note}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              Source: MCC Official Counselling Schedule
            </div>
          </div>

          {/* Card 3: Newly Added Seats */}
          <div className="rounded-3xl border-2 border-blue-200 bg-gradient-to-b from-blue-50/40 via-white to-white p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xl">✨</span>
                <span className="rounded-md bg-blue-100 border border-blue-300 px-2 py-0.5 text-[10px] font-black uppercase text-blue-950">
                  ✓ Verified Official Release
                </span>
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900">
                  Newly Added Seats
                </h3>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-blue-900">
                    {newlyAddedSeats.mbbsSeats.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs font-bold text-slate-600">
                    MBBS seats added
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Across <strong>{newlyAddedSeats.mbbsInstitutionsCount} medical colleges</strong> in {newlyAddedSeats.mbbsStatesCount} states/UTs.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-[11px] text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800">
                  Total Document Count: {newlyAddedSeats.totalDocumentSeats} seats
                </div>
                <div>
                  • MBBS: <strong>{newlyAddedSeats.mbbsSeats} seats</strong> (8 colleges)
                </div>
                <div>
                  • BDS: <strong>{newlyAddedSeats.bdsSeats} seats</strong> (3 dental colleges)
                </div>
                <div>
                  • B.Sc Nursing: <strong>{newlyAddedSeats.bscNursingSeats} seats</strong> (2 colleges)
                </div>
              </div>

              {/* Key Institutions Toggle */}
              {newlyAddedSeats.keyInstitutions && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowNewlyAddedList(!showNewlyAddedList)}
                    className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
                  >
                    <span>
                      {showNewlyAddedList
                        ? "Hide 8 Medical Colleges"
                        : "View All 8 MBBS Medical Colleges"}
                    </span>
                    <span>{showNewlyAddedList ? "▲" : "▼"}</span>
                  </button>

                  {showNewlyAddedList && (
                    <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1 text-[11px] border-t border-slate-200 pt-2">
                      {newlyAddedSeats.keyInstitutions.map((c) => (
                        <div
                          key={c.code}
                          className="rounded-lg bg-white border border-slate-200 p-2 space-y-0.5"
                        >
                          <div className="font-bold text-slate-900 flex justify-between">
                            <span>{c.name}</span>
                            <span className="text-blue-900 font-extrabold shrink-0">
                              {c.mbbsSeats} seats
                            </span>
                          </div>
                          <div className="text-slate-500 flex justify-between text-[10px]">
                            <span>{c.state}</span>
                            <span>{c.quota}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex justify-between items-center">
              <span>Source: MCC Newly Added Matrix</span>
              <a
                href="https://mcc.nic.in"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-blue-700 hover:underline"
              >
                Verify ↗
              </a>
            </div>
          </div>

          {/* Card 4: Clear Vacancies */}
          <div className="rounded-3xl border-2 border-emerald-200 bg-gradient-to-b from-emerald-50/40 via-white to-white p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xl">🟢</span>
                <span className="rounded-md bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-950">
                  ✓ Verified Official Release
                </span>
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900">
                  Clear Vacancies
                </h3>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-900">
                    {clearVacancies.mbbsSeats.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs font-bold text-slate-600">
                    MBBS clear vacancies
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Across <strong>{clearVacancies.mbbsInstitutionsCount} medical colleges</strong> in {clearVacancies.mbbsStatesCount} states/UTs.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-[11px] text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800">
                  MBBS Quota Breakdown:
                </div>
                <div>
                  • AIQ Government: <strong>{clearVacancies.aiqGovtMbbsSeats?.toLocaleString("en-IN")} seats</strong>
                </div>
                <div>
                  • Deemed Universities: <strong>{clearVacancies.deemedMbbsSeats?.toLocaleString("en-IN")} seats</strong>
                </div>
                <div>
                  • AIIMS Institutions: <strong>{clearVacancies.aiimsMbbsSeats?.toLocaleString("en-IN")} seats</strong>
                </div>
                <div>
                  • Central / INI / ESI: <strong>{clearVacancies.centralIniMbbsSeats?.toLocaleString("en-IN")} seats</strong>
                </div>
                <div className="pt-1 border-t border-slate-200 text-[10px] text-slate-500">
                  Total document: {clearVacancies.totalDocumentSeats.toLocaleString("en-IN")} seats (includes {clearVacancies.bdsSeats} BDS, {clearVacancies.bscNursingSeats} Nursing).
                </div>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                These seats were unallotted in Round 1 or vacated via Free Exit. They are definitively open for fresh allotment.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex justify-between items-center">
              <span>Source: MCC Clear Vacancy List</span>
              <a
                href="https://mcc.nic.in"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-emerald-800 hover:underline"
              >
                Verify ↗
              </a>
            </div>
          </div>

          {/* Card 5: Virtual Vacancies */}
          <div className="rounded-3xl border-2 border-amber-200 bg-gradient-to-b from-amber-50/40 via-white to-white p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4 md:col-span-2 lg:col-span-1">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xl">🔄</span>
                <span className="rounded-md bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-black uppercase text-amber-950">
                  ✓ Verified Official Release
                </span>
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900">
                  Virtual Vacancies
                </h3>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-amber-900">
                    {virtualVacancies.mbbsSeats.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs font-bold text-slate-600">
                    MBBS virtual vacancies
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Across <strong>{virtualVacancies.mbbsInstitutionsCount} medical colleges</strong> in {virtualVacancies.mbbsStatesCount} states/UTs.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-[11px] text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800">
                  MBBS Quota Breakdown:
                </div>
                <div>
                  • AIQ Government: <strong>{virtualVacancies.aiqGovtMbbsSeats?.toLocaleString("en-IN")} seats</strong>
                </div>
                <div>
                  • Deemed Universities: <strong>{virtualVacancies.deemedMbbsSeats?.toLocaleString("en-IN")} seats</strong>
                </div>
                <div>
                  • AIIMS Institutions: <strong>{virtualVacancies.aiimsMbbsSeats?.toLocaleString("en-IN")} seats</strong>
                </div>
                <div>
                  • Central / INI / ESI: <strong>{virtualVacancies.centralIniMbbsSeats?.toLocaleString("en-IN")} seats</strong>
                </div>
                <div className="pt-1 border-t border-slate-200 text-[10px] text-slate-500">
                  Total document: {virtualVacancies.totalDocumentSeats.toLocaleString("en-IN")} seats (includes {virtualVacancies.bdsSeats} BDS, {virtualVacancies.bscNursingSeats} Nursing).
                </div>
              </div>

              <div className="rounded-lg bg-amber-50 border border-amber-300/80 p-2 text-[11px] text-amber-950 font-medium leading-relaxed">
                ⚠️ <strong>Important:</strong> These seats become available ONLY if the admitted candidate receives an upgrade in Round 2.
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex justify-between items-center">
              <span>Source: MCC Virtual Vacancy List</span>
              <a
                href="https://mcc.nic.in"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-amber-900 hover:underline"
              >
                Verify ↗
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. UNDERSTAND THE INFORMATION (Educational Definitions) */}
      {/* ========================================================================= */}
      <section
        aria-labelledby="r2-explainer-title"
        className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6 sm:p-8 space-y-6"
      >
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
            <span>💡</span>
            <span>Clarity First</span>
          </div>
          <h2
            id="r2-explainer-title"
            className="mt-1 text-xl sm:text-2xl font-black text-slate-900"
          >
            Understanding Round 2 Vacancy Types
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Counselling terminology can be confusing. Here is what each category means in practice.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Newly Added */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2.5 shadow-2xs">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span>✨ Newly Added Seats</span>
            </h3>
            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong className="text-slate-800">What it is: </strong>
                {newlyAddedSeats.practicalMeaning}
              </p>
              <p className="rounded-xl bg-amber-50/70 border border-amber-200/80 p-2.5 text-amber-950">
                <strong className="font-bold">Caution: </strong>
                {newlyAddedSeats.cautionaryAdvisory}
              </p>
            </div>
          </div>

          {/* Clear Vacancies */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2.5 shadow-2xs">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span>🟢 Clear Vacancies</span>
            </h3>
            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong className="text-slate-800">What it is: </strong>
                {clearVacancies.practicalMeaning}
              </p>
              <p className="rounded-xl bg-amber-50/70 border border-amber-200/80 p-2.5 text-amber-950">
                <strong className="font-bold">Caution: </strong>
                {clearVacancies.cautionaryAdvisory}
              </p>
            </div>
          </div>

          {/* Virtual Vacancies */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2.5 shadow-2xs">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span>🔄 Virtual Vacancies</span>
            </h3>
            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong className="text-slate-800">What it is: </strong>
                {virtualVacancies.practicalMeaning}
              </p>
              <p className="rounded-xl bg-amber-50/70 border border-amber-200/80 p-2.5 text-amber-950">
                <strong className="font-bold">Caution: </strong>
                {virtualVacancies.cautionaryAdvisory}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-3.5 text-xs text-slate-600 flex items-start gap-2.5">
          <span className="text-base shrink-0">ℹ️</span>
          <p className="leading-relaxed">
            <strong>Important Rule: </strong>
            Always verify category-specific and quota-specific seat matrices on the official MCC portal (mcc.nic.in) before finalizing and locking choices.
          </p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. TWO DIFFERENT TOOLS (Visual Distinction) */}
      {/* ========================================================================= */}
      <section aria-labelledby="r2-tools-title" className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">
            <span>🛠️</span>
            <span>Decision Support</span>
          </div>
          <h2
            id="r2-tools-title"
            className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900"
          >
            Use the right tool for your decision
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Choose the interactive tool suited for where you currently stand in your decision process.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Tool 1: Planner */}
          <div className="rounded-3xl border-2 border-blue-200 bg-gradient-to-b from-blue-50/50 via-white to-white p-6 sm:p-7 flex flex-col justify-between space-y-4 shadow-xs hover:border-blue-400 hover:shadow-md transition">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl">🎯</span>
                <span className="rounded-full bg-blue-100 text-blue-900 border border-blue-300 px-3 py-0.5 text-[10px] font-black uppercase">
                  Explore Options
                </span>
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  NEET Counselling Planner
                </h3>
                <div className="text-xs font-bold text-blue-700 mt-0.5">
                  &ldquo;Where might I have options?&rdquo;
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Enter your AIR, category, domicile state, and eligibility to explore medical colleges around your rank using official Round-1 allotment evidence.
              </p>

              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5 text-[11px] text-slate-500">
                Uses factual counselling evidence to support exploration; does not guarantee allotment.
              </div>
            </div>

            <Link
              href="/neet-to-mbbs/counselling/round-2-planner"
              onClick={() =>
                handleCtaClick(
                  "r2_tools_planner_click",
                  "/neet-to-mbbs/counselling/round-2-planner"
                )
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-900 px-5 py-3 text-xs font-bold text-white shadow-xs hover:bg-blue-800 transition"
            >
              <span>Open NEET Counselling Planner</span>
              <span>→</span>
            </Link>
          </div>

          {/* Tool 2: 3-College Comparator */}
          <div className="rounded-3xl border-2 border-emerald-200 bg-gradient-to-b from-emerald-50/50 via-white to-white p-6 sm:p-7 flex flex-col justify-between space-y-4 shadow-xs hover:border-emerald-400 hover:shadow-md transition">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl">⚖️</span>
                <span className="rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-0.5 text-[10px] font-black uppercase">
                  Compare Choices
                </span>
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  3-College Comparison Tool
                </h3>
                <div className="text-xs font-bold text-emerald-700 mt-0.5">
                  &ldquo;Which option suits me better?&rdquo;
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Already holding a seat or deciding between finalists? Compare up to three colleges across clinical patient load, rural bonds, 5.5-year real costs, and hostel fit.
              </p>

              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5 text-[11px] text-slate-500">
                Interactive decision matrix with printable single-page A4 PDF report export.
              </div>
            </div>

            <Link
              href="/neet-to-mbbs/toolkit#college-comparison"
              onClick={() =>
                handleCtaClick(
                  "r2_tools_comparator_click",
                  "/neet-to-mbbs/toolkit#college-comparison"
                )
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 py-3 text-xs font-bold text-white shadow-xs hover:bg-emerald-900 transition"
            >
              <span>Compare 3 Colleges</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. PARENTS CALLOUT */}
      {/* ========================================================================= */}
      <section aria-labelledby="r2-parents-title">
        <div className="rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50/80 via-white to-slate-50 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-md bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900">
              For Parents &amp; Guardians
            </div>
            <h2
              id="r2-parents-title"
              className="text-lg sm:text-xl font-black text-slate-900"
            >
              Parents: A seat is only one part of the decision
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Evaluating an MBBS admission involves multiple dimensions beyond rank: budgeting the true 5.5-year cost, understanding mandatory rural service bond penalties, checking hospital bed occupancy, and ensuring the college environment fits your child.
            </p>
          </div>

          <Link
            href="/neet-to-mbbs/parents"
            onClick={() =>
              handleCtaClick("r2_parents_guide_click", "/neet-to-mbbs/parents")
            }
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition shrink-0"
          >
            <span>Parents&rsquo; Guide to Choosing MBBS →</span>
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. AFTER THE DECISION (Transition to MBBS Readiness) */}
      {/* ========================================================================= */}
      <section
        aria-labelledby="r2-transition-title"
        className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 lg:p-10 space-y-6 shadow-xs"
      >
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-700">
            <span>🩺</span>
            <span>Beyond Counselling</span>
          </div>
          <h2
            id="r2-transition-title"
            className="text-xl sm:text-2xl font-black text-slate-900"
          >
            Once your MBBS seat is finalised, the next journey begins
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
            From the Dissection Hall to Foundation Course orientation, prepare for medical college before your first day of classes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/neet-to-mbbs/after-admission"
            onClick={() =>
              handleCtaClick(
                "r2_after_admission_click",
                "/neet-to-mbbs/after-admission"
              )
            }
            className="group rounded-2xl border border-slate-200 bg-slate-50/60 p-5 hover:border-slate-400 hover:bg-white transition flex flex-col justify-between space-y-3"
          >
            <div>
              <span className="text-xl">📚</span>
              <h3 className="text-sm font-bold text-slate-900 mt-2 group-hover:text-red-700 transition">
                What Happens After Admission?
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                First-year subjects (Anatomy, Physiology, Biochemistry), the NMC Foundation Course, AETCOM ethics, and stethoscope selection.
              </p>
            </div>
            <span className="text-xs font-bold text-red-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              <span>Read MBBS Preparation Guide</span>
              <span>→</span>
            </span>
          </Link>

          <Link
            href="/neet-to-mbbs/readiness-quiz"
            onClick={() =>
              handleCtaClick(
                "r2_readiness_quiz_click",
                "/neet-to-mbbs/readiness-quiz"
              )
            }
            className="group rounded-2xl border border-slate-900 bg-slate-950 p-5 text-white hover:bg-slate-900 transition flex flex-col justify-between space-y-3"
          >
            <div>
              <span className="text-xl">🎯</span>
              <h3 className="text-sm font-bold text-white mt-2">
                Take the Future Doctor Challenge
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Test your knowledge of medical realities, clinical ethics, patient consent, and lifesaving CPR awareness in 10 quick questions.
              </p>
            </div>
            <span className="text-xs font-bold text-white group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              <span>Start 4-Minute Challenge</span>
              <span>→</span>
            </span>
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. DISCLAIMER */}
      {/* ========================================================================= */}
      <section
        aria-label="Regulatory Disclaimer"
        className="rounded-2xl bg-slate-100/70 border border-slate-200 p-4 sm:p-5 text-xs text-slate-600 space-y-2"
      >
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <span>⚖️</span>
          <span>Independent Educational Initiative Disclaimer</span>
        </div>
        <p className="leading-relaxed">
          MBBS Foundation is an independent educational and decision-support initiative created by Ayurvigyan Foundation. It is not affiliated with, endorsed by, or representing the Medical Counselling Committee (MCC), the National Medical Commission (NMC), or any government counselling authority.
        </p>
        <p className="leading-relaxed text-slate-500">
          Counselling schedules, seat matrices, vacancy numbers, eligibility rules, and allotment criteria are determined solely by MCC and respective state authorities. Candidates must independently verify all information on official portals (mcc.nic.in, nmc.org.in, and state admission websites) before taking any counselling decision or locking choices.
        </p>
      </section>
    </div>
  );
}
