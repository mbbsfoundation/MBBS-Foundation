"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type FormData = {
  hostInstitution: string;
  venueName: string;
  addressLine1: string;
  city: string;
  district: string;
  state: string;
  stateCode: string;
  postalCode: string;
  courseDate: string;
  startTime: string;
  expectedParticipants: string;
};

const initialFormData: FormData = {
  hostInstitution: "",
  venueName: "",
  addressLine1: "",
  city: "",
  district: "",
  state: "",
  stateCode: "",
  postalCode: "",
  courseDate: "2026-07-21",
  startTime: "",
  expectedParticipants: "",
};

export default function CreateVenuePage() {
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>(initialFormData);
const [submitting, setSubmitting] = useState(false);
const [loadingPreviousDetails, setLoadingPreviousDetails] = useState(true);
const [message, setMessage] = useState("");
useEffect(() => {
  let cancelled = false;

  async function loadPreviousCourseDetails() {
    try {
      const response = await fetch(
        "/api/cprday/courses?latestMine=true",
        {
          method: "GET",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      if (cancelled || !data.course) {
        return;
      }

      setFormData((current) => ({
        ...current,
        hostInstitution: data.course.title ?? "",
        venueName: data.course.venueName ?? "",
        addressLine1: data.course.addressLine1 ?? "",
        city: data.course.city ?? "",
        district: data.course.district ?? "",
        state: data.course.state ?? "",
        stateCode: data.course.stateCode ?? "",
        postalCode: data.course.postalCode ?? "",
      }));
    } catch {
      // Keep the form usable even if previous details cannot be loaded.
    } finally {
      if (!cancelled) {
        setLoadingPreviousDetails(false);
      }
    }
  }

  loadPreviousCourseDetails();

  return () => {
    cancelled = true;
  };
}, []);

  function updateField(field: keyof FormData, value: string) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/cprday/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.hostInstitution,
          venueName: formData.venueName,
          addressLine1: formData.addressLine1,
          city: formData.city,
          district: formData.district,
          state: formData.state,
          stateCode: formData.stateCode.toUpperCase(),
          postalCode: formData.postalCode,
          courseDate: formData.courseDate,
          startTime: formData.startTime,
          expectedParticipants: formData.expectedParticipants
            ? Number(formData.expectedParticipants)
            : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message ?? data.error ?? "Unable to create course.");
        setSubmitting(false);
        return;
      }

      router.push("/cprday/my-venues");
      router.refresh();
    } catch {
      setMessage("Unable to connect to the server.");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-sky-700">
            National IAP CPR Day 2026
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Create Venue
          </h1>

          <p className="mt-2 text-slate-600">
            Enter the institution, venue and training details.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-10">
  {loadingPreviousDetails && (
    <p className="mb-4 text-sm font-medium text-slate-500">
      Checking your previous course details...
    </p>
  )}

  <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Host Institution
              </label>

              <input
                required
                value={formData.hostInstitution}
                onChange={(event) =>
                  updateField("hostInstitution", event.target.value)
                }
                placeholder="Example: AIIMS Rishikesh"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-600"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Venue Name
              </label>

              <input
                required
                value={formData.venueName}
                onChange={(event) =>
                  updateField("venueName", event.target.value)
                }
                placeholder="Example: Main Auditorium"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-600"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Address
              </label>

              <input
                value={formData.addressLine1}
                onChange={(event) =>
                  updateField("addressLine1", event.target.value)
                }
                placeholder="Venue address"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                City
              </label>

              <input
                required
                value={formData.city}
                onChange={(event) => updateField("city", event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                District
              </label>

              <input
                required
                value={formData.district}
                onChange={(event) =>
                  updateField("district", event.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                State
              </label>

              <input
                required
                value={formData.state}
                onChange={(event) => updateField("state", event.target.value)}
                placeholder="Example: Uttarakhand"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                State Code
              </label>

              <input
                required
                maxLength={3}
                value={formData.stateCode}
                onChange={(event) =>
                  updateField("stateCode", event.target.value)
                }
                placeholder="Example: UK"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 uppercase outline-none focus:border-sky-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                PIN Code
              </label>

              <input
                required
                inputMode="numeric"
                value={formData.postalCode}
                onChange={(event) =>
                  updateField("postalCode", event.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Training Date
              </label>

              <input
                required
                type="date"
                value={formData.courseDate}
                onChange={(event) =>
                  updateField("courseDate", event.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Start Time
              </label>

              <input
  type="text"
  value={formData.startTime}
  onChange={(event) =>
    updateField("startTime", event.target.value)
  }
  placeholder="Example: 9:30 AM"
  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-600"
/>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Expected Participants
              </label>

              <input
                type="number"
                min="1"
                value={formData.expectedParticipants}
                onChange={(event) =>
                  updateField("expectedParticipants", event.target.value)
                }
                placeholder="Example: 100"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-600"
              />
            </div>
          </div>

          {message && (
            <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {message}
            </div>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/cprday/my-venues"
              className="rounded-xl border border-slate-300 px-6 py-3 text-center font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-sky-700 px-6 py-3 font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Creating Venue..." : "Create Venue"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}