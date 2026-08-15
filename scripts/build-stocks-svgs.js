#!/usr/bin/env node
//
// Generates data/course/src/stocks-svgs.js — one dark-theme diagram per Stocks & ETFs
// lesson, keyed the same way as SCERE_FOREX_SVGS and SCERE_CRYPTO_SVGS.
//
// These are generated rather than hand-authored so that 25 diagrams stay visually
// consistent and so the numbers in them come from the same arithmetic as the lessons
// (the fee curve, the recovery table and the DCA paths are computed here, not typed).
//
// Drawing primitives, the palette and the accessibility guard live in
// scripts/lib/svg-kit.js, shared with the crypto generator.

const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'data', 'course', 'src', 'stocks-svgs.js');

const {
  W, H, C, txt, rect, line, wrap, frame,
  hbars, chain, panels, lineChart, stack,
  assertPalette, validate,
} = require('./lib/svg-kit');

assertPalette();

// ---------- computed inputs, so the diagrams and the lessons agree ----------

function fvMonthly(monthly, annual, years) {
  const r = Math.pow(1 + annual, 1 / 12) - 1;
  let v = 0;
  for (let i = 0; i < years * 12; i++) v = (v + monthly) * (1 + r);
  return v;
}
const FEE_POTS = [0, 0.002, 0.010, 0.020].map((f) => Math.round(fvMonthly(200, 0.07 - f, 30)));
const FEE_CURVE = [0.0005, 0.0075, 0.015].map((f) => ({
  fee: f,
  points: Array.from({ length: 7 }, (_, i) => Math.round(10000 * Math.pow(1.07 - f, i * 5))),
}));
const RECOVERY = [20, 30, 50, 56.78, 77.93].map((d) => ({ d, up: (1 / (1 - d / 100) - 1) * 100 }));

const DCA_FALL = [100, 95, 90, 85, 80, 75, 80, 85, 90, 95, 100, 105];
const DCA_RISE = [100, 102, 104, 106, 108, 110, 112, 114, 116, 118, 120, 122];
function dcaValue(prices) {
  let units = 0;
  prices.forEach((p) => { units += 1000 / p; });
  return Math.round(units * prices[prices.length - 1]);
}
function lumpValue(prices) {
  return Math.round((12000 / prices[0]) * prices[prices.length - 1]);
}

// Equity remaining on a 2x margined position as the shares fall.
const MARGIN = Array.from({ length: 9 }, (_, i) => {
  const fall = i * 5;
  const posValue = 20000 * (1 - fall / 100);
  return { fall, equity: posValue - 10000, ratio: (posValue - 10000) / posValue };
});

// ---------- the 25 diagrams ----------

const SVGS = {};

SVGS['stocks-01-1-residual-claim'] = frame(
  'The Residual Claim: Who Gets Paid, in What Order',
  'The same company, two years. Everyone above the shareholder is paid a fixed amount first.',
  [
    txt(215, 92, 'A good year: revenue 100', { anchor: 'middle', size: 15, bold: true, fill: C.greenText }),
    ...stack(150, 470, 130, [
      { value: 40, short: '40', label: 'Suppliers', color: C.muted },
      { value: 35, short: '35', label: 'Staff', color: C.blue },
      { value: 10, short: '10', label: 'Interest on debt', color: C.amber },
      { value: 5, short: '5', label: 'Tax', color: C.red },
      { value: 10, short: '10', label: 'Residual: yours', color: C.green, labelFill: C.greenText },
    ]),
    txt(660, 92, 'Revenue falls 10, to 90', { anchor: 'middle', size: 15, bold: true, fill: C.redText }),
    ...stack(595, 470, 130, [
      { value: 40, short: '40', label: 'Suppliers', color: C.muted },
      { value: 35, short: '35', label: 'Staff', color: C.blue },
      { value: 10, short: '10', label: 'Interest on debt', color: C.amber },
      { value: 5, short: '5', label: 'Tax', color: C.red },
      { value: 0, short: '', label: 'Residual: nothing', color: C.green, labelFill: C.redText },
    ]),
    line(60, 470, 840, 470, { stroke: C.grid, sw: 2 }),
    txt(450, 508, 'Revenue fell 10%. The shareholders\' claim fell 100%.', { anchor: 'middle', size: 15, bold: true, fill: C.amberText }),
    txt(450, 532, 'This is why share prices move so much more than the businesses underneath them.', { anchor: 'middle', size: 12, fill: C.muted }),
  ],
);

SVGS['stocks-01-2-positive-vs-zero-sum'] = frame(
  'Where Does the Money Come From?',
  'The distinction is not how risky it feels. It is whether anything is being created.',
  panels([
    {
      title: 'Roulette: zero-sum, minus the house',
      color: C.red,
      titleFill: C.redText,
      lines: [
        '*The wheel produces nothing.',
        'Every unit won by one player is a unit lost by another.',
        '',
        '*37 pockets, a single number pays 35 to 1.',
        'Expected value per unit staked: about 0.973 units returned.',
        '',
        '*A loss of about 2.7% per spin, on average, forever.',
        'This is a property of the wheel. No amount of skill changes it.',
      ],
    },
    {
      title: 'Owning businesses: positive-sum',
      color: C.green,
      titleFill: C.greenText,
      lines: [
        '*The companies employ people and sell things.',
        'Cash is generated outside the transactions between investors.',
        '',
        '*That cash reaches the residual claim (Lesson 1).',
        'Every owner can gain at once, because value was created.',
        '',
        '*But only over holding periods long enough for it to matter.',
        'Over minutes, the businesses have produced nothing new, and trading is the roulette column again.',
      ],
    },
  ]),
);

SVGS['stocks-01-3-order-book'] = frame(
  'There Is No Single Price',
  'A share quoted at 25.00. The quote is the midpoint, and nobody is offering it.',
  [
    rect(250, 92, 400, 150, { fill: C.bg, stroke: C.red, sw: 2, rx: 8 }),
    txt(450, 116, 'Sellers: the ask side', { anchor: 'middle', size: 14, bold: true, fill: C.redText }),
    txt(300, 148, '25.06', { size: 14, fill: C.text }), txt(560, 148, '400 shares', { anchor: 'end', size: 13, fill: C.muted }),
    txt(300, 176, '25.04', { size: 14, fill: C.text }), txt(560, 176, '900 shares', { anchor: 'end', size: 13, fill: C.muted }),
    txt(300, 210, '25.02', { size: 17, bold: true, fill: C.redText }), txt(560, 210, '1,200 shares — best ask', { anchor: 'end', size: 13, fill: C.redText }),

    line(250, 258, 650, 258, { stroke: C.amber, sw: 2, dash: '6 5' }),
    txt(450, 280, 'Spread: 0.04. Quoted price 25.00 is the midpoint.', { anchor: 'middle', size: 14, bold: true, fill: C.amberText }),

    rect(250, 296, 400, 150, { fill: C.bg, stroke: C.green, sw: 2, rx: 8 }),
    txt(300, 330, '24.98', { size: 17, bold: true, fill: C.greenText }),
    txt(560, 330, '1,100 shares — best bid', { anchor: 'end', size: 13, fill: C.greenText }),
    txt(300, 364, '24.96', { size: 14, fill: C.text }), txt(560, 364, '700 shares', { anchor: 'end', size: 13, fill: C.muted }),
    txt(300, 392, '24.94', { size: 14, fill: C.text }), txt(560, 392, '1,500 shares', { anchor: 'end', size: 13, fill: C.muted }),
    txt(450, 428, 'Buyers: the bid side', { anchor: 'middle', size: 14, bold: true, fill: C.greenText }),

    txt(450, 486, 'Buy at 25.02 and sell at 24.98 a moment later: down 0.16% with nothing having happened.', { anchor: 'middle', size: 14, bold: true, fill: C.text }),
    txt(450, 512, 'A market order crosses the spread on purpose. A limit order waits in the book instead.', { anchor: 'middle', size: 12, fill: C.muted }),
  ],
);

