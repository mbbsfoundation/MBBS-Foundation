"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type ApprovalStatus = "Pending" | "Approved" | "Rejected";

type RoleType =
  | "National Coordinator"
  | "State Coordinator"
  | "Course Coordinator"
  | "CPR Instructor"
  | "CPR Champion";

type ApprovalRequest = {
  id: string;
  fullName: string;
  role: RoleType;
  email: string;
  mobile: string;
  state: string;
  district: string;
  organisation: string;
  registrationDate: string;
  status: ApprovalStatus;
};

const initialRequests: ApprovalRequest[] = [
  {
    id: "APR-2026-001",
    fullName: "Dr Ananya Sharma",
    role: "State Coordinator",
    email: "ananya.sharma@example.org",
    mobile: "9876543210",
    state: "Uttarakhand",
    district: "Dehradun",
    organisation: "Indian Academy of Pediatrics",
    registrationDate: "2026-07-14",
    status: "Pending",
  },
  {
    id: "APR-2026-002",
    fullName: "Dr Rohan Mehta",
    role: "Course Coordinator",
    email: "rohan.mehta@example.org",
    mobile: "9876501234",
    state: "Rajasthan",
    district: "Jaipur",
    organisation: "City Children Hospital",
    registrationDate: "2026-07-14",
    status: "Pending",
  },
  {
    id: "APR-2026-003",
    fullName: "Dr Priya Nair",
    role: "CPR Instructor",
    email: "priya.nair@example.org",
    mobile: "9898989898",
    state: "Kerala",
    district: "Ernakulam",
    organisation: "IAP Kochi Branch",
    registrationDate: "2026-07-13",
    status: "Approved",
  },
  {
    id: "APR-2026-004",
    fullName: "Mr Arjun Verma",
    role: "CPR Champion",
    email: "arjun.verma@example.org",
    mobile: "9811122233",
    state: "Delhi",
    district: "New Delhi",
    organisation: "Community Health Initiative",
    registrationDate: "2026-07-13",
    status: "Rejected",
  },
];

export default function RoleApprovalsPage() {
  const [requests, setRequests] =
    useState<ApprovalRequest[]>(initialRequests);
  const [statusFilter, setStatusFilter] =
    useState<ApprovalStatus | "All">("Pending");
  const [roleFilter, setRoleFilter] = useState<RoleType | "All">("All");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesStatus =
        statusFilter === "All" || request.status === statusFilter;

      const matchesRole =
        roleFilter === "All" || request.role === roleFilter;

      const normalizedSearch = searchTerm.trim().toLowerCase();

      const matchesSearch =
        normalizedSearch.length === 0 ||
        request.fullName.toLowerCase().includes(normalizedSearch) ||
        request.email.toLowerCase().includes(normalizedSearch) ||
        request.mobile.includes(normalizedSearch) ||
        request.state.toLowerCase().includes(normalizedSearch) ||
        request.district.toLowerCase().includes(normalizedSearch) ||
        request.organisation.toLowerCase().includes(normalizedSearch) ||
        request.id.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesRole && matchesSearch;
    });
  }, [requests, roleFilter, searchTerm, statusFilter]);

  const counts = useMemo(() => {
    return {
      pending: requests.filter((request) => request.status === "Pending")
        .length,
      approved: requests.filter((request) => request.status === "Approved")
        .length,
      rejected: requests.filter((request) => request.status === "Rejected")
        .length,
      total: requests.length,
    };
  }, [requests]);

  function updateStatus(id: string, status: ApprovalStatus) {
    setRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === id ? { ...request, status } : request,
      ),
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
                  Administrator Console
                </span>

                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                  Role approval workflow
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Role Approvals
              </h1>

              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                Review governance-role registrations and approve or reject
                access to the CPR Day platform.
              </p>
            </div>

            <Link
              href="/cprday/admin"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Back to Administrator Console
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-10">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Pending"
            value={counts.pending}
            detail="Awaiting Administrator action"
            tone="amber"
          />

          <SummaryCard
            label="Approved"
            value={counts.approved}
            detail="Access granted"
            tone="emerald"
          />

          <SummaryCard
            label="Rejected"
            value={counts.rejected}
            detail="Access not granted"
            tone="red"
          />

          <SummaryCard
            label="Total requests"
            value={counts.total}
            detail="All governance-role requests"
            tone="blue"
          />
        </div>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
            <label className="block">
              <span className="text-sm font-bold text-slate-800">
                Search requests
              </span>

              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name, email, mobile, state or request ID"
                className={inputClassName}
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-800">
                Status
              </span>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as ApprovalStatus | "All",
                  )
                }
                className={inputClassName}
              >
                <option value="All">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-800">Role</span>

              <select
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(event.target.value as RoleType | "All")
                }
                className={inputClassName}
              >
                <option value="All">All roles</option>
                <option value="National Coordinator">
                  National Coordinator
                </option>
                <option value="State Coordinator">State Coordinator</option>
                <option value="Course Coordinator">
                  Course Coordinator
                </option>
                <option value="CPR Instructor">CPR Instructor</option>
                <option value="CPR Champion">CPR Champion</option>
              </select>
            </label>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-700">
                  Registration review
                </p>

                <h2 className="mt-2 text-xl font-bold">
                  Governance Role Requests
                </h2>
              </div>

              <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {filteredRequests.length} displayed
              </span>
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="px-6 py-16 text-center sm:px-8">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                🔎
              </div>

              <h3 className="mt-5 text-lg font-bold">No requests found</h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Change the search term or filters to view other role requests.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredRequests.map((request) => (
                <ApprovalRequestCard
                  key={request.id}
                  request={request}
                  onApprove={() => updateStatus(request.id, "Approved")}
                  onReject={() => updateStatus(request.id, "Rejected")}
                  onRestore={() => updateStatus(request.id, "Pending")}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-3xl border border-blue-200 bg-blue-50 p-6">
          <p className="text-sm font-bold text-blue-950">
            Version 1 demonstration data
          </p>

          <p className="mt-2 text-sm leading-6 text-blue-800">
            This page currently uses sample role requests so the full visible
            approval workflow can be reviewed. The next backend stage can
            replace these records with live registrations from the database.
          </p>
        </section>
      </section>
    </main>
  );
}

