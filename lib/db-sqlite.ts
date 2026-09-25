import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { meetings as seedMeetings } from "@/lib/seed/meetings";
import type { Meeting, MeetingSummary } from "@/lib/domain/types";

type CountRow = { n: number };
type PayloadRow = { id: string; payload: string };
type ActionRow = { meeting_id: string; action_id: string; done: number };

let database: DatabaseSync | null = null;

function file() {
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "callnote.db");
}

function db() {
  if (database) return database;
  const opened = new DatabaseSync(file());
  opened.exec(`
    CREATE TABLE IF NOT EXISTS meetings (
      id TEXT PRIMARY KEY,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS action_states (
      meeting_id TEXT NOT NULL,
      action_id TEXT NOT NULL,
      done INTEGER NOT NULL,
      PRIMARY KEY (meeting_id, action_id)
    );
  `);
  const count = opened.prepare("SELECT COUNT(*) AS n FROM meetings").get() as CountRow;
  if (count.n === 0) {
    const insertMeeting = opened.prepare("INSERT INTO meetings (id, payload) VALUES (?, ?)");
    const insertAction = opened.prepare(
      "INSERT INTO action_states (meeting_id, action_id, done) VALUES (?, ?, ?)",
    );
    for (const meeting of seedMeetings) {
      insertMeeting.run(meeting.id, JSON.stringify(meeting));
      for (const action of meeting.actionItems) {
        insertAction.run(meeting.id, action.id, action.done ? 1 : 0);
      }
    }
  }
  database = opened;
  return opened;
}

function statesFor(meetingId: string) {
  const rows = db()
    .prepare("SELECT meeting_id, action_id, done FROM action_states WHERE meeting_id = ?")
    .all(meetingId) as ActionRow[];
  return new Map(rows.map((row) => [row.action_id, row.done === 1]));
}

function withActions(meeting: Meeting): Meeting {
  const states = statesFor(meeting.id);
  return {
    ...meeting,
    actionItems: meeting.actionItems.map((item) => ({
      ...item,
      done: states.has(item.id) ? Boolean(states.get(item.id)) : item.done,
    })),
  };
}

export function listStoredMeetings(): Meeting[] {
  const rows = db().prepare("SELECT id, payload FROM meetings").all() as PayloadRow[];
  return rows.map((row) => withActions(JSON.parse(row.payload) as Meeting));
}

export function getStoredMeeting(id: string): Meeting | null {
  const row = db().prepare("SELECT id, payload FROM meetings WHERE id = ?").get(id) as PayloadRow | undefined;
  if (!row) return null;
  return withActions(JSON.parse(row.payload) as Meeting);
}

export function summarize(meeting: Meeting): MeetingSummary {
  const openActionCount = meeting.actionItems.filter((item) => !item.done).length;
  return {
    id: meeting.id,
    title: meeting.title,
    startedAt: meeting.startedAt,
    durationSec: meeting.durationSec,
    status: meeting.status,
    participants: meeting.speakers.map((speaker) => speaker.name),
    preview: meeting.preview,
    openActionCount,
    actionCount: meeting.actionItems.length,
    highlightCount: meeting.highlights.length,
  };
}

export function setActionDone(meetingId: string, actionId: string, done: boolean): Meeting | null {
  const meeting = getStoredMeeting(meetingId);
  if (!meeting || !meeting.actionItems.some((item) => item.id === actionId)) return null;
  db()
    .prepare(
      `INSERT INTO action_states (meeting_id, action_id, done) VALUES (?, ?, ?)
       ON CONFLICT(meeting_id, action_id) DO UPDATE SET done = excluded.done`,
    )
    .run(meetingId, actionId, done ? 1 : 0);
  return getStoredMeeting(meetingId);
}