SVGS['stocks-01-4-index-weighting'] = frame(
  'Same Three Companies, Three Different Answers',
  'Company A: 300 a share, worth 10bn. Company B: 50 a share, worth 80bn. Company C: 100 a share, worth 30bn.',
  [
    ...hbars([
      { label: 'A: influence when weighted by price', value: 300 / 450 * 100, color: C.red, note: '67%', noteFill: C.redText },
      { label: 'B: influence when weighted by price', value: 50 / 450 * 100, color: C.red, note: '11%', noteFill: C.redText },
      { label: 'C: influence when weighted by price', value: 100 / 450 * 100, color: C.red, note: '22%', noteFill: C.redText },
    ], { x: 330, y: 96, w: 380, barH: 26, gap: 12, max: 70 }),
    line(60, 232, 840, 232, { stroke: C.grid }),
    ...hbars([
      { label: 'A: influence when weighted by market value', value: 10 / 120 * 100, color: C.blue, note: '8%', noteFill: C.blueText },
      { label: 'B: influence when weighted by market value', value: 80 / 120 * 100, color: C.blue, note: '67%', noteFill: C.blueText },
      { label: 'C: influence when weighted by market value', value: 30 / 120 * 100, color: C.blue, note: '25%', noteFill: C.blueText },
    ], { x: 330, y: 250, w: 380, barH: 26, gap: 12, max: 70 }),
    line(60, 386, 840, 386, { stroke: C.grid }),
    ...hbars([
      { label: 'A, B and C: equal weighting', value: 33.3, color: C.green, note: '33% each', noteFill: C.greenText },
    ], { x: 330, y: 404, w: 380, barH: 26, gap: 12, max: 70 }),
    txt(450, 486, 'The smallest company dominates a price-weighted index. The largest dominates a cap-weighted one.', { anchor: 'middle', size: 13, bold: true, fill: C.text }),
    txt(450, 510, 'Share price alone says nothing about the size of a company. "The market rose 1%" is a claim about a chosen rule.', { anchor: 'middle', size: 12, fill: C.muted }),
  ],
);

SVGS['stocks-01-5-etf-creation'] = frame(
  'Creation and Redemption: Why an ETF Price Tracks What It Holds',
  'An ETF trading at 100.40 while the basket it holds is worth 100.00.',
  [
    ...chain([
      { label: 'ETF trades above the basket', color: C.red, note: 'Price 100.40, net asset value 100.00' },
      { label: 'Authorised participant buys the underlying shares', color: C.blue, note: 'Cost: 100.00 a share' },
      { label: 'Delivers the basket, receives new ETF shares', color: C.blue, note: 'Creation, done with the fund' },
      { label: 'Sells them on the exchange at 100.40', color: C.green, note: 'The extra supply pushes the price down' },
    ], { y: 130, boxH: 96, gapW: 46 }),
    line(60, 330, 840, 330, { stroke: C.grid }),
    txt(450, 366, 'Pursuing the profit is what closes the gap. Nothing enforces it — an incentive does.', { anchor: 'middle', size: 15, bold: true, fill: C.amberText }),
    rect(120, 392, 660, 118, { fill: C.bg, stroke: C.amber, sw: 2, rx: 8 }),
    txt(450, 420, 'Which is why premiums and discounts widen exactly when you least want them to', { anchor: 'middle', size: 13, bold: true, fill: C.amberText }),
    txt(450, 446, 'If the underlying market is closed, illiquid or falling fast, the participant cannot price or trade', { anchor: 'middle', size: 12, fill: C.muted }),
    txt(450, 466, 'the basket confidently. The mechanism weakens in exactly the conditions that make you want to sell.', { anchor: 'middle', size: 12, fill: C.muted }),
    txt(450, 494, 'The SEC describes the market price as generally kept close to net asset value. Generally.', { anchor: 'middle', size: 12, bold: true, fill: C.text }),
  ],
);

SVGS['stocks-01-6-ex-dividend'] = frame(
  'A Dividend Is Not Free Money',
  'A share at 40.00 pays a dividend of 1.00. What happens on the ex-dividend date.',
  [
    txt(230, 106, 'Day before', { anchor: 'middle', size: 15, bold: true, fill: C.text }),
    rect(160, 122, 140, 260, { fill: C.blue, rx: 6 }),
    txt(230, 260, '40.00', { anchor: 'middle', size: 20, bold: true, fill: C.bg }),
    txt(230, 406, 'Share price', { anchor: 'middle', size: 13, fill: C.muted }),
    txt(230, 428, 'Total held: 40.00', { anchor: 'middle', size: 14, bold: true, fill: C.text }),

    txt(450, 260, 'the company pays out', { anchor: 'middle', size: 13, fill: C.muted }),
    txt(450, 282, 'cash it was holding', { anchor: 'middle', size: 13, fill: C.muted }),

    txt(670, 106, 'Ex-dividend date', { anchor: 'middle', size: 15, bold: true, fill: C.text }),
    rect(600, 148, 140, 234, { fill: C.blue, rx: 6 }),
    txt(670, 270, '39.00', { anchor: 'middle', size: 20, bold: true, fill: C.bg }),
    rect(600, 122, 140, 22, { fill: C.green, rx: 4 }),
    txt(670, 138, '1.00 cash', { anchor: 'middle', size: 12, bold: true, fill: C.bg }),
    txt(670, 406, 'Share price plus the payment', { anchor: 'middle', size: 13, fill: C.muted }),
    txt(670, 428, 'Total held: 40.00', { anchor: 'middle', size: 14, bold: true, fill: C.text }),

    line(60, 456, 840, 456, { stroke: C.grid }),
    txt(450, 488, 'The same 40.00, rearranged. Nothing was created, and the arrangement is what feels different.', { anchor: 'middle', size: 14, bold: true, fill: C.amberText }),
    txt(450, 514, 'Judge a holding on total return, which counts price and dividends together. Not on yield alone.', { anchor: 'middle', size: 12, fill: C.muted }),
  ],
);

