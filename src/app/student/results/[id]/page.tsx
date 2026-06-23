import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function StudentResultPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("student");
  const { id } = await params;
  const submission = await prisma.submission.findFirst({
    where: { id: Number(id), studentId: user.id },
    include: { liveSession: { include: { questionSet: true } } },
  });

  if (!submission) redirect("/student");

  return (
    <div className="min-h-screen">
      <Header role="Student" username={user.username} />
      <main className="mx-auto max-w-xl px-6 py-10">
        <section className="rounded border bg-white p-6 text-center shadow-sm">
          <h1 className="text-2xl font-semibold">Test submitted</h1>
          <p className="mt-2 text-gray-600">{submission.liveSession.questionSet.title}</p>
          <p className="mt-6 text-5xl font-semibold">
            {submission.score}/{submission.total}
          </p>
          <p className="mt-3 text-sm text-gray-600">Submitted {formatDate(submission.submittedAt)}</p>
          <p className="mt-5 rounded bg-gray-50 p-3 text-sm text-gray-700">
            Correct answers and explanations are hidden. Your teacher can review weak spots.
          </p>
          <Link href="/student" className="mt-5 inline-block rounded bg-gray-900 px-4 py-2 font-medium text-white">
            Back to dashboard
          </Link>
        </section>
      </main>
    </div>
  );
}
