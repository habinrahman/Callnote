import {
  action,
  clipFrom,
  decision,
  highlightFrom,
  layOut,
  moment,
  speaker,
  topic,
} from "@/lib/seed/build";
import type { Meeting } from "@/lib/domain/types";

const northwindLines = [
  { speakerId: "maya", text: "Thanks for making time, Jonah. I want to settle the renewal before the contract rolls on October 1." },
  { speakerId: "jonah", text: "We're planning to renew. The open question is whether we add the warehouse seats or stay at twenty-four." },
  { speakerId: "maya", text: "Usage says that team is sharing logins. They're the group that would actually feel eight more seats." },
  { speakerId: "jonah", text: "If we add eight, I need this year's rate held. I'm not taking a surprise uplift into finance." },
  { speakerId: "maya", text: "I can hold the rate if we sign before Friday. After that the new price list applies." },
  { speakerId: "jonah", text: "Friday works if legal has the DPA back. They flagged the subprocessors list last week." },
  { speakerId: "maya", text: "I'll send the updated subprocessors today and stay on the thread with your counsel." },
  { speakerId: "jonah", text: "The other gate is the security questionnaire. Our insurer asked for it before they'll sign off." },
  { speakerId: "maya", text: "I have last quarter's answers. I'll refresh retention and send them tomorrow morning." },
  { speakerId: "jonah", text: "Retention is the section they'll read. We need meeting video deleted at twelve months, not kept indefinitely." },
  { speakerId: "maya", text: "That's already the default on your workspace. I'll point them at the setting so nobody has to hunt." },
  { speakerId: "jonah", text: "Then my decision is we renew, we add eight seats, and we don't announce it internally until the DPA is countersigned." },
  { speakerId: "maya", text: "I'll draft the order form for thirty-two seats at the current rate and send it with the DPA tonight." },
  { speakerId: "jonah", text: "Copy Amira in finance. She'll block time to sign if the papers are clean." },
  { speakerId: "maya", text: "One action on your side: confirm the eight names. We provision seats from that list." },
  { speakerId: "jonah", text: "I'll send the names Thursday. If legal slips, we still sign the commercial terms and start the seats on the first." },
];

const northwindSegments = layOut("northwind-renewal", 14 * 60, northwindLines);

