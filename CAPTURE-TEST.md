# CAPTURE-TEST

## Tool and model

- Tool: Cursor
- Model: grok-4.7. The same model plans and writes the code.

## Mechanism

Cursor runs a project hook on its own. `.cursor/hooks.json` calls `.cursor/hooks/agent-capture.mjs` on `beforeSubmitPrompt`, `afterAgentResponse`, and `stop`.

`beforeSubmitPrompt` appends the prompt. `afterAgentResponse` appends the final response to the same session file. `stop` appends that response if it is still unwritten. Thinking and tool calls are not logged.

Logs go to `.agent-logs/YYYY-MM-DD_HH-MM-SS_<session-id>.md`. `.agent-logs/` is not listed in `.gitignore`. `.cursor/agent-capture-state/` is ignored; that directory is hook state, not the log.

## Log files

- Installing session, verbatim canary: `.agent-logs/2026-09-24_05-11-42_0f4f37f2-5812-4857-b1aa-baa7451a2d3c.md` (entries num=3)
- Fresh Agent session, passing canary: `.agent-logs/2026-09-24_05-34-33_1c7d0e5c-ba81-4b62-94db-92883c72a60b.md` (entries num=1)
- Earlier fresh-session attempt, left as written: `.agent-logs/2026-09-24_05-20-33_380f11e2-dc19-43b2-a3c0-08d1f768f02d.md`

## Canary entries, pasted raw

Installing session, prompt 3 and response 3:

```
[LOG_ENTRY type=PROMPT num=3 session=0f4f37f2]
timestamp: 2026-09-24T05:16:44.343Z
model: grok-4.7

CAPTURE TEST — 8x assignment, Habin Abdul Rahman


[LOG_ENTRY type=RESPONSE num=3 session=0f4f37f2]
timestamp: 2026-09-24T05:17:08.433Z
model: grok-4.7

This canary is verbatim. Prompt 3 in `.agent-logs/2026-09-24_05-11-42_0f4f37f2-5812-4857-b1aa-baa7451a2d3c.md` is `CAPTURE TEST — 8x assignment, Habin Abdul Rahman`, with a real em dash.

One session is not enough. Open a **new** Agent chat in this folder and send the same line once:

`CAPTURE TEST — 8x assignment, Habin Abdul Rahman`

I will not start the rebuild until that second file exists.
```

Fresh Agent session, prompt 1 and response 1:

```
[LOG_ENTRY type=PROMPT num=1 session=1c7d0e5c]
timestamp: 2026-09-24T05:34:33.678Z
model: grok-4.7

CAPTURE TEST — 8x assignment, Habin Abdul Rahman


[LOG_ENTRY type=RESPONSE num=1 session=1c7d0e5c]
timestamp: 2026-09-24T05:35:15.884Z
model: grok-4.7

The canary is verbatim. Prompt 1 in `.agent-logs/2026-09-24_05-34-33_1c7d0e5c-ba81-4b62-94db-92883c72a60b.md` is `CAPTURE TEST — 8x assignment, Habin Abdul Rahman`, with a real em dash (U+2014).

This reply is the final response for that prompt. The capture hook writes it when the turn ends.
```

## What did not work first

The first two prompts in `.agent-logs/2026-09-24_05-11-42_0f4f37f2-5812-4857-b1aa-baa7451a2d3c.md` stored the em dash as mojibake (`CAPTURE TEST â€” 8x assignment, Habin Abdul Rahman`). Those entries were left as written. Prompt 3 in that file is a real em dash.

The next fresh session, `.agent-logs/2026-09-24_05-20-33_380f11e2-dc19-43b2-a3c0-08d1f768f02d.md`, was the failed canary. The prompt is verbatim. The response that is in the file is the follow-up that reported the missing reply. The canary acknowledgement itself was not stored. The cause recorded in the later session log is that `fs.readSync(0)` returned end-of-file on Windows before Cursor finished writing the hook payload, so `stop` never appended the pending reply. That file was not edited. The hook now reads stdin with `fs.readFileSync(0)` and writes the response from `afterAgentResponse`, with `stop` as the fallback. The failed file, as it stands:

```
[LOG_ENTRY type=PROMPT num=1 session=380f11e2]
timestamp: 2026-09-24T05:20:33.882Z
model: grok-4.7

CAPTURE TEST — 8x assignment, Habin Abdul Rahman


[LOG_ENTRY type=RESPONSE num=1 session=380f11e2]
timestamp: 2026-09-24T05:22:32.427Z
model: grok-4.7

The canary prompt is in the log. The reply is not.

**Log file:** `c:\Users\habin\OneDrive\Desktop\fanthom ai\.agent-logs\2026-09-24_05-20-33_380f11e2-dc19-43b2-a3c0-08d1f768f02d.md`

That file has one entry, prompt 1:

`CAPTURE TEST — 8x assignment, Habin Abdul Rahman`

There is no `LOG_ENTRY type=RESPONSE` after it. The previous reply — the one that said this canary was verbatim and the capture gate had passed — does not appear in this file or in the other logs under `.agent-logs/`. The hook state for this session still has the prompt open and no response text saved, so `stop` has not written the reply yet.
```
