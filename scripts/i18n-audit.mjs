#!/usr/bin/env node
// Audit i18n JSON files for parity gaps and untranslated stubs.
// Run from repo root: node scripts/i18n-audit.mjs

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

const SURFACES = [
  {
    name: "mobile (app)",
    files: {
      en: "app/src/i18n/locales/en.json",
      fr: "app/src/i18n/locales/fr.json",
      ha: "app/src/i18n/locales/ha.json",
    },
  },
  {
    name: "web (frontend)",
    files: {
      en: "frontend/src/i18n/locales/en.json",
      fr: "frontend/src/i18n/locales/fr.json",
      ha: "frontend/src/i18n/locales/ha.json",
    },
  },
];

function flatten(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      flatten(v, key, out);
    } else {
      out[key] = v;
    }
  }
  return out;
}

// A value "looks like a raw key" if it has dots, no spaces, all lowercase
// segments — i.e. someone left the t('...') key as the visible value.
function looksLikeRawKey(value) {
  if (typeof value !== "string") return false;
  if (!value.includes(".")) return false;
  if (value.includes(" ")) return false;
  return /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/i.test(value);
}

const auditSurface = (surface) => {
  const flat = {};
  for (const [lang, path] of Object.entries(surface.files)) {
    const raw = readFileSync(resolve(ROOT, path), "utf8");
    flat[lang] = flatten(JSON.parse(raw));
  }
  const enKeys = new Set(Object.keys(flat.en));
  const frKeys = new Set(Object.keys(flat.fr));
  const haKeys = new Set(Object.keys(flat.ha));

  const missing = { fr: [], ha: [] };
  const stubs = { fr: [], ha: [] }; // value identical to en
  const rawKeys = { en: [], fr: [], ha: [] };
  const extra = { fr: [], ha: [] }; // present in fr/ha but not in en

  for (const key of enKeys) {
    if (!frKeys.has(key)) missing.fr.push(key);
    if (!haKeys.has(key)) missing.ha.push(key);
    if (frKeys.has(key) && flat.fr[key] === flat.en[key] && typeof flat.en[key] === "string" && flat.en[key].trim() !== "") {
      stubs.fr.push({ key, value: flat.en[key] });
    }
    if (haKeys.has(key) && flat.ha[key] === flat.en[key] && typeof flat.en[key] === "string" && flat.en[key].trim() !== "") {
      stubs.ha.push({ key, value: flat.en[key] });
    }
  }
  for (const key of frKeys) if (!enKeys.has(key)) extra.fr.push(key);
  for (const key of haKeys) if (!enKeys.has(key)) extra.ha.push(key);

  for (const [lang, entries] of Object.entries(flat)) {
    for (const [key, value] of Object.entries(entries)) {
      if (looksLikeRawKey(value)) rawKeys[lang].push({ key, value });
    }
  }

  return {
    name: surface.name,
    counts: { en: enKeys.size, fr: frKeys.size, ha: haKeys.size },
    missing,
    stubs,
    rawKeys,
    extra,
  };
};

const results = SURFACES.map(auditSurface);

const fmt = (n, label) => `${String(n).padStart(4)} ${label}`;
const trunc = (s, n = 60) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

for (const r of results) {
  console.log("\n" + "=".repeat(72));
  console.log(`SURFACE: ${r.name}`);
  console.log("=".repeat(72));
  console.log(`Total leaf keys — en: ${r.counts.en}  fr: ${r.counts.fr}  ha: ${r.counts.ha}`);

  for (const lang of ["fr", "ha"]) {
    console.log(`\n[${lang.toUpperCase()}]`);
    console.log(`  ${fmt(r.missing[lang].length, "keys MISSING (present in en, absent here)")}`);
    if (r.missing[lang].length) {
      r.missing[lang].slice(0, 20).forEach((k) => console.log(`     • ${k}`));
      if (r.missing[lang].length > 20) console.log(`     … +${r.missing[lang].length - 20} more`);
    }

    console.log(`  ${fmt(r.stubs[lang].length, "keys UNTRANSLATED (value identical to en)")}`);
    if (r.stubs[lang].length) {
      r.stubs[lang].slice(0, 15).forEach(({ key, value }) =>
        console.log(`     • ${key} = "${trunc(value, 50)}"`)
      );
      if (r.stubs[lang].length > 15) console.log(`     … +${r.stubs[lang].length - 15} more`);
    }

    console.log(`  ${fmt(r.extra[lang].length, "keys EXTRA (present in this lang, absent in en)")}`);
    if (r.extra[lang].length) {
      r.extra[lang].slice(0, 10).forEach((k) => console.log(`     • ${k}`));
      if (r.extra[lang].length > 10) console.log(`     … +${r.extra[lang].length - 10} more`);
    }
  }

  const rawTotal = r.rawKeys.en.length + r.rawKeys.fr.length + r.rawKeys.ha.length;
  console.log(`\n  ${fmt(rawTotal, "RAW-KEY-LIKE values (suspicious — looks like an untranslated key)")}`);
  for (const lang of ["en", "fr", "ha"]) {
    if (r.rawKeys[lang].length) {
      console.log(`     [${lang}] ${r.rawKeys[lang].length}:`);
      r.rawKeys[lang].slice(0, 10).forEach(({ key, value }) =>
        console.log(`        • ${key} = "${value}"`)
      );
    }
  }
}
console.log("");
