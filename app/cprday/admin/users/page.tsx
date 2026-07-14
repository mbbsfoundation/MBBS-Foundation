"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type UserRole =
  | "Administrator"
  | "National Coordinator"
  | "State Coordinator"
  | "Course Coordinator"
  | "CPR Instructor"
  | "CPR Champion";

type AccountStatus = "Active" | "Pending" | "Suspended";

type PlatformUser = {
  id: string;
  fullName: string;
  role: UserRole;
  email: string;
  mobile: string;
  state: string;
  district: string;
  organisation: string;
  joinedDate: string;
  status: AccountStatus;
  lastLogin: string;
};

const initialUsers: PlatformUser[] = [
  {
    id: "USR-2026-001",
    fullName: "Dr Lokesh Tiwari",
    role: "Administrator",
    email: "administrator@example.org",
    mobile: "9876543210",
    state: "Uttarakhand",
    district: "Dehradun",
    organisation: "Indian Academy of Pediatrics",
    joinedDate: "2026-07-10",
    status: "Active",
    lastLogin: "2026-07-15T00:10:00",
  },
  {
    id: "USR-2026-002",
    fullName: "Dr Ananya Sharma",
    role: "State Coordinator",
    email: "ananya.sharma@example.org",
    mobile: "9876500001",
    state: "Uttarakhand",
    district: "Dehradun",
    organisation: "IAP Uttarakhand",
    joinedDate: "2026-07-12",
    status: "Active",
    lastLogin: "2026-07-14T18:30:00",
  },
  {
    id: "USR-2026-003",
    fullName: "Dr Rohan Mehta",
    role: "Course Coordinator",
    email: "rohan.mehta@example.org",
    mobile: "9876500002",
    state: "Rajasthan",
    district: "Jaipur",
    organisation: "City Children Hospital",
    joinedDate: "2026-07-13",
    status: "Pending",
    lastLogin: "",
  },
  {
    id: "USR-2026-004",
    fullName: "Dr Priya Nair",
    role: "CPR Instructor",
    email: "priya.nair@example.org",
    mobile: "9876500003",
    state: "Kerala",
    district: "Ernakulam",
    organisation: "IAP Kochi Branch",
    joinedDate: "2026-07-13",
    status: "Active",
    lastLogin: "2026-07-14T21:15:00",
  },
  {
    id: "USR-2026-005",
    fullName: "Mr Arjun Verma",
    role: "CPR Champion",
    email: "arjun.verma@example.org",
    mobile: "9876500004",
    state: "Delhi",
    district: "New Delhi",
    organisation: "Community Health Initiative",
    joinedDate: "2026-07-13",
    status: "Suspended",
    lastLogin: "2026-07-13T14:00:00",
  },
  {
    id: "USR-2026-006",
    fullName: "Dr Meera Joshi",
    role: "National Coordinator",
    email: "meera.joshi@example.org",
    mobile: "9876500005",
    state: "Maharashtra",
    district: "Mumbai",
    organisation: "Indian Academy of Pediatrics",
    joinedDate: "2026-07-11",
    status: "Active",
    lastLogin: "2026-07-14T23:20:00",
  },
];

