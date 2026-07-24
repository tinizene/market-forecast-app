# Forex Course — Style & Accessibility Guide

*Living reference document. Every chapter, in every language, follows these rules. Update this file as we learn what works.*

---

## 0. Content Architecture (Tracks)

The course is no longer one linear book — it's one free track, **"The Foundation of Money and Trade,"** plus separate **paid tracks** per finance vertical. (Internally, the folder/slug stays `foundations` — short and URL-friendly — while "The Foundation of Money and Trade" is the display name shown to users.)

```
The Foundation of Money and Trade (free, shared by every user) — folder: /foundations/
  └─ Chapter 1: The History of Money  ← built and translated so far
  └─ Chapter 2: Risk, Inflation & Diversification (planned — universal concepts)
  └─ Chapter 3: Reading Markets & Making Decisions (planned — universal concepts)

Forex (paid track) — folder: /forex/
  └─ Chapter 1: Currency Pairs & Quotes, onward — pips, leverage, technical/fundamental analysis

Crypto (paid track) — folder: /crypto/
  └─ Chapter 1: onward — blockchains, wallets, exchanges, volatility

Stocks / ETFs / Indexes (paid track) — folder: /stocks/
  └─ Chapter 1: onward — shares, index funds, ETFs, long-term investing
```

**Rule of thumb for what belongs in the free track vs. a paid track:** if the concept is true regardless of which asset someone eventually trades (what money is, what risk means, how to read a market), it's in "The Foundation of Money and Trade." If it only matters once someone has picked a specific vertical (a pip, a blockchain gas fee, a P/E ratio), it belongs in that paid track. The free track runs three chapters total before the paywall — Chapter 1 (done), plus two more covering universal risk/investing basics.

**Display name vs. UI chrome:** "The Foundation of Money and Trade" is the official track name — use it in full on track-selection screens, course listings, and marketing copy. In space-constrained UI chrome (breadcrumbs, mobile headers, tab labels), abbreviate to **"Money & Trade"** (and its locked FR/PT/SW equivalents in the glossary) rather than truncating the full name mid-word.

**Folder structure:**
```
/foundations/     01-1-what-is-money.en.md, 01-2-..., etc.
/forex/           01-1-currency-pairs-and-quotes.en.md, etc.
/crypto/          01-1-....en.md, etc.
/stocks/          01-1-....en.md, etc.
/images/          shared across all tracks, referenced via ../images/... from any track folder
```

Each track has its own Chapter/Lesson numbering starting at 1 — "Forex Chapter 1" and "Crypto Chapter 1" are different files and don't share a number sequence with Foundations.

---

## 1. Markdown Conventions for the LMS

Since content is imported as markdown, we use **semantic block markers** so your frontend can apply consistent color-coding and styling without us hardcoding fonts/colors into the text itself.

### Admonition blocks

```
:::definition
**Pip** — The smallest standard price move in a currency pair, usually the fourth decimal place.
:::

:::example
If EUR/USD moves from 1.0850 to 1.0855, that's a 5-pip move.
:::

:::warning
Never risk more than 1–2% of your account on a single trade.
:::

:::practice
Look up today's EUR/USD price. How many pips would a move from the bid to the ask price be?
:::
```

Suggested mapping for your frontend's CSS (adjust to your brand):

| Block | Suggested color | Purpose |
|---|---|---|
| `:::definition` | Blue | New term, first use |
| `:::example` | Green | Worked example |
| `:::warning` | Amber/Red | Risk or common mistake |
| `:::practice` | Purple | Exercise/quiz prompt |

### Heading structure (every chapter)

```
# Chapter N: Title
## Learning Objectives
## [Core content sections as needed]
## What to Look For
## Practice / Quiz
## Key Terms Recap
```

Consistent structure across chapters and languages means your app can auto-generate navigation, and translators always know what's coming next.

---

## 2. Content Sourcing Standard

Whenever a lesson is built from web research (rather than purely from your own transcripts/notes), the source mix should include **at least one academic or peer-reviewed source per major topic**, not just broker/industry blog content — alongside, not instead of, the practitioner sources.

**Why this matters:** industry content (broker academies, exchange blogs) is usually clear and well-written, but it's marketing material first — it rarely surfaces genuine disagreement or nuance, because a broker's blog isn't going to tell you the "textbook" relationship it just explained often doesn't hold. Academic sources do the opposite: they show their methodology, report contested findings, and are far more willing to say "the evidence here is mixed." That's exactly the muscle this course is trying to build in students — the Chapter 2, Lesson 4 diversifier/hedge/safe-haven distinction, and the two-studies-disagree-about-Bitcoin example, only exist because we went looking for a journal article and a thesis instead of stopping at broker blogs.

**How to apply this:**
1. When gathering sources for a new lesson, run at least one search specifically aimed at academic material — e.g., add terms like "study," "journal," "working paper," "thesis," or search site-restricted to `.edu`, university repositories, or known journal publishers — in addition to general searches.
2. It's fine if a topic genuinely has no accessible academic source (some are too practitioner-specific, e.g., "how to set a stop-loss") — don't force one in. Use judgment on whether the topic has real academic literature to draw on.
3. When an academic source reveals contested or mixed findings, prefer surfacing that tension over smoothing it into a single tidy claim — contested evidence, presented honestly, is more valuable to a student than false certainty.
4. As always, paraphrase heavily and cite sources by describing them (publication, year, general finding) rather than quoting — the copyright rules in this guide apply identically to academic PDFs as to any other source.
5. Note in your handoff to the user which academic source(s) were used and which topics, if any, came up empty on academic search — transparency on sourcing gaps matters as much as the sourcing itself.

