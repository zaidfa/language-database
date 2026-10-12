# Uploading the Language Database to GitHub

This guide walks you through publishing the `language-database/` folder as its **own public GitHub
repository** so the Multi-Language Keyboard app can download keyboard layouts from it at runtime.

> The app only ships an English keyboard. Every other language is fetched on demand from this repo.
> Once it is online, you can add or fix languages later **without shipping an app update** — existing
> installs pick up changes automatically.

---

## 0. What must match (read this first)

The app finds this repo using **three values hard-coded in the app**, in
`app/src/main/java/com/android/mobile/khmerkeyboard/remote/RemoteConfig.java`:

| Setting       | Current value in code     | What it must become                     |
|---------------|---------------------------|-----------------------------------------|
| `REPO_OWNER`  | `YOUR_GITHUB_USERNAME`    | **`zaidfa`** (your GitHub username)     |
| `REPO_NAME`   | `language-database`       | the repo name you create → `language-database` |
| `REPO_BRANCH` | `main`                    | the branch you push to → `main`         |

So the plan is: create a repo named **`language-database`** under account **`zaidfa`**, push to the
**`main`** branch, then set `REPO_OWNER = "zaidfa"` in the app.

The resulting manifest URL the app reads will be:

```
https://raw.githubusercontent.com/zaidfa/language-database/main/manifest.json
```

> If you name the repo something else, or push to `master` instead of `main`, you **must** change the
> matching value in `RemoteConfig.java` or the app will not find the layouts.

---

## 1. Confirm all languages are present

This repo must contain **all 11 languages** below. Each has one layout file, and every file is listed
in `manifest.json` with a SHA-256 checksum the app verifies on download.

| # | Language | `languageId` | Script | Direction | Layout file | Layout name |
|---|----------|--------------|--------|-----------|-------------|-------------|
| 1  | Arabic   | `ar` | Arab (RTL) | rtl | `languages/ar/arabic-101.json`        | Arabic (101) |
| 2  | German   | `de` | Latn | ltr | `languages/de/german-qwertz.json`     | German QWERTZ |
| 3  | English  | `en` | Latn | ltr | `languages/en/english-qwerty.json`    | English QWERTY |
| 4  | Spanish  | `es` | Latn | ltr | `languages/es/spanish-qwerty.json`    | Spanish QWERTY |
| 5  | Persian  | `fa` | Arab (RTL) | rtl | `languages/fa/persian-standard.json`  | Persian (Standard) |
| 6  | French   | `fr` | Latn | ltr | `languages/fr/french-azerty.json`     | French AZERTY |
| 7  | Hindi    | `hi` | Deva | ltr | `languages/hi/hindi-inscript.json`    | Hindi (InScript) |
| 8  | Japanese | `ja` | Jpan | ltr | `languages/ja/japanese-hiragana.json` | Japanese Hiragana (JIS kana) |
| 9  | Khmer    | `km` | Khmr | ltr | `languages/km/khmer-nida.json`        | Khmer (NiDA) |
| 10 | Korean   | `ko` | Hang | ltr | `languages/ko/korean-dubeolsik.json`  | Korean (Dubeolsik 2-set) |
| 11 | Russian  | `ru` | Cyrl | ltr | `languages/ru/russian-jcuken.json`    | Russian (ЙЦУКЕН) |

**Verify nothing is missing before you upload.** From inside the `language-database/` folder:

```bash
# Should list exactly the 11 files above
ls languages/*/*.json

# Validates every layout and cross-checks the manifest checksums/sizes.
# If you added/edited any layout, regenerate the manifest FIRST (step 2).
python scripts/validate_layouts.py

# No Python? The Node mirror does validate + manifest in one step:
node tools/ci.mjs
```

A clean run with no errors means the database is complete and internally consistent.

---

## 2. Regenerate the manifest if you changed anything

`manifest.json` is **generated** — never hand-edit checksums. If you added, removed, or edited any
layout file, rebuild it so the sizes/SHA-256 values match, otherwise the app will reject the download:

```bash
python scripts/generate_manifest.py --now   # --now stamps the current lastUpdated time
# or, without Python:
node tools/ci.mjs
```

Then commit the regenerated `manifest.json` together with your layout changes.

---

## 3A. Upload with the GitHub website (no command line)

Easiest if you are not comfortable with git.