const reliabilityLines = [
  { speakerId: "priya", text: "Let's start with Tuesday. Luis, walk us through what customers actually felt." },
  { speakerId: "luis", text: "Checkout returned 503s for eleven minutes, starting at 14:06 UTC. Error rate peaked at 18 percent." },
  { speakerId: "nora", text: "Support took 64 tickets in that window. Most were mid-cart, and three were enterprise renewals." },
  { speakerId: "hannah", text: "Those three accounts are the ones I care about. Did anyone get a partial charge?" },
  { speakerId: "evan", text: "No double charges. The payment service timed out before capture, so the carts were abandoned, not billed." },
  { speakerId: "sam", text: "The status page still said operational for the first six minutes. That's the part people will remember." },
  { speakerId: "luis", text: "The page only watches the edge probe. It never saw the payment dependency fail." },
  { speakerId: "priya", text: "So the incident is real, and our public signal was late. What burned the error budget?" },
  { speakerId: "luis", text: "This single incident spent 40 percent of the monthly error budget. We have one more event this size before we miss the SLO." },
  { speakerId: "evan", text: "The trigger was a retry storm. When payment slowed, checkout retried without a cap and pinned the pool." },
  { speakerId: "priya", text: "Do we know why payment slowed in the first place?" },
  { speakerId: "luis", text: "A bad deploy of the ledger service. The migration locked a hot table. We rolled it back at 14:17." },
  { speakerId: "hannah", text: "Who approved that deploy during the retail peak?" },
  { speakerId: "evan", text: "I did. The change looked safe in staging because staging doesn't have that table size." },
  { speakerId: "nora", text: "Customers don't care that staging was small. They care that checkout died on a Tuesday." },
  { speakerId: "sam", text: "If we freeze deploys, the status page still needs a human sentence. The green checkmark made us look careless." },
  { speakerId: "priya", text: "I want a decision, not a postmortem that trails off. Are we freezing non-critical deploys?" },
  { speakerId: "luis", text: "Yes. Freeze anything that isn't a fix for this incident until Friday. I'll own the exception list." },
  { speakerId: "evan", text: "I can put the freeze in CI today so it isn't a Slack promise. The job fails unless the change is labeled incident." },
  { speakerId: "hannah", text: "Product will tell the three enterprise accounts what happened, in plain language, before end of day." },
  { speakerId: "nora", text: "Support needs a one-paragraph reply we can paste. I'll tag every ticket from the window so we can see who we still owe." },
  { speakerId: "sam", text: "I'll rewrite the status component so a dependency failure can't sit on operational. That's a design change, not a banner." },
  { speakerId: "priya", text: "Good. Luis publishes the timeline today. Evan guards the freeze. Nora tags the tickets. Hannah writes the customers." },
  { speakerId: "luis", text: "I'll also add the payment probe to the status page before we lift the freeze. Otherwise we'll do this again." },
  { speakerId: "evan", text: "The retry cap ships with the freeze exception. Uncapped retries are how a slow dependency becomes an outage." },
  { speakerId: "hannah", text: "Don't mention error budgets to customers. Tell them checkout failed, no one was charged, and deploys are paused." },
  { speakerId: "nora", text: "Agreed. The word SLO does not belong in a support macro." },
  { speakerId: "sam", text: "I'll show the dependency as its own row: checkout, payments, sign-in. People can see which one is hurt." },
  { speakerId: "priya", text: "We review that mock tomorrow morning. If it's clear, it goes out with the probe, not after." },
  { speakerId: "luis", text: "On-call stays with me through Thursday night. If the ledger migration is retried, I want to be the one who stops it." },
  { speakerId: "evan", text: "I won't retry it. The next version runs the lock in batches. I'll put the plan in the incident doc." },
  { speakerId: "hannah", text: "Marketing asked if they can ship the homepage test. The answer is no until Friday." },
  { speakerId: "priya", text: "Correct. The freeze includes marketing deploys. Say that explicitly so it doesn't come back as a side door." },
  { speakerId: "nora", text: "I'll send the macro to the queue in the next hour. If a ticket is an enterprise renewal, it gets a human, not the macro." },
  { speakerId: "sam", text: "I'll sit with Luis on the probe names so the status page uses the same words support uses." },
  { speakerId: "luis", text: "Use checkout, payments, and sign-in. Don't invent a fourth name in the doc and a fifth on the page." },
  { speakerId: "priya", text: "We're done. Timeline today, freeze in CI today, customers today, status page tomorrow. Friday we decide if the freeze lifts." },
];

const reliabilitySegments = layOut("reliability-review", 48 * 60, reliabilityLines);

const helioLines = [
  { speakerId: "maya", text: "Devon, I'd rather spend this call on whether a pilot is even allowed inside Helio than on a feature tour." },
  { speakerId: "devon", text: "Our constraint is HIPAA. If recordings leave our tenant, the pilot dies in security review." },
  { speakerId: "maya", text: "Notes can stay in your workspace, with video deleted on a schedule you set. We don't train on customer meetings." },
  { speakerId: "devon", text: "I need that in the BAA, not in a sales deck. Legal will not accept a screenshot." },
  { speakerId: "maya", text: "Fair. I'll send the BAA and the data-flow diagram today, and I'll mark where audio is stored." },
  { speakerId: "devon", text: "The pilot group is clinic managers, about twelve people. They live in back-to-back patient handoffs." },
  { speakerId: "maya", text: "Then the thing they'll use is the summary and the action list, not the full transcript." },
  { speakerId: "devon", text: "If a summary invents a follow-up that nobody said, that's a safety problem, not a wording nit." },
  { speakerId: "maya", text: "We'll turn the pilot on with summaries that cite a timestamp, so a manager can check the line." },
  { speakerId: "devon", text: "Good. Budget is a twelve-week pilot. If two managers still use it in week eight, I'll take it to procurement." },
  { speakerId: "maya", text: "I'll write that success line into the mutual plan so we aren't arguing about it later." },
  { speakerId: "devon", text: "Send the BAA, the diagram, and the plan. I'll book security for Thursday." },
];

const helioSegments = layOut("helio-discovery", 22 * 60, helioLines);

const oneOnOneLines = [
  { speakerId: "priya", text: "Before the incident work, I want ten minutes on how you're actually doing." },
  { speakerId: "luis", text: "Tired. Tuesday night was mine, and the page being wrong made it worse than the outage." },
  { speakerId: "priya", text: "You shouldn't be the only person who can say the status page is lying. That's a rotation problem." },
  { speakerId: "luis", text: "The on-call rotation still assumes a quiet week. It doesn't survive a retail peak plus a migration." },
  { speakerId: "priya", text: "We'll add Evan as secondary through Friday, and we'll revisit the rotation after the freeze lifts." },
  { speakerId: "luis", text: "That helps. I also want the incident doc to be something Nora can read, not just engineering." },
  { speakerId: "priya", text: "Write the timeline in the order customers felt it. I'll review it before it goes to Hannah." },
  { speakerId: "luis", text: "I'll have that draft by four. If it's messy, I'd rather you see the messy version." },
  { speakerId: "priya", text: "Send the messy version. I'd rather edit a true timeline than wait for a polished wrong one." },
];

const oneOnOneSegments = layOut("priya-luis-1on1", 18 * 60, oneOnOneLines);

export const meetings: Meeting[] = [
  {
    id: "alex-interview",
    title: "Interview loop — Alex Rivera, product engineer",
    startedAt: "2026-09-24T07:30:00.000Z",
    durationSec: 45 * 60,
    status: "processing",
    speakers: [
      speaker("priya", "Priya Shah", "Engineering manager"),
      speaker("alex", "Alex Rivera", "Candidate"),
      speaker("evan", "Evan Cho", "Backend"),
    ],
    segments: [],
    highlights: [],
    actionItems: [],
    decisions: [],
    topics: [],
    moments: [],
    templates: [
      {
        id: "general",
        name: "General",
        headline: "Notes are still being written",
        executiveSummary: "The notetaker is still turning this interview into a transcript and a summary.",
        followUps: [],
      },
    ],
    defaultTemplateId: "general",
    clips: [],
    preview: "The notetaker is still writing this up. Transcript and summary will land on this page.",
  },
  {
    id: "reliability-review",
    title: "Checkout outage review",
    startedAt: "2026-09-23T13:00:00.000Z",
    durationSec: 48 * 60,
    status: "ready",
    speakers: [
      speaker("priya", "Priya Shah", "Engineering manager"),
      speaker("luis", "Luis Ortega", "SRE"),
      speaker("hannah", "Hannah Brooks", "Product"),
      speaker("evan", "Evan Cho", "Backend"),
      speaker("nora", "Nora Ibrahim", "Support"),
      speaker("sam", "Sam Wright", "Design"),
    ],
    segments: reliabilitySegments,
    highlights: [
      highlightFrom("reliability-review", reliabilitySegments, 1, "Customer impact"),
      highlightFrom("reliability-review", reliabilitySegments, 8, "Error budget spent"),
      highlightFrom("reliability-review", reliabilitySegments, 17, "Deploy freeze"),
    ],
    actionItems: [
      action("rel-a1", "Publish the incident timeline in the order customers felt it.", "Luis Ortega", "2026-09-23", reliabilitySegments[1].startSec),
      action("rel-a2", "Fail CI unless a change during the freeze is labeled as an incident fix.", "Evan Cho", "2026-09-23", reliabilitySegments[18].startSec),
      action("rel-a3", "Tag every support ticket from the 14:06 window and paste the shared reply.", "Nora Ibrahim", "2026-09-23", reliabilitySegments[20].startSec),
      action("rel-a4", "Write the three enterprise accounts before the end of the day.", "Hannah Brooks", "2026-09-23", reliabilitySegments[19].startSec),
      action("rel-a5", "Show checkout, payments, and sign-in as separate status rows.", "Sam Wright", "2026-09-24", reliabilitySegments[27].startSec, true),
    ],
    decisions: [
      decision("rel-d1", "Freeze non-critical deploys, including marketing, until Friday.", reliabilitySegments[17].startSec),
      decision("rel-d2", "No customer note should mention the error budget or the SLO.", reliabilitySegments[25].startSec),
      decision("rel-d3", "Friday's review decides whether the freeze lifts.", reliabilitySegments[35].startSec),
    ],
    topics: [
      topic("rel-k1", "What customers felt", "Checkout returned 503s for eleven minutes. Carts were abandoned, not double-charged.", reliabilitySegments[1].startSec),
      topic("rel-k2", "Why it happened", "A ledger migration locked a hot table, then uncapped retries pinned checkout.", reliabilitySegments[11].startSec),
      topic("rel-k3", "Error budget", "This one incident spent 40 percent of the monthly budget.", reliabilitySegments[8].startSec),
      topic("rel-k4", "Status page", "It stayed on operational because it only watched the edge probe.", reliabilitySegments[5].startSec),
    ],
    moments: [
      moment("rel-m1", "Eleven minutes of 503s", reliabilitySegments[1].startSec, reliabilitySegments[1].text),
      moment("rel-m2", "Freeze called", reliabilitySegments[17].startSec, reliabilitySegments[17].text),
      moment("rel-m3", "Customer language agreed", reliabilitySegments[25].startSec, reliabilitySegments[25].text),
    ],
    templates: [
      {
        id: "general",
        name: "General",
        headline: "Checkout failed for eleven minutes. Deploys are frozen until Friday.",
        executiveSummary:
          "A ledger migration locked a hot table and checkout retries piled on, so shoppers saw 503s from 14:06 UTC. Nobody was double-charged. The status page stayed green because it never watched payments. The room froze non-critical deploys until Friday, put the freeze in CI, and split customer updates away from internal SLO language.",
        followUps: [
          "Friday review decides if the freeze lifts.",
          "Status page mock is reviewed tomorrow morning with the new payment probe.",
        ],
      },
      {
        id: "incident",
        name: "Incident review",
        headline: "SEV: checkout 503s, 14:06–14:17 UTC. Rollback completed. Budget hit: 40 percent.",
        executiveSummary:
          "Impact was abandoned carts, not duplicate charges, across an eleven-minute window and 64 support tickets. Cause was a ledger migration plus uncapped retries. Detection lagged because the status page probed only the edge. Containment is a deploy freeze through Friday and a CI gate. Corrective work is a payment probe and a status page that names the dependency.",
        followUps: [
          "Exception list for the freeze lives with Luis.",
          "Next ledger migration must lock in batches. Evan owns that plan.",
        ],
      },
    ],
    defaultTemplateId: "general",
    clips: [
      clipFrom(
        "reliability-freeze",
        "The deploy freeze",
        "Priya asks for a decision, and Luis takes the freeze through Friday.",
        reliabilitySegments,
        16,
        18,
      ),
    ],
    preview: "Checkout was down for eleven minutes. The team froze non-critical deploys until Friday.",
  },
  {
    id: "northwind-renewal",
    title: "Northwind renewal",
    startedAt: "2026-09-22T19:30:00.000Z",
    durationSec: 14 * 60,
    status: "ready",
    speakers: [
      speaker("maya", "Maya Chen", "Account executive"),
      speaker("jonah", "Jonah Patel", "VP Operations, Northwind"),
    ],
    segments: northwindSegments,
    highlights: [
      highlightFrom("northwind-renewal", northwindSegments, 4, "Rate held through Friday"),
      highlightFrom("northwind-renewal", northwindSegments, 11, "Decision to renew"),
    ],
    actionItems: [
      action("nw-a1", "Send the updated subprocessors list and stay on the thread with Northwind counsel.", "Maya Chen", "2026-09-22", northwindSegments[6].startSec, true),
      action("nw-a2", "Refresh the security questionnaire, especially retention, and send it.", "Maya Chen", "2026-09-23", northwindSegments[8].startSec),
      action("nw-a3", "Send the order form for 32 seats at the current rate, with the DPA, and copy Amira.", "Maya Chen", "2026-09-22", northwindSegments[12].startSec),
      action("nw-a4", "Confirm the eight new seat names.", "Jonah Patel", "2026-09-24", northwindSegments[14].startSec),
    ],
    decisions: [
      decision("nw-d1", "Renew and add eight seats, held at this year's rate if signed before Friday.", northwindSegments[11].startSec),
      decision("nw-d2", "Do not announce the extra seats internally until the DPA is countersigned.", northwindSegments[11].startSec),
    ],
    topics: [
      topic("nw-k1", "Seat count", "Warehouse staff are sharing logins. The renewal adds eight seats, from 24 to 32.", northwindSegments[2].startSec),
      topic("nw-k2", "Price hold", "The current rate holds only if the papers are signed before Friday.", northwindSegments[4].startSec),
      topic("nw-k3", "Security review", "Legal wants the DPA. The insurer wants a refreshed questionnaire. Video retention is twelve months.", northwindSegments[9].startSec),
    ],
    moments: [
      moment("nw-m1", "Friday deadline", northwindSegments[4].startSec, northwindSegments[4].text),
      moment("nw-m2", "Renewal decision", northwindSegments[11].startSec, northwindSegments[11].text),
    ],
    templates: [
      {
        id: "general",
        name: "General",
        headline: "Northwind will renew at 32 seats if the DPA and order form land before Friday.",
        executiveSummary:
          "Jonah will renew and add eight warehouse seats, but only at this year's rate and only if the contract is signed before Friday. Legal is blocked on the DPA and subprocessors list. The insurer wants the security questionnaire, with twelve-month video retention called out. Internal announcement waits until the DPA is countersigned.",
        followUps: [
          "If legal slips, commercial terms can still be signed and seats start on the first.",
          "Amira in finance needs the clean papers in time to sign.",
        ],
      },
      {
        id: "follow-up",
        name: "Customer follow-up",
        headline: "Papers Jonah is waiting on before Friday.",
        executiveSummary:
          "You agreed to renew at 32 seats at the current rate, provided we sign before Friday. I'll send the subprocessors update, the DPA, the order form, and a questionnaire that spells out twelve-month video deletion. Please send the eight names on Thursday and loop in Amira once the draft looks clean.",
        followUps: [
          "Maya sends papers tonight.",
          "Jonah sends seat names Thursday.",
        ],
      },
    ],
    defaultTemplateId: "general",
    clips: [
      clipFrom(
        "northwind-decision",
        "Jonah's renewal decision",
        "The renewal, the eight seats, and the decision to wait on an internal announcement.",
        northwindSegments,
        11,
        13,
      ),
    ],
    preview: "Northwind renews at 32 seats if the DPA and order form are signed before Friday.",
  },
  {
    id: "helio-discovery",
    title: "Helio Health discovery",
    startedAt: "2026-09-18T15:00:00.000Z",
    durationSec: 22 * 60,
    status: "ready",
    speakers: [
      speaker("maya", "Maya Chen", "Account executive"),
      speaker("devon", "Devon Ellis", "Director of Operations, Helio Health"),
    ],
    segments: helioSegments,
    highlights: [
      highlightFrom("helio-discovery", helioSegments, 1, "HIPAA constraint"),
      highlightFrom("helio-discovery", helioSegments, 9, "Pilot success line"),
    ],
    actionItems: [
      action("he-a1", "Send the BAA and the data-flow diagram, with audio storage marked.", "Maya Chen", "2026-09-18", helioSegments[4].startSec, true),
      action("he-a2", "Write the mutual plan: twelve weeks, and two managers still active in week eight.", "Maya Chen", "2026-09-19", helioSegments[10].startSec),
      action("he-a3", "Book security review for Thursday.", "Devon Ellis", "2026-09-18", helioSegments[11].startSec),
    ],
    decisions: [
      decision("he-d1", "A pilot only proceeds if recordings stay in Helio's tenant and the BAA says so.", helioSegments[1].startSec),
      decision("he-d2", "Success is two of twelve clinic managers still using it in week eight.", helioSegments[9].startSec),
    ],
    topics: [
      topic("he-k1", "HIPAA", "Security will stop the pilot if recordings leave the tenant or the BAA is vague.", helioSegments[1].startSec),
      topic("he-k2", "Who it's for", "Twelve clinic managers running patient handoffs. They need summaries with timestamps, not a raw transcript.", helioSegments[5].startSec),
      topic("he-k3", "Pilot length", "Twelve weeks. Procurement comes after week eight if usage holds.", helioSegments[9].startSec),
    ],
    moments: [
      moment("he-m1", "Invented follow-ups are a safety issue", helioSegments[7].startSec, helioSegments[7].text),
      moment("he-m2", "Week-eight bar", helioSegments[9].startSec, helioSegments[9].text),
    ],
    templates: [
      {
        id: "discovery",
        name: "Discovery",
        headline: "Helio will pilot only inside their tenant, judged at week eight.",
        executiveSummary:
          "Devon will not run a pilot unless the BAA keeps recordings in Helio's tenant. The users are twelve clinic managers who need timestamped summaries, because a made-up follow-up is a safety problem. The commercial bar is specific: two managers still active in week eight of a twelve-week pilot, then procurement.",
        followUps: [
          "Security review is Thursday, after the BAA and diagram arrive.",
        ],
      },
      {
        id: "mutual-plan",
        name: "Mutual plan",
        headline: "Twelve-week pilot. Week eight decides procurement.",
        executiveSummary:
          "Scope is clinic-manager handoffs, summaries that cite a timestamp, and no training on Helio meetings. Maya delivers the BAA and data-flow diagram. Devon books security. The plan names the week-eight test so the renewal conversation has a number, not a feeling.",
        followUps: [
          "If fewer than two managers are active in week eight, the pilot ends without a procurement push.",
        ],
      },
    ],
    defaultTemplateId: "discovery",
    clips: [
      clipFrom(
        "helio-hipaa",
        "The HIPAA line",
        "Devon stops the pilot unless recordings stay in tenant and the BAA says so.",
        helioSegments,
        1,
        4,
      ),
    ],
    preview: "Helio will only pilot if recordings stay in their tenant and the BAA says so.",
  },
  {
    id: "priya-luis-1on1",
    title: "Priya / Luis 1:1",
    startedAt: "2026-09-17T20:00:00.000Z",
    durationSec: 18 * 60,
    status: "ready",
    speakers: [
      speaker("priya", "Priya Shah", "Engineering manager"),
      speaker("luis", "Luis Ortega", "SRE"),
    ],
    segments: oneOnOneSegments,
    highlights: [
      highlightFrom("priya-luis-1on1", oneOnOneSegments, 4, "Secondary on-call"),
    ],
    actionItems: [
      action("oo-a1", "Add Evan as secondary on-call through Friday.", "Priya Shah", "2026-09-18", oneOnOneSegments[4].startSec, true),
      action("oo-a2", "Send the messy incident timeline by 4:00, written in the order customers felt it.", "Luis Ortega", "2026-09-17", oneOnOneSegments[7].startSec),
    ],
    decisions: [
      decision("oo-d1", "Evan covers secondary on-call through Friday.", oneOnOneSegments[4].startSec),
      decision("oo-d2", "The timeline is reviewed before it goes to Hannah, even if the draft is rough.", oneOnOneSegments[8].startSec),
    ],
    topics: [
      topic("oo-k1", "Load", "Luis is carrying incidents alone, and a wrong status page made Tuesday worse.", oneOnOneSegments[1].startSec),
      topic("oo-k2", "Rotation", "The current on-call rotation assumes a quiet week.", oneOnOneSegments[3].startSec),
    ],
    moments: [
      moment("oo-m1", "Send the messy version", oneOnOneSegments[8].startSec, oneOnOneSegments[8].text),
    ],
    templates: [
      {
        id: "coaching",
        name: "1:1",
        headline: "Luis gets a secondary on-call, and the timeline ships rough.",
        executiveSummary:
          "Luis is tired and was alone on Tuesday. Priya will put Evan on secondary through Friday and revisit the rotation after the freeze. The incident write-up should be readable by support, in the order customers felt it, and Priya would rather edit a messy true draft than wait.",
        followUps: [
          "Revisit the on-call rotation after the deploy freeze lifts.",
        ],
      },
      {
        id: "general",
        name: "General",
        headline: "Coverage through Friday, and a timeline Priya can edit today.",
        executiveSummary:
          "The 1:1 turned the outage into a staffing fix and a writing fix. Evan joins the rotation temporarily. Luis sends a draft by 4:00. Priya reviews it before product sees it.",
        followUps: ["Hannah does not get the timeline until Priya has read it."],
      },
    ],
    defaultTemplateId: "coaching",
    clips: [
      clipFrom(
        "priya-secondary",
        "Secondary on-call",
        "Priya puts Evan on the rotation through Friday.",
        oneOnOneSegments,
        2,
        4,
      ),
    ],
    preview: "Evan covers secondary on-call through Friday, and Luis sends a rough timeline today.",
  },
];
