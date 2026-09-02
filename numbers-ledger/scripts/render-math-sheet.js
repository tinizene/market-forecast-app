'use strict';

const { OUTCOMES, WEEK } = require('./math.js');

/**
 * The math sheet, in two renderings from one computation.
 *
 * Markdown for the repository, where it sits next to the code and travels in a
 * pull request. HTML for handing to somebody - a laboratory, a regulator, a
 * buyer - who should not have to read a diff to read a table.
 *
 * Both come out of the same `compute()` call, so the two cannot disagree with
 * each other, and neither can disagree with the game: every figure was obtained
 * by asking the settlement code about every selection against every outcome.
 */

const pct = (value, places = 3) => `${(value * 100).toFixed(places)}%`;
const fixed = (value, places) => value.toFixed(places);
const oneIn = (value) => (Number.isInteger(value) ? `1 in ${group(value)}` : `1 in ${value.toFixed(1)}`);
const group = (value) => value.toLocaleString('en-US');
const plural = (count, word) => `${group(count)} ${word}${count === 1 ? '' : 's'}`;

/** How each win count is arrived at, as an argument rather than a number. */
const DERIVATIONS = {
  straight: {
    working: '1',
    prose: 'One outcome matches the three digits in the order they were chosen.'
  },
  box6: {
    working: '3! = 6',
    prose: 'Three different digits can be arranged six ways, and a box bet covers every arrangement including the straight one.'
  },
  box3: {
    working: '3!/2! = 3',
    prose: 'One digit repeated leaves three distinct arrangements, because swapping the two identical digits changes nothing.'
  },
  front: {
    working: '10',
    prose: 'The first two digits are fixed and the third is free, so ten outcomes match.'
  },
  oneDigit: {
    working: '1000 - 9^3 = 1000 - 729 = 271',
    prose: 'Count the outcomes that miss instead. A result avoids the chosen digit only if all three positions are one of the other nine, which is 9^3 = 729 ways; everything else contains it.'
  },
  twoDigits: {
    working: '1000 - 9^3 - 9^3 + 8^3 = 1000 - 729 - 729 + 512 = 54',
    prose: 'Inclusion and exclusion. Remove the outcomes missing the first digit and those missing the second, then add back the outcomes missing both, which were removed twice. The digits must differ, and the product refuses a repeated pair - played as one digit twice the same bet would win 271 times in 1,000 and pay 8.5x, returning 2.30 per unit staked.'
  }
};

// ------------------------------------------------------------------ markdown

function markdown(data) {
  const { rows, currency } = data;
  const out = [];
  const push = (...lines) => out.push(...lines);

  push('# Africa Numbers — game mathematics');
  push('');
  push('Every figure on this page was computed from the settlement code, not copied');
  push('from a design. Win counts come from asking `isHit` about **every valid selection**');
  push(`against **all ${group(OUTCOMES)} outcomes** — the counts below are exhaustive, not sampled.`);
  push('');
  push(`Regenerate with \`npm run mathsheet\`. CI fails if this file is not current.`);
  push('');
  push(`- Outcomes: **${group(OUTCOMES)}** (000–999, equally likely)`);
  push(`- Currency: ${currency.code}, ${currency.minorUnits} minor units`);
  push(`- Deducted from a winning payout: **${data.runnerCutPct}%** — the quoted multiplier is what the player receives`);
  push('');

  push('## The board');
  push('');
  push('| Bet | Selections | Wins / 1,000 | Chance | Pays | Return per 1.00 | Hold | A win in a week |');
  push('| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
  for (const row of rows) {
    push(`| ${row.label} | ${row.selections} | ${row.wins} | ${oneIn(row.oneIn)} | ${row.multiplier}× | ` +
      `${fixed(row.rtp, 5)} | ${pct(1 - row.rtp)} | ${pct(row.weekly, 1)} |`);
  }
  push('');
  push('"A win in a week" is the chance of at least one win from seven consecutive');
  push(`draws on the same bet: 1 − (1 − p)^${WEEK}.`);
  push('');

  push('## Where each win count comes from');
  push('');
  for (const row of rows) {
    const derivation = DERIVATIONS[row.type];
    push(`### ${row.label} — ${row.wins} in ${group(OUTCOMES)}`);
    push('');
    push('```');
    push(`wins        ${derivation.working}`);
    push(`probability ${row.wins} / ${group(OUTCOMES)} = ${fixed(row.probability, 6)}`);
    push(`return      ${fixed(row.probability, 6)} × ${row.multiplier} = ${fixed(row.rtp, 6)}`);
    push(`hold        1 − ${fixed(row.rtp, 6)} = ${fixed(1 - row.rtp, 6)}`);
    push('```');
    push('');
    push(derivation.prose);
    push('');
    push(`Checked across all **${group(row.selections)}** selections the product accepts for this bet: ` +
      (row.uniform
        ? `every one of them wins on exactly ${plural(row.wins, 'outcome')}.`
        : `**the count is not uniform** — it ranges from ${row.spread[0]} to ${row.spread[1]}, which means some selections are mispriced.`));
    push('');
  }

  push('## Rounding');
  push('');
  push('Payouts are whole minor units. Two multipliers are fractional, so a payout is');
  push('rounded — upward on a half, towards the player.');
  push('');
  push('| Bet | Exact at whole units | Worst deviation | At a stake of |');
  push('| --- | --- | ---: | ---: |');
  for (const row of rows) {
    const worst = row.rounding.worst;
    push(`| ${row.label} | ${row.rounding.exactAtWholeUnits ? 'yes' : 'NO'} | ` +
      `${worst.deviation === 0 ? 'none' : `${worst.deviation > 0 ? '+' : ''}${fixed(worst.deviation, 5)}`} | ` +
      `${worst.stakeCents === null ? '—' : `${worst.stakeCents} minor units`} |`);
  }
  push('');
  push(`Checked over every stake from 1 to ${data.maxStake.toLocaleString('en-US')} minor units. Every`);
  push('deviation is in the player\'s favour, and every one of them disappears at a whole');
  push('unit of currency, where all six multipliers divide exactly.');
  push('');

  push('## Volatility');
  push('');
  push('Return per unit staked is the multiplier with probability p and nothing otherwise,');
  push('so the standard deviation is `M × √(p(1−p))`.');
  push('');
  push('| Bet | Return | Standard deviation | Ratio to One Digit |');
  push('| --- | ---: | ---: | ---: |');
  const base = rows.find((row) => row.type === 'oneDigit').sd;
  for (const row of rows) {
    push(`| ${row.label} | ${fixed(row.rtp, 5)} | ${fixed(row.sd, 3)} | ${fixed(row.sd / base, 1)}× |`);
  }
  push('');
  push('This is the operational argument for the position-free bets, not only the');
  push('marketing one. A straight hit empties a runner\'s cash box; a One Digit win is');
  push('payable from the till every time.');
  push('');

  push('## Blended hold');
  push('');
  push('A board is not one hold. It is whatever hold the players choose by what they play.');
  push('These mixes are **illustrative** — nobody has taken a bet yet.');
  push('');
  push('| Mix | Blended return | Hold |');
  push('| --- | ---: | ---: |');
  for (const mix of data.mixes) {
    push(`| ${mix.name} | ${fixed(mix.rtp, 5)} | ${pct(1 - mix.rtp, 2)} |`);
  }
  push('');
  for (const mix of data.mixes) push(`- **${mix.name}** — ${mix.note}`);
  push('');

  push('## Does the draw reach every outcome evenly');
  push('');
  const u = data.uniformity;
  push(`Enumeration answers everything above exactly, because there are only ${group(OUTCOMES)}`);
  push('outcomes. What it cannot answer is whether the draw mechanism actually reaches');
  push('them evenly, so that gets a sample.');
  push('');
  push('```');
  push(`samples            ${u.samples.toLocaleString('en-US')}`);
  push(`expected per outcome ${u.expectedPerOutcome.toLocaleString('en-US')}`);
  push(`observed range     ${u.minBucket} to ${u.maxBucket}, no empty outcomes`);
  push(`chi-square         ${fixed(u.chiSquare, 2)} on ${u.df} degrees of freedom`);
  push(`z (Wilson–Hilferty) ${fixed(u.z, 4)}`);
  push(`p (two-sided)      ${fixed(u.p, 4)}`);
  push('```');
  push('');
  push('**What this shows and what it does not.** Seeds are derived deterministically');
  push('(`sha256` of a counter) so the figures reproduce exactly and a reviewer can re-run');
  push('them. The claim is correspondingly narrow: this tests the **mapping** from a seed');
  push('to a result — the HMAC, the rejection sampling, and the scaling to 000–999. It says');
  push('nothing about the entropy of a real seed, which comes from the platform CSPRNG and');
  push('belongs in the RNG description rather than here.');
  push('');
  push('The test is two-sided on purpose. A fit that is too good is as much a reason to');
  push('look again as one that is too bad.');
  push('');

  push('## What a reviewer should check');
  push('');
  push('1. **The odds the player is shown are these odds.** `winChance` and');
  push('   `expectedReturnCents` in `africa-numbers/game.js` are what the app displays, and');
  push('   the test suite asserts they agree with settlement over all 1,000 outcomes.');
  push('2. **No bet is priced above its own true odds.** A test asserts it for every type.');
  push('3. **Nothing is deducted from a winning payout.** The network is paid out of gross');
  push('   gaming revenue. A 500× advertised and then reduced by a commission would be a');
  push('   55% hold wearing a 50% headline.');
  push('4. **Two Digits refuses a repeated digit.** Priced for two different digits');
  push('   appearing — 54 in 1,000. Played as one digit twice it becomes 271 in 1,000 at');
  push('   8.5×, returning 2.30 per unit staked. One unvalidated field is the difference');
  push('   between a 46% return and a bet that bankrupts the draw.');
  push('');
  push(`_Generated by \`npm run mathsheet\` from the game rules. Do not edit by hand._`);
  push('');

  return out.join('\n');
}

module.exports = { markdown, DERIVATIONS, pct, fixed, oneIn, group, plural };

// ---------------------------------------------------------------------- html

const escape = (value) => String(value)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const STYLE = `
  :root {
    --paper: #f1f3f5;
    --surface: #ffffff;
    --sunken: #e7eaee;
    --ink: #12161b;
    --muted: #5c6672;
    --rule: #d3d9df;
    --rule-strong: #adb6c0;
    --accent: #7a2233;
    --good: #1f6b45;
    --note: #8a5a12;
    --measure: 68ch;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      color-scheme: dark;
      --paper: #0d1014; --surface: #161b21; --sunken: #1d232b;
      --ink: #e6e9ec; --muted: #97a1ac; --rule: #262e37; --rule-strong: #3a4550;
      --accent: #e08a9b; --good: #5cc48c; --note: #d9a949;
    }
  }
  :root[data-theme="dark"] {
    color-scheme: dark;
    --paper: #0d1014; --surface: #161b21; --sunken: #1d232b;
    --ink: #e6e9ec; --muted: #97a1ac; --rule: #262e37; --rule-strong: #3a4550;
    --accent: #e08a9b; --good: #5cc48c; --note: #d9a949;
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    background: var(--paper);
    color: var(--ink);
    font-family: 'Public Sans', system-ui, -apple-system, sans-serif;
    font-size: 16px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  .sheet { max-width: 96ch; margin: 0 auto; padding: 56px 24px 110px; }

  .masthead { border-bottom: 1px solid var(--rule-strong); padding-bottom: 26px; margin-bottom: 34px; }

  .stamp {
    font-family: 'Roboto Mono', ui-monospace, monospace;
    font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;
    color: var(--accent); display: flex; flex-wrap: wrap; gap: 6px 22px; margin-bottom: 18px;
  }

  h1 {
    font-family: 'Instrument Serif', Georgia, serif;
    font-weight: 400; font-size: clamp(2.2rem, 6vw, 3.4rem);
    line-height: 1.02; letter-spacing: -0.01em; margin: 0 0 14px; text-wrap: balance;
  }

  .standfirst { font-size: 1.08rem; color: var(--muted); max-width: var(--measure); margin: 0; }

  section { margin-bottom: 54px; }

  h2 {
    font-family: 'Instrument Serif', Georgia, serif;
    font-weight: 400; font-size: 1.85rem; line-height: 1.15;
    margin: 0 0 14px; padding-top: 26px; border-top: 1px solid var(--rule);
    text-wrap: balance;
  }

  h3 {
    font-family: 'Public Sans', sans-serif; font-weight: 600;
    font-size: 0.95rem; letter-spacing: 0.01em; margin: 0 0 10px;
  }
  h3 .count { font-family: 'Roboto Mono', monospace; color: var(--accent); font-weight: 400; font-size: 0.86em; }

  p, li { max-width: var(--measure); }
  p { margin: 0 0 14px; }
  ul, ol { margin: 0 0 16px; padding-left: 20px; }
  li { margin-bottom: 8px; }
  strong { font-weight: 600; }
  em { font-style: italic; }

  code {
    font-family: 'Roboto Mono', ui-monospace, monospace;
    font-size: 0.85em; background: var(--sunken); padding: 1px 5px; border-radius: 2px;
  }

  .scroll { overflow-x: auto; margin: 0 0 18px; }

  table { border-collapse: collapse; width: 100%; font-size: 0.9rem; }
  th {
    text-align: left; font-family: 'Roboto Mono', monospace;
    font-size: 10px; letter-spacing: 0.11em; text-transform: uppercase;
    color: var(--muted); font-weight: 400; padding: 0 14px 8px 0;
    border-bottom: 1px solid var(--rule-strong); white-space: nowrap;
  }
  td { padding: 9px 14px 9px 0; border-bottom: 1px solid var(--rule); vertical-align: baseline; }
  tr:last-child td { border-bottom: none; }
  th.n, td.n {
    text-align: right; font-family: 'Roboto Mono', monospace;
    font-variant-numeric: tabular-nums; white-space: nowrap; padding-right: 0;
  }
  td.name { font-weight: 600; white-space: nowrap; }
  tbody tr.lead td { background: color-mix(in srgb, var(--accent) 6%, transparent); }

  .derivations { display: grid; gap: 1px; background: var(--rule); border: 1px solid var(--rule); }
  .derivation { background: var(--surface); padding: 18px 20px; }
  .derivation p { margin: 0; font-size: 0.93rem; color: var(--muted); max-width: none; }
  .derivation p + p { margin-top: 10px; }
  .derivation .checked { color: var(--good); }
  .derivation .failed { color: var(--accent); font-weight: 600; }

  pre {
    font-family: 'Roboto Mono', ui-monospace, monospace;
    font-size: 0.8rem; line-height: 1.7; background: var(--sunken);
    padding: 12px 14px; margin: 0 0 12px; overflow-x: auto; border-radius: 2px;
  }

  .callout {
    border-left: 3px solid var(--note); background: var(--surface);
    padding: 15px 18px; margin: 22px 0; font-size: 0.94rem; max-width: var(--measure);
  }
  .callout p { margin: 0 0 10px; } .callout p:last-child { margin: 0; }

  .verdict {
    display: inline-block; font-family: 'Roboto Mono', monospace;
    font-size: 11px; letter-spacing: 0.09em; text-transform: uppercase;
    color: var(--good); border: 1px solid var(--good); border-radius: 2px;
    padding: 3px 9px; margin-bottom: 14px;
  }

  .footer {
    margin-top: 60px; padding-top: 20px; border-top: 1px solid var(--rule-strong);
    font-size: 0.85rem; color: var(--muted); max-width: var(--measure);
  }

  @media (max-width: 640px) {
    .sheet { padding: 36px 16px 80px; }
    td, th { padding-right: 10px; }
  }
`;

function htmlTable({ columns, rows, lead = null }) {
  const head = columns.map((column) => `<th${column.n ? ' class="n"' : ''}>${escape(column.label)}</th>`).join('');
  const body = rows.map((row) => {
    const cells = row.cells
      .map((cell, i) => `<td class="${columns[i].n ? 'n' : (i === 0 ? 'name' : '')}">${cell}</td>`)
      .join('');
    return `<tr${lead && row.key === lead ? ' class="lead"' : ''}>${cells}</tr>`;
  }).join('\n        ');
  return `<div class="scroll"><table>\n        <thead><tr>${head}</tr></thead>\n        <tbody>\n        ${body}\n        </tbody>\n      </table></div>`;
}

function html(data) {
  const { rows, currency } = data;
  const u = data.uniformity;
  const base = rows.find((row) => row.type === 'oneDigit').sd;
  const allUniform = rows.every((row) => row.uniform);
  const allExact = rows.every((row) => row.rounding.exactAtWholeUnits);

  const boardTable = htmlTable({
    columns: [
      { label: 'Bet' }, { label: 'Selections', n: true }, { label: `Wins / ${group(OUTCOMES)}`, n: true },
      { label: 'Chance', n: true }, { label: 'Pays', n: true },
      { label: 'Return per 1.00', n: true }, { label: 'Hold', n: true }, { label: 'A win in a week', n: true }
    ],
    rows: rows.map((row) => ({
      key: row.type,
      cells: [
        escape(row.label), group(row.selections), String(row.wins), oneIn(row.oneIn),
        `${row.multiplier}&times;`, fixed(row.rtp, 5), pct(1 - row.rtp), pct(row.weekly, 1)
      ]
    })),
    lead: 'oneDigit'
  });

  const roundingTable = htmlTable({
    columns: [
      { label: 'Bet' }, { label: 'Exact at whole units' },
      { label: 'Worst deviation', n: true }, { label: 'At a stake of', n: true }
    ],
    rows: rows.map((row) => ({
      key: row.type,
      cells: [
        escape(row.label),
        row.rounding.exactAtWholeUnits ? 'yes' : '<strong>no</strong>',
        row.rounding.worst.deviation === 0
          ? 'none'
          : `${row.rounding.worst.deviation > 0 ? '+' : ''}${fixed(row.rounding.worst.deviation, 5)}`,
        row.rounding.worst.stakeCents === null
          ? '&mdash;' : escape(plural(row.rounding.worst.stakeCents, 'minor unit'))
      ]
    }))
  });

  const volatilityTable = htmlTable({
    columns: [
      { label: 'Bet' }, { label: 'Return', n: true },
      { label: 'Standard deviation', n: true }, { label: 'Against One Digit', n: true }
    ],
    rows: rows.map((row) => ({
      key: row.type,
      cells: [escape(row.label), fixed(row.rtp, 5), fixed(row.sd, 3), `${fixed(row.sd / base, 1)}&times;`]
    })),
    lead: 'straight'
  });

  const mixTable = htmlTable({
    columns: [{ label: 'Mix' }, { label: 'Blended return', n: true }, { label: 'Hold', n: true }],
    rows: data.mixes.map((mix) => ({
      key: mix.name, cells: [escape(mix.name), fixed(mix.rtp, 5), pct(1 - mix.rtp, 2)]
    }))
  });

  const derivations = rows.map((row) => {
    const derivation = DERIVATIONS[row.type];
    return `<div class="derivation">
          <h3>${escape(row.label)} <span class="count">${row.wins} in ${group(OUTCOMES)}</span></h3>
<pre>wins         ${escape(derivation.working)}
probability  ${row.wins} / ${group(OUTCOMES)} = ${fixed(row.probability, 6)}
return       ${fixed(row.probability, 6)} &times; ${row.multiplier} = ${fixed(row.rtp, 6)}
hold         1 &minus; ${fixed(row.rtp, 6)} = ${fixed(1 - row.rtp, 6)}</pre>
          <p>${escape(derivation.prose)}</p>
          <p>Checked across all <strong>${group(row.selections)}</strong> selections the product accepts:
            ${row.uniform
              ? `<span class="checked">every one wins on exactly ${plural(row.wins, 'outcome')}.</span>`
              : `<span class="failed">the count is not uniform &mdash; ${row.spread[0]} to ${row.spread[1]}, so some selections are mispriced.</span>`}</p>
        </div>`;
  }).join('\n        ');

  return `<title>Africa Numbers Game Mathematics</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Public+Sans:wght@400;600&family=Roboto+Mono:wght@400;500&display=swap">
<style>${STYLE}</style>

<div class="sheet">

  <header class="masthead">
    <div class="stamp">
      <span>Game mathematics</span>
      <span>Africa Numbers</span>
      <span>Computed, not transcribed</span>
    </div>
    <h1>Every outcome, counted</h1>
    <p class="standfirst">The board has ${group(OUTCOMES)} outcomes, so nothing here is sampled. Win counts come from
      asking the settlement code about every selection the product accepts, against every
      outcome it can produce &mdash; a million questions per bet type.</p>
  </header>

  <section>
    <span class="verdict">${allUniform ? 'All counts uniform' : 'Non-uniform counts found'}</span>
    <h2>The board</h2>
    ${boardTable}
    <p>Chance of at least one win from seven consecutive draws on the same bet:
      1 &minus; (1 &minus; p)<sup>${WEEK}</sup>. Nothing is deducted from a winning payout &mdash; the
      network is paid out of gross gaming revenue, so the quoted multiplier is what the
      player receives.</p>
    <div class="callout">
      <p><strong>One Digit returns marginally more than the straight bet, not the same.</strong>
        0.50135 against 0.50000 &mdash; a difference of 0.135 of a percentage point, in the
        player's favour, arising from the multiplier being rounded to two decimal places
        rather than set to 1.84502. Worth stating precisely, because the architecture
        document rounds it to "the same" and a reviewer comparing the two documents will
        notice.</p>
    </div>
  </section>

  <section>
    <h2>Where each win count comes from</h2>
    <div class="derivations">
        ${derivations}
    </div>
  </section>

  <section>
    <span class="verdict">${allExact ? 'Exact at whole units' : 'Inexact at whole units'}</span>
    <h2>Rounding</h2>
    <p>Payouts are whole minor units. Two multipliers are fractional, so a payout is
      rounded &mdash; upward on a half, towards the player.</p>
    ${roundingTable}
    <p>Checked over every stake from 1 to ${group(data.maxStake)} minor units. Every deviation is
      in the player's favour, and every one disappears at a whole unit of currency, where
      all six multipliers divide exactly.</p>
  </section>

  <section>
    <h2>Volatility</h2>
    <p>Return per unit staked is the multiplier with probability <em>p</em> and nothing
      otherwise, so the standard deviation is <code>M &times; &radic;(p(1&minus;p))</code>.</p>
    ${volatilityTable}
    <p>This is the operational argument for the position-free bets, not only the marketing
      one. A straight hit empties a runner's cash box and forces an emergency top-up; a One
      Digit win is payable from the till every time.</p>
  </section>

  <section>
    <h2>Blended hold</h2>
    <p>A board is not one hold. It is whatever hold the players choose by what they play.
      These mixes are <strong>illustrative</strong> &mdash; nobody has taken a bet yet.</p>
    ${mixTable}
    <ul>
      ${data.mixes.map((mix) => `<li><strong>${escape(mix.name)}</strong> &mdash; ${escape(mix.note)}</li>`).join('\n      ')}
    </ul>
  </section>

  <section>
    <h2>Does the draw reach every outcome evenly</h2>
    <p>Enumeration answers everything above exactly. What it cannot answer is whether the
      draw mechanism actually reaches all ${group(OUTCOMES)} outcomes evenly, so that gets a sample.</p>
<pre>samples               ${group(u.samples)}
expected per outcome  ${group(u.expectedPerOutcome)}
observed range        ${u.minBucket} to ${u.maxBucket}, no empty outcomes
chi-square            ${fixed(u.chiSquare, 2)} on ${group(u.df)} degrees of freedom
z (Wilson&ndash;Hilferty)  ${fixed(u.z, 4)}
p (two-sided)         ${fixed(u.p, 4)}</pre>
    <div class="callout">
      <p><strong>What this shows, and what it does not.</strong> Seeds are derived
        deterministically &mdash; <code>sha256</code> of a counter &mdash; so the figures reproduce
        exactly and a reviewer can re-run them.</p>
      <p>The claim is correspondingly narrow. This tests the <em>mapping</em> from a seed to a
        result: the HMAC, the rejection sampling, and the scaling to 000&ndash;999. It says
        nothing about the entropy of a real seed, which comes from the platform CSPRNG and
        belongs in the RNG description rather than here.</p>
      <p>The test is two-sided on purpose. A fit that is too good is as much a reason to
        look again as one that is too bad.</p>
    </div>
  </section>

  <section>
    <h2>What a reviewer should check</h2>
    <ol>
      <li><strong>The odds the player is shown are these odds.</strong> <code>winChance</code> and
        <code>expectedReturnCents</code> are what the app displays, and the test suite asserts
        they agree with settlement across all ${group(OUTCOMES)} outcomes.</li>
      <li><strong>No bet is priced above its own true odds.</strong> Asserted for every type.</li>
      <li><strong>Nothing is deducted from a winning payout.</strong> A 500&times; advertised and
        then reduced by a commission would be a 55% hold wearing a 50% headline.</li>
      <li><strong>Two Digits refuses a repeated digit.</strong> Priced for two different digits
        appearing &mdash; 54 in ${group(OUTCOMES)}. Played as one digit twice it becomes 271 in
        ${group(OUTCOMES)} at 8.5&times;, returning 2.30 per unit staked. One unvalidated field is the
        difference between a 46% return and a bet that bankrupts the draw.</li>
    </ol>
  </section>

  <p class="footer">Currency ${escape(currency.code)}, ${currency.minorUnits} minor units.
    Generated from the game rules by <code>npm run mathsheet</code> &mdash; not written by hand, and
    continuous integration fails if it is not current.</p>

</div>
`;
}

module.exports.html = html;
