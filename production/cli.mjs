#!/usr/bin/env node
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
  loadJob,
  codeFingerprint,
} from "./common.mjs";
import { speech } from "./audio.mjs";
import { buildPlan, suggest, validateEvents } from "./planner.mjs";
import { compile } from "./compile.mjs";
const [command, file, ...rest] = process.argv.slice(2);
if (!command || !file) {
  console.log(
    "Usage: node production/cli.mjs run|suggest|prepare|check|record-review|render|qa|status JOB.json [notes]",
  );
  process.exit(command ? 1 : 0);
}
let ctx;
try {
  ctx = loadJob(file);
  const { out, job } = ctx,
    work = path.join(out, "work");
  if (command === "run") {
    run(process.execPath, [path.join(PROD, "cli.mjs"), "prepare", ctx.abs], {
      timeout: 900000,
      log: path.join(out, "work/run-prepare.log"),
    });
    run(process.execPath, [path.join(PROD, "cli.mjs"), "check", ctx.abs], {
      timeout: 480000,
      log: path.join(out, "work/run-check.log"),
    });
    const review = path.join(out, "visual-review.json"),
      ph = hash(fs.readFileSync(path.join(out, "production-plan.json")));
    if (fs.existsSync(review) && read(review).planSha256 === ph) {
      run(process.execPath, [path.join(PROD, "cli.mjs"), "render", ctx.abs], {
        timeout: ctx.cfg.policy.render.timeoutSeconds * 1000 + 300000,
        log: path.join(out, "work/run-render.log"),
      });
      console.log("Run complete");
    } else
      console.log(
        JSON.stringify({
          status: "review_required",
          out,
          reason:
            "Open generated contact sheets, record concrete visual review, then render. No user approval is required for the producer review.",
        }),
      );
    process.exit(0);
  }
  if (command === "suggest") {
    write(
      path.join(ctx.base, "events.suggested.json"),
      suggest(ctx.paragraphs, job.planning?.primaryCharacter),
    );
    console.log(
      "Wrote events.suggested.json. Codex Skill must resolve semantic intent before prepare.",
    );
    process.exit(0);
  }
  if (["check", "record-review", "render", "qa"].includes(command)) {
    assert(
      fs.existsSync(path.join(out, "production-plan.json")),
      "Run prepare first; no output directory was created",
    );
  }
  if (["prepare", "check", "record-review", "render", "qa"].includes(command)) {
    fs.mkdirSync(work, { recursive: true });
    const lock = path.join(work, ".stage-lock.json");
    if (fs.existsSync(lock)) {
      const previous = read(lock);
      let alive = true;
      try {
        process.kill(previous.pid, 0);
      } catch (e) {
        if (e.code === "ESRCH") alive = false;
      }
      assert(
        !alive,
        "CONCURRENT_JOB: another process owns this job; do not run the same ID concurrently",
      );
      fs.unlinkSync(lock);
    }
    const fd = fs.openSync(lock, "wx");
    fs.writeFileSync(fd, JSON.stringify({ pid: process.pid, command }));
    fs.closeSync(fd);
    process.on("exit", () => {
      try {
        if (read(lock).pid === process.pid) fs.unlinkSync(lock);
      } catch {}
    });
  }
  // Semantic validation happens before expensive TTS, rendering or output writes.
  if (command === "prepare") {
    const marker = path.join(out, ".production-job.json");
    if (!fs.existsSync(marker)) write(marker, { id: job.id, jobFile: ctx.abs });
    const stats = fs.statfsSync(out);
    assert(
      stats.bavail * stats.bsize > 512 * 1024 * 1024,
      "LOW_DISK: need at least 512 MiB free before starting",
    );
    assert(
      ctx.events?.reviewed === true,
      "SEMANTIC_REVIEW_REQUIRED: resolve events.suggested.json using the production Skill",
    );
    validateEvents(
      ctx,
      ctx.paragraphs.map((text, i) => ({
        id: "b" + String(i + 1).padStart(2, "0"),
        text,
      })),
    );
    write(path.join(out, ".production-job.json"), {
      id: job.id,
      jobFile: ctx.abs,
    });
    write(path.join(work, "stage.json"), {
      stage: "speech",
      status: "running",
    });
    console.log("1/3 local speech + audio alignment");
    const units = speech(ctx);
    console.log("2/3 semantic-event plan + automatic shots, actions, cameras");
    const plan = buildPlan(ctx, units);
    console.log("3/3 compile with shared adapter + existing audio/compose");
    const manifest = compile(ctx, plan);
    write(path.join(work, "stage.json"), {
      stage: "prepared",
      status: "succeeded",
      seconds: plan.duration,
      shots: plan.shots.length,
      sharedRuntimeSha256: manifest.sharedRuntimeSha256,
    });
    console.log(
      JSON.stringify(
        { out, seconds: plan.duration, shots: plan.shots.length, ...manifest },
        null,
        2,
      ),
    );
  } else {
    assert(
      fs.existsSync(path.join(out, "production-plan.json")),
      "Run prepare first",
    );
    const plan = read(path.join(out, "production-plan.json"));
    const currentHash = hash(
      fs.readFileSync(path.join(out, "production-plan.json")),
    );
    if (["check", "record-review", "render"].includes(command)) {
      const m = read(path.join(out, "production-manifest.json"));
      assert(
        m.productionCodeSha256 === codeFingerprint(),
        "STALE_BUILD: production code changed; run prepare",
      );
      assert(
        m.sharedRuntimeSha256 ===
          hash(fs.readFileSync(path.join(PROD, "runtime.js"))),
        "STALE_BUILD: shared adapter changed; run prepare",
      );
      assert(
        m.generatedScenesSha256 ===
          hash(fs.readFileSync(path.join(out, "scenes.js"))),
        "STALE_BUILD: compiled scenes changed; run prepare",
      );
      assert(
        m.storySha256 === hash(ctx.story) &&
          m.eventConfigSha256 === hash(JSON.stringify(ctx.events)) &&
          m.jobConfigSha256 === hash(JSON.stringify(job)),
        "STALE_BUILD: story/events/job changed; run prepare",
      );
      for (const asset of m.assets || []) {
        assert(
          asset.sha256 === hash(fs.readFileSync(path.join(out, asset.file))),
          "STALE_BUILD: compiled background changed; run prepare",
        );
        if (asset.source)
          assert(
            asset.sha256 ===
              hash(fs.readFileSync(path.join(ROOT, asset.source))),
            "STALE_BUILD: source background changed; run prepare",
          );
      }
      for (const a of m.audioFiles || [])
        assert(
          a.sha256 === hash(fs.readFileSync(path.join(out, a.file))),
          "STALE_BUILD: narration file changed; run prepare",
        );
      if (m.sourceRecording)
        assert(
          m.sourceRecording.sha256 ===
            hash(fs.readFileSync(m.sourceRecording.file)),
          "STALE_BUILD: source recording changed; run prepare",
        );
      for (const [k, v] of Object.entries(ctx.cfg))
        assert(
          m.registryHashes[k] === hash(JSON.stringify(v)),
          "STALE_BUILD: registry changed; run prepare",
        );
    }
    if (command === "check") {
      run(
        process.execPath,
        [path.join(ROOT, "bin/stickman.mjs"), "check", out],
        { timeout: 180000, log: path.join(work, "check.log") },
      );
      const at = plan.shots
        .flatMap((s) => [
          s.start + Math.min(1, s.duration * 0.3),
          s.start + s.duration * 0.78,
        ])
        .map((t) => t.toFixed(2))
        .join(",");
      run(
        process.execPath,
        [path.join(ROOT, "bin/stickman.mjs"), "snapshot", out, "--at", at],
        { timeout: 240000, log: path.join(work, "snapshot.log") },
      );
      run(process.execPath, [path.join(PROD, "runtime-qa.mjs"), out], {
        timeout: 180000,
        log: path.join(work, "runtime-qa.log"),
      });
      write(path.join(work, "stage.json"), {
        stage: "checked",
        status: "succeeded",
      });
      write(path.join(out, "preflight.json"), {
        status: "technical-checks-passed",
        planSha256: currentHash,
        storyboard: "storyboard.md",
        snapshots: "snapshots/",
        visualReviewRequired: true,
      });
      console.log(
        "Technical preflight passed. Open contact sheets, fix if necessary, then record-review.",
      );
    } else if (command === "record-review") {
      const p = read(path.join(out, "preflight.json"));
      assert(p.planSha256 === currentHash, "Plan changed since check");
      assert(
        rest.join(" ").length > 15,
        "Record concrete visual review findings, not a blind approval",
      );
      write(path.join(out, "visual-review.json"), {
        reviewer: "Codex/operator",
        planSha256: currentHash,
        notes: rest.join(" "),
        claim:
          "Contact sheets were actually opened by the operator; not an automated perceptual guarantee",
      });
      console.log("Visual review recorded for this exact plan.");
    } else if (command === "render") {
      assert(
        read(path.join(out, "visual-review.json")).planSha256 === currentHash,
        "Visual review is missing/stale",
      );
      assert(
        read(path.join(out, "preflight.json")).planSha256 === currentHash,
        "Technical preflight is stale",
      );
      write(path.join(work, "stage.json"), {
        stage: "rendering",
        status: "running",
      });
      run(
        process.execPath,
        [
          path.join(ROOT, "bin/stickman.mjs"),
          "render",
          out,
          "--quality",
          ctx.cfg.policy.render.quality,
          "--fps",
          "30",
          "--workers",
          String(ctx.cfg.policy.render.workers),
          "--low-memory",
        ],
        {
          timeout: ctx.cfg.policy.render.timeoutSeconds * 1000,
          log: path.join(work, "render.log"),
        },
      );
      run(process.execPath, [path.join(PROD, "media-qa.mjs"), out], {
        timeout: 240000,
        log: path.join(work, "media-qa.log"),
      });
      write(path.join(work, "stage.json"), {
        stage: "completed",
        status: "succeeded",
        mediaQa: "media-qa.json",
      });
      console.log(
        "Rendered and media QA passed: " +
          path.join(out, "renders", job.id + ".mp4"),
      );
    } else if (command === "qa") {
      run(process.execPath, [path.join(PROD, "media-qa.mjs"), out], {
        timeout: 240000,
        log: path.join(work, "media-qa.log"),
      });
      console.log(fs.readFileSync(path.join(out, "media-qa.json"), "utf8"));
    } else if (command === "status") {
      console.log(
        JSON.stringify(
          {
            out,
            planSeconds: plan.duration,
            shots: plan.shots.length,
            lastStage: read(path.join(work, "stage.json")),
          },
          null,
          2,
        ),
      );
    } else throw new Error("Unknown command " + command);
  }
} catch (e) {
  if (ctx?.out && fs.existsSync(ctx.out))
    write(path.join(ctx.out, "work/failure.json"), {
      command,
      error: e.message,
      resolution:
        "Fix the reported input/config/tool issue, rerun the failed stage. Existing story sources and audio cache are preserved.",
    });
  console.error(e.message);
  process.exit(1);
}
