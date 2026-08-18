#!/usr/bin/env node
//
// Generates data/course/src/crypto-svgs-ch456.js — one dark-theme diagram per lesson in
// Crypto Chapters 4, 5 and 6. Chapters 1 to 3 have hand-authored diagrams that already
// live in crypto-content.js under window.SCERE_CRYPTO_SVGS; this file merges into that
// same map rather than replacing it, so both sets resolve identically.
//
// Drawing primitives, the palette and the accessibility guard live in
// scripts/lib/svg-kit.js, shared with the stocks generator. Figures inside the diagrams
// are written here alongside the lesson text they illustrate, so the two cannot drift.

const fs = require('fs');
const path = require('path');
const {
  W, C, txt, rect, line, wrap, frame,
  hbars, chain, panels, lineChart, steps,
  assertPalette, validate,
} = require('./lib/svg-kit');

assertPalette();

const OUT = path.join(__dirname, '..', 'data', 'course', 'src', 'crypto-svgs-ch456.js');

const SVGS = {};

// ---------- Chapter 4 ----------

SVGS['crypto-04-1-attention-follows-price'] = frame(
  'New Users Arrive After the Price Rises',
  'Bank for International Settlements Working Paper 1049: retail exchange app use across 95 countries, 2015 to 2022.',
  [
    ...lineChart([
      { label: 'price', points: [10, 14, 22, 46, 78, 62, 40, 30, 26], color: C.blue, textColor: C.blueText },
      { label: '', points: [6, 7, 10, 18, 44, 70, 52, 34, 22], color: C.amber, textColor: C.amberText },
    ], ['', '', '', '', '', '', '', '', ''], { x: 90, y: 100, w: 660, h: 230, yMax: 90, fmtY: () => '' }),
    txt(758, 344, 'new users', { size: 12, bold: true, fill: C.amberText }),
    txt(420, 356, 'time', { anchor: 'middle', size: 12, fill: C.muted }),
    line(430, 100, 430, 330, { stroke: C.grid, dash: '4 4' }),
    txt(438, 118, 'price peaks here', { size: 12, bold: true, fill: C.blueText }),
    line(505, 100, 505, 330, { stroke: C.grid, dash: '4 4' }),
    txt(513, 138, 'arrivals peak here', { size: 12, bold: true, fill: C.amberText }),
    rect(60, 380, 380, 150, { fill: C.bg, stroke: C.red, sw: 2, rx: 8 }),
    txt(250, 406, 'What the study found', { anchor: 'middle', size: 14, bold: true, fill: C.redText }),
    txt(76, 434, 'An estimated 73 to 81% of retail investors had', { size: 12, fill: C.muted }),
    txt(76, 452, 'likely lost money on their initial investment.', { size: 12, fill: C.muted }),
    txt(76, 478, 'About three quarters of new investors downloaded', { size: 12, fill: C.muted }),
    txt(76, 496, 'an app after Bitcoin passed 20,000 dollars.', { size: 12, fill: C.muted }),
    txt(76, 518, 'When prices rose, the largest holders were selling.', { size: 12, bold: true, fill: C.text }),
    rect(460, 380, 380, 150, { fill: C.bg, stroke: C.green, sw: 2, rx: 8 }),
    txt(650, 406, 'Why the lag is structural', { anchor: 'middle', size: 14, bold: true, fill: C.greenText }),
    txt(476, 434, 'Nobody writes an article about an asset that has', { size: 12, fill: C.muted }),
    txt(476, 452, 'done nothing. Coverage, group chats and adverts', { size: 12, fill: C.muted }),
    txt(476, 470, 'are all downstream of a rise that has happened.', { size: 12, fill: C.muted }),
    txt(476, 496, 'So the ordinary experience of hearing about', { size: 12, bold: true, fill: C.text }),
    txt(476, 514, 'crypto is the experience of hearing about it late.', { size: 12, bold: true, fill: C.text }),
  ],
);