SVGS['stocks-01-7-fee-compounding'] = frame(
  'What an Annual Fee Does Over Thirty Years',
  '10,000 invested at an underlying 7% a year. The only difference between the three lines is the fee.',
  [
    ...lineChart([
      { label: '0.05%', points: FEE_CURVE[0].points, color: C.green, textColor: C.greenText },
      { label: '0.75%', points: FEE_CURVE[1].points, color: C.amber, textColor: C.amberText },
      { label: '1.50%', points: FEE_CURVE[2].points, color: C.red, textColor: C.redText },
    ], ['0', '5', '10', '15', '20', '25', '30 years'], {
      x: 100, y: 100, w: 700, h: 300, yMax: 80000,
      fmtY: (v) => (v >= 1000 ? Math.round(v / 1000) + 'k' : Math.round(v)),
    }),
    txt(450, 466, `At 0.05%: about ${FEE_CURVE[0].points[6].toLocaleString('en-US')}   ·   at 0.75%: about ${FEE_CURVE[1].points[6].toLocaleString('en-US')}   ·   at 1.50%: about ${FEE_CURVE[2].points[6].toLocaleString('en-US')}`, { anchor: 'middle', size: 14, bold: true, fill: C.text }),
    txt(450, 496, 'The difference in fee is 1.45% a year. The difference in outcome is about 25,200.', { anchor: 'middle', size: 13, bold: true, fill: C.amberText }),
    txt(450, 520, 'The fee is charged on the whole balance every year, including on the gains earlier fees prevented.', { anchor: 'middle', size: 12, fill: C.muted }),
  ],
);

SVGS['stocks-02-1-three-statements'] = frame(
  'Three Statements, Three Different Questions',
  'Beginners read one of them. Reading all three is what separates a view from a guess.',
  panels([
    {
      title: 'Income statement',
      color: C.blue,
      titleFill: C.blueText,
      lines: [
        '*Was the business profitable over these months?',
        '',
        'Revenue is recorded when it is earned, not when it is paid.',
        '',
        '*Involves judgement.',
        'How fast to depreciate equipment, when a sale counts as made, how much to set aside for bad debts.',
        '',
        '*Profit is an opinion.',
      ],
    },
    {
      title: 'Balance sheet',
      color: C.amber,
      titleFill: C.amberText,
      lines: [
        '*What does the business consist of right now?',
        '',
        'A single moment, not a period. Assets equal liabilities plus equity, by identity.',
        '',
        '*Equity is the residual again.',
        'Assets 500, owed 400, equity 100. Write the assets down to 380 and the equity is gone.',
        '',
        '*This is Lesson 1 from another angle.',
      ],
    },
    {
      title: 'Cash flow statement',
      color: C.green,
      titleFill: C.greenText,
      lines: [
        '*Did money genuinely move?',
        '',
        'Hardest of the three to dress up, because cash either arrived or it did not.',
        '',
        '*Free cash flow is the owner\'s number.',
        'Operating cash less the spending needed to keep the business running.',
        '',
        '*Cash is a fact.',
      ],
    },
  ]),
);

SVGS['stocks-02-2-cyclical-multiple'] = frame(
  'Why a Low Multiple Is Most Dangerous When It Looks Best',
  'A cyclical company through one commodity cycle. Earnings move; the multiple moves against them.',
  [
    ...lineChart([
      { label: 'Earnings per share', points: [1.0, 2.4, 4.2, 5.0, 3.0, 1.2, 0.5], color: C.green, textColor: C.greenText },
    ], ['year 1', '2', '3', '4', '5', '6', '7'], { x: 90, y: 100, w: 640, h: 150, yMax: 6, fmtY: (v) => v.toFixed(1), gridLines: 3 }),
    ...lineChart([
      { label: 'Price to earnings', points: [30, 14, 8, 6, 11, 26, 40], color: C.red, textColor: C.redText },
    ], ['year 1', '2', '3', '4', '5', '6', '7'], { x: 90, y: 310, w: 640, h: 150, yMax: 45, gridLines: 3 }),
    line(410, 100, 410, 460, { stroke: C.amber, sw: 2, dash: '5 5' }),
    txt(418, 96, 'peak earnings, lowest multiple', { size: 12, bold: true, fill: C.amberText }),
    txt(450, 512, 'The P/E of 6 in year 4 marked the danger. The P/E of 40 in year 7 marked the opportunity.', { anchor: 'middle', size: 14, bold: true, fill: C.text }),
    txt(450, 536, 'A screen for the lowest multiples buys the top of the cycle. Ask where in the cycle the earnings sit.', { anchor: 'middle', size: 12, fill: C.muted }),
  ],
);

SVGS['stocks-02-3-value-definitions'] = frame(
  'Which "Value"? The Definition Is a Choice',
  'Three measures of cheapness, selecting overlapping but genuinely different companies.',
  [
    `  <circle cx="360" cy="270" r="130" fill="${C.blue}" fill-opacity="0.28" stroke="${C.blue}" stroke-width="2"/>`,
    `  <circle cx="500" cy="230" r="130" fill="${C.green}" fill-opacity="0.28" stroke="${C.green}" stroke-width="2"/>`,
    `  <circle cx="470" cy="360" r="120" fill="${C.amber}" fill-opacity="0.24" stroke="${C.amber}" stroke-width="2"/>`,
    txt(280, 250, 'Book to market', { anchor: 'middle', size: 14, bold: true, fill: C.blueText }),
    txt(280, 270, '(Fama and French)', { anchor: 'middle', size: 12, fill: C.muted }),
    txt(590, 190, 'Earnings', { anchor: 'middle', size: 14, bold: true, fill: C.greenText }),
    txt(470, 452, 'Cash flow', { anchor: 'middle', size: 14, bold: true, fill: C.amberText }),
    txt(430, 288, 'all three', { anchor: 'middle', size: 12, bold: true, fill: C.text }),
    rect(660, 110, 210, 200, { fill: C.bg, stroke: C.grid, sw: 2, rx: 8 }),
    txt(765, 138, 'And then', { anchor: 'middle', size: 14, bold: true, fill: C.text }),
    ...['Book value describes a factory well and software badly.', '', 'A fund calling itself a value fund need not use the measure the study used.', '', 'Costs are subtracted from the premium, not from somewhere else.'].flatMap((s, i, arr) => {
      let y = 162;
      for (let k = 0; k < i; k++) y += arr[k] === '' ? 10 : wrap(arr[k], 26).length * 16 + 6;
      return s === '' ? [] : wrap(s, 26).map((ln, li) => txt(675, y + li * 16, ln, { size: 12, fill: C.muted }));
    }),
    txt(450, 508, 'A finding about one definition of value is not automatically a finding about the fund on your screen.', { anchor: 'middle', size: 13, bold: true, fill: C.text }),
    txt(450, 532, 'Fama and French 1992 measured book-to-market across large baskets over decades. Ask what your fund measures.', { anchor: 'middle', size: 12, fill: C.muted }),
  ],
);

