'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

/**
 * The build manifest: what software this is, and how anyone can check that the
 * software running is the software that was certified.
 *
 * A certificate names one build. The regulator then needs to confirm that
 * production is running that build and not something else, and the operator
 * needs to prove it without handing over source. Both come down to one number
 * that everybody can recompute.
 *
 * Three properties make this worth trusting.
 *
 * **The digest is reproducible without this code.** Each file contributes one
 * line in the format `sha256sum` already prints - two spaces between the digest
 * and the path - concatenated in byte order of path and hashed. An inspector
 * who trusts nothing here can reproduce it with coreutils:
 *
 *     find numbers-ledger/src numbers-ledger/bin -type f | LC_ALL=C sort \
 *       | xargs sha256sum | sha256sum
 *
 * That matters because a verifier cannot prove itself. This file is inside the
 * manifest it checks, so a tampered verifier would happily report success. The
 * defence is not cleverness, it is that the format is boring enough to check
 * another way.
 *
 * **The set is closed.** Verification walks the same directories and fails on a
 * file that is present and unlisted, not only on one that has changed. That is
 * what lets the manifest prove an *absence* - the reason it exists at all is to
 * demonstrate that code able to force a draw outcome is not in the certified
 * build, and a manifest that only checks the files it knows about cannot
 * demonstrate anything of the kind.
 *
 * **Evidence is pinned but does not move the build id.** Tests and
 * documentation are hashed so a submitted suite is identifiable, and kept out
 * of the runtime digest so that fixing a typo in the README is not a new build.
 */

const ALGORITHM = 'sha256';
const VERSION = 1;

/**
 * What is in the certified build, and what is merely submitted alongside it.
 *
 * Directories are walked in full: at verification every file found under one of
 * them must be listed, whatever its extension. The pattern below only decides
 * what gets picked up when the manifest is generated, so a stray file added
 * later is reported rather than quietly absorbed.
 */
const SCOPE = {
  runtime: [
    { dir: 'numbers-ledger/src', pattern: /\.(js|html|css|svg)$/ },
    { dir: 'numbers-ledger/bin', pattern: /\.js$/ },
    { file: 'numbers-ledger/package.json' },
    // The game's rules live in one place and the ledger holds no bet types, so
    // the certified build spans both packages. A payout table that could change
    // without changing the build id would make the build id meaningless.
    { file: 'africa-numbers/game.js' }
  ],
  evidence: [
    { dir: 'numbers-ledger/test', pattern: /\.js$/ },
    // The laboratory harness. Pinned, so the environment a tester was given is
    // identifiable, and outside the runtime section, so the code that can make
    // a draw land on a chosen number is provably not in the certified build.
    // No pattern: every file under it is listed, README included.
    { dir: 'numbers-ledger/lab' },
    { file: 'numbers-ledger/README.md' },
    { file: 'africa-numbers/game.test.js' }
  ]
};

/**
 * Identifiers that must not appear anywhere in the certified build, held as
 * hashes rather than as words.
 *
 * A laboratory needs to drive the system and force outcomes to exercise
 * payouts. That capability is the most dangerous thing this software could
 * contain, so it is built as code that is *absent* from the certified build
 * rather than disabled within it, and this list is how the manifest says so.
 * A flag called `allowForcedOutcomes` sitting in production, set to false, is a
 * finding; a build that cannot name the concept is an argument.
 *
 * The hashes are not obfuscation. The first version of this file listed the
 * words in plain text and the scanner immediately failed on itself, which left
 * a choice between exempting the scanner from its own rule - an exemption is
 * exactly the place a reviewer looks - and never writing the words down here at
 * all. Hashing takes the exemption away: this file cannot name what it
 * forbids, so it has no reason to be treated differently from any other.
 *
 * The banned words themselves are documented in the README, which is evidence
 * rather than runtime, and a match reports the token it found in the file it
 * found it in, so a failure is still readable.
 *
 * This is a tripwire, not a proof. It catches a capability somebody added and
 * named; it does not catch one assembled from string fragments. Its value is
 * that it makes the absence explicit and checkable, not that it is
 * unevadable.
 */
