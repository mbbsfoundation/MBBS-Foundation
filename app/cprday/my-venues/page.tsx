import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  COORDINATOR_SESSION_COOKIE,
  verifyCoordinatorSessionToken,
} from "@/lib/cprday/auth";
import { prisma } from "@/lib/prisma";

export default async function MyVenuesPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(
    COORDINATOR_SESSION_COOKIE,
  )?.value;

  if (!sessionToken) {
    redirect("/cprday/login");
  }

  const session = await verifyCoordinatorSessionToken(sessionToken);

  if (!session) {
    redirect("/cprday/login");
  }

  const coordinator = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
    select: {
      fullName: true,
      email: true,
    },
  });

  if (!coordinator) {
    redirect("/cprday/login");
  }

  const venues = await prisma.course.findMany({
    where: {
      teamMembers: {
        some: {
          userId: session.userId,
          teamRole: "COURSE_COORDINATOR",
          status: "ACCEPTED",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-sky-700">
              National IAP CPR Day 2026
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              My Venues
            </h1>

            <p className="mt-2 text-slate-600">
              Welcome, {coordinator.fullName}
            </p>
          </div>

          <Link
            href="/cprday/create-venue"
            className="inline-flex items-center justify-center rounded-xl bg-sky-700 px-5 py-3 font-semibold text-white transition hover:bg-sky-800"
          >
            + Create New Venue
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        {venues.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-2xl">
              📍
            </div>

            <h2 className="mt-5 text-2xl font-bold text-slate-900">
              No venues created yet
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-slate-600">
              Create your CPR Day venue and enter the training session
              details. You can then download and upload the attendance sheet
              from this page.
            </p>

            <Link
              href="/cprday/create-venue"
              className="mt-7 inline-flex items-center justify-center rounded-xl bg-sky-700 px-6 py-3 font-semibold text-white transition hover:bg-sky-800"
            >
              Create Your First Venue
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {venues.map((venue) => (
              <article
                key={venue.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-sky-700">
                      {venue.courseCode}
                    </p>

                    <h2 className="mt-1 text-xl font-bold text-slate-900">
                      {venue.venueName}
                    </h2>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {venue.status}
                  </span>
                </div>

                <div className="mt-5 space-y-2 text-sm text-slate-600">
                  <p>
                    <span className="font-semibold text-slate-800">
                      Institution:
                    </span>{" "}
                    {venue.title}
                  </p>

                  <p>
                    <span className="font-semibold text-slate-800">
                      Location:
                    </span>{" "}
                    {venue.city}, {venue.state}
                  </p>

                  <p>
                    <span className="font-semibold text-slate-800">
                      Date:
                    </span>{" "}
                    {venue.courseDate.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>

                  {venue.expectedParticipants && (
                    <p>
                      <span className="font-semibold text-slate-800">
                        Expected participants:
                      </span>{" "}
                      {venue.expectedParticipants}
                    </p>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
  


  <Link
    href={`/cprday/my-venues/${venue.id}/attendance`}
    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
  >
    Upload Attendance
  </Link>
</div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link
            href="/cprday"
            className="text-sm font-semibold text-sky-700 hover:text-sky-800"
          >
            ← Return to CPR Day Portal
          </Link>
        </div>
      </section>
    </main>
  );
}