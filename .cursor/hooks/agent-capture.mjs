#!/usr/bin/env node
// 8x capture: prompt + final response only. Fires from Cursor hooks.
// beforeSubmitPrompt appends the prompt. afterAgentResponse keeps the latest
// assistant text. stop writes that text once, so tool steps never land in the log.

import fs from "node:fs";
import path from "node:path";

const AUTHOR = "habinrahman";
const PROJECT = "fanthom-ai";
const TOOL = "cursor";
const ROOT = process.env.AGENT_CAPTURE_ROOT || process.cwd();
const LOGS = path.join(ROOT, ".agent-logs");
const STATE = path.join(ROOT, ".cursor", "agent-capture-state");

function nowIso() {
  return new Date().toISOString();
}

// Cursor on Windows hands UTF-8 stdin through a cp1252 decode and a second UTF-8
// encode. Reverse that when it is reversible; leave already-valid text alone.
const CP1252_BYTE = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85,
  0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a,
  0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92,
  0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c,
  0x017e: 0x9e, 0x0178: 0x9f,
};

function undoWindowsMojibake(text) {
  const bytes = [];
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (CP1252_BYTE[cp] != null) bytes.push(CP1252_BYTE[cp]);
    else if (cp < 0x100) bytes.push(cp);
    else return text;
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(Buffer.from(bytes));
  } catch {
    return text;
  }
}

function readStdin() {
  const chunks = [];
  const buf = Buffer.alloc(64 * 1024);
  try {
    while (true) {
      const n = fs.readSync(0, buf, 0, buf.length, null);
      if (n === 0) break;
      chunks.push(Buffer.from(buf.subarray(0, n)));
    }
  } catch (error) {
    try {
      fs.mkdirSync(STATE, { recursive: true });
      fs.appendFileSync(path.join(STATE, "errors.log"), `${nowIso()} stdin ${error.stack}\n`);
    } catch {
      // never block the session
    }
    return {};
  }
  const raw = undoWindowsMojibake(Buffer.concat(chunks).toString("utf8")).trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (error) {
    try {
      fs.mkdirSync(STATE, { recursive: true });
      fs.appendFileSync(
        path.join(STATE, "errors.log"),
        `${nowIso()} json ${error.message} raw=${raw.slice(0, 500)}\n`,
      );
    } catch {
      // never block the session
    }
    return {};
  }
}

function sessionIdOf(input) {
  return input.conversation_id || input.session_id || "no-session";
}

function modelOf(input) {
  return input.model_id || input.model || "unknown";
}

function eventOf(input) {
  return input.hook_event_name || "";
}

function loadState(sessionId) {
  const file = path.join(STATE, `${sessionId}.json`);
  try {
    return { file, ...JSON.parse(fs.readFileSync(file, "utf8")) };
  } catch {
    return {
      file,
      logFile: null,
      num: 0,
      pending: null,
      openPrompt: false,
    };
  }
}

function saveState(state) {
  fs.mkdirSync(STATE, { recursive: true });
  const { file, ...data } = state;
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function stampFor(iso) {
  return new Date(iso).toISOString().replace("T", "_").replace(/:/g, "-").slice(0, 19);
}

function ensureLog(state, sessionId, timestamp) {
  if (state.logFile && fs.existsSync(state.logFile)) return state.logFile;
  fs.mkdirSync(LOGS, { recursive: true });
  const existing = fs.readdirSync(LOGS).find((name) => name.endsWith(`_${sessionId}.md`));
  if (existing) {
    state.logFile = path.join(LOGS, existing);
    return state.logFile;
  }
  const stamp = stampFor(timestamp);
  state.logFile = path.join(LOGS, `${stamp}_${sessionId}.md`);
  const date = stamp.slice(0, 10);
  const body =
    `# Session Log - ${date}\n\n` +
    `Session: \`${sessionId.slice(0, 8)}\` | Project: \`${PROJECT}\` | Author: \`${AUTHOR}\`\n\n` +
    `---\n\n`;
  fs.writeFileSync(state.logFile, frontmatter(sessionId, date, body) + body);
  return state.logFile;
}

function frontmatter(sessionId, date, body) {
  const prompts = [...body.matchAll(/^\[LOG_ENTRY type=PROMPT [^\]]*\]\r?\ntimestamp: (\S+)/gm)].map(
    (match) => match[1],
  );
  const models = [
    ...new Set(
      [...body.matchAll(/^\[LOG_ENTRY [^\]]*\]\r?\ntimestamp: \S+\r?\nmodel: (.+)/gm)].map(
        (match) => match[1],
      ),
    ),
  ];
  return [
    "---",
    `session_id: ${sessionId}`,
    `date: ${date}`,
    `author: ${AUTHOR}`,
    `model: ${models.join(", ") || "unknown"}`,
    `tool: ${TOOL}`,
    `project: ${PROJECT}`,
    `total_exchanges: ${prompts.length}`,
    `first_prompt_time: ${prompts[0] || ""}`,
    `last_prompt_time: ${prompts[prompts.length - 1] || ""}`,
    "---",
    "",
    "",
  ].join("\n");
}

