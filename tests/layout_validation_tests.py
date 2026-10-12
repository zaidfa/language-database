#!/usr/bin/env python3
"""Golden-fixture + structural tests for the language database.

Run from the repo root:  python -m pytest tests/  (or)  python tests/layout_validation_tests.py

These assert the EXACT output expected at specific key positions and modifier states, so a layout is
not considered correct merely because its JSON parses. Fixtures cover English, Khmer, Arabic, Hindi,
Korean, Japanese and an accented-Latin layout (German), as required by the spec.
"""
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LANG_DIR = ROOT / "languages"


def load(language_id, layout_id):
    return json.loads((LANG_DIR / language_id / f"{layout_id}.json").read_text(encoding="utf-8"))


def key_at(layout, row_index, key_index):
    return layout["rows"][row_index]["keys"][key_index]


# (languageId, layoutId, rowIndex, keyIndex, expectedNormal, expectedShift)
GOLDEN = [
    # English: letters are lower/upper; digits map to symbols on shift.
    ("en", "english-qwerty", 0, 0, "1", "!"),
    ("en", "english-qwerty", 1, 0, "q", "Q"),
    ("en", "english-qwerty", 1, 9, "p", "P"),
    ("en", "english-qwerty", 3, 6, "m", "M"),
    # Accented Latin (German): direct umlaut + eszett keys.
    ("de", "german-qwertz", 1, 5, "z", "Z"),       # QWERTZ swaps z/y
    ("de", "german-qwertz", 2, 9, "ö", "Ö"),
    ("de", "german-qwertz", 2, 10, "ä", "Ä"),
    ("de", "german-qwertz", 0, 10, "ß", "?"),
    # Arabic: caseless base layer (shift is a separate diacritic layer, not upper-case).
    ("ar", "arabic-101", 1, 0, "ض", "َ"),
    ("ar", "arabic-101", 2, 5, "ا", "أ"),
    # Hindi InScript: combining matra on base, independent vowel on shift.
    ("hi", "hindi-inscript", 1, 0, "ौ", "औ"),
    ("hi", "hindi-inscript", 2, 5, "प", "फ"),
    # Korean 2-set: base jamo + tense (double) jamo on shift.
    ("ko", "korean-dubeolsik", 1, 0, "ㅂ", "ㅃ"),
    ("ko", "korean-dubeolsik", 1, 3, "ㄱ", "ㄲ"),
    # Japanese hiragana (JIS kana) direct output.
    ("ja", "japanese-hiragana", 0, 2, "あ", "ぁ"),
    ("ja", "japanese-hiragana", 3, 0, "つ", "っ"),
    # Khmer NiDA base consonants.
    ("km", "khmer-nida", 1, 0, "ឆ", "ឈ"),
    ("km", "khmer-nida", 2, 0, "ា", "ាំ"),
]

REQUIRED_LANGUAGES = ["en", "km", "ar", "hi", "ko", "ja", "de"]


class GoldenFixtureTests(unittest.TestCase):
    def test_golden_outputs(self):
        for lang, layout_id, ri, ki, normal, shift in GOLDEN:
            layout = load(lang, layout_id)
            key = key_at(layout, ri, ki)
            self.assertEqual(key["normal"], normal,
                             f"{lang}/{layout_id} row {ri} key {ki} normal")
            self.assertEqual(key.get("shift", key["normal"]), shift,
                             f"{lang}/{layout_id} row {ri} key {ki} shift")

    def test_required_languages_present(self):
        for lang in REQUIRED_LANGUAGES:
            folder = LANG_DIR / lang
            self.assertTrue(folder.exists() and any(folder.glob("*.json")),
                            f"missing required test language: {lang}")

    def test_caseless_scripts_not_marked_cased(self):
        for lang, layout_id in [("ar", "arabic-101"), ("ko", "korean-dubeolsik"),
                                ("ja", "japanese-hiragana"), ("km", "khmer-nida"),
                                ("hi", "hindi-inscript")]:
            self.assertFalse(load(lang, layout_id)["hasCase"],
                             f"{lang} should be caseless")

    def test_english_is_cased(self):
        self.assertTrue(load("en", "english-qwerty")["hasCase"])

    def test_composition_flagged_for_cjk(self):
        for lang, layout_id in [("ko", "korean-dubeolsik"), ("ja", "japanese-hiragana")]:
            ip = load(lang, layout_id)["inputProcessing"]
            self.assertTrue(ip["composition"],
                            f"{lang} must flag composition=true (not yet implemented in app)")

    def test_rtl_direction(self):
        for lang, layout_id in [("ar", "arabic-101"), ("fa", "persian-standard")]:
            self.assertEqual(load(lang, layout_id)["direction"], "rtl")

    def test_accented_latin_has_non_ascii(self):
        layout = load("de", "german-qwertz")
        glyphs = "".join(k["normal"] for r in layout["rows"] for k in r["keys"])
        self.assertTrue(any(ord(c) > 127 for c in glyphs),
                        "German layout should contain non-ASCII letters")


if __name__ == "__main__":
    unittest.main(verbosity=2)
