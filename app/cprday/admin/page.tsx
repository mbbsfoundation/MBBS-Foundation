"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AdministratorSetup = {
  fullName: string;
  designation: string;
  email: string;
  mobile: string;
  organisation: string;
  eventName: string;
  eventDate: string;
  supportEmail: string;
  supportMobile: string;
  registrationEnabled: boolean;
  approvalRequired: boolean;
};

type AdminModule = {
  title: string;
  description: string;
  href: string;
  icon: string;
  status: "Available" | "Coming next";
  count?: string;
};

const STORAGE_KEY = "cprday_administrator_setup_v1";

const initialSetup: AdministratorSetup = {
  fullName: "",
  designation: "Administrator",
  email: "",
  mobile: "",
  organisation: "Indian Academy of Pediatrics",
  eventName: "National IAP CPR Day 2026",
  eventDate: "2026-07-21",
  supportEmail: "",
  supportMobile: "",
  registrationEnabled: true,
  approvalRequired: true,
};

const adminModules: AdminModule[] = [
  {
    title: "Administrator Setup",
    description:
      "Configure the primary Administrator, event identity, registration controls and support details.",
    href: "/cprday/admin/setup",
    icon: "⚙️",
    status: "Available",
  },
  {
    title: "Role Approvals",
    description:
      "Review and approve National, State, Course Coordinator, Instructor and CPR Champion registrations.",
    href: "/cprday/admin/approvals",
    icon: "✓",
    status: "Coming next",
    count: "0 pending",
  },
  {
    title: "User Management",
    description:
      "View registered users, assigned roles, account status and access permissions.",
    href: "/cprday/admin/users",
    icon: "👥",
    status: "Coming next",
  },
  {
    title: "Courses and Venues",
    description:
      "Monitor all registered venues, courses, coordinators and course confirmation status.",
    href: "/cprday/admin/courses",
    icon: "📍",
    status: "Coming next",
  },
  {
    title: "Participants",
    description:
      "Search, review, correct and manage participant registrations and attendance records.",
    href: "/cprday/admin/participants",
    icon: "🪪",
    status: "Coming next",
  },
  {
    title: "Certificates",
    description:
      "Control participant certificates, team certificates, eligibility rules and regeneration.",
    href: "/cprday/admin/certificates",
    icon: "🏅",
    status: "Coming next",
  },
  {
    title: "Reports and Analytics",
    description:
      "Access national, state, venue, course, participant and attendance reports.",
    href: "/cprday/admin/reports",
    icon: "📊",
    status: "Coming next",
  },
  {
    title: "Platform Controls",
    description:
      "Manage registrations, deadlines, announcements, templates and platform-wide settings.",
    href: "/cprday/admin/controls",
    icon: "🛡️",
    status: "Coming next",
  },
];