SVGS['crypto-04-2-scam-markers'] = frame(
  'Six Structures, and the Markers That Catch Them',
  'Almost everything you will meet is one of these. Each has a marker you can check rather than a feeling you have to trust.',
  [
    ...[
      ['Rug pull', 'Liquidity withdrawn or holdings dumped after promotion. Roughly half of Uniswap listings, per Xia and colleagues 2021.', C.red],
      ['Yield scheme', 'A fixed high return funded by later deposits rather than by any activity.', C.red],
      ['Pig butchering', 'A relationship built first, a fake platform introduced later.', C.amber],
      ['Withdrawal-fee scam', 'Outside money demanded before a balance is released.', C.amber],
      ['Approval draining', 'A permission signed earlier, used to remove funds later.', C.blue],
      ['Impersonation', 'A known person, project or support channel imitated.', C.blue],
    ].flatMap(([name, note, colour], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 40 + col * 250;
      const y = 86 + row * 110;
      return [
        rect(x, y, 230, 96, { fill: C.bg, stroke: colour, sw: 2, rx: 8 }),
        txt(x + 115, y + 26, name, { anchor: 'middle', size: 14, bold: true, fill: colour }),
        ...wrap(note, 36).map((l, li) => txt(x + 14, y + 48 + li * 14, l, { size: 11, fill: C.muted })),
      ];
    }),
    rect(556, 86, 304, 316, { fill: C.bg, stroke: C.green, sw: 2, rx: 8 }),
    txt(708, 112, 'Markers that work on structures', { anchor: 'middle', size: 14, bold: true, fill: C.greenText }),
    txt(708, 130, 'nobody has invented yet', { anchor: 'middle', size: 14, bold: true, fill: C.greenText }),
    ...['A guaranteed return on a volatile asset', 'An unexplained source of yield', 'Contact you did not initiate', 'Pressure to act before a deadline', 'A referral component in the returns', 'Friction that appears only on withdrawal', 'Any request for a recovery phrase']
      .map((m, i) => txt(572, 162 + i * 30, m, { size: 12, fill: C.text })),
    rect(40, 418, 820, 112, { fill: C.bg, stroke: C.amber, sw: 2, rx: 8 }),
    txt(450, 444, 'Not on that list, because all of it is cheap to fabricate', { anchor: 'middle', size: 13, bold: true, fill: C.amberText }),
    txt(450, 470, 'How professional the website looks. Whether there is a whitepaper. Whether well-known names appear as advisers.', { anchor: 'middle', size: 12, fill: C.muted }),
    txt(450, 490, 'Whether an audit exists, which reviews code at a point in time and does not establish that the design is safe.', { anchor: 'middle', size: 12, fill: C.muted }),
    txt(450, 514, 'And whether other people you know are already in, which is how these schemes grow rather than evidence they are sound.', { anchor: 'middle', size: 12, bold: true, fill: C.text }),
  ],
);

SVGS['crypto-04-3-custody-plan'] = frame(
  'Seven Sections of a Crypto Plan',
  'Four that any trading plan needs, and three that only an asset you can hold yourself requires.',
  [
    ...steps([
      { title: 'Allocation', note: 'How much of total wealth is in this asset class at all, decided before looking at any token.', color: C.blue },
      { title: 'Position sizing', note: 'The Chapter 3 Lesson 1 formula at crypto volatility, written as a number rather than a principle.', color: C.blue },
      { title: 'Leverage', note: 'For most readers a single word: none. Otherwise a maximum and the liquidation price, in advance.', color: C.blue },
      { title: 'Entry and exit conditions', note: 'What has to be true to buy, and what has to be true to sell. Chapter 6 fills this properly.', color: C.blue },
      { title: 'Custody map', note: 'How much stays on an exchange, and the amount above which holdings move to self-custody.', color: C.amber },
      { title: 'Recovery plan', note: 'Where the phrase is, how many copies exist, and what happens to them in a fire or a flood.', color: C.amber },
      { title: 'Succession', note: 'Who else knows this exists, and what happens to it if you do not.', color: C.amber },
    ], { y: 82, rowH: 58 }),
    line(60, 508, 840, 508, { stroke: C.grid }),
    txt(450, 534, 'The last three exist because self-custody moves the failure mode from a counterparty to you.', { anchor: 'middle', size: 13, bold: true, fill: C.amberText }),
  ],
);

// ---------- Chapter 5 ----------