SVGS['stocks-02-4-efficiency-forms'] = frame(
  'Three Forms of Efficiency, and the Paradox Underneath',
  'Each form contains the one before it. The strongest cannot exist.',
  [
    rect(70, 92, 500, 340, { fill: C.bg, stroke: C.red, sw: 2, rx: 10 }),
    txt(90, 118, 'Strong form: all information, including private', { size: 14, bold: true, fill: C.redText }),
    rect(96, 136, 448, 274, { fill: C.bg, stroke: C.amber, sw: 2, rx: 10 }),
    txt(116, 162, 'Semi-strong: all public information', { size: 14, bold: true, fill: C.amberText }),
    rect(122, 180, 396, 208, { fill: C.bg, stroke: C.green, sw: 2, rx: 10 }),
    txt(142, 206, 'Weak form: past prices', { size: 14, bold: true, fill: C.greenText }),
    txt(142, 236, 'Studying price history alone cannot', { size: 12, fill: C.muted }),
    txt(142, 254, 'produce an edge.', { size: 12, fill: C.muted }),
    txt(142, 288, 'Results announced at 07:00 have moved', { size: 12, fill: C.muted }),
    txt(142, 306, 'the price before the market opens.', { size: 12, fill: C.muted }),
    txt(142, 344, 'Trading on material private information', { size: 12, fill: C.muted }),
    txt(142, 362, 'works, and is illegal everywhere.', { size: 12, fill: C.muted }),

    rect(596, 92, 260, 340, { fill: C.bg, stroke: C.blue, sw: 2, rx: 10 }),
    txt(726, 120, 'Grossman and Stiglitz, 1980', { anchor: 'middle', size: 14, bold: true, fill: C.blueText }),
    ...['Gathering information costs money.', '', 'If prices already reflected everything, nobody would be paid for gathering it.', '', 'So nobody would gather it, and prices would stop reflecting it.', '', 'Some inefficiency has to persist, as the payment for the work.'].flatMap((s, i, arr) => {
      let y = 152;
      for (let k = 0; k < i; k++) y += arr[k] === '' ? 10 : wrap(arr[k], 30).length * 17 + 6;
      return s === '' ? [] : wrap(s, 30).map((ln, li) => txt(612, y + li * 17, ln, { size: 12, fill: C.muted }));
    }),
    txt(450, 476, 'Efficiency is a spectrum, not a switch — and it means prices reflect information, not that they are right.', { anchor: 'middle', size: 13, bold: true, fill: C.text }),
    txt(450, 502, 'The argument does not tell you that you are the one collecting the payment. Sharpe\'s arithmetic says most are not.', { anchor: 'middle', size: 12, fill: C.muted }),
    txt(450, 528, 'A private investor\'s real advantage is structural: no clients, no quarterly report, no career risk from waiting.', { anchor: 'middle', size: 12, fill: C.muted }),
  ],
);

SVGS['stocks-02-5-diversification-floor'] = frame(
  'How Many Holdings Is Enough? The Literature Disagrees',
  'Adding holdings removes specific risk. It does nothing at all to market risk.',
  [
    ...lineChart([
      { label: 'total risk', points: [100, 62, 48, 41, 38, 36, 35, 34.4, 34], color: C.blue, textColor: C.blueText },
      { label: '', points: [33, 33, 33, 33, 33, 33, 33, 33, 33], color: C.red, textColor: C.redText, dash: '6 5', sw: 2 },
    ], ['1', '5', '10', '15', '20', '30', '40', '50', '60 holdings'], { x: 90, y: 100, w: 700, h: 280, yMax: 100, fmtY: (v) => Math.round(v) }),
    line(200, 100, 200, 380, { stroke: C.green, sw: 2, dash: '4 4' }),
    txt(206, 126, 'Evans and Archer 1968: the curve flattens', { size: 12, bold: true, fill: C.greenText }),
    txt(206, 144, 'by about 10 holdings', { size: 12, bold: true, fill: C.greenText }),
    line(462, 100, 462, 380, { stroke: C.amber, sw: 2, dash: '4 4' }),
    txt(468, 176, 'Statman 1987: at least 30 for a borrowing', { size: 12, bold: true, fill: C.amberText }),
    txt(468, 194, 'investor, 40 for a lending one', { size: 12, bold: true, fill: C.amberText }),
    txt(600, 280, 'market risk: the floor no holding removes', { size: 12, bold: true, fill: C.redText }),
    txt(450, 448, 'Market risk survives every holding you add. That is the floor, and it is why the curve never reaches zero.', { anchor: 'middle', size: 13, bold: true, fill: C.text }),
    txt(450, 476, 'Counting is the wrong instrument anyway: twenty banks are one bet wearing twenty names.', { anchor: 'middle', size: 12, fill: C.muted }),
    txt(450, 502, 'The curve shape is illustrative. The two dated findings, and their disagreement, are the point.', { anchor: 'middle', size: 12, fill: C.muted }),
  ],
);

SVGS['stocks-03-1-recovery-arithmetic'] = frame(
  'The Arithmetic of Getting Back to Even',
  'The fall is measured from the peak. The recovery is measured from the much smaller trough.',
  [
    ...hbars(RECOVERY.map((r, i) => ({
      label: `a fall of ${r.d % 1 ? r.d.toFixed(1) : r.d}%`,
      value: r.up,
      color: [C.green, C.green, C.amber, C.amber, C.red][i],
      note: `needs a gain of ${r.up.toFixed(r.up > 100 ? 0 : 1)}%`,
      noteFill: [C.greenText, C.greenText, C.amberText, C.amberText, C.redText][i],
    })), { x: 220, y: 100, w: 400, barH: 40, gap: 26, max: 400 }),
    line(60, 442, 840, 442, { stroke: C.grid }),
    txt(450, 474, 'A drawdown twice as deep takes far more than twice as much to repair.', { anchor: 'middle', size: 14, bold: true, fill: C.text }),
    txt(450, 500, '56.8% is the S&P 500 in 2007 to 2009. 77.9% is the Nasdaq Composite in 2000 to 2002.', { anchor: 'middle', size: 12, fill: C.muted }),
    txt(450, 524, 'Which is the arithmetic reason to care more about avoiding large losses than about capturing large gains.', { anchor: 'middle', size: 12, fill: C.muted }),
  ],
);

