"use client";

import { FormEvent, useEffect, useState } from "react";

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

export default function AdministratorSetupPage() {
  const [setup, setSetup] = useState<AdministratorSetup>(initialSetup);
  const [isLoaded, setIsLoaded] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    try {
      const savedSetup = window.localStorage.getItem(STORAGE_KEY);

      if (savedSetup) {
        const parsedSetup = JSON.parse(savedSetup) as AdministratorSetup;

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

  function updateField<K extends keyof AdministratorSetup>(
    field: K,
    value: AdministratorSetup[K],
  ) {
    setSetup((currentSetup) => ({
      ...currentSetup,
      [field]: value,
    }));

    setSavedMessage("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(setup));
      setSavedMessage("Administrator setup saved successfully.");
    } catch (error) {
      console.error("Unable to save Administrator setup:", error);
      setSavedMessage("The setup could not be saved. Please try again.");
    }
  }

  function handleReset() {
    setSetup(initialSetup);
    setSavedMessage("");

    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Unable to reset Administrator setup:", error);
    }
  }

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6">
          <p className="text-sm font-medium text-slate-500">
            Loading Administrator setup...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-red-700">
                  CPR Day Administration
                </span>

                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                  Initial setup
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Administrator Setup
              </h1>

              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                Configure the primary Administrator account and the core
                settings for the National IAP CPR Day 2026 platform.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Platform status
              </p>

              <div className="mt-2 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-sm font-semibold text-slate-800">
                  Setup page active
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-10">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <form onSubmit={handleSubmit} className="space-y-8">
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-700">
                  Section 1
                </p>

                <h2 className="mt-2 text-xl font-bold">
                  Primary Administrator
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Enter the details of the person responsible for complete
                  platform access and administrative control.
                </p>
              </div>

              <div className="grid gap-6 px-6 py-7 sm:grid-cols-2 sm:px-8">
                <Field label="Full name" required>
                  <input
                    type="text"
                    value={setup.fullName}
                    onChange={(event) =>
                      updateField("fullName", event.target.value)
                    }
                    placeholder="Enter Administrator name"
                    required
                    className={inputClassName}
                  />
                </Field>

                <Field label="Designation" required>
                  <input
                    type="text"
                    value={setup.designation}
                    onChange={(event) =>
                      updateField("designation", event.target.value)
                    }
                    placeholder="Administrator"
                    required
                    className={inputClassName}
                  />
                </Field>

                <Field label="Official email address" required>
                  <input
                    type="email"
                    value={setup.email}
                    onChange={(event) =>
                      updateField("email", event.target.value)
                    }
                    placeholder="administrator@example.org"
                    required
                    className={inputClassName}
                  />
                </Field>

                <Field label="Mobile number" required>
                  <input
                    type="tel"
                    value={setup.mobile}
                    onChange={(event) =>
                      updateField("mobile", event.target.value)
                    }
                    placeholder="10-digit mobile number"
                    required
                    className={inputClassName}
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Organisation" required>
                    <input
                      type="text"
                      value={setup.organisation}
                      onChange={(event) =>
                        updateField("organisation", event.target.value)
                      }
                      placeholder="Organisation name"
                      required
                      className={inputClassName}
                    />
                  </Field>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-700">
                  Section 2
                </p>

                <h2 className="mt-2 text-xl font-bold">
                  CPR Day Platform Details
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  These details will be used as the default identity of the
                  national CPR Day platform.
                </p>
              </div>

              <div className="grid gap-6 px-6 py-7 sm:grid-cols-2 sm:px-8">
                <Field label="Event name" required>
                  <input
                    type="text"
                    value={setup.eventName}
                    onChange={(event) =>
                      updateField("eventName", event.target.value)
                    }
                    required
                    className={inputClassName}
                  />
                </Field>

                <Field label="National event date" required>
                  <input
                    type="date"
                    value={setup.eventDate}
                    onChange={(event) =>
                      updateField("eventDate", event.target.value)
                    }
                    required
                    className={inputClassName}
                  />
                </Field>

                <Field label="Support email">
                  <input
                    type="email"
                    value={setup.supportEmail}
                    onChange={(event) =>
                      updateField("supportEmail", event.target.value)
                    }
                    placeholder="support@example.org"
                    className={inputClassName}
                  />
                </Field>

                <Field label="Support mobile number">
                  <input
                    type="tel"
                    value={setup.supportMobile}
                    onChange={(event) =>
                      updateField("supportMobile", event.target.value)
                    }
                    placeholder="Support contact number"
                    className={inputClassName}
                  />
                </Field>
              </div>
            </section>

            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-700">
                  Section 3
                </p>

                <h2 className="mt-2 text-xl font-bold">
                  Registration and Approval Controls
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Select the initial operational rules. These settings can be
                  connected to the Administrator console in the next stage.
                </p>
              </div>

              <div className="space-y-4 px-6 py-7 sm:px-8">
                <ToggleCard
                  title="Enable registrations"
                  description="Allow coordinators, instructors, champions and participants to access their registration workflows."
                  checked={setup.registrationEnabled}
                  onChange={(checked) =>
                    updateField("registrationEnabled", checked)
                  }
                />

                <ToggleCard
                  title="Require role approval"
                  description="Keep new governance-role registrations pending until they are reviewed and approved."
                  checked={setup.approvalRequired}
                  onChange={(checked) =>
                    updateField("approvalRequired", checked)
                  }
                />
              </div>
            </section>

            {savedMessage ? (
              <div
                className={`rounded-2xl border px-5 py-4 text-sm font-semibold ${
                  savedMessage.includes("successfully")
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}
                role="status"
              >
                {savedMessage}
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleReset}
                className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Reset setup
              </button>

              <button
                type="submit"
                className="rounded-xl bg-red-700 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-100"
              >
                Save Administrator setup
              </button>
            </div>
          </form>

          <aside className="space-y-6">
            <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-300">
                Administrator authority
              </p>

              <h2 className="mt-3 text-xl font-bold">
                Complete system oversight
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-300">
                The Administrator will have the highest level of platform
                access, including approval, correction, configuration and
                override functions.
              </p>

              <div className="mt-6 space-y-3">
                {[
                  "Approve governance roles",
                  "Manage national and state access",
                  "Correct course and participant records",
                  "Control registration settings",
                  "Access national reports",
                  "Override operational restrictions",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-bold">
                      ✓
                    </span>

                    <span className="text-sm leading-6 text-slate-200">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-950">
                Current setup summary
              </h2>

              <dl className="mt-5 space-y-4">
                <SummaryRow
                  label="Administrator"
                  value={setup.fullName || "Not entered"}
                />

                <SummaryRow
                  label="Event"
                  value={setup.eventName || "Not entered"}
                />

                <SummaryRow
                  label="Event date"
                  value={
                    setup.eventDate
                      ? formatDisplayDate(setup.eventDate)
                      : "Not selected"
                  }
                />

                <SummaryRow
                  label="Registrations"
                  value={setup.registrationEnabled ? "Enabled" : "Disabled"}
                />

                <SummaryRow
                  label="Role approval"
                  value={setup.approvalRequired ? "Required" : "Not required"}
                />
              </dl>
            </section>

            <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
              <p className="text-sm font-bold text-blue-950">
                Version 1 local setup
              </p>

              <p className="mt-2 text-sm leading-6 text-blue-800">
                This page currently stores the setup in this browser using
                localStorage. It can later be connected to the central database
                and authenticated Administrator account.
              </p>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

const inputClassName =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-red-600 focus:ring-4 focus:ring-red-50";

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-800">
        {label}
        {required ? <span className="ml-1 text-red-700">*</span> : null}
      </span>

      {children}
    </label>
  );
}

function ToggleCard({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-5 rounded-2xl border border-slate-200 p-5 transition hover:border-slate-300 hover:bg-slate-50">
      <span>
        <span className="block text-sm font-bold text-slate-900">{title}</span>

        <span className="mt-1 block max-w-2xl text-sm leading-6 text-slate-600">
          {description}
        </span>
      </span>

      <span className="relative mt-1 inline-flex shrink-0 items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />

        <span className="h-7 w-12 rounded-full bg-slate-300 transition peer-checked:bg-red-700 peer-focus:ring-4 peer-focus:ring-red-100" />

        <span className="absolute left-1 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>

      <dd className="mt-1 text-sm font-bold leading-6 text-slate-900">
        {value}
      </dd>
    </div>
  );
}

function formatDisplayDate(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}