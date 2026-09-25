import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

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

const sql = readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8");
const projectRef = new URL(url).hostname.split(".")[0];
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (accessToken) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!response.ok) {
    console.error(`schema query failed: ${response.status}`);
    process.exit(1);
  }
  console.log("schema applied");
  process.exit(0);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const probe = await supabase.from("meetings").select("id", { head: true, count: "exact" });
if (!probe.error) {
  console.log("schema already present");
  process.exit(0);
}

console.error("tables are missing and SUPABASE_ACCESS_TOKEN is not set, so DDL cannot run");
process.exit(1);