export default function UserManagementPage() {
  const [users, setUsers] = useState<PlatformUser[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "All">("All");
  const [statusFilter, setStatusFilter] =
    useState<AccountStatus | "All">("All");

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole =
        roleFilter === "All" || user.role === roleFilter;

      const matchesStatus =
        statusFilter === "All" || user.status === statusFilter;

      const matchesSearch =
        normalizedSearch.length === 0 ||
        user.fullName.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch) ||
        user.mobile.includes(normalizedSearch) ||
        user.state.toLowerCase().includes(normalizedSearch) ||
        user.district.toLowerCase().includes(normalizedSearch) ||
        user.organisation.toLowerCase().includes(normalizedSearch) ||
        user.id.toLowerCase().includes(normalizedSearch);

      return matchesRole && matchesStatus && matchesSearch;
    });
  }, [roleFilter, searchTerm, statusFilter, users]);

  const summary = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((user) => user.status === "Active").length,
      pending: users.filter((user) => user.status === "Pending").length,
      suspended: users.filter((user) => user.status === "Suspended").length,
    };
  }, [users]);

  function updateStatus(userId: string, status: AccountStatus) {
    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === userId ? { ...user, status } : user,
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

                <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                  Access and accounts
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                User Management
              </h1>

              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                Review platform users, governance roles, account status and
                access readiness.
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
            label="Total users"
            value={summary.total}
            detail="All governance accounts"
            tone="blue"
          />

          <SummaryCard
            label="Active"
            value={summary.active}
            detail="Accounts with platform access"
            tone="emerald"
          />

          <SummaryCard
            label="Pending"
            value={summary.pending}
            detail="Awaiting activation"
            tone="amber"
          />

          <SummaryCard
            label="Suspended"
            value={summary.suspended}
            detail="Access temporarily blocked"
            tone="red"
          />
        </div>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_230px_220px]">
            <label className="block">
              <span className="text-sm font-bold text-slate-800">
                Search users
              </span>

              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name, email, mobile, state or user ID"
                className={inputClassName}
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-800">
                Filter by role
              </span>

              <select
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(event.target.value as UserRole | "All")
                }
                className={inputClassName}
              >
                <option value="All">All roles</option>
                <option value="Administrator">Administrator</option>
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

            <label className="block">
              <span className="text-sm font-bold text-slate-800">
                Account status
              </span>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as AccountStatus | "All",
                  )
                }
                className={inputClassName}
              >
                <option value="All">All statuses</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Suspended">Suspended</option>
              </select>
            </label>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-700">
                  Platform accounts
                </p>

                <h2 className="mt-2 text-xl font-bold">
                  Registered Governance Users
                </h2>
              </div>

              <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {filteredUsers.length} displayed
              </span>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="px-6 py-16 text-center sm:px-8">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                👤
              </div>

              <h3 className="mt-5 text-lg font-bold">No users found</h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Change the search term or filters to display other users.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredUsers.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onActivate={() => updateStatus(user.id, "Active")}
                  onSuspend={() => updateStatus(user.id, "Suspended")}
                  onSetPending={() => updateStatus(user.id, "Pending")}
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
            These records are currently sample users for reviewing the visible
            Administrator workflow. Live authentication and database accounts
            can replace them during backend integration.
          </p>
        </section>
      </section>
    </main>
  );
}

function UserCard({
  user,
  onActivate,
  onSuspend,
  onSetPending,
}: {
  user: PlatformUser;
  onActivate: () => void;
  onSuspend: () => void;
  onSetPending: () => void;
}) {
  return (
    <article className="px-6 py-7 sm:px-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-5 sm:flex-row">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-lg font-bold text-white">
            {getInitials(user.fullName)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                {user.id}
              </span>

              <AccountStatusBadge status={user.status} />

              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                {user.role}
              </span>
            </div>

            <h3 className="mt-4 text-xl font-bold text-slate-950">
              {user.fullName}
            </h3>

            <p className="mt-2 text-sm font-semibold text-slate-700">
              {user.organisation}
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem label="Email" value={user.email} />
              <DetailItem label="Mobile" value={user.mobile} />
              <DetailItem
                label="Location"
                value={`${user.district}, ${user.state}`}
              />
              <DetailItem
                label="Joined"
                value={formatDisplayDate(user.joinedDate)}
              />
              <DetailItem
                label="Last login"
                value={
                  user.lastLogin
                    ? formatDateTime(user.lastLogin)
                    : "Not signed in yet"
                }
              />
              <DetailItem label="Account status" value={user.status} />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:flex-row xl:w-48 xl:flex-col">
          {user.status !== "Active" ? (
            <button
              type="button"
              onClick={onActivate}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-100"
            >
              Activate account
            </button>
          ) : null}

          {user.status !== "Suspended" &&
          user.role !== "Administrator" ? (
            <button
              type="button"
              onClick={onSuspend}
              className="inline-flex items-center justify-center rounded-xl bg-red-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-100"
            >
              Suspend access
            </button>
          ) : null}

          {user.status !== "Pending" &&
          user.role !== "Administrator" ? (
            <button
              type="button"
              onClick={onSetPending}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Set as pending
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
  tone: "blue" | "emerald" | "amber" | "red";
}) {
  const toneClasses = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
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

function AccountStatusBadge({ status }: { status: AccountStatus }) {
  const classes = {
    Active: "border-emerald-200 bg-emerald-50 text-emerald-800",
    Pending: "border-amber-200 bg-amber-50 text-amber-800",
    Suspended: "border-red-200 bg-red-50 text-red-800",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-bold ${classes[status]}`}
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

function getInitials(fullName: string) {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
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

function formatDateTime(dateValue: string) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

const inputClassName =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-red-600 focus:ring-4 focus:ring-red-50";