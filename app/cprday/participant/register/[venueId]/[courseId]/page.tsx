"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import {
  CPRDayEvent,
  CourseDetails,
  getCPRDayEvent,
} from "../../../../../../lib/cprday/eventStorage";

import {
  generateParticipantId,
  isMobileAlreadyRegistered,
  saveParticipant,
} from "../../../../../../lib/cprday/participantStorage";

const participantCategories = [
  "Doctor",
  "Nurse",
  "Medical student",
  "Nursing student",
  "Paramedical professional",
  "School student above 12 years",
  "Teacher or school staff",
  "Police personnel",
  "Security personnel",
  "Armed forces",
  "Government employee",
  "Corporate employee",
  "Residential welfare association member",
  "Community member",
  "Media personnel",
  "Other",
];

export default function ParticipantRegistrationPage() {
  const params = useParams<{
    venueId: string;
    courseId: string;
  }>();

  const [event, setEvent] =
    useState<CPRDayEvent | null>(null);

  const [course, setCourse] =
    useState<CourseDetails | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [emailNotAvailable, setEmailNotAvailable] =
    useState(false);

  const [selectedCategory, setSelectedCategory] =
    useState("");

  const [errorMessage, setErrorMessage] = useState("");

  const [registrationComplete, setRegistrationComplete] =
    useState(false);

  const [participantId, setParticipantId] =
    useState("");

  useEffect(() => {
    const savedEvent = getCPRDayEvent();

    if (!savedEvent) {
      setIsLoading(false);
      return;
    }

    if (savedEvent.venueId !== params.venueId) {
      setIsLoading(false);
      return;
    }

    const numericCourseId = Number(params.courseId);

    const selectedCourse = savedEvent.courses.find(
      (savedCourse) =>
        savedCourse.id === numericCourseId,
    );

    if (!selectedCourse) {
      setIsLoading(false);
      return;
    }

    setEvent(savedEvent);
    setCourse(selectedCourse);
    setIsLoading(false);
  }, [params.courseId, params.venueId]);

  const courseNumber = useMemo(() => {
    if (!event || !course) {
      return 0;
    }

    return (
      event.courses.findIndex(
        (savedCourse) =>
          savedCourse.id === course.id,
      ) + 1
    );
  }, [course, event]);

  function handleSubmit(
    submitEvent: FormEvent<HTMLFormElement>,
  ) {
    submitEvent.preventDefault();

    if (!event || !course) {
      return;
    }

    const form = submitEvent.currentTarget;

    if (!form.checkValidity()) {
      setErrorMessage(
        "Please complete all required fields.",
      );

      form.reportValidity();
      return;
    }

    const formData = new FormData(form);

    const fullName = String(
      formData.get("fullName") || "",
    ).trim();

    const mobile = String(
      formData.get("mobile") || "",
    ).trim();

    const participantEmail = String(
      formData.get("email") || "",
    ).trim();

    const otherCategory = String(
      formData.get("otherCategory") || "",
    ).trim();

    if (
      selectedCategory === "Other" &&
      !otherCategory
    ) {
      setErrorMessage(
        "Please specify the participant category.",
      );
      return;
    }

    if (
      isMobileAlreadyRegistered(
        event.venueId,
        course.id,
        mobile,
      )
    ) {
      setErrorMessage(
        "This mobile number is already registered for the selected course.",
      );
      return;
    }

    const fallbackEmail =
      course.coordinator.email ||
      course.leadInstructor.email ||
      "";

    const finalEmail = emailNotAvailable
      ? fallbackEmail
      : participantEmail;

    const newParticipantId =
      generateParticipantId();

    saveParticipant({
      participantId: newParticipantId,
      venueId: event.venueId,
      courseId: course.id,
      registeredAt: new Date().toISOString(),

      fullName,
      mobile,
      email: finalEmail,
      emailNotAvailable,
      category: selectedCategory,
      otherCategory,

      status: "Registered",
    });

    setParticipantId(newParticipantId);
    setErrorMessage("");
    setRegistrationComplete(true);

    form.reset();
    setSelectedCategory("");
    setEmailNotAvailable(false);
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <p className="font-bold text-slate-700">
          Loading course details…
        </p>
      </main>
    );
  }

  if (!event || !course) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-900">
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-700">
            Registration Link Not Available
          </p>

          <h1 className="mt-4 text-3xl font-black">
            This course could not be found
          </h1>

          <p className="mt-4 leading-7 text-slate-600">
            The event or course registration link may be
            incorrect or may not yet be active.
          </p>

          <Link
            href="/cprday"
            className="mt-7 inline-flex rounded-xl bg-sky-600 px-7 py-4 font-bold text-white transition hover:bg-sky-500"
          >
            Return to CPR Day
          </Link>
        </div>
      </main>
    );
  }

  if (registrationComplete) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-sky-950 to-slate-950 px-6 py-12 text-white">
        <div className="w-full max-w-xl rounded-3xl border border-white/15 bg-white/10 p-8 text-center shadow-2xl backdrop-blur sm:p-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-4xl font-black text-white">
            ✓
          </div>

          <p className="mt-7 text-sm font-bold uppercase tracking-[0.2em] text-sky-300">
            Registration Confirmed
          </p>

          <h1 className="mt-4 text-3xl font-black sm:text-4xl">
            You are registered for CPR Day
          </h1>

          <p className="mt-5 leading-7 text-slate-300">
            Your registration has been recorded for Course{" "}
            {courseNumber} at {event.hostInstitution}.
          </p>

          <div className="mt-7 rounded-2xl border border-white/10 bg-slate-950/40 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-300">
              Participant Registration ID
            </p>

            <p className="mt-2 text-2xl font-black">
              {participantId}
            </p>
          </div>

          <div className="mt-7 space-y-2 text-sm text-slate-300">
            <p>
              <strong className="text-white">
                Date:
              </strong>{" "}
              21 July 2026
            </p>

            <p>
              <strong className="text-white">
                Venue:
              </strong>{" "}
              {event.venueName}, {event.city}
            </p>

            <p>
              <strong className="text-white">
                Course time:
              </strong>{" "}
              {formatTime(course.startTime)} –{" "}
              {formatTime(course.endTime)}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setRegistrationComplete(false)
            }
            className="mt-8 rounded-xl bg-sky-500 px-7 py-4 font-bold text-slate-950 transition hover:bg-sky-400"
          >
            Register Another Participant
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Public registration header */}

      <section className="bg-gradient-to-br from-slate-950 via-sky-950 to-slate-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">
            National IAP CPR Day 2026
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            Participant Registration
          </h1>

          <p className="mt-5 text-xl font-bold text-white">
            Every Citizen Can Save a Life
          </p>

          <p className="mx-auto mt-4 max-w-3xl leading-7 text-slate-300">
            Register for supervised hands-on CPR awareness and
            practice on 21 July 2026.
          </p>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.75fr_1.25fr]">
          {/* Event summary */}

          <aside className="space-y-6">
            <div className="rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 p-7 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-700">
                Course Information
              </p>

              <h2 className="mt-3 text-2xl font-black">
                {event.hostInstitution}
              </h2>

              <div className="mt-6 space-y-5">
                <InformationField
                  label="Venue"
                  value={`${event.venueName}, ${event.city}, ${event.state}`}
                />

                <InformationField
                  label="Course"
                  value={`Course ${courseNumber}`}
                />

                <InformationField
                  label="Official Course Code"
                  value={
                    course.courseCode ||
                    "Course code awaited"
                  }
                />

                <InformationField
                  label="Date"
                  value="21 July 2026"
                />

                <InformationField
                  label="Time"
                  value={`${formatTime(
                    course.startTime,
                  )} – ${formatTime(course.endTime)}`}
                />
              </div>
            </div>

            <div className="rounded-3xl bg-slate-950 p-7 text-white shadow-xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-300">
                Registration Note
              </p>

              <p className="mt-4 text-sm leading-7 text-slate-300">
                Registration does not itself confirm certificate
                eligibility. Attendance and supervised hands-on
                CPR participation must be confirmed by the course
                coordinator after training.
              </p>
            </div>
          </aside>

          {/* Participant form */}

          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9"
          >
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-700">
              Participant Details
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight">
              Register for this course
            </h2>

            <p className="mt-3 leading-7 text-slate-600">
              Fields marked with an asterisk are required.
            </p>

            {errorMessage && (
              <div
                role="alert"
                className="mt-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-800"
              >
                {errorMessage}
              </div>
            )}

            <div className="mt-8 space-y-6">
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-bold text-slate-800"
                >
                  Full name *
                </label>

                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Enter name as it should appear on the certificate"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3.5 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Please check spelling carefully.
                </p>
              </div>

              <div>
                <label
                  htmlFor="mobile"
                  className="block text-sm font-bold text-slate-800"
                >
                  Mobile number *
                </label>

                <input
                  id="mobile"
                  name="mobile"
                  type="tel"
                  required
                  inputMode="numeric"
                  pattern="[6-9][0-9]{9}"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3.5 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-bold text-slate-800"
                >
                  Email address{" "}
                  {emailNotAvailable ? "" : "*"}
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  required={!emailNotAvailable}
                  disabled={emailNotAvailable}
                  placeholder={
                    emailNotAvailable
                      ? "Coordinator email will be used"
                      : "name@example.com"
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3.5 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />

                <label className="mt-3 flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={emailNotAvailable}
                    onChange={(checkboxEvent) =>
                      setEmailNotAvailable(
                        checkboxEvent.target.checked,
                      )
                    }
                    className="mt-0.5 h-5 w-5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />

                  <span className="text-sm text-slate-700">
                    I do not have an email address.
                  </span>
                </label>
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-bold text-slate-800"
                >
                  Participant category *
                </label>

                <select
                  id="category"
                  name="category"
                  required
                  value={selectedCategory}
                  onChange={(selectEvent) =>
                    setSelectedCategory(
                      selectEvent.target.value,
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                >
                  <option value="" disabled>
                    Select category
                  </option>

                  {participantCategories.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    ),
                  )}
                </select>
              </div>

              {selectedCategory === "Other" && (
                <div>
                  <label
                    htmlFor="otherCategory"
                    className="block text-sm font-bold text-slate-800"
                  >
                    Please specify category *
                  </label>

                  <input
                    id="otherCategory"
                    name="otherCategory"
                    type="text"
                    required
                    placeholder="Enter participant category"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3.5 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  />
                </div>
              )}
            </div>

            <div className="mt-8 rounded-2xl border border-sky-200 bg-sky-50 p-5">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  required
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />

                <span className="text-sm leading-6 text-slate-700">
                  I confirm that the information entered is correct
                  and consent to its use for CPR Day registration,
                  attendance confirmation, certificate generation
                  and essential course communication. *
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="mt-8 w-full rounded-xl bg-sky-700 px-7 py-4 font-bold text-white shadow-lg transition hover:bg-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-200"
            >
              Confirm Participant Registration
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

type InformationFieldProps = {
  label: string;
  value: string;
};

function InformationField({
  label,
  value,
}: InformationFieldProps) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-bold leading-6 text-slate-900">
        {value}
      </p>
    </div>
  );
}

function formatTime(value: string): string {
  if (!value) {
    return "Time to be announced";
  }

  const [hourString, minuteString] =
    value.split(":");

  const date = new Date();

  date.setHours(
    Number(hourString),
    Number(minuteString),
    0,
    0,
  );

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}