SVGS['crypto-05-1-mt-gox-timeline'] = frame(
  'Mt. Gox: Three Weeks of Collapse, Three Years of Loss',
  'The theft ran undetected from 2011. What ended in February 2014 was the belief that the balance described anything real.',
  [
    line(340, 150, 850, 150, { stroke: C.grid, sw: 2 }),
    rect(66, 118, 268, 62, { fill: C.red, rx: 6 }),
    txt(200, 144, '2011 to 2013: theft running,', { anchor: 'middle', size: 13, bold: true, fill: C.bg }),
    txt(200, 162, 'undetected the whole time', { anchor: 'middle', size: 13, bold: true, fill: C.bg }),
    ...[
      ['7 Feb 2014', 'withdrawals halted', 430],
      ['28 Feb 2014', 'Tokyo filing: 850,000 BTC lost, 750,000 of it customers', 555],
      ['9 Mar 2014', 'United States filing', 675],
      ['20 Mar 2014', 'about 200,000 BTC found in a wallet last used before June 2011', 790],
    ].flatMap(([d, note, x], i) => [
      `  <circle cx="${x}" cy="150" r="6" fill="${C.amber}"/>`,
      txt(x, 122 - (i % 2) * 0, d, { anchor: 'middle', size: 12, bold: true, fill: C.amberText }),
      ...wrap(note, 22).map((l, li) => txt(x, 178 + (i % 2) * 46 + li * 15, l, { anchor: 'middle', size: 11, fill: C.muted })),
    ]),
    rect(60, 290, 380, 150, { fill: C.bg, stroke: C.red, sw: 2, rx: 8 }),
    txt(250, 316, 'The exchange did not know what it held', { anchor: 'middle', size: 14, bold: true, fill: C.redText }),
    txt(76, 344, 'An exchange holding hundreds of thousands of', { size: 12, fill: C.muted }),
    txt(76, 362, 'customer bitcoin found 200,000 of them in a wallet', { size: 12, fill: C.muted }),
    txt(76, 380, 'nobody had checked in three years.', { size: 12, fill: C.muted }),
    txt(76, 406, 'That is not a sophisticated attack. It is the absence', { size: 12, bold: true, fill: C.text }),
    txt(76, 424, 'of the most basic control in custody.', { size: 12, bold: true, fill: C.text }),
    rect(460, 290, 380, 150, { fill: C.bg, stroke: C.green, sw: 2, rx: 8 }),
    txt(650, 316, 'The defence that needed no foresight', { anchor: 'middle', size: 14, bold: true, fill: C.greenText }),
    txt(476, 344, 'A user with 20 BTC who kept 2 on the exchange', { size: 12, fill: C.muted }),
    txt(476, 362, 'and 18 in self-custody lost 10% and kept 90%.', { size: 12, fill: C.muted }),
    txt(476, 388, 'A user with all 20 on the exchange lost everything.', { size: 12, fill: C.muted }),
    txt(476, 414, 'Neither knew anything the other did not. One had', { size: 12, bold: true, fill: C.text }),
    txt(476, 432, 'a custody rule and the other had a habit.', { size: 12, bold: true, fill: C.text }),
    txt(450, 474, 'The malleability explanation the exchange offered was checked against the public ledger and did not survive.', { anchor: 'middle', size: 13, bold: true, fill: C.amberText }),
    txt(450, 498, 'Decker and Wattenhofer, 2014: attacks existed but were nowhere near large enough to account for 750,000 coins.', { anchor: 'middle', size: 12, fill: C.muted }),
    txt(450, 522, 'Repayments to creditors began in July 2024, slightly over ten years later.', { anchor: 'middle', size: 12, fill: C.muted }),
  ],
);

