# Callnote

Callnote is a meeting workspace for the hour after the call: the recording clock, the line that was said, the decision, the owner, and a link you can send.

## Live Demo

https://callnote-ten.vercel.app/

## Repository

https://github.com/habinrahman/Callnote

## Product

Callnote is a meeting-intelligence workspace. The seeded library is the product. You open a finished call, move the clock, read the matching line, and leave with owners and a public clip.

What is in the app:

- Meeting library, with ready and processing states
- Playback and a transcript that follows the clock
- Authored summaries, decisions, topics, and follow-ups
- Action items with an owner and a due date
- Highlights
- Search across titles, notes, actions, and transcript lines
- Shared meetings and public clip pages
- Help and Settings
- A sidebar for Meetings, Search, Highlights, and Shared with me

Notes are written in `lib/seed/meetings.ts`. No model is called. Search is a case-insensitive substring match, not a semantic search. Highlights are authored fields. The highlights page still says they were extracted. They were not.

Five seeded meetings ship with the app. Northwind renewal is the only one with audio. Checkout outage review is about an hour, with eight people, and has no audio file. Interview loop — Alex Rivera stays on Processing. That state does not finish on its own.

Calendar connect and a meeting bot are demoed, not integrated. The calendar page says Callnote does not call Google or Microsoft. Browser capture records this machine's microphone and stores the blob in IndexedDB. The transcript on that path is scripted. The panel says it is not speech-to-text.

## Architecture

```text
Browser
  → Next.js pages and API routes on Vercel (Node.js)
    → Supabase PostgreSQL
```

Frontend:

- Next.js App Router
- React
- TypeScript
- Tailwind

Backend:

- Next.js route handlers
- Node.js runtime (`export const runtime = "nodejs"`)

Database:

- Supabase PostgreSQL
- `meetings`: `id` text primary key, `payload` jsonb
- `action_states`: `(meeting_id, action_id)` primary key, `done` boolean, foreign key to `meetings` with `on delete cascade`
- Row level security is enabled. There are no anon or public policies. The browser never talks to Supabase directly.

The server reads `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in `lib/db.ts`. Those names are not prefixed with `NEXT_PUBLIC_`, so Next.js does not put them in the client bundle.

Seeded meeting JSON is stored as one payload per row. Action checkboxes for those meetings are stored in `action_states` and merged onto the payload when a meeting is read. An unknown action id is rejected. The seed script runs once, and only when `meetings` is empty. It is not called on each request.

Still in the browser only:

- Captured recordings, their notes, and their highlights (`IndexedDB`, database `callnote-capture`)
- Action checks on a captured meeting (`localStorage`)
- The demo calendar connection (`localStorage` key `callnote-calendar-demo`)

`NEXT_PUBLIC_BASE_PATH` is optional. Production does not set it, so routes are at the site root. When the variable is set, client fetches and copied links use that prefix. `Link` already respects Next.js `basePath`.

## API / Data flow

List and detail:

```text
Browser
  → GET /api/meetings/
  → GET /api/meetings/[id]/
  → Supabase meetings + action_states
```

`GET /api/meetings/?shared=1` returns meetings that have a clip. `GET /api/highlights/` flattens seeded highlights. `GET /api/search/?q=` searches the stored meetings.

Action completion:

```text
Browser
  → PATCH /api/meetings/[id]/actions/[actionId]/
  → Supabase action_states
  → GET or reload
  → the checkbox stays checked
```

The PATCH body is `{ "done": true }` or `{ "done": false }`. A non-boolean `done` is HTTP 400. A missing meeting or action id is HTTP 404.

## Local development

Node.js 22. Create `.env.local` in the project root. Do not commit it.

```text
SUPABASE_URL=
SUPABASE_SECRET_KEY=
```

`SUPABASE_SECRET_KEY` is the service role key. It must stay on the server. Do not rename it to `NEXT_PUBLIC_`.

Apply `supabase/schema.sql` once in the Supabase SQL editor if the tables are not there yet. Then:

```bash
npm install
npx tsx scripts/seed-supabase.ts
npm run dev
```

Open http://localhost:3000. The seed inserts the meetings and their action rows. If any meeting row already exists, the script exits without inserting again.

Typecheck and production build:

```bash
npx tsc --noEmit
npm run build
npm run start
```

Browser check, with Chrome installed at `C:\Program Files\Google\Chrome\Application\chrome.exe`:

```powershell
$env:DEMO_URL="http://127.0.0.1:3000"
node scripts/verify-demo.mjs
```

There is no `npm test` script. The demo script fails if a page throws.

## Validation

Checked on this submission pass:

- `npx tsc --noEmit`
- `npm run build`
- `scripts/verify-demo.mjs` against a local production server
- Production `GET /api/meetings/`, highlights, and search
- Production Northwind action checkbox, including a full refresh
- Production pages for the library, search, highlights, shared, Northwind, the public clip, the processing meeting, Help, and Settings

## Assignment decisions

- The interface is this app's own layout, not a copied vendor shell.
- Seeded meetings and action checks live in Supabase. The checkbox is a real write, not a local-only toggle.
- Meeting content is seeded and realistic. It is not generated at request time.
- The calendar and the notetaker are stubs. The assignment allows that. The product says so on those screens.
- Time went into the post-meeting pass: playback, transcript, decisions, actions, search, and a public clip.
- A clip page is public. There is no account and no auth wall.

## Known limitations

- No calendar OAuth, no meeting bot, and no accounts.
- No external model. Summaries, highlights, and search are authored or literal.
- One seeded audio file. It is concatenated spoken lines, about 108 seconds, mapped onto the 14-minute Northwind meeting. It is not a room recording. Other seeded meetings play a timer. The waveform is decorative.
- Alex Rivera never leaves Processing.
- A capture stays in the browser that recorded it. Another person cannot open that recording.
- Template headings can change when the meeting has no prose written for that template. Customer follow-up, Mutual plan, and 1:1 swap the summary and keep the general headings.
- Search returns at most three transcript hits per meeting.
- Shared with me lists seeded meetings that have a clip. It is not an inbox.

## License

No license file is included in this repository.

## Author

Habin Abdul Rahman — https://github.com/habinrahman
