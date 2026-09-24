# Callnote

Callnote is a meeting-notes product built for the 8x engineering assignment, inspired by workflows observed in Fathom. It is a library of finished calls, a player tied to the transcript, a structured summary, action items, highlights, search, and a public clip link.

A visitor does not need an account. The demo data is in the repository, so the deployed site works without a personal session and without an AI API key.

## What was built

- Meeting library with duration, participants, a summary preview, and open action counts
- Meeting page with recording playback, speaker-labeled transcript, timestamp seek, in-transcript search, summary, topics, decisions, action items, follow-ups, important moments, and a template switch
- Highlights that seek the player and sit on the timeline
- Search across titles, summaries, action items, and transcript lines
- Public clip pages at `/share/[clipId]`
- One long six-person meeting, plus a meeting that stays in processing

## What was intentionally stubbed

The notetaker and calendar connection are not implemented. The sidebar does not connect Google or Outlook. Nothing joins a live call. The processing meeting never finishes. Summaries are written into the seed. There is no account system.

## Architecture

Next.js (App Router), React, and TypeScript. Tailwind for layout.

- `app/` — pages. The production build is a static export.
- `components/` — shell, library, player, transcript, and meeting workspace
- `lib/domain/` — types, formatting, and queries. No React.
- `lib/seed/` — the meetings a visitor sees

There is no database. Playback state lives in the page. Checked action items stay in `localStorage` for that browser only.

## Local setup

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Production check:

```bash
npm run build
npx serve out
```

Then, in another terminal, `DEMO_URL=http://127.0.0.1:3000 node scripts/verify-demo.mjs`. The script uses the Chrome installed on this machine.

## Deployment

GitHub Pages serves the static `out/` directory. The repository slug stays `Fanthom`, so the public site remains https://habinrahman.github.io/Fanthom/. That path uses the repository name’s exact case. `NEXT_PUBLIC_BASE_PATH` in the Pages workflow must match that case, or a direct meeting URL loads with no script and looks blank. Seeded meetings are part of the build. The product name on the site is Callnote.

## Known limitations

- The player is a timeline, not a camera recording of a real meeting.
- Play skips silence between lines so the transcript keeps moving. The clock jumps to the next spoken line.
- Action-item checkmarks are local to the browser.
- Template text is prewritten. Switching templates does not call a model.
- Search covers the seeded meetings only.

## AI usage

No model is called at runtime, and no API key is required or shipped. Summaries, decisions, and action items are seeded so the walkthrough does not depend on an external service.

## How the recording layer was handled

There is no bot and no media file. Each meeting has a duration and transcript timestamps. The player advances that clock, draws a waveform, and marks the transcript line that contains the current time. Clicking a line, highlight, decision, or action seeks the clock. A shared clip clamps playback to a start and end.
