import path from "node:path";
import { assert, tokens } from "./common.mjs";
const CAMERA_BY_KIND = {
  reaction: ["reaction", "medium"],
  insert: ["object"],
  rule: ["graphic"],
  diagram: ["graphic"],
  compare: ["graphic"],
  relationship: ["relationship", "wide"],
  travel: ["tracking", "wide"],
  ending: ["medium", "wide"],
  action: ["wide", "medium", "tracking"],
};
const PROP_TYPES = new Set([
  "door",
  "document",
  "key",
  "clock",
  "envelope",
  "calendar",
  "phone",
]);
export function suggest(paragraphs, primary = "eli") {
  return {
    reviewed: false,
    reviewer: null,
    requires: "Codex Skill semantic review; do not render these guesses",
    beats: paragraphs.map((text, i) => ({
      id: "b" + String(i + 1).padStart(2, "0"),
      purpose: "REVIEW: " + text,
      kind: /rule|every|exactly|means/i.test(text)
        ? "rule"
        : /afraid|surpris|terrif|realiz/i.test(text)
          ? "reaction"
          : "action",
      setting: /street|outside/i.test(text)
        ? "street"
        : /station|train|subway/i.test(text)
          ? "subway"
          : "apartment",
      actors: [primary],
      props: [],
      actions: [],
      unresolved: [
        "Identify event, object targets, cause/effect and exact supported actions. Raw text guesses are never approval.",
      ],
    })),
  };
}
export function validateEvents(ctx, units) {
  const { events, cfg } = ctx;
  assert(
    events?.reviewed === true,
    "SEMANTIC_REVIEW_REQUIRED: run suggest and let Codex Skill resolve events.json before rendering",
  );
  assert(
    Array.isArray(events.beats) && events.beats.length === units.length,
    "One event beat is required for each story paragraph/audio unit",
  );
  const purposes = new Set();
  for (const [i, b] of events.beats.entries()) {
    assert(b.id === units[i].id, `Beat order mismatch at ${i}`);
    assert(
      typeof b.purpose === "string" && b.purpose.length > 10,
      `${b.id}: missing narrative purpose`,
    );
    assert(!purposes.has(b.purpose), `${b.id}: duplicate purpose`);
    purposes.add(b.purpose);
    assert(CAMERA_BY_KIND[b.kind], `${b.id}: unknown semantic shot kind`);
    assert(
      ["rule", "diagram", "compare"].includes(b.kind) ||
        cfg.backgrounds.backgrounds[b.setting],
      `${b.id}: unknown layered setting`,
    );
    const props = new Map((b.props || []).map((p) => [p.id, p]));
    assert(
      props.size === (b.props || []).length,
      `${b.id}: duplicate prop IDs`,
    );
    for (const p of props.values()) {
      assert(/^[a-z][\w-]*$/.test(p.id), `${b.id}: invalid prop ID`);
      assert(PROP_TYPES.has(p.type), `${b.id}: unsupported prop ${p.type}`);
      assert((p.text || "").length <= 100, `${b.id}: prop label too long`);
    }
    for (const id of b.actors || [])
      assert(cfg.characters.characters[id], `${b.id}: unknown actor ${id}`);
    assert(
      (b.actors || []).length <= 2,
      `${b.id}: more than two actors is not validated`,
    );
    for (const a of b.actions || []) {
      const def = cfg.actions.actions[a.verb];
      assert(
        def && def.supported !== false,
        `${b.id}: UNSUPPORTED_ACTION ${a.verb}: ${def?.reason || "no validated template"}`,
      );
      if (!["prop-fade", "prop-shake"].includes(def.kind))
        assert(b.actors?.includes(a.actor), `${b.id}: action actor not staged`);
      if (
        ["reach", "point", "door", "knock", "prop-fade", "prop-shake"].includes(
          def.kind,
        )
      )
        assert(
          props.has(a.target),
          `${b.id}: ${a.verb} needs an existing target`,
        );
      if (def.kind === "door" || def.kind === "knock")
        assert(
          props.get(a.target)?.type === "door",
          `${b.id}: door action targets non-door`,
        );
      assert(
        (a.phase != null && a.phase >= 0 && a.phase <= 0.9) || a.cue,
        `${b.id}: action needs phase 0–.9 or word cue`,
      );
    }
    if (["rule", "diagram", "compare"].includes(b.kind)) {
      assert(
        b.values?.length >= 2 && b.values.length <= 4,
        `${b.id}: diagram needs 2–4 values`,
      );
      assert(
        b.actors?.length === 0,
        `${b.id}: diagram actors are not supported`,
      );
    } else
      assert(
        (b.actors || []).length === 0 || (b.actions || []).some((a) => a.actor),
        `${b.id}: no story action for visible actor`,
      );
  }
}
export function buildPlan(ctx, units) {
  validateEvents(ctx, units);
  const { job, cfg, events } = ctx,
    policy = cfg.policy;
  const durations = units.map(
    (u) =>
      u.fixedDuration ??
      Math.max(policy.minShotSeconds, u.seconds + u.voStart + 0.45),
  );
  let total = durations.reduce((a, b) => a + b, 0),
    target = job.targetSeconds ?? Math.ceil(total * 30) / 30;
  assert(
    target + 1 / 30 >= total,
    `DURATION_BUDGET: narration requires ${total.toFixed(2)}s, target ${target}s; shorten/re-record or raise target, never truncate speech`,
  );
  if (units.some((u) => u.fixedDuration != null)) {
    const extra = target - total;
    assert(
      durations.at(-1) + extra <= policy.maxShotSeconds,
      "DURATION_BUDGET: recording tail would become a static hold; provide suitable recording duration",
    );
    durations[durations.length - 1] += extra;
  } else {
    const weights = units.map((u) => Math.max(1, u.seconds));
    const sum = weights.reduce((a, b) => a + b, 0);
    durations.forEach(
      (d, i) => (durations[i] += ((target - total) * weights[i]) / sum),
    );
  }
  // Quantize all shot boundaries to exact 30fps. The final duration equals target frames.
  assert(
    Math.abs(target * 30 - Math.round(target * 30)) < 0.01,
    "Target must lie on a 30fps frame boundary",
  );
  const boundaries = [0];
  let cumulative = 0;
  for (const [i, d] of durations.entries()) {
    cumulative += d;
    boundaries.push(
      i === durations.length - 1
        ? Math.round(target * 30)
        : Math.round(cumulative * 30),
    );
  }
  const shots = [];
  let lastCamera = null;
  for (const [i, b] of events.beats.entries()) {
    const u = units[i],
      dur = (boundaries[i + 1] - boundaries[i]) / 30;
    assert(
      dur > 0 && dur <= policy.maxShotSeconds + 0.02,
      `${b.id}: shot duration ${dur.toFixed(2)} outside supported pacing range`,
    );
    const graphic = ["rule", "diagram", "compare"].includes(b.kind),
      options = CAMERA_BY_KIND[b.kind];
    let camera =
      b.camera && b.camera !== "auto"
        ? b.camera
        : options.find((c) => c !== lastCamera) || options[0];
    if (camera === lastCamera && camera !== "graphic" && options.length === 1)
      camera = "medium";
    // Consecutive diagrams have different layouts/modes; the static camera is intentional.
    if (b.kind === "reaction" && (b.props || []).length) camera = "medium";
    assert(cfg.cameras.cameras[camera], `${b.id}: unknown camera ${camera}`);
    const cam = structuredClone(cfg.cameras.cameras[camera]),
      stages = {};
    (b.actors || []).forEach(
      (id, j) =>
        (stages[id] = {
          ...(j
            ? cfg.cameras.cameras.relationship.secondary
            : cam.actor || cfg.cameras.cameras.wide.actor),
          character: id,
        }),
    );
    const doorActions = (b.actions || []).filter(
      (a) =>
        ["door", "knock", "reach"].includes(cfg.actions.actions[a.verb].kind) &&
        (b.props || []).find((p) => p.id === a.target)?.type === "door",
    );
    for (const a of doorActions) {
      const hasWalk = b.actions.some(
        (x) =>
          x.actor === a.actor &&
          x.verb === "walk" &&
          (x.phase || 0) < (a.phase || 0),
      );
      if (stages[a.actor]) stages[a.actor].x = hasWalk ? 790 : 1000;
    }
    for (const a of b.actions || [])
      if (a.verb === "reach") {
        const p = (b.props || []).find((p) => p.id === a.target);
        if (p && p.type !== "door" && stages[a.actor])
          stages[a.actor].x = (p.x ?? 1240) - 120;
      }
    const laidOutProps = structuredClone(b.props || []);
    const secondary = (b.actors || [])[1];
    if (secondary) {
      stages[secondary].facing = -1;
      if (laidOutProps.some((p) => p.type === "door"))
        stages[secondary].x = 1510;
    }
    if (
      laidOutProps.some((p) => p.type === "door") &&
      laidOutProps.some((p) => p.type === "document")
    ) {
      for (const p of laidOutProps)
        if (p.type === "document") {
          p.x = 450;
          p.y = 470;
        }
      const main = Object.values(stages)[0];
      if (main) main.x = 900;
    }
    const compiled = [],
      locks = new Map();
    for (const a of b.actions || []) {
      const def = cfg.actions.actions[a.verb];
      let at = u.voStart + (a.phase || 0) * u.seconds;
      if (a.cue) {
        const matches = (u.words || []).filter(
          (w) => w.word === a.cue.toLowerCase(),
        );
        assert(matches.length, `${b.id}: word cue not aligned: ${a.cue}`);
        at = u.voStart + matches[a.occurrence || 0]?.start;
        assert(Number.isFinite(at), `${b.id}: missing cue occurrence`);
      }
      const end = at + def.duration;
      assert(
        end < dur - 0.02,
        `${b.id}: action ${a.verb} overruns shot; adjust phase or duration target`,
      );
      if (a.actor) {
        assert(
          at >= (locks.get(a.actor) || 0) - 0.01,
          `${b.id}: overlapping character actions ${a.verb}`,
        );
        locks.set(a.actor, end);
      }
      compiled.push({ ...a, at: +at.toFixed(4), duration: def.duration });
    }
    for (const actor of b.actors || []) {
      const main = compiled.filter((a) => a.actor === actor);
      let t = 0.05;
      while (t < dur - 0.35) {
        if (
          !main.some((a) => t < a.at + a.duration + 0.1 && t + 0.3 > a.at - 0.1)
        )
          compiled.push({
            actor,
            verb: "breathe",
            at: +t.toFixed(4),
            duration: 0.3,
            source: "automatic residual idle gap",
          });
        t += policy.microActEverySeconds;
      }
    }
    compiled.sort((a, b) => a.at - b.at);
    const captions = captionUnits(u, policy.captionWords);
    assert(
      captions.every((c) => c.end <= dur + 0.01),
      `${b.id}: subtitle overrun`,
    );
    const sfx = compiled
      .filter((a) => cfg.actions.actions[a.verb].sfx)
      .map((a) => ({
        at: +(a.at + (cfg.actions.actions[a.verb].sfxOffset || 0)).toFixed(4),
        name: cfg.actions.actions[a.verb].sfx,
        volume: ["thud", "tap"].includes(cfg.actions.actions[a.verb].sfx)
          ? 0.2
          : 0.16,
      }));
    if (graphic) sfx.push({ at: 0.35, name: "tick", volume: 0.12 });
    shots.push({
      ...b,
      props: laidOutProps,
      start: boundaries[i] / 30,
      duration: dur,
      end: boundaries[i + 1] / 30,
      renderKind: graphic ? "svg" : "layered",
      camera: cam,
      cameraId: camera,
      stages,
      actions: compiled,
      captions,
      sfx,
      narration: {
        text: u.text,
        start: u.voStart,
        duration: u.seconds,
        alignment: u.alignment,
      },
      environment: graphic ? "graphic" : b.setting,
    });
    lastCamera = camera;
  }
  return {
    version: 1,
    title: job.title,
    id: job.id,
    fps: 30,
    width: 1920,
    height: 1080,
    duration: target,
    shots,
    characters: cfg.characters.characters,
    actions: cfg.actions.actions,
    backgrounds: structuredClone(cfg.backgrounds),
    policy,
    automation: {
      semanticPlanning: events.reviewer,
      shotLayout: "deterministic generic planner",
      timing: "measured audio; forced word alignment when words[] exists",
      runtime: "shared, byte-identical across stories",
      durationValidation:
        target > 90 ? "UNVERIFIED_LONG_DURATION" : "requires actual render",
    },
  };
}
export function captionUnits(u, maxWords) {
  const textWords = u.text.split(/\s+/),
    ws = u.words;
  const out = [];
  let group = [],
    first = 0;
  for (let i = 0; i < textWords.length; i++) {
    if (!group.length) first = i;
    group.push(textWords[i]);
    if (
      group.length >= maxWords ||
      /[.!?,:]$/.test(textWords[i]) ||
      i === textWords.length - 1
    ) {
      // Alignment tokens can split hyphenated words. Map each displayed chunk to normalized acoustic words.
      const before = tokens(textWords.slice(0, first).join(" ")).length,
        n = tokens(group.join(" ")).length;
      const a = ws?.[before]?.start ?? (u.seconds * first) / textWords.length,
        b =
          ws?.[before + n - 1]?.end ?? (u.seconds * (i + 1)) / textWords.length;
      out.push({
        text: group.join(" "),
        start: u.voStart + a,
        end: Math.min(u.voStart + u.seconds, u.voStart + b + 0.035),
      });
      group = [];
    }
  }
  for (let i = 0; i < out.length - 1; i++)
    out[i].end = Math.min(out[i].end, out[i + 1].start);
  return out;
}