### 2.1 Citation Verification Protocol

This protocol exists because of a direct comparison: Grok was asked for academic sources on candlestick-pattern research, produced a plausible-looking list (author, year, title, journal), and most of it turned out to be real — but it was presented with no links, no independent verification, and at least one meaningful oversimplification of what the papers actually found. "Mostly right, unverified, and quietly flattened" is not good enough for content students will trust. The fix is a specific verification habit, not just "try harder":

1. **Never include a citation from memory alone.** Every author/year/title claim — whether it originated from Claude, from another AI tool, or from a source that itself cites it secondhand — gets an actual search before it goes in a lesson. "This citation sounds plausible" is not verification.
2. **Cross-check each paper across at least two independent sources** (e.g., the publisher's page, a citation aggregator like RePEc/IDEAS or Google Scholar, and/or another paper's reference list that cites it) to confirm the exact journal, volume, year, and page numbers agree across all of them.
3. **Get an actual accessible link** — a working paper PDF, a DOI, a publisher abstract page — not just an author-year-title combination with nowhere to click through.
4. **Confirm the paper answers the question it's being cited for.** A paper can be entirely real and still get miscategorized — e.g., a paper using candlesticks as a statistical *tool* to detect news events is not the same as a paper testing whether candlestick *trading signals* are profitable. Read enough of the abstract to confirm the actual research question before citing it as evidence for a specific claim.
5. **Distrust smoothed-over generalizations, including your own first draft.** If a summary claim sounds tidy ("bearish patterns are less reliable than bullish ones"), check it against what at least two primary sources actually found. Tidy claims are often two conflicting findings quietly averaged together — the disagreement itself is usually more useful to a student than the smoothed version.
6. **Follow citation trails.** The sharpest, most teachable finding in the candlestick research — that the *same* DJIA data produced opposite profitability conclusions depending purely on which exit-strategy rule was applied — wasn't in the first paper found. It turned up while verifying a *different* paper's reference list. Reading a little past the paper you're confirming, into what it cites and what cites it, regularly surfaces better material than the original search did.
7. **Prefer specific, falsifiable findings over vague qualitative ones** — an accuracy rate, a p-value, a named pattern under a named condition — over "some patterns work sometimes." Specific findings are both easier to independently verify and more useful for teaching students what to actually look for.

---

## 3. Writing Rules (apply to the English master first)

- **One idea per sentence.** No stacked clauses.
- **Short paragraphs** — 3–4 sentences max.
- **Active voice** ("the central bank raises rates," not "rates are raised by the central bank").
- **No idioms or culture-bound phrases** — nothing that only makes sense in one culture ("hit the ground running," "ballpark figure").
- **Bold only on first use of a key term** — not for general emphasis. Overusing bold defeats its purpose for dyslexic readers.
- **No italics or ALL CAPS for emphasis** — both are harder to decode for dyslexic readers and read strangely by TTS engines.
- **Numbers:** write the numeral, and spell out ambiguous ones in context where TTS matters ("2%" is fine standing alone, but "the 2 pairs" should be "the two pairs" since TTS may mispronounce it next to a currency symbol).
- **Every example should be realistic and concrete** — a real (or realistic) price move, a real scenario a beginner in the target markets would recognize.

## 4. Accessibility Notes for the Frontend Team

(Pass these to whoever builds the LMS display layer — not something we control in markdown, but worth documenting here so nothing gets lost.)

- Sans-serif font, 12–14pt minimum, user-adjustable size
- Left-aligned, never justified
- Line spacing 1.5x, generous paragraph spacing
- Off-white/cream background option, not pure white
- Text-to-speech toggle on every chapter (this is why we keep sentences short and plain)
- High-contrast mode option

## 5. Translation Workflow

1. **English master is finalized first** for a chapter — locked before translation starts.
2. **Glossary terms are locked** (see `Forex_Course_Glossary.md`) — the same term always translates the same way across every chapter.
3. Claude drafts each translation directly from the finalized English master, preserving the block structure (`:::definition`, etc.) exactly, and using the locked glossary terms.
4. **Flag for local review:** any place where a term has no natural equivalent (common in Swahili and some financial vocabulary) gets a translator's note in the file — we don't silently guess.
5. File naming: `NN-M-lesson-slug.[lang].md` inside the relevant track folder — `NN` is the chapter, `M` is the lesson within it — e.g. `/foundations/01-1-what-is-money.en.md`, `/forex/01-1-currency-pairs-and-quotes.en.md`. Lessons are kept short (4–6 sub-sections each). Each lesson is self-contained: its own Learning Objectives, its own "What to Look For," its own Practice/Quiz, and its own Key Terms Recap covering only the terms *that lesson* introduced (not a cumulative list — the cumulative list lives in the glossary file, not repeated in every lesson).

## 6. Language Rollout Order

1. English (master)
2. French
3. Portuguese
4. Swahili
5. *(Future: Arabic, Igbo, others based on demand)*

Note on Swahili: everyday financial Swahili in East Africa often borrows English terms directly for technical trading vocabulary (e.g., "leverage," "spread" are frequently used as-is in spoken/financial Swahili). Where that's the norm, we'll keep the English term rather than force an awkward translation, and note it in the glossary.