const FORBIDDEN_SYMBOL_HASHES = [
  '9152c4490a85e306ba8f89b3c7ae24d42b56be466eb52aea5882738d4e930ecb',
  'bbc916573bfee3475403657f11b9bc4c8eed07044e3ad11b4769e91a7759b23d',
  '128295bb82b41ec3c701af5ff889d9ae2de94bbad371b5c95c06161c121f7d17',
  '4c104b5a697572a86c56ad1cfcc6d2eb66801e32c9bafbd7aa46cc0b2e049fdb',
  'efe23cd14d84e327a8c9848d367acdb83e0e931ed60478823997caea149bbd2d',
  '37b9d46dec90f1193bd10592dbba0ad75c7a49af6b58d5099b7ab32a20fea805',
  '731b55100c400714cd7b19ef1df7934694dc6cdf975b5fe7431f7bc7caca49bc'
];

/** Identifier-shaped tokens, which is as much lexing as a tripwire needs. */
const TOKEN_RE = /[A-Za-z_$][A-Za-z0-9_$]*/g;

// ------------------------------------------------------------------ hashing

function hashBytes(buffer) {
  return crypto.createHash(ALGORITHM).update(buffer).digest('hex');
}

/**
 * The digest over a set of entries.
 *
 * Sorted by path as bytes, not by locale: `LC_ALL=C sort` and this must agree,
 * or the coreutils reproduction above stops working on the first path
 * containing a character a locale reorders.
 */
function digestOf(entries) {
  const lines = [...entries]
    .sort((a, b) => (Buffer.from(a.path, 'utf8').compare(Buffer.from(b.path, 'utf8'))))
    .map((entry) => `${entry[ALGORITHM]}  ${entry.path}\n`)
    .join('');
  return hashBytes(Buffer.from(lines, 'utf8'));
}

// ------------------------------------------------------------------ walking

/** Every file under a directory, relative to `base`, POSIX separators. */
function walkDirectory(base, relativeDir) {
  const absolute = path.join(base, relativeDir);
  if (!fs.existsSync(absolute)) return [];

  const out = [];
  const stack = [absolute];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const child = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(child);
      } else if (entry.isFile()) {
        out.push(path.relative(base, child).split(path.sep).join('/'));
      }
    }
  }
  return out;
}

/** Every path a section's rules cover, as it stands on disk right now. */
function pathsOnDisk(base, rules, { applyPattern = true } = {}) {
  const out = new Set();
  for (const rule of rules) {
    if (rule.file) {
      if (fs.existsSync(path.join(base, rule.file))) out.add(rule.file);
      continue;
    }
    for (const found of walkDirectory(base, rule.dir)) {
      if (!applyPattern || !rule.pattern || rule.pattern.test(found)) out.add(found);
    }
  }
  return [...out];
}

function entryFor(base, relative) {
  const bytes = fs.readFileSync(path.join(base, relative));
  return { path: relative, bytes: bytes.length, [ALGORITHM]: hashBytes(bytes) };
}

// --------------------------------------------------------------- generation

/**
 * @param {{base: string, at?: string}} options `base` is the repository root:
 *        the manifest spans two packages, because the rules and the ledger are
 *        both part of what was certified.
 */
function buildManifest({ base, at = new Date().toISOString() }) {
  const sections = {};
  for (const [name, rules] of Object.entries(SCOPE)) {
    const entries = pathsOnDisk(base, rules).map((relative) => entryFor(base, relative));
    entries.sort((a, b) => (Buffer.from(a.path, 'utf8').compare(Buffer.from(b.path, 'utf8'))));
    sections[name] = { digest: digestOf(entries), files: entries };
  }

  return {
    version: VERSION,
    algorithm: ALGORITHM,
    // Not part of any digest. A manifest regenerated tomorrow from the same
    // files is the same build, and a build id that changed with the clock
    // would prove nothing about the software.
    generatedAt: at,
    // The build id is the runtime digest and nothing else. Evidence is pinned
    // in its own section so a change to a test does not read as a new build.
    buildId: sections.runtime.digest,
    scope: SCOPE,
    forbiddenSymbols: FORBIDDEN_SYMBOL_HASHES,
    sections
  };
}

