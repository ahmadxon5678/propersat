# SAT Prep Support Platform

Local MVP for SAT Math diagnostic tests, teacher-controlled live sessions, weak-spot analysis, and vocabulary practice.

## Install

```bash
npm install
npx prisma migrate dev
npm run seed
```

## Run

```bash
npm run dev -- -p 3003
```

Local URL:

```text
http://localhost:3003
```

## Test Logins

Teacher:

```text
teacher / teacher123
```

Founder/admin:

```text
Click "SAT Prep Login" 5 times, then enter: AhmadJohns!09
```

Students:

```text
ali / student123
sara / student123
timur / student123
```

## App Structure

- `src/app/login` - simple local login.
- `src/app/teacher` - teacher dashboard for students, question sets, live sessions, results, and vocabulary.
- `src/app/student` - student dashboard, live tests, past scores, and vocabulary practice.
- `src/lib/actions.ts` - server actions for auth, sessions, grading, submissions, and vocabulary attempts.
- `src/lib/analytics.ts` - weak-topic aggregation by missed question tags.
- `prisma/schema.prisma` - SQLite data model.
- `prisma/seed.ts` - demo teacher, students, question sets, and vocabulary.

## Platform Details

See [`docs/platform.md`](docs/platform.md) for the product purpose, user flows, domain model, learning loop, analytics behavior, retest behavior, and deployment notes copied from the Obsidian project folder.

## Notes

- This is a local MVP. Passwords are stored plainly for speed and simplicity; replace this before using with real student data.
- SAT EBRW is not implemented yet. Question sets already include a `module` field so future modules can be added without replacing the core session/submission flow.
- Students only see active live sessions assigned to them and cannot submit the same live session twice.
