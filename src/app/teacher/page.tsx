import {
  addQuestionAction,
  createQuestionSetAction,
  createStudentAction,
  createVocabAction,
  deleteQuestionAction,
  endSessionAction,
  startSessionAction,
  updateQuestionAction,
  updateQuestionSetAction,
} from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { Header } from "@/components/Header";
import { ConfirmButton } from "@/components/ConfirmButton";
import { prisma } from "@/lib/db";
import { formatDate, parseJsonList } from "@/lib/format";
import { nextFocus, weakTopicsFromAnswers } from "@/lib/analytics";

export default async function TeacherPage() {
  const user = await requireUser("teacher");
  const [students, questionSets, sessions, submissions, vocabItems] = await Promise.all([
    prisma.user.findMany({
      where: { role: "student" },
      orderBy: { username: "asc" },
      include: {
        submissions: {
          include: { answers: { include: { question: true } } },
        },
      },
    }),
    prisma.questionSet.findMany({
      orderBy: { createdAt: "desc" },
      include: { questions: { orderBy: { order: "asc" } } },
    }),
    prisma.liveSession.findMany({
      orderBy: { startedAt: "desc" },
      include: {
        questionSet: true,
        assigned: { include: { student: true } },
        submissions: { include: { student: true } },
      },
    }),
    prisma.submission.findMany({
      orderBy: { submittedAt: "desc" },
      include: {
        student: true,
        liveSession: { include: { questionSet: true } },
        answers: { include: { question: true } },
      },
    }),
    prisma.vocabularyItem.findMany({ orderBy: { word: "asc" } }),
  ]);

  const classWeakTopics = weakTopicsFromAnswers(submissions.flatMap((submission) => submission.answers));

  return (
    <div className="min-h-screen">
      <Header role="Teacher" username={user.username} />
      <main className="mx-auto max-w-7xl space-y-8 px-6 py-6">
        <nav className="flex flex-wrap gap-2 text-sm">
          {["Students", "Question Sets", "Live Sessions", "Results", "Vocabulary"].map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(" ", "-")}`} className="rounded border bg-white px-3 py-2 hover:bg-gray-50">
              {item}
            </a>
          ))}
        </nav>

        <section id="students" className="space-y-4">
          <h1 className="text-2xl font-semibold">Students</h1>
          <form action={createStudentAction} className="grid gap-3 rounded border bg-white p-4 shadow-sm sm:grid-cols-[1fr_1fr_auto]">
            <input name="username" className="rounded border px-3 py-2" placeholder="Username" required />
            <input name="password" className="rounded border px-3 py-2" placeholder="Password" required />
            <button className="rounded bg-gray-900 px-4 py-2 font-medium text-white">Create student</button>
          </form>
          <div className="overflow-x-auto rounded border bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3">Student</th>
                  <th className="p-3">Completed tests</th>
                  <th className="p-3">Weak tags</th>
                  <th className="p-3">Next support</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const weak = weakTopicsFromAnswers(student.submissions.flatMap((submission) => submission.answers));
                  return (
                    <tr key={student.id} className="border-t">
                      <td className="p-3 font-medium">{student.username}</td>
                      <td className="p-3">{student.submissions.length}</td>
                      <td className="p-3">{weak.length ? weak.map((item) => `${item.topic} (${item.misses})`).join(", ") : "None yet"}</td>
                      <td className="p-3">{nextFocus(weak)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section id="question-sets" className="space-y-4">
          <h2 className="text-2xl font-semibold">Question Sets</h2>
          <form action={createQuestionSetAction} className="grid gap-3 rounded border bg-white p-4 shadow-sm md:grid-cols-[1fr_1fr_120px_160px_100px_100px_auto]">
            <input name="title" className="rounded border px-3 py-2" placeholder="Set title" required />
            <input name="description" className="rounded border px-3 py-2" placeholder="Description" />
            <input name="durationMinutes" type="number" min="1" defaultValue={25} className="rounded border px-3 py-2" />
            <input name="retestPassword" className="rounded border px-3 py-2" placeholder="Retest Password" />
            <label className="flex items-center gap-2 text-sm">
              <input name="active" type="checkbox" defaultChecked /> Active
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input name="hidden" type="checkbox" /> Hidden
            </label>
            <button className="rounded bg-gray-900 px-4 py-2 font-medium text-white">Create set</button>
          </form>

          <div className="space-y-5">
            {questionSets.map((set) => (
              <article key={set.id} className="rounded border bg-white p-4 shadow-sm">
                <form action={updateQuestionSetAction} className="grid gap-3 md:grid-cols-[1fr_1fr_110px_160px_90px_90px_auto]">
                  <input type="hidden" name="id" value={set.id} />
                  <input name="title" defaultValue={set.title} className="rounded border px-3 py-2 font-medium" />
                  <input name="description" defaultValue={set.description} className="rounded border px-3 py-2" />
                  <input name="durationMinutes" type="number" defaultValue={set.durationMinutes} className="rounded border px-3 py-2" />
                  <input name="retestPassword" defaultValue={set.retestPassword ?? ""} className="rounded border px-3 py-2" placeholder="Retest Password" />
                  <label className="flex items-center gap-2 text-sm">
                    <input name="active" type="checkbox" defaultChecked={set.active} /> Active
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input name="hidden" type="checkbox" defaultChecked={set.hidden} /> Hidden
                  </label>
                  <button className="rounded border px-3 py-2 text-sm hover:bg-gray-50">Save set</button>
                </form>
                <p className="mt-3 text-sm text-gray-600">
                  Module: {set.module.toUpperCase()} · {set.questions.length} questions · {set.hidden ? "hidden from registered students" : "visible to registered students"}
                </p>

                <div className="mt-4 space-y-3">
                  {set.questions.map((question, index) => (
                    <details key={question.id} className="rounded border p-3">
                      <summary className="cursor-pointer font-medium">Q{index + 1}: {(question.text || "Image-only question").slice(0, 90)}</summary>
                      <form action={updateQuestionAction} className="mt-3 grid gap-3">
                        <input type="hidden" name="id" value={question.id} />
                        <input type="hidden" name="existingImageUrl" value={question.imageUrl ?? ""} />
                        <textarea name="text" defaultValue={question.text} className="min-h-20 rounded border px-3 py-2" />
                        <div className="grid gap-3 md:grid-cols-3">
                          <select name="answerType" defaultValue={question.answerType} className="rounded border px-3 py-2">
                            <option value="multiple_choice">Multiple choice</option>
                            <option value="numeric">Numeric</option>
                          </select>
                          <select name="difficulty" defaultValue={question.difficulty} className="rounded border px-3 py-2" required>
                            <option value="easy">Easy</option>
                            <option value="mid">Mid</option>
                            <option value="hard">Hard</option>
                          </select>
                          <input name="correctAnswer" defaultValue={question.correctAnswer} className="rounded border px-3 py-2" placeholder="Correct answer" />
                        </div>
                        <textarea name="choices" defaultValue={parseJsonList(question.choices).join("\n")} className="min-h-20 rounded border px-3 py-2" placeholder="Choices, one per line" />
                        <textarea name="topicTags" defaultValue={parseJsonList(question.topicTags).join(", ")} className="rounded border px-3 py-2" placeholder="Topic tags, optional" />
                        <input name="imageFile" type="file" accept="image/png,image/jpeg,image/webp" className="rounded border px-3 py-2" />
                        {question.imageUrl ? (
                          <label className="flex w-fit items-center gap-2 rounded border border-red-200 px-3 py-2 text-sm text-red-700">
                            <input name="removeImage" type="checkbox" />
                            Remove image
                          </label>
                        ) : null}
                        <textarea name="notes" defaultValue={question.notes ?? ""} className="rounded border px-3 py-2" placeholder="Teacher notes/explanation" />
                        <div className="flex gap-2">
                          <button className="rounded border px-3 py-2 text-sm hover:bg-gray-50">Save question</button>
                        </div>
                      </form>
                      <form action={deleteQuestionAction} className="mt-2">
                        <input type="hidden" name="id" value={question.id} />
                        <ConfirmButton message={`Delete question ${index + 1}?`} className="rounded border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50">
                          Delete question
                        </ConfirmButton>
                      </form>
                    </details>
                  ))}
                </div>

                <form action={addQuestionAction} className="mt-4 grid gap-3 rounded bg-gray-50 p-3">
                  <input type="hidden" name="questionSetId" value={set.id} />
                  <textarea name="text" className="min-h-20 rounded border px-3 py-2" placeholder="New question text, or upload an image below" />
                  <div className="grid gap-3 md:grid-cols-3">
                    <select name="answerType" className="rounded border px-3 py-2">
                      <option value="multiple_choice">Multiple choice</option>
                      <option value="numeric">Numeric</option>
                    </select>
                    <select name="difficulty" className="rounded border px-3 py-2" required defaultValue="mid">
                      <option value="easy">Easy</option>
                      <option value="mid">Mid</option>
                      <option value="hard">Hard</option>
                    </select>
                    <input name="correctAnswer" className="rounded border px-3 py-2" placeholder="Correct answer" required />
                  </div>
                  <textarea name="choices" className="rounded border px-3 py-2" placeholder="Choices, one per line for multiple choice" />
                  <input name="topicTags" className="rounded border px-3 py-2" placeholder="Topic tags, optional" />
                  <input name="imageFile" type="file" accept="image/png,image/jpeg,image/webp" className="rounded border px-3 py-2" />
                  <textarea name="notes" className="rounded border px-3 py-2" placeholder="Optional teacher notes/explanation" />
                  <button className="w-fit rounded bg-gray-900 px-4 py-2 font-medium text-white">Add question</button>
                </form>
              </article>
            ))}
          </div>
        </section>

        <section id="live-sessions" className="space-y-4">
          <h2 className="text-2xl font-semibold">Live Sessions</h2>
          <form action={startSessionAction} className="rounded border bg-white p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <select name="questionSetId" className="rounded border px-3 py-2" required>
                <option value="">Select active question set</option>
                {questionSets.filter((set) => set.active).map((set) => (
                  <option key={set.id} value={set.id}>{set.title}</option>
                ))}
              </select>
              <button className="rounded bg-gray-900 px-4 py-2 font-medium text-white">Start session</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {students.map((student) => (
                <label key={student.id} className="rounded border px-3 py-2 text-sm">
                  <input name="studentIds" type="checkbox" value={student.id} className="mr-2" />
                  {student.username}
                </label>
              ))}
            </div>
          </form>

          <div className="overflow-x-auto rounded border bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3">Set</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Assigned</th>
                  <th className="p-3">Submitted</th>
                  <th className="p-3">Started</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => {
                  const submitted = new Set(session.submissions.map((submission) => submission.studentId));
                  return (
                    <tr key={session.id} className="border-t">
                      <td className="p-3 font-medium">{session.questionSet.title}</td>
                      <td className="p-3">{session.status}</td>
                      <td className="p-3">{session.assigned.map((item) => item.student.username).join(", ")}</td>
                      <td className="p-3">
                        {session.assigned.map((item) => `${item.student.username}: ${submitted.has(item.studentId) ? "submitted" : "not yet"}`).join(", ")}
                      </td>
                      <td className="p-3">{formatDate(session.startedAt)}</td>
                      <td className="p-3">
                        {session.status === "ACTIVE" ? (
                          <form action={endSessionAction}>
                            <input type="hidden" name="id" value={session.id} />
                            <button className="rounded border px-3 py-2 text-sm hover:bg-gray-50">End</button>
                          </form>
                        ) : "Closed"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section id="results" className="space-y-4">
          <h2 className="text-2xl font-semibold">Results / Weak Spots</h2>
          <div className="rounded border bg-white p-4 shadow-sm">
            <h3 className="font-semibold">Class-wide next focus</h3>
            <p className="mt-1">{nextFocus(classWeakTopics)}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              {classWeakTopics.map((item) => (
                <span key={item.topic} className="rounded bg-gray-100 px-3 py-1">
                  {item.topic}: {item.misses}/{item.attempts} missed
                </span>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto rounded border bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3">Student</th>
                  <th className="p-3">Session</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Missed tags</th>
                  <th className="p-3">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => {
                  const weak = weakTopicsFromAnswers(submission.answers);
                  return (
                    <tr key={submission.id} className="border-t">
                      <td className="p-3 font-medium">{submission.student.username}</td>
                      <td className="p-3">{submission.liveSession.questionSet.title}</td>
                      <td className="p-3">{submission.score}/{submission.total}</td>
                      <td className="p-3">{weak.length ? weak.map((item) => `${item.topic} (${item.misses})`).join(", ") : "None"}</td>
                      <td className="p-3">{formatDate(submission.submittedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section id="vocabulary" className="space-y-4">
          <h2 className="text-2xl font-semibold">Vocabulary</h2>
          <form action={createVocabAction} className="grid gap-3 rounded border bg-white p-4 shadow-sm md:grid-cols-2">
            <input name="word" className="rounded border px-3 py-2" placeholder="Word" required />
            <input name="definition" className="rounded border px-3 py-2" placeholder="Definition" required />
            <input name="aliases" className="rounded border px-3 py-2" placeholder="Accepted aliases/forms, comma-separated" />
            <button className="w-fit rounded bg-gray-900 px-4 py-2 font-medium text-white">Add vocabulary</button>
          </form>
          <div className="grid gap-2 md:grid-cols-2">
            {vocabItems.map((item) => (
              <div key={item.id} className="rounded border bg-white p-3 text-sm">
                <span className="font-semibold">{item.word}</span> · {item.definition}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
