import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { toolEnv } from "../lib/env.mjs";
export const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
export const PROD = path.join(ROOT, "production");
export const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
export function write(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(
    p,
    typeof data === "string" ? data : JSON.stringify(data, null, 2) + "\n",
  );
}
export const hash = (x) => crypto.createHash("sha256").update(x).digest("hex");
export function assert(c, msg) {
  if (!c) throw new Error(msg);
}
export function run(cmd, args, { cwd = ROOT, timeout = 120000, log } = {}) {
  const r = spawnSync(cmd, args, {
    cwd,
    env: toolEnv(),
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    timeout,
  });
  if (log) write(log, (r.stdout || "") + (r.stderr || ""));
  assert(
    !r.error && r.status === 0,
    `${cmd} failed${r.error ? ": " + r.error.message : ""}: ${((r.stdout || "") + (r.stderr || "")).slice(-2200)}`,
  );
  return r.stdout;
}
export const probe = (f) =>
  JSON.parse(
    run("ffprobe", [
      "-v",
      "error",
      "-show_format",
      "-show_streams",
      "-of",
      "json",
      f,
    ]),
  );
export const duration = (f) => +probe(f).format.duration;
export const tokens = (text) =>
  text
    .toLowerCase()
    .replace(/[’]/g, "'")
    .match(/[a-z]+(?:'[a-z]+)*/g) || [];
export const splitStory = (text) =>
  text
    .trim()
    .split(/\n\s*\n/)
    .map((t) => t.trim().replace(/\s+/g, " "))
    .filter(Boolean);
export function loadJob(file) {
  const abs = path.resolve(file),
    base = path.dirname(abs),
    job = read(abs);
  assert(/^[a-z][a-z0-9-]+$/.test(job.id), "Invalid job.id");
  const cfg = {},
    configPaths = {};
  for (const key of [
    "characters",
    "actions",
    "cameras",
    "backgrounds",
    "policy",
  ]) {
    configPaths[key] = path.resolve(
      base,
      job.config?.[key] || path.join(PROD, "config", key + ".json"),
    );
    cfg[key] = read(configPaths[key]);
  }
  assert(
    (job.targetSeconds == null || job.targetSeconds >= 10) &&
      (!job.targetSeconds || job.targetSeconds <= cfg.policy.limits.maxSeconds),
    "Duration outside allowed range",
  );
  const story = fs.readFileSync(path.resolve(base, job.story), "utf8"),
    paragraphs = splitStory(story);
  assert(paragraphs.length > 0, "Empty story");
  assert(
    !/\d/.test(story),
    "Spell out numbers in narration; UI labels may contain digits",
  );
  const events = job.events ? read(path.resolve(base, job.events)) : null;
  assert(!job.format || job.format === "16:9", "Only 16:9 output is verified");
  const output = job.output || {};
  assert(
    (output.width ?? 1920) === 1920 &&
      (output.height ?? 1080) === 1080 &&
      (output.fps ?? 30) === 30,
    "Only 1920x1080 at 30fps is verified",
  );
  const out = path.resolve(
    ROOT,
    output.directory || path.join("videos", job.id),
  );
  assert(
    out.startsWith(path.join(ROOT, "videos") + path.sep),
    "Output directory must be a child of videos/",
  );
  if (fs.existsSync(out)) {
    assert(
      fs.existsSync(path.join(out, ".production-job.json")),
      "Refusing to overwrite an existing non-production film",
    );
    assert(
      read(path.join(out, ".production-job.json")).id === job.id,
      "Output ownership mismatch",
    );
  }
  return { job, base, abs, cfg, configPaths, story, paragraphs, events, out };
}

export function codeFingerprint() {
  const names = [
    "common.mjs",
    "audio.mjs",
    "align.py",
    "planner.mjs",
    "compile.mjs",
    "runtime.js",
    "cli.mjs",
    "runtime-qa.mjs",
    "media-qa.mjs",
  ];
  return hash(
    names
      .map((n) => n + ":" + hash(fs.readFileSync(path.join(PROD, n))))
      .join("\n"),
  );
}