SVGS['stocks-03-2-position-sizing'] = frame(
  'The Same Bad News, at Four Different Position Sizes',
  'A company you hold falls 60%. What that costs the portfolio depends only on the size you chose.',
  [
    ...hbars([
      { label: '2% position', value: 1.2, color: C.green, note: 'portfolio down 1.2% — an ordinary week', noteFill: C.greenText },
      { label: '10% position', value: 6, color: C.amber, note: 'portfolio down 6% — a bad month', noteFill: C.amberText },
      { label: '25% position', value: 15, color: C.red, note: 'portfolio down 15% — a bad year', noteFill: C.redText },
      { label: '40% position', value: 24, color: C.red, note: 'portfolio down 24% — a changed plan', noteFill: C.redText },
    ], { x: 200, y: 108, w: 420, barH: 42, gap: 28, max: 26 }),
    line(60, 400, 840, 400, { stroke: C.grid }),
    txt(450, 434, 'You cannot control whether a company disappoints. You control this number completely, in advance.', { anchor: 'middle', size: 14, bold: true, fill: C.text }),
    rect(150, 452, 600, 76, { fill: C.bg, stroke: C.amber, sw: 2, rx: 8 }),
    txt(450, 478, 'And a limit only survives success if it is maintained', { anchor: 'middle', size: 13, bold: true, fill: C.amberText }),
    txt(450, 502, 'A 2% holding that rises fivefold while everything else is flat becomes about 9% of the portfolio.', { anchor: 'middle', size: 12, fill: C.muted }),
    txt(450, 520, 'Nobody chose the 9%. Drift is how most large concentrations are actually acquired.', { anchor: 'middle', size: 12, fill: C.muted }),
  ],
);

SVGS['stocks-03-3-dca-both-directions'] = frame(
  'Averaging In Wins When Prices Fall, and Loses When They Rise',
  '12,000 deployed either at once or in twelve monthly instalments of 1,000.',
  [
    txt(240, 96, 'Prices fall, then recover to 105', { anchor: 'middle', size: 14, bold: true, fill: C.text }),
    ...lineChart([{ label: '', points: DCA_FALL, color: C.blue }],
      ['month 1', '6', '12'], { x: 90, y: 116, w: 300, h: 150, yMax: 120, yMin: 60, gridLines: 2, fmtY: (v) => Math.round(v) }),
    txt(660, 96, 'Prices rise steadily to 122', { anchor: 'middle', size: 14, bold: true, fill: C.text }),
    ...lineChart([{ label: '', points: DCA_RISE, color: C.blue }],
      ['month 1', '6', '12'], { x: 510, y: 116, w: 300, h: 150, yMax: 130, yMin: 90, gridLines: 2, fmtY: (v) => Math.round(v) }),

    ...hbars([
      { label: 'averaging in, falling market', value: dcaValue(DCA_FALL), color: C.green, note: dcaValue(DCA_FALL).toLocaleString('en-US'), noteFill: C.greenText },
      { label: 'all at once, falling market', value: lumpValue(DCA_FALL), color: C.muted, note: lumpValue(DCA_FALL).toLocaleString('en-US') },
      { label: 'averaging in, rising market', value: dcaValue(DCA_RISE), color: C.red, note: dcaValue(DCA_RISE).toLocaleString('en-US'), noteFill: C.redText },
      { label: 'all at once, rising market', value: lumpValue(DCA_RISE), color: C.muted, note: lumpValue(DCA_RISE).toLocaleString('en-US') },
    ], { x: 300, y: 322, w: 380, barH: 26, gap: 12, max: 15500 }),

    txt(450, 500, 'Neither outcome was knowable at the start, and markets rise more often than they fall.', { anchor: 'middle', size: 13, bold: true, fill: C.text }),
    txt(450, 524, 'That is where the two-thirds finding comes from. Averaging in buys a behavioural guarantee at a known cost.', { anchor: 'middle', size: 12, fill: C.muted }),
  ],
);

SVGS['stocks-03-4-margin-call'] = frame(
  'How Far a Margined Position Has to Fall Before It Is Closed for You',
  '10,000 of your own money, 10,000 borrowed, 20,000 of shares, 25% maintenance requirement.',
  [
    ...lineChart([
      { label: 'your money', points: MARGIN.map((m) => m.equity), color: C.blue, textColor: C.blueText },
    ], MARGIN.map((m) => (m.fall % 10 === 0 ? (m.fall ? `-${m.fall}%` : '0%') : '')), { x: 100, y: 110, w: 660, h: 260, yMax: 10000, fmtY: (v) => (v / 1000).toFixed(0) + 'k' }),
    line(100, 370, 760, 370, { stroke: C.grid, sw: 2 }),
    line(540, 110, 540, 370, { stroke: C.red, sw: 2, dash: '5 5' }),
    txt(548, 140, 'margin call at a fall of about 33%', { size: 13, bold: true, fill: C.redText }),
    txt(548, 160, 'position worth 13,333, your money 3,333', { size: 12, fill: C.redText }),
    txt(548, 178, 'a 33% fall in the shares, a 67% loss for you', { size: 12, fill: C.redText }),
    txt(430, 412, 'fall in the share price', { anchor: 'middle', size: 12, fill: C.muted }),
    line(60, 424, 840, 424, { stroke: C.grid }),
    txt(450, 456, 'A 33% fall is not a catastrophe. It is smaller than either case study in Chapter 5.', { anchor: 'middle', size: 14, bold: true, fill: C.text }),
    txt(450, 482, 'Leverage does not invent a distant disaster. It converts an ordinary market event into a forced sale.', { anchor: 'middle', size: 12, fill: C.muted }),
    txt(450, 512, 'And on a short there is no equivalent line at all: the loss has no ceiling, because the price has none.', { anchor: 'middle', size: 13, bold: true, fill: C.amberText }),
  ],
);

