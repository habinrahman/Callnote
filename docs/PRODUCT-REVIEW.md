# Callnote — Senior Engineering & Product Review

Reviewed against the repository at `491a1c124a9a681c9df46aa8eeb1aed210cc61ad` and the live site at https://habinrahman.github.io/Callnote/. This is an internal review. It is not a score.

## Executive Summary

Callnote is a coherent static meeting workspace with a real browser-microphone capture path beside it. A reviewer who only reads the current README will think the calendar, the audio file, and the hour-long meeting do not exist. That README is the largest submission risk, because the product itself is ahead of the document.

The core job is clear once you are inside a meeting: hear or scrub a call, read the line that matches the clock, and leave with decisions, owners, and a link. The library, Northwind playback, transcript seek, public clips, and the `/Callnote/` base path are the parts that hold up under inspection.

The parts that do not hold up if oversold are the words "AI", "extracted", and "connected calendar". Summaries are authored seed data plus a section map. Search is a case-insensitive substring scan. Calendar connect writes a name into `localStorage`. Capture records the microphone, then attaches a prewritten script and prewritten notes. That is a legitimate assignment trade-off. It becomes a problem only if the README or the UI implies a model, a bot, or a synced calendar.

## Product Thesis

Callnote is for the person who missed the call or cannot trust their memory of it. The job is to turn one meeting into a clock, a transcript, a short account of what was decided, and a link someone else can open without an account.

The seeded library demonstrates that job without a login. The calendar and capture flow demonstrate how a new meeting would enter the library, with the recording bot and the model explicitly left out.

## User Workflow

Seeded path:

Library → meeting → play or seek → transcript line → summary and actions → highlight or clip link.

Capture path:

Calendar (demo connection) → Start Callnote → microphone → stop → short processing state → `/meetings/captured/?id=` → playback of the blob, scripted lines, and notes stored in IndexedDB.

These are two products sharing a visual system. The seeded path is what a reviewer can evaluate without granting a microphone. The capture path is real audio and fake understanding. That split is understandable. It is also the thing a reviewer will test if the README blurs it.

## Architecture Review

### Strengths

- `lib/domain` has no React. Types, formatting, and seeded queries are separate from the workspace.
- `lib/intelligence/present.ts` is a small replaceable map from template id to section kind. It does not call a network.
- Static export (`output: "export"`, `trailingSlash`, unoptimized images) matches GitHub Pages. Seeded routes exist at build time. Captured meetings stay on the prebuilt `/meetings/captured/` route because a static host cannot mint new dynamic paths.
- `NEXT_PUBLIC_BASE_PATH` is applied in `next.config.ts`, in `assetSrc` for the Northwind WAV, and in `copyLink`. Next.js `Link` prefixes the base path on its own. Copied URLs are built as `new URL(base + path, origin)` so a leading slash does not drop `/Callnote/`.
- Dates render in UTC (`lib/domain/format.ts`), which avoids a hydration mismatch between the build machine and the browser.
- Persistence matches the constraint: no account, no server. Action checks use `localStorage` key `fanthom-actions-${id}`. Captures use IndexedDB database `callnote-capture`. Calendar connection uses `callnote-calendar-demo`.

### Risks

- Two meeting shapes. `Meeting` in `lib/domain/types.ts` and `CapturedMeeting` in `lib/capture/db.ts` do not share a renderer. `meeting-workspace.tsx` and `captured-meeting.tsx` both interpret `PresentedSection`. A change to section kinds has to be made twice.
- `structureFromTemplate` only recognizes `incident`, `sales`, `discovery`, and `interview`. Seeded ids `follow-up`, `mutual-plan`, and `coaching` fall through to the general section list. Those templates still swap headline and summary text, because the workspace looks up `meeting.templates` by id. The headings do not change.
- On a template id that is not stored on the meeting, the prose falls back to `templates[0]` while the headings come from the selected structure. Incident review on Checkout outage review is backed by an incident template, so the summary text changes. Incident review on Northwind keeps the renewal summary under incident headings, and topics are sliced by array index. "Root cause" can be whatever topic happens to sit second. That is a presentation trick, not a new reading of the meeting.
- `layOut` spreads lines across `durationSec` by inserting gaps. Highlight and clip times are derived from segment indexes, so they stay aligned with the transcript. They are not aligned with wall-clock speech. Northwind's WAV is about 108 seconds of concatenated lines, mapped onto a 14-minute meeting clock through cue pairs in `lib/audio/northwind-demo.ts`.
- The package name is still `fanthom`. The action-item storage key still starts with `fanthom-actions-`. Renaming either would strand existing browsers or fight the assignment history. Leave them.