SVGS['crypto-05-2-terra-spiral'] = frame(
  'Terra and Luna: A Mechanism Executing Correctly, All the Way Down',
  'UST fell below one dollar on 7 May 2022. By 13 May, LUNA had gone from about 87 dollars to below 0.00005.',
  [
    ...[
      ['UST trades below one dollar', 130, 96, C.amber],
      ['Holders redeem it for newly minted LUNA', 340, 96, C.amber],
      ['That LUNA is sold', 550, 96, C.red],
      ['The LUNA price falls', 730, 96, C.red],
    ].flatMap(([label, x, y, colour]) => [
      rect(x - 90, y, 180, 76, { fill: C.bg, stroke: colour, sw: 2, rx: 8 }),
      ...wrap(label, 22).map((l, li) => txt(x, y + 30 + li * 16, l, { anchor: 'middle', size: 12, bold: true, fill: colour })),
    ]),
    txt(235, 138, 'so', { anchor: 'middle', size: 11, fill: C.muted }),
    txt(445, 138, 'and', { anchor: 'middle', size: 11, fill: C.muted }),
    txt(640, 138, 'so', { anchor: 'middle', size: 11, fill: C.muted }),
    line(730, 172, 730, 200, { stroke: C.red, sw: 2 }),
    line(130, 200, 730, 200, { stroke: C.red, sw: 2 }),
    line(130, 172, 130, 200, { stroke: C.red, sw: 2 }),
    txt(430, 220, 'so each further redemption needs more LUNA minted, and the loop tightens', { anchor: 'middle', size: 13, bold: true, fill: C.redText }),
    rect(60, 244, 380, 150, { fill: C.bg, stroke: C.amber, sw: 2, rx: 8 }),
    txt(250, 270, 'Where the 20% yield came from', { anchor: 'middle', size: 14, bold: true, fill: C.amberText }),
    txt(76, 298, 'Anchor paid roughly 20% a year on UST deposits,', { size: 12, fill: C.muted }),
    txt(76, 316, 'and close to 75% of all UST sat in it.', { size: 12, fill: C.muted }),
    txt(76, 342, 'On about 14 billion dollars that is roughly 2.8', { size: 12, fill: C.muted }),
    txt(76, 360, 'billion a year, paid out of a reserve.', { size: 12, fill: C.muted }),
    txt(76, 384, 'A rate paid from capital, not from an activity.', { size: 12, bold: true, fill: C.text }),
    rect(460, 244, 380, 150, { fill: C.bg, stroke: C.red, sw: 2, rx: 8 }),
    txt(650, 270, 'The defence, and what it cost everyone else', { anchor: 'middle', size: 14, bold: true, fill: C.redText }),
    txt(476, 298, 'A reserve of about 80,394 bitcoin was deployed', { size: 12, fill: C.muted }),
    txt(476, 316, 'between roughly 8 and 12 May. By 16 May about', { size: 12, fill: C.muted }),
    txt(476, 334, '313 remained. The peg was not restored.', { size: 12, fill: C.muted }),
    txt(476, 360, 'The selling pushed Bitcoin from around 39,000', { size: 12, bold: true, fill: C.text }),
    txt(476, 378, 'to around 28,000 that week. That is contagion.', { size: 12, bold: true, fill: C.text }),
    line(60, 416, 840, 416, { stroke: C.grid }),
    txt(450, 444, 'The mechanism was not defeated by a bug or an attack. Every redemption did exactly what the documentation said.', { anchor: 'middle', size: 13, bold: true, fill: C.text }),
    txt(450, 470, 'UST needed LUNA to be valuable; LUNA was valuable because it underpinned UST. Neither was anchored outside the pair.', { anchor: 'middle', size: 12, fill: C.muted }),
    txt(450, 496, 'LUNA fell about 99.99994%. Returning to 87 dollars from there would require a rise of roughly 1,740,000 times.', { anchor: 'middle', size: 12, fill: C.muted }),
    txt(450, 522, 'A system can be functioning perfectly and be catastrophic. Those are not contradictory statements.', { anchor: 'middle', size: 12, bold: true, fill: C.amberText }),
  ],
);

