"use client";

import { useMemo, useState } from "react";
import { Copy, GripVertical, Plus, Trash2, ArrowDown, ArrowUp, Repeat2, Upload } from "lucide-react";
import { saveVocabSetBuilderAction } from "@/lib/actions";

type Card = {
  id: string;
  word: string;
  definition: string;
  aliases: string;
};

function newCard(): Card {
  return { id: Math.random().toString(36).slice(2), word: "", definition: "", aliases: "" };
}

function parseImport(text: string) {
  const errors: string[] = [];
  const cards: Card[] = [];
  text.split(/\r?\n/).forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const parts = trimmed.includes("\t") ? trimmed.split("\t") : trimmed.split(",");
    if (parts.length < 2 || !parts[0].trim() || !parts.slice(1).join(",").trim()) {
      errors.push(`Line ${index + 1}: add a term and definition.`);
      return;
    }
    cards.push({ id: Math.random().toString(36).slice(2), word: parts[0].trim(), definition: parts.slice(1).join(",").trim(), aliases: "" });
  });
  return { cards, errors };
}

function BuilderActionButtons({ mode }: { mode: "create" | "edit" }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button name="saveAndPractice" value="false" className="rounded-xl bg-blue-700 px-5 py-2 text-sm font-black text-white hover:bg-blue-800">
        {mode === "edit" ? "Save" : "Create"}
      </button>
      <button name="saveAndPractice" value="true" className="rounded-xl border border-blue-200 bg-white px-5 py-2 text-sm font-black text-blue-800 hover:bg-blue-50">
        {mode === "edit" ? "Save and practice" : "Create and practice"}
      </button>
    </div>
  );
}

