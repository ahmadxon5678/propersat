"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, ChevronDown, Eraser, Highlighter, MoreHorizontal } from "lucide-react";
import { submitTestAction } from "@/lib/actions";

type Question = {
  id: number;
  text: string;
  answerType: string;
  choices: string[];
  imageUrl: string | null;
};

const letters = ["A", "B", "C", "D", "E", "F"];

export function TestForm({
  liveSessionId,
  durationMinutes,
  questions,
  mode = "topical",
  module = "math",
}: {
  liveSessionId: number;
  durationMinutes: number;
  questions: Question[];
  mode?: string;
  module?: string;
}) {
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [marked, setMarked] = useState<number[]>([]);
  const [eliminated, setEliminated] = useState<Record<number, string[]>>({});
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [highlight, setHighlight] = useState(false);
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const expired = secondsLeft <= 0;
  const current = questions[currentIndex];

  useEffect(() => {
    if (secondsLeft <= 0) {
      formRef.current?.requestSubmit();
      return;
    }
    const timer = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  const answered = useMemo(() => new Set(Object.entries(responses).filter(([, value]) => value).map(([id]) => Number(id))), [responses]);
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  const sectionNumber = module === "ebrw" ? 1 : 2;
  const sectionName = module === "ebrw" ? "Reading and Writing" : "Math";
  const moduleName = mode === "full_exam" ? "Module 1" : mode === "retest" ? "Retest Module" : "Module 1";

  function goToQuestion(index: number) {
    setCurrentIndex(Math.min(Math.max(index, 0), questions.length - 1));
    setNavigatorOpen(false);
  }

  function toggleMarked(id: number) {
    setMarked((items) => (items.includes(id) ? items.filter((item) => item !== id) : [...items, id]));
  }

  function toggleEliminate(questionId: number, choice: string) {
    setEliminated((state) => {
      const currentChoices = state[questionId] ?? [];
      const nextChoices = currentChoices.includes(choice)
        ? currentChoices.filter((item) => item !== choice)
        : [...currentChoices, choice];
      return { ...state, [questionId]: nextChoices };
    });
    setResponses((state) => (state[questionId] === choice ? { ...state, [questionId]: "" } : state));
  }

  function chooseAnswer(questionId: number, choice: string) {
    if (eliminated[questionId]?.includes(choice)) return;
    setResponses((state) => ({ ...state, [questionId]: choice }));
  }

  return (
    <form ref={formRef} action={submitTestAction} className="flex min-h-screen flex-col bg-[#f7f8fa] text-slate-950">
      <input type="hidden" name="liveSessionId" value={liveSessionId} />
      {questions.map((question) => (
        <input key={question.id} type="hidden" name={`question_${question.id}`} value={responses[question.id] ?? ""} />
      ))}

      <header className="grid min-h-16 grid-cols-[1fr_auto_1fr] items-center border-b border-slate-300 bg-white px-5 shadow-sm">
        <div>
          <p className="text-sm font-bold text-slate-700">Section {sectionNumber}, {moduleName}: {sectionName}</p>
        </div>
        <div className={`rounded-md border px-5 py-2 text-lg font-black ${secondsLeft < 60 ? "border-red-300 bg-red-50 text-red-700" : "border-slate-300 bg-white text-slate-950"}`}>
          {minutes}:{seconds}
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setHighlight((value) => !value)}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-md border ${highlight ? "border-yellow-400 bg-yellow-100 text-yellow-800" : "border-slate-300 bg-white text-slate-700"}`}
            aria-label="Highlighter"
            title="Highlighter"
          >
            <Highlighter className="h-5 w-5" />
          </button>
          <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700" aria-label="More options" title="More options">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="grid flex-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_1px_minmax(420px,0.82fr)]">
        <section className="min-h-0 overflow-y-auto bg-white px-8 py-7">
          <div className="mx-auto max-w-3xl">
            <p className="mb-5 text-xs font-black uppercase tracking-wide text-slate-500">{sectionName}</p>
            {current.text ? (
              <div className={`whitespace-pre-wrap text-[1.05rem] leading-8 text-slate-950 ${highlight ? "rounded bg-yellow-100 p-3" : ""}`}>
                {current.text}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-slate-500">Use the image or supporting information below.</p>
            )}
            {current.imageUrl ? (
              <div className="mt-5 overflow-hidden rounded-lg border border-slate-300 bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={current.imageUrl} alt="Question attachment" className="max-h-[62vh] w-full object-contain" />
              </div>
            ) : null}
          </div>
        </section>

        <div className="hidden bg-slate-300 lg:block" />

        <section className="min-h-0 overflow-y-auto bg-[#fbfbfc] px-7 py-7">
          <div className="mx-auto max-w-2xl">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black text-slate-600">Question {currentIndex + 1}</p>
                <p className="text-xs font-semibold text-slate-500">{currentIndex + 1} of {questions.length}</p>
              </div>
              <button
                type="button"
                onClick={() => toggleMarked(current.id)}
                className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-bold ${
                  marked.includes(current.id) ? "border-indigo-700 bg-indigo-50 text-indigo-800" : "border-slate-300 bg-white text-slate-700"
                }`}
              >
                <Bookmark className={`h-4 w-4 ${marked.includes(current.id) ? "fill-indigo-700" : ""}`} />
                Mark for Review
              </button>
            </div>

            <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
              Choose the best answer. You can eliminate choices without selecting them.
            </div>

            <div className="space-y-3">
              {current.answerType === "multiple_choice" ? (
                current.choices.map((choice, index) => {
                  const isEliminated = eliminated[current.id]?.includes(choice) ?? false;
                  const isSelected = responses[current.id] === choice;
                  return (
                    <div
                      key={`${current.id}-${choice}`}
                      className={`grid grid-cols-[1fr_auto] items-stretch rounded-xl border bg-white ${
                        isSelected ? "border-indigo-700 ring-2 ring-indigo-100" : isEliminated ? "border-slate-200 opacity-55" : "border-slate-300"
                      }`}
                    >
                      <button
                        type="button"
                        disabled={expired || isEliminated}
                        onClick={() => chooseAnswer(current.id, choice)}
                        className="flex min-h-16 items-center gap-4 px-4 py-3 text-left disabled:cursor-not-allowed"
                      >
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-black ${isSelected ? "border-indigo-700 bg-indigo-700 text-white" : "border-slate-400 bg-white text-slate-800"}`}>
                          {letters[index] ?? index + 1}
                        </span>
                        <span className={`text-base leading-6 ${isEliminated ? "text-slate-500 line-through" : "text-slate-950"}`}>{choice}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleEliminate(current.id, choice)}
                        className={`m-2 inline-flex h-10 w-10 items-center justify-center rounded-md border text-slate-700 hover:bg-slate-50 ${isEliminated ? "border-slate-400 bg-slate-100" : "border-slate-300 bg-white"}`}
                        aria-label={isEliminated ? "Restore answer choice" : "Eliminate answer choice"}
                        title={isEliminated ? "Restore" : "Eliminate"}
                      >
                        <Eraser className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <label className="block rounded-xl border border-slate-300 bg-white p-5">
                  <span className="text-sm font-black text-slate-700">Student-produced response</span>
                  <input
                    disabled={expired}
                    className="mt-3 w-full rounded-lg border border-slate-300 px-4 py-3 text-lg outline-none focus:border-indigo-700"
                    placeholder="Type your numeric answer"
                    value={responses[current.id] ?? ""}
                    onChange={(event) => setResponses((state) => ({ ...state, [current.id]: event.target.value }))}
                  />
                </label>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-slate-300 bg-white px-5 py-3 shadow-[0_-2px_8px_rgba(15,23,42,0.08)]">
        {navigatorOpen ? (
          <div className="absolute bottom-full left-1/2 mb-3 w-[min(92vw,680px)] -translate-x-1/2 rounded-xl border border-slate-300 bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-black text-slate-700">Question Navigator</p>
              <p className="text-xs text-slate-500">Answered, current, and marked questions are shown.</p>
            </div>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
              {questions.map((question, index) => {
                const currentQuestion = currentIndex === index;
                const isAnswered = answered.has(question.id);
                const isMarked = marked.includes(question.id);
                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => goToQuestion(index)}
                    className={`relative h-11 rounded-md border text-sm font-black ${
                      currentQuestion
                        ? "border-indigo-800 bg-indigo-800 text-white"
                        : isAnswered
                          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                          : "border-slate-300 bg-white text-slate-800"
                    }`}
                  >
                    {index + 1}
                    {isMarked ? <Bookmark className={`absolute right-1 top-1 h-3 w-3 ${currentQuestion ? "fill-white text-white" : "fill-amber-500 text-amber-500"}`} /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <button disabled={expired} className="w-fit rounded-md bg-indigo-900 px-5 py-2 text-sm font-black text-white disabled:bg-slate-400">
            Submit
          </button>
          <button
            type="button"
            onClick={() => setNavigatorOpen((value) => !value)}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-900 hover:bg-slate-50"
          >
            Question {currentIndex + 1} of {questions.length}
            <ChevronDown className={`h-4 w-4 transition-transform ${navigatorOpen ? "rotate-180" : ""}`} />
          </button>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => goToQuestion(currentIndex - 1)}
              className="rounded-md border border-slate-300 bg-white px-5 py-2 text-sm font-black text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="button"
              disabled={currentIndex === questions.length - 1}
              onClick={() => goToQuestion(currentIndex + 1)}
              className="rounded-md bg-indigo-900 px-5 py-2 text-sm font-black text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              Next
            </button>
          </div>
        </div>
      </footer>
    </form>
  );
}
