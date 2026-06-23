import { AdminShell } from "@/components/AdminShell";
import {
  addQuestionAction,
  createVocabAction,
  deleteQuestionAction,
  deleteQuestionSetAction,
  publishQuestionSetAction,
  publishVocabSetAction,
  updateQuestionAction,
  updateQuestionSetAction,
} from "@/lib/actions";
import { ConfirmButton } from "@/components/ConfirmButton";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseJsonList } from "@/lib/format";

export default async function AdminQuestionSetsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireUser("admin");
  const params = await searchParams;
  const query = String(params.q ?? "").trim().toLowerCase();
  const [questionSets, vocabSets] = await Promise.all([
    prisma.questionSet.findMany({
      orderBy: { createdAt: "desc" },
      include: { questions: { orderBy: { order: "asc" } } },
    }),
    prisma.vocabSet.findMany({
      orderBy: { createdAt: "desc" },
      include: { items: { orderBy: { word: "asc" } } },
    }),
  ]);
  const filteredQuestionSets = questionSets.filter((set) => {
    if (!query) return true;
    return [set.title, set.description, set.module, set.setType].some((value) => value.toLowerCase().includes(query));
  });
  const filteredVocabSets = vocabSets.filter((set) => {
    if (!query) return true;
    return [set.title, set.description].some((value) => value.toLowerCase().includes(query));
  });

  return (
    <AdminShell username={user.username} title="Question Sets" subtitle="Manage all math tests and VocaQuiz sets in one place.">
      <form action="/admin/question-sets" className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_auto]">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          className="rounded-xl border border-slate-200 px-3 py-2"
          placeholder="Search question sets or vocab sets"
        />
        <button className="rounded-xl bg-blue-700 px-5 py-2 font-black text-white">Search</button>
      </form>
      <section className="space-y-5">
        <h2 className="text-2xl font-black">Question sets</h2>
        {filteredQuestionSets.map((set) => {
          const locked = set.visibility === "secret" || set.hidden || set.setType === "retest";
          return (
            <article key={set.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <form action={updateQuestionSetAction} className="grid gap-3 xl:grid-cols-[1fr_1fr_120px_140px_140px_180px_90px_auto]">
                <input type="hidden" name="id" value={set.id} />
                <input name="title" defaultValue={set.title} className="rounded-xl border border-slate-200 px-3 py-2 font-bold" />
                <input name="description" defaultValue={set.description} className="rounded-xl border border-slate-200 px-3 py-2" />
                <input name="durationMinutes" type="number" defaultValue={set.durationMinutes} className="rounded-xl border border-slate-200 px-3 py-2" />
                <select name="setType" defaultValue={set.setType} className="rounded-xl border border-slate-200 px-3 py-2">
                  <option value="topical">Topical</option>
                  <option value="retest">Retest</option>
                  <option value="full_exam">Full Exam</option>
                </select>
                <select name="visibility" defaultValue={locked ? "secret" : "public"} className="rounded-xl border border-slate-200 px-3 py-2">
                  <option value="public">Public</option>
                  <option value="secret">Secret</option>
                </select>
                <input
                  name="retestPassword"
                  defaultValue={set.retestPassword ?? ""}
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  placeholder="Retest Password"
                />
                <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold">
                  <input name="active" type="checkbox" defaultChecked={set.active} /> Active
                </label>
                <button className="rounded-xl border border-blue-200 px-4 py-2 font-black text-blue-700 hover:bg-blue-50">Save</button>
              </form>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-slate-100 px-3 py-1 font-bold">{set.questions.length} questions</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 font-bold">{set.module.toUpperCase()}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 font-bold">{set.active ? "Published" : "Draft"}</span>
                {locked ? <span className="rounded-full bg-red-50 px-3 py-1 font-black text-red-700">Password protected</span> : null}
                {!set.active ? (
                  <form action={publishQuestionSetAction}>
                    <input type="hidden" name="id" value={set.id} />
                    <button className="rounded-full bg-emerald-600 px-3 py-1 font-black text-white">Publish</button>
                  </form>
                ) : null}
                <form action={deleteQuestionSetAction}>
                  <input type="hidden" name="id" value={set.id} />
                  <ConfirmButton
                    message={`Delete "${set.title}" and all its questions?`}
                    className="rounded-full border border-red-200 bg-white px-3 py-1 font-black text-red-700"
                  >
                    Delete set
                  </ConfirmButton>
                </form>
              </div>

              <div className="mt-5 space-y-3">
                {set.questions.map((question, index) => (
                  <details key={question.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <summary className="cursor-pointer font-black">Q{index + 1}: {(question.text || "Image-only question").slice(0, 120)}</summary>
                    <form action={updateQuestionAction} className="mt-4 grid gap-3">
                      <input type="hidden" name="id" value={question.id} />
                      <input type="hidden" name="existingImageUrl" value={question.imageUrl ?? ""} />
                      <textarea name="text" defaultValue={question.text} className="min-h-24 rounded-xl border border-slate-200 px-3 py-2" placeholder="Question text, or keep blank when an image is attached" />
                      {question.imageUrl ? (
                        <div className="space-y-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={question.imageUrl} alt="Question screenshot" className="max-h-64 rounded-xl border border-slate-200 object-contain" />
                          <label className="flex w-fit items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-bold text-red-700">
                            <input name="removeImage" type="checkbox" />
                            Remove image
                          </label>
                        </div>
                      ) : null}
                      <input name="imageFile" type="file" accept="image/png,image/jpeg,image/webp" className="rounded-xl border border-dashed border-blue-300 bg-blue-50 px-3 py-3 text-sm" />
                      <div className="grid gap-3 md:grid-cols-3">
                        <select name="answerType" defaultValue={question.answerType} className="rounded-xl border border-slate-200 px-3 py-2">
                          <option value="multiple_choice">Multiple choice</option>
                          <option value="numeric">Numeric</option>
                        </select>
                        <select name="difficulty" defaultValue={question.difficulty} className="rounded-xl border border-slate-200 px-3 py-2" required>
                          <option value="easy">Easy</option>
                          <option value="mid">Mid</option>
                          <option value="hard">Hard</option>
                        </select>
                        <input name="correctAnswer" defaultValue={question.correctAnswer} className="rounded-xl border border-slate-200 px-3 py-2" required />
                      </div>
                      <textarea name="choices" defaultValue={parseJsonList(question.choices).join("\n")} className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Choices, one per line" />
                      <input name="topicTags" defaultValue={parseJsonList(question.topicTags).join(", ")} className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Topic tags, optional" />
                      <textarea name="notes" defaultValue={question.notes ?? ""} className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Teacher notes" />
                      <button className="w-fit rounded-xl bg-blue-700 px-4 py-2 font-black text-white">Save question</button>
                    </form>
                    <form action={deleteQuestionAction} className="mt-3">
                      <input type="hidden" name="id" value={question.id} />
                      <ConfirmButton
                        message={`Delete question ${index + 1}?`}
                        className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-black text-red-700"
                      >
                        Delete question
                      </ConfirmButton>
                    </form>
                  </details>
                ))}
              </div>

              <form action={addQuestionAction} className="mt-5 grid gap-3 rounded-xl bg-blue-50 p-4">
                <input type="hidden" name="questionSetId" value={set.id} />
                <textarea name="text" className="min-h-20 rounded-xl border border-slate-200 px-3 py-2" placeholder="New question text, or upload an image below" />
                <input name="imageFile" type="file" accept="image/png,image/jpeg,image/webp" className="rounded-xl border border-dashed border-blue-300 bg-white px-3 py-3 text-sm" />
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
                <button className="w-fit rounded-xl bg-blue-700 px-4 py-2 font-black text-white">Add question</button>
              </form>
            </article>
          );
        })}
        {filteredQuestionSets.length === 0 ? <p className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">No matching question sets.</p> : null}
      </section>

      <section className="mt-8 space-y-5">
        <h2 className="text-2xl font-black">VocaQuiz sets</h2>
        {filteredVocabSets.map((set) => (
          <article key={set.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xl font-black">{set.title}</p>
                <p className="text-sm text-slate-500">{set.items.length} words / {set.active ? "Published" : "Draft"}</p>
              </div>
              {!set.active ? (
                <form action={publishVocabSetAction}>
                  <input type="hidden" name="id" value={set.id} />
                  <button className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white">Publish</button>
                </form>
              ) : null}
            </div>
            <form action={createVocabAction} className="mt-4 grid gap-3 md:grid-cols-2">
              <input type="hidden" name="vocabSetId" value={set.id} />
              <input name="word" className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Word" required />
              <input name="definition" className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Definition" required />
              <input name="aliases" className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Accepted forms, optional: beutiful, beatiful" />
              <button className="w-fit rounded-xl bg-blue-700 px-4 py-2 font-black text-white">Add word</button>
            </form>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {set.items.map((item) => (
                <div key={item.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                  <p className="font-black">{item.word}</p>
                  <p className="text-slate-600">{item.definition}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
        {filteredVocabSets.length === 0 ? <p className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">No matching VocaQuiz sets.</p> : null}
      </section>
    </AdminShell>
  );
}
