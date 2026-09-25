import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Meeting, MeetingSummary } from "@/lib/domain/types";

type ActionRow = { meeting_id: string; action_id: string; done: boolean };
type MeetingRow = { id: string; payload: Meeting };

let client: SupabaseClient | null = null;

function supabase() {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY are required");
  }
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

function mergeActions(meeting: Meeting, states: Map<string, boolean>): Meeting {
  return {
    ...meeting,
    actionItems: meeting.actionItems.map((item) => ({
      ...item,
      done: states.has(item.id) ? Boolean(states.get(item.id)) : item.done,
    })),
  };
}

async function statesFor(meetingIds: string[]) {
  const map = new Map<string, Map<string, boolean>>();
  if (meetingIds.length === 0) return map;
  const { data, error } = await supabase()
    .from("action_states")
    .select("meeting_id, action_id, done")
    .in("meeting_id", meetingIds);
  if (error) throw new Error(error.message);
  for (const row of (data ?? []) as ActionRow[]) {
    const states = map.get(row.meeting_id) ?? new Map<string, boolean>();
    states.set(row.action_id, row.done);
    map.set(row.meeting_id, states);
  }
  return map;
}

export async function listStoredMeetings(): Promise<Meeting[]> {
  const { data, error } = await supabase().from("meetings").select("id, payload");
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as MeetingRow[];
  const states = await statesFor(rows.map((row) => row.id));
  return rows.map((row) => mergeActions(row.payload, states.get(row.id) ?? new Map()));
}

export async function getStoredMeeting(id: string): Promise<Meeting | null> {
  const { data, error } = await supabase().from("meetings").select("id, payload").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const row = data as MeetingRow;
  const states = await statesFor([row.id]);
  return mergeActions(row.payload, states.get(row.id) ?? new Map());
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

export async function setActionDone(meetingId: string, actionId: string, done: boolean): Promise<Meeting | null> {
  const meeting = await getStoredMeeting(meetingId);
  if (!meeting || !meeting.actionItems.some((item) => item.id === actionId)) return null;
  const { error } = await supabase().from("action_states").upsert(
    { meeting_id: meetingId, action_id: actionId, done },
    { onConflict: "meeting_id,action_id" },
  );
  if (error) throw new Error(error.message);
  return getStoredMeeting(meetingId);
}
