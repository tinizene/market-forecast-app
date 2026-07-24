# Handover Prompt — Scere Markets Course Project

> **How to use this:** paste everything below the line into your first Claude Code session in the project directory. It orients Claude Code to the project, the standards, and the immediate next task. After the first session you won't need it again — `CLAUDE.md` gets read automatically every session.

---

I'm continuing work on a financial education course that was previously developed in a separate Claude conversation. You have no memory of that work, so this message brings you up to speed. Please read `CLAUDE.md` at the project root first — it's the authoritative reference and everything below assumes it.

## What this project is

**Scere Markets** — a financial education platform. A free foundational track ("The Foundation of Money and Trade") builds universal financial literacy, then paid vertical tracks go deep on Forex, Crypto, and Stocks. Content is written as markdown lessons, then compiled into JS content files for the web app (live at market-forecast-app-ovoo.vercel.app, auto-deploying from `main`).

## What already exists

- **Foundations track: complete.** 3 chapters, 10 lessons, all drafted *and* built into the live app.
- **Forex track: in progress.** Chapter 1 (7/7 lessons) and Chapter 2 (5/6 lessons) are drafted as markdown. Chapters 3–6 not started.
- **25 SVG diagrams**, one per lesson, light theme for markdown plus dark variants for the app.
- **Three governing documents**: the Style Guide, the Roadmap, and a ~150-term Glossary in EN/FR/PT/SW.

## The three documents that govern everything

1. `Forex_Course_Style_Guide.md` — lesson structure, markdown block conventions, the content sourcing standard (§2), and the citation verification protocol (§2.1). This overrides your defaults.
2. `Forex_Track_Roadmap.md` — the locked chapter/lesson plan. Update lesson status as you complete work.
3. `Forex_Course_Glossary.md` — locked terminology. Always check before defining a term; never redefine one that exists.

## What makes this course different — please preserve it

The course's whole identity is **honest skepticism**. It teaches students to verify claims rather than accept them, and it holds itself to that same standard. Concretely, that means:

- **Every citation gets verified live** — never from memory, never from a plausible-sounding recollection. Cross-check each one against at least two independent sources, and confirm the paper actually answers the question you're citing it for.
- **Surface disagreement instead of smoothing it.** Where two credible studies conflict, the lesson says so. Contested evidence taught honestly is more useful to a student than false certainty. (Example already in the course: two academic studies reach opposite conclusions about whether Bitcoin is a safe haven — the lesson teaches the disagreement itself.)
- **Broker and exchange content is marketing first.** Fine for mechanics, unreliable for "does this actually work." Academic sources carry the evidence claims.
- **The textbook rule is a starting instinct, not a law.** Several lessons deliberately complicate the standard story with real evidence — e.g. the forward premium puzzle undermining the simple "higher rates = stronger currency" rule.
- **Verify arithmetic computationally.** Every worked numeric example (position sizing, moving averages, pip values) gets checked in code before it ships, not eyeballed.

Four threads recur throughout and should keep recurring, with explicit cross-references to earlier lessons so the course feels cumulative:
1. Risk management matters more than prediction accuracy
2. Verify the claim before trusting it
3. Fat tails — extreme moves happen far more often than clean models predict
4. Textbook rules are instincts, not guarantees

## Immediate next task

**Forex Track, Chapter 2, Lesson 6: "Price Action — Trading From the Chart Alone."** This closes out Chapter 2.

It should cover the practitioner school that argues you can read a market from raw price alone, without indicators — and, in keeping with the course's standards, give an honest account of what the evidence does and doesn't support for that claim. Note that Chapter 2 Lesson 1 already establishes a directly relevant idea: indicators are computed *only* from price, so they highlight what's already visible rather than adding information. Lesson 6 should build on that rather than repeat it.

Follow the per-lesson checklist in `CLAUDE.md`: research, verify citations, draft in the standard format, create the SVG diagram, update the glossary (running the duplicate check), update the roadmap, and finish with an honest handoff noting what you verified, how, and where anything is weaker than the rest.

## Known outstanding work, beyond that lesson

- **Forex lessons aren't in the app yet.** They exist only as markdown. Foundations was compiled into `scere-integration/foundation-content.js` — use that as the pattern when the time comes.
- **Chapters 3–6 of the Forex track** are planned in the roadmap but unwritten.
- **Translations aren't wired into the app.** The glossary holds locked FR/PT/SW terms; anything marked ⚠ in Swahili needs native-speaker review before publication — please don't silently "correct" those.
- **Chapter 6 has a business dimension**: students who can't run the professional trade-thesis framework themselves can buy completed theses from the platform. Teach the framework completely and honestly — the course is what makes the service credible. Mention the service plainly once, at the end of Lesson 4 only, never as a repeated pitch.

## Two practical gotchas already learned the hard way

- **SVG rendering**: avoid unicode arrows and unusual characters in SVG text elements — they've caused failures. Use plain ASCII or words.
- **Glossary duplicates**: run `grep "^### " Forex_Course_Glossary.md | sort | uniq -d` after every edit. Only `### Broker` and `### Central Bank` are intentional, documented duplicates — anything else is a mistake.

## One thing I'd like you to do differently from a normal session

Please be genuinely honest in your handoffs. If a source was blocked, if a claim rests on weaker evidence than the rest of a lesson, if you couldn't find academic support for something — say so plainly rather than papering over it. That candour is what the previous work was built on, and it's more valuable to me than a confident-sounding summary.

Ready when you are — start with the Style Guide and Roadmap, then Chapter 2 Lesson 6.
