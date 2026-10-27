import fs from "node:fs";
import path from "node:path";
import {
  ROOT,
  PROD,
  read,
  write,
  hash,
  assert,
  run,
  codeFingerprint,
} from "./common.mjs";
export function compile(ctx, plan) {
  const { out, job, cfg } = ctx;
  const used = new Set(
    plan.shots
      .filter((s) => s.renderKind === "layered")
      .map((s) => s.environment),
  );
  const assets = [];
  for (const name of used) {
    const bg = plan.backgrounds.backgrounds[name];
    for (const l of bg.layers) {
      const config =
        ctx.configPaths?.backgrounds ||
        path.join(PROD, "config/backgrounds.json");
      const src = path.resolve(path.dirname(config), l.file);
      assert(fs.existsSync(src), "Missing background: " + src);
      l.runtimeFile = `assets/art/${name}/${l.depth}.png`;
      const dest = path.join(out, l.runtimeFile);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
      if (l.svg) {
        const svg = path.resolve(path.dirname(config), l.svg);
        if (fs.existsSync(svg))
          fs.copyFileSync(svg, dest.replace(".png", ".svg"));
      }
      assets.push({
        file: l.runtimeFile,
        source: path.relative(ROOT, src),
        sha256: hash(fs.readFileSync(src)),
        provenance: bg.provenance,
      });
    }
  }
  const runtime = fs.readFileSync(path.join(PROD, "runtime.js"), "utf8");
  const registryHashes = Object.fromEntries(
    Object.entries(cfg).map(([k, v]) => [k, hash(JSON.stringify(v))]),
  );
  const manifest = {
    job: job.id,
    productionCodeSha256: codeFingerprint(),
    sharedRuntimeSha256: hash(runtime),
    registryHashes,
    assets,
    jobConfigSha256: hash(JSON.stringify(job)),
    storySha256: hash(ctx.story),
    eventConfigSha256: hash(JSON.stringify(ctx.events)),
    noStorySpecificJS: true,
  };
  manifest.audioFiles = read(path.join(out, "speech.json")).map((u) => ({
    file: path.relative(out, u.file),
    sha256: hash(fs.readFileSync(u.file)),
  }));
  if (job.audio?.mode === "recording") {
    const file = path.resolve(ctx.base, job.audio.file);
    manifest.sourceRecording = { file, sha256: hash(fs.readFileSync(file)) };
  }
  const sceneSource =
    "const PRODUCTION_DATA = " + JSON.stringify(plan) + ";\n" + runtime;
  manifest.generatedScenesSha256 = hash(sceneSource);
  write(path.join(out, "production-plan.json"), plan);
  write(path.join(out, "production-manifest.json"), manifest);
  write(path.join(out, "production-adapter.js"), runtime);
  write(path.join(out, "scenes.js"), sceneSource);
  write(
    path.join(out, "character.json"),
    Object.fromEntries(
      [...new Set(plan.shots.flatMap((s) => s.actors))].map((k) => [
        k,
        cfg.characters.characters[k],
      ]),
    ),
  );
  const film = {
    title: job.title,
    format: "16:9",
    fps: 30,
    lang: "en",
    theme: {
      extends: "dark",
      bg: "#132737",
      ink: "#f4e4c5",
      paper: "#f1d6b4",
      soft: "#294d5a",
      muted: "#b4c8d0",
      accents: ["#e69c84", "#84ccbb", "#e8c577"],
      decor: null,
    },
    voice: { provider: "files", lufs: -16 },
    music: cfg.policy.music,
    captions: false,
    clips: plan.shots.map((s) => ({
      id: s.id,
      duration: s.duration,
      vo: s.narration.text,
      voStart: s.narration.start,
      label: s.kind,
      visual: s.purpose,
      sfx: s.sfx,
    })),
  };
  write(path.join(out, "film.json"), film);
  const rows = [
    "# Locked production storyboard",
    "",
    "Times are driven by measured/forced-aligned audio. The shared adapter has no story-specific branch.",
    "",
    "| Shot / time | Narration | Purpose | Environment / composition | Event actions |",
    "|---|---|---|---|---|",
  ];
  for (const s of plan.shots)
    rows.push(
      `| ${s.id} ${s.start.toFixed(2)}–${s.end.toFixed(2)}s | ${s.narration.text} | ${s.purpose} | ${s.environment} / ${s.cameraId} | ${s.actions
        .filter((a) => a.source !== "automatic residual idle gap")
        .map((a) => `${a.actor || a.target}: ${a.verb} @${a.at.toFixed(2)}`)
        .join("; ")} |`,
    );
  write(path.join(out, "storyboard.md"), rows.join("\n") + "\n");
  const cueTimeline = plan.shots.flatMap((s) =>
    s.captions.map((c) => ({
      shot: s.id,
      ...c,
      globalStart: s.start + c.start,
      globalEnd: s.start + c.end,
    })),
  );
  write(path.join(out, "caption-timeline.json"), cueTimeline);
  run(
    process.execPath,
    [path.join(ROOT, "bin/stickman.mjs"), "audio", out, "--provider", "files"],
    { timeout: 180000, log: path.join(out, "work/audio-build.log") },
  );
  run(process.execPath, [path.join(ROOT, "bin/stickman.mjs"), "compose", out], {
    log: path.join(out, "work/compose.log"),
  });
  // Resource guards are enforced after every audio stage; no infinite apad/amix output is used.
  for (const dir of ["vo", "music", "sfx"]) {
    const d = path.join(out, "assets", dir);
    if (fs.existsSync(d))
      for (const f of fs.readdirSync(d)) {
        const p = path.join(d, f);
        if (fs.statSync(p).isFile())
          assert(
            fs.statSync(p).size < cfg.policy.limits.maxAudioFileBytes,
            "Audio output size limit: " + p,
          );
      }
  }
  return manifest;
}
