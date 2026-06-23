import { redirect } from "next/navigation";
import { TestForm } from "@/components/TestForm";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseJsonList } from "@/lib/format";

export default async function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("student");
  const { id } = await params;
  const liveSessionId = Number(id);

  const session = await prisma.liveSession.findFirst({
    where: {
      id: liveSessionId,
      status: "ACTIVE",
      assigned: { some: { studentId: user.id } },
    },
    include: {
      questionSet: { include: { questions: { orderBy: { order: "asc" } } } },
      submissions: { where: { studentId: user.id } },
    },
  });

  if (!session || session.submissions.length > 0) redirect("/student");

  return (
    <TestForm
      liveSessionId={session.id}
      durationMinutes={session.questionSet.durationMinutes}
      mode={session.questionSet.setType}
      module={session.questionSet.module}
      questions={session.questionSet.questions.map((question) => ({
        id: question.id,
        text: question.text,
        answerType: question.answerType,
        choices: parseJsonList(question.choices),
        imageUrl: question.imageUrl,
      }))}
    />
  );
}
