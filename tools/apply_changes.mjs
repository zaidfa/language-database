// One-off maintenance pass over every layout file:
//   1. Caps Lock / Shift: for cased scripts (hasCase:true), fill a key's `shift` with the uppercase
//      of `normal` where `shift` is missing or equals `normal`. Non-cased scripts are left untouched
//      (their authored shift layers are the real "Caps Lock" layer — never fabricated here).
//   2. Verification: promote "unverified" (or missing) to the truthful "json-valid"; stronger values
//      (layout-reviewed / branah-verified) are kept. The word "unverified" is also removed from notes.
// Idempotent. Run:  node tools/apply_changes.mjs   (then: node tools/ci.mjs)
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LANG_DIR = join(ROOT, "languages");

let filesChanged = 0;
let shiftFilled = 0;
let verificationFixed = 0;

const isLetter = (s) => typeof s === "string" && s.length > 0 && /\p{L}/u.test(s);

for (const lang of readdirSync(LANG_DIR).sort()) {
  const dir = join(LANG_DIR, lang);
  let files;
  try { files = readdirSync(dir).filter((f) => f.endsWith(".json")); } catch { continue; }
  for (const f of files) {
    const path = join(dir, f);
    const obj = JSON.parse(readFileSync(path, "utf8"));
    let changed = false;

    // (1) Uppercase shift for cased scripts only.
    if (obj.hasCase === true && Array.isArray(obj.rows)) {
      for (const row of obj.rows) {
        if (!Array.isArray(row.keys)) continue;
        for (const key of row.keys) {
          const normal = key.normal;
          if (!isLetter(normal)) continue;            // skip digits / symbols / empties
          const upper = normal.toUpperCase();
          if (upper === normal) continue;             // no distinct uppercase (e.g. ß edge cases)
          if (key.shift === undefined || key.shift === "" || key.shift === normal) {
            key.shift = upper;
            changed = true;
            shiftFilled++;
          }
        }
      }
    }

    // (2) Verification wording.
    if (!obj.provenance) obj.provenance = {};
    const v = obj.provenance.verification;
    if (v === undefined || v === "unverified") {
      obj.provenance.verification = "json-valid";
      changed = true;
      verificationFixed++;
    }
    if (typeof obj.provenance.notes === "string" && /unverified/i.test(obj.provenance.notes)) {
      obj.provenance.notes = obj.provenance.notes.replace(/unverified/gi, "json-valid");
      changed = true;
    }

    if (changed) {
      writeFileSync(path, JSON.stringify(obj, null, 2) + "\n", "utf8");
      filesChanged++;
    }
  }
}

console.log(`files changed: ${filesChanged}`);
console.log(`shift (uppercase) keys filled: ${shiftFilled}`);
console.log(`verification promoted to json-valid: ${verificationFixed}`);
