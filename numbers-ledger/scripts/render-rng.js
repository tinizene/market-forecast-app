'use strict';

const { group, fixed, escape } = require('./render-helpers.js');

/**
 * The RNG description, in two renderings from one computation.
 *
 * This is the document that carries the unusual argument. A laboratory tests
 * conventional certified generators every week; a commit-reveal scheme is a
 * different shape of claim - stronger on public verifiability, unfamiliar on
 * the bench - and the whole job of this page is to make the unfamiliar part
 * easy to check rather than easy to argue about.
 */

const sci = (value, places = 2) => value.toExponential(places);
const pv = (value) => (value < 0.0001 ? '<0.0001' : value.toFixed(4));

// ------------------------------------------------------------------ markdown

function markdown(data) {
  const { scaling, seed, sample, avalanche, keySeparation } = data;
  const out = [];
  const push = (...lines) => out.push(...lines);

  push('# Africa Numbers — random number generation');
  push('');
  push('How the winning number is produced, why it cannot be chosen after the bets are');
  push('in, and what the evidence for that actually covers.');
  push('');
  push('Every figure below was computed by `npm run rng`. Seeds are derived from a counter');
  push('rather than drawn, so a reviewer re-running it gets these numbers and not similar');
  push('ones. CI fails if this file is not current.');
  push('');

  push('## 1. What produces the number');
  push('');
  push('One draw, one seed, one published commitment, one deterministic result.');
  push('');
  push('```');
  push(`seed         ${seed.bytes} bytes from ${seed.source}, as ${seed.format}`);
  push('commitment   sha256("<drawKey>|<seed>")            published before betting opens');
  push('result       HMAC-SHA256(key=seed, "<drawKey>|<counter>")');
  push('             read 32-bit big-endian words, reject >= limit, then modulo 1,000');
  push('verify       anyone recomputes both from the revealed seed');
  push('```');
  push('');
  push('The draw key is inside the commitment, not only the seed. A commitment is');
  push('therefore bound to the draw it was published for and cannot be replayed against a');
  push('different day. It is inside the HMAC message for the same reason.');
  push('');

  push('## 2. Entropy');
  push('');
  push(`Seeds are ${seed.bits} bits from \`crypto.randomBytes\`, which is the platform CSPRNG —`);
  push('OpenSSL, seeded from the operating system (`getrandom(2)` on Linux). On a freshly');
  push('booted container that call blocks until the kernel pool is initialised rather than');
  push('returning weak bytes, which is the behaviour to want and the reason nothing here');
  push('tries to stir in its own entropy.');
  push('');
  push('**What is claimed:** the derivation from a seed to a result is unbiased and');
  push('deterministic, and section 5 measures it.');
  push('');
  push('**What is not:** the quality of the operating system\'s entropy. That is inherited,');
  push('not demonstrated. If a laboratory wants it evidenced, the platform is the subject,');
  push('not this software.');
  push('');
  push(`A ${seed.bits}-bit seed selecting between ${group(seed.outcomes)} outcomes is an enormous surplus, and`);
  push('the surplus has a consequence worth stating plainly rather than leaving to be');
  push(`found: roughly one seed in ${group(seed.outcomes)} produces any given result, so anybody`);
  push('generating seeds can search for the number they want in about a thousand tries.');
  push('That is exactly what the laboratory harness does, and it is why section 4 matters.');
  push('');

  push('## 3. Scaling without bias');
  push('');
  push('A 32-bit word does not divide evenly into 1,000. Taking the modulo of the whole');
  push('range would make the first outcomes very slightly more likely than the rest, so');
  push('words at or above the largest multiple of 1,000 below 2³² are discarded and the');
  push('next word is read.');
  push('');
  push('```');
  push(`range              2^32 = ${group(scaling.word)}`);
  push(`accepted below     ${group(scaling.limit)}   (${group(scaling.limit / 1000)} x 1,000)`);
  push(`discarded values   ${scaling.discarded}`);
  push(`rejection per word ${sci(scaling.rejectionPerWord)}`);
  push(`words per digest   ${scaling.wordsPerDigest}    (a 32-byte HMAC output)`);
  push(`all eight rejected ${sci(scaling.rejectionPerDigest)}  before the counter advances`);
  push(`counter ceiling    ${group(scaling.counterLimit)}   then it throws rather than return a biased number`);
  push('```');
  push('');
  push(`Had the modulo been taken instead, ${scaling.discarded} of the 1,000 outcomes would have been`);
  push(`favoured by one part in ${group(Math.round(1 / scaling.modBiasRelative))} — about ${sci(scaling.modBiasRelative)} relative. Undetectable in`);
  push('play, and still a game of chance tilted in a direction nobody chose. The fix is');
  push('six lines and it is in the product.');
  push('');
  push('**No sample can check this, and section 5 does not claim to.** A bias of one part');
  push(`in ${group(Math.round(1 / scaling.modBiasRelative))} is far below what a chi-square over a million draws could see, or a`);
  push('billion. We found that out by removing the rejection: every statistical test in');
  push('this document still passed. So the guard is established exactly instead — the');
  push('scaling step is a separate function and a test walks the boundary, asserting that');
  push(`the last accepted word maps to 999, that all ${scaling.discarded} words above the limit are discarded,`);
  push(`and that every outcome has exactly ${group(scaling.limit / 1000)} words behind it.`);
  push('');
  push('This is worth a reviewer\'s attention because it is the general case: a property');
  push('that statistics cannot reach has to be argued from the code, and a document that');
  push('waves at a p-value instead is hiding the gap rather than closing it.');
  push('');

  push('## 4. What commit-reveal does and does not guarantee');
  push('');
  push('**Guaranteed.** The operator cannot change the number after seeing the book. The');
  push('commitment is published before betting opens, the result is a function of the');
  push('seed, and a seed that does not hash to the published commitment is refused by the');
  push('operator\'s own code before anyone else has to catch it.');
  push('');
  push('**Not guaranteed.** The operator cannot be stopped from *choosing* the number');
  push('before the book exists. Generating seeds until one gives 417 takes a thousand');
  push('tries. This is not a defect introduced by the scheme — it is why the timing rule');
  push('carries as much weight as the cryptography:');
  push('');
  push('- the commitment is published **before betting opens**, so a chosen number is');
  push('  worth nothing: no bets exist to be chosen against;');
  push('- a commitment published late makes the guarantee retrospective, which is to say');
  push('  absent, and the product refuses to open a draw whose commitment post-dates the');
  push('  opening time.');
  push('');
  push('**Custody.** A seed known in advance is a number known in advance, so the seed is');
  push('sealed at preparation and opened by any *k* of *n* custodians. See the custody');
  push('section of the README: no single person, and no reader of the database, holds it.');
  push('');

  push('## 5. Statistical evidence');
  push('');
  push('All of it tests the **mapping** from a seed to a result. None of it tests the');
  push('entropy of a real seed — see section 2.');
  push('');
  push('### 5.0 Every test, on one list');
  push('');
  push('| Test | Statistic | p | p on a second sample |');
  push('| --- | --- | ---: | ---: |');
  for (const reading of data.summary.readings) {
    push(`| ${reading.name} | ${reading.statistic} | ${pv(reading.p)} | ${pv(reading.confirmP)} |`);
  }
  push('');
  push('Reporting several tests and presenting only the comfortable ones is the oldest way');
  push('to make a generator look good, so the list is complete and in a fixed order.');
  push('');
  push(`**Every test is run twice**, over independent sets of derived seeds. With`);
  push(`${data.summary.tests} tests there is roughly a ${Math.round(data.summary.chanceOfOneLow * 100)}% chance that something lands below 0.05 on an`);
  push('entirely honest generator, and a replication is a better answer to that than an');
  push('argument about multiple comparisons. A reading low in one column and healthy in');
  push('the other is noise, visibly. A reading low in both is a finding.');
  push('');
  if (data.summary.low.length === 0) {
    push(`Nothing came back below 0.05 in the first column.`);
  } else {
    push(`**Below 0.05 in the first column:** ` +
      `${data.summary.low.map((reading) => `${reading.name} (${pv(reading.p)}, replication ${pv(reading.confirmP)})`).join('; ')}.`);
    push('');
    push(data.summary.lowInBoth.length === 0
      ? 'None of them is low in both columns, which is what noise looks like.'
      : `**Low in both columns:** ${data.summary.lowInBoth.map((reading) => reading.name).join(', ')}. That is a finding, not noise. Do not submit this until it is understood.`);
  }
  push('');
  const u = sample.uniformity;
  push(`### 5.1 Uniformity over ${group(u.draws)} draws`);
  push('');
  push('```');
  push(`expected per outcome  ${group(u.expectedPerOutcome)}`);
  push(`observed range        ${u.min} to ${u.max}`);
  push(`outcomes never seen   ${u.empty}`);
  push(`chi-square            ${fixed(u.chiSquare, 2)} on ${group(u.df)} degrees of freedom`);
  push(`p (upper tail)        ${pv(u.pUpper)}`);
  push(`p (two-sided)         ${pv(u.p)}`);
  push('```');
  push('');
  push('### 5.2 Each digit position on its own');
  push('');
  push('| Position | Chi-square (df 9) | p (upper) |');
  push('| --- | ---: | ---: |');
  for (const position of sample.positions) {
    push(`| ${position.position} | ${fixed(position.chiSquare, 2)} | ${pv(position.pUpper)} |`);
  }
  push('');
  push('A result can be uniform overall while a single position is not, which would show');
  push('up as a readable pattern long before the aggregate moved.');
  push('');
  push('### 5.3 Does one draw say anything about the next');
  push('');
  push('```');
  push(`consecutive pairs     ${group(sample.serial.pairs)}`);
  push(`chi-square (10 x 10)  ${fixed(sample.serial.chiSquare, 2)} on ${sample.serial.df} degrees of freedom`);
  push(`p (upper tail)        ${pv(sample.serial.pUpper)}`);
  push(`serial correlation    r = ${sci(sample.correlation.r, 3)}, standard error ${sci(sample.correlation.standardError, 2)}`);
  push(`                      z = ${fixed(sample.correlation.z, 3)}, p = ${pv(sample.correlation.p)}`);
  push('```');
  push('');
  push('### 5.4 One bit of the seed changed');
  push('');
  push('```');
  push(`pairs tested          ${group(avalanche.draws)}`);
  push(`results that agreed   ${avalanche.agreed}   (expected ${group(avalanche.expected)}, being 1 in 1,000)`);
  push(`z                     ${fixed(avalanche.z, 3)}`);
  push(`p                     ${pv(avalanche.p)}`);
  push('```');
  push('');
  push('A near-miss on the seed must not be a near-miss on the number. If a leaked');
  push('fragment of a seed narrowed the outcome, the custody scheme would be protecting');
  push('something that no longer needed protecting.');
  push('');
  push('### 5.5 The same seed under two different draw keys');
  push('');
  push('```');
  push(`pairs tested          ${group(keySeparation.draws)}`);
  push(`results that agreed   ${keySeparation.agreed}   (expected ${group(keySeparation.expected)})`);
  push(`z                     ${fixed(keySeparation.z, 3)}`);
  push(`p                     ${pv(keySeparation.p)}`);
  push('```');
  push('');
  push('A seed revealed for Monday must say nothing about Tuesday, or publishing one');
  push('result would leak the next.');
  push('');

  push('## 6. Operating rules');
  push('');
  push('- **One seed per draw.** Never reused, never derived from a previous seed.');
  push('- **Commit before opening.** The product refuses a draw whose commitment is later');
  push('  than its opening time.');
  push('- **Reveal after the draw time**, on the server clock, and never on a clock a');
  push('  caller supplies.');
  push('- **A cancelled draw keeps its commitment.** Publish the seed anyway, so the');
  push('  record shows what would have been drawn and the cancellation cannot hide it.');
  push('- **The seed of an unrevealed draw exists only inside the sealed envelope.**');
  push('');

  push('## 7. What a reviewer should attack');
  push('');
  push('1. **Take a revealed draw and recompute it.** The commitment, the HMAC, the');
  push('   rejection, the modulo. Everything needed is public after the reveal.');
  push('2. **Try to reveal a different seed.** The commitment check refuses it, inside the');
  push('   write transaction, before any payout is computed.');
  push('3. **Check the commitment timestamp against the opening time** on every draw in the');
  push('   journal. That ordering is the whole guarantee, and it is the thing worth');
  push('   auditing rather than the hash function.');
  push('4. **Run your own suite.** Section 5 is diligence, not a substitute. The mapping is');
  push('   deterministic, so you can generate as many results as you need from seeds of');
  push('   your own choosing.');
  push('');
  push('_Generated by `npm run rng` from the draw module. Do not edit by hand._');
  push('');

  return out.join('\n');
}

