# Verification report

Status of each implemented layout. Honesty policy: a layout is listed as **verified** only after a
manual key-by-key comparison with the reference; everything else is a reviewed draft or a flagged
preview. No layout here has yet been pixel-diffed against the live reference in an automated way, so
**only English is treated as fully verified** (it is the standard US ANSI QWERTY and is identical to
the app's bundled layout).

Totals: **11 layouts / 11 languages.** Legend — ✅ verified · 🟡 reviewed (needs manual Branah diff)
· ⚠️ preview (normal layer drafted; shift and/or script behaviour needs review).

## Verified ✅

| Lang | Layout | Notes |
|------|--------|-------|
| English (`en`) | `english-qwerty` | Standard US ANSI QWERTY; matches bundled `qwerty.xml`. Full case support. |

## Reviewed — needs manual Branah diff 🟡

These use well-documented standard national layouts. Normal + Shift layers are authored; positions
believed correct but not yet confirmed key-by-key against the reference.

| Lang | Layout | Notes / open items |
|------|--------|--------------------|
| German (`de`) | `german-qwertz` | T1. ä ö ü ß direct. Dead-key accents (^ ´ `) not modelled. |
| French (`fr`) | `french-azerty` | é è ç à ù direct; digits on Shift of number row. Dead ^ / ¨ not modelled. |
| Spanish (`es`) | `spanish-qwerty` | ñ direct. Acute-accent dead key (á é í ó ú) **not** modelled — flagged. |
| Russian (`ru`) | `russian-jcuken` | ЙЦУКЕН; Cyrillic case = Shift uppercase. Number-row symbols per RU standard. |
| Arabic (`ar`) | `arabic-101` | Base layer high-confidence. **Shift/diacritic layer is best-effort — must be verified.** |
| Persian (`fa`) | `persian-standard` | Base layer drafted. Shift layer best-effort — verify. |

## Preview — normal layer drafted, review required ⚠️

Complex scripts. The layout installs and emits raw Unicode units, but full input-method behaviour is
**not implemented** (documented limitation, not a silent substitution).

| Lang | Layout | Limitation |
|------|--------|-----------|
| Hindi (`hi`) | `hindi-inscript` | InScript base drafted; shift partial. Combining matras emitted; conjunct shaping left to OS. Needs key-by-key review. |
| Korean (`ko`) | `korean-dubeolsik` | 2-set jamo positions. **No Hangul block composition** — jamo appear uncombined until a composer is added. |
| Japanese (`ja`) | `japanese-hiragana` | JIS kana positions. **No kana→kanji conversion / candidate selection** — direct hiragana only. |
| Khmer (`km`) | `khmer-nida` | NiDA base + partial shift. Replaces the mislabelled bundled layout (old `qwerty_khmer.xml` actually contained Korean jamo). Coeng/stacking left to OS; needs review. |

## Known app-level limitations

- **No composition engines** yet: Korean syllable blocks, Japanese kana→kanji, Chinese input, and
  Indic smart reordering are not implemented. Affected layouts output raw units and are flagged with
  `inputProcessing.composition: true`.
- **Dead keys** (accent composition) are not modelled; accented letters only appear where a layout
  has them as direct keys.
- Shift/diacritic layers for Arabic & Persian are best-effort and must be verified before promotion.

## How to promote a layout

Follow `VERIFICATION_CHECKLIST.md`, update `provenance.verification` in the layout file, run
`generate_manifest.py`, and move the row into the Verified section above.
