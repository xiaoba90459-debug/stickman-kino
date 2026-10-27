import fs from "node:fs";
import path from "node:path";
import { hyperframesBin } from "../lib/env.mjs";
import {
  run,
  write,
  read,
  assert,
  hash,
  duration,
  tokens,
  PROD,
} from "./common.mjs";
export function speech(ctx) {
  const { job, paragraphs, out, base, cfg } = ctx,
    work = path.join(out, "work");
  fs.mkdirSync(work, { recursive: true });
  fs.mkdirSync(path.join(out, "assets/vo"), { recursive: true });
  const mode = job.audio?.mode || "tts";
  let units = [];
  if (mode === "tts") {
    const voice = job.audio?.voice || "af_heart",
      speed = job.audio?.speed || 1;
    for (const [i, text] of paragraphs.entries()) {
      const id = "b" + String(i + 1).padStart(2, "0"),
        f = path.join(out, "assets/vo", id + ".wav"),
        cache = f + ".cache.json",
        signature = hash(JSON.stringify([text, voice, speed]));
      if (
        !fs.existsSync(f) ||
        !fs.existsSync(cache) ||
        read(cache).signature !== signature
      ) {
        const raw = path.join(work, id + "-raw.wav");
        run(
          process.execPath,
          [
            hyperframesBin(),
            "tts",
            text,
            "-v",
            voice,
            "-s",
            String(speed),
            "-o",
            raw,
          ],
          {
            cwd: out,
            timeout: cfg.policy.limits.audioCommandTimeoutSeconds * 1000,
            log: path.join(work, id + "-tts.log"),
          },
        );
        assert(
          fs.statSync(raw).size < cfg.policy.limits.maxAudioFileBytes,
          "Audio file size limit",
        );
        const d = duration(raw);
        run(
          "ffmpeg",
          [
            "-y",
            "-v",
            "error",
            "-i",
            raw,
            "-t",
            String(d + 0.01),
            "-af",
            "highpass=f=60,loudnorm=I=-16:TP=-1.5:LRA=11",
            "-ar",
            "44100",
            "-ac",
            "2",
            f,
          ],
          { timeout: 30000 },
        );
        fs.unlinkSync(raw);
        write(cache, { signature });
      }
      const seconds = duration(f);
      assert(seconds > 0 && seconds < 60, "Unexpected narration unit duration");
      units.push({
        id,
        text,
        file: f,
        seconds,
        voStart: 0.23,
        alignment: "measured-segment",
      });
    }
  } else if (mode === "recording") {
    const file = path.resolve(base, job.audio.file);
    assert(fs.existsSync(file), "Missing recording");
    assert(
      fs.statSync(file).size < cfg.policy.limits.maxAudioFileBytes,
      "Audio file size limit",
    );
    let alignment;
    if (job.audio.alignment) {
      alignment = read(path.resolve(base, job.audio.alignment));
      assert(alignment.words, "Alignment must contain words[]");
    } else {
      const pcm = path.join(work, "recording-16k.wav"),
        text = path.join(work, "transcript.txt"),
        dest = path.join(work, "forced-alignment.json");
      write(text, paragraphs.join("\n\n"));
      run("ffmpeg", [
        "-y",
        "-v",
        "error",
        "-i",
        file,
        "-t",
        String(duration(file)),
        "-ar",
        "16000",
        "-ac",
        "1",
        "-c:a",
        "pcm_s16le",
        pcm,
      ]);
      run("python", [path.join(PROD, "align.py"), pcm, text, dest], {
        timeout: Math.max(90000, duration(file) * 8000),
        log: path.join(work, "alignment.log"),
      });
      alignment = read(dest);
    }
    const expected = tokens(paragraphs.join(" "));
    assert(
      JSON.stringify(expected) ===
        JSON.stringify(alignment.words.map((w) => w.word)),
      "Alignment transcript mismatch",
    );
    const seconds = duration(file);
    assert(
      alignment.words.every(
        (w, i) =>
          Number.isFinite(w.start) &&
          Number.isFinite(w.end) &&
          w.start >= 0 &&
          w.end > w.start &&
          w.end <= seconds + 0.04 &&
          (!i || w.start >= alignment.words[i - 1].end - 0.011),
      ),
      "Invalid/non-monotonic supplied alignment",
    );
    let k = 0,
      clipStart = 0;
    for (const [i, text] of paragraphs.entries()) {
      const n = tokens(text).length,
        ws = alignment.words.slice(k, k + n),
        next = alignment.words[k + n],
        end = next
          ? Math.round(((ws.at(-1).end + next.start) / 2) * 30) / 30
          : Math.ceil(seconds * 30) / 30;
      const id = "b" + String(i + 1).padStart(2, "0"),
        f = path.join(out, "assets/vo", id + ".wav");
      run("ffmpeg", [
        "-y",
        "-v",
        "error",
        "-ss",
        String(clipStart),
        "-i",
        file,
        "-t",
        String(end - clipStart),
        "-ar",
        "44100",
        "-ac",
        "2",
        f,
      ]);
      units.push({
        id,
        text,
        file: f,
        seconds: duration(f),
        voStart: 0,
        fixedDuration: end - clipStart,
        sourceStart: clipStart,
        words: ws.map((w) => ({
          ...w,
          start: w.start - clipStart,
          end: w.end - clipStart,
        })),
        alignment: alignment.method || "supplied-word-sidecar",
      });
      k += n;
      clipStart = end;
    }
    write(path.join(out, "alignment.json"), alignment);
  } else throw new Error("Unsupported audio.mode; use tts or recording");
  if (mode === "tts" && job.audio?.alignWords !== false) {
    for (const u of units) {
      const wav = path.join(work, u.id + "-align.wav"),
        txt = path.join(work, u.id + "-align.txt"),
        dest = path.join(work, u.id + "-align.json");
      write(txt, u.text);
      run("ffmpeg", [
        "-y",
        "-v",
        "error",
        "-i",
        u.file,
        "-t",
        String(u.seconds),
        "-ar",
        "16000",
        "-ac",
        "1",
        "-c:a",
        "pcm_s16le",
        wav,
      ]);
      run("python", [path.join(PROD, "align.py"), wav, txt, dest], {
        timeout: 90000,
        log: path.join(work, u.id + "-align.log"),
      });
      const a = read(dest);
      u.words = a.words;
      u.alignment = a.method;
    }
  }
  write(path.join(out, "speech.json"), units);
  return units;
}
