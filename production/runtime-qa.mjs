import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { createRequire } from "node:module";
import { findBrowsers, which, readConfig } from "../lib/env.mjs";
import { read, write, assert, ROOT } from "./common.mjs";
const require = createRequire(path.join(ROOT, "package.json")),
  puppeteer = require("puppeteer-core"),
  root = path.resolve(process.argv[2]),
  plan = read(path.join(root, "production-plan.json"));
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split("?")[0]),
    p = path.resolve(root, "." + rel);
  if (!p.startsWith(root + path.sep) && p !== root) {
    res.writeHead(403);
    return res.end();
  }
  try {
    const f = fs.statSync(p).isDirectory() ? path.join(p, "index.html") : p;
    res.setHeader(
      "Content-Type",
      {
        ".html": "text/html",
        ".js": "text/javascript",
        ".css": "text/css",
        ".woff2": "font/woff2",
        ".png": "image/png",
        ".wav": "audio/wav",
      }[path.extname(f)] || "application/octet-stream",
    );
    res.end(fs.readFileSync(f));
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
let browser;
try {
  browser = await puppeteer.launch({
    executablePath:
      process.env.HYPERFRAMES_BROWSER_PATH ||
      readConfig().browserPath ||
      which("chromium") ||
      findBrowsers()[0],
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const page = await browser.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto("http://127.0.0.1:" + server.address().port, {
    waitUntil: "networkidle0",
  });
  await page.evaluate(() => document.fonts.ready);
  const result = await page.evaluate(() => {
    const film = SM.current;
    let frameCount = 0,
      invalidTransforms = 0,
      subtitleOverlap = 0,
      subtitleBounds = 0,
      textCollisions = 0;
    const identities = {},
      motion = [],
      examples = [];
    for (const sc of Object.values(film.scenes)) {
      let previous = "",
        run = 0,
        maxRun = 0;
      for (const f of sc.figures) {
        const id = f.el.dataset.character;
        (identities[id] ??= []).push(f.el.dataset.identity);
      }
      for (let fr = 0; fr < Math.round(sc.dur * 30); fr++) {
        film.tl.seek(sc.t0 + fr / 30, false);
        frameCount++;
        const visible = [...sc.ui.querySelectorAll("[data-caption]")].filter(
          (e) => +gsap.getProperty(e, "opacity") > 0.1,
        );
        if (visible.length > 1) subtitleOverlap++;
        for (const f of sc.figures)
          if (
            /NaN|Infinity/.test(
              f.el.style.transform +
                Object.values(f.j)
                  .map((n) => n.style.transform)
                  .join(""),
            )
          )
            invalidTransforms++;
        if (sc.primary) {
          const f = sc.primary,
            sig =
              f.el.style.transform +
              Object.values(f.j)
                .map((n) => n.style.transform)
                .join("|") +
              (f.faceEls?.m.getAttribute("d") || "");
          run = sig === previous ? run + 1 : 1;
          maxRun = Math.max(maxRun, run);
          previous = sig;
        }
        if (fr % 15 === 0) {
          for (const c of visible) {
            const rs = [...c.querySelectorAll(".sm-w")].map((n) =>
              n.getBoundingClientRect(),
            );
            if (
              rs.some(
                (r) =>
                  r.left < 50 ||
                  r.right > 1870 ||
                  r.top < 940 ||
                  r.bottom > 1070,
              )
            )
              subtitleBounds++;
          }
          const labels = [...sc.ui.querySelectorAll(".sm-text")].filter(
            (e) => +gsap.getProperty(e, "opacity") > 0.8,
          );
          for (let i = 0; i < labels.length; i++)
            for (let j = i + 1; j < labels.length; j++) {
              const a = labels[i].getBoundingClientRect(),
                b = labels[j].getBoundingClientRect();
              if (
                a.left < b.right &&
                a.right > b.left &&
                a.top < b.bottom &&
                a.bottom > b.top
              ) {
                textCollisions++;
                if (examples.length < 5)
                  examples.push({
                    scene: sc.id,
                    time: fr / 30,
                    texts: [labels[i].textContent, labels[j].textContent],
                  });
              }
            }
        }
      }
      motion.push({
        scene: sc.id,
        hasPrimary: !!sc.primary,
        maxPrimaryUnchangedSeconds: sc.primary ? maxRun / 30 : null,
        meaningfulActions: sc.production.actions
          .filter((a) => a.verb !== "breathe")
          .map((a) => a.verb),
      });
    }
    const reachChecks = [];
    for (const sc of Object.values(film.scenes))
      for (const a of sc.production.actions) {
        const kind = PRODUCTION_DATA.actions[a.verb].kind;
        if (!["door", "reach", "knock"].includes(kind)) continue;
        film.tl.seek(
          sc.t0 + a.at + (kind === "reach" ? a.duration : 0.35),
          false,
        );
        const f = sc.actors[a.actor],
          p = sc.props[a.target],
          r = f.handR.getBoundingClientRect();
        const marker = document.createElement("div");
        Object.assign(marker.style, {
          position: "absolute",
          left: p.anchor.x + "px",
          top: p.anchor.y + "px",
          width: "0px",
          height: "0px",
        });
        sc.cam.appendChild(marker);
        const m = marker.getBoundingClientRect();
        marker.remove();
        reachChecks.push({
          scene: sc.id,
          verb: a.verb,
          target: a.target,
          errorPixels: Math.hypot(
            r.x + r.width / 2 - m.x,
            r.y + r.height / 2 - m.y,
          ),
        });
      }
    function state(t) {
      film.tl.seek(t, false);
      return [...document.querySelectorAll(".sm-bone,.sm-fig,.sm-cam")]
        .map((e) => e.style.transform)
        .join("|");
    }
    const t = film.duration * 0.4,
      a = state(t);
    [
      0.5,
      film.duration - 0.1,
      film.duration * 0.8,
      film.duration * 0.2,
    ].forEach(state);
    return {
      reachChecks,
      frameCount,
      invalidTransforms,
      subtitleOverlap,
      subtitleBounds,
      textCollisions,
      collisionExamples: examples,
      identities,
      motion,
      seekDeterministic: a === state(t),
    };
  });
  result.pageErrors = errors;
  write(path.join(root, "runtime-qa.json"), result);
  assert(
    result.frameCount === Math.round(plan.duration * 30),
    "Runtime frame audit coverage mismatch",
  );
  assert(!errors.length, "Browser errors");
  assert(result.invalidTransforms === 0, "Invalid actor transforms");
  assert(
    result.subtitleOverlap === 0 && result.subtitleBounds === 0,
    "Caption overlap/bounds failure",
  );
  assert(result.textCollisions === 0, "UI text collision");
  assert(result.seekDeterministic, "Seek determinism failed");
  for (const list of Object.values(result.identities))
    assert(new Set(list).size === 1, "Character identity changed across shots");
  assert(
    result.reachChecks.every((r) => r.errorPixels < 5),
    "Actor cannot reach intended target",
  );
  assert(
    result.motion.every(
      (m) =>
        !m.hasPrimary ||
        m.maxPrimaryUnchangedSeconds <= plan.policy.maxUnchangedPrimarySeconds,
    ),
    "Long unchanged primary pose",
  );
  console.log(JSON.stringify({ status: "passed", ...result }, null, 2));
} finally {
  if (browser) await browser.close();
  server.close();
}