export function VocabSetBuilder({
  mode,
  initial,
  isAdmin = false,
  error,
}: {
  mode: "create" | "edit";
  initial?: {
    id?: number;
    title: string;
    description: string;
    visibility: string;
    cards: Array<{ word: string; definition: string; aliases: string[] }>;
  };
  isAdmin?: boolean;
  error?: string;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [visibility, setVisibility] = useState(initial?.visibility === "public" ? "public" : "private");
  const [cards, setCards] = useState<Card[]>(() =>
    initial?.cards.length
      ? initial.cards.map((card) => ({ id: Math.random().toString(36).slice(2), word: card.word, definition: card.definition, aliases: card.aliases.join(", ") }))
      : [newCard(), newCard()],
  );
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const validCards = cards.filter((card) => card.word.trim() && card.definition.trim());
  const duplicateTerms = useMemo(() => {
    const seen = new Map<string, number>();
    for (const card of validCards) {
      const key = card.word.trim().toLowerCase();
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    return [...seen.entries()].filter(([, count]) => count > 1).map(([term]) => term);
  }, [validCards]);

  const cardsJson = JSON.stringify(
    validCards.map((card) => ({
      word: card.word.trim(),
      definition: card.definition.trim(),
      aliases: card.aliases.split(/\r?\n|,/).map((alias) => alias.trim()).filter(Boolean),
    })),
  );

  function updateCard(id: string, patch: Partial<Card>) {
    setCards((items) => items.map((card) => (card.id === id ? { ...card, ...patch } : card)));
  }

  function moveCard(index: number, direction: -1 | 1) {
    setCards((items) => {
      const target = index + direction;
      if (target < 0 || target >= items.length) return items;
      const next = [...items];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function importCards() {
    const parsed = parseImport(importText);
    setImportErrors(parsed.errors);
    if (parsed.cards.length) {
      setCards((items) => [...items, ...parsed.cards]);
      setImportText("");
      setImportOpen(false);
    }
  }

  return (
    <form action={saveVocabSetBuilderAction} className="space-y-6">
      {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <input type="hidden" name="cardsJson" value={cardsJson} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-950">{mode === "edit" ? "Edit vocabulary set" : "Create vocabulary set"}</h2>
          <p className="mt-1 text-sm text-slate-500">Build term-definition cards. Images are intentionally not part of this builder.</p>
        </div>
        <BuilderActionButtons mode={mode} />
      </div>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">Title and at least 2 valid cards are required.</p> : null}
      {duplicateTerms.length ? <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800">Duplicate terms: {duplicateTerms.join(", ")}</p> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4">
          <input name="title" value={title} onChange={(event) => setTitle(event.target.value)} className="rounded-xl border border-slate-200 px-4 py-3 text-lg font-bold" placeholder="Set title" required />
          <textarea name="description" value={description} onChange={(event) => setDescription(event.target.value)} className="min-h-24 rounded-xl border border-slate-200 px-4 py-3" placeholder="Description" />
          <div className="flex flex-wrap items-center gap-3">
            {isAdmin ? (
              <span className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700">Official and visible to students</span>
            ) : (
              <>
                <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-black">
                  <input type="radio" name="visibility" value="private" checked={visibility === "private"} onChange={() => setVisibility("private")} />
                  Private
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-black">
                  <input type="radio" name="visibility" value="public" checked={visibility === "public"} onChange={() => setVisibility("public")} />
                  Public
                </label>
              </>
            )}
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-500">Suggestions unavailable</span>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setImportOpen((value) => !value)} className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-black text-blue-800">
          <Upload className="h-4 w-4" /> Import
        </button>
        <button type="button" onClick={() => setCards((items) => items.map((card) => ({ ...card, word: card.definition, definition: card.word })))} className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-black text-blue-800">
          <Repeat2 className="h-4 w-4" /> Swap term/definition
        </button>
        <button type="button" onClick={() => setCards((items) => items.filter((card) => card.word.trim() || card.definition.trim()).concat(newCard()))} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700">
          Clear empty cards
        </button>
      </div>

      {importOpen ? (
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <textarea value={importText} onChange={(event) => setImportText(event.target.value)} className="min-h-36 w-full rounded-xl border border-blue-200 px-4 py-3" placeholder={"term<TAB>definition\nterm, definition"} />
          {importErrors.length ? <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{importErrors.map((item) => <p key={item}>{item}</p>)}</div> : null}
          <button type="button" onClick={importCards} className="btn-primary mt-3 px-4 py-2">Append imported cards</button>
        </section>
      ) : null}

      <section className="space-y-3">
        {cards.map((card, index) => (
          <article key={card.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 lg:grid-cols-[48px_1fr_1fr_1fr_auto]">
              <div className="flex items-center gap-2 text-sm font-black text-slate-500">
                <GripVertical className="h-4 w-4" /> {index + 1}
              </div>
              <input value={card.word} onChange={(event) => updateCard(card.id, { word: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Term" />
              <input value={card.definition} onChange={(event) => updateCard(card.id, { definition: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Definition" />
              <input value={card.aliases} onChange={(event) => updateCard(card.id, { aliases: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Accepted forms, optional: analyze, analyse" />
              <div className="flex gap-1">
                <button type="button" onClick={() => moveCard(index, -1)} className="rounded-lg border border-slate-200 p-2 text-slate-700" title="Move up"><ArrowUp className="h-4 w-4" /></button>
                <button type="button" onClick={() => moveCard(index, 1)} className="rounded-lg border border-slate-200 p-2 text-slate-700" title="Move down"><ArrowDown className="h-4 w-4" /></button>
                <button type="button" onClick={() => setCards((items) => [...items.slice(0, index + 1), { ...card, id: Math.random().toString(36).slice(2) }, ...items.slice(index + 1)])} className="rounded-lg border border-slate-200 p-2 text-slate-700" title="Duplicate"><Copy className="h-4 w-4" /></button>
                <button type="button" onClick={() => setCards((items) => items.length > 1 ? items.filter((item) => item.id !== card.id) : items)} className="rounded-lg border border-red-200 p-2 text-red-700" title="Delete"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </article>
        ))}
      </section>

      <div className="flex justify-center">
        <button type="button" onClick={() => setCards((items) => [...items, newCard()])} className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-black text-blue-800">
          <Plus className="h-4 w-4" /> Add card
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-bold text-slate-500">{validCards.length} valid cards ready to save.</p>
        <BuilderActionButtons mode={mode} />
      </div>
    </form>
  );
}
