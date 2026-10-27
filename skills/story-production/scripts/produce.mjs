#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
let root = process.env.STICKMAN_KINO_HOME || process.cwd();
while (!fs.existsSync(path.join(root, "production/cli.mjs"))) {
  const next = path.dirname(root);
  if (next === root)
    throw new Error(
      "Set STICKMAN_KINO_HOME to the existing cloud Stickman Kino checkout",
    );
  root = next;
}
const r = spawnSync(
  process.execPath,
  [path.join(root, "production/cli.mjs"), ...process.argv.slice(2)],
  { cwd: root, stdio: "inherit", env: process.env },
);
if (r.error) throw r.error;
process.exit(r.status ?? 1);
