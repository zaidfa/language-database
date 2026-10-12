// Authoring tool: emits the layout JSON files under languages/<lang>/<layout>.json from the
// compact tables below, so the exact mapping data lives in one reviewable place. The emitted JSON
// files are the source of truth the validator/manifest tools consume.
//
// Row model (maps onto the physical keyboard positions Branah reproduces):
//   row-0 = number/top row        (up to 13 keys)
//   row-1 = QWERTY row            (up to 13 keys)
//   row-2 = home (ASDF) row       (up to 13 keys)
//   row-3 = bottom (ZXCV) row     (up to 11 keys, flanked by Shift/Delete in the app)
//
// Each key is either "x" (normal==shift) or ["normal","shift"]. Nothing here is executed by the
// Android app; it only ever reads the emitted JSON as data.
//
// Run:  node tools/build_layouts.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function k(v) { return Array.isArray(v) ? { normal: v[0], shift: v[1] } : { normal: v, shift: v }; }
function row(id, keys) {
  return { rowId: id, keys: keys.map((v, i) => ({ keyId: `${id}-${i + 1}`, ...k(v) })) };
}
function layout(meta, rows) {
  const obj = {
    schemaVersion: 1,
    languageId: meta.languageId,
    layoutId: meta.layoutId,
    layoutName: meta.layoutName,
    languageName: meta.languageName,
    nativeName: meta.nativeName,
    localeTag: meta.localeTag,
    script: meta.script,
    direction: meta.direction || "ltr",
    hasCase: !!meta.hasCase,
    inputProcessing: meta.inputProcessing || { mode: "direct", combining: false, composition: false },
    provenance: meta.provenance,
    rows: rows.map((r, i) => row(`row-${i}`, r)),
  };
  return obj;
}

const digitsEN = [["1", "!"], ["2", "@"], ["3", "#"], ["4", "$"], ["5", "%"], ["6", "^"], ["7", "&"], ["8", "*"], ["9", "("], ["0", ")"]];

const LAYOUTS = [];

// ---------------------------------------------------------------- English (reference) -----------
LAYOUTS.push(layout(
  {
    languageId: "en", layoutId: "english-qwerty", layoutName: "English QWERTY",
    languageName: "English", nativeName: "English", localeTag: "en", script: "Latn",
    direction: "ltr", hasCase: true,
    inputProcessing: { mode: "direct", combining: false, composition: false },
    provenance: { reference: "https://www.branah.com/english", verification: "branah-verified",
      notes: "Standard US ANSI QWERTY; identical to the bundled qwerty.xml, used as the parity reference." },
  },
  [
    digitsEN,
    [["q", "Q"], ["w", "W"], ["e", "E"], ["r", "R"], ["t", "T"], ["y", "Y"], ["u", "U"], ["i", "I"], ["o", "O"], ["p", "P"]],
    [["a", "A"], ["s", "S"], ["d", "D"], ["f", "F"], ["g", "G"], ["h", "H"], ["j", "J"], ["k", "K"], ["l", "L"]],
    [["z", "Z"], ["x", "X"], ["c", "C"], ["v", "V"], ["b", "B"], ["n", "N"], ["m", "M"]],
  ],
));

// ---------------------------------------------------------------- German QWERTZ (T1) ------------
LAYOUTS.push(layout(
  {
    languageId: "de", layoutId: "german-qwertz", layoutName: "German QWERTZ",
    languageName: "German", nativeName: "Deutsch", localeTag: "de", script: "Latn",
    direction: "ltr", hasCase: true,
    inputProcessing: { mode: "direct", combining: false, composition: false },
    provenance: { reference: "https://www.branah.com/german", verification: "layout-reviewed",
      notes: "German T1. Umlauts ä ö ü and ß are direct keys. Dead-key accents (^ ´ `) are not modelled; listed for manual Branah verification." },
  },
  [
    [["1", "!"], ["2", "\""], ["3", "§"], ["4", "$"], ["5", "%"], ["6", "&"], ["7", "/"], ["8", "("], ["9", ")"], ["0", "="], ["ß", "?"]],
    [["q", "Q"], ["w", "W"], ["e", "E"], ["r", "R"], ["t", "T"], ["z", "Z"], ["u", "U"], ["i", "I"], ["o", "O"], ["p", "P"], ["ü", "Ü"], ["+", "*"]],
    [["a", "A"], ["s", "S"], ["d", "D"], ["f", "F"], ["g", "G"], ["h", "H"], ["j", "J"], ["k", "K"], ["l", "L"], ["ö", "Ö"], ["ä", "Ä"]],
    [["y", "Y"], ["x", "X"], ["c", "C"], ["v", "V"], ["b", "B"], ["n", "N"], ["m", "M"], [",", ";"], [".", ":"], ["-", "_"]],
  ],
));