/** Stable on disk: sorted keys are already guaranteed by construction order. */
function serialise(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

// ------------------------------------------------------------ verification

/**
 * Check the tree against a manifest.
 *
 * Four kinds of problem, and they are different findings: a file that changed,
 * one that is gone, one that is present and unlisted, and a forbidden symbol.
 * The third is the one most verification tools omit and the one that carries
 * the argument about absence.
 */
function verifyManifest({ base, manifest }) {
  const problems = [];
  const sections = {};

  for (const [name, section] of Object.entries(manifest.sections)) {
    const listed = new Map(section.files.map((file) => [file.path, file]));
    // The pattern is deliberately not applied here: anything sitting in a
    // scanned directory has to be accounted for, whatever it is called.
    const found = new Set(pathsOnDisk(base, manifest.scope[name] || [], { applyPattern: false }));

    for (const [relative, file] of listed) {
      if (!found.has(relative)) {
        problems.push({ kind: 'missing', section: name, path: relative });
        continue;
      }
      const actual = entryFor(base, relative);
      if (actual[manifest.algorithm] !== file[manifest.algorithm]) {
        problems.push({
          kind: 'changed', section: name, path: relative,
          expected: file[manifest.algorithm], actual: actual[manifest.algorithm]
        });
      }
    }

    for (const relative of found) {
      if (!listed.has(relative)) problems.push({ kind: 'unexpected', section: name, path: relative });
    }

    const present = section.files
      .filter((file) => fs.existsSync(path.join(base, file.path)))
      .map((file) => entryFor(base, file.path));
    sections[name] = {
      expected: section.digest,
      actual: digestOf(present),
      matches: digestOf(present) === section.digest && found.size === listed.size
    };
  }

  for (const hit of scanForbidden({ base, manifest })) problems.push(hit);

  const runtime = sections.runtime || { matches: false };
  return {
    ok: problems.length === 0,
    buildId: manifest.buildId,
    runtimeMatches: runtime.matches && !problems.some((p) => p.section === 'runtime' || p.kind === 'forbidden'),
    sections,
    problems
  };
}

/**
 * Scan the runtime tree for a forbidden identifier.
 *
 * Every identifier-shaped token in every runtime file is hashed and compared
 * against the list. The scanner therefore never holds the words, and a hit can
 * still name the token, because the token came out of the file rather than out
 * of here.
 */
function scanForbidden({ base, manifest }) {
  const banned = new Set(manifest.forbiddenSymbols || []);
  if (!banned.size) return [];

  const hits = [];
  for (const file of (manifest.sections.runtime || { files: [] }).files) {
    const absolute = path.join(base, file.path);
    if (!fs.existsSync(absolute)) continue;
    const text = fs.readFileSync(absolute, 'utf8');
    const seen = new Set();
    for (const token of text.match(TOKEN_RE) || []) {
      if (seen.has(token)) continue;
      seen.add(token);
      if (banned.has(hashBytes(Buffer.from(token, 'utf8')))) {
        hits.push({ kind: 'forbidden', section: 'runtime', path: file.path, symbol: token });
      }
    }
  }
  return hits;
}

/** A short form for a log line or a screen. Twelve hex characters is plenty. */
function shortId(buildId) {
  return typeof buildId === 'string' ? buildId.slice(0, 12) : null;
}

module.exports = {
  ALGORITHM, VERSION, SCOPE, FORBIDDEN_SYMBOL_HASHES,
  buildManifest, serialise, verifyManifest, scanForbidden,
  digestOf, hashBytes, pathsOnDisk, walkDirectory, shortId
};
