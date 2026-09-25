import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { meetings as seedMeetings } from "../lib/seed/meetings";

function loadEnv() {
  const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const name = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[name]) process.env[name] = value;
  }
}

loadEnv();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL and SUPABASE_SECRET_KEY are required in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const existing = await supabase.from("meetings").select("id", { count: "exact", head: true });
  if (existing.error) {
    console.error(existing.error.message);
    process.exit(1);
  }
  if ((existing.count ?? 0) > 0) {
    console.log(`seed skipped: ${existing.count} meetings already present`);
    process.exit(0);
  }

  const meetingRows = seedMeetings.map((meeting) => ({ id: meeting.id, payload: meeting }));
  const inserted = await supabase.from("meetings").insert(meetingRows);
  if (inserted.error) {
    console.error(inserted.error.message);
    process.exit(1);
  }

  const actionRows = seedMeetings.flatMap((meeting) =>
    meeting.actionItems.map((action) => ({
      meeting_id: meeting.id,
      action_id: action.id,
      done: action.done,
    })),
  );
  const actions = await supabase.from("action_states").insert(actionRows);
  if (actions.error) {
    console.error(actions.error.message);
    process.exit(1);
  }

  console.log(`seeded ${meetingRows.length} meetings and ${actionRows.length} action states`);
}

main();