function splitFile(current) {
  const end = current.indexOf("---\n", 4);
  const bodyStart = end === -1 ? 0 : end + 4;
  const body = current.slice(bodyStart).replace(/^\n+/, "");
  const date = /^date: (\S+)$/m.exec(current)?.[1] || nowIso().slice(0, 10);
  return { body, date };
}

function appendEntry(state, sessionId, { type, text, timestamp, model }) {
  const file = ensureLog(state, sessionId, timestamp);
  if (type === "PROMPT") state.num += 1;
  const entry =
    `[LOG_ENTRY type=${type} num=${state.num} session=${sessionId.slice(0, 8)}]\n` +
    `timestamp: ${timestamp}\n` +
    `model: ${model || "unknown"}\n\n` +
    `${text}\n\n\n`;
  const current = fs.readFileSync(file, "utf8");
  const { body, date } = splitFile(current);
  const nextBody = body + entry;
  fs.writeFileSync(file, frontmatter(sessionId, date, nextBody) + nextBody);
}

function flushPending(state, sessionId, timestamp) {
  if (!state.openPrompt || !state.pending) return;
  appendEntry(state, sessionId, {
    type: "RESPONSE",
    text: state.pending.text,
    timestamp: state.pending.timestamp || timestamp,
    model: state.pending.model,
  });
  state.pending = null;
  state.openPrompt = false;
}

function onPrompt(input, state, sessionId) {
  const timestamp = nowIso();
  flushPending(state, sessionId, timestamp);
  const prompt = typeof input.prompt === "string" ? input.prompt : "";
  if (!prompt.trim()) return;
  appendEntry(state, sessionId, {
    type: "PROMPT",
    text: prompt,
    timestamp,
    model: modelOf(input),
  });
  state.openPrompt = true;
  state.pending = null;
}

function onResponse(input, state) {
  const text = typeof input.text === "string" ? input.text : "";
  if (!text.trim() || !state.openPrompt) return;
  state.pending = { text, timestamp: nowIso(), model: modelOf(input) };
}

function onStop(input, state, sessionId) {
  const timestamp = nowIso();
  if (state.openPrompt && !state.pending) {
    state.pending = {
      text: "(no final response - the turn ended before the agent replied)",
      timestamp,
      model: modelOf(input),
    };
  }
  flushPending(state, sessionId, timestamp);
}

function main() {
  const input = readStdin();
  const sessionId = sessionIdOf(input);
  const state = loadState(sessionId);
  const event = eventOf(input);

  if (event === "beforeSubmitPrompt" || event === "UserPromptSubmit") onPrompt(input, state, sessionId);
  else if (event === "afterAgentResponse" || event === "AgentResponse") onResponse(input, state);
  else if (event === "stop") onStop(input, state, sessionId);

  saveState(state);
  if (event === "beforeSubmitPrompt" || event === "UserPromptSubmit") {
    process.stdout.write('{"continue":true}\n');
  }
}

try {
  main();
} catch (error) {
  try {
    fs.mkdirSync(STATE, { recursive: true });
    fs.appendFileSync(path.join(STATE, "errors.log"), `${nowIso()} ${error.stack}\n`);
  } catch {
    // a broken hook must not block the session
  }
}
process.exit(0);
