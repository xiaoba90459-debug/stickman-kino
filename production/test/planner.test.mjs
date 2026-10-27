import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import { read, PROD, ROOT, loadJob, splitStory } from "../common.mjs";
import { buildPlan, captionUnits, suggest } from "../planner.mjs";
function fixture(n = 3, target = n * 4) {
  const cfg = Object.fromEntries(
    ["characters", "actions", "cameras", "backgrounds", "policy"].map((k) => [
      k,
      read(path.join(PROD, "config", k + ".json")),
    ]),
  );
  const units = Array.from({ length: n }, (_, i) => ({
    id: "b" + String(i + 1).padStart(2, "0"),
    text: "Someone studied the clock.",
    seconds: 2.2,
    voStart: 0.23,
    alignment: "test fixture",
  }));
  return {
    ctx: {
      job: { id: "test-job", title: "A new title", targetSeconds: target },
      cfg,
      events: {
        reviewed: true,
        reviewer: "unit test",
        beats: units.map((u, i) => ({
          id: u.id,
          purpose: "Distinct narrative event " + i,
          kind: "action",
          setting: "apartment",
          actors: ["eli"],
          props: [{ id: "clock", type: "clock" }],
          actions: [{ actor: "eli", verb: "read", phase: 0.1 }],
        })),
      },
    },
    units,
  };
}
test("frame-quantized planning preserves total and avoids identical consecutive camera presets", () => {
  const { ctx, units } = fixture(15, 60),
    p = buildPlan(ctx, units);
  assert.equal(p.duration, 60);
  assert.equal(p.shots.length, 15);
  assert.equal(p.shots.at(-1).end, 60);
  p.shots.forEach((s, i) => {
    assert.equal(Math.round(s.start * 30), s.start * 30);
    if (i) assert.notEqual(s.cameraId, p.shots[i - 1].cameraId);
  });
});
test("180 and 600 seconds can be configured but are explicitly unverified long-duration paths", () => {
  for (const seconds of [180, 600]) {
    const { ctx, units } = fixture(seconds / 3, seconds);
    const p = buildPlan(ctx, units);
    assert.equal(p.duration, seconds);
    assert.equal(p.automation.durationValidation, "UNVERIFIED_LONG_DURATION");
  }
});
test("unsupported complex action blocks instead of becoming a walk or gesture", () => {
  const { ctx, units } = fixture();
  ctx.events.beats[0].actions[0].verb = "swim";
  assert.throws(() => buildPlan(ctx, units), /UNSUPPORTED_ACTION.*swim/);
});
test("unreviewed guesses cannot enter production", () => {
  const { ctx, units } = fixture();
  ctx.events = suggest(["Someone studied the clock."]);
  assert.throws(() => buildPlan(ctx, units), /SEMANTIC_REVIEW_REQUIRED/);
});
test("narration longer than requested duration is rejected, not truncated", () => {
  const { ctx, units } = fixture(3, 5);
  assert.throws(() => buildPlan(ctx, units), /DURATION_BUDGET/);
});
test("unknown/missing action targets block rendering", () => {
  const { ctx, units } = fixture();
  ctx.events.beats[0].actions[0] = {
    actor: "eli",
    verb: "open",
    target: "absent",
    phase: 0.1,
  };
  assert.throws(() => buildPlan(ctx, units), /existing target/);
});
test("actor motion overlap is rejected", () => {
  const { ctx, units } = fixture();
  ctx.events.beats[0].actions = [
    { actor: "eli", verb: "walk", phase: 0.1 },
    { actor: "eli", verb: "read", phase: 0.2 },
  ];
  assert.throws(() => buildPlan(ctx, units), /overlapping character actions/);
});
test("duplicate narrative purpose is rejected", () => {
  const { ctx, units } = fixture();
  ctx.events.beats[1].purpose = ctx.events.beats[0].purpose;
  assert.throws(() => buildPlan(ctx, units), /duplicate purpose/);
});
test("fixed recording timeline is not stretched into long idle tail", () => {
  const { ctx, units } = fixture(3, 25);
  for (const u of units) u.fixedDuration = 3;
  assert.throws(() => buildPlan(ctx, units), /static hold/);
});
test("word-aligned captions map a displayed hyphenated word to both acoustic tokens", () => {
  const u = {
    text: "The twenty-nine doors.",
    seconds: 2,
    voStart: 0.2,
    words: [
      { word: "the", start: 0.1, end: 0.2 },
      { word: "twenty", start: 0.3, end: 0.7 },
      { word: "nine", start: 0.7, end: 1 },
      { word: "doors", start: 1.2, end: 1.7 },
    ],
  };
  const caps = captionUnits(u, 2);
  assert.equal(caps[0].text, "The twenty-nine");
  assert(Math.abs(caps[0].start - 0.3) < 1e-9);
  assert(Math.abs(caps[0].end - 1.235) < 1e-9);
  assert(Math.abs(caps[1].start - 1.4) < 1e-9);
});
test("existing non-production directories are protected without legacy workspace fixtures", () => {
  const original = read(path.join(PROD, "examples/every-door/job.json")),
    id = "test-protected-" + process.pid,
    dir = path.join(ROOT, "videos", id),
    tmp = path.join(PROD, "examples/every-door/.test-protection.json");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "film.json"), "{}");
  try {
    fs.writeFileSync(tmp, JSON.stringify({ ...original, id }));
    assert.throws(() => loadJob(tmp), /Refusing to overwrite/);
  } finally {
    fs.rmSync(tmp, { force: true });
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
test("compiler may annotate a plan without mutating source asset registries", () => {
  const { ctx, units } = fixture();
  const before = JSON.stringify(ctx.cfg.backgrounds),
    p = buildPlan(ctx, units);
  p.backgrounds.backgrounds.apartment.layers[0].runtimeFile =
    "generated-copy.png";
  assert.equal(JSON.stringify(ctx.cfg.backgrounds), before);
});

test("unverified output geometry is rejected instead of silently ignored", () => {
  const original = read(path.join(PROD, "examples/every-door/job.json")),
    tmp = path.join(PROD, "examples/every-door/.test-output.json");
  try {
    fs.writeFileSync(
      tmp,
      JSON.stringify({
        ...original,
        id: "test-output-geometry",
        output: { width: 1280, height: 720, fps: 24 },
      }),
    );
    assert.throws(() => loadJob(tmp), /Only 1920x1080/);
  } finally {
    fs.rmSync(tmp, { force: true });
  }
});
test("output directory cannot target engine or escape videos", () => {
  const original = read(path.join(PROD, "examples/every-door/job.json")),
    tmp = path.join(PROD, "examples/every-door/.test-output.json");
  try {
    fs.writeFileSync(
      tmp,
      JSON.stringify({
        ...original,
        id: "test-output-path",
        output: { directory: "engine" },
      }),
    );
    assert.throws(() => loadJob(tmp), /child of videos/);
  } finally {
    fs.rmSync(tmp, { force: true });
  }
});

test("check before prepare does not poison a new output directory", async () => {
  const { spawnSync } = await import("node:child_process");
  const original = read(path.join(PROD, "examples/every-door/job.json"));
  const id = "test-unprepared-" + process.pid;
  const tmp = path.join(PROD, "examples/every-door/.test-check.json");
  const out = path.join(ROOT, "videos", id);
  try {
    fs.writeFileSync(tmp, JSON.stringify({ ...original, id }));
    const r = spawnSync(
      process.execPath,
      [path.join(PROD, "cli.mjs"), "check", tmp],
      { encoding: "utf8" },
    );
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /Run prepare first/);
    assert.equal(fs.existsSync(out), false);
  } finally {
    fs.rmSync(tmp, { force: true });
    fs.rmSync(out, { force: true, recursive: true });
  }
});
