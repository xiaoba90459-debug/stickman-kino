import fs from "node:fs";
import path from "node:path";
import { read, write, run, probe, assert, hash } from "./common.mjs";
import { spawnSync } from "node:child_process";
const root = path.resolve(process.argv[2]),
  plan = read(path.join(root, "production-plan.json")),
  file = path.join(root, "renders", plan.id + ".mp4");
assert(fs.existsSync(file), "Missing rendered MP4");
assert(
  fs.statSync(file).size < plan.policy.limits.maxGeneratedFileBytes,
  "MP4 size limit",
);
const p = probe(file),
  v = p.streams.find((s) => s.codec_type === "video"),
  a = p.streams.find((s) => s.codec_type === "audio");
assert(
  v?.width === 1920 && v?.height === 1080 && v.r_frame_rate === "30/1",
  "Wrong video dimensions/rate",
);
assert(+v.nb_frames === Math.round(plan.duration * 30), "Wrong frame count");
assert(a?.codec_name === "aac", "Missing AAC audio");
assert(
  Math.abs(+p.format.duration - plan.duration) < 0.06,
  "Duration mismatch",
);
run("ffmpeg", ["-v", "error", "-i", file, "-f", "null", "-"], {
  timeout: 240000,
  log: path.join(root, "work/full-decode.log"),
});
assert(
  fs.readFileSync(path.join(root, "work/full-decode.log"), "utf8").trim() ===
    "",
  "Full decode produced errors",
);
run(
  "ffmpeg",
  [
    "-hide_banner",
    "-i",
    file,
    "-vf",
    "scale=320:180,blackdetect=d=0.03:pix_th=0.05:pic_th=0.98",
    "-an",
    "-f",
    "null",
    "-",
  ],
  { timeout: 240000, log: path.join(root, "work/blackdetect.log") },
);
assert(
  !fs
    .readFileSync(path.join(root, "work/blackdetect.log"), "utf8")
    .includes("black_start:"),
  "Near-black frame interval detected",
);
const pcm = spawnSync(
  "ffmpeg",
  [
    "-v",
    "error",
    "-i",
    file,
    "-vn",
    "-ac",
    "1",
    "-ar",
    "16000",
    "-f",
    "s16le",
    "-",
  ],
  { maxBuffer: 32 * 1024 * 1024, timeout: 120000 },
);
assert(pcm.status === 0, "Audio decode failed");
const levels = [];
let peak = 0;
for (let sec = 0; sec < Math.ceil(plan.duration); sec++) {
  let ss = 0,
    n = 0;
  for (
    let i = sec * 32000;
    i < Math.min((sec + 1) * 32000, pcm.stdout.length) - 1;
    i += 2
  ) {
    const x = pcm.stdout.readInt16LE(i) / 32768;
    ss += x * x;
    n++;
    peak = Math.max(peak, Math.abs(x));
  }
  if (n) levels.push(20 * Math.log10(Math.max(1e-10, Math.sqrt(ss / n))));
}
assert(Math.max(...levels) > -35, "Audio unexpectedly quiet/empty");
assert(Math.min(...levels) > -70, "One-second missing audio interval");
const result = {
  status: "passed",
  file: path.basename(file),
  bytes: fs.statSync(file).size,
  sha256: hash(fs.readFileSync(file)),
  duration: +p.format.duration,
  video: {
    codec: v.codec_name,
    width: v.width,
    height: v.height,
    fps: v.r_frame_rate,
    frames: +v.nb_frames,
  },
  audio: {
    codec: a.codec_name,
    channels: a.channels,
    sampleRate: a.sample_rate,
    rmsRangeDbfs: [Math.min(...levels), Math.max(...levels)],
    decodedPeakDbfs: 20 * Math.log10(peak),
  },
  fullDecode: "no FFmpeg errors",
  fullFrameBlackdetect: "no near-black intervals >=1 frame",
  rmsPerSecond: levels,
  caveat:
    "Technical decoding and signal checks do not replace listening or semantic/visual review.",
};
write(path.join(root, "media-qa.json"), result);
console.log(JSON.stringify(result, null, 2));
