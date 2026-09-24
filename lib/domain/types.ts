export type MeetingStatus = "ready" | "processing";

export type Speaker = {
  id: string;
  name: string;
  role: string;
};

export type TranscriptSegment = {
  id: string;
  speakerId: string;
  startSec: number;
  endSec: number;
  text: string;
};

export type Highlight = {
  id: string;
  startSec: number;
  endSec: number;
  label: string;
  speakerId: string;
  excerpt: string;
};

export type ActionItem = {
  id: string;
  task: string;
  owner: string;
  dueDate: string | null;
  timestampSec: number;
  done: boolean;
};

export type Decision = {
  id: string;
  text: string;
  timestampSec: number;
};

export type Topic = {
  id: string;
  label: string;
  detail: string;
  timestampSec: number;
};

export type Moment = {
  id: string;
  label: string;
  timestampSec: number;
  excerpt: string;
};

export type SummaryTemplate = {
  id: string;
  name: string;
  headline: string;
  executiveSummary: string;
  followUps: string[];
};

export type Clip = {
  id: string;
  title: string;
  startSec: number;
  endSec: number;
  note: string;
};

export type Meeting = {
  id: string;
  title: string;
  startedAt: string;
  durationSec: number;
  status: MeetingStatus;
  speakers: Speaker[];
  segments: TranscriptSegment[];
  highlights: Highlight[];
  actionItems: ActionItem[];
  decisions: Decision[];
  topics: Topic[];
  moments: Moment[];
  templates: SummaryTemplate[];
  defaultTemplateId: string;
  clips: Clip[];
  preview: string;
};

export type MeetingSummary = {
  id: string;
  title: string;
  startedAt: string;
  durationSec: number;
  status: MeetingStatus;
  participants: string[];
  preview: string;
  openActionCount: number;
  actionCount: number;
};

export type SearchHit = {
  meetingId: string;
  title: string;
  startedAt: string;
  kind: "title" | "summary" | "action" | "transcript";
  snippet: string;
  timestampSec: number | null;
};

export type ClipView = {
  clip: Clip;
  meetingId: string;
  meetingTitle: string;
  startedAt: string;
  speakers: Speaker[];
  segments: TranscriptSegment[];
};
