import fs from "fs";

function spokenSeconds(text) {
  const words = text.trim().split(/\s+/).length;
  return Math.min(18, Math.max(4, words * 0.42));
}
function round1(value) {
  return Math.round(value * 10) / 10;
}

const lines = JSON.parse(fs.readFileSync("scripts/northwind-lines.json", "utf8"));
const audio = JSON.parse(fs.readFileSync("public/audio/northwind-cues.json", "utf8"));
const durationSec = 14 * 60;
const weights = lines.map((line) => spokenSeconds(line.text));
const spoken = weights.reduce((sum, weight) => sum + weight, 0);
const gap = (durationSec - spoken) / (lines.length - 1);
let cursor = 0;
const cues = lines.map((line, index) => {
  const meetingStart = round1(cursor);
  const meetingEnd = round1(Math.min(durationSec, cursor + weights[index]));
  cursor += weights[index] + gap;
  const clip = audio.cues[index];
  return { meetingStart, meetingEnd, audioStart: clip.audioStart, audioEnd: clip.audioEnd };
});
const body = `export const northwindDemo = {
  src: "/audio/northwind-renewal.wav",
  cues: ${JSON.stringify(cues, null, 2)},
} as const;
`;
fs.writeFileSync("lib/audio/northwind-demo.ts", body);
console.log(cues.length, "cues", cues[0], cues[11]);
