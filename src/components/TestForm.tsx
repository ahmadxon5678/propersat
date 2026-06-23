"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { submitTestAction } from "@/lib/actions";

type Question = {
  id: number;
  text: string;
  answerType: string;
  choices: string[];
  imageUrl: string | null;
};

export function TestForm({
  liveSessionId,
  durationMinutes,
  questions,
  mode = "topical",
}: {
  liveSessionId: number;
  durationMinutes: number;
  questions: Question[];
  mode?: string;
}) {
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flagged, setFlagged] = useState<number[]>([]);
  const [eliminated, setEliminated] = useState<Record<number, string[]>>({});
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [highlight, setHighlight] = useState(false);
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

  function toggleFlag(id: number) {
    setFlagged((items) => (items.includes(id) ? items.filter((item) => item !== id) : [...items, id]));
  }

  function toggleEliminate(questionId: number, choice: string) {
    setEliminated((state) => {
      const currentChoices = state[questionId] ?? [];
      return {
        ...state,
        [questionId]: currentChoices.includes(choice)
          ? currentChoices.filter((item) => item !== choice)
          : [...currentChoices, choice],
      };
    });
  }

  return (
    <form ref={formRef} action={submitTestAction} className="grid gap-5 lg:grid-cols-[220px_1fr]">
      <input type="hidden" name="liveSessionId" value={liveSessionId} />
      {questions.map((question) => (
        <input key={question.id} type="hidden" name={`question_${question.id}`} value={responses[question.id] ?? ""} />
      ))}

      <aside className="app-card h-fit p-4 lg:sticky lg:top-4">
        <div className="rounded-lg bg-blue-950 p-4 text-white">
          <p className="text-xs uppercase tracking-wide text-blue-200">{mode === "full_exam" ? "Full Exam" : "Math Practice"}</p>
          <p className="mt-1 text-3xl font-bold">
            {minutes}:{seconds}
          </p>
        </div>
        <div className="mt-4 grid grid-cols-5 gap-2">
          {questions.map((question, index) => (
            <button
              key={question.id}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={`h-9 rounded-lg border text-sm font-semibold ${
              currentIndex === index
                ? "border-blue-900 bg-blue-900 text-white"
                : answered.has(question.id)
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : flagged.includes(question.id)
                    ? "border-amber-300 bg-amber-50 text-amber-800"
                    : "border-blue-200 bg-white text-blue-950 hover:bg-blue-50"
              }`}
              aria-label={`Go to question ${index + 1}`}
            >
              {index + 1}
            </button>
          ))}
        </div>
        <button disabled={expired} className="btn-primary mt-4 w-full px-4 py-2 disabled:bg-slate-400">
          Submit
        </button>
        {expired ? <p className="mt-3 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">Time expired. Submitting.</p> : null}
      </aside>

      <section className="app-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-100 bg-blue-50 px-5 py-4">
          <p className="font-bold text-blue-950">
            Question {currentIndex + 1} of {questions.length}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => toggleFlag(current.id)}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                flagged.includes(current.id) ? "border-amber-300 bg-amber-100 text-amber-900" : "border-blue-200 bg-white text-blue-950"
              }`}
            >
              {flagged.includes(current.id) ? "Flagged" : "Flag"}
            </button>
            <button
              type="button"
              onClick={() => setHighlight((value) => !value)}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                highlight ? "border-sky-300 bg-sky-100 text-sky-900" : "border-blue-200 bg-white text-blue-950"
              }`}
            >
              Highlighter
            </button>
          </div>
        </div>

        <div className="p-5">
          <p className={`whitespace-pre-wrap text-lg leading-8 ${highlight ? "rounded bg-yellow-100 p-2" : ""}`}>{current.text}</p>
          {current.imageUrl ? (
            <div className="mt-4 overflow-hidden rounded-lg border border-blue-100 bg-slate-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={current.imageUrl} alt="Question attachment" className="max-h-[420px] w-full object-contain" />
            </div>
          ) : null}

          <div className="mt-6 space-y-3">
            {current.answerType === "multiple_choice" ? (
              current.choices.map((choice) => {
                const isEliminated = eliminated[current.id]?.includes(choice);
                return (
                  <div key={choice} className="flex gap-2">
                    <label
                      className={`flex flex-1 gap-3 rounded-lg border p-3 ${
                        isEliminated ? "border-slate-200 bg-slate-50 text-slate-400 line-through" : "border-blue-200 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`visible_question_${current.id}`}
                        value={choice}
                        checked={responses[current.id] === choice}
                        disabled={expired || isEliminated}
                        onChange={() => setResponses((state) => ({ ...state, [current.id]: choice }))}
                      />
                      <span>{choice}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleEliminate(current.id, choice)}
                      className="w-11 rounded-lg border border-blue-200 text-sm font-bold text-blue-950 hover:bg-blue-50"
                      aria-label={isEliminated ? "Restore choice" : "Eliminate choice"}
                    >
                      {isEliminated ? "+" : "-"}
                    </button>
                  </div>
                );
              })
            ) : (
              <input
                name={`question_${current.id}`}
                disabled={expired}
                className="w-full rounded-lg border border-blue-200 px-3 py-3"
                placeholder="Type your numeric answer"
                value={responses[current.id] ?? ""}
                onChange={(event) => setResponses((state) => ({ ...state, [current.id]: event.target.value }))}
              />
            )}
          </div>

          <div className="mt-8 flex justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))}
              className="rounded-lg border border-blue-200 px-4 py-2 font-semibold text-blue-950 hover:bg-blue-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setCurrentIndex((value) => Math.min(questions.length - 1, value + 1))}
              className="rounded-lg border border-blue-200 px-4 py-2 font-semibold text-blue-950 hover:bg-blue-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </form>
  );
}
