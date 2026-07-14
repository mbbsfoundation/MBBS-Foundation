"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CPRDayEvent,
  generateVenueId,
  getCPRDayEvent,
  saveCPRDayEvent,
} from "../../../lib/cprday/eventStorage";

type PersonDetails = {
  name: string;
  mobile: string;
  email: string;
};

type CourseDetails = {
  id: number;
  registeredOnIapWebsite: string;
  courseCode: string;
  startTime: string;
  endTime: string;
  participantCategories: string[];
  otherParticipantCategory: string;
  expectedParticipants: number;
  adultManikins: number;
  infantManikins: number;
  coordinator: PersonDetails;
  leadInstructor: PersonDetails;
  otherInstructors: PersonDetails[];
  cprChampions: PersonDetails[];
};

const zones = [
  "Central Zone",
  "East Zone",
  "North Zone",
  "North-East Zone",
  "South Zone",
  "West Zone",
];

const indianStatesAndUTs = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

const participantCategoryOptions = [
  "Doctors",
  "Nurses",
  "Medical students",
  "Nursing students",
  "Paramedical personnel",
  "School students above 12 years",
  "Teachers and school staff",
  "Police personnel",
  "Security personnel",
  "Armed forces",
  "Government employees",
  "Corporate employees",
  "Residential welfare associations",
  "Community members",
  "Media personnel",
  "Other",
];

function emptyPerson(): PersonDetails {
  return {
    name: "",
    mobile: "",
    email: "",
  };
}

function createNewCourse(id: number): CourseDetails {
  return {
    id,
    registeredOnIapWebsite: "",
    courseCode: "",
    startTime: "",
    endTime: "",
    participantCategories: [],
    otherParticipantCategory: "",
    expectedParticipants: 100,
    adultManikins: 2,
    infantManikins: 0,
    coordinator: emptyPerson(),
    leadInstructor: emptyPerson(),
    otherInstructors: [],
    cprChampions: [],
  };
}

