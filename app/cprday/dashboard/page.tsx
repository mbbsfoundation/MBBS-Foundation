"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  CPRDayEvent,
  getCPRDayEvent,
  removeCPRDayEvent,
} from "../../../lib/cprday/eventStorage";

const dashboardActions = [
  {
    title: "Create Venue Banner",
    description:
      "Generate a standard National IAP CPR Day banner using the host, venue, city, IAP Branch and coordinator details.",
    href: "/cprday/dashboard/banner",
    buttonText: "Create Banner",
    status: "Ready for development",
    symbol: "▣",
    style: "border-sky-200 bg-sky-50 text-sky-700",
  },
  {
    title: "Generate Team Badges",
    description:
      "Create badges for course coordinators, lead instructors, other instructors and CPR Champions.",
    href: "/cprday/dashboard/badges",
    buttonText: "Generate Badges",
    status: "Team details available",
    symbol: "◎",
    style: "border-indigo-200 bg-indigo-50 text-indigo-700",
  },
  {
    title: "Participant Registration",
    description:
      "Generate course QR codes, register participants individually and prepare assisted or bulk registration.",
    href: "/cprday/dashboard/participants",
    buttonText: "Manage Participants",
    status: "Not opened yet",
    symbol: "+",
    style:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  {
    title: "Attendance Confirmation",
    description:
      "Confirm attendance and supervised hands-on CPR participation for each registered participant.",
    href: "/cprday/dashboard/attendance",
    buttonText: "Confirm Attendance",
    status: "Available after training",
    symbol: "✓",
    style: "border-amber-200 bg-amber-50 text-amber-800",
  },
  {
    title: "Certificates",
    description:
      "Generate, download and email certificates for participants and course team members.",
    href: "/cprday/dashboard/certificates",
    buttonText: "Manage Certificates",
    status: "Attendance required",
    symbol: "★",
    style:
      "border-purple-200 bg-purple-50 text-purple-700",
  },
  {
    title: "Course and Venue Report",
    description:
      "Submit course-wise participant totals, photographs and the consolidated venue report.",
    href: "/cprday/dashboard/report",
    buttonText: "Submit Report",
    status: "Available after training",
    symbol: "≡",
    style: "border-rose-200 bg-rose-50 text-rose-700",
  },
];

export default function CPRDayDashboardPage() {
  const [event, setEvent] = useState<CPRDayEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setEvent(getCPRDayEvent());
    setIsLoading(false);
  }, []);

  const totalExpectedParticipants = useMemo(() => {
    if (!event) {
      return 0;
    }

    return event.courses.reduce(
      (total, course) =>
        total + Number(course.expectedParticipants || 0),
      0,
    );
  }, [event]);

  const totalTeamMembers = useMemo(() => {
    if (!event) {
      return 0;
    }

    return event.courses.reduce(
      (total, course) =>
        total +
        2 +
        course.otherInstructors.length +
        course.cprChampions.length,
      0,
    );
  }, [event]);

  function clearPreviewEvent() {
    const confirmed = window.confirm(
      "Remove the temporarily saved event from this browser?",
    );

    if (!confirmed) {
      return;
    }

    removeCPRDayEvent();
    setEvent(null);
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-900">
        <div className="text-center">
          <p className="text-lg font-bold">
            Loading CPR Day dashboard…
          </p>
        </div>
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
            Confirm a CPR Day event first
          </h1>

          <p className="mt-4 leading-7 text-slate-600">
            No event information is currently saved in this
            browser. Complete the venue-and-course confirmation
            form to create your dashboard.
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
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Dashboard header */}

      <section className="border-b border-sky-100 bg-gradient-to-br from-slate-950 via-sky-950 to-slate-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link
                href="/cprday"
                className="inline-flex items-center gap-2 text-sm font-semibold text-sky-300 transition hover:text-white"
              >
                <span aria-hidden="true">←</span>
                Back to CPR Day
              </Link>

              <p className="mt-8 text-sm font-bold uppercase tracking-[0.24em] text-sky-300">
                Coordinator Dashboard
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                {event.hostInstitution}
              </h1>

              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
                Manage venue publicity, course teams, participant
                registration, badges, certificates and final
                reporting.
              </p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur lg:min-w-80">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-300">
                CPR Day Venue ID
              </p>

              <p className="mt-2 break-words text-2xl font-black text-white">
                {event.venueId}
              </p>

              <div className="mt-4 flex items-center gap-2">
                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-200">
                  {event.status}
                </span>

                <span className="text-xs text-slate-400">
                  Temporary browser record
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-7xl space-y-9">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5">
            <p className="font-bold text-amber-950">
              Development-stage storage
            </p>

            <p className="mt-2 leading-7 text-amber-900/80">
              This event is currently stored only in this browser.
              It will be moved to the permanent database when
              authentication and backend storage are connected.
            </p>
          </div>

          {/* Venue summary */}

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-gradient-to-r from-sky-50 to-cyan-50 px-7 py-6 sm:px-9">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-700">
                    Venue Summary
                  </p>

                  <h2 className="mt-2 text-3xl font-black tracking-tight">
                    {event.venueName}
                  </h2>
                </div>

                <Link
                  href="/cprday/register"
                  className="rounded-xl border border-sky-300 bg-white px-5 py-3 text-center text-sm font-bold text-sky-800 transition hover:bg-sky-50"
                >
                  Edit Event Details
                </Link>
              </div>
            </div>

            <div className="grid gap-6 p-7 sm:grid-cols-2 lg:grid-cols-4 sm:p-9">
              <SummaryField
                label="Host Institution"
                value={event.hostInstitution}
              />

              <SummaryField
                label="Venue"
                value={event.venueName}
              />

              <SummaryField
                label="Location"
                value={`${event.city}, ${event.state} – ${event.venuePinCode}`}
              />

              <SummaryField
                label="IAP Zone"
                value={event.zone}
              />

              <SummaryField
                label="IAP Branch"
                value={event.iapBranchName || "Not involved"}
              />

              <SummaryField
                label="Courses Planned"
                value={`${event.courses.length} ${
                  event.courses.length === 1
                    ? "course"
                    : "courses"
                }`}
              />

              <SummaryField
                label="Expected Participants"
                value={totalExpectedParticipants.toLocaleString(
                  "en-IN",
                )}
              />

              <SummaryField
                label="Campaign Date"
                value="21 July 2026"
              />

              <SummaryField
                label="Adult Manikins Available"
                value={String(event.availableAdultManikins)}
              />

              <SummaryField
                label="Infant Manikins Available"
                value={String(event.availableInfantManikins)}
              />

              <SummaryField
                label="CPR Instructors Available"
                value={String(event.availableInstructors)}
              />

              <SummaryField
                label="CPR Champions Available"
                value={String(event.availableChampions)}
              />
            </div>
          </section>

          {/* Status cards */}

          <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatusCard
              label="Courses"
              value={String(event.courses.length)}
              note="Courses planned"
            />

            <StatusCard
              label="Expected Participants"
              value={totalExpectedParticipants.toLocaleString(
                "en-IN",
              )}
              note="Across all courses"
            />

            <StatusCard
              label="Course Team"
              value={String(totalTeamMembers)}
              note="Named team positions"
            />

            <StatusCard
              label="Certificates"
              value="0"
              note="Generated"
            />
          </section>

          {/* Operational actions */}

          <section>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-700">
              Event Operations
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight">
              Manage the CPR Day workflow
            </h2>

            <p className="mt-3 max-w-3xl leading-7 text-slate-600">
              Complete the pre-event, training-day and post-event
              activities from this dashboard.
            </p>

            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {dashboardActions.map((action) => (
                <article
                  key={action.title}
                  className="flex flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl border text-xl font-black ${action.style}`}
                  >
                    {action.symbol}
                  </div>

                  <h3 className="mt-5 text-2xl font-black">
                    {action.title}
                  </h3>

                  <p className="mt-3 flex-1 leading-7 text-slate-600">
                    {action.description}
                  </p>

                  <div className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                    {action.status}
                  </div>

                  <Link
                    href={action.href}
                    className="mt-5 rounded-xl bg-slate-950 px-6 py-3.5 text-center font-bold text-white transition hover:bg-sky-700"
                  >
                    {action.buttonText}
                  </Link>
                </article>
              ))}
            </div>
          </section>

          {/* Course records */}

          <section>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-700">
                  Course Records
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-tight">
                  Courses at this venue
                </h2>
              </div>

              <Link
                href="/cprday/register"
                className="rounded-xl bg-sky-600 px-6 py-3.5 text-center font-bold text-white shadow-lg transition hover:bg-sky-500"
              >
                Edit Courses
              </Link>
            </div>

            <div className="mt-8 space-y-6">
              {event.courses.map((course, courseIndex) => {
                const categories = [
                  ...course.participantCategories.filter(
                    (category) => category !== "Other",
                  ),
                  ...(course.participantCategories.includes(
                    "Other",
                  ) && course.otherParticipantCategory
                    ? [course.otherParticipantCategory]
                    : []),
                ];

                return (
                  <article
                    key={course.id}
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="flex flex-col gap-4 bg-slate-950 px-7 py-6 text-white sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-300">
                          Course {courseIndex + 1}
                        </p>

                        <h3 className="mt-2 text-2xl font-black">
                          {course.courseCode ||
                            "Official course code pending"}
                        </h3>
                      </div>

                      <span className="inline-flex w-fit rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-200">
                        Confirmed
                      </span>
                    </div>

                    <div className="grid gap-6 p-7 sm:grid-cols-2 lg:grid-cols-4 sm:p-9">
                      <SummaryField
                        label="Registration Status"
                        value={
                          course.registeredOnIapWebsite === "Yes"
                            ? "Registered on iapalsbls.com"
                            : "Registration pending"
                        }
                      />

                      <SummaryField
                        label="Course Time"
                        value={`${formatTime(
                          course.startTime,
                        )} – ${formatTime(course.endTime)}`}
                      />

                      <SummaryField
                        label="Participant Categories"
                        value={
                          categories.join(", ") ||
                          "Not specified"
                        }
                      />

                      <SummaryField
                        label="Expected Participants"
                        value={String(
                          course.expectedParticipants,
                        )}
                      />

                      <SummaryField
                        label="Course Coordinator"
                        value={course.coordinator.name}
                      />

                      <SummaryField
                        label="Lead Instructor"
                        value={course.leadInstructor.name}
                      />

                      <SummaryField
                        label="Other Instructors"
                        value={String(
                          course.otherInstructors.length,
                        )}
                      />

                      <SummaryField
                        label="CPR Champions"
                        value={String(
                          course.cprChampions.length,
                        )}
                      />

                      <SummaryField
                        label="Manikins Allocated"
                        value={`${course.adultManikins} adult, ${course.infantManikins} infant`}
                      />
                    </div>

                    <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-7 py-5 sm:flex-row sm:flex-wrap sm:px-9">
                      <Link
                        href="/cprday/register"
                        className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                      >
                        Edit Course
                      </Link>

                      <Link
                        href="/cprday/dashboard/badges"
                        className="rounded-xl border border-indigo-300 bg-indigo-50 px-5 py-3 text-center text-sm font-bold text-indigo-800 transition hover:bg-indigo-100"
                      >
                        Generate Team Badges
                      </Link>

                      <Link
  href={`/cprday/participant/register/${event.venueId}/${course.id}`}
  className="rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-3 text-center text-sm font-bold text-emerald-800 transition hover:bg-emerald-100"
>
  Open Public Registration Page
</Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Temporary reset */}

          <section className="rounded-3xl border border-red-200 bg-red-50 p-7 sm:p-9">
            <h2 className="text-xl font-black text-red-950">
              Development reset
            </h2>

            <p className="mt-3 leading-7 text-red-900/80">
              Use this only while testing. It removes the
              temporarily saved event from this browser.
            </p>

            <button
              type="button"
              onClick={clearPreviewEvent}
              className="mt-5 rounded-xl border border-red-300 bg-white px-6 py-3 font-bold text-red-800 transition hover:bg-red-100"
            >
              Remove Temporary Event
            </button>
          </section>
        </div>
      </section>
    </main>
  );
}

function formatTime(value: string): string {
  if (!value) {
    return "Not specified";
  }

  const [hourString, minuteString] = value.split(":");
  const hour = Number(hourString);
  const minute = Number(minuteString);

  const date = new Date();
  date.setHours(hour, minute, 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

type SummaryFieldProps = {
  label: string;
  value: string;
};

function SummaryField({
  label,
  value,
}: SummaryFieldProps) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 font-bold leading-6 text-slate-900">
        {value}
      </p>
    </div>
  );
}

type StatusCardProps = {
  label: string;
  value: string;
  note: string;
};

function StatusCard({
  label,
  value,
  note,
}: StatusCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-4xl font-black text-sky-700">
        {value}
      </p>

      <p className="mt-2 text-sm text-slate-600">
        {note}
      </p>
    </div>
  );
}