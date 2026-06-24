# SAT Prep Platform Details

This document mirrors the current product notes from the Obsidian vault so the GitHub repo carries the platform context needed for future work and deployment.

## Product Purpose

The platform supports a small SAT prep operation. The current MVP focuses on SAT Math diagnostics, teacher-controlled test sessions, weak-spot tracking, retests, and vocabulary practice.

The core loop is:

```text
Create tagged questions -> assign/take tests -> grade -> weak topic report -> retest -> struggle point
```

## User Roles

| Role | Purpose |
| --- | --- |
| Admin/founder | Manage dashboards, students, math tests, vocab sets, results, and settings. |
| Teacher | Create students, manage tests, start live sessions, and review weak topics. |
| Student | Take tests, review past scores, and practice vocabulary. |

## Student Flow

1. Student logs in at `/login`.
2. Student lands on `/student`.
3. Student sees assigned live tests, public math practice/exam sets, locked secret/retest sets, published VocaQuiz sets, past test results, and recent vocabulary attempts.
4. Student starts a test.
5. `TestForm` handles the timed test UI.
6. `submitTestAction` grades answers and stores a `Submission`.
7. Student sees score results, while detailed answer handling stays teacher/admin-oriented.

## Teacher/Admin Flow

1. Manager creates students.
2. Manager creates a math question set.
3. Manager adds questions with text, optional image, answer type, choices, correct answer, topic tags, and optional notes.
4. Manager publishes the set or keeps it as a draft.
5. Manager starts a live session for selected students, or students self-start available public/secret sets.
6. Manager reviews scores and weak tags.
7. Failed retests under 70% create or reopen unresolved `StrugglePoint` records.

## Math Test Types

| Type | Meaning |
| --- | --- |
| `topical` | Focused practice. |
| `retest` | Locked test used to verify whether a weak area improved. |
| `full_exam` | Mini/full exam style set. |

Question sets also include `active`, `hidden`, `visibility`, `durationMinutes`, `module`, and an optional per-set `retestPassword`. Locked/retest sets should use the saved per-set password; the old global secret is only a fallback for older rows.

## VocaQuiz

VocaQuiz supports vocabulary sets and flashcard/typed practice.

Students can practice flashcards, mark known/unknown words, use typed answer mode, and receive correct/close/incorrect feedback.

Managers can create VocaQuiz sets, add words, definitions, aliases, difficulty, and tags, then publish draft sets.

## Analytics

Weak topics are calculated from missed answers and `topicTags`.

`weakTopicsFromAnswers` reads each answer's question tags, counts attempts and misses per tag, keeps tags with at least one miss, then sorts by miss count and miss rate.

`nextFocus` returns a teacher-facing recommendation using the top three weak topics.

## Retest Behavior

When a student submits a question set where `setType === "retest"`:

1. The score ratio is calculated.
2. If the score is under `0.7`, missed topics are collected.
3. Each missed topic creates or updates a `StrugglePoint`.
4. `StrugglePoint.source` is `failed_retest`.
5. Existing struggle points are reopened with `resolved: false`.

## Architecture

| Layer | Files |
| --- | --- |
| Routes/pages | `src/app/**/page.tsx` |
| Shared UI | `src/components/*` |
| Server actions | `src/lib/actions.ts` |
| Auth | `src/lib/auth.ts` |
| Database client | `src/lib/db.ts` |
| Analytics | `src/lib/analytics.ts` |
| Grading | `src/lib/grading.ts` |
| Formatting helpers | `src/lib/format.ts` |
| Data model | `prisma/schema.prisma` |
| Safe default content seed | `prisma/seed-default-content.ts` |
| Destructive local reset seed | `prisma/seed.ts` |

## Domain Model

| Model | Meaning |
| --- | --- |
| `User` | Admin, teacher, or student. |
| `QuestionSet` | A math/EBRW set, exam, or retest with optional per-set retest password. |
| `Question` | One question inside a set. |
| `LiveSession` | A test attempt container created by teacher/admin or student self-start. |
| `LiveSessionStudent` | Assignment of a session to a student. |
| `Submission` | Student submitted test result. |
| `Answer` | One submitted response and correctness flag. |
| `VocabSet` | Published or draft vocabulary set. |
| `VocabularyItem` | One vocab word/definition. |
| `VocabAttempt` | One typed vocabulary attempt. |
| `AppSetting` | Mutable settings such as admin/secret password. |
| `StrugglePoint` | Unresolved weak area after a failed retest. |

## Deployment Notes

- `prisma/dev.db` is local-only and ignored.
- `.env` is local-only and ignored.
- Railway must provide `DATABASE_URL=file:/data/database.db`.
- Railway must have a persistent volume attached to the service with mount path `/data`.
- Never use a relative SQLite path such as `file:./database.db` in production. That stores the database inside the deploy container and data can disappear after rebuilds/redeploys.
- Production startup runs `scripts/validate-production-db.mjs` and refuses to boot if the SQLite file is not under `/data`.
- `npm run seed:defaults` is safe and only inserts missing default content.
- `npm run seed` and `npm run cleanup:content` are destructive and require explicit environment flags.
- Current auth is MVP-only: plain text passwords and a simple `sat_user_id` cookie. Add password hashing and stronger session handling before using real student data.