### Trade-offs

| Decision | Reason | Sacrifice | Benefit |
| --- | --- | --- | --- |
| Static export on GitHub Pages | The assignment needs a public URL without operating a server | No per-user routes, no private ACL, captured meetings cannot be shared across browsers | A reviewer can open the site with no account |
| Seeded notes instead of a model | No API key, no outage during a walkthrough | The product cannot claim runtime intelligence | The demo is deterministic |
| Browser `MediaRecorder` instead of a meeting bot | The brief allows a stubbed notetaker | The app never joins Meet, Zoom, or Teams | The microphone path is honest and testable |
| IndexedDB for captures | Fits a static host | Data dies with the browser profile | No backend to secure or provision |
| One audible seeded meeting | A full hour of produced speech is not worth the assignment time | Checkout outage review is silent | Northwind is a credible playback demo |

## Code Quality Review

### Strengths

- TypeScript is used for the domain, not only for props. `tsc --noEmit` passes.
- Playback seeking waits until `seekable` covers the target before assigning `audio.currentTime`. That avoids Chrome resetting the element to 0. `pendingAudio` keeps the transcript from snapping back to the first line during that wait.
- The playback range ignores programmatic updates unless the pointer or keyboard is actually on the control, so a controlled input does not fight the clock.
- `MediaRecorder` picks `audio/webm;codecs=opus`, then webm, then mp4, and the denied path is a visible state rather than a thrown overlay.
- Processing for a new capture is a 1.6 second wait and then a navigation. It is not a permanent spinner. The seeded Alex Rivera meeting is a separate, intentional processing fixture with an empty transcript.
- `scripts/verify-demo.mjs` locks the selectors a redesign would otherwise break: the accessible name "Callnote", "Executive summary", "1 hr", "Processing", transcript seek, highlight seek, the action checkbox, and the public clip title.

### Risks

- There is no lint script. Verification is one Playwright script plus a manual pass. `verify-demo.mjs` is not an npm script, and its default URL is `http://127.0.0.1:3456`, not the dev server.
- `captured-meeting.tsx` builds action ids as `a${index}` after `sliceSection`. Today every actions section uses `skip: 0`, so the index matches the stored list. A future section that skips actions would check off the wrong row.
- Search (`searchMeetings`) skips meetings with status `processing`, returns at most three transcript hits per meeting, and does not have a highlight or decision kind. Decisions are only found if the words also appear in a summary or a line. Captured meetings are searched only on the client, from IndexedDB, in `searchCaptured`.
- The waveform in the player is a hash of the meeting id, not PCM. A reviewer who scrubs and expects the picture to match amplitude will notice.
- `meeting-workspace.tsx` is still the place where storage, routing, copying, and section rendering meet. It is readable. It is also the file that will keep growing.
- Highlights on the global page are described as "Important moments extracted from your meetings." Nothing extracts them. They are fields on the seed, plus IndexedDB rows for captures.

### Recommended Improvements

Do these only if there is time after the README and the walkthrough. None of them are worth a new subsystem.

- Point the highlights subtitle at seeded moments and browser-local marks.
- Map `follow-up`, `mutual-plan`, and `coaching` onto sections only when the copy under those headings is actually written for them. Do not relabel an arbitrary slice.
- Add `npm run verify` that sets nothing magical and documents `DEMO_URL`.
- Keep one section renderer shared by seeded and captured meetings if a third template change is required. Do not do that refactor for its own sake.

## UX Review

### Strong Areas

