#!/usr/bin/env python3
"""Regenerate manifest.json from the layout files in languages/.

The manifest is the primary index the Android app reads to discover languages and layouts; it
records names, native names, locale tags, writing direction, capability flags, layout file paths,
file-format versions, byte sizes, SHA-256 checksums and verification status. Checksums/sizes are
computed from the actual files, so running this after editing a layout keeps them consistent.

Paths stay stable across regenerations (languages/<lang>/<layout>.json) so installed apps can update
their manifest without invalidating already-cached layouts.

Usage:
  python scripts/generate_manifest.py                 # uses the fixed LAST_UPDATED below
  python scripts/generate_manifest.py --now           # stamp with current UTC time
"""
import argparse
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LANG_DIR = ROOT / "languages"
MANIFEST = ROOT / "manifest.json"

DATABASE_VERSION = "1.0.0"
# Deterministic default so regenerating without --now does not churn the file.
LAST_UPDATED = "2026-10-12T00:00:00Z"
MIN_APP_VERSION = 1


def build(last_updated):
    languages = []
    for lang_dir in sorted(p for p in LANG_DIR.iterdir() if p.is_dir()):
        layouts = []
        meta = None
        for jf in sorted(lang_dir.glob("*.json")):
            raw = jf.read_bytes()
            obj = json.loads(raw.decode("utf-8"))
            if meta is None:
                meta = obj
            prov = obj.get("provenance") or {}
            layouts.append({
                "layoutId": obj["layoutId"],
                "layoutName": obj.get("layoutName", obj["layoutId"]),
                "path": f"languages/{lang_dir.name}/{jf.name}",
                "formatVersion": obj.get("schemaVersion", 1),
                "sizeBytes": len(raw),
                "sha256": hashlib.sha256(raw).hexdigest(),
                "verification": prov.get("verification", "unverified"),
            })
        if not layouts or meta is None:
            continue
        layouts.sort(key=lambda x: x["layoutId"])
        ip = meta.get("inputProcessing") or {}
        prov = meta.get("provenance") or {}
        languages.append({
            "languageId": lang_dir.name,
            "languageName": meta.get("languageName", lang_dir.name),
            "nativeName": meta.get("nativeName", meta.get("languageName", lang_dir.name)),
            "localeTag": meta.get("localeTag", lang_dir.name),
            "script": meta.get("script", ""),
            "direction": meta.get("direction", "ltr"),
            "hasCase": bool(meta.get("hasCase", False)),
            "capabilities": {
                "inputMode": ip.get("mode", "direct"),
                "combining": bool(ip.get("combining", False)),
                "composition": bool(ip.get("composition", False)),
            },
            "verification": prov.get("verification", "unverified"),
            "layouts": layouts,
        })
    languages.sort(key=lambda x: x["languageId"])
    return {
        "manifestSchemaVersion": 1,
        "databaseVersion": DATABASE_VERSION,
        "lastUpdated": last_updated,
        "minAppVersion": MIN_APP_VERSION,
        "languages": languages,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--now", action="store_true", help="stamp lastUpdated with current UTC time")
    args = ap.parse_args()
    if not LANG_DIR.exists():
        print("no languages/ directory", file=sys.stderr)
        return 1
    last_updated = (datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
                    if args.now else LAST_UPDATED)
    manifest = build(last_updated)
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    total = sum(len(l["layouts"]) for l in manifest["languages"])
    print(f"wrote manifest.json: {len(manifest['languages'])} languages, {total} layouts")
    return 0


if __name__ == "__main__":
    sys.exit(main())
