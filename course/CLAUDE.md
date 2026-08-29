# Scere Training — Course Content Project

## What this project is

A financial education platform with a free foundational track and three paid vertical tracks (Forex, Crypto, Stocks & ETFs). All four are written and live. Lessons are authored as prose, built into JSON under `data/course/`, and served only through `/api/course`, which checks entitlement — see **How content reaches the app** below.

**Live app:** market-forecast-app-ovoo.vercel.app (auto-deploys from `main`)

---

## Authoritative documents — read these before writing any lesson

1. **`Forex_Course_Style_Guide.md`** — lesson structure, markdown block conventions, content sourcing standard, citation verification protocol, translation workflow. This governs everything, on every track, not only Forex.
2. **The roadmaps** — locked chapter/lesson structure, and where lesson status is recorded as work completes: `Forex_Track_Roadmap.md` (which also holds the planned Advanced Course), `Crypto_Track_Roadmap.md`, `Stocks_Track_Roadmap.md`.
3. **The glossaries** — every locked term. Check before defining any term; never redefine an existing one. `Forex_Course_Glossary.md` holds Foundations, Forex and Crypto terms in EN/FR/PT/SW; the Stocks & ETFs terms live in `Stock_Market_Terms_Glossary.md` (section 11), organised by category rather than in the EN/FR/PT/SW block format.

---

## Non-negotiable standards

These were developed deliberately over the course of the project. Do not relax them.