export default function CPRDayEventConfirmationPage() {
      const router = useRouter();
      const [savedEvent, setSavedEvent] =
  useState<CPRDayEvent | null>(null);

const [isLoadingSavedEvent, setIsLoadingSavedEvent] =
  useState(true);
  const [courses, setCourses] = useState<CourseDetails[]>([
    createNewCourse(1),
  ]);
  useEffect(() => {
  const existingEvent = getCPRDayEvent();

  if (existingEvent) {
    setSavedEvent(existingEvent);
    setCourses(existingEvent.courses);
  }

  setIsLoadingSavedEvent(false);
}, []);

  const [errorMessage, setErrorMessage] = useState("");

  const totalExpectedParticipants = useMemo(() => {
    return courses.reduce(
      (total, course) =>
        total + Number(course.expectedParticipants || 0),
      0,
    );
  }, [courses]);

  const totalAdultManikinsAllocated = useMemo(() => {
    return courses.reduce(
      (total, course) =>
        total + Number(course.adultManikins || 0),
      0,
    );
  }, [courses]);

  const totalInfantManikinsAllocated = useMemo(() => {
    return courses.reduce(
      (total, course) =>
        total + Number(course.infantManikins || 0),
      0,
    );
  }, [courses]);

  function updateCourse<K extends keyof CourseDetails>(
    courseId: number,
    field: K,
    value: CourseDetails[K],
  ) {
    setCourses((currentCourses) =>
      currentCourses.map((course) =>
        course.id === courseId
          ? {
              ...course,
              [field]: value,
            }
          : course,
      ),
    );
  }

  function updatePerson(
    courseId: number,
    personType: "coordinator" | "leadInstructor",
    field: keyof PersonDetails,
    value: string,
  ) {
    setCourses((currentCourses) =>
      currentCourses.map((course) =>
        course.id === courseId
          ? {
              ...course,
              [personType]: {
                ...course[personType],
                [field]: value,
              },
            }
          : course,
      ),
    );
  }

  function addTeamMember(
    courseId: number,
    teamType: "otherInstructors" | "cprChampions",
  ) {
    setCourses((currentCourses) =>
      currentCourses.map((course) => {
        if (course.id !== courseId) {
          return course;
        }

        if (course[teamType].length >= 5) {
          return course;
        }

        return {
          ...course,
          [teamType]: [
            ...course[teamType],
            emptyPerson(),
          ],
        };
      }),
    );
  }

  function updateTeamMember(
    courseId: number,
    teamType: "otherInstructors" | "cprChampions",
    memberIndex: number,
    field: keyof PersonDetails,
    value: string,
  ) {
    setCourses((currentCourses) =>
      currentCourses.map((course) => {
        if (course.id !== courseId) {
          return course;
        }

        const updatedMembers = course[teamType].map(
          (member, index) =>
            index === memberIndex
              ? {
                  ...member,
                  [field]: value,
                }
              : member,
        );

        return {
          ...course,
          [teamType]: updatedMembers,
        };
      }),
    );
  }

  function removeTeamMember(
    courseId: number,
    teamType: "otherInstructors" | "cprChampions",
    memberIndex: number,
  ) {
    setCourses((currentCourses) =>
      currentCourses.map((course) =>
        course.id === courseId
          ? {
              ...course,
              [teamType]: course[teamType].filter(
                (_, index) => index !== memberIndex,
              ),
            }
          : course,
      ),
    );
  }

  function addCourse() {
    const nextId =
      courses.length === 0
        ? 1
        : Math.max(
            ...courses.map((course) => course.id),
          ) + 1;

    setCourses((currentCourses) => [
      ...currentCourses,
      createNewCourse(nextId),
    ]);
  }

  function removeCourse(courseId: number) {
    if (courses.length === 1) {
      return;
    }

    setCourses((currentCourses) =>
      currentCourses.filter(
        (course) => course.id !== courseId,
      ),
    );
  }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;

    if (!form.checkValidity()) {
      setErrorMessage(
        "Please complete all required fields before continuing.",
      );

      form.reportValidity();
      return;
    }

    const courseWithoutCategory = courses.find(
      (course) =>
        course.participantCategories.length === 0,
    );

    if (courseWithoutCategory) {
      setErrorMessage(
        "Please select at least one participant category for every course.",
      );
      return;
    }

    const otherCategoryMissing = courses.find(
      (course) =>
        course.participantCategories.includes("Other") &&
        !course.otherParticipantCategory.trim(),
    );

    if (otherCategoryMissing) {
      setErrorMessage(
        "Please describe the participant category where Other has been selected.",
      );
      return;
    }

    const incompleteInstructor = courses.find((course) =>
      course.otherInstructors.some(
        (person) =>
          !person.name.trim() ||
          !person.mobile.trim() ||
          !person.email.trim(),
      ),
    );

    if (incompleteInstructor) {
      setErrorMessage(
        "Please complete the name, mobile number and email address for every added instructor.",
      );
      return;
    }

    const incompleteChampion = courses.find((course) =>
      course.cprChampions.some(
        (person) =>
          !person.name.trim() ||
          !person.mobile.trim() ||
          !person.email.trim(),
      ),
    );

    if (incompleteChampion) {
      setErrorMessage(
        "Please complete the name, mobile number and email address for every added CPR Champion.",
      );
      return;
    }

    const formData = new FormData(form);

    const zone = String(formData.get("zone") || "");
    const state = String(formData.get("state") || "");
    const city = String(formData.get("city") || "");
    const hostInstitution = String(
      formData.get("hostInstitution") || "",
    );
    const venueName = String(
      formData.get("venueName") || "",
    );
    const venuePinCode = String(
      formData.get("venuePinCode") || "",
    );
    const iapBranchName = String(
      formData.get("iapBranchName") || "",
    );

    const availableAdultManikins = Number(
      formData.get("availableAdultManikins") || 0,
    );

    const availableInfantManikins = Number(
      formData.get("availableInfantManikins") || 0,
    );

    const availableInstructors = Number(
      formData.get("availableInstructors") || 0,
    );

    const availableChampions = Number(
      formData.get("availableChampions") || 0,
    );

   const venueId =
  savedEvent?.venueId || generateVenueId(zone);
    saveCPRDayEvent({
      venueId,
      createdAt:
  savedEvent?.createdAt || new Date().toISOString(),
      status: "Confirmed",

      zone,
      state,
      city,
      hostInstitution,
      venueName,
      venuePinCode,
      iapBranchName,

      availableAdultManikins,
      availableInfantManikins,
      availableInstructors,
      availableChampions,

      courses,
    });

    setErrorMessage("");

    router.push("/cprday/dashboard");
  }
if (isLoadingSavedEvent) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <p className="font-bold text-slate-700">
        Loading saved event details…
      </p>
    </main>
  );
}
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}

      <section className="border-b border-sky-100 bg-gradient-to-br from-slate-950 via-sky-950 to-slate-950 px-6 py-14 text-white">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/cprday"
            className="inline-flex items-center gap-2 text-sm font-semibold text-sky-300 transition hover:text-white"
          >
            <span aria-hidden="true">←</span>
            Back to CPR Day
          </Link>

          <div className="mt-9 max-w-4xl">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-sky-300">
              CPR Day Event Confirmation
            </p>

            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl md:text-6xl">
              Confirm Your Venue and Courses
            </h1>

            <p className="mt-6 text-lg leading-8 text-slate-300">
              Confirm the venue, available resources and one or
              more CPR courses planned for National IAP CPR Day
              2026.
            </p>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit}>
        <section className="px-6 py-12">
          <div className="mx-auto max-w-7xl space-y-8">
            {errorMessage && (
              <div
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 font-semibold text-red-800"
              >
                {errorMessage}
              </div>
            )}

            {/* Venue details */}

            <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-700">
                Section 1
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight">
                Venue and host details
              </h2>

              <p className="mt-3 leading-7 text-slate-600">
                These details are common to all courses being
                conducted at this venue.
              </p>

              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label
                    htmlFor="zone"
                    className="block text-sm font-bold text-slate-800"
                  >
                    IAP Zone *
                  </label>

                  <select
                    id="zone"
                    name="zone"
                    required
                    defaultValue={savedEvent?.zone || ""}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  >
                    <option value="" disabled>
                      Select zone
                    </option>

                    {zones.map((zone) => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="state"
                    className="block text-sm font-bold text-slate-800"
                  >
                    State or Union Territory *
                  </label>

                  <select
                    id="state"
                    name="state"
                    required
                    defaultValue={savedEvent?.state || ""}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  >
                    <option value="" disabled>
                      Select state or UT
                    </option>

                    {indianStatesAndUTs.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="city"
                    className="block text-sm font-bold text-slate-800"
                  >
                    City *
                  </label>

                  <input
                    id="city"
                    name="city"
                    type="text"
                    required
                    defaultValue={savedEvent?.city || ""}
                    placeholder="Enter city"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="hostInstitution"
                    className="block text-sm font-bold text-slate-800"
                  >
                    Host institution or organisation *
                  </label>

                  <input
                    id="hostInstitution"
                    name="hostInstitution"
                    type="text"
                    required
                    defaultValue={savedEvent?.hostInstitution || ""}
                    placeholder="Enter host institution or organisation"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="venueName"
                    className="block text-sm font-bold text-slate-800"
                  >
                    Venue name *
                  </label>

                  <input
                    id="venueName"
                    name="venueName"
                    type="text"
                    required
                    defaultValue={savedEvent?.venueName || ""}
                    placeholder="Auditorium or training venue"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="venuePinCode"
                    className="block text-sm font-bold text-slate-800"
                  >
                    Venue PIN code *
                  </label>

                  <input
                    id="venuePinCode"
                    name="venuePinCode"
                    type="text"
                    required
                    defaultValue={savedEvent?.venuePinCode || ""}
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="6-digit PIN code"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    Enter a valid six-digit Indian PIN code.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="iapBranchName"
                    className="block text-sm font-bold text-slate-800"
                  >
                    Name of IAP Branch involved
                  </label>

                  <input
                    id="iapBranchName"
                    name="iapBranchName"
                    type="text"
                    defaultValue={savedEvent?.iapBranchName || ""}
                    placeholder="Optional — leave blank if no IAP Branch is involved"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  />
                </div>
              </div>
            </section>

            {/* Venue capacity */}

            <section className="rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 p-7 shadow-sm sm:p-9">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-700">
                Section 2
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight">
                Overall venue capacity
              </h2>

              <p className="mt-3 leading-7 text-slate-600">
                Enter the total resources available across all
                courses at this venue.
              </p>

              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
                <NumberField
  id="availableAdultManikins"
  label="Adult manikins"
  minimum={0}
  defaultValue={
    savedEvent?.availableAdultManikins ?? 2
  }
  required
/>

<NumberField
  id="availableInfantManikins"
  label="Infant manikins"
  minimum={0}
  defaultValue={
    savedEvent?.availableInfantManikins ?? 0
  }
  required
/>

<NumberField
  id="availableInstructors"
  label="CPR instructors"
  minimum={0}
  defaultValue={
    savedEvent?.availableInstructors ?? 0
  }
  required
/>

<NumberField
  id="availableChampions"
  label="CPR Champions"
  minimum={0}
  defaultValue={
    savedEvent?.availableChampions ?? 0
  }
  required
/>

                <div>
                  <label
                    htmlFor="expectedVenueParticipants"
                    className="block text-sm font-bold text-slate-800"
                  >
                    Total participants
                  </label>

                  <input
                    id="expectedVenueParticipants"
                    name="expectedVenueParticipants"
                    type="number"
                    value={totalExpectedParticipants}
                    readOnly
                    className="mt-2 w-full rounded-xl border border-sky-300 bg-white px-4 py-3.5 font-bold text-sky-800 outline-none"
                  />
                </div>
              </div>
            </section>

            {/* Course section */}

            <section>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-700">
                    Section 3
                  </p>

                  <h2 className="mt-3 text-3xl font-black tracking-tight">
                    Planned CPR courses
                  </h2>

                  <p className="mt-3 max-w-3xl leading-7 text-slate-600">
                    Add separate courses when the coordinator,
                    team, timings or participant groups differ.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addCourse}
                  className="rounded-xl bg-sky-600 px-6 py-3.5 font-bold text-white shadow-lg transition hover:bg-sky-500"
                >
                  + Add Another Course
                </button>
              </div>

              <div className="mt-8 space-y-8">
                {courses.map((course, courseIndex) => {
                  const totalCourseTeam =
  (course.leadInstructor.name.trim() ? 1 : 0) +
  course.otherInstructors.filter((person) =>
    person.name.trim(),
  ).length +
  course.cprChampions.filter((person) =>
    person.name.trim(),
  ).length;

                  const participantWarning =
                    course.expectedParticipants > 100;

                  const manikinWarning =
                    course.adultManikins +
                      course.infantManikins <
                    2;

                  const teamWarning =
                    totalCourseTeam < 3;

                  return (
                    <article
                      key={course.id}
                      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                    >
                      <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-950 px-7 py-6 text-white sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-300">
                            Course {courseIndex + 1}
                          </p>

                          <h3 className="mt-2 text-2xl font-black">
                            Course planning details
                          </h3>
                        </div>

                        {courses.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              removeCourse(course.id)
                            }
                            className="rounded-lg border border-red-300/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-200 transition hover:bg-red-500/20"
                          >
                            Remove Course
                          </button>
                        )}
                      </div>

                      <div className="space-y-9 p-7 sm:p-9">
                        <div>
                          <h4 className="text-xl font-black">
                            Course information
                          </h4>

                          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                              <label className="block text-sm font-bold">
                                Registered on iapalsbls.com? *
                              </label>

                              <select
                                required
                                value={
                                  course.registeredOnIapWebsite
                                }
                                onChange={(event) =>
                                  updateCourse(
                                    course.id,
                                    "registeredOnIapWebsite",
                                    event.target.value,
                                  )
                                }
                                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                              >
                                <option value="" disabled>
                                  Select option
                                </option>
                                <option value="Yes">
                                  Yes
                                </option>
                                <option value="No">
                                  Not yet
                                </option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-bold">
                                Official course code
                              </label>

                              <input
                                type="text"
                                value={course.courseCode}
                                onChange={(event) =>
                                  updateCourse(
                                    course.id,
                                    "courseCode",
                                    event.target.value,
                                  )
                                }
                                required={
                                  course.registeredOnIapWebsite ===
                                  "Yes"
                                }
                                placeholder="Enter code if received"
                                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3.5 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                              />
                            </div>

                            <ParticipantCategoryDropdown
                              selected={
                                course.participantCategories
                              }
                              otherValue={
                                course.otherParticipantCategory
                              }
                              onChange={(categories) =>
                                updateCourse(
                                  course.id,
                                  "participantCategories",
                                  categories,
                                )
                              }
                              onOtherChange={(value) =>
                                updateCourse(
                                  course.id,
                                  "otherParticipantCategory",
                                  value,
                                )
                              }
                            />

                            <div>
                              <label className="block text-sm font-bold">
                                Start time *
                              </label>

                              <input
                                type="time"
                                required
                                value={course.startTime}
                                onChange={(event) =>
                                  updateCourse(
                                    course.id,
                                    "startTime",
                                    event.target.value,
                                  )
                                }
                                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3.5 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-bold">
                                End time *
                              </label>

                              <input
                                type="time"
                                required
                                value={course.endTime}
                                onChange={(event) =>
                                  updateCourse(
                                    course.id,
                                    "endTime",
                                    event.target.value,
                                  )
                                }
                                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3.5 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-bold">
                                Expected participants *
                              </label>

                              <input
                                type="number"
                                required
                                min={1}
                                value={
                                  course.expectedParticipants
                                }
                                onChange={(event) =>
                                  updateCourse(
                                    course.id,
                                    "expectedParticipants",
                                    Number(
                                      event.target.value,
                                    ),
                                  )
                                }
                                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3.5 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-bold">
                                Adult manikins allocated *
                              </label>

                              <input
                                type="number"
                                required
                                min={0}
                                value={
                                  course.adultManikins
                                }
                                onChange={(event) =>
                                  updateCourse(
                                    course.id,
                                    "adultManikins",
                                    Number(
                                      event.target.value,
                                    ),
                                  )
                                }
                                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3.5 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-bold">
                                Infant manikins allocated *
                              </label>

                              <input
                                type="number"
                                required
                                min={0}
                                value={
                                  course.infantManikins
                                }
                                onChange={(event) =>
                                  updateCourse(
                                    course.id,
                                    "infantManikins",
                                    Number(
                                      event.target.value,
                                    ),
                                  )
                                }
                                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3.5 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                              />
                            </div>
                          </div>
                        </div>

                        <PersonForm
  title="Course Coordinator"
  person={course.coordinator}
  onChange={(field, value) =>
    updatePerson(
      course.id,
      "coordinator",
      field,
      value,
    )
  }
/>

                        <PersonForm
  title="Lead Instructor"
  person={course.leadInstructor}
  onChange={(field, value) =>
    updatePerson(
      course.id,
      "leadInstructor",
      field,
      value,
    )
  }
/>

                        <TeamSection
                          title="Other Instructors"
                          subtitle="Add up to five additional instructors."
                          members={course.otherInstructors}
                          addLabel="+ Add Instructor"
                          roleLabel="Instructor"
                          onAdd={() =>
                            addTeamMember(
                              course.id,
                              "otherInstructors",
                            )
                          }
                          onChange={(
                            memberIndex,
                            field,
                            value,
                          ) =>
                            updateTeamMember(
                              course.id,
                              "otherInstructors",
                              memberIndex,
                              field,
                              value,
                            )
                          }
                          onRemove={(memberIndex) =>
                            removeTeamMember(
                              course.id,
                              "otherInstructors",
                              memberIndex,
                            )
                          }
                        />

                        <TeamSection
                          title="CPR Champions"
                          subtitle="Add up to five CPR Champions."
                          members={course.cprChampions}
                          addLabel="+ Add CPR Champion"
                          roleLabel="CPR Champion"
                          onAdd={() =>
                            addTeamMember(
                              course.id,
                              "cprChampions",
                            )
                          }
                          onChange={(
                            memberIndex,
                            field,
                            value,
                          ) =>
                            updateTeamMember(
                              course.id,
                              "cprChampions",
                              memberIndex,
                              field,
                              value,
                            )
                          }
                          onRemove={(memberIndex) =>
                            removeTeamMember(
                              course.id,
                              "cprChampions",
                              memberIndex,
                            )
                          }
                        />

                        {(participantWarning ||
                          manikinWarning ||
                          teamWarning) && (
                          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                            <p className="font-black text-amber-950">
                              Course planning guidance
                            </p>

                            <div className="mt-3 space-y-2 text-sm leading-6 text-amber-900">
                              {participantWarning && (
                                <p>
                                  • More than 100
                                  participants are planned.
                                  Consider creating another
                                  course or adding more teams
                                  and practice stations.
                                </p>
                              )}

                              {manikinWarning && (
                                <p>
                                  • At least two CPR
                                  manikins are recommended for
                                  one course.
                                </p>
                              )}

                              {teamWarning && (
                                <p>
                                  • A combined team of at
                                  least three instructors and
                                  CPR Champions is
                                  recommended.
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* Summary */}

            <section className="rounded-3xl bg-slate-950 p-7 text-white shadow-xl sm:p-9">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-300">
                Planning Summary
              </p>

              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryCard
                  label="Courses Planned"
                  value={String(courses.length)}
                />

                <SummaryCard
                  label="Expected Participants"
                  value={totalExpectedParticipants.toLocaleString(
                    "en-IN",
                  )}
                />

                <SummaryCard
                  label="Adult Manikins Allocated"
                  value={String(
                    totalAdultManikinsAllocated,
                  )}
                />

                <SummaryCard
                  label="Infant Manikins Allocated"
                  value={String(
                    totalInfantManikinsAllocated,
                  )}
                />
              </div>

              <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    required
                    className="mt-1 h-5 w-5 rounded border-white/30 bg-white/10 text-sky-500 focus:ring-sky-400"
                  />

                  <span className="text-sm leading-6 text-slate-300">
                    I confirm that the information provided is
                    correct and that the planned courses will be
                    conducted with appropriate supervision,
                    manikin practice and institutional
                    permission. *
                  </span>
                </label>
              </div>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-between">
                <Link
                  href="/cprday"
                  className="rounded-xl border border-white/20 bg-white/10 px-7 py-4 text-center font-bold transition hover:bg-white/20"
                >
                  Back to CPR Day
                </Link>

                <button
                  type="submit"
                  className="rounded-xl bg-sky-500 px-8 py-4 font-bold text-slate-950 shadow-lg transition hover:bg-sky-400"
                >
                  Confirm Venue and Courses
                </button>
              </div>
            </section>
          </div>
        </section>
      </form>
    </main>
  );
}

type NumberFieldProps = {
  id: string;
  label: string;
  minimum: number;
  defaultValue: number;
  required?: boolean;
};

function NumberField({
  id,
  label,
  minimum,
  defaultValue,
  required = false,
}: NumberFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-bold text-slate-800"
      >
        {label} {required ? "*" : ""}
      </label>

      <input
        id={id}
        name={id}
        type="number"
        required={required}
        min={minimum}
        defaultValue={defaultValue}
        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
      />
    </div>
  );
}

type ParticipantCategoryDropdownProps = {
  selected: string[];
  otherValue: string;
  onChange: (categories: string[]) => void;
  onOtherChange: (value: string) => void;
};

function ParticipantCategoryDropdown({
  selected,
  otherValue,
  onChange,
  onOtherChange,
}: ParticipantCategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  function toggleCategory(category: string) {
    if (selected.includes(category)) {
      onChange(
        selected.filter((item) => item !== category),
      );
      return;
    }

    onChange([...selected, category]);
  }

  const displayText =
    selected.length === 0
      ? "Select one or more categories"
      : `${selected.length} ${
          selected.length === 1
            ? "category"
            : "categories"
        } selected`;

  return (
    <div className="relative lg:col-span-1">
      <label className="block text-sm font-bold">
        Participant categories *
      </label>

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="mt-2 flex w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-left outline-none transition hover:border-sky-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
      >
        <span
          className={
            selected.length === 0
              ? "text-slate-400"
              : "text-slate-900"
          }
        >
          {displayText}
        </span>

        <span
          aria-hidden="true"
          className="ml-3 text-slate-500"
        >
          {isOpen ? "▲" : "▼"}
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-2 max-h-80 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">
          {participantCategoryOptions.map(
            (category) => (
              <label
                key={category}
                className="flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 text-sm transition hover:bg-sky-50"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(category)}
                  onChange={() =>
                    toggleCategory(category)
                  }
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />

                <span>{category}</span>
              </label>
            ),
          )}

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="mt-2 w-full rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-sky-500"
          >
            Done
          </button>
        </div>
      )}

      {selected.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selected.map((category) => (
            <span
              key={category}
              className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800"
            >
              {category}
            </span>
          ))}
        </div>
      )}

      {selected.includes("Other") && (
        <div className="mt-3">
          <label className="block text-xs font-bold text-slate-700">
            Please specify the other category *
          </label>

          <input
            type="text"
            value={otherValue}
            onChange={(event) =>
              onOtherChange(event.target.value)
            }
            placeholder="Enter participant category"
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          />
        </div>
      )}
    </div>
  );
}

type PersonFormProps = {
  title: string;
  person: PersonDetails;
  onChange: (
    field: keyof PersonDetails,
    value: string,
  ) => void;
  required?: boolean;
};

function PersonForm({
  title,
  person,
  onChange,
  required = false,
}: PersonFormProps) {
  return (
    <section className="rounded-2xl border border-sky-200 bg-sky-50 p-6">
      <h4 className="text-xl font-black">{title}</h4>

      <div className="mt-5 grid gap-5 sm:grid-cols-3">
        <PersonInput
          label="Full name"
          type="text"
          value={person.name}
          placeholder="Enter full name"
          required={required}
          onChange={(value) =>
            onChange("name", value)
          }
        />

        <PersonInput
          label="Mobile number"
          type="tel"
          value={person.mobile}
          placeholder="10-digit mobile number"
          required={required}
          mobile
          onChange={(value) =>
            onChange("mobile", value)
          }
        />

        <PersonInput
          label="Email address"
          type="email"
          value={person.email}
          placeholder="name@example.com"
          required={required}
          onChange={(value) =>
            onChange("email", value)
          }
        />
      </div>
    </section>
  );
}

type PersonInputProps = {
  label: string;
  type: "text" | "tel" | "email";
  value: string;
  placeholder: string;
  required?: boolean;
  mobile?: boolean;
  onChange: (value: string) => void;
};

