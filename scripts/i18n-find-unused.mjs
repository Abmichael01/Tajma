#!/usr/bin/env node
// Scan source code for t('...')/t("...") calls and verify each key exists in
// the i18n JSON files. Flags:
//   - keys called in code but missing in JSON  (would render as raw key in UI)
//   - keys defined in JSON but never called   (dead translations)
// Run from repo root: node scripts/i18n-find-unused.mjs

import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join, extname } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

const SURFACES = [
  {
    name: "mobile (app)",
    en: "app/src/i18n/locales/en.json",
    srcDirs: ["app/src"],
    namespaceMode: "single", // i18next: t('common.foo')
  },
  {
    name: "web (frontend)",
    en: "frontend/src/i18n/locales/en.json",
    srcDirs: ["frontend/src"],
    namespaceMode: "namespaced", // next-intl: useTranslations('common'); t('foo') → common.foo
  },
];

function flatten(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}

function walk(dir, hits = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return hits; }
  for (const name of entries) {
    if (name === "node_modules" || name === ".next" || name === "dist" || name === ".expo") continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, hits);
    else if ([".tsx", ".ts", ".jsx", ".js"].includes(extname(name))) hits.push(full);
  }
  return hits;
}

// Match t('key') / t("key") / t(`key`) — ignoring dynamic args like t(varName).
// Capture group 1 = the literal key string.
const T_CALL_RE = /\bt\s*\(\s*['"`]([a-zA-Z_][a-zA-Z0-9_.]*)['"`]/g;
// For next-intl style: const t = useTranslations('namespace')
const USETRANS_RE = /useTranslations\s*\(\s*['"]([a-zA-Z_][a-zA-Z0-9_.]*)['"]\s*\)/g;
// Mobile (i18next) style: i18n.t('foo.bar') — same as t('foo.bar'), already handled

for (const surface of SURFACES) {
  console.log("\n" + "=".repeat(72));
  console.log(`SURFACE: ${surface.name}`);
  console.log("=".repeat(72));

  const enJson = JSON.parse(readFileSync(resolve(ROOT, surface.en), "utf8"));
  const flatKeys = new Set(Object.keys(flatten(enJson)));

  const calledKeys = new Set();
  const callsByFile = {};

  for (const dir of surface.srcDirs) {
    const files = walk(resolve(ROOT, dir));
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      // Determine namespace for next-intl: scan useTranslations() in same file.
      let namespaces = [];
      if (surface.namespaceMode === "namespaced") {
        for (const m of src.matchAll(USETRANS_RE)) namespaces.push(m[1]);
      }
      for (const m of src.matchAll(T_CALL_RE)) {
        const rawKey = m[1];
        // For namespaced (next-intl): prepend namespace(s)
        // We'll try each namespace; if any resolves to a real key, that's the
        // one. If none does, we'll report the raw key against the most likely
        // namespace (first one found).
        const candidates = surface.namespaceMode === "namespaced" && namespaces.length
          ? namespaces.map(ns => `${ns}.${rawKey}`)
          : [rawKey];
        const matched = candidates.find(c => flatKeys.has(c));
        const resolvedKey = matched || candidates[0];
        calledKeys.add(resolvedKey);
        if (!matched) {
          (callsByFile[file] = callsByFile[file] || []).push({ rawKey, resolvedKey });
        }
      }
    }
  }

  // Missing: called but not in JSON
  const missing = [];
  for (const k of calledKeys) if (!flatKeys.has(k)) missing.push(k);

  // Unused: in JSON but never called
  const unused = [];
  for (const k of flatKeys) if (!calledKeys.has(k)) unused.push(k);

  console.log(`  Code calls: ${calledKeys.size} unique keys`);
  console.log(`  JSON defines: ${flatKeys.size} keys`);
  console.log(`  ${String(missing.length).padStart(4)} keys CALLED but MISSING from JSON (would render raw)`);
  if (missing.length) {
    const byFile = {};
    for (const [file, calls] of Object.entries(callsByFile)) {
      for (const c of calls) (byFile[file] = byFile[file] || []).push(c);
    }
    const relRoot = ROOT + "/";
    for (const [file, calls] of Object.entries(byFile).slice(0, 20)) {
      console.log(`     ${file.replace(relRoot, "")}`);
      for (const c of calls.slice(0, 4)) {
        console.log(`        • t('${c.rawKey}') → resolves to "${c.resolvedKey}" (not defined)`);
      }
      if (calls.length > 4) console.log(`        … +${calls.length - 4} more in this file`);
    }
    if (Object.keys(byFile).length > 20) {
      console.log(`     … and ${Object.keys(byFile).length - 20} more files with missing keys`);
    }
  }

  console.log(`\n  ${String(unused.length).padStart(4)} keys DEFINED but never called (likely dead translations)`);
  if (unused.length) {
    unused.slice(0, 15).forEach(k => console.log(`     • ${k}`));
    if (unused.length > 15) console.log(`     … +${unused.length - 15} more`);
  }
}
console.log("");