- The library answers "what happened and is it ready?" Duration, people, preview, and open actions are on the card. Alex Rivera stays visibly in Processing.
- The meeting page stacks player, transcript, and notes in an order that still works at 390px. On the live Northwind page the transcript region sits above Executive summary (measured y 652 vs 1403).
- Clicking a transcript line, decision, topic, action time, or highlight seeks and writes `?t=` so refresh and paste keep the position.
- Copy link on the live Northwind page produced `https://habinrahman.github.io/Callnote/meetings/northwind-renewal/?t=0`.
- Calendar copy says the product does not call Google or Microsoft. The capture processing panel says the transcript is not live speech-to-text.
- Public clips open without the library chrome fighting the clip. Northwind's decision clip and the reliability freeze clip both return HTTP 200 under `/Callnote/share/`.

### Weak Areas

- The first screen does not say what Callnote is. The wordmark and "Meetings" assume you already know. That is acceptable for a demo library and weak as a landing page. The README has to do the explaining the UI refuses to do.
- Jordan Lee and the bell are chrome. They look like an account and do nothing. "Shared with me" in the sidebar is the same seeded meetings again, not an inbox.
- Template switching on Checkout outage review is convincing, because that meeting has an incident template. The same control on other meetings changes headings more than it changes insight.
- A silent 60-minute player on the outage review feels unfinished if you hit Play expecting the incident. The product needs the Northwind meeting to be the audio stop on the tour.
- Captured highlights say they stay in this browser. Seeded highlights do not say they are authored. The global Highlights line overclaims.
- Search is fast and literal. It will not find a paraphrase. The placeholder ("error budget, a name, a decision") teaches the right query shape, which helps.

### Recommended Improvements

Leave the visual system alone. If one UI string changes before submission, change the Highlights subtitle. Do not add a marketing hero to the app.

## Design Review

### Strong Areas

The visual language is consistent and specific: warm paper `#f3f0e8`, pine `#1b5648`, serif titles (`Iowan Old Style` / Palatino), sans body, 6px controls, hairline borders, and an active transcript row in `#e7f3ef` with a pine inset. It does not look like a default Tailwind starter, and it does not need to look like Fathom.

The player is the densest, most confident surface: dark bar, time, rate, and marks. Transcript rows are readable. Cards on the library are quiet and scannable.

### Weak Areas

- System fonts. On Windows the serif is Palatino-like; on GitHub Pages visitors with different fonts the titles shift. That is acceptable. A webfont would be weight without a product change.
- The decorative waveform promises a recording even when `audioStatus` is `off`.
- The template select is visually light compared with how much it changes the notes column. After a switch, nothing explains that the notes were rearranged rather than rewritten.
- Mobile is usable and not tight in a broken way. It is a stacked document, not a mobile product. That matches the scope.

### Recommended Improvements

Do not restyle. Do not add a font package. Do not rebuild the player.

### What should not change

- The paper / pine / serif combination.
- The accessible name of the wordmark, which is "Callnote" even though the mark is an SVG.
- The order player → transcript → notes on small screens.
- Trailing slashes and the `/Callnote/` prefix.
- UTC date formatting.

## 8x Assignment Review