// ---------------------------------------------------------------- French AZERTY -----------------
LAYOUTS.push(layout(
  {
    languageId: "fr", layoutId: "french-azerty", layoutName: "French AZERTY",
    languageName: "French", nativeName: "Français", localeTag: "fr", script: "Latn",
    direction: "ltr", hasCase: true,
    inputProcessing: { mode: "direct", combining: false, composition: false },
    provenance: { reference: "https://www.branah.com/french", verification: "layout-reviewed",
      notes: "French AZERTY. Accented letters é è ç à ù are direct keys; digits are on the Shift layer of the number row (authentic AZERTY). Dead circumflex/trema not modelled." },
  },
  [
    [["&", "1"], ["é", "2"], ["\"", "3"], ["'", "4"], ["(", "5"], ["-", "6"], ["è", "7"], ["_", "8"], ["ç", "9"], ["à", "0"]],
    [["a", "A"], ["z", "Z"], ["e", "E"], ["r", "R"], ["t", "T"], ["y", "Y"], ["u", "U"], ["i", "I"], ["o", "O"], ["p", "P"]],
    [["q", "Q"], ["s", "S"], ["d", "D"], ["f", "F"], ["g", "G"], ["h", "H"], ["j", "J"], ["k", "K"], ["l", "L"], ["m", "M"], ["ù", "%"]],
    [["w", "W"], ["x", "X"], ["c", "C"], ["v", "V"], ["b", "B"], ["n", "N"], [",", "?"], [";", "."], [":", "/"], ["!", "§"]],
  ],
));

// ---------------------------------------------------------------- Spanish QWERTY (Spain) --------
LAYOUTS.push(layout(
  {
    languageId: "es", layoutId: "spanish-qwerty", layoutName: "Spanish QWERTY",
    languageName: "Spanish", nativeName: "Español", localeTag: "es", script: "Latn",
    direction: "ltr", hasCase: true,
    inputProcessing: { mode: "direct", combining: false, composition: false },
    provenance: { reference: "https://www.branah.com/spanish", verification: "layout-reviewed",
      notes: "Spain QWERTY. ñ is a direct key. Acute-accent vowels (á é í ó ú) use a dead key on the physical layout and are NOT modelled as direct output; flagged for review." },
  },
  [
    [["1", "!"], ["2", "\""], ["3", "·"], ["4", "$"], ["5", "%"], ["6", "&"], ["7", "/"], ["8", "("], ["9", ")"], ["0", "="], ["'", "?"], ["¡", "¿"]],
    [["q", "Q"], ["w", "W"], ["e", "E"], ["r", "R"], ["t", "T"], ["y", "Y"], ["u", "U"], ["i", "I"], ["o", "O"], ["p", "P"]],
    [["a", "A"], ["s", "S"], ["d", "D"], ["f", "F"], ["g", "G"], ["h", "H"], ["j", "J"], ["k", "K"], ["l", "L"], ["ñ", "Ñ"]],
    [["z", "Z"], ["x", "X"], ["c", "C"], ["v", "V"], ["b", "B"], ["n", "N"], ["m", "M"], [",", ";"], [".", ":"], ["-", "_"]],
  ],
));

