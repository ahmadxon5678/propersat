import { EyeOff, FileQuestion } from "lucide-react";
import {
  addQuestionAction,
  createQuestionSetAction,
  deleteQuestionSetAction,
  publishQuestionSetAction,
} from "@/lib/actions";
import { prisma } from "@/lib/db";
import { ConfirmButton } from "./ConfirmButton";

export async function AdminTestMaker({
  module,
  title,
  subtitle,
}: {
  module: "math" | "ebrw";
  title: string;
  subtitle: string;
}) {
  const questionSets = await prisma.questionSet.findMany({
    where: { module },
    orderBy: { createdAt: "desc" },
    include: { questions: { orderBy: { order: "asc" } } },
  });

  return (
    <>
      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <form action={createQuestionSetAction} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <input type="hidden" name="module" value={module} />
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-700"><FileQuestion className="h-5 w-5" /></div>
            <h2 className="text-xl font-black">Create {title} draft</h2>
          </div>
          <div className="mt-5 space-y-3">
            <input name="title" className="w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="Set title" required />
            <textarea name="description" className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="Description" />
            <div className="grid gap-3 md:grid-cols-3">
              <select name="setType" className="rounded-xl border border-slate-200 px-3 py-2" defaultValue="topical">
                <option value="topical">Topical</option>
                <option value="retest">Retest</option>
                <option value="full_exam">Full Exam</option>
              </select>
              <select name="visibility" className="rounded-xl border border-slate-200 px-3 py-2" defaultValue="public">
                <option value="public">Public</option>
                <option value="secret">Secret/password</option>
              </select>
              <input name="durationMinutes" type="number" min="1" defaultValue={25} className="rounded-xl border border-slate-200 px-3 py-2" />
            </div>
            <label className="block text-sm font-bold text-slate-600">
              Retest Password
              <input
                name="retestPassword"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                placeholder="Enter password students will use for retest"
              />
            </label>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
              <input name="publish" type="checkbox" />
              Publish immediately
            </label>
            <button className="rounded-xl bg-blue-700 px-5 py-2 font-black text-white hover:bg-blue-800">Create set</button>
          </div>
        </form>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Add question</h2>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          <form action={addQuestionAction} className="mt-5 grid gap-3">
            <select name="questionSetId" className="rounded-xl border border-slate-200 px-3 py-2" required>
              <option value="">Choose set</option>
              {questionSets.map((set) => (
                <option key={set.id} value={set.id}>{set.title}</option>
              ))}
            </select>
            <textarea name="text" className="min-h-24 rounded-xl border border-slate-200 px-3 py-2" placeholder="Question text, or upload an image below" />
            <input name="imageFile" type="file" accept="image/png,image/jpeg,image/webp" className="rounded-xl border border-dashed border-blue-300 bg-blue-50 px-3 py-3 text-sm" />
            <div className="grid gap-3 md:grid-cols-3">
              <select name="answerType" className="rounded-xl border border-slate-200 px-3 py-2">
                <option value="multiple_choice">Multiple choice</option>
                <option value="numeric">Numeric</option>
              </select>
              <select name="difficulty" className="rounded-xl border border-slate-200 px-3 py-2" required defaultValue="mid">
                <option value="easy">Easy</option>
                <option value="mid">Mid</option>
                <option value="hard">Hard</option>
              </select>
              <input name="correctAnswer" className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Correct answer" required />
            </div>
            <textarea name="choices" className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Choices, one per line" />
            <input name="topicTags" className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Topic tags, optional" />
            <textarea name="notes" className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Teacher notes, optional" />
            <button className="rounded-xl bg-blue-700 px-5 py-2 font-black text-white hover:bg-blue-800 md:w-fit">Add question</button>
          </form>
        </div>
      </section>

      <section className="mt-6 space-y-4">
        <h2 className="text-2xl font-black">Sets made</h2>
        {questionSets.map((set) => {
          const locked = set.visibility === "secret" || set.hidden || set.setType === "retest";
          return (
            <article key={set.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xl font-black">{set.title}</p>
                  <p className="text-sm text-slate-500">
                    {set.questions.length} questions / {set.durationMinutes} min / {set.setType.replace("_", " ")} / {set.active ? "Published" : "Draft"}
                  </p>
                  {locked ? <p className="mt-2 text-sm font-black text-red-700">Retest/password protected</p> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {!set.active ? (
                    <form action={publishQuestionSetAction}>
                      <input type="hidden" name="id" value={set.id} />
                      <button className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white">Publish</button>
                    </form>
                  ) : (
                    <span className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700">Published</span>
                  )}
                  <form action={deleteQuestionSetAction}>
                    <input type="hidden" name="id" value={set.id} />
                    <ConfirmButton
                      message={`Delete "${set.title}" and all its questions?`}
                      className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-black text-red-700"
                    >
                      Delete set
                    </ConfirmButton>
                  </form>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {set.questions.slice(0, 6).map((question, index) => (
                  <div key={question.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                    <p className="font-black">Q{index + 1}: {question.text || "Image-only question"}</p>
                    <p className="mt-1 text-slate-500">Difficulty: {question.difficulty}</p>
                    {question.imageUrl ? <p className="mt-1 text-blue-700">Screenshot attached</p> : null}
                  </div>
                ))}
                {set.questions.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                    <EyeOff className="h-4 w-4" /> No questions added yet.
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
        {questionSets.length === 0 ? <p className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">No sets yet.</p> : null}
      </section>
    </>
  );
}