| Requirement | Status | Evidence | Risk | Recommendation |
| --- | --- | --- | --- | --- |
| Meeting library | Built | `/`, `components/dashboard.tsx`, five seeded meetings | README still says the library is the whole product and omits capture | Describe the library as the reviewer's home |
| Connect calendar | Demo/stub | `/calendar/`, `components/calendar-board.tsx`, `localStorage` key `callnote-calendar-demo` | A reviewer may try a real Google consent screen | Keep the honest sentence. Do not add OAuth |
| Notetaker joins the meeting | Demo/stub | Calendar "Start Callnote" opens `/calendar/[id]/` then `/calendar/[id]/live/`. Platform is a label (`Google Meet`). No bot | Overclaiming "joins Meet" | Say the notetaker is a browser recorder on a demo event |
| Record meeting | Built, local | `getUserMedia` + `MediaRecorder` in `components/recording-session.tsx` | Microphone permission, empty transcript if you stop before the script's first timestamp | Show a short capture in the walkthrough, or skip it and use Northwind |
| Playback against transcript | Built | `components/use-playback.ts`. Northwind uses `public/audio/northwind-renewal.wav` and cue map. Other seeded meetings advance a clock with `requestAnimationFrame` | Play on the outage review is silent | Start the tour on Northwind |
| Summary | Built, seeded | `SummaryTemplate` on each meeting, rendered by `TemplateSection` | Sounds like a model if the word AI is used loosely | Call it structured notes |
| Template switching | Partially built | `lib/intelligence/present.ts`. Incident on the outage review changes summary text and headings. Other structures mostly retitle and slice the same arrays | Headings can misname a topic | Demo incident on Checkout outage review only |
| Action items | Built | Checkboxes, owner, due date, seek. Persist in `localStorage` | Checks do not sync. Key name is `fanthom-actions-` | Mention browser-local |
| Highlights | Built | Seeded marks seek. Capture marks take a title and IndexedDB `put`. Global page `/highlights/` | "Extracted" copy. Captured marks are not on the public site | Say which highlights are public |
| Search | Built | `/search/`, `searchMeetings` plus client `searchCaptured` | Not semantic. Processing meetings omitted. At most three transcript hits | Demo a literal query such as `error budget` or `migration check` |
| Share clip | Built | `/share/reliability-freeze/`, `/share/northwind-decision/`, `/share/helio-hipaa/`, `/share/priya-secondary/`. Captured clips at `/share/captured/?id=&h=` are local | A copied captured share link 404s for anyone else | Only share seeded clip URLs in the walkthrough |
| Long meeting | Built | Checkout outage review: `durationSec: 60 * 60`, eight speakers including Maya Chen and Daniel Kim, lines appended in `reliabilityLines`, calendar `durationMin: 60`. Live home shows "1 hr" | No audio. The last original line still says the room is done, then the new speakers continue | Use it for people, decisions, and actions, not for sound |
| Responsive | Built | Verified at 390px on the live Northwind page: transcript above the summary | Not a native mobile app | One phone screenshot is enough |
| Public deployment | Built | GitHub Actions `.github/workflows/pages.yml` builds with `NEXT_PUBLIC_BASE_PATH=/Callnote` and deploys `out/`. Live routes above returned 200. `https://habinrahman.github.io/meetings/reliability-review/` returned 404 | A URL without `/Callnote/` is wrong | Every link in the README must include `/Callnote/` |
| Public repository | Built | https://github.com/habinrahman/Callnote | Remote history may still mention `fanthom` | Do not rename the repo or the package in this pass |
| Agent logs | Built | `.agent-logs/`, `.cursor/hooks.json`, `.cursor/hooks/agent-capture.mjs` | Do not delete or rewrite history | Leave the hooks alone |
| Walkthrough | Not built | No video in the repo | The assignment still needs a recording of five minutes or less | You record it. Do not generate one here |

## Demo Data Review

Five meetings:

| Meeting | Duration | People | Status | Role in the demo |
| --- | --- | --- | --- | --- |
| Checkout outage review | 60 min (`formatDuration` renders "1 hr") | 8 | Ready, no audio | Long incident: impact, freeze, owners, technical argument |
| Northwind renewal | 14 min | 2 | Ready, WAV | The only seeded meeting that makes sound |
| Helio Health discovery | 22 min | 3 | Ready, silent clock | Discovery template, HIPAA-shaped clip |
| Priya / Luis 1:1 | 18 min | 2 | Ready, silent clock | Coaching template falls through to general headings |
| Interview loop — Alex Rivera | 45 min | — | Processing | Permanent processing example. Empty transcript |

Checkout outage review is long enough and populated enough for the brief. Maya Chen (Product operations) and Daniel Kim (Platform engineer) have lines about renewal replies, the status page, a ledger lock, and paging. They are not metadata-only. The transcript is still a designed incident, not a raw hour of speech. Forty-four lines across sixty minutes means large gaps. That is how `layOut` hits the duration. It is believable as notes. It is not believable as a gap-free recording.

Northwind is the strongest writing-to-audio pair. The decision clip "Jonah's renewal decision" matches the conversation about holding the rate. The file is spoken lines concatenated, not a room tone of a 14-minute call. The cue table is what makes the transcript light up in time with the file.

Summaries track the transcripts they were written with. They are not derived from the lines by code. If a line changes and the summary does not, nothing fails the build.

## AI / Intelligence Review