SVGS['crypto-05-3-ftx-run'] = frame(
  'FTX: Nine Days From a Published Balance Sheet to Bankruptcy',
  'The venue widely regarded as the responsible one. Every credibility signal pointed the right way.',
  [
    line(70, 140, 830, 140, { stroke: C.grid, sw: 2 }),
    ...[
      ['2 Nov', 'CoinDesk publishes the Alameda balance sheet', 110],
      ['6 Nov', 'Binance announces it will sell its FTT', 280],
      ['8 to 9 Nov', 'Binance offers to buy FTX, then withdraws', 480],
      ['11 Nov', 'Chapter 11 filing', 700],
    ].flatMap(([d, note, x], i) => [
      `  <circle cx="${x}" cy="140" r="6" fill="${i === 3 ? C.red : C.amber}"/>`,
      txt(x, 116, d, { anchor: 'middle', size: 13, bold: true, fill: i === 3 ? C.redText : C.amberText }),
      ...wrap(note, 24).map((l, li) => txt(x, 168 + li * 15, l, { anchor: 'middle', size: 11, fill: C.muted })),
    ]),
    txt(420, 224, 'roughly 5 billion dollars of withdrawal requests arrived within about 72 hours', { anchor: 'middle', size: 13, bold: true, fill: C.text }),
    ...hbars([
      { label: 'liabilities', value: 9000, color: C.red, note: 'about 9 billion', noteFill: C.redText },
      { label: 'assets that could readily be sold', value: 900, color: C.green, note: 'about 900 million', noteFill: C.greenText },
    ], { x: 330, y: 256, w: 380, barH: 34, gap: 18, max: 9000 }),
    txt(450, 356, 'A shortfall of roughly 8 billion dollars', { anchor: 'middle', size: 14, bold: true, fill: C.amberText }),
    rect(60, 370, 380, 152, { fill: C.bg, stroke: C.red, sw: 2, rx: 8 }),
    txt(250, 396, 'Why judging the counterparty failed', { anchor: 'middle', size: 14, bold: true, fill: C.redText }),
    txt(76, 424, 'Prominent venture backing. Testimony before', { size: 12, fill: C.muted }),
    txt(76, 442, 'legislators. Advertising at major sporting events.', { size: 12, fill: C.muted }),
    txt(76, 460, 'Withdrawals worked normally until they did not.', { size: 12, fill: C.muted }),
    txt(76, 484, 'Sophisticated institutions reached the same', { size: 12, bold: true, fill: C.text }),
    rect(460, 370, 380, 152, { fill: C.bg, stroke: C.green, sw: 2, rx: 8 }),
    txt(650, 396, 'What actually worked', { anchor: 'middle', size: 14, bold: true, fill: C.greenText }),
    txt(476, 424, 'Assets in self-custody were not less affected.', { size: 12, fill: C.muted }),
    txt(476, 442, 'They were unaffected. The exchange failing had', { size: 12, fill: C.muted }),
    txt(476, 460, 'no mechanism by which to reach them.', { size: 12, fill: C.muted }),
    txt(476, 484, 'A user with 5,000 there and 45,000 in their own', { size: 12, bold: true, fill: C.text }),
    txt(76, 502, 'wrong conclusion.', { size: 12, bold: true, fill: C.text }),
    txt(476, 502, 'wallet lost 10% and predicted nothing.', { size: 12, bold: true, fill: C.text }),
    txt(450, 546, 'Convicted on seven counts in November 2023; sentenced to 25 years in March 2024. That is justice, not restitution.', { anchor: 'middle', size: 12, fill: C.muted }),
  ],
  { height: 560 },
);

// ---------- Chapter 6 ----------

SVGS['crypto-06-1-six-pillars'] = frame(
  'The Six Pillars, Adapted for an Asset With No Cash Flows',
  'Four transfer, one is replaced by supply arithmetic, and one only resembles carry.',
  [
    ...[
      ['Fundamentals', 'On-chain activity, with the Chapter 2 Lesson 4 limits. An address is not a person.', 'adapted', C.amber],
      ['Valuation', 'Does not transfer. No cash flows means no calculation to compare a price against.', 'replaced', C.red],
      ['Catalyst', 'Transfers well. But a date everyone can read has had as long as everyone to be priced.', 'transfers', C.green],
      ['Positioning', 'Stronger here than anywhere. Funding rates state directly when leverage is crowded.', 'transfers', C.green],
      ['Momentum', 'One of the three factors in Liu, Tsyvinski and Wu 2022. Decays in weeks, not months.', 'transfers', C.green],
      ['Carry', 'Staking often pays in the falling token, funded by issuance that dilutes you.', 'qualified', C.amber],
    ].flatMap(([name, note, verdict, colour], i) => {
      const y = 90 + i * 62;
      return [
        rect(40, y, 820, 54, { fill: C.bg, stroke: colour, sw: 2, rx: 8 }),
        txt(58, y + 24, name, { size: 14, bold: true, fill: colour }),
        txt(58, y + 44, note, { size: 12, fill: C.muted }),
        txt(842, y + 32, verdict, { anchor: 'end', size: 13, bold: true, fill: colour }),
      ];
    }),
    line(60, 474, 840, 474, { stroke: C.grid }),
    txt(450, 500, 'Replacing valuation: total supply, the unlock schedule, and the market capitalisation a price target implies.', { anchor: 'middle', size: 13, bold: true, fill: C.text }),
    txt(450, 526, 'Independence is the whole point. A price that has risen produces momentum, sentiment, funding and activity at once — one fact, four times.', { anchor: 'middle', size: 12, fill: C.muted }),
  ],
);

