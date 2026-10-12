# Multi-Language Keyboard — Language Database

GitHub-hosted layout database for the **Multi-Language Keyboard** Android app. The app ships only an
English XML keyboard; every other language is downloaded on demand from this repository. Add
languages here and existing app installs pick them up **without an app update**.

```
language-database/
├── README.md
├── LICENSE
├── manifest.json                 # primary index the app reads (generated)
├── schemas/
│   └── keyboard-layout.schema.json
├── languages/
│   ├── en/english-qwerty.json
│   ├── de/german-qwertz.json
│   ├── ar/arabic-101.json
│   └── …
├── scripts/
│   ├── validate_layouts.py       # canonical validator
│   └── generate_manifest.py      # canonical manifest generator
├── tools/
│   ├── build_layouts.mjs         # (optional) author layouts from compact tables
│   └── ci.mjs                    # Node mirror of the two Python scripts (no-Python environments)
├── tests/
│   └── layout_validation_tests.py
└── docs/
    ├── ADDING_A_LANGUAGE.md
    ├── VERIFICATION_CHECKLIST.md
    ├── VERIFICATION_REPORT.md
    └── ATTRIBUTION.md
```

## How the app uses it

1. The app fetches `manifest.json` from the configured raw URL and lists the languages.
2. When a user picks a language, the app downloads only that layout file, verifies its **SHA-256**
   against the manifest, validates it against the schema, then installs it to app-private storage.
3. The keyboard renders the layout. English always works offline; downloaded layouts are cached and
   keep working if GitHub is unavailable.

The app never scrapes any website at runtime and never transmits typed text. See the app's
`RemoteConfig.java` for the single place the repository URL/branch is configured.

## Layout format

Each layout is a versioned JSON document (schema in `schemas/keyboard-layout.schema.json`). It
describes **character keys only** — the action keys (Shift, Delete, Enter, Space, Symbols, Language)
are structural and supplied by the app, never as Unicode.

Rows map onto the physical keyboard positions reproduced by the reference:

| rowId   | physical row      | max keys |
|---------|-------------------|----------|
| `row-0` | number / top row  | 13 |
| `row-1` | QWERTY row        | 13 |
| `row-2` | home (ASDF) row   | 13 |
| `row-3` | bottom (ZXCV) row | 11 (flanked by Shift/Delete in the app) |

Each key has an independent `normal` and `shift` output — **shift is never derived by upper-casing**,
so caseless scripts and script-specific alternates are represented correctly. Outputs are full
Unicode strings and may contain combining marks, multiple code points or supplementary-plane
characters.

```jsonc
{
  "schemaVersion": 1,
  "languageId": "de",
  "layoutId": "german-qwertz",
  "direction": "ltr",
  "hasCase": true,
  "rows": [
    { "rowId": "row-0", "keys": [ { "keyId": "row-0-1", "normal": "1", "shift": "!" } ] }
  ]
}
```

## Working with the database

```bash
# validate every layout (and cross-check manifest checksums)
python scripts/validate_layouts.py

# regenerate manifest.json after adding/editing layouts
python scripts/generate_manifest.py        # add --now to stamp current time

# run golden-fixture tests
python -m unittest tests/layout_validation_tests.py

# no Python available? the Node mirror does validate + manifest in one step:
node tools/ci.mjs
```

See [docs/ADDING_A_LANGUAGE.md](docs/ADDING_A_LANGUAGE.md) to add a language or a layout variant,
[docs/VERIFICATION_CHECKLIST.md](docs/VERIFICATION_CHECKLIST.md) for the per-layout review steps, and
[docs/VERIFICATION_REPORT.md](docs/VERIFICATION_REPORT.md) for the current completed/incomplete status.

## Verification status

Layouts carry a `verification` level: `unverified` → `json-valid` → `layout-reviewed` →
`branah-verified`. A layout is **never** marked `branah-verified` just because its JSON parses — that
level requires a manual key-by-key comparison against the reference. See the report for current
status; complex-script limitations (composition/IME) are documented there and in each layout's
`inputProcessing` block.

## License & attribution

MIT (see `LICENSE`). Layout data is independently authored from publicly documented standard
layouts; https://www.branah.com/ was used only as a functional positional reference. No site code or
assets were copied. Per-layout provenance: [docs/ATTRIBUTION.md](docs/ATTRIBUTION.md).