1. Go to <https://github.com/new> (sign in as **zaidfa**).
2. **Repository name:** `language-database`
3. **Visibility:** **Public** — the app fetches anonymously over public raw URLs; a private repo will
   return 404 and layouts won't download.
4. Leave "Add a README / .gitignore / license" **unchecked** (this folder already has them).
5. Click **Create repository**.
6. On the empty-repo page, click **uploading an existing file**.
7. Drag in the **contents** of the `language-database` folder — i.e. `manifest.json`, and the
   `languages/`, `schemas/`, `scripts/`, `tools/`, `tests/`, `docs/` folders, plus `README.md` and
   `LICENSE`. Do **not** drag the outer `language-database` folder itself; the files must sit at the
   repo root so the manifest lives at `.../main/manifest.json`.
8. Commit directly to the **`main`** branch and click **Commit changes**.

Then skip to **step 4 (verify)**.

---

## 3B. Upload with git (recommended)

Run these from **inside** the `language-database/` folder. It is currently just a sub-folder of the
app project (and is git-ignored by the app repo), so you initialize it as a brand-new, independent
repository:

```bash
cd "language-database"

# Start a fresh repo on the main branch
git init -b main

# Stage and commit everything in this folder
git add .
git commit -m "Initial language database: 11 languages, manifest + schema + tooling"

# Point at your new GitHub repo (create it first at https://github.com/new, Public, empty)
git remote add origin https://github.com/zaidfa/language-database.git

# Push
git push -u origin main
```

Notes:

- Create the empty repo on GitHub **first** (public, no README/license so history stays clean), then
  run the commands above.
- If `git init -b main` errors on an old git version, use `git init` then `git branch -M main`.
- HTTPS push will prompt for credentials — use a **Personal Access Token** as the password
  (GitHub → Settings → Developer settings → Personal access tokens), not your account password.
- This repo is deliberately **separate** from the app repo (see the app's `.gitignore`, which ignores
  `language-database/`). Keep them as two repositories.

---

## 4. Verify it is live

After the push/upload, open these raw URLs in a browser — both must return JSON (not a 404 page):

```
https://raw.githubusercontent.com/zaidfa/language-database/main/manifest.json
https://raw.githubusercontent.com/zaidfa/language-database/main/languages/en/english-qwerty.json
```

If you get **404**: the repo is private, the branch is not `main`, the files were nested one folder
too deep, or the repo name differs from `language-database`. Fix whichever applies.

Raw URLs are served through a CDN and can take a minute to reflect a brand-new push.

---

## 5. Point the app at the repo

Edit `app/src/main/java/com/android/mobile/khmerkeyboard/remote/RemoteConfig.java`:

```java
public static final String REPO_OWNER  = "zaidfa";              // was "YOUR_GITHUB_USERNAME"
public static final String REPO_NAME   = "language-database";   // keep in sync with the repo name
public static final String REPO_BRANCH = "main";                // keep in sync with the branch
```

Rebuild and install the app, open the **language browser**, and confirm all 11 languages appear and
that picking one downloads and installs its keyboard. No access token is stored in the app — it only
makes anonymous reads of public raw files.

---

## 6. Adding or fixing languages later

1. Add/edit a layout under `languages/<id>/<layout>.json` (see
   [docs/ADDING_A_LANGUAGE.md](docs/ADDING_A_LANGUAGE.md) and `schemas/keyboard-layout.schema.json`).
2. Run `python scripts/generate_manifest.py --now` (or `node tools/ci.mjs`) to refresh the manifest.
3. Run `python scripts/validate_layouts.py` and make sure it passes.
4. Commit and `git push`.

Because the app reads this repo live, published changes reach existing installs on their next
manifest fetch — **no app update or Play Store release required.**

---

## Quick checklist

- [ ] All 11 layout files present (`ls languages/*/*.json`)
- [ ] `python scripts/validate_layouts.py` (or `node tools/ci.mjs`) passes with no errors
- [ ] `manifest.json` regenerated after any layout change
- [ ] New **public** GitHub repo `zaidfa/language-database` created
- [ ] Files pushed to the **`main`** branch at the repo **root** (manifest at `/main/manifest.json`)
- [ ] Both raw URLs in step 4 return JSON
- [ ] `RemoteConfig.java` → `REPO_OWNER = "zaidfa"`, app rebuilt and tested