module.exports = { markdown, sci, pv };

// ---------------------------------------------------------------------- html

const { htmlTable, page } = require('./render-helpers.js');
const g = group;

function html(data) {
  const { scaling, seed, sample, avalanche, keySeparation } = data;
  const u = sample.uniformity;
  const healthy = [u.p, sample.serial.pUpper, sample.correlation.p, avalanche.p, keySeparation.p]
    .concat(sample.positions.map((position) => position.pUpper))
    .every((p) => p > 0.001);

  const summaryTable = htmlTable({
    columns: [
      { label: 'Test' }, { label: 'Statistic' },
      { label: 'p', n: true }, { label: 'p, second sample', n: true }
    ],
    rows: data.summary.readings.map((reading) => ({
      key: reading.name,
      cells: [escape(reading.name), escape(reading.statistic), pv(reading.p), pv(reading.confirmP)]
    }))
  });

  const positionTable = htmlTable({
    columns: [{ label: 'Digit position' }, { label: 'Chi-square (df 9)', n: true }, { label: 'p (upper)', n: true }],
    rows: sample.positions.map((position) => ({
      key: position.position,
      cells: [`Position ${position.position}`, fixed(position.chiSquare, 2), pv(position.pUpper)]
    }))
  });

  return page({
    title: 'Africa Numbers Random Number Generation',
    stamp: ['Random number generation', 'Africa Numbers', 'Deterministic, and reproducible'],
    heading: 'How the number is drawn',
    standfirst: `One seed, one commitment published before betting opens, one result that
      anybody can recompute. What follows is how it works, what the guarantee actually
      covers, and where the evidence stops.`,
    body: `
  <section>
    <span class="verdict">${healthy ? 'Every test passed' : 'A test needs looking at'}</span>
    <h2>What produces the number</h2>
<pre>seed         ${seed.bytes} bytes from ${escape(seed.source)}, as ${escape(seed.format)}
commitment   sha256("&lt;drawKey&gt;|&lt;seed&gt;")            published before betting opens
result       HMAC-SHA256(key=seed, "&lt;drawKey&gt;|&lt;counter&gt;")
             read 32-bit big-endian words, reject &ge; limit, then modulo 1,000
verify       anyone recomputes both from the revealed seed</pre>
    <p>The draw key is inside the commitment, not only the seed. A commitment is therefore
      bound to the draw it was published for and cannot be replayed against a different
      day. It is inside the HMAC message for the same reason.</p>
  </section>

  <section>
    <h2>Entropy</h2>
    <p>Seeds are ${seed.bits} bits from <code>crypto.randomBytes</code> &mdash; the platform CSPRNG,
      seeded from the operating system. On a freshly booted container that call blocks
      until the kernel pool is initialised rather than returning weak bytes, which is the
      behaviour to want and the reason nothing here stirs in entropy of its own.</p>
    <div class="callout">
      <p><strong>What is claimed:</strong> the derivation from a seed to a result is
        unbiased and deterministic, and the evidence below measures it.</p>
      <p><strong>What is not:</strong> the quality of the operating system's entropy. That
        is inherited, not demonstrated. A laboratory wanting it evidenced is asking about
        the platform, not about this software.</p>
    </div>
    <p>A ${seed.bits}-bit seed selecting between ${g(seed.outcomes)} outcomes is an enormous surplus, with a
      consequence worth stating rather than leaving to be found: roughly one seed in
      ${g(seed.outcomes)} produces any given result, so anybody generating seeds can search for the
      number they want in about a thousand tries. The laboratory harness does exactly
      that, and it is why the section after next matters more than the hash function.</p>
  </section>

  <section>
    <h2>Scaling without bias</h2>
    <p>A 32-bit word does not divide evenly into ${g(1000)}. Taking the modulo of the whole
      range would make the first outcomes very slightly more likely, so words at or above
      the largest multiple of ${g(1000)} below 2<sup>32</sup> are discarded and the next word read.</p>
<pre>range              2^32 = ${g(scaling.word)}
accepted below     ${g(scaling.limit)}   (${g(scaling.limit / 1000)} &times; 1,000)
discarded values   ${scaling.discarded}
rejection per word ${sci(scaling.rejectionPerWord)}
words per digest   ${scaling.wordsPerDigest}    (a 32-byte HMAC output)
all eight rejected ${sci(scaling.rejectionPerDigest)}  before the counter advances
counter ceiling    ${g(scaling.counterLimit)}   then it throws rather than return a biased number</pre>
    <p>Had the modulo been taken instead, ${scaling.discarded} of the ${g(1000)} outcomes would have been
      favoured by one part in ${g(Math.round(1 / scaling.modBiasRelative))} &mdash; about ${sci(scaling.modBiasRelative)} relative.
      Undetectable in play, and still a game of chance tilted in a direction nobody chose.
      The fix is six lines and it is in the product.</p>
    <div class="callout">
      <p><strong>No sample can check this, and the evidence section does not claim to.</strong>
        A bias of one part in ${g(Math.round(1 / scaling.modBiasRelative))} is far below what a chi-square over a million
        draws could see, or a billion. We found that out by removing the rejection: every
        statistical test in this document still passed.</p>
      <p>So the guard is established exactly instead. The scaling step is a separate
        function and a test walks the boundary &mdash; the last accepted word maps to 999, all
        ${scaling.discarded} words above the limit are discarded, and every outcome has exactly
        ${g(scaling.limit / 1000)} words behind it.</p>
      <p>Worth a reviewer's attention because it is the general case: a property statistics
        cannot reach has to be argued from the code, and a document that waves at a
        p-value instead is hiding the gap rather than closing it.</p>
    </div>
  </section>

  <section>
    <h2>What commit-reveal does and does not guarantee</h2>
    <p><strong>Guaranteed.</strong> The operator cannot change the number after seeing the
      book. The commitment is published before betting opens, the result is a function of
      the seed, and a seed that does not hash to the published commitment is refused by
      the operator's own code before anyone else has to catch it.</p>
    <div class="callout">
      <p><strong>Not guaranteed.</strong> The operator cannot be stopped from
        <em>choosing</em> the number before the book exists. Generating seeds until one
        gives 417 takes about a thousand tries.</p>
      <p>This is not a defect the scheme introduces. It is why the timing rule carries as
        much weight as the cryptography: the commitment is published <strong>before betting
        opens</strong>, so a chosen number is worth nothing &mdash; there are no bets to choose
        against. A commitment published late makes the guarantee retrospective, which is to
        say absent, and the product refuses to open a draw whose commitment post-dates its
        opening time.</p>
    </div>
    <p><strong>Custody.</strong> A seed known in advance is a number known in advance, so
      the seed is sealed at preparation and opened by any <em>k</em> of <em>n</em>
      custodians. No single person, and no reader of the database, holds it.</p>
  </section>

  <section>
    <h2>Statistical evidence</h2>
    <p>All of it tests the <em>mapping</em> from a seed to a result. None of it tests the
      entropy of a real seed. Seeds here are derived from a counter rather than drawn, so
      every figure reproduces exactly and a reviewer gets these numbers rather than
      similar ones.</p>

    <h3>Every test, on one list</h3>
    ${summaryTable}
    <div class="callout">
      <p>Reporting several tests and presenting only the comfortable ones is the oldest
        way to make a generator look good, so the list is complete and in a fixed order.</p>
      <p><strong>Every test is run twice</strong>, over independent sets of derived seeds.
        With ${data.summary.tests} tests there is roughly a ${Math.round(data.summary.chanceOfOneLow * 100)}% chance that something lands below
        0.05 on an entirely honest generator, and a replication is a better answer to that
        than an argument about multiple comparisons. Low in one column and healthy in the
        other is noise, visibly. Low in both is a finding.</p>
      ${data.summary.low.length === 0
        ? '<p>Nothing came back below 0.05 in the first column.</p>'
        : `<p><strong>Below 0.05 in the first column:</strong> ${data.summary.low.map((reading) => `${escape(reading.name)} (${pv(reading.p)}, replication ${pv(reading.confirmP)})`).join('; ')}.
        ${data.summary.lowInBoth.length === 0
          ? 'None is low in both columns, which is what noise looks like.'
          : `<strong>Low in both:</strong> ${escape(data.summary.lowInBoth.map((reading) => reading.name).join(', '))}. That is a finding, not noise.`}</p>`}
    </div>

    <h3>Uniformity over ${g(u.draws)} draws</h3>
<pre>expected per outcome  ${g(u.expectedPerOutcome)}
observed range        ${u.min} to ${u.max}
outcomes never seen   ${u.empty}
chi-square            ${fixed(u.chiSquare, 2)} on ${g(u.df)} degrees of freedom
p (upper tail)        ${pv(u.pUpper)}
p (two-sided)         ${pv(u.p)}</pre>

    <h3>Each digit position on its own</h3>
    ${positionTable}
    <p>A result can be uniform overall while a single position is not, and that would be a
      readable pattern long before the aggregate moved.</p>

    <h3>Does one draw say anything about the next</h3>
<pre>consecutive pairs     ${g(sample.serial.pairs)}
chi-square (10 &times; 10)  ${fixed(sample.serial.chiSquare, 2)} on ${sample.serial.df} degrees of freedom
p (upper tail)        ${pv(sample.serial.pUpper)}
serial correlation    r = ${sci(sample.correlation.r, 3)}, standard error ${sci(sample.correlation.standardError, 2)}
                      z = ${fixed(sample.correlation.z, 3)}, p = ${pv(sample.correlation.p)}</pre>

    <h3>One bit of the seed changed</h3>
<pre>pairs tested          ${g(avalanche.draws)}
results that agreed   ${avalanche.agreed}   (expected ${g(avalanche.expected)}, being 1 in 1,000)
z                     ${fixed(avalanche.z, 3)}
p                     ${pv(avalanche.p)}</pre>
    <p>A near-miss on the seed must not be a near-miss on the number. If a leaked fragment
      of a seed narrowed the outcome, the custody scheme would be protecting something
      that no longer needed protecting.</p>

    <h3>The same seed under two different draw keys</h3>
<pre>pairs tested          ${g(keySeparation.draws)}
results that agreed   ${keySeparation.agreed}   (expected ${g(keySeparation.expected)})
z                     ${fixed(keySeparation.z, 3)}
p                     ${pv(keySeparation.p)}</pre>
    <p>A seed revealed for Monday must say nothing about Tuesday, or publishing one result
      would leak the next.</p>
  </section>

  <section>
    <h2>Operating rules</h2>
    <ul>
      <li><strong>One seed per draw.</strong> Never reused, never derived from a previous seed.</li>
      <li><strong>Commit before opening.</strong> The product refuses a draw whose
        commitment is later than its opening time.</li>
      <li><strong>Reveal after the draw time</strong>, on the server clock, and never on a
        clock a caller supplies.</li>
      <li><strong>A cancelled draw keeps its commitment.</strong> Publish the seed anyway,
        so the record shows what would have been drawn and the cancellation cannot hide it.</li>
      <li><strong>The seed of an unrevealed draw exists only inside the sealed envelope.</strong></li>
    </ul>
  </section>

  <section>
    <h2>What a reviewer should attack</h2>
    <ol>
      <li><strong>Take a revealed draw and recompute it.</strong> The commitment, the HMAC,
        the rejection, the modulo. Everything needed is public after the reveal.</li>
      <li><strong>Try to reveal a different seed.</strong> The commitment check refuses it,
        inside the write transaction, before any payout is computed.</li>
      <li><strong>Check the commitment timestamp against the opening time</strong> on every
        draw in the journal. That ordering is the whole guarantee, and it is the thing
        worth auditing rather than the hash function.</li>
      <li><strong>Run your own suite.</strong> The section above is diligence, not a
        substitute. The mapping is deterministic, so you can generate as many results as
        you need from seeds of your own choosing.</li>
    </ol>
  </section>

  <p class="footer">Generated from the draw module by <code>npm run rng</code> &mdash; not written
    by hand, and continuous integration fails if it is not current.</p>
`
  });
}

module.exports.html = html;
