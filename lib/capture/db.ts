export type CapturedHighlight = {
  id: string;
  startSec: number;
  label: string;
  speaker: string;
  excerpt: string;
};

export type CapturedLine = {
  speaker: string;
  role: string;
  startSec: number;
  text: string;
};

export type CapturedMeeting = {
  id: string;
  sourceId: string;
  title: string;
  startedAt: string;
  durationSec: number;
  platform: string;
  participants: { name: string; role: string }[];
  lines: CapturedLine[];
  highlights: CapturedHighlight[];
  notes: {
    headline: string;
    summary: string;
    decisions: { text: string; timestampSec: number }[];
    actions: { task: string; owner: string; dueDate: string; timestampSec: number }[];
    topics: { label: string; detail: string; timestampSec: number }[];
    followUps: string[];
  };
  audio: Blob | null;
};

const DB_NAME = "callnote-capture";
const STORE = "meetings";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveCaptured(meeting: CapturedMeeting) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(meeting);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function listCaptured(): Promise<CapturedMeeting[]> {
  const db = await openDb();
  const rows = await new Promise<CapturedMeeting[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result as CapturedMeeting[]);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return rows.sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
}

export async function getCaptured(id: string): Promise<CapturedMeeting | null> {
  const db = await openDb();
  const row = await new Promise<CapturedMeeting | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).get(id);
    request.onsuccess = () => resolve((request.result as CapturedMeeting) ?? null);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return row;
}

export const calendarStorageKey = "callnote-calendar-demo";

export type CalendarConnection = {
  provider: "Google Calendar" | "Microsoft Outlook";
  name: string;
};

export function readCalendarConnection(): CalendarConnection | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(calendarStorageKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CalendarConnection;
  } catch {
    return null;
  }
}

export function writeCalendarConnection(connection: CalendarConnection | null) {
  if (connection) window.localStorage.setItem(calendarStorageKey, JSON.stringify(connection));
  else window.localStorage.removeItem(calendarStorageKey);
}