No LLM is called. No API key is read. No embeddings are stored. Search is `String.includes` on lowercased text.

What exists is a deterministic intelligence layer:

- Authored `SummaryTemplate` records: headline, executive summary, follow-ups.
- Authored decisions, topics, actions, moments, highlights.
- `sectionsFor` / `structureFromTemplate` / `sliceSection`, which choose headings and which slice of those arrays to show.

A later model could replace `sectionsFor` if it returned the same `PresentedSection` kinds. That seam is real and small. It is not a hidden model.

Do not write "AI summary", "extracted highlights", "semantic search", or "real-time transcription" in the README.

## Recording / Capture Review

Four different clocks exist. They must not be collapsed into one sentence.

1. Seeded demo audio. Only Northwind. `public/audio/northwind-renewal.wav`. `usePlayback` creates an `Audio` element, prefixes the base path, and maps file time to meeting time with cues.
2. Browser-recorded audio. `MediaRecorder` on the live capture page. The blob is stored on the IndexedDB record and played back with `URL.createObjectURL` on `/meetings/captured/`.
3. Simulated timeline. Seeded meetings without `src` use `nextPlayhead` and `requestAnimationFrame`. Gaps over 1.5 seconds are skipped so the transcript keeps moving. The on-screen duration is `meeting.durationSec`, not `audio.duration`.
4. Meeting-bot capture. Not implemented. Nothing joins a call.

Capture transcript lines are the calendar meeting's `script`, filtered to lines whose `startSec` is within the recording. Notes copied onto the capture are the prewritten `notes` object. The processing panel tells the truth.

## Search Review

Seeded search covers title, template summary and follow-ups, action task and owner, and up to three transcript lines. A hit with a timestamp links to `/meetings/{id}?t=`.

It does not cover highlight labels as their own kind, and it does not search the Alex Rivera meeting.

Captured search runs after IndexedDB loads. Those hits never appear in the static HTML a crawler would see. A query on a fresh browser only hits the seed. That is the correct privacy behavior and a bad surprise if the README says every recording is globally searchable.

Live check: searching `error budget` shows Checkout outage review.

## Sharing Review

Seeded clips are public static pages. Copy clip link uses the same base-path helper as copy meeting link.

`/share/captured/` plays a local blob. Sending that URL to another person does not send the audio. The page can only work in the browser that holds the IndexedDB row.

`https://habinrahman.github.io/meetings/...` 404s. `https://habinrahman.github.io/Callnote/meetings/...` is the public shape.

## Persistence Review

| Data | Where | Scope |
| --- | --- | --- |
| Meetings, transcripts, notes, seeded highlights, clips | Source, baked into the static export | Public |
| Action checkmarks | `localStorage` `fanthom-actions-${id}` | This browser |
| Calendar "connection" | `localStorage` `callnote-calendar-demo` | This browser |
| Captured audio, script, notes, highlights | IndexedDB `callnote-capture` / `meetings` | This browser |
| Playback position | `?t=` on the URL | Whoever has the link, for seeded meetings |

There is no sync, no account, and no server backup.

## Deployment Review

`.github/workflows/pages.yml` checks out the repo, runs `npm ci`, builds with `NEXT_PUBLIC_BASE_PATH=/Callnote`, uploads `out/`, and deploys Pages. `concurrency` cancels an in-progress deploy.

Live HTTP checks during this review:

- 200 `https://habinrahman.github.io/Callnote/`
- 200 `/Callnote/calendar/`
- 200 `/Callnote/search/`
- 200 `/Callnote/highlights/`
- 200 `/Callnote/meetings/reliability-review/`
- 200 `/Callnote/meetings/northwind-renewal/`
- 200 `/Callnote/share/reliability-freeze/`
- 200 `/Callnote/share/northwind-decision/`
- 200 `/Callnote/audio/northwind-renewal.wav`
- 404 `https://habinrahman.github.io/meetings/reliability-review/`

`origin/master` matched local `HEAD` at review time, and the live reliability payload includes Maya, Daniel, and `3600`. The stale README in the repo is still what GitHub renders until a documentation commit is pushed.

## Security / Privacy Review

What is local: microphone audio, captured transcripts, captured highlights, action checks, the demo calendar flag.

