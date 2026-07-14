"use client";

import Link from "next/link";
import { toPng } from "html-to-image";
import { useEffect, useState } from "react";

import {
  CPRDayEvent,
  getCPRDayEvent,
} from "../../../../lib/cprday/eventStorage";

export default function VenueBannerPage() {
  const [event, setEvent] = useState<CPRDayEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadMessage, setDownloadMessage] = useState("");

  useEffect(() => {
    setEvent(getCPRDayEvent());
    setIsLoading(false);
  }, []);


  async function downloadBanner() {
    const bannerElement = document.getElementById(
      "venue-banner-preview",
    );

    if (!bannerElement || !event) {
      setDownloadMessage("The banner preview could not be found.");
      return;
    }

    try {
      setDownloadMessage("Preparing the banner…");

      const imageData = await toPng(bannerElement, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      const downloadLink = document.createElement("a");

      const safeVenueName = event.venueName
        .trim()
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();

      downloadLink.download = `national-iap-cpr-day-2026-${safeVenueName}-banner.png`;
      downloadLink.href = imageData;
      downloadLink.click();

      setDownloadMessage("Banner downloaded successfully.");
    } catch (error) {
      console.error(error);

      setDownloadMessage(
        "The banner could not be downloaded. Please try again.",
      );
    }
  }

  function printBanner() {
    window.print();
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <p className="font-bold text-slate-700">
          Loading venue details…
        </p>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-900">
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl sm:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-700">
            No Event Found
          </p>

          <h1 className="mt-4 text-3xl font-black">
            Confirm an event before creating a banner
          </h1>

          <p className="mt-4 leading-7 text-slate-600">
            The banner is generated from venue and coordinator details saved
            through the event-confirmation form.
          </p>

          <Link
            href="/cprday/register"
            className="mt-7 inline-flex rounded-xl bg-sky-600 px-7 py-4 font-bold text-white transition hover:bg-sky-500"
          >
            Confirm Venue and Courses
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      {/* Header */}

      <section className="print:hidden border-b border-sky-100 bg-gradient-to-br from-slate-950 via-sky-950 to-slate-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/cprday/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-sky-300 transition hover:text-white"
          >
            <span aria-hidden="true">←</span>
            Back to Dashboard
          </Link>

          <div className="mt-8 max-w-4xl">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-sky-300">
              Event Publicity
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              Create Venue Banner
            </h1>

            <p className="mt-5 text-lg leading-8 text-slate-300">
              Generate the official National IAP CPR Day banner using the saved
              venue, host institution, IAP Branch and coordinator information.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-12 print:px-0 print:py-0">
        <div className="mx-auto max-w-7xl">
          {/* Controls */}

          <section className="print:hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-700">
                  Banner Preview
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-tight">
                  Review the generated venue details
                </h2>

                <p className="mt-3 max-w-3xl leading-7 text-slate-600">
                  The official template remains unchanged. The venue and
                  coordinator information is automatically placed in the blank
                  section of the banner.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/cprday/register"
                  className="rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-center font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Edit Event Details
                </Link>

                <button
                  type="button"
                  onClick={printBanner}
                  className="rounded-xl border border-sky-300 bg-sky-50 px-6 py-3.5 font-bold text-sky-800 transition hover:bg-sky-100"
                >
                  Print Banner
                </button>

                <button
                  type="button"
                  onClick={downloadBanner}
                  className="rounded-xl bg-sky-700 px-6 py-3.5 font-bold text-white shadow-lg transition hover:bg-sky-600"
                >
                  Download PNG
                </button>
              </div>
            </div>

            {downloadMessage && (
              <div
                role="status"
                className="mt-6 rounded-xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm font-semibold text-sky-900"
              >
                {downloadMessage}
              </div>
            )}
          </section>

          {/* Official banner template */}

          <section className="mt-10 print:mt-0">
            <div
              id="venue-banner-preview"
              className="relative mx-auto aspect-[1024/1448] w-full max-w-[760px] overflow-hidden bg-white shadow-2xl print:max-w-none print:shadow-none"
            >
              <img
                src="/cprday/cprday-banner-template.jpg"
                alt="National IAP CPR Day 2026 banner template"
                className="absolute inset-0 h-full w-full object-fill"
              />

              {/* Dynamic venue information */}

              <div className="absolute left-[8%] right-[8%] top-[74.5%] flex h-[11.5%] flex-col items-center justify-center px-[3%] text-center">
                <p className="max-w-full text-[clamp(15px,2.25vw,32px)] font-black uppercase leading-tight text-[#1f195f]">
                  {event.hostInstitution}
                </p>

                <p className="mt-[1.2%] max-w-full text-[clamp(13px,1.8vw,25px)] font-bold leading-tight text-[#c52b17]">
                  {event.venueName}
                </p>

                <p className="mt-[1.1%] text-[clamp(11px,1.45vw,20px)] font-semibold leading-tight text-slate-800">
                  {event.city}, {event.state} – {event.venuePinCode}
                </p>

                {event.iapBranchName && (
                  <p className="mt-[1%] text-[clamp(10px,1.3vw,18px)] font-bold leading-tight text-[#1f195f]">
                    In association with {event.iapBranchName}
                  </p>
                )}

              </div>

              {/* Small Venue ID */}

              <div className="absolute left-[8%] right-[8%] top-[87.2%] text-center">
                <p className="text-[clamp(7px,0.85vw,12px)] font-bold uppercase tracking-[0.1em] text-slate-500">
                  CPR Day Venue ID: {event.venueId}
                </p>
              </div>
            </div>
          </section>

          {/* Information summary */}

          <section className="print:hidden mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              label="Host Institution"
              value={event.hostInstitution}
            />

            <SummaryCard
              label="Venue"
              value={event.venueName}
            />

            <SummaryCard
              label="IAP Branch"
              value={event.iapBranchName || "Not involved"}
            />

          </section>

          {/* Notes */}

          <section className="print:hidden mt-10 rounded-3xl border border-sky-200 bg-gradient-to-r from-sky-50 to-cyan-50 p-7 sm:p-9">
            <h2 className="text-2xl font-black">
              Template-based venue banner
            </h2>

            <p className="mt-4 leading-7 text-slate-700">
              The programme title, logos, national leadership details and
              campaign graphics remain fixed in the official template. Only the
              host institution, venue, location, associated IAP Branch, course
              coordinators and Venue ID are generated dynamically.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}

type SummaryCardProps = {
  label: string;
  value: string;
};

function SummaryCard({
  label,
  value,
}: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 font-bold leading-6 text-slate-900">
        {value}
      </p>
    </div>
  );
}