#!/usr/bin/env python3
"""Validate every keyboard-layout JSON file in the language database.

Canonical validator (the Node tools/ci.mjs mirror exists only for environments without Python).

Checks performed per the project spec:
  * valid JSON syntax and schema version
  * unique language/layout ids and unique key ids within a layout
  * non-empty required fields and valid direction
  * row/key ordering preserved (no alphabetical re-sorting is enforced here; order is taken as-is)
  * valid Unicode strings (no unpaired surrogates)
  * both normal and shift outputs are well-formed
  * manifest <-> file references resolve and SHA-256 checksums match (when manifest.json present)
  * duplicate / suspiciously identical layouts (warning)
  * language folder name matches languageId

Legitimate repeated characters / combining marks / repeated outputs are NOT rejected.

Exit code 0 = all good, 1 = at least one error.
"""
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LANG_DIR = ROOT / "languages"
MANIFEST = ROOT / "manifest.json"

errors = []
warnings = []


def fail(where, msg):
    errors.append(f"{where}: {msg}")


def warn(where, msg):
    warnings.append(f"{where}: {msg}")


def valid_unicode(s: str) -> bool:
    """Reject unpaired UTF-16 surrogates (Python str can hold lone surrogates)."""
    try:
        s.encode("utf-8")
        return True
    except UnicodeEncodeError:
        return False


def validate_layout(rel, obj, seen_ids, signatures):
    if obj.get("schemaVersion") != 1:
        fail(rel, f"bad schemaVersion {obj.get('schemaVersion')}")
    for f in ("languageId", "layoutId", "layoutName", "direction", "rows"):
        if not obj.get(f):
            fail(rel, f"missing {f}")
    if obj.get("direction") not in ("ltr", "rtl"):
        fail(rel, f"bad direction {obj.get('direction')}")

    key = f"{obj.get('languageId')}/{obj.get('layoutId')}"
    if key in seen_ids:
        fail(rel, f"duplicate language/layout id {key}")
    seen_ids.add(key)

    rows = obj.get("rows") or []
    if not rows:
        fail(rel, "no rows")
        return
    key_ids = set()
    sig_parts = []
    for ri, row in enumerate(rows):
        if not row.get("rowId"):
            fail(rel, f"row {ri} missing rowId")
        keys = row.get("keys") or []
        if not keys:
            fail(rel, f"row {row.get('rowId')} empty")
            continue
        if len(keys) > 13:
            fail(rel, f"row {row.get('rowId')} has {len(keys)} keys (>13 template max)")
        if ri == 3 and len(keys) > 11:
            warn(rel, f"bottom row has {len(keys)} keys (>11 may clip)")
        for k in keys:
            kid = k.get("keyId")
            if not kid:
                fail(rel, f"key in {row.get('rowId')} missing keyId")
            if kid in key_ids:
                fail(rel, f"duplicate keyId {kid}")
            key_ids.add(kid)
            normal = k.get("normal") or ""
            label = k.get("label") or ""
            if not normal and not label:
                fail(rel, f"key {kid} has no output")
            if normal and not valid_unicode(normal):
                fail(rel, f"key {kid} normal has invalid Unicode")
            shift = k.get("shift") or ""
            if shift and not valid_unicode(shift):
                fail(rel, f"key {kid} shift has invalid Unicode")
            sig_parts.append(normal)
    sig = "".join(sig_parts)
    if sig in signatures:
        warn(rel, f"identical key mapping to {signatures[sig]}")
    else:
        signatures[sig] = rel


def verify_manifest_checksums():
    if not MANIFEST.exists():
        warn("manifest.json", "not found; skipping checksum cross-check")
        return
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    for lang in manifest.get("languages", []):
        for layout in lang.get("layouts", []):
            path = layout.get("path", "")
            f = ROOT / path
            if ".." in path or path.startswith("/"):
                fail("manifest.json", f"unsafe path {path}")
                continue
            if not f.exists():
                fail("manifest.json", f"referenced file missing: {path}")
                continue
            data = f.read_bytes()
            actual = hashlib.sha256(data).hexdigest()
            if layout.get("sha256") != actual:
                fail("manifest.json", f"sha256 mismatch for {path}")
            if layout.get("sizeBytes") != len(data):
                fail("manifest.json", f"sizeBytes mismatch for {path}")


def main():
    if not LANG_DIR.exists():
        print("no languages/ directory", file=sys.stderr)
        return 1
    seen_ids = set()
    signatures = {}
    count = 0
    for lang_dir in sorted(p for p in LANG_DIR.iterdir() if p.is_dir()):
        for jf in sorted(lang_dir.glob("*.json")):
            rel = f"languages/{lang_dir.name}/{jf.name}"
            try:
                obj = json.loads(jf.read_text(encoding="utf-8"))
            except json.JSONDecodeError as e:
                fail(rel, f"invalid JSON: {e}")
                continue
            if obj.get("languageId") != lang_dir.name:
                fail(rel, f"languageId '{obj.get('languageId')}' != folder '{lang_dir.name}'")
            validate_layout(rel, obj, seen_ids, signatures)
            count += 1
    verify_manifest_checksums()

    for w in warnings:
        print(f"  ! {w}")
    if errors:
        for e in errors:
            print(f"  ✗ {e}")
        print(f"\nFAILED: {len(errors)} error(s) across {count} layout file(s)")
        return 1
    print(f"\nOK: {count} layout file(s) valid; {len(warnings)} warning(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
