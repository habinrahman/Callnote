import { getMeeting } from "@/lib/domain/queries";

export type CalendarStatus = "upcoming" | "ready" | "scheduled" | "recorded";

export type ScriptLine = {
  speaker: string;
  role: string;
  startSec: number;
  text: string;
};

export type CalendarMeeting = {
  id: string;
  title: string;
  startsAt: string;
  durationMin: number;
  platform: string;
  status: CalendarStatus;
  libraryHref: string | null;
  participants: { name: string; role: string }[];
  script: ScriptLine[];
  notes: {
    headline: string;
    summary: string;
    decisions: { text: string; timestampSec: number }[];
    actions: { task: string; owner: string; dueDate: string; timestampSec: number }[];
    topics: { label: string; detail: string; timestampSec: number }[];
    followUps: string[];
  };
};

const checkout = getMeeting("reliability-review");
const northwind = getMeeting("northwind-renewal");
const helio = getMeeting("helio-discovery");

function people(id: string) {
  return (getMeeting(id)?.speakers ?? []).map((person) => ({ name: person.name, role: person.role }));
}

export const calendarMeetings: CalendarMeeting[] = [
  {
    id: "reliability-review",
    title: "Checkout outage review",
    startsAt: "2026-09-24T09:00:00.000Z",
    durationMin: 60,
    platform: "Google Meet",
    status: "ready",
    libraryHref: "/meetings/reliability-review/",
    participants: people("reliability-review"),
    script: [
      { speaker: "Priya Shah", role: "Engineering manager", startSec: 8, text: "Let's start with Tuesday. Luis, walk us through what customers actually felt." },
      { speaker: "Luis Ortega", role: "SRE", startSec: 21, text: "Checkout returned 503s for eleven minutes, starting at 14:06 UTC. Error rate peaked at 18 percent." },
      { speaker: "Hannah Brooks", role: "Product", startSec: 36, text: "The biggest customer impact was three enterprise renewals stuck mid-cart. Did anyone get a partial charge?" },
      { speaker: "Evan Cho", role: "Backend", startSec: 48, text: "No double charges. The payment service timed out before capture, so the carts were abandoned, not billed." },
      { speaker: "Luis Ortega", role: "SRE", startSec: 62, text: "This single incident spent 40 percent of the monthly error budget. We have one more event this size before we miss the SLO." },
      { speaker: "Priya Shah", role: "Engineering manager", startSec: 78, text: "I want a decision, not a postmortem that trails off. Are we freezing non-critical deploys?" },
      { speaker: "Luis Ortega", role: "SRE", startSec: 92, text: "Yes. Freeze anything that isn't a fix for this incident until Friday. I'll own the exception list." },
      { speaker: "Priya Shah", role: "Engineering manager", startSec: 108, text: "Timeline today, freeze in CI today, customers today, status page tomorrow. Friday we decide if the freeze lifts." },
    ],
    notes: {
      headline: checkout?.templates[0]?.headline ?? "Checkout failed, no one was charged, and deploys pause until Friday.",
      summary: checkout?.templates[0]?.executiveSummary ?? "Checkout returned errors for eleven minutes. The group froze non-critical deploys until Friday.",
      decisions: [
        { text: "Freeze non-critical deploys until Friday, with Luis owning the exception list.", timestampSec: 92 },
      ],
      actions: [
        { task: "Publish the incident timeline in the order customers felt it.", owner: "Luis Ortega", dueDate: "2026-09-24", timestampSec: 108 },
        { task: "Fail CI unless a change during the freeze is labeled as an incident fix.", owner: "Evan Cho", dueDate: "2026-09-24", timestampSec: 92 },
        { task: "Write the three enterprise accounts before the end of the day.", owner: "Hannah Brooks", dueDate: "2026-09-24", timestampSec: 36 },
      ],
      topics: [
        { label: "Customer impact", detail: "Eleven minutes of checkout 503s, with three enterprise renewals stuck mid-cart and no partial charges.", timestampSec: 21 },
        { label: "Error budget spent", detail: "This incident used 40 percent of the monthly error budget.", timestampSec: 62 },
      ],
      followUps: ["Friday review decides whether the deploy freeze lifts.", "Status page work is reviewed tomorrow morning."],
    },
  },
  {
    id: "northwind-renewal",
    title: "Northwind renewal",
    startsAt: "2026-09-24T13:00:00.000Z",
    durationMin: 30,
    platform: "Zoom",
    status: "upcoming",
    libraryHref: null,
    participants: people("northwind-renewal"),
    script: [
      { speaker: "Maya Chen", role: "Account executive", startSec: 8, text: "Thanks for making time, Jonah. I want to settle the renewal before the contract rolls on October 1." },
      { speaker: "Jonah Patel", role: "VP Operations, Northwind", startSec: 21, text: "We're planning to renew. The open question is whether we add the warehouse seats or stay at twenty-four." },
      { speaker: "Maya Chen", role: "Account executive", startSec: 36, text: "Usage says that team is sharing logins. They're the group that would actually feel eight more seats." },
      { speaker: "Jonah Patel", role: "VP Operations, Northwind", startSec: 52, text: "If we add eight, I need this year's rate held. I'm not taking a surprise uplift into finance." },
      { speaker: "Maya Chen", role: "Account executive", startSec: 68, text: "I can hold the rate if we sign before Friday. After that the new price list applies." },
      { speaker: "Jonah Patel", role: "VP Operations, Northwind", startSec: 84, text: "Then my decision is we renew, we add eight seats, and we don't announce it internally until the DPA is countersigned." },
    ],
    notes: {
      headline: northwind?.templates[0]?.headline ?? "Northwind will renew if the papers land before Friday.",
      summary: northwind?.templates[0]?.executiveSummary ?? "Jonah will renew and add eight seats at this year's rate if the contract is signed before Friday.",
      decisions: [
        { text: "Renew and add eight seats, held at this year's rate if signed before Friday.", timestampSec: 84 },
        { text: "Do not announce the extra seats internally until the DPA is countersigned.", timestampSec: 84 },
      ],
      actions: [
        { task: "Send the order form for 32 seats at the current rate, with the DPA.", owner: "Maya Chen", dueDate: "2026-09-26", timestampSec: 68 },
        { task: "Confirm the eight new seat names.", owner: "Jonah Patel", dueDate: "2026-09-25", timestampSec: 21 },
      ],
      topics: [
        { label: "Seat count", detail: "Warehouse staff are sharing logins. The renewal adds eight seats.", timestampSec: 36 },
        { label: "Price hold", detail: "The current rate holds only if the papers are signed before Friday.", timestampSec: 52 },
      ],
      followUps: northwind?.templates[0]?.followUps ?? ["Maya sends papers before Friday."],
    },
  },
  {
    id: "helio-discovery",
    title: "Helio Health discovery",
    startsAt: "2026-09-24T15:30:00.000Z",
    durationMin: 22,
    platform: "Google Meet",
    status: "scheduled",
    libraryHref: null,
    participants: people("helio-discovery"),
    script: [
      { speaker: "Maya Chen", role: "Account executive", startSec: 6, text: "Devon, I'd rather spend this call on whether a pilot is even allowed inside Helio than on a feature tour." },
      { speaker: "Devon Ellis", role: "Director of Operations, Helio Health", startSec: 18, text: "Our constraint is HIPAA. If recordings leave our tenant, the pilot dies in security review." },
      { speaker: "Maya Chen", role: "Account executive", startSec: 34, text: "Notes can stay in your workspace, with video deleted on a schedule you set. We don't train on customer meetings." },
      { speaker: "Devon Ellis", role: "Director of Operations, Helio Health", startSec: 50, text: "Good. Budget is a twelve-week pilot. If two managers still use it in week eight, I'll take it to procurement." },
    ],
    notes: {
      headline: helio?.templates[0]?.headline ?? "Helio will pilot only inside their tenant.",
      summary: helio?.templates[0]?.executiveSummary ?? "Devon will not run a pilot unless recordings stay in Helio's tenant.",
      decisions: [
        { text: "A pilot only proceeds if recordings stay in Helio's tenant and the BAA says so.", timestampSec: 18 },
        { text: "Success is two managers still using it in week eight.", timestampSec: 50 },
      ],
      actions: [
        { task: "Send the BAA and the data-flow diagram.", owner: "Maya Chen", dueDate: "2026-09-25", timestampSec: 34 },
        { task: "Write the twelve-week mutual plan.", owner: "Maya Chen", dueDate: "2026-09-26", timestampSec: 50 },
      ],
      topics: [
        { label: "HIPAA", detail: "Security will stop the pilot if recordings leave the tenant.", timestampSec: 18 },
        { label: "Pilot length", detail: "Twelve weeks. Procurement comes after week eight if usage holds.", timestampSec: 50 },
      ],
      followUps: helio?.templates[0]?.followUps ?? ["Security review follows the BAA."],
    },
  },
];

export function getCalendarMeeting(id: string) {
  return calendarMeetings.find((meeting) => meeting.id === id) ?? null;
}