// ---------------------------------------------------------------- Russian ЙЦУКЕН ----------------
LAYOUTS.push(layout(
  {
    languageId: "ru", layoutId: "russian-jcuken", layoutName: "Russian (ЙЦУКЕН)",
    languageName: "Russian", nativeName: "Русский", localeTag: "ru", script: "Cyrl",
    direction: "ltr", hasCase: true,
    inputProcessing: { mode: "direct", combining: false, composition: false },
    provenance: { reference: "https://www.branah.com/russian", verification: "layout-reviewed",
      notes: "Standard Windows Russian ЙЦУКЕН. Cyrillic has case, so Shift = uppercase. Number-row Shift symbols follow the Russian standard." },
  },
  [
    [["1", "!"], ["2", "\""], ["3", "№"], ["4", ";"], ["5", "%"], ["6", ":"], ["7", "?"], ["8", "*"], ["9", "("], ["0", ")"], ["ё", "Ё"]],
    [["й", "Й"], ["ц", "Ц"], ["у", "У"], ["к", "К"], ["е", "Е"], ["н", "Н"], ["г", "Г"], ["ш", "Ш"], ["щ", "Щ"], ["з", "З"], ["х", "Х"], ["ъ", "Ъ"]],
    [["ф", "Ф"], ["ы", "Ы"], ["в", "В"], ["а", "А"], ["п", "П"], ["р", "Р"], ["о", "О"], ["л", "Л"], ["д", "Д"], ["ж", "Ж"], ["э", "Э"]],
    [["я", "Я"], ["ч", "Ч"], ["с", "С"], ["м", "М"], ["и", "И"], ["т", "Т"], ["ь", "Ь"], ["б", "Б"], ["ю", "Ю"], [".", ","]],
  ],
));

// ---------------------------------------------------------------- Arabic 101 --------------------
LAYOUTS.push(layout(
  {
    languageId: "ar", layoutId: "arabic-101", layoutName: "Arabic (101)",
    languageName: "Arabic", nativeName: "العربية", localeTag: "ar", script: "Arab",
    direction: "rtl", hasCase: false,
    inputProcessing: { mode: "direct", combining: true, composition: false,
      notes: "Arabic is caseless; the Shift layer provides diacritics/alternates and is applied via the keyboard's Shift swap." },
    provenance: { reference: "https://www.branah.com/arabic", verification: "layout-reviewed",
      notes: "NORMAL (base) layer is high-confidence standard Arabic 101. The SHIFT (diacritic) layer is best-effort and REQUIRES manual Branah verification before being trusted." },
  },
  [
    [["1", "!"], ["2", "@"], ["3", "#"], ["4", "$"], ["5", "%"], ["6", "^"], ["7", "&"], ["8", "*"], ["9", ")"], ["0", "("]],
    [["ض", "َ"], ["ص", "ً"], ["ث", "ُ"], ["ق", "ٌ"], ["ف", "لإ"], ["غ", "إ"], ["ع", "‘"], ["ه", "÷"], ["خ", "×"], ["ح", "؛"], ["ج", "<"], ["د", ">"]],
    [["ش", "ِ"], ["س", "ٍ"], ["ي", "]"], ["ب", "["], ["ل", "لأ"], ["ا", "أ"], ["ت", "ـ"], ["ن", "،"], ["م", "/"], ["ك", ":"], ["ط", "\""]],
    [["ئ", "~"], ["ء", "ْ"], ["ؤ", "}"], ["ر", "{"], ["لا", "لآ"], ["ى", "آ"], ["ة", "’"], ["و", ","], ["ز", "."], ["ظ", "؟"]],
  ],
));

// ---------------------------------------------------------------- Persian (Farsi) ---------------
LAYOUTS.push(layout(
  {
    languageId: "fa", layoutId: "persian-standard", layoutName: "Persian (Standard)",
    languageName: "Persian", nativeName: "فارسی", localeTag: "fa", script: "Arab",
    direction: "rtl", hasCase: false,
    inputProcessing: { mode: "direct", combining: true, composition: false },
    provenance: { reference: "https://www.branah.com/farsi", verification: "layout-reviewed",
      notes: "Base layer follows the common Iranian (ISIRI-ish) Persian layout. Shift layer is best-effort and flagged for manual Branah verification." },
  },
  [
    [["۱", "!"], ["۲", "٬"], ["۳", "٫"], ["۴", "﷼"], ["۵", "٪"], ["۶", "×"], ["۷", "،"], ["۸", "*"], ["۹", ")"], ["۰", "("]],
    [["ض", "ْ"], ["ص", "ٌ"], ["ث", "ٍ"], ["ق", "ً"], ["ف", "ُ"], ["غ", "ِ"], ["ع", "َ"], ["ه", "ّ"], ["خ", "]"], ["ح", "["], ["ج", "}"], ["چ", "{"]],
    [["ش", "ؤ"], ["س", "ئ"], ["ی", "ي"], ["ب", "إ"], ["ل", "أ"], ["ا", "آ"], ["ت", "ة"], ["ن", "»"], ["م", "«"], ["ک", ":"], ["گ", "؛"]],
    [["ظ", "ك"], ["ط", "ٔ"], ["ز", "ژ"], ["ر", "ٰ"], ["ذ", "‌"], ["د", "ٱ"], ["پ", "ء"], ["و", ">"], [".", "<"], ["/", "؟"]],
  ],
));

