# Layout verification checklist

A layout may only be promoted to `branah-verified` after every item below is confirmed by a human
against the reference page (https://www.branah.com/<language>). Parsing successfully is **not**
verification.

## Automated (covered by `validate_layouts.py` + tests)

- [ ] Valid JSON, `schemaVersion: 1`.
- [ ] `languageId` matches folder; `languageId`/`layoutId` unique across the DB.
- [ ] All `keyId`s unique within the layout; required fields non-empty.
- [ ] Valid Unicode (no unpaired surrogates) in `normal` and `shift`.
- [ ] Manifest references resolve; `sha256` and `sizeBytes` match the file.
- [ ] Row/key order is preserved as authored (not alphabetised).
- [ ] No unintended identical-to-another-layout key mapping (warning reviewed).

## Manual comparison with the reference (required for `branah-verified`)

- [ ] **Key positions**: every key sits in the same row and column as the reference.
- [ ] **Normal layer**: each key's unshifted output matches the reference character.
- [ ] **Shift layer**: each key's shifted output matches the reference's Shift state (NOT assumed to
      be upper-case).
- [ ] **Row counts**: number of keys per row matches the reference (within the template's 13/13/13/11
      capacity — otherwise flag, do not silently drop keys).
- [ ] **Digits / punctuation / language marks** present and in the right positions.
- [ ] **Direction** (`ltr`/`rtl`) correct.
- [ ] **Case flag** (`hasCase`) correct for the script.
- [ ] **Combining / composition**: `inputProcessing` flags set; any unimplemented IME behaviour
      (kana→kanji, Hangul block composition, Indic reordering beyond OS shaping) documented as a
      known limitation.
- [ ] Spot-check on a device: type each row and confirm the committed text, Shift behaviour, and
      Backspace over multi-code-point / combining sequences.

## Promotion

Update the layout's `provenance.verification`, regenerate the manifest, and move the layout from the
"Requires review" to the "Verified" section of `VERIFICATION_REPORT.md`.
