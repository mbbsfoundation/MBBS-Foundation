import AttendanceUploadForm from "@/components/cprday/AttendanceUploadForm";
import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

export default async function AttendancePage({
  params,
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;

  const course = await prisma.course.findUnique({
    where: {
      id: venueId,
    },
    include: {
      participantUploads: {
        orderBy: {
          uploadSequence: "desc",
        },
      },
    },
  });

  if (!course) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-5xl px-6 py-10">

        <div className="rounded-2xl bg-white p-8 shadow">

          <h1 className="text-3xl font-bold">
            Attendance Upload
          </h1>

          <p className="mt-2 text-slate-600">
            National IAP CPR Day 2026
          </p>

          <hr className="my-8"/>

          <h2 className="text-xl font-semibold">
            Course Details
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">

            <div>
              <p className="font-semibold">Course Code</p>
              <p>{course.courseCode}</p>
            </div>

            <div>
              <p className="font-semibold">Institution</p>
              <p>{course.title}</p>
            </div>

            <div>
              <p className="font-semibold">Venue</p>
              <p>{course.venueName}</p>
            </div>

            <div>
              <p className="font-semibold">Location</p>
              <p>
                {course.city}, {course.state}
              </p>
            </div>

            <div>
              <p className="font-semibold">Date</p>
              <p>
                {course.courseDate.toLocaleDateString("en-IN")}
              </p>
            </div>

            <div>
              <p className="font-semibold">
                Expected Participants
              </p>
              <p>{course.expectedParticipants ?? "-"}</p>
            </div>

          </div>

          <hr className="my-8"/>


          <AttendanceUploadForm courseId={course.id} />

          <hr className="my-8"/>

          <h2 className="text-xl font-semibold">
            Previous Uploads
          </h2>

          {course.participantUploads.length === 0 ? (
            <p className="mt-5 text-slate-500">
              No attendance sheets uploaded yet.
            </p>
          ) : (

            <table className="mt-5 w-full border">

              <thead className="bg-slate-100">

                <tr>

                  <th className="border p-3">
                    Upload
                  </th>

                  <th className="border p-3">
                    Observer
                  </th>

                  <th className="border p-3">
                    Date
                  </th>

                  <th className="border p-3">
                    Status
                  </th>

                </tr>

              </thead>

              <tbody>

                {course.participantUploads.map((upload) => (

                  <tr key={upload.id}>

                    <td className="border p-3">
                      {upload.uploadSequence}
                    </td>

                    <td className="border p-3">
                      {upload.observerName}
                    </td>

                    <td className="border p-3">
                      {upload.createdAt.toLocaleString("en-IN")}
                    </td>

                    <td className="border p-3">
                      {upload.status}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          )}

          <div className="mt-10">

            <Link
              href="/cprday/my-venues"
              className="font-semibold text-sky-700"
            >
              ← Back to My Venues
            </Link>

          </div>

        </div>

      </section>
    </main>
  );
}