// ---------------------------------------------------------------- Hindi InScript ----------------
LAYOUTS.push(layout(
  {
    languageId: "hi", layoutId: "hindi-inscript", layoutName: "Hindi (InScript)",
    languageName: "Hindi", nativeName: "हिन्दी", localeTag: "hi", script: "Deva",
    direction: "ltr", hasCase: false,
    inputProcessing: { mode: "direct", combining: true, composition: false,
      notes: "Devanagari uses combining matras; the app emits the exact code points. Reordering/conjunct shaping is handled by the OS text renderer, not by composition logic." },
    provenance: { reference: "https://www.branah.com/hindi", verification: "unverified",
      notes: "Standard InScript base layer. NOT yet verified key-by-key against Branah; Shift layer partially filled. Treat as preview until reviewed." },
  },
  [
    [["1", "ँ"], ["2", "ॅ"], ["3", "्र"], ["4", "र्"], ["5", "ज्ञ"], ["6", "त्र"], ["7", "क्ष"], ["8", "श्र"], ["9", "("], ["0", ")"]],
    [["ौ", "औ"], ["ै", "ऐ"], ["ा", "आ"], ["ी", "ई"], ["ू", "ऊ"], ["ब", "भ"], ["ह", "ङ"], ["ग", "घ"], ["द", "ध"], ["ज", "झ"], ["ड", "ढ"], ["़", "ञ"]],
    [["ो", "ओ"], ["े", "ए"], ["्", "अ"], ["ि", "इ"], ["ु", "उ"], ["प", "फ"], ["र", "ऱ"], ["क", "ख"], ["त", "थ"], ["च", "छ"], ["ट", "ठ"]],
    [["ॆ", "ऍ"], ["ं", "ण"], ["म", "ं"], ["न", "ऩ"], ["व", "ऴ"], ["ल", "ळ"], ["स", "श"], ["य", "य़"], ["।", "ऽ"]],
  ],
));

// ---------------------------------------------------------------- Korean Dubeolsik --------------
LAYOUTS.push(layout(
  {
    languageId: "ko", layoutId: "korean-dubeolsik", layoutName: "Korean (Dubeolsik 2-set)",
    languageName: "Korean", nativeName: "한국어", localeTag: "ko", script: "Hang",
    direction: "ltr", hasCase: false,
    inputProcessing: { mode: "direct", combining: false, composition: true,
      notes: "Outputs individual jamo at the correct 2-set positions. Automatic jamo->syllable BLOCK composition is NOT implemented; typed jamo appear uncombined until a composition engine is added." },
    provenance: { reference: "https://www.branah.com/korean", verification: "unverified",
      notes: "Base + Shift jamo positions follow the standard 2-set (두벌식). Pending manual Branah verification and a Hangul composition engine." },
  },
  [
    digitsEN,
    [["ㅂ", "ㅃ"], ["ㅈ", "ㅉ"], ["ㄷ", "ㄸ"], ["ㄱ", "ㄲ"], ["ㅅ", "ㅆ"], ["ㅛ", "ㅛ"], ["ㅕ", "ㅕ"], ["ㅑ", "ㅑ"], ["ㅐ", "ㅒ"], ["ㅔ", "ㅖ"]],
    [["ㅁ", "ㅁ"], ["ㄴ", "ㄴ"], ["ㅇ", "ㅇ"], ["ㄹ", "ㄹ"], ["ㅎ", "ㅎ"], ["ㅗ", "ㅗ"], ["ㅓ", "ㅓ"], ["ㅏ", "ㅏ"], ["ㅣ", "ㅣ"]],
    [["ㅋ", "ㅋ"], ["ㅌ", "ㅌ"], ["ㅊ", "ㅊ"], ["ㅍ", "ㅍ"], ["ㅠ", "ㅠ"], ["ㅜ", "ㅜ"], ["ㅡ", "ㅡ"]],
  ],
));

