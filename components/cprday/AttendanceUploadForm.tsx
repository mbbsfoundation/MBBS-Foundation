"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type AttendanceUploadFormProps = {
  courseId: string;
};

type UploadResponse = {
  success: boolean;
  message?: string;
};

export default function AttendanceUploadForm({
  courseId,
}: AttendanceUploadFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [observerName, setObserverName] = useState("");
  const [observerMobile, setObserverMobile] = useState("");
  const [observerDesignation, setObserverDesignation] = useState("");
  const [observerAffiliation, setObserverAffiliation] = useState("");
  const [observerEmail, setObserverEmail] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");

    if (
      !observerName.trim() ||
      !observerMobile.trim() ||
      !observerDesignation.trim() ||
      !observerAffiliation.trim() ||
      !observerEmail.trim()
    ) {
      setErrorMessage("Please complete all observer details.");
      return;
    }

    if (!selectedFile) {
      setErrorMessage("Please select an attendance Excel file.");
      return;
    }

    const fileName = selectedFile.name.toLowerCase();

    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      setErrorMessage("Only .xlsx and .xls Excel files are allowed.");
      return;
    }

    const maximumFileSize = 10 * 1024 * 1024;

    if (selectedFile.size > maximumFileSize) {
      setErrorMessage("The selected file must be smaller than 10 MB.");
      return;
    }

    const formData = new FormData();

    formData.append("observerName", observerName.trim());
    formData.append("observerMobile", observerMobile.trim());
    formData.append("observerDesignation", observerDesignation.trim());
    formData.append("observerAffiliation", observerAffiliation.trim());
    formData.append("observerEmail", observerEmail.trim());
    formData.append("file", selectedFile);

    try {
      setIsUploading(true);

      const response = await fetch(
        `/api/cprday/courses/${courseId}/attendance-upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      const result = (await response.json()) as UploadResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Attendance upload could not be completed.",
        );
      }

      setSuccessMessage(
        result.message || "Attendance sheet uploaded successfully.",
      );

      setObserverName("");
      setObserverMobile("");
      setObserverDesignation("");
      setObserverAffiliation("");
      setObserverEmail("");
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Attendance upload failed. Please try again.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section>
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-sky-700">
          Attendance Submission
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-900">
          Observer Details and Excel Upload
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Enter the details of the person who observed or verified the CPR
          training session, then upload the completed official attendance
          sheet.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-7 space-y-6"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="observerName"
              className="block text-sm font-semibold text-slate-800"
            >
              Observer Name
              <span className="ml-1 text-red-600">*</span>
            </label>

            <input
              id="observerName"
              name="observerName"
              type="text"
              required
              value={observerName}
              onChange={(event) => setObserverName(event.target.value)}
              disabled={isUploading}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label
              htmlFor="observerMobile"
              className="block text-sm font-semibold text-slate-800"
            >
              Observer Mobile Number
              <span className="ml-1 text-red-600">*</span>
            </label>

            <input
              id="observerMobile"
              name="observerMobile"
              type="tel"
              inputMode="numeric"
              required
              value={observerMobile}
              onChange={(event) => setObserverMobile(event.target.value)}
              disabled={isUploading}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              placeholder="Enter mobile number"
            />
          </div>

          <div>
            <label
              htmlFor="observerDesignation"
              className="block text-sm font-semibold text-slate-800"
            >
              Observer Designation
              <span className="ml-1 text-red-600">*</span>
            </label>

            <input
              id="observerDesignation"
              name="observerDesignation"
              type="text"
              required
              value={observerDesignation}
              onChange={(event) =>
                setObserverDesignation(event.target.value)
              }
              disabled={isUploading}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              placeholder="For example: Professor, Principal, Medical Officer"
            />
          </div>

          <div>
            <label
              htmlFor="observerAffiliation"
              className="block text-sm font-semibold text-slate-800"
            >
              Observer Affiliation
              <span className="ml-1 text-red-600">*</span>
            </label>

            <input
              id="observerAffiliation"
              name="observerAffiliation"
              type="text"
              required
              value={observerAffiliation}
              onChange={(event) =>
                setObserverAffiliation(event.target.value)
              }
              disabled={isUploading}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              placeholder="Institution or organisation"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="observerEmail"
            className="block text-sm font-semibold text-slate-800"
          >
            Observer Email
            <span className="ml-1 text-red-600">*</span>
          </label>

          <input
            id="observerEmail"
            name="observerEmail"
            type="email"
            required
            value={observerEmail}
            onChange={(event) => setObserverEmail(event.target.value)}
            disabled={isUploading}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            placeholder="observer@example.com"
          />
        </div>

        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
          <label
            htmlFor="attendanceFile"
            className="block text-sm font-semibold text-slate-800"
          >
            Completed Attendance Excel File
            <span className="ml-1 text-red-600">*</span>
          </label>

          <input
            ref={fileInputRef}
            id="attendanceFile"
            name="file"
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            required
            disabled={isUploading}
            onChange={(event) => {
              setSelectedFile(event.target.files?.[0] ?? null);
              setErrorMessage("");
              setSuccessMessage("");
            }}
            className="mt-3 block w-full cursor-pointer rounded-xl border border-slate-300 bg-white text-sm text-slate-700 file:mr-4 file:border-0 file:bg-sky-700 file:px-4 file:py-3 file:font-semibold file:text-white hover:file:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <p className="mt-3 text-xs leading-5 text-slate-500">
            Accepted formats: .xlsx and .xls. Maximum file size: 10 MB.
            Each submission will be saved as a separate upload.
          </p>

          {selectedFile && (
            <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
              <span className="font-semibold">Selected file:</span>{" "}
              {selectedFile.name}
            </div>
          )}
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
          >
            {successMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isUploading}
          className="inline-flex min-w-48 items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isUploading
            ? "Uploading attendance..."
            : "Submit Attendance Sheet"}
        </button>
      </form>
    </section>
  );
}