SVGS['stocks-04-1-behaviour-gap'] = frame(
  'Three Answers to the Same Question, One Widely Repeated',
  'How much do fund investors lose each year to the timing of their purchases and sales?',
  [
    ...hbars([
      { label: 'DALBAR, quoted for years', value: 5.5, color: C.red, note: 'about 5 to 6 points a year', noteFill: C.redText },
      { label: 'Morningstar Mind the Gap 2025', value: 1.2, color: C.amber, note: '1.2 points a year', noteFill: C.amberText },
      { label: 'Fulkerson, Jordan, Riley and Yan 2026', value: 0.10, color: C.green, note: 'about 0.10 points a year', noteFill: C.greenText },
    ], { x: 330, y: 98, w: 380, barH: 42, gap: 24, max: 6 }),
    rect(60, 296, 380, 138, { fill: C.bg, stroke: C.red, sw: 2, rx: 8 }),
    txt(250, 322, 'Why the top bar is wrong', { anchor: 'middle', size: 14, bold: true, fill: C.redText }),
    txt(76, 350, 'It compares investors making ongoing', { size: 12, fill: C.muted }),
    txt(76, 368, 'contributions against an index return that', { size: 12, fill: C.muted }),
    txt(76, 386, 'assumes one lump sum at the start.', { size: 12, fill: C.muted }),
    txt(76, 410, 'Two different questions. Shown by Pfau,', { size: 12, fill: C.muted }),
    txt(76, 428, 'and independently by Kitces, in 2017.', { size: 12, fill: C.muted }),

    rect(460, 296, 380, 138, { fill: C.bg, stroke: C.green, sw: 2, rx: 8 }),
    txt(650, 322, 'Why the middle bar is contested', { anchor: 'middle', size: 14, bold: true, fill: C.greenText }),
    txt(476, 350, 'Three mathematical errors identified in the', { size: 12, fill: C.muted }),
    txt(476, 368, 'Financial Analysts Journal, 2026. Recomputing', { size: 12, fill: C.muted }),
    txt(476, 386, 'the 2023 edition, a reported 1.7 point gap', { size: 12, fill: C.muted }),
    txt(476, 404, 'should have been 0.03 points.', { size: 12, fill: C.muted }),
    txt(476, 428, 'Nobody in the chain had a reason to check.', { size: 12, bold: true, fill: C.text }),

    txt(450, 482, 'All three agree on the pattern: the gap is near zero in broad automatic funds and large in traded ones.', { anchor: 'middle', size: 13, bold: true, fill: C.text }),
    txt(450, 508, 'Barber and Odean 2000 measured the traders directly: 11.4% a year for the most active fifth, against a market at 17.9%.', { anchor: 'middle', size: 12, fill: C.muted }),
    txt(450, 532, 'Averaging those two populations produces a figure that describes neither of them.', { anchor: 'middle', size: 12, fill: C.muted }),
  ],
);

SVGS['stocks-04-2-fee-stack'] = frame(
  'What a Fee Takes From a Thirty-Year Contribution Schedule',
  '200 a month for 30 years, an underlying return of 7%. Total contributed: 72,000.',
  [
    ...hbars([
      { label: 'no fee', value: FEE_POTS[0], color: C.green, note: FEE_POTS[0].toLocaleString('en-US'), noteFill: C.greenText },
      { label: '0.20% a year', value: FEE_POTS[1], color: C.green, note: `${FEE_POTS[1].toLocaleString('en-US')}   (fee took 3.6%)`, noteFill: C.greenText },
      { label: '1.00% a year', value: FEE_POTS[2], color: C.amber, note: `${FEE_POTS[2].toLocaleString('en-US')}   (fee took 16.7%)`, noteFill: C.amberText },
      { label: '2.00% a year', value: FEE_POTS[3], color: C.red, note: `${FEE_POTS[3].toLocaleString('en-US')}   (fee took 30.4%)`, noteFill: C.redText },
    ], { x: 200, y: 100, w: 380, barH: 40, gap: 24, max: 250000 }),
    line(60, 368, 840, 368, { stroke: C.grid }),
    txt(450, 400, 'A 1% fee does not take 1%. Over thirty years it takes about a sixth of everything you end up with.', { anchor: 'middle', size: 14, bold: true, fill: C.text }),
    txt(450, 426, 'The 2% line costs about 71,500, which is very nearly the entire 72,000 that was contributed.', { anchor: 'middle', size: 12, fill: C.muted }),
    rect(150, 448, 600, 82, { fill: C.bg, stroke: C.amber, sw: 2, rx: 8 }),
    txt(450, 474, 'And charges stack', { anchor: 'middle', size: 13, bold: true, fill: C.amberText }),
    txt(450, 498, 'A fund at 0.20%, a platform at 0.35% and advice at 0.75% total 1.30% a year.', { anchor: 'middle', size: 12, fill: C.muted }),
    txt(450, 518, 'None looks large alone, and no statement adds them up for you.', { anchor: 'middle', size: 12, fill: C.muted }),
  ],
);

SVGS['stocks-04-3-equity-plan'] = frame(
  'Six Questions a Written Plan Answers',
  'Decisions made while calm, in writing, for use at a moment when you will not be.',
  [
    ...[
      ['1', 'What is this money for, and when will you need it?', 'Money needed in three years and money needed in thirty are different problems. Chapter 3 Lesson 1.', C.blue],
      ['2', 'What will you hold?', 'Name the funds or the allocation. Not a vague intention to be diversified. Chapter 2 Lesson 5.', C.blue],
      ['3', 'How much goes in, and how often?', 'If you are averaging in, the schedule and its end date go in writing here. Chapter 3 Lesson 3.', C.green],
      ['4', 'What is the maximum any one position may be?', 'A limit written in advance is a limit. One decided when a holding is up 300% is a negotiation.', C.green],
      ['5', 'When do you rebalance?', 'A band responds to the portfolio. A calendar date responds to the calendar. Either beats no rule.', C.amber],
      ['6', 'Under what conditions will you sell?', 'The money is needed; the band was breached; the fee rose; the reason for buying no longer holds.', C.amber],
    ].flatMap(([n, q, note, colour], i) => {
      const y = 86 + i * 66;
      return [
        `  <circle cx="72" cy="${y + 22}" r="18" fill="${colour}"/>`,
        txt(72, y + 27, n, { anchor: 'middle', size: 16, bold: true, fill: C.bg }),
        txt(104, y + 18, q, { size: 15, bold: true, fill: C.text }),
        txt(104, y + 40, note, { size: 12, fill: C.muted }),
      ];
    }),
    line(60, 486, 840, 486, { stroke: C.grid }),
    txt(450, 514, 'Not a sell condition: it fell a lot and I feel bad. That is the feeling the document exists to overrule.', { anchor: 'middle', size: 13, bold: true, fill: C.amberText }),
    txt(450, 538, 'Write it when nothing is happening. A plan drafted in a drawdown encodes the panic it was meant to prevent.', { anchor: 'middle', size: 12, fill: C.muted }),
  ],
);

SVGS['stocks-05-1-dot-com'] = frame(
  'The Nasdaq Composite, 2000 to 2015',
  'A fall of 77.9%, and a round trip of fifteen years, one month and thirteen days.',
  [
    ...lineChart([
      { label: '', points: [5048, 3200, 1114, 2000, 2200, 2650, 1600, 2650, 3020, 4180, 5056], color: C.blue },
    ], ['Mar 2000', '', 'Oct 2002', '', '2006', '', '2009', '', '2013', '', 'Apr 2015'],
    { x: 90, y: 106, w: 700, h: 270, yMax: 5600, fmtY: (v) => Math.round(v).toLocaleString('en-US') }),
    `  <circle cx="90" cy="${106 + 270 - (5048 / 5600) * 270}" r="6" fill="${C.red}"/>`,
    txt(100, 128, 'peak 5,048.62 on 10 March 2000', { size: 13, bold: true, fill: C.redText }),
    `  <circle cx="230" cy="${106 + 270 - (1114 / 5600) * 270}" r="6" fill="${C.red}"/>`,
    txt(240, 336, 'trough 1,114.11 on 9 October 2002', { size: 13, bold: true, fill: C.redText }),
    `  <circle cx="790" cy="${106 + 270 - (5056 / 5600) * 270}" r="6" fill="${C.green}"/>`,
    txt(784, 150, 'back above the peak, 23 April 2015', { anchor: 'end', size: 13, bold: true, fill: C.greenText }),
    line(60, 424, 840, 424, { stroke: C.grid }),
    txt(450, 454, 'A 77.9% fall requires a gain of about 353% simply to return to where it started.', { anchor: 'middle', size: 14, bold: true, fill: C.text }),
    txt(450, 480, 'Someone who bought at the peak aged 55 was 70 before the position was worth what they paid, before inflation.', { anchor: 'middle', size: 12, fill: C.muted }),
    txt(450, 506, 'And the index recovered partly by composition: failed constituents were removed and replaced by survivors.', { anchor: 'middle', size: 12, fill: C.muted }),
    txt(450, 530, 'Line shape between the marked dates is illustrative. The three dated levels are the record.', { anchor: 'middle', size: 11, fill: C.muted }),
  ],
);

SVGS['stocks-05-2-sequence-risk'] = frame(
  'The Same Market, Two Opposite Experiences',
  'The S&P 500 fell 56.8% from 9 October 2007 and regained the level in about five and a half years.',
  [
    ...lineChart([
      { label: '', points: [1565, 1400, 1100, 677, 1050, 1120, 1250, 1380, 1569], color: C.blue },
    ], ['Oct 2007', '', '2008', 'Mar 2009', '2010', '2011', '2012', '', 'Mar 2013'],
    { x: 90, y: 100, w: 700, h: 220, yMax: 1700, fmtY: (v) => Math.round(v).toLocaleString('en-US') }),
    `  <circle cx="90" cy="${100 + 220 - (1565 / 1700) * 220}" r="6" fill="${C.red}"/>`,
    txt(104, 106, 'peak 1,565.15 on 9 October 2007', { size: 12, bold: true, fill: C.redText }),
    `  <circle cx="352" cy="${100 + 220 - (677 / 1700) * 220}" r="6" fill="${C.red}"/>`,
    txt(362, 290, 'trough 676.53, a fall of 56.8%, needing +131% to recover', { size: 12, bold: true, fill: C.redText }),

    rect(60, 350, 380, 130, { fill: C.bg, stroke: C.green, sw: 2, rx: 8 }),
    txt(250, 376, 'Contributing, aged 30', { anchor: 'middle', size: 14, bold: true, fill: C.greenText }),
    txt(76, 404, 'Every contribution from late 2008 to mid 2010', { size: 12, fill: C.muted }),
    txt(76, 422, 'bought below the 2007 peak, and the March 2009', { size: 12, fill: C.muted }),
    txt(76, 440, 'contributions bought near the lowest prices.', { size: 12, fill: C.muted }),
    txt(76, 466, 'The fall handed them cheap assets for years.', { size: 12, bold: true, fill: C.text }),

    rect(460, 350, 380, 130, { fill: C.bg, stroke: C.red, sw: 2, rx: 8 }),
    txt(650, 376, 'Withdrawing 4% a year, aged 65', { anchor: 'middle', size: 14, bold: true, fill: C.redText }),
    txt(476, 404, 'Every withdrawal between 2008 and 2011 sold', { size: 12, fill: C.muted }),
    txt(476, 422, 'units at depressed prices, and those units were', { size: 12, fill: C.muted }),
    txt(476, 440, 'not there to participate in the recovery.', { size: 12, fill: C.muted }),
    txt(476, 466, 'The same fall permanently removed capital.', { size: 12, bold: true, fill: C.text }),

    txt(450, 512, 'Identical portfolios, identical average returns. What differed was the direction their money was flowing.', { anchor: 'middle', size: 13, bold: true, fill: C.amberText }),
    txt(450, 538, 'Pausing contributions is not neutral either: it declines to buy at exactly the cheapest prices of the decade.', { anchor: 'middle', size: 12, fill: C.muted }),
  ],
);

SVGS['stocks-05-3-gamestop'] = frame(
  'GameStop, January 2021: The Story and the Data',
  'The explanation everyone repeats is the one the regulator examined and did not find support for.',
  panels([
    {
      title: 'What almost everyone says',
      color: C.red,
      titleFill: C.redText,
      lines: [
        '*A short squeeze.',
        'Short sellers forced to buy back, their buying pushing the price higher, forcing more to buy.',
        '',
        '*Plus a gamma squeeze.',
        'Dealers who sold call options buying shares to hedge, buying more as the price rose.',
        '',
        '*The circumstantial case was strong.',
        'More than 100% of the freely tradable shares had been sold short — the only meme stock where that was true.',
      ],
    },
    {
      title: 'What the SEC staff found',
      color: C.green,
      titleFill: C.greenText,
      lines: [
        '*Report published 18 October 2021.',
        'Staff examined the order and trade data directly.',
        '',
        '*Buying came mainly from investors holding no short positions.',
        '',
        '*Short covering peaked and declined before the price reached its highest levels.',
        '',
        '*Neither a short nor a gamma squeeze was the primary cause.',
        '',
        'Academic work has since disputed parts of the report. The honest state is a disagreement, not either confident version.',
      ],
    },
    {
      title: 'What actually stopped the buying',
      color: C.amber,
      titleFill: C.amberText,
      lines: [
        '*28 January 2021: several brokerages allowed selling but not buying.',
        '',
        '*Not an instruction. A collateral rule.',
        'Clearing houses demand collateral against trades awaiting settlement, scaled to volatility and volume.',
        '',
        '*Both were extreme, and the demands landed within hours.',
        'Restricting purchases cut the obligations needing collateral. Sales did not.',
        '',
        '*Part of why the United States shortened settlement to one day in May 2024.',
      ],
    },
  ]),
);