// ---------------------------------------------------------------- Japanese Hiragana (JIS kana) --
LAYOUTS.push(layout(
  {
    languageId: "ja", layoutId: "japanese-hiragana", layoutName: "Japanese Hiragana (JIS kana)",
    languageName: "Japanese", nativeName: "日本語", localeTag: "ja", script: "Jpan",
    direction: "ltr", hasCase: false,
    inputProcessing: { mode: "direct", combining: false, composition: true,
      notes: "Outputs hiragana directly at JIS-kana positions. Kana->Kanji conversion and candidate selection are NOT implemented; only direct hiragana input is produced." },
    provenance: { reference: "https://www.branah.com/japanese", verification: "unverified",
      notes: "JIS kana base positions. Shift layer (small kana / alternates) partially filled. Pending manual Branah verification and an IME conversion engine." },
  },
  [
    [["ぬ", "ぬ"], ["ふ", "ふ"], ["あ", "ぁ"], ["う", "ぅ"], ["え", "ぇ"], ["お", "ぉ"], ["や", "ゃ"], ["ゆ", "ゅ"], ["よ", "ょ"], ["わ", "を"]],
    [["た", "た"], ["て", "て"], ["い", "ぃ"], ["す", "す"], ["か", "か"], ["ん", "ん"], ["な", "な"], ["に", "に"], ["ら", "ら"], ["せ", "せ"]],
    [["ち", "ち"], ["と", "と"], ["し", "し"], ["は", "は"], ["き", "き"], ["く", "く"], ["ま", "ま"], ["の", "の"], ["り", "り"]],
    [["つ", "っ"], ["さ", "さ"], ["そ", "そ"], ["ひ", "ひ"], ["こ", "こ"], ["み", "み"], ["も", "も"]],
  ],
));

// ---------------------------------------------------------------- Khmer NiDA --------------------
LAYOUTS.push(layout(
  {
    languageId: "km", layoutId: "khmer-nida", layoutName: "Khmer (NiDA)",
    languageName: "Khmer", nativeName: "ភាសាខ្មែរ", localeTag: "km", script: "Khmr",
    direction: "ltr", hasCase: false,
    inputProcessing: { mode: "direct", combining: true, composition: false,
      notes: "Khmer uses subscripts (coeng) and stacking handled by the OS renderer. The app emits exact code points; it does not re-order or validate cluster sequences." },
    provenance: { reference: "https://www.branah.com/khmer", verification: "unverified",
      notes: "Replaces the mislabelled bundled layout (the old qwerty_khmer.xml actually held Korean jamo). NiDA base + Shift layers partially filled. Pending manual Branah verification." },
  },
  [
    [["១", "!"], ["២", "ៗ"], ["៣", "\""], ["៤", "៛"], ["៥", "%"], ["៦", "៍"], ["៧", "័"], ["៨", "ៈ"], ["៩", "("], ["០", ")"]],
    [["ឆ", "ឈ"], ["ឹ", "ឹ"], ["េ", "ែ"], ["រ", "ឬ"], ["ត", "ទ"], ["យ", "ួ"], ["ុ", "ូ"], ["ិ", "ី"], ["ោ", "ៅ"], ["ផ", "ភ"]],
    [["ា", "ាំ"], ["ស", "ៃ"], ["ដ", "ឌ"], ["ថ", "ធ"], ["ង", "អ"], ["ហ", "ះ"], ["្", "ញ"], ["ក", "គ"], ["ល", "ឡ"]],
    [["ឋ", "ឍ"], ["ខ", "ឃ"], ["ច", "ជ"], ["វ", "េ"], ["ប", "ព"], ["ន", "ណ"], ["ម", "ំ"]],
  ],
));

// ---------------------------------------------------------------- write + summarise -------------
let count = 0;
for (const l of LAYOUTS) {
  const dir = join(ROOT, "languages", l.languageId);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${l.layoutId}.json`);
  writeFileSync(file, JSON.stringify(l, null, 2) + "\n", "utf8");
  count++;
  console.log(`wrote languages/${l.languageId}/${l.layoutId}.json (${l.rows.reduce((a, r) => a + r.keys.length, 0)} keys)`);
}
console.log(`\n${count} layout files written.`);