SVGS['crypto-06-2-transmission-chain'] = frame(
  'Crypto Sits at the Far End of the Transmission Chain',
  'Much of what looks like crypto news is a decision taken in a bond market weeks earlier, arriving amplified.',
  [
    ...chain([
      { label: 'Interest rates', color: C.amber, note: 'the policy change' },
      { label: 'Currencies and bonds', color: C.amber, note: 'yields move first' },
      { label: 'Credit', color: C.blue, note: 'spreads widen' },
      { label: 'Equities', color: C.blue, note: 'long duration falls hardest' },
      { label: 'Crypto', color: C.red, note: 'no cash flows at all' },
    ], { y: 96, boxH: 84, gapW: 40 }),
    txt(450, 234, 'Crypto has the longest duration of anything on this chain, so it receives the same change last and largest.', { anchor: 'middle', size: 13, bold: true, fill: C.text }),
    ...panels([
      {
        title: 'Trending, risk-on',
        color: C.green,
        lines: ['*Momentum has power.', 'Valuation-style arguments have almost none, because nothing is being valued.', '', '*Funding climbs and leverage accumulates.'],
      },
      {
        title: 'Stressed',
        color: C.red,
        lines: ['*Positioning and leverage data have power.', 'Narrative has none — narrative is what is being liquidated.', '', '*Correlations converge and diversification stops working.'],
      },
      {
        title: 'Ranging',
        color: C.muted,
        titleFill: C.muted,
        lines: ['*Nothing much has power.', 'A 24-hour market manufactures the appearance of opportunity continuously.', '', '*The useful conclusion is to do very little.'],
      },
    ], { y: 256, h: 190 }),
    txt(450, 484, 'This is not market timing. It tells you which evidence has power in conditions that already exist.', { anchor: 'middle', size: 13, bold: true, fill: C.amberText }),
    txt(450, 510, 'Regimes deteriorate faster than they improve, and here leverage unwinds mechanically rather than by decision.', { anchor: 'middle', size: 12, fill: C.muted }),
    txt(450, 534, 'Applied to a long-term contribution schedule it becomes market timing under a more respectable name.', { anchor: 'middle', size: 12, fill: C.muted }),
  ],
);

SVGS['crypto-06-3-small-slice'] = frame(
  'Why the Allocation Is the Decision That Matters',
  'A 5% slice, a fourfold rise, and an 80% fall that is ordinary for this asset class rather than catastrophic.',
  [
    ...hbars([
      { label: 'start: crypto is 5% of the portfolio', value: 5, color: C.green, note: 'portfolio 100', noteFill: C.greenText },
      { label: 'after crypto rises fourfold', value: 17.4, color: C.amber, note: 'now 17.4% — nobody chose that', noteFill: C.amberText },
      { label: 'then an 80% fall, unrebalanced', value: 4, color: C.red, note: 'portfolio 99 — essentially the whole gain returned', noteFill: C.redText },
      { label: 'rebalanced to 5% at the peak instead', value: 5, color: C.green, note: 'about 14 moved permanently into the rest', noteFill: C.greenText },
    ], { x: 300, y: 90, w: 330, barH: 30, gap: 16, max: 18 }),
    line(60, 288, 840, 288, { stroke: C.grid }),
    ...panels([
      {
        title: 'Rebalancing',
        color: C.blue,
        lines: ['*Not a forecast.', 'It makes no claim that the asset sold will now underperform.', '', '*It holds risk where you decided it should be.'],
      },
      {
        title: 'Custody hygiene',
        color: C.amber,
        lines: ['*Practices decay.', 'Approvals accumulate. Balances creep above the cap. Devices are replaced.', '', '*An annual hour: revoke, check, access, verify, and tell one person.'],
      },
      {
        title: 'Process review',
        color: C.green,
        lines: ['*Judge the decision, not the result.', 'Annual moves here are measured in multiples.', '', '*A reckless position can return several hundred percent and teach you nothing.'],
      },
    ], { y: 300, h: 190 }),
    txt(450, 522, 'Diversification within crypto does not survive the falls, and crypto did not diversify a portfolio when it was needed.', { anchor: 'middle', size: 13, bold: true, fill: C.amberText }),
  ],
);

// ---------- write ----------

validate(SVGS);

const header = `// GENERATED FILE — do not edit by hand.
// Run: node scripts/build-crypto-svgs.js
//
// Diagrams for Crypto Chapters 4, 5 and 6. Chapters 1 to 3 have hand-authored diagrams
// already defined in crypto-content.js, so this file merges into the same map rather
// than replacing it — load order is enforced by scripts/build-course-data.js, which
// loads crypto-content.js before this file.

window.SCERE_CRYPTO_SVGS = Object.assign(window.SCERE_CRYPTO_SVGS || {}, {
`;

const body = Object.entries(SVGS)
  .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
  .join('\n');

fs.writeFileSync(OUT, header + body + '\n});\n');
console.log(`Wrote ${Object.keys(SVGS).length} diagrams to data/course/src/crypto-svgs-ch456.js (${Math.round(fs.statSync(OUT).size / 1024)} KB)`);