export default function AdministratorConsolePage() {
  const [setup, setSetup] = useState<AdministratorSetup>(initialSetup);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedSetup = window.localStorage.getItem(STORAGE_KEY);

      if (savedSetup) {
        const parsedSetup = JSON.parse(
          savedSetup,
        ) as Partial<AdministratorSetup>;

        setSetup({
          ...initialSetup,
          ...parsedSetup,
        });
      }
    } catch (error) {
      console.error("Unable to load Administrator setup:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const setupCompletion = useMemo(() => {
    const requiredFields = [
      setup.fullName,
      setup.designation,
      setup.email,
      setup.mobile,
      setup.organisation,
      setup.eventName,
      setup.eventDate,
    ];

    const completedFields = requiredFields.filter(
      (field) => field.trim().length > 0,
    ).length;

    return Math.round((completedFields / requiredFields.length) * 100);
  }, [setup]);

  const formattedEventDate = useMemo(() => {
    if (!setup.eventDate) {
      return "Date not configured";
    }

    const date = new Date(`${setup.eventDate}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return setup.eventDate;
    }

    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }, [setup.eventDate]);

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6">
          <p className="text-sm font-semibold text-slate-500">
            Loading Administrator Console...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-red-700">
                  CPR Day Administration
                </span>

                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                  Administrator access
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Administrator Console
              </h1>

              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                Central control panel for the National IAP CPR Day 2026
                platform.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/cprday"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                View CPR Day page
              </Link>

              <Link
                href="/cprday/admin/setup"
                className="inline-flex items-center justify-center rounded-xl bg-red-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-100"
              >
                Open Administrator setup
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-10">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStat
            label="Registered courses"
            value="0"
            detail="Courses created nationally"
            tone="red"
          />

          <DashboardStat
            label="Participants"
            value="0"
            detail="Individual and bulk registrations"
            tone="blue"
          />

          <DashboardStat
            label="Pending approvals"
            value="0"
            detail="Governance roles awaiting review"
            tone="amber"
          />

          <DashboardStat
            label="Confirmed attendance"
            value="0"
            detail="Participants marked present"
            tone="emerald"
          />
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-8">
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-700">
                      Platform administration
                    </p>

                    <h2 className="mt-2 text-xl font-bold">
                      Administrator Modules
                    </h2>
                  </div>

                  <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    Version 1
                  </span>
                </div>
              </div>

              <div className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
                {adminModules.map((module) => (
                  <AdminModuleCard key={module.title} module={module} />
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-700">
                    National event
                  </p>

                  <h2 className="mt-2 text-xl font-bold">
                    {setup.eventName || "National IAP CPR Day 2026"}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Central event configuration currently stored in this
                    browser.
                  </p>
                </div>

                <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 sm:text-right">
                  <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                    Event date
                  </p>

                  <p className="mt-1 text-sm font-bold text-red-950">
                    {formattedEventDate}
                  </p>
                </div>
              </div>

              <div className="mt-7 grid gap-4 md:grid-cols-3">
                <StatusPanel
                  label="Registration"
                  value={
                    setup.registrationEnabled ? "Enabled" : "Currently disabled"
                  }
                  active={setup.registrationEnabled}
                />

                <StatusPanel
                  label="Role approval"
                  value={
                    setup.approvalRequired
                      ? "Administrator approval required"
                      : "Automatic approval"
                  }
                  active={setup.approvalRequired}
                />

                <StatusPanel
                  label="Organisation"
                  value={setup.organisation || "Not configured"}
                  active={Boolean(setup.organisation)}
                />
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-300">
                Signed in as
              </p>

              <div className="mt-5 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-700 text-xl font-bold">
                  {getInitials(setup.fullName)}
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold">
                    {setup.fullName || "Administrator not configured"}
                  </h2>

                  <p className="mt-1 truncate text-sm text-slate-300">
                    {setup.designation || "Administrator"}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3 border-t border-slate-800 pt-5">
                <InformationRow
                  label="Email"
                  value={setup.email || "Not entered"}
                />

                <InformationRow
                  label="Mobile"
                  value={setup.mobile || "Not entered"}
                />
              </div>

              <Link
                href="/cprday/admin/setup"
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-100"
              >
                Edit Administrator profile
              </Link>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-base font-bold">Setup completion</h2>

                <span className="text-lg font-bold text-red-700">
                  {setupCompletion}%
                </span>
              </div>

              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-red-700 transition-all duration-500"
                  style={{ width: `${setupCompletion}%` }}
                />
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600">
                {setupCompletion === 100
                  ? "The required Administrator setup fields are complete."
                  : "Complete the Administrator setup before activating the full platform."}
              </p>

              {setupCompletion < 100 ? (
                <Link
                  href="/cprday/admin/setup"
                  className="mt-5 inline-flex text-sm font-bold text-red-700 transition hover:text-red-800"
                >
                  Complete setup →
                </Link>
              ) : null}
            </section>

            <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
              <p className="text-sm font-bold text-amber-950">
                Development status
              </p>

              <p className="mt-2 text-sm leading-6 text-amber-800">
                The Administrator Console is now visible. Operational modules
                will be connected one at a time in the following files.
              </p>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

function DashboardStat({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "red" | "blue" | "amber" | "emerald";
}) {
  const toneClasses = {
    red: "border-red-200 bg-red-50 text-red-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div
        className={`inline-flex rounded-xl border px-3 py-1 text-xs font-bold uppercase tracking-wide ${toneClasses[tone]}`}
      >
        {label}
      </div>

      <p className="mt-5 text-4xl font-bold tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </section>
  );
}

function AdminModuleCard({ module }: { module: AdminModule }) {
  const isAvailable = module.status === "Available";

  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-xl">
          {module.icon}
        </span>

        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            isAvailable
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {module.count || module.status}
        </span>
      </div>

      <h3 className="mt-5 text-base font-bold text-slate-950">
        {module.title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        {module.description}
      </p>

      <span
        className={`mt-5 inline-flex text-sm font-bold ${
          isAvailable ? "text-red-700" : "text-slate-400"
        }`}
      >
        {isAvailable ? "Open module →" : "Module pending"}
      </span>
    </>
  );

  if (!isAvailable) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        {content}
      </div>
    );
  }

  return (
    <Link
      href={module.href}
      className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md"
    >
      {content}
    </Link>
  );
}

function StatusPanel({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            active ? "bg-emerald-500" : "bg-slate-400"
          }`}
        />

        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
          {label}
        </p>
      </div>

      <p className="mt-3 text-sm font-bold leading-6 text-slate-900">
        {value}
      </p>
    </div>
  );
}

function InformationRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-slate-100">
        {value}
      </p>
    </div>
  );
}

function getInitials(fullName: string) {
  const cleanedName = fullName.trim();

  if (!cleanedName) {
    return "AD";
  }

  return cleanedName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}