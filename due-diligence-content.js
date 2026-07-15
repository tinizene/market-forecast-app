// Content for the Due Diligence hub (due-diligence.html) — same content/rendering
// split as learn-content.js/learn.js: this file is prose and structure only, no
// numbers that could go stale. Three columns (Forex, Crypto, Indexes & ETFs), each
// with a three-phase roadmap: Foundations -> Tools & Sources -> Applying It.
//
// Build order (see README "Due Diligence hub" section for the full plan): Forex
// Phases 1-2 are fully written first. Forex Phase 3 will hold field-by-field
// explanations of the daily FX dashboard report ("why we came to this conclusion")
// once that's built. Crypto and Indexes & ETFs currently have their roadmap shape
// (columns + phase titles + planned article titles) filled in but articles marked
// comingSoon: true, so the full plan is visible in the app even before every article
// is written — nothing here is fabricated to look more complete than it is.

window.SCERE_DUE_DILIGENCE = {
  columns: [
    // ---------------- FOREX ----------------
    {
      id: 'forex',
      label: 'Forex',
      icon: '💱',
      tagline: 'What to check before you trust a currency call — including our own.',
      intro: 'Forex due diligence means checking a trade idea’s reasoning and sourcing before you act on it — not predicting the future, which nobody can do reliably. This column builds up from "what does that even mean" to "here’s exactly what I’d check on today’s dashboard before treating any idea as more than a scenario."',
      phases: [
        {
          id: 'foundations',
          title: 'Phase 1: Foundations',
          description: 'The mindset and the warning signs, before any tool or chart.',
          articles: [
            {
              id: 'what-due-diligence-means-forex',
              title: 'What Due Diligence Means in Forex',
              keyIdea: 'Due diligence isn’t predicting where a currency goes next — it’s checking whether the reasoning behind an idea is sound, sourced, and honestly caveated before you give it any weight.',
              body: [
                'In investing, "due diligence" usually means reading a company’s financials before buying its stock. Forex doesn’t have a company to research — a currency pair is a relative bet between two entire economies, each driven by central bank policy, growth data, trade flows, political events, and the positioning of every other trader in the market at once. That scope is exactly why forex due diligence has to mean something different: not "verify the company," but "verify the reasoning."',
                'A sound piece of forex analysis should tell you, explicitly, what would prove it wrong. Real institutional analysis states a thesis (e.g. "short USD/JPY because of a hawkish BoJ against a dovish Fed"), gives it a stop level or invalidation point, and revisits it honestly when the market disagrees. Content that never says what would change its mind — that’s just always bullish, or always has an excuse for why the "big move" is still coming — is entertainment, not analysis, no matter how confident it sounds.',
                'This matters more in forex than almost anywhere else in retail finance because of leverage. Forex brokers commonly offer leverage of 50:1, 100:1, even higher — meaning a small, believable-sounding piece of "guaranteed" advice can wipe out far more than the amount you actually put in. The due-diligence habit of asking "what is this actually based on, and what happens if it’s wrong" is not optional caution here — it’s the difference between a bad week and losing more than you deposited.',
                'The rest of this column builds a concrete checklist: which free tools show you the real data behind a currency call (Phase 2), and the specific red flags that separate honest analysis from a scheme built to separate you from your money (the next article in this phase). Later, once it’s built, Phase 3 will walk through our own daily FX dashboard field by field, using this same lens on our own work — the standard has to apply to the content we publish too, not just what you read elsewhere.',
              ],
            },
            {
              id: 'forex-red-flags',
              title: 'Red Flags: Signal Groups, Guaranteed Returns & Broker Scams',
              keyIdea: 'The forex space has a specific, well-documented set of scam patterns. Learning to recognize the pattern matters more than judging any individual claim on its own.',
              body: [
                '"Guaranteed profit," "risk-free," or a specific promised monthly return (a common one: "10% a month, every month") are the single clearest tell in this space. No legitimate market participant — not a bank, not a hedge fund, not a professional trader — can guarantee a return, because currency markets are genuinely unpredictable in the short run. If a signal group, broker, or "mentor" guarantees one anyway, the guarantee itself is the scam, regardless of how the rest of the pitch sounds.',
                'Paid "signal groups" (subscriptions that text or message you buy/sell alerts) are legal and some are run honestly, but the incentive structure is worth understanding: the seller gets paid whether or not the signal works, from your subscription fee, not from your trading profit. A track record you can’t independently verify — screenshots instead of a third-party-audited account statement — is not evidence. Ask specifically: is this a verified, audited track record, or a claim?',
                'Recruitment pressure is a second, distinct red flag from the trading claims themselves: if part of the pitch is earning money by bringing in other people (rather than purely from your own trading), that’s a structure independent of whether forex trading itself has any merit — it’s the same underlying structure as a pyramid scheme, wearing a forex costume.',
                'Broker legitimacy is its own, separate check from any trading signal. Before depositing money with any forex broker: verify it’s licensed by a real regulator in a jurisdiction that matters to you — in the US, the CFTC and NFA (check the NFA’s public BASIC database at nfa.futures.org); in the UK, the FCA; in the EU, a national regulator under ESMA rules; many African markets have their own securities/financial regulator worth checking directly. An unlicensed or offshore-only broker with no verifiable regulator is a withdrawal risk regardless of how good its platform looks.',
                'A last, practical check: can you actually withdraw? Read independent reviews (not testimonials on the broker’s own site) specifically searching for "withdrawal problems" alongside the broker’s name before depositing anything meaningful. This one search catches a disproportionate share of real broker scams.',
              ],
            },
          ],
        },
        {
          id: 'tools',
          title: 'Phase 2: Tools & Sources',
          description: 'Where to actually check the reasoning behind a currency call, for free.',
          articles: [
            {
              id: 'forex-tools-overview',
              title: 'Reading the Tools: Economic Calendars, Central Bank Rates & Positioning Data',
              keyIdea: 'A handful of free, official, or well-established sources cover almost everything a serious forex due-diligence check needs — no paid data terminal required.',
              body: [
                'An economic calendar lists scheduled data releases (inflation prints, jobs reports, GDP) and central bank meeting dates in advance, usually flagged by expected market impact. This is the single most useful due-diligence tool in forex: it lets you check whether a trade idea’s timing makes sense (is there a major release before the stop would be hit?) and whether "the market was surprised" claims are actually true (compare the actual print to the pre-release consensus estimate, which good calendars show alongside the result). Widely used free calendars include ForexFactory’s calendar and Investing.com’s economic calendar — both list the same underlying scheduled data, so cross-checking either is fine.',
                'Central bank policy rates and statements are the single biggest driver of sustained currency moves, because interest-rate differences between two countries change the incentive to hold one currency’s assets over another’s. Every major central bank publishes its own rate decisions, meeting minutes, and press conference transcripts for free on its own website — the Federal Reserve (federalreserve.gov), European Central Bank (ecb.europa.eu), Bank of England (bankofengland.co.uk), Bank of Japan (boj.or.jp), and so on. Reading the actual statement, not just a headline summarizing it, is the clearest way to check whether a "hawkish" or "dovish" characterization in an article is fair — central banks choose their words carefully, and the specific language often matters more than the rate decision itself.',
                'Positioning data — specifically the CFTC’s weekly Commitments of Traders (COT) report, published free at cftc.gov every Friday — shows how many contracts large speculators are net long or short on major currency futures. This is the closest thing retail traders have to a real, verifiable read on "crowding": if a currency is already near record-high speculative long positioning, that’s useful context for how much further buying pressure realistically remains, regardless of how compelling the bullish narrative sounds. It updates weekly and lags the current date by a few days by design — worth knowing so you don’t expect it to reflect this morning’s news.',
                'Currency strength and correlation context — seeing how a currency is performing against several others at once, not just one pair — helps separate "this currency is genuinely strong" from "this one pair moved because of the other currency in it." Our own FX Intelligence Desk and Daily Dashboard (linked from Learn and the main Markets page) build this view directly from that day’s report; treat it the same way you’d treat any other source in this list — useful context, sourced and dated, not a signal to act on without your own check.',
                'A rates/risk backdrop — the broader "risk-on or risk-off" mood — comes from watching a small set of cross-asset indicators together: the VIX (US equity volatility index, a common risk-sentiment gauge, free on most finance sites), major equity index moves, and government bond yields (the US 10-year Treasury yield is the most widely watched). None of these predict a specific currency pair on their own, but a currency move that lines up with the broader risk backdrop is a more coherent story than one that doesn’t.',
              ],
            },
          ],
        },
        {
          id: 'applying',
          title: 'Phase 3: Applying It',
          description: 'Using this lens on real reports — starting with our own daily dashboard, field by field.',
          articles: [],
          comingSoonNote: 'Next up: a field-by-field guide to the daily FX dashboard report — what each section is actually based on, and how to apply everything from Phases 1 and 2 to it.',
        },
      ],
    },
    // ---------------- CRYPTO ----------------
    {
      id: 'crypto',
      label: 'Crypto',
      icon: '🪙',
      tagline: 'No live price data here by design — this column is entirely about how to check before you trust a claim.',
      intro: 'This app doesn’t track any crypto prices or instruments, and that’s a deliberate choice, not a gap to fill later — see the note below. What it can do is cover due diligence: crypto has its own distinct set of tools (whitepapers, on-chain data, tokenomics) and its own distinct, well-documented scam patterns, worth understanding whether or not you ever hold any.',
      phases: [
        {
          id: 'foundations',
          title: 'Phase 1: Foundations',
          description: 'What due diligence means for crypto, and the scam patterns to know first.',
          articles: [],
          comingSoonNote: 'Planned: "What Due Diligence Means in Crypto" (how it differs from forex/stocks — no central bank, no earnings report, no regulator backstop in most jurisdictions) and "Common Crypto Scams & Red Flags" (rug pulls, fake exchanges, "guaranteed staking yield" schemes, SIM-swap/wallet-drain attacks).',
        },
        {
          id: 'tools',
          title: 'Phase 2: Tools & Sources',
          description: 'Reading a project’s own claims against verifiable, public data.',
          articles: [],
          comingSoonNote: 'Planned: "Reading a Whitepaper & Tokenomics" (what a legitimate whitepaper actually contains, supply/vesting schedules, who holds how much) and "On-Chain Data & Block Explorers 101" (using free tools like Etherscan to verify a project’s own claims about its contract, holders, and transaction history yourself).',
        },
        {
          id: 'applying',
          title: 'Phase 3: Applying It',
          description: 'A concrete checklist for vetting a specific coin or project.',
          articles: [],
          comingSoonNote: 'Planned: a step-by-step "Evaluating a Specific Project" checklist that ties Phases 1 and 2 together into one worksheet.',
        },
      ],
    },
    // ---------------- INDEXES & ETFs ----------------
    {
      id: 'indexes-etfs',
      label: 'Indexes & ETFs',
      icon: '📊',
      tagline: 'Builds directly on the ETF and expense-ratio lessons already in Learn.',
      intro: 'You’ve already met indexes and ETFs in the core Learn lessons — what they are, why fees compound, why diversification matters. This column goes one level deeper: how to actually vet a specific fund before buying it, using the same free, public sources every time.',
      phases: [
        {
          id: 'foundations',
          title: 'Phase 1: Foundations',
          description: 'What "due diligence" adds on top of the core ETF lessons.',
          articles: [],
          comingSoonNote: 'Planned: "What Due Diligence Means for Index Funds & ETFs" — building directly on the existing "What Is an ETF?" and "Expense Ratios" lessons, extending into what else is worth checking beyond fees.',
        },
        {
          id: 'tools',
          title: 'Phase 2: Tools & Sources',
          description: 'Reading the documents a fund is legally required to publish.',
          articles: [],
          comingSoonNote: 'Planned: "Reading a Fund Fact Sheet & Prospectus" (what’s in the legally required documents every fund publishes) and "Expense Ratios, Tracking Error & Liquidity" (going beyond the fee number already covered in Learn — how closely a fund actually tracks its index, and how easily it trades).',
        },
        {
          id: 'applying',
          title: 'Phase 3: Applying It',
          description: 'A before-you-buy checklist for any new ETF.',
          articles: [],
          comingSoonNote: 'Planned: a "Checklist: Vetting a New ETF Before You Buy" worksheet, applied to a real example fund from the fee comparison table already in Learn.',
        },
      ],
    },
  ],
};
