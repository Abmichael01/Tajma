#!/usr/bin/env node
// Apply translation patches. Re-runnable — idempotent.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

function setPath(obj, dottedPath, value) {
  const keys = dottedPath.split(".");
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!cur[keys[i]] || typeof cur[keys[i]] !== "object") cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
}

function applyPatches(filePath, patches) {
  const fullPath = resolve(ROOT, filePath);
  const json = JSON.parse(readFileSync(fullPath, "utf8"));
  for (const [path, value] of Object.entries(patches)) setPath(json, path, value);
  writeFileSync(fullPath, JSON.stringify(json, null, 2) + "\n", "utf8");
  console.log(`  ${filePath}: ${Object.keys(patches).length} patches`);
}

// Missing key referenced as fallback for unknown user names.
applyPatches("app/src/i18n/locales/en.json", { "common.user": "User" });
applyPatches("app/src/i18n/locales/fr.json", { "common.user": "Utilisateur" });
applyPatches("app/src/i18n/locales/ha.json", { "common.user": "Mai amfani" });
console.log("Done.");
