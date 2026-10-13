// Offline-runnable mirror of scripts/validate_layouts.py + scripts/generate_manifest.py, used in
// environments without Python. Validates every layout and regenerates manifest.json with real
// SHA-256 checksums and byte sizes. The Python scripts are the canonical tools; this produces
// byte-identical manifest content.
//
// Run:  node tools/ci.mjs
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LANG_DIR = join(ROOT, "languages");
const DB_VERSION = "1.0.0";
const LAST_UPDATED = "2026-10-12T00:00:00Z"; // keep deterministic; bump when regenerating
// Country/region flag per language id (browse UI). Ids not listed fall back to the globe.
let FLAGS = {};
try { FLAGS = JSON.parse(readFileSync(join(ROOT, "tools", "flags.json"), "utf8")); } catch (e) {}

const errors = [];
const warnings = [];
const seenLangLayout = new Set();

function fail(f, m) { errors.push(`${f}: ${m}`); }
function warn(f, m) { warnings.push(`${f}: ${m}`); }

function isValidUnicode(s) {
  // Reject unpaired surrogates (malformed UTF-16).
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff) {
      const n = s.charCodeAt(i + 1);
      if (!(n >= 0xdc00 && n <= 0xdfff)) return false;
      i++;
    } else if (c >= 0xdc00 && c <= 0xdfff) {
      return false;
    }
  }
  return true;
}

function validate(file, obj) {
  if (obj.schemaVersion !== 1) fail(file, `bad schemaVersion ${obj.schemaVersion}`);
  for (const f of ["languageId", "layoutId", "layoutName", "direction", "rows"]) {
    if (obj[f] === undefined || obj[f] === null || obj[f] === "") fail(file, `missing ${f}`);
  }
  if (!["ltr", "rtl"].includes(obj.direction)) fail(file, `bad direction ${obj.direction}`);
  const key = `${obj.languageId}/${obj.layoutId}`;
  if (seenLangLayout.has(key)) fail(file, `duplicate language/layout id ${key}`);
  seenLangLayout.add(key);

  if (!Array.isArray(obj.rows) || obj.rows.length === 0) { fail(file, "no rows"); return; }
  const keyIds = new Set();
  const rowSignatures = [];
  obj.rows.forEach((row, ri) => {
    if (!row.rowId) fail(file, `row ${ri} missing rowId`);
    if (!Array.isArray(row.keys) || row.keys.length === 0) { fail(file, `row ${row.rowId} empty`); return; }
    if (row.keys.length > 13) fail(file, `row ${row.rowId} has ${row.keys.length} keys (>13 template max)`);
    if (ri === 3 && row.keys.length > 11) warn(file, `bottom row has ${row.keys.length} keys (>11 may clip)`);
    const sig = [];
    row.keys.forEach((k) => {
      if (!k.keyId) fail(file, `key in ${row.rowId} missing keyId`);
      if (keyIds.has(k.keyId)) fail(file, `duplicate keyId ${k.keyId}`);
      keyIds.add(k.keyId);
      const hasNormal = typeof k.normal === "string" && k.normal.length > 0;
      const hasLabel = typeof k.label === "string" && k.label.length > 0;
      if (!hasNormal && !hasLabel) fail(file, `key ${k.keyId} has no output`);
      if (hasNormal && !isValidUnicode(k.normal)) fail(file, `key ${k.keyId} normal has invalid Unicode`);
      if (typeof k.shift === "string" && k.shift.length > 0 && !isValidUnicode(k.shift))
        fail(file, `key ${k.keyId} shift has invalid Unicode`);
      sig.push(k.normal || "");
    });
    rowSignatures.push(sig.join(""));
  });
  return rowSignatures.join("");
}

// Walk languages/
const langFolders = readdirSync(LANG_DIR).filter((d) => statSync(join(LANG_DIR, d)).isDirectory());
const layoutSignatures = new Map();
const byLang = new Map();

for (const lang of langFolders.sort()) {
  const dir = join(LANG_DIR, lang);
  const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  for (const f of files) {
    const rel = `languages/${lang}/${f}`;
    const raw = readFileSync(join(dir, f), "utf8");
    let obj;
    try { obj = JSON.parse(raw); } catch (e) { fail(rel, `invalid JSON: ${e.message}`); continue; }
    if (obj.languageId !== lang) fail(rel, `languageId '${obj.languageId}' != folder '${lang}'`);
    const sig = validate(rel, obj);
    if (sig) {
      if (layoutSignatures.has(sig)) warn(rel, `identical key mapping to ${layoutSignatures.get(sig)}`);
      else layoutSignatures.set(sig, rel);
    }
    const bytes = Buffer.from(raw, "utf8");
    const sha = createHash("sha256").update(bytes).digest("hex");
    if (!byLang.has(lang)) byLang.set(lang, { meta: obj, layouts: [] });
    byLang.get(lang).layouts.push({
      layoutId: obj.layoutId,
      layoutName: obj.layoutName,
      path: rel,
      formatVersion: obj.schemaVersion,
      sizeBytes: bytes.length,
      sha256: sha,
      verification: (obj.provenance && obj.provenance.verification) || "unverified",
    });
  }
}

// Build manifest
const languages = [];
for (const lang of [...byLang.keys()].sort()) {
  const { meta, layouts } = byLang.get(lang);
  const ip = meta.inputProcessing || {};
  languages.push({
    languageId: lang,
    languageName: meta.languageName,
    nativeName: meta.nativeName,
    localeTag: meta.localeTag,
    script: meta.script,
    direction: meta.direction,
    flag: FLAGS[lang] || "🌐",
    hasCase: !!meta.hasCase,
    capabilities: { inputMode: ip.mode || "direct", combining: !!ip.combining, composition: !!ip.composition },
    verification: (meta.provenance && meta.provenance.verification) || "unverified",
    layouts: layouts.sort((a, b) => a.layoutId.localeCompare(b.layoutId)),
  });
}

const manifest = {
  manifestSchemaVersion: 1,
  databaseVersion: DB_VERSION,
  lastUpdated: LAST_UPDATED,
  minAppVersion: 1,
  languages,
};

if (errors.length) {
  console.error("VALIDATION FAILED:\n" + errors.map((e) => "  ✗ " + e).join("\n"));
  process.exit(1);
}
writeFileSync(join(ROOT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");

const totalLayouts = languages.reduce((a, l) => a + l.layouts.length, 0);
console.log(`✓ validated ${totalLayouts} layouts across ${languages.length} languages`);
if (warnings.length) console.log("warnings:\n" + warnings.map((w) => "  ! " + w).join("\n"));
console.log("✓ wrote manifest.json");