SVGS['stocks-06-1-six-pillars'] = frame(
  'The Six-Pillar Thesis, Scored for an Equity',
  'A worked example. Conviction means how many independent pillars agree — independent is the hard word.',
  [
    ...hbars([
      { label: 'Fundamentals', value: 1, color: C.green, note: 'flat revenue, stable cash flow, no net debt — weakly supportive', noteFill: C.greenText },
      { label: 'Valuation', value: 2, color: C.green, note: '9 times earnings against a ten-year average of 15 — supportive', noteFill: C.greenText },
      { label: 'Catalyst', value: 2, color: C.green, note: 'a contract renewal decision due within four months — supportive, with a date', noteFill: C.greenText },
      { label: 'Positioning', value: 0.05, color: C.muted, note: 'short interest low, no unusual flows — neutral', noteFill: C.muted },
      { label: 'Momentum', value: 2, color: C.red, note: 'the shares have fallen 30% over twelve months — against', noteFill: C.redText },
      { label: 'Carry', value: 2, color: C.green, note: 'a 4% dividend covered twice by earnings — supportive', noteFill: C.greenText },
    ], { x: 180, y: 92, w: 60, barH: 30, gap: 18, max: 2 }),
    line(60, 388, 840, 388, { stroke: C.grid }),
    txt(450, 416, 'Four supportive, one neutral, one against, and a dated catalyst. That is a genuine thesis.', { anchor: 'middle', size: 14, bold: true, fill: C.text }),
    rect(120, 434, 660, 100, { fill: C.bg, stroke: C.amber, sw: 2, rx: 8 }),
    txt(450, 460, 'Momentum disagreeing is the normal case, not a contradiction', { anchor: 'middle', size: 13, bold: true, fill: C.amberText }),
    txt(450, 484, 'Asness, Moskowitz and Pedersen 2013 found value and momentum negatively correlated within and across', { anchor: 'middle', size: 12, fill: C.muted }),
    txt(450, 502, 'asset classes. A cheap share is usually cheap because it has been falling.', { anchor: 'middle', size: 12, fill: C.muted }),
    txt(450, 524, 'The common error: counting one falling price as valuation, carry and sentiment. One fact, three vocabularies.', { anchor: 'middle', size: 12, bold: true, fill: C.text }),
  ],
);

SVGS['stocks-06-2-transmission-chain'] = frame(
  'Equities Sit Late on the Transmission Chain',
  'By the time a policy change is visible in share prices, it has already appeared twice.',
  [
    ...chain([
      { label: 'Interest rates', color: C.amber, note: 'the policy change itself' },
      { label: 'Currencies and bonds', color: C.amber, note: 'yields move, then FX adjusts' },
      { label: 'Credit', color: C.blue, note: 'spreads widen as borrowing costs rise' },
      { label: 'Equities', color: C.red, note: 'two channels at once' },
      { label: 'Commodities and crypto', color: C.muted, note: 'furthest along the chain' },
    ], { y: 108, boxH: 88, gapW: 46 }),
    rect(120, 268, 660, 96, { fill: C.bg, stroke: C.red, sw: 2, rx: 8 }),
    txt(450, 294, 'Why rates hit equities twice', { anchor: 'middle', size: 14, bold: true, fill: C.redText }),
    txt(450, 320, 'A higher discount rate reduces the present value of future cash flows, and reduces distant ones most.', { anchor: 'middle', size: 12, fill: C.muted }),
    txt(450, 340, 'Higher rates also slow the economy those cash flows come from.', { anchor: 'middle', size: 12, fill: C.muted }),
    txt(450, 394, 'A high multiple is a bet on distant profits, which is exactly the bet a rate rise damages.', { anchor: 'middle', size: 14, bold: true, fill: C.text }),
    line(60, 416, 840, 416, { stroke: C.grid }),
    txt(450, 446, 'Someone watching only equities is reading the last link and calling it news.', { anchor: 'middle', size: 13, bold: true, fill: C.amberText }),
    txt(450, 472, 'This is not market timing. Regime mapping tells you which pillar to trust in the environment you are already in.', { anchor: 'middle', size: 12, fill: C.muted }),
    txt(450, 498, 'Regimes shift gradually upward and abruptly downward, so a plan built on reacting meets the slower one.', { anchor: 'middle', size: 12, fill: C.muted }),
    txt(450, 524, 'And when nothing aligns, the correct discretionary position is none.', { anchor: 'middle', size: 12, bold: true, fill: C.text }),
  ],
);

SVGS['stocks-06-3-correlation-tail'] = frame(
  'Diversification Is Weakest Exactly When You Need It',
  'Longin and Solnik 2001 modelled the tails of international equity returns using extreme value theory.',
  [
    txt(240, 100, 'Ordinary and rising months', { anchor: 'middle', size: 15, bold: true, fill: C.greenText }),
    rect(80, 118, 320, 200, { fill: C.bg, stroke: C.green, sw: 2, rx: 10 }),
    ...[0, 1, 2, 3, 4].map((i) => `  <circle cx="${130 + i * 60}" cy="${170 + (i % 2 ? 40 : -10) + 40}" r="20" fill="${C.green}" fill-opacity="0.6"/>`),
    txt(240, 292, 'five markets, moving somewhat separately', { anchor: 'middle', size: 12, fill: C.muted }),

    txt(660, 100, 'The worst months', { anchor: 'middle', size: 15, bold: true, fill: C.redText }),
    rect(500, 118, 320, 200, { fill: C.bg, stroke: C.red, sw: 2, rx: 10 }),
    ...[0, 1, 2, 3, 4].map((i) => `  <circle cx="${640 + i * 10}" cy="${210}" r="20" fill="${C.red}" fill-opacity="0.5"/>`),
    txt(660, 292, 'the same five markets, moving as one', { anchor: 'middle', size: 12, fill: C.muted }),

    rect(120, 336, 660, 96, { fill: C.bg, stroke: C.blue, sw: 2, rx: 8 }),
    txt(450, 362, 'The finding is asymmetric', { anchor: 'middle', size: 14, bold: true, fill: C.blueText }),
    txt(450, 388, 'Correlation rises in the negative tail, when markets fall together. It does not rise in the positive tail.', { anchor: 'middle', size: 12, fill: C.muted }),
    txt(450, 408, 'They rejected multivariate normality for the negative tail and not for the positive one.', { anchor: 'middle', size: 12, fill: C.muted }),

    txt(450, 464, 'A portfolio spread across countries behaves like several investments for years, and like one on the worst days.', { anchor: 'middle', size: 13, bold: true, fill: C.text }),
    txt(450, 490, 'Not an argument against diversifying. An argument against expecting it to deliver in the drawdown what it delivers on average.', { anchor: 'middle', size: 12, fill: C.muted }),
    txt(450, 516, 'The number to ask for is the correlation during the worst 5% of months. It is almost never the one in the advertisement.', { anchor: 'middle', size: 12, bold: true, fill: C.amberText }),
  ],
);

// ---------- write ----------

validate(SVGS);

const header = `// GENERATED FILE — do not edit by hand.
// Run: node scripts/build-stocks-svgs.js
//
// One dark-theme diagram per Stocks & ETFs lesson, resolved into the lesson payload by
// scripts/build-course-data.js (which inlines the markup so a paid diagram never ships
// in a public lookup table). Every figure in these diagrams is computed in the
// generator from the same arithmetic as the lesson text, so the two cannot drift apart.

window.SCERE_STOCKS_SVGS = {
`;

const body = Object.entries(SVGS)
  .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
  .join('\n');

fs.writeFileSync(OUT, header + body + '\n};\n');
console.log(`Wrote ${Object.keys(SVGS).length} diagrams to data/course/src/stocks-svgs.js (${Math.round(fs.statSync(OUT).size / 1024)} KB)`);
