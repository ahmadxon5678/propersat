"use client";

import { useActionState, useMemo, useState } from "react";
import { submitVocabAction } from "@/lib/actions";

type VocabItem = {
  id: number;
  word: string;
  definition: string;
};

export function VocabPractice({ items }: { items: VocabItem[] }) {
  const [mode, setMode] = useState<"flashcards" | "typed">("flashcards");
  const [queue, setQueue] = useState(() => items.map((item) => item.id));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [state, action, pending] = useActionState(submitVocabAction, { message: "", correct: false, close: false });

  const queueItems = useMemo(() => queue.map((id) => items.find((item) => item.id === id)).filter(Boolean) as VocabItem[], [items, queue]);
  const item = mode === "flashcards" ? queueItems[index] : items[index];
  const key = useMemo(() => `${item?.id}-${index}-${state?.message}`, [item?.id, index, state?.message]);

  if (items.length === 0) return <p className="app-card p-5">No vocabulary items yet.</p>;

  function nextTyped() {
    setIndex((value) => (value + 1) % items.length);
  }

  function markKnown() {
    if (!item) return;
    const nextQueue = queue.filter((id) => id !== item.id);
    setQueue(nextQueue);
    setIndex((value) => (nextQueue.length === 0 ? 0 : Math.min(value, nextQueue.length - 1)));
    setFlipped(false);
  }

  function markUnknown() {
    if (!item) return;
    const withoutCurrent = queue.filter((id) => id !== item.id);
    const nextQueue = [...withoutCurrent, item.id];
    setQueue(nextQueue);
    setIndex((value) => Math.min(value, nextQueue.length - 1));
    setFlipped(false);
  }

  function resetFlashcards() {
    setQueue(items.map((vocabItem) => vocabItem.id));
    setIndex(0);
    setFlipped(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setMode("flashcards");
            setIndex(0);
          }}
          className={`rounded-lg px-4 py-2 text-sm font-bold ${mode === "flashcards" ? "bg-blue-900 text-white" : "border border-blue-200 bg-white text-blue-950"}`}
        >
          Flashcards
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("typed");
            setIndex(0);
          }}
          className={`rounded-lg px-4 py-2 text-sm font-bold ${mode === "typed" ? "bg-blue-900 text-white" : "border border-blue-200 bg-white text-blue-950"}`}
        >
          Typed answer
        </button>
      </div>

      {mode === "flashcards" ? (
        <div className="app-card p-5">
          {queueItems.length === 0 ? (
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-950">Set complete</p>
              <p className="mt-2 text-slate-600">All cards were marked known in this session.</p>
              <button type="button" onClick={resetFlashcards} className="btn-primary mt-5 px-4 py-2">
                Practice again
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-blue-700">
                  {index + 1}/{queueItems.length} in current queue
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIndex((value) => Math.max(0, value - 1));
                      setFlipped(false);
                    }}
                    className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-950"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIndex((value) => Math.min(queueItems.length - 1, value + 1));
                      setFlipped(false);
                    }}
                    className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-950"
                  >
                    Next
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFlipped((value) => !value)}
                className="flex min-h-64 w-full items-center justify-center rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-8 text-center"
              >
                <div>
                  <p className="text-sm font-bold uppercase text-blue-600">{flipped ? "Definition" : "Word"}</p>
                  <p className="mt-4 text-3xl font-bold text-blue-950">{flipped ? item.definition : item.word}</p>
                  <p className="mt-4 text-sm text-slate-500">Click card to flip</p>
                </div>
              </button>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={markUnknown} className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 font-bold text-red-700">
                  Do Not Know
                </button>
                <button type="button" onClick={markKnown} className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 font-bold text-emerald-700">
                  Know
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="app-card p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="mt-1 text-xl font-bold text-blue-950">Definition</h2>
            </div>
            <button type="button" onClick={nextTyped} className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-950">
              Next
            </button>
          </div>
          <p className="mb-5 text-lg leading-8">{item.definition}</p>
          <form action={action} key={key} className="flex flex-col gap-3 sm:flex-row">
            <input type="hidden" name="vocabItemId" value={item.id} />
            <input name="response" className="flex-1 rounded-lg border border-blue-200 px-3 py-2" placeholder="Type the word" required />
            <button disabled={pending} className="btn-primary px-4 py-2 disabled:bg-slate-400">
              Check
            </button>
          </form>
          {state?.message ? (
            <p
              className={`mt-4 rounded-lg p-3 text-sm ${
                state.correct
                  ? "bg-emerald-50 text-emerald-700"
                  : state.close
                    ? "bg-amber-50 text-amber-800"
                    : "bg-red-50 text-red-700"
              }`}
            >
              {state.message}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