What is public: every seeded meeting, every seeded clip, the Northwind WAV, and the source. There is no auth wall. That is deliberate.

What is not implemented: user accounts, encryption at rest beyond what the browser does, private links, audit logs, a server to revoke a clip.

What would need a backend: real calendar OAuth, a bot that joins a call, sharing a captured recording with another person, per-user permissions, and any model call that should not ship a key to the client.

No API keys are in the repo. `NEXT_PUBLIC_BASE_PATH` is public by design.

Do not call the site "secure". Call it a public demo with browser-local capture.

## Accessibility Review

- The wordmark link's accessible name is "Callnote".
- Template select is labeled "Template" (visually hidden).
- Action checkboxes use `Mark complete: {task}`.
- Transcript is a named region. The verify script depends on that.
- Focus-visible uses a pine outline.
- `prefers-reduced-motion` short-circuits animation.
- The player control exposes Play and Pause.
- The decorative avatar and bell are not announced as actions. Good, because they are not actions.
- Search input is labeled "Search meetings".

Gaps: the decorative waveform has no text alternative beyond the player times. Captured highlight forms have labels. Color contrast of muted text `#645e56` on paper `#f3f0e8` is the closest thing to a contrast risk; it is body-secondary, not the only signal for state.

## Performance / Reliability Review

The site is static. First load is a small set of JS chunks (the meeting route's client bundle was about 4 kB plus shared JS at build time). Playback of Northwind depends on a single WAV of about 4.8 MB. That is the heaviest asset and it is justified.

Captured audio lives in IndexedDB. A long recording can fill the origin quota. Nothing warns about that. For a demo capture of a minute, it does not matter.

The processing timeout is fixed at 1600 ms. It does not wait on real work. If `saveCaptured` throws, the user stays on the processing panel. That failure is rare and unsurfaced.

## What a Senior Reviewer Will Notice

- The product is finished enough to click, including a path the README denies exists.
- Playback sync on Northwind is engineered, not a timer painted on top of a file with no cue map.
- The base-path bug class (origin-absolute URLs) was understood and fixed in the copy helper, not by hardcoding the host.
- Honesty in the calendar and the processing panel is better than a fake OAuth button.
- Template switching is uneven. The incident meeting is the one place it is fair to demonstrate.
- "Extracted" on Highlights and a stale README will cost more trust than a missing bot.

## What Could Hurt the Submission

- Shipping the current README, which says the notetaker and calendar are absent, that there is no media file, and that the long meeting has six people.
- Calling the notes AI in the walkthrough.
- Playing the outage review and apologizing for silence instead of starting on Northwind.
- Pasting a captured share link into the video as if it were public.
- Deleting `.agent-logs/` or rewriting them.
- A URL in the README that omits `/Callnote/`.

## What Is Already Strong

- A public, account-free library that deep-links into a moment.
- One meeting where audio, cues, transcript, and a public clip agree.
- An eight-person, one-hour incident with owners and a clip, plus a meeting that stays in processing on purpose.
- A capture path that records real audio, admits the transcript is a script, and returns to a page you can play.
- Deployment that fails closed when the base path is wrong, and currently succeeds.

## Highest-Impact Remaining Improvements

1. Replace the README so it matches the product. This is the change that alters how the repository is judged.
2. Record the walkthrough on Northwind first, then the outage review for length and templates, then one seeded clip URL.
3. Optional one-line copy fix on `/highlights/` so it does not say "extracted".

## What NOT to Build

- Google or Microsoft OAuth
- A Zoom, Meet, or Teams bot
- Accounts, a database, or a private API
- A live LLM, embeddings, or "semantic" search
- A second hour of recorded audio
- A visual redesign or a webfont
- A generated walkthrough video

## Recommended Final Submission Strategy

Push the documentation commit when you are ready. Do not push unrelated `.agent-logs` noise if you can avoid it. Confirm the live site still shows "1 hr", incident headings, and a copied link under `/Callnote/`. Record five minutes or less from the live site. Speak the limitations in one sentence: notes are authored, the calendar is a demo, and only Northwind has seeded audio. That sentence will read as judgment. Hiding it will read as a gap.
