# Adding a language or layout variant

No app release is needed — add files here, regenerate the manifest, push, and existing installs pick
the new language up on their next manifest refresh.

## Add a new language

1. Create `languages/<languageId>/<layoutId>.json`.
   * `languageId` — short stable id, usually the ISO-639 code (`[a-z0-9-]{2,16}`). It **must** equal
     the folder name.
   * `layoutId` — unique per language, kebab-case, e.g. `arabic-101` (`[a-z0-9-]{2,48}`).
2. Fill the four rows (`row-0`..`row-3`) following the reference layout's key **positions**. Put the
   normal-state glyph in `normal` and the Shift-state glyph in `shift`.
   * Preserve the reference's key order within each row. Do **not** sort alphabetically.
   * For caseless scripts set `"hasCase": false` and still give a meaningful `shift` (alternate layer)
     or repeat `normal` — never upper-case.
   * Use real Unicode. Combining marks, multi-code-point keys and supplementary-plane characters are
     all allowed.
3. Set metadata: `languageName`, `nativeName`, `localeTag` (BCP-47 where appropriate), `script`
   (ISO 15924), `direction` (`ltr`/`rtl`), and `inputProcessing` (see below).
4. Record provenance honestly in `provenance.verification` (start at `unverified` or `json-valid`).
5. Validate, regenerate the manifest, run tests:
   ```bash
   python scripts/validate_layouts.py
   python scripts/generate_manifest.py
   python -m unittest tests/layout_validation_tests.py
   ```
6. Commit and push. Done.

### Easiest authoring path

Add an entry to `tools/build_layouts.mjs` (compact `[normal, shift]` tables) and run
`node tools/build_layouts.mjs` to emit the JSON. Then `node tools/ci.mjs` (or the Python scripts) to
validate + regenerate the manifest.

## Add a layout variant to an existing language

Drop another `*.json` in the same `languages/<languageId>/` folder with a new `layoutId` (e.g.
`arabic-azerty.json` alongside `arabic-101.json`). The app shows all variants under that language and
lets the user choose. Regenerate the manifest.

## `inputProcessing` flags

| field | meaning |
|-------|---------|
| `mode` | `direct` (emit code points), `composing`, `transliteration`, `candidates` |
| `combining` | layout emits combining marks (OS renderer shapes them) |
| `composition` | script needs syllable/kana/kanji composition **not yet implemented** by the app — the layout still installs and emits raw units, but set this `true` so the UI can warn |

## Regenerating checksums & the manifest

`generate_manifest.py` recomputes every `sha256` and `sizeBytes` from the actual files. Always run it
after editing any layout, and commit the updated `manifest.json`. File **paths never change** across
regenerations, so cached layouts in installed apps stay valid.