### Citation verification (Style Guide §2.1)
- **Never cite from memory.** Every author/year/title claim gets a live search before it enters a lesson — including claims that "sound right."
- **Cross-check across ≥2 independent sources** (publisher page, citation aggregator, another paper's reference list).
- **Confirm the paper answers the question it's cited for.** A real paper can still be miscategorised.
- **Surface disagreement rather than smoothing it.** Where studies conflict, say so — contested evidence taught honestly is more valuable than false certainty.
- **Prefer specific, falsifiable findings** (a figure, a p-value, a named condition) over vague qualitative claims.

### Content sourcing (Style Guide §2)
- At least one academic/peer-reviewed source per major topic when a lesson is built from web research — alongside, not instead of, practitioner sources.
- Broker and exchange content is marketing first: useful for mechanics, unreliable for "does this work."
- If a topic genuinely has no academic literature (e.g. "how to place a stop-loss"), don't force a citation. Say so in the handoff instead.

### Verify arithmetic
Any worked numeric example (position sizing, SMA calculations, pip values) must be verified computationally before publishing, not eyeballed.

### Copyright
Books and articles inform curriculum *shape* only. Never reproduce content. Paraphrase and cite.

---

## Lesson format

Each lesson is a standalone `.md` file:

```
# Track — Chapter N, Lesson M: Title
## Learning Objectives          (3–4 bullets)
## [Content sections]           (numbered, with typed blocks)
## What to Look For             (practical checks)
## Practice / Quiz              (2–3 questions with explained answers)
## Key Terms Recap              (table)
*Coming next: ...*              (one-line teaser)
```

**Typed blocks:** `:::definition` (term + definition), `:::example`, `:::warning` (the highest-visibility block — use for genuine cautions and counterintuitive points), `:::practice` (reader exercise).

**File naming:** `NN-M-lesson-slug.en.md` in the relevant track folder.

---

## How content reaches the app

Run these commands from the **repo root**, not from `course/`.

```
course/<track>/NN-M-slug.en.md         markdown master, where one exists
data/course/src/<track>-content.js     authoring bundle - window.SCERE_<TRACK>_CONTENT
       |   node scripts/build-course-data.js
       v
data/course/<track>.json               generated; SVGs inlined into their image blocks
       |   /api/course?fn=index  and  ?fn=lesson&id=<id>
       v
learn.html / track.html / lesson.html  rendered by learn.js
```

- **`data/course/src/*-content.js` is the file you edit.** Lesson bodies no longer ship as public static scripts. `middleware.js` returns 404 for `/data/course/*`, which covers the generated JSON and the authoring bundles alike, and `api/course.js` is the only route to a lesson body: the syllabus (`fn=index`) is public metadata, a body (`fn=lesson`) needs entitlement on a paid track, per the `free` flag the build writes.
- **Re-run `node scripts/build-course-data.js` after any content change, and commit the generated JSON** — that is what deploys. Skip it and the app keeps serving the old lesson.
- **Diagrams are inlined by that build.** The `SCERE_*_SVGS` maps exist only in the authoring bundles, so the browser never fetches an SVG file and a paid diagram cannot leak while its prose is gated. Some maps are themselves generated — `scripts/build-crypto-svgs.js` and `scripts/build-stocks-svgs.js` write `data/course/src/crypto-svgs-ch456.js` and `data/course/src/stocks-svgs.js`. Edit the generator, not the output.
- **`renderFoundationTrack()` / `renderForexTrack()` / `renderCryptoTrack()` in `learn.js` are dead paths.** They are never reached: on `learn.html` the dispatcher returns at `renderCourseIndex()`, and the `window.SCERE_*_CONTENT` globals they read are no longer loaded by any page (the one surviving legacy mount, `#cryptoRoot`, is hidden and empty). The live path is `renderCourseIndex()`, `renderTrackPage()` and `renderSingleLesson()`, all fetching `/api/course`. The root-level `forex-content.js` / `foundation-content.js` / `crypto-content.js` files no longer exist.
- **`course/<track>/` is not complete coverage.** Foundations (10), Forex (26) and Crypto Chapters 1-3 (15) have `.en.md` masters; Crypto Chapters 4-6 and the whole Stocks & ETFs track were authored straight into the bundles and have no markdown. The bundle is what ships either way — just don't read a track's markdown folder as the whole track.

---

## Per-lesson checklist

1. Read the roadmap entry for the lesson.
2. Research — practitioner sources for mechanics, academic sources for evidence claims.
3. Verify every citation per the protocol above.
4. Draft the lesson in the standard format.
5. Create one supporting SVG diagram (light theme for markdown; a dark variant is needed for the app).
6. Check the glossary for existing terms; add only genuinely new ones — Foundations, Forex and Crypto terms go in `Forex_Course_Glossary.md`, Stocks & ETFs terms in `Stock_Market_Terms_Glossary.md`. Run the duplicate check:
   `grep "^### " Forex_Course_Glossary.md | sort | uniq -d`
   (Only `### Broker` and `### Central Bank` are intentional documented duplicates.)
7. Compile the lesson into `data/course/src/<track>-content.js`, then rebuild and commit the served JSON: `node scripts/build-course-data.js` from the repo root. Nothing you write is live until that JSON changes.
8. Update lesson status in the roadmap.
9. Report honestly in the handoff: what was verified and how, what came up empty, and where a claim is weaker than the rest.

---

## Voice and pedagogy

The course's distinguishing feature is **honest skepticism**. It teaches students to check claims rather than accept them. Recurring threads worth maintaining:

- **Risk management over prediction accuracy** — being right often ≠ trading well (Foundations Ch2).
- **Verify the claim** — the Bulkowski pattern-statistics example in Foundations Ch3 is the anchor case study for this.
- **Fat tails** — extreme moves happen far more often than clean models predict (Mandelbrot 1963; the SNB 2015 collapse in Forex Ch1 L7 is the lived example).
- **The textbook rule is a starting instinct, not a law** — e.g. the forward premium puzzle complicating "high rates = strong currency" (Forex Ch2 L3).

Cross-reference earlier lessons explicitly. The course should feel cumulative, not like disconnected articles.

---

## Diagrams

- Light theme for markdown: background `#FDFCF9`, navy `#1F3864`, blue `#2E5395`, green `#1E7A4C`, red `#B23B2E`, amber `#C99A2E`.
- Dark theme for the app: background `#0f172a`, text `#e2e8f0`, blue `#3b82f6`, green `#22c55e`, red `#ef4444`, amber `#eab308`.
- Validate as well-formed XML before shipping.
- Avoid unicode arrows and special characters in SVG text — they've caused rendering failures. Use words or plain ASCII.

---

## Translations

Content is written English-first. Glossary holds locked EN/FR/PT/SW translations. Terms marked ⚠ in Swahili need native-speaker review before publication — do not silently "fix" them.

**The app is now translatable, but the lessons are not translated.** The interface has a full translation layer (`i18n.js`, `i18n/*.json`, a language switcher, French complete) and `api/course.js` serves `data/course/<track>.<lang>.json` when it exists, falling back to English per track when it does not. So a reader who picks French gets a French interface around English lesson text — deliberately, and visibly, rather than around machine-translated lesson text that reads fluent and is unverified.

Translating a track means writing `data/course/<track>.<lang>.json` with the same shape as the English. Do not machine-translate it into place: the standard above applies to lesson prose as much as to glossary terms, and the arithmetic in worked examples has to be re-checked in the target language's number formatting.

---

## Current status

**Foundations track (free) — complete:** 3 chapters, 10 lessons, all built into the app.

**Forex track (paid) — COMPLETE: 6 chapters, 26 lessons, all live in the app.**
- Chapter 1 (Mechanics of a Trade): 7/7 complete
- Chapter 2 (Reading the Forex Market): 6/6 complete
- Chapter 3 (Risk Management for Forex Traders): 3/3 complete
- Chapter 4 (Trading Psychology & Building a Plan): 3/3 complete
- Chapter 5 (Real-World Case Studies): 3/3 complete — SNB 2015, yen carry unwind 2008, sterling flash crash 2016
- Chapter 6 (Building a Professional Trade Process): 4/4 complete — the paid trade-thesis service is mentioned plainly once, at the end of Lesson 4, per the plan

**Crypto track (paid) — COMPLETE: 6 chapters, 24 lessons, all live in the app.**
- Chapter 1 (What a Blockchain Actually Is): 7/7 complete — cryptocurrency & double-spend, blockchain mechanics, PoW vs PoS, wallets & custody, exchanges (CEX/DEX), fees & finality, stablecoins
- Chapter 2 (Reading the Crypto Market): 5/5 complete — market cap & liquidity, cycles & halvings, crypto as a risk asset, on-chain data, sentiment & narratives
- Chapter 3 (Risk Management for Crypto): 3/3 complete — position sizing at crypto volatility, custody & security risk, leverage/perpetuals/liquidation
- Chapter 4 (Psychology, Scams & Building a Plan): 3/3 complete — FOMO and unit bias, recognizing scams, a crypto trading and custody plan
- Chapter 5 (Real-World Case Studies): 3/3 complete — Mt. Gox 2014, Terra/Luna May 2022, FTX November 2022
- Chapter 6 (A Professional Crypto Process): 3/3 complete — the six-pillar thesis adapted, regime mapping, portfolio discipline. The research service is mentioned plainly once, at the end of Lesson 3, per the Forex Ch6 precedent
- Diagrams: Chapters 1-3 hand-authored inside `crypto-content.js`; Chapters 4-6 generated by `scripts/build-crypto-svgs.js` into `data/course/src/crypto-svgs-ch456.js`, which merges into the same `window.SCERE_CRYPTO_SVGS` map (edit the generator, not the output)
- Glossary: 141 crypto terms (96 from Chapters 1-3, 45 added for Chapters 4-6). EN locked; FR/PT/SW pending native review, deliberately not machine-guessed

**Stocks & ETFs track (paid) — COMPLETE: 6 chapters, 25 lessons, all live in the app.**
- Chapter 1 (What You Actually Own): 7/7 — shares, investing vs gambling, order books and settlement, indices, ETFs, dividends and total return, costs
- Chapter 2 (Reading a Company and a Market): 5/5 — the three statements, valuation multiples, the factor evidence, market efficiency, diversification
- Chapter 3 (Risk and Position Sizing for Equities): 4/4 — what risk means, position sizing, dollar-cost averaging, margin and shorting
- Chapter 4 (Behaviour, Costs and a Written Plan): 3/3 — the behaviour gap, fees and taxes over decades, building an equity plan
- Chapter 5 (Real-World Case Studies): 3/3 — dot-com 1995-2002, 2007-2009, GameStop January 2021
- Chapter 6 (A Professional Equity Process): 3/3 — the six-pillar thesis adapted, regime mapping, portfolio discipline
- Three ids are load-bearing and must not be renamed: `investing-vs-gambling`, `expense-ratios`, `dollar-cost-averaging` each have an interactive tool bound to them by id in `learn.js`
- Diagrams: one per lesson, generated by `scripts/build-stocks-svgs.js` into `data/course/src/stocks-svgs.js` (a generated file — edit the generator, not the output). Figures inside the diagrams are computed from the same arithmetic as the lesson text, so the two cannot drift apart.
- Glossary: 81 stocks terms added to `Stock_Market_Terms_Glossary.md`, section 11, grouped by chapter

**All four tracks are now complete: Foundations 10, Forex 26, Crypto 24, Stocks & ETFs 25 — 85 lessons.**

**Not started:** Advanced Forex Course. Lesson-content translations beyond the English master (the *interface* is translated — see Translations above).

**Known outstanding work:**
- Crypto Chapters 4-6 and the Stocks & ETFs track have no markdown masters under `course/` — they exist only as authoring bundles. Back-filling them is optional; what matters is that nobody treats a track's markdown folder as the full track.
- `Stock_Market_Terms_Glossary.md` is organised by category rather than the EN/FR/PT/SW block format the main glossary uses, and that track is not yet scheduled for translation.
- Chapter 6 of the Forex track ties into a business model: students who can't run the professional trade-thesis framework themselves can buy completed theses from the platform. Teach the framework completely and honestly; mention the service plainly once, at the end of Lesson 4 only.

---

# When You Need Me to Run Code or Commands

If you need me to manually run any code, command, script, query, or terminal instruction, you must tell me exactly:

1. What I need to run — provide the complete, copy-pasteable command or code.
2. Where I need to run it — explicitly state the application/environment, for example:
   * Terminal / Command Prompt / PowerShell
   * VS Code integrated terminal
   * Browser console
   * Database console / SQL editor
   * Project root directory
   * A specific folder
   * A specific server or machine
3. What directory I should be in before running the command, if relevant.
4. Any prerequisites — for example, activate a virtual environment, start Docker, log in, set environment variables, or install dependencies.
5. What I should expect to happen after running it.
6. What output or result I should send back to you, if you need the result to continue.

Never tell me only to "run this," "execute this," or "try this" without explaining exactly where and how to run it.
Use this format:
Run this
Where: VS Code → Integrated Terminal
Directory: `/path/to/project`
Prerequisites: Activate the virtual environment first

```bash
exact-command-here

```

Expected result: Describe what should happen.
Send me: The complete output, or the relevant error message.
If there are multiple commands, number them and explain whether they must be run in a specific order.
Assume I may not know which terminal, folder, application, environment, or machine to use. Be explicit rather than relying on assumptions.