function ApprovalRequestCard({
  request,
  onApprove,
  onReject,
  onRestore,
}: {
  request: ApprovalRequest;
  onApprove: () => void;
  onReject: () => void;
  onRestore: () => void;
}) {
  return (
    <article className="px-6 py-7 sm:px-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
              {request.id}
            </span>

            <StatusBadge status={request.status} />

            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              {request.role}
            </span>
          </div>

          <h3 className="mt-4 text-xl font-bold text-slate-950">
            {request.fullName}
          </h3>

          <p className="mt-2 text-sm font-semibold text-slate-700">
            {request.organisation}
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem label="Email" value={request.email} />
            <DetailItem label="Mobile" value={request.mobile} />
            <DetailItem
              label="Location"
              value={`${request.district}, ${request.state}`}
            />
            <DetailItem
              label="Registration date"
              value={formatDisplayDate(request.registrationDate)}
            />
            <DetailItem label="Requested role" value={request.role} />
            <DetailItem label="Current status" value={request.status} />
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:flex-row xl:w-48 xl:flex-col">
          {request.status !== "Approved" ? (
            <button
              type="button"
              onClick={onApprove}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-100"
            >
              Approve
            </button>
          ) : null}

          {request.status !== "Rejected" ? (
            <button
              type="button"
              onClick={onReject}
              className="inline-flex items-center justify-center rounded-xl bg-red-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-100"
            >
              Reject
            </button>
          ) : null}

          {request.status !== "Pending" ? (
            <button
              type="button"
              onClick={onRestore}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Return to pending
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: number;
  detail: string;
  tone: "amber" | "emerald" | "red" | "blue";
}) {
  const toneClasses = {
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    red: "border-red-200 bg-red-50 text-red-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <span
        className={`inline-flex rounded-xl border px-3 py-1 text-xs font-bold uppercase tracking-wide ${toneClasses[tone]}`}
      >
        {label}
      </span>

      <p className="mt-5 text-4xl font-bold tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: ApprovalStatus }) {
  const statusClasses = {
    Pending: "border-amber-200 bg-amber-50 text-amber-800",
    Approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
    Rejected: "border-red-200 bg-red-50 text-red-800",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClasses[status]}`}
    >
      {status}
    </span>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold leading-6 text-slate-900">
        {value}
      </p>
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

const inputClassName =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-red-600 focus:ring-4 focus:ring-red-50";