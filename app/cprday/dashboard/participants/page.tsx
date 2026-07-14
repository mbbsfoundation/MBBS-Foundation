"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

import {
  CPRDayEvent,
  getCPRDayEvent,
} from "../../../../lib/cprday/eventStorage";

import {
  CPRDayParticipant,
  confirmAttendanceByMobiles,
  generateParticipantId,
  getCourseParticipants,
  removeParticipant,
  saveParticipantsBulk,
  updateParticipantStatus,
} from "../../../../lib/cprday/participantStorage";

type UploadMode =
  | "registration"
  | "attendance";

type ParsedExcelParticipant = {
  fullName: string;
  gender: string;
  mobile: string;
  email: string;
};

export default function ParticipantManagementPage() {
  const [event, setEvent] =
    useState<CPRDayEvent | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [selectedCourseId, setSelectedCourseId] =
    useState<number | null>(null);

  const [participants, setParticipants] =
    useState<CPRDayParticipant[]>([]);

  const [searchText, setSearchText] =
    useState("");

  const [uploadMode, setUploadMode] =
    useState<UploadMode>("registration");

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    const savedEvent = getCPRDayEvent();

    setEvent(savedEvent);

    if (savedEvent?.courses.length) {
      setSelectedCourseId(
        savedEvent.courses[0].id,
      );
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshParticipants();
  }, [event, selectedCourseId]);

  const selectedCourse = useMemo(() => {
    if (!event || selectedCourseId === null) {
      return null;
    }

    return (
      event.courses.find(
        (course) =>
          course.id === selectedCourseId,
      ) || null
    );
  }, [event, selectedCourseId]);

  const courseNumber = useMemo(() => {
    if (!event || !selectedCourse) {
      return 0;
    }

    return (
      event.courses.findIndex(
        (course) =>
          course.id === selectedCourse.id,
      ) + 1
    );
  }, [event, selectedCourse]);

  const filteredParticipants = useMemo(() => {
    const query = searchText
      .trim()
      .toLowerCase();

    if (!query) {
      return participants;
    }

    return participants.filter(
      (participant) =>
        participant.fullName
          .toLowerCase()
          .includes(query) ||
        participant.mobile.includes(query) ||
        participant.email
          .toLowerCase()
          .includes(query),
    );
  }, [participants, searchText]);

  const attendedCount = useMemo(() => {
    return participants.filter(
      (participant) =>
        participant.status !== "Registered",
    ).length;
  }, [participants]);

  function refreshParticipants() {
    if (!event || selectedCourseId === null) {
      setParticipants([]);
      return;
    }

    setParticipants(
      getCourseParticipants(
        event.venueId,
        selectedCourseId,
      ),
    );
  }

  async function handleExcelUpload(
    uploadEvent: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      uploadEvent.target.files?.[0];

    uploadEvent.target.value = "";

    if (
      !file ||
      !event ||
      !selectedCourse
    ) {
      return;
    }

    setMessage("Reading the Excel file…");

    try {
      const arrayBuffer =
        await file.arrayBuffer();

      const workbook = XLSX.read(arrayBuffer, {
        type: "array",
      });

      const firstSheetName =
        workbook.SheetNames[0];

      const worksheet =
        workbook.Sheets[firstSheetName];

      const rows = XLSX.utils.sheet_to_json<
        unknown[]
      >(worksheet, {
        header: 1,
        defval: "",
        raw: false,
      });

      const parsedParticipants =
        parseStandardExcel(rows);

      if (parsedParticipants.length === 0) {
        setMessage(
          "No participant records were found. Please check that participant details begin under the standard headings.",
        );
        return;
      }

      if (uploadMode === "attendance") {
        const mobileNumbers =
          parsedParticipants
            .map(
              (participant) =>
                participant.mobile,
            )
            .filter(Boolean);

        const updatedCount =
          confirmAttendanceByMobiles(
            event.venueId,
            selectedCourse.id,
            mobileNumbers,
          );

        refreshParticipants();

        setMessage(
          `${updatedCount} participant attendance record${
            updatedCount === 1 ? "" : "s"
          } updated. Participants not already registered were not added.`,
        );

        return;
      }

      const existingMobiles = new Set(
        getCourseParticipants(
          event.venueId,
          selectedCourse.id,
        ).map((participant) =>
          normalizeMobile(
            participant.mobile,
          ),
        ),
      );

      const uploadedMobiles =
        new Set<string>();

      const validNewParticipants: CPRDayParticipant[] =
        [];

      let skippedRows = 0;

      for (const person of parsedParticipants) {
        const mobile =
          normalizeMobile(person.mobile);

        if (
          !person.fullName ||
          !isValidMobile(mobile)
        ) {
          skippedRows += 1;
          continue;
        }

        if (
          existingMobiles.has(mobile) ||
          uploadedMobiles.has(mobile)
        ) {
          skippedRows += 1;
          continue;
        }

        uploadedMobiles.add(mobile);

        validNewParticipants.push({
          participantId:
            generateParticipantId(),

          venueId: event.venueId,
          courseId: selectedCourse.id,
          registeredAt:
            new Date().toISOString(),

          fullName: person.fullName,
          gender: person.gender,
          mobile,
          email: person.email,
          emailNotAvailable:
            !person.email,

          category: "Not specified",
          otherCategory:
            "Bulk Excel registration",

          status: "Registered",
        });
      }

      if (
        validNewParticipants.length === 0
      ) {
        setMessage(
          "No new valid participants were imported. Records may be incomplete or already registered.",
        );
        return;
      }

      saveParticipantsBulk(
        validNewParticipants,
      );

      refreshParticipants();

      setMessage(
        `${validNewParticipants.length} participant${
          validNewParticipants.length === 1
            ? ""
            : "s"
        } imported successfully.${
          skippedRows > 0
            ? ` ${skippedRows} incomplete or duplicate row${
                skippedRows === 1
                  ? " was"
                  : "s were"
              } skipped.`
            : ""
        }`,
      );
    } catch (error) {
      console.error(error);

      setMessage(
        "The Excel file could not be read. Please use the standard CPR Day participant-registration sheet.",
      );
    }
  }

  function handleDeleteParticipant(
    participant: CPRDayParticipant,
  ) {
    const confirmed = window.confirm(
      `Remove ${participant.fullName} from this course?`,
    );

    if (!confirmed) {
      return;
    }

    removeParticipant(
      participant.participantId,
    );

    refreshParticipants();

    setMessage(
      `${participant.fullName} was removed.`,
    );
  }

  function handleStatusChange(
    participantId: string,
    status: CPRDayParticipant["status"],
  ) {
    updateParticipantStatus(
      participantId,
      status,
    );

    refreshParticipants();
  }

  function exportCurrentParticipants() {
    if (!event || !selectedCourse) {
      return;
    }

    const exportRows = participants.map(
      (participant, index) => ({
        "Sr. No.": index + 1,
        "Name of Participant":
          participant.fullName,
        Gender:
          participant.gender || "",
        "Mobile Number":
          participant.mobile,
        Email:
          participant.email,
        Category:
          participant.category === "Other"
            ? participant.otherCategory
            : participant.category,
        Status:
          participant.status,
        "Participant ID":
          participant.participantId,
      }),
    );

    const worksheet =
      XLSX.utils.json_to_sheet(exportRows);

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Participants",
    );

    const safeCourseCode = (
      selectedCourse.courseCode ||
      `course-${courseNumber}`
    )
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .toLowerCase();

    XLSX.writeFile(
      workbook,
      `cpr-day-${safeCourseCode}-participants.xlsx`,
    );
  }

  function downloadAttendanceSheet() {
    if (!event || !selectedCourse) {
      return;
    }

    const exportRows = participants.map(
      (participant, index) => ({
        "Sr. No.": index + 1,
        "Name of Participant":
          participant.fullName,
        Gender:
          participant.gender || "",
        "Mobile Number":
          participant.mobile,
        Email:
          participant.email,
      }),
    );

    const worksheet =
      XLSX.utils.json_to_sheet(exportRows);

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Attendance",
    );

    XLSX.writeFile(
      workbook,
      `course-${courseNumber}-attendance-sheet.xlsx`,
    );
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <p className="font-bold text-slate-700">
          Loading participant records…
        </p>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-9 text-center shadow-xl">
          <h1 className="text-3xl font-black">
            No event found
          </h1>

          <p className="mt-4 leading-7 text-slate-600">
            Confirm a venue and course before
            managing participants.
          </p>

          <Link
            href="/cprday/register"
            className="mt-7 inline-flex rounded-xl bg-sky-600 px-7 py-4 font-bold text-white"
          >
            Confirm Venue and Courses
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/cprday/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 hover:text-white"
          >
            <span aria-hidden="true">←</span>
            Back to Dashboard
          </Link>

          <p className="mt-8 text-sm font-bold uppercase tracking-[0.22em] text-emerald-300">
            Participant Management
          </p>

          <h1 className="mt-3 text-4xl font-black sm:text-5xl">
            Registration and Attendance
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Register participants individually or
            through the standard Excel sheet, then
            use the same Excel workflow to confirm
            attendance.
          </p>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Course selection */}

          <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <label
                  htmlFor="course"
                  className="block text-sm font-bold"
                >
                  Select course
                </label>

                <select
                  id="course"
                  value={
                    selectedCourseId ?? ""
                  }
                  onChange={(changeEvent) => {
                    setSelectedCourseId(
                      Number(
                        changeEvent.target.value,
                      ),
                    );

                    setMessage("");
                    setSearchText("");
                  }}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                >
                  {event.courses.map(
                    (course, index) => (
                      <option
                        key={course.id}
                        value={course.id}
                      >
                        Course {index + 1}
                        {course.courseCode
                          ? ` — ${course.courseCode}`
                          : " — Course code pending"}
                      </option>
                    ),
                  )}
                </select>
              </div>

              {selectedCourse && (
                <Link
                  href={`/cprday/participant/register/${event.venueId}/${selectedCourse.id}`}
                  className="rounded-xl bg-emerald-700 px-7 py-3.5 text-center font-bold text-white shadow-lg hover:bg-emerald-600"
                >
                  Register One Participant
                </Link>
              )}
            </div>
          </section>

          {/* Import tools */}

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-sky-200 bg-sky-50 p-7">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-700">
                Bulk Registration
              </p>

              <h2 className="mt-3 text-2xl font-black">
                Register participants using Excel
              </h2>

              <p className="mt-3 leading-7 text-slate-600">
                Download the standard sheet, enter
                participant details from row 22
                onwards and upload it for the selected
                course.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a
                  href="/cprday/participant-registration-template.xlsx"
                  download
                  className="rounded-xl border border-sky-300 bg-white px-5 py-3 text-center font-bold text-sky-800 hover:bg-sky-100"
                >
                  Download Standard Excel
                </a>

                <label className="cursor-pointer rounded-xl bg-sky-700 px-5 py-3 text-center font-bold text-white hover:bg-sky-600">
                  Upload Registration Excel

                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={(uploadEvent) => {
                      setUploadMode(
                        "registration",
                      );

                      handleExcelUpload(
                        uploadEvent,
                      );
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-7">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-800">
                Attendance Confirmation
              </p>

              <h2 className="mt-3 text-2xl font-black">
                Confirm attendance using Excel
              </h2>

              <p className="mt-3 leading-7 text-slate-600">
                Download the current participant
                list. Remove those who did not attend,
                then upload the remaining sheet to mark
                them as attended.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={
                    downloadAttendanceSheet
                  }
                  disabled={
                    participants.length === 0
                  }
                  className="rounded-xl border border-amber-300 bg-white px-5 py-3 font-bold text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Download Attendance Excel
                </button>

                <label className="cursor-pointer rounded-xl bg-amber-700 px-5 py-3 text-center font-bold text-white hover:bg-amber-600">
                  Upload Attendance Excel

                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={(uploadEvent) => {
                      setUploadMode(
                        "attendance",
                      );

                      handleExcelUpload(
                        uploadEvent,
                      );
                    }}
                  />
                </label>
              </div>
            </div>
          </section>

          {message && (
            <div
              role="status"
              className="rounded-2xl border border-sky-200 bg-sky-50 px-6 py-4 font-semibold text-sky-900"
            >
              {message}
            </div>
          )}

          {/* Summary */}

          <section className="grid gap-5 sm:grid-cols-3">
            <StatusCard
              label="Registered"
              value={String(
                participants.length,
              )}
            />

            <StatusCard
              label="Attendance Confirmed"
              value={String(attendedCount)}
            />

            <StatusCard
              label="Pending"
              value={String(
                participants.length -
                  attendedCount,
              )}
            />
          </section>

          {/* Participant list */}

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 p-7 sm:p-9">
              <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">
                    Course {courseNumber}
                  </p>

                  <h2 className="mt-2 text-3xl font-black">
                    Participant List
                  </h2>

                  <input
                    type="search"
                    value={searchText}
                    onChange={(searchEvent) =>
                      setSearchText(
                        searchEvent.target.value,
                      )
                    }
                    placeholder="Search by name, mobile or email"
                    className="mt-5 w-full max-w-xl rounded-xl border border-slate-300 bg-white px-4 py-3.5 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <button
                  type="button"
                  onClick={
                    exportCurrentParticipants
                  }
                  disabled={
                    participants.length === 0
                  }
                  className="rounded-xl border border-emerald-300 bg-emerald-50 px-6 py-3.5 font-bold text-emerald-800 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Export Current List
                </button>
              </div>
            </div>

            {filteredParticipants.length ===
            0 ? (
              <div className="p-10 text-center">
                <h3 className="text-xl font-black">
                  No participants found
                </h3>

                <p className="mt-3 text-slate-600">
                  Register an individual participant
                  or upload the standard Excel sheet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                      <th className="px-5 py-4">
                        Sr.
                      </th>
                      <th className="px-5 py-4">
                        Participant
                      </th>
                      <th className="px-5 py-4">
                        Mobile
                      </th>
                      <th className="px-5 py-4">
                        Email
                      </th>
                      <th className="px-5 py-4">
                        Gender
                      </th>
                      <th className="px-5 py-4">
                        Status
                      </th>
                      <th className="px-5 py-4">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredParticipants.map(
                      (
                        participant,
                        index,
                      ) => (
                        <tr
                          key={
                            participant.participantId
                          }
                          className="border-b border-slate-100"
                        >
                          <td className="px-5 py-4">
                            {index + 1}
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-bold">
                              {
                                participant.fullName
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {
                                participant.participantId
                              }
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            {participant.mobile}
                          </td>

                          <td className="px-5 py-4">
                            {participant.email ||
                              "Not available"}
                          </td>

                          <td className="px-5 py-4">
                            {participant.gender ||
                              "—"}
                          </td>

                          <td className="px-5 py-4">
                            <select
                              value={
                                participant.status
                              }
                              onChange={(
                                statusEvent,
                              ) =>
                                handleStatusChange(
                                  participant.participantId,
                                  statusEvent
                                    .target
                                    .value as CPRDayParticipant["status"],
                                )
                              }
                              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold"
                            >
                              <option value="Registered">
                                Registered
                              </option>

                              <option value="Attended">
                                Attended
                              </option>

                              <option value="Hands-on Completed">
                                Hands-on Completed
                              </option>

                              <option value="Certificate Approved">
                                Certificate Approved
                              </option>
                            </select>
                          </td>

                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteParticipant(
                                  participant,
                                )
                              }
                              className="font-bold text-red-700 hover:text-red-600"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function parseStandardExcel(
  rows: unknown[][],
): ParsedExcelParticipant[] {
  const participants: ParsedExcelParticipant[] =
    [];

  /*
   * Your standard Excel template uses:
   * Column B: Serial number
   * Column C: Participant name
   * Column G: Gender
   * Column I: Mobile number
   * Column K: Email
   *
   * Participant rows begin at Excel row 22.
   * Array index 21 therefore represents row 22.
   */

  for (
    let rowIndex = 21;
    rowIndex < rows.length;
    rowIndex += 1
  ) {
    const row = rows[rowIndex] || [];

    const fullName = String(
      row[2] || "",
    ).trim();

    const gender = String(
      row[6] || "",
    ).trim();

    const mobile = normalizeMobile(
      String(row[8] || ""),
    );

    const email = String(
      row[10] || "",
    ).trim();

    if (
      !fullName &&
      !mobile &&
      !email
    ) {
      continue;
    }

    participants.push({
      fullName,
      gender,
      mobile,
      email,
    });
  }

  return participants;
}

function normalizeMobile(
  value: string,
): string {
  const digits = value.replace(/\D/g, "");

  if (
    digits.length === 12 &&
    digits.startsWith("91")
  ) {
    return digits.slice(2);
  }

  return digits.slice(-10);
}

function isValidMobile(
  mobile: string,
): boolean {
  return /^[6-9][0-9]{9}$/.test(mobile);
}

function StatusCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-4xl font-black text-emerald-700">
        {value}
      </p>
    </div>
  );
}