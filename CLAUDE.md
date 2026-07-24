> **Working directory for course content:** the course lives in [`course/`](course/).
> All bare filenames and shell commands below (e.g. `Forex_Course_Glossary.md`,
> the `grep` duplicate check) assume you are working from `course/` — `cd course`
> before running them, or prefix paths with `course/`. This file is a root-level
> copy so Claude Code loads these standards automatically each session; the same
> content also lives at `course/CLAUDE.md`.

---

# Scere Markets — Course Content Project

## What this project is

A financial education platform with a free foundational track and paid vertical tracks (Forex first, then Crypto and Stocks). Content is written as markdown lessons, then compiled into JS content files for the Scere Markets web app.

**Live app:** market-forecast-app-ovoo.vercel.app (auto-deploys from `main`)

---

## Authoritative documents — read these before writing any lesson

1. **`Forex_Course_Style_Guide.md`** — lesson structure, markdown block conventions, content sourcing standard, citation verification protocol, translation workflow. This governs everything.
2. **`Forex_Track_Roadmap.md`** — locked chapter/lesson structure for the Forex track, plus the planned Advanced Course. Update lesson status here as work completes.
3. **`Forex_Course_Glossary.md`** — every locked term in EN/FR/PT/SW. Check before defining any term; never redefine an existing one.

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

## Per-lesson checklist

1. Read the roadmap entry for the lesson.
2. Research — practitioner sources for mechanics, academic sources for evidence claims.
3. Verify every citation per the protocol above.
4. Draft the lesson in the standard format.
5. Create one supporting SVG diagram (light theme for markdown; a dark variant is needed for the app).
6. Check the glossary for existing terms; add only genuinely new ones. Run the duplicate check:
   `grep "^### " Forex_Course_Glossary.md | sort | uniq -d`
   (Only `### Broker` and `### Central Bank` are intentional documented duplicates.)
7. Update lesson status in the roadmap.
8. Report honestly in the handoff: what was verified and how, what came up empty, and where a claim is weaker than the rest.

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

Content is written English-first. Glossary holds locked EN/FR/PT/SW translations. Terms marked ⚠ in Swahili need native-speaker review before publication — do not silently "fix" them. Translations are not yet wired into the app.

---

## Current status

**Foundations track (free) — complete:** 3 chapters, 10 lessons, all built into the app.

**Forex track (paid) — in progress:**
- Chapter 1 (Mechanics of a Trade): 7/7 complete
- Chapter 2 (Reading the Forex Market): 5/6 — Lesson 6 (Price Action) remaining
- Chapters 3–6: not started

**Not started:** Crypto track, Stocks track, Advanced Forex Course.

**Known outstanding work:**
- Forex lessons exist as markdown only — not yet compiled into the app's JS content format (Foundations was; use `scere-integration/foundation-content.js` as the pattern).
- Chapter 6 of the Forex track ties into a business model: students who can't run the professional trade-thesis framework themselves can buy completed theses from the platform. Teach the framework completely and honestly; mention the service plainly once, at the end of Lesson 4 only.
