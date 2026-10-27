---
name: story-production
description: Produce original English 2D stories from script and narration with the configuration-driven Stickman Kino production CLI. Audit capabilities, create semantic event data, align local audio, plan varied shots, preserve character identity, render and verify without writing story-specific animation JavaScript.
---

# Story Production · validated workflow, not a new engine

Use this Skill for a new story, not for further versions of the completed Shadow film. Locate the existing Stickman Kino checkout (contains production/cli.mjs). The standalone launcher accepts STICKMAN_KINO_HOME or searches upward from the current directory. All work runs in the selected cloud environment. Do not invoke paid APIs, contact third parties, rewrite engine/, or overwrite existing films.

## Engineering acceptance boundary

Read production/docs/ENGINEERING-AUDIT.md first. This Skill supplies Codex-authored per-shot semantic JSON; the CLI does not infer arbitrary plot, era, identity or emotion. A year label is not era-specific scenery. When the requested setting/era lacks matching assets, report the gap and do not claim that reusing a modern scene with a different label generated the period.

Use the committed door/clock short fixtures for regression. Historical 80s evidence is dated and belongs to an older code fingerprint. Unused registry actions are implemented candidates, not automatically validated acting combinations.

## Inputs

- English story as UTF-8 story.txt. A blank line separates narrative beats; 5–18 spoken words per beat is a useful starting point. Split a long paragraph into beats **without changing its words**. Spoken numbers must be spelled out. Explain content changes if you must edit a supplied story.
- Narration: job.audio.mode="recording" plus a local cloud file, or mode="tts" using installed free Kokoro. For supplied recordings, use production/align.py (local PocketSphinx) or a verified words[] sidecar. Never claim unknown pronunciations or failed alignments succeeded.
- job.json: duration, voice/input paths and independent config paths. See production/schema/job.schema.json and production/examples/.
- events.json: semantic narrative intent, not rendering code. See references/input-contract.md.

## Semantic direction (Codex does this; no paid LLM API)

1. Read production/config/{characters,actions,cameras,backgrounds,policy}.json and production/docs/ENGINEERING-AUDIT.md. Do not assume any uncatalogued motion is supported.
2. `node production/cli.mjs suggest JOB.json` can create conservative guesses. These are **unreviewed**, intentionally unrenderable. Read the English story and replace guesses with meaningful beat data: purpose, kind, setting, actors, props and actions. Set reviewed=true only after checking it.
3. Each beat must add plot information or emotion. Show the premise early; establish rule, cost, escalation and a specific open question. Use rule/diagram/compare only for actual explanation; the planner routes those to SVG, and story beats to layered assets.
4. Select existing characters and settings. Reuse identity IDs across shots; introduce additional identity variants in characters.json, never inline JS. Record asset limitations: a reused modern street is a symbolic setting, not a historically accurate reconstruction.
5. Actions must match story events. Open/close/knock require a door target; reaching needs a visible target. Preserve logical object state between related beats. Annotate every complex requested action not in the registry. **Stop with UNSUPPORTED_ACTION instead of replacing swimming/fighting/flight with a walk or raised arm.** Resolve missing pronunciation, target, overlapping events or insufficient duration by changing documented inputs/assets, not by bypassing gates.
6. Do not copy a previous film.json and change its narration. Create fresh story/event data and let the compiler produce film.json and scenes.js. Do not edit generated scenes.js or add story-title/beat-ID branches to production/runtime.js.

## Actual commands

From the existing repository:

```bash
# Once per new cloud installation; precompiled free local English alignment model.
python -m pip install --only-binary=:all: --target production/.python -r production/requirements-align.txt
node bin/stickman.mjs doctor
node production/cli.mjs prepare production/examples/every-door/job.json
node production/cli.mjs check production/examples/every-door/job.json
```

Read the produced storyboard.md, runtime-qa.json and snapshots/contact-sheet*.jpg. Open the images with the image-viewing tool. Check face/limb shape, contacts, target reach, readable labels, occlusion, subtitle separation, actor/prop continuity and event meaning. Fix a reusable template or config when needed, then prepare/check again. The producer performs this review within the user's authorized task; do not ask the user to approve routine staging.

```bash
node production/cli.mjs record-review JOB.json "Concrete findings from the contact sheets, including any intentional crops"
node production/cli.mjs render JOB.json
node production/cli.mjs qa JOB.json
```

The shared entry can also run `run JOB.json`: prepare/check, then report review_required or continue to render if a matching review exists. The image review remains an operator/Codex step; do not describe this as an unattended perceptual validator.

## Outputs and evidence

Deliver MP4, original story/events, job and independent registries, production-plan.json, storyboard.md, character.json, caption-timeline.json, alignment evidence, production-manifest.json, runtime/media QA and exact run commands. Verify the same production-adapter.js SHA-256 across two different stories. Document which config changed; no custom animation JS should be needed for supported actions.

The real end-to-end validation range is recorded in production/docs/TEST_REPORT.md. 180/600-second configuration tests are **not** proof of stable 3/10-minute production. Preserve all completed movies and publish only to the existing private artifact destination unless the user directs otherwise; do not commit large MP4s to a GitHub code repository.

## Failure handling

- Unknown/complex action: report missing template/asset and stop; do not substitute.
- ALIGNMENT_OOV/TOKEN_MISMATCH/INVALID_TIMES: pronunciation or transcript mismatch; fix dictionary/recording or supply verified timing. Do not guess successful word timestamps.
- DURATION_BUDGET: shorten/re-record, increase target or improve beat segmentation. Do not clip narration or pad one static shot to ten minutes.
- Layout/contrast/occlusion: fix registries, scene-data placement or a general adapter rule; rerun preflight and review. Do not mark accidental text overlap intentional.
- Failed audio/render: read videos/<id>/work/failure.json and stage logs; outputs have explicit timeouts/size guards. Reuse speech cache; never delete old films to free space. No automatic remote API fallback.
- Stale plan/runtime/config: prepare/check/review again. Generated scenes are not editing surfaces.

See [input contract](references/input-contract.md) and [failure reference](references/failures.md).