function PersonInput({
  label,
  type,
  value,
  placeholder,
  required = false,
  mobile = false,
  onChange,
}: PersonInputProps) {
  return (
    <div>
      <label className="block text-sm font-bold">
        {label} {required ? "*" : ""}
      </label>

      <input
        type={type}
        required={required}
        inputMode={mobile ? "numeric" : undefined}
        pattern={mobile ? "[6-9][0-9]{9}" : undefined}
        maxLength={mobile ? 10 : undefined}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
      />
    </div>
  );
}

type TeamSectionProps = {
  title: string;
  subtitle: string;
  members: PersonDetails[];
  addLabel: string;
  roleLabel: string;
  onAdd: () => void;
  onChange: (
    memberIndex: number,
    field: keyof PersonDetails,
    value: string,
  ) => void;
  onRemove: (memberIndex: number) => void;
};

function TeamSection({
  title,
  subtitle,
  members,
  addLabel,
  roleLabel,
  onAdd,
  onChange,
  onRemove,
}: TeamSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-xl font-black">{title}</h4>
          <p className="mt-1 text-sm text-slate-600">
            {subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          disabled={members.length >= 5}
          className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {members.length >= 5
            ? "Maximum 5 Added"
            : addLabel}
        </button>
      </div>

      {members.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
          No entries added yet.
        </p>
      ) : (
        <div className="mt-5 space-y-5">
          {members.map((member, memberIndex) => (
            <div
              key={memberIndex}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <p className="font-bold">
                  {roleLabel} {memberIndex + 1}
                </p>

                <button
                  type="button"
                  onClick={() => onRemove(memberIndex)}
                  className="text-sm font-bold text-red-700 hover:text-red-600"
                >
                  Remove
                </button>
              </div>

              <div className="mt-4 grid gap-5 sm:grid-cols-3">
                <input
                  type="text"
                  required
                  value={member.name}
                  onChange={(event) =>
                    onChange(
                      memberIndex,
                      "name",
                      event.target.value,
                    )
                  }
                  placeholder="Full name"
                  className="rounded-xl border border-slate-300 px-4 py-3.5 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                />

                <input
                  type="tel"
                  required
                  inputMode="numeric"
                  pattern="[6-9][0-9]{9}"
                  maxLength={10}
                  value={member.mobile}
                  onChange={(event) =>
                    onChange(
                      memberIndex,
                      "mobile",
                      event.target.value,
                    )
                  }
                  placeholder="Mobile number"
                  className="rounded-xl border border-slate-300 px-4 py-3.5 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                />

                <input
                  type="email"
                  required
                  value={member.email}
                  onChange={(event) =>
                    onChange(
                      memberIndex,
                      "email",
                      event.target.value,
                    )
                  }
                  placeholder="Email address"
                  className="rounded-xl border border-slate-300 px-4 py-3.5 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
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
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-3xl font-black text-sky-300">
        {value}
      </p>

      <p className="mt-2 text-sm text-slate-300">
        {label}
      </p>
    </div>
  );
}