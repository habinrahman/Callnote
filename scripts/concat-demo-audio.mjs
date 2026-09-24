import fs from "fs";
import path from "path";

const dir = "public/audio/lines";
const files = fs.readdirSync(dir).filter((name) => name.endsWith(".wav")).sort();

function readWav(file) {
  const buf = fs.readFileSync(path.join(dir, file));
  const channels = buf.readUInt16LE(22);
  const rate = buf.readUInt32LE(24);
  const bits = buf.readUInt16LE(34);
  let offset = 12;
  let data = null;
  while (offset + 8 <= buf.length) {
    const id = buf.toString("ascii", offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    if (id === "data") {
      data = buf.subarray(offset + 8, offset + 8 + size);
      break;
    }
    offset += 8 + size + (size % 2);
  }
  if (!data) throw new Error(`no data in ${file}`);
  return { channels, rate, bits, data };
}

const clips = files.map(readWav);
const { channels, rate, bits } = clips[0];
for (const clip of clips) {
  if (clip.channels !== channels || clip.rate !== rate || clip.bits !== bits) {
    throw new Error("wav formats differ");
  }
}
const data = Buffer.concat(clips.map((clip) => clip.data));
const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + data.length, 4);
header.write("WAVE", 8);
header.write("fmt ", 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(channels, 22);
header.writeUInt32LE(rate, 24);
header.writeUInt32LE(rate * channels * (bits / 8), 28);
header.writeUInt16LE(channels * (bits / 8), 32);
header.writeUInt16LE(bits, 34);
header.write("data", 36);
header.writeUInt32LE(data.length, 40);
fs.writeFileSync("public/audio/northwind-renewal.wav", Buffer.concat([header, data]));

const bytesPerSec = rate * channels * (bits / 8);
let cursor = 0;
const cues = clips.map((clip, index) => {
  const audioStart = cursor / bytesPerSec;
  cursor += clip.data.length;
  const audioEnd = cursor / bytesPerSec;
  return { index, audioStart: Math.round(audioStart * 1000) / 1000, audioEnd: Math.round(audioEnd * 1000) / 1000 };
});
fs.writeFileSync("public/audio/northwind-cues.json", JSON.stringify({ rate, channels, bits, cues }, null, 2));
console.log("seconds", (data.length / bytesPerSec).toFixed(2), "bytes", data.length + 44);
