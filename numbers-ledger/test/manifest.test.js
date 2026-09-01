'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const manifest = require('../src/manifest.js');
const { build, label } = require('../src/build.js');

const REPO = path.resolve(__dirname, '..', '..');

/** A miniature tree with the same shape the real scope describes. */
function tree() {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'an-manifest-'));
  const write = (relative, contents) => {
    const absolute = path.join(base, relative);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, contents);
    return absolute;
  };

  write('numbers-ledger/src/ledger.js', 'module.exports = { post() {} };\n');
  write('numbers-ledger/src/http/app.js', 'module.exports = { createApp() {} };\n');
  write('numbers-ledger/src/console/index.html', '<title>console</title>\n');
  write('numbers-ledger/src/console/console-core.js', 'root.ANConsole = {};\n');
  write('numbers-ledger/src/console/console.js', 'start();\n');
  // This pair exists to pin the sort order and for no other reason. An
  // uppercase initial sorts before a lowercase one by byte and after it by
  // most collations, so 'Widget.js' and 'app.js' come out in a different order
  // under LC_ALL=C sort than under localeCompare - which is exactly the
  // divergence that would silently break the coreutils reproduction.
  write('numbers-ledger/src/console/Widget.js', 'export {};\n');
  write('numbers-ledger/src/console/app.js', 'boot();\n');
  write('numbers-ledger/bin/console-server.js', 'main();\n');
  write('numbers-ledger/package.json', '{ "name": "numbers-ledger" }\n');
  write('africa-numbers/game.js', 'var BET_TYPES = {};\n');
  write('numbers-ledger/test/ledger.test.js', 'test("x", () => {});\n');
  write('numbers-ledger/README.md', '# numbers-ledger\n');
  write('africa-numbers/game.test.js', 'test("y", () => {});\n');

  return { base, write, at: (relative) => path.join(base, relative) };
}

// ------------------------------------------------------------ determinism

test('the same tree always produces the same build id', () => {
  const { base } = tree();
  const first = manifest.buildManifest({ base, at: '2026-01-01T00:00:00Z' });
  const second = manifest.buildManifest({ base, at: '2027-06-30T12:34:56Z' });

  assert.equal(first.buildId, second.buildId);
  assert.notEqual(first.generatedAt, second.generatedAt, 'the clock moved and the build did not');
  assert.match(first.buildId, /^[0-9a-f]{64}$/);
});

/**
 * The digest format is the one `sha256sum` prints, so an inspector who trusts
 * none of this code can reproduce the build id with coreutils. That is the
 * whole defence against a tampered verifier, which cannot vouch for itself.
 */
test('the build id is reproducible with sha256sum and sort', (t) => {
  const probe = spawnSync('sha256sum', ['--version']);
  if (probe.error) return t.skip('no sha256sum on this machine');

  const { base } = tree();
  const built = manifest.buildManifest({ base });

  const files = built.sections.runtime.files.map((file) => file.path).join('\n');
  const reproduced = spawnSync(
    'sh',
    ['-c', 'LC_ALL=C sort | xargs sha256sum | sha256sum | cut -d" " -f1'],
    { cwd: base, input: `${files}\n`, encoding: 'utf8' }
  );

  assert.equal(reproduced.stdout.trim(), built.buildId);
});

test('the digest is over the files, in path order, whatever order they arrive in', () => {
  const entries = [
    { path: 'b.js', sha256: 'bb' },
    { path: 'a.js', sha256: 'aa' }
  ];
  const expected = crypto.createHash('sha256').update('aa  a.js\nbb  b.js\n', 'utf8').digest('hex');

  assert.equal(manifest.digestOf(entries), expected);
  assert.equal(manifest.digestOf([...entries].reverse()), expected);
});

// ------------------------------------------------- what does and does not move it

test('a byte of runtime changes the build id', () => {
  const { base, at } = tree();
  const before = manifest.buildManifest({ base }).buildId;

  fs.appendFileSync(at('numbers-ledger/src/ledger.js'), '// a comment\n');
  assert.notEqual(manifest.buildManifest({ base }).buildId, before);
});

/**
 * Evidence is pinned so a submitted test suite is identifiable, and kept out of
 * the build id so that fixing a typo in the README is not a new build needing a
 * new certificate.
 */
test('a change to a test or the README is not a new build', () => {
  const { base, at } = tree();
  const before = manifest.buildManifest({ base });

  fs.appendFileSync(at('numbers-ledger/README.md'), 'A clarification.\n');
  const after = manifest.buildManifest({ base });

  assert.equal(after.buildId, before.buildId, 'same software');
  assert.notEqual(after.sections.evidence.digest, before.sections.evidence.digest, 'different evidence');
});

// ------------------------------------------------------------ verification

test('an untouched tree verifies', () => {
  const { base } = tree();
  const result = manifest.verifyManifest({ base, manifest: manifest.buildManifest({ base }) });

  assert.equal(result.ok, true);
  assert.equal(result.runtimeMatches, true);
  assert.deepEqual(result.problems, []);
});

test('a changed file is named, with both digests', () => {
  const { base, at } = tree();
  const built = manifest.buildManifest({ base });
  fs.writeFileSync(at('numbers-ledger/src/http/app.js'), 'module.exports = { createApp() { steal(); } };\n');

  const result = manifest.verifyManifest({ base, manifest: built });
  assert.equal(result.ok, false);
  const problem = result.problems.find((p) => p.kind === 'changed');
  assert.equal(problem.path, 'numbers-ledger/src/http/app.js');
  assert.notEqual(problem.expected, problem.actual);
  assert.equal(result.sections.runtime.matches, false);
});

test('a deleted file is named', () => {
  const { base, at } = tree();
  const built = manifest.buildManifest({ base });
  fs.rmSync(at('numbers-ledger/src/console/index.html'));

  const result = manifest.verifyManifest({ base, manifest: built });
  assert.equal(result.problems.some((p) => p.kind === 'missing' && /index\.html$/.test(p.path)), true);
});

/**
 * The property that lets a manifest prove an absence. A verifier that only
 * checks the files it knows about cannot say anything about a file that was
 * added - and a build with an extra file in it is not the build that was
 * certified, whatever that file contains.
 */
test('a file that is present and unlisted is reported', () => {
  const { base, write } = tree();
  const built = manifest.buildManifest({ base });

  // Deliberately an extension the generator's own pattern would skip: at
  // verification the walk is unfiltered, or the check could be evaded by
  // choosing a file name.
  write('numbers-ledger/src/notes.txt', 'anything at all\n');
  write('numbers-ledger/src/extra/helper.js', 'module.exports = {};\n');

  const result = manifest.verifyManifest({ base, manifest: built });
  const unexpected = result.problems.filter((p) => p.kind === 'unexpected').map((p) => p.path).sort();
  assert.deepEqual(unexpected, ['numbers-ledger/src/extra/helper.js', 'numbers-ledger/src/notes.txt']);
  assert.equal(result.ok, false);
});

// ------------------------------------------------------ forbidden capability

test('a forbidden capability in the runtime tree fails the check and is named', () => {
  const { base, write } = tree();
  const built = manifest.buildManifest({ base });
  write('numbers-ledger/src/ledger.js', 'function forceResult(draw, digits) { draw.result = digits; }\n');

  const result = manifest.verifyManifest({ base, manifest: built });
  const hit = result.problems.find((p) => p.kind === 'forbidden');
  assert.equal(hit.path, 'numbers-ledger/src/ledger.js');
  assert.equal(hit.symbol, 'forceResult', 'the token comes out of the file, so it can still be named');
  assert.equal(result.runtimeMatches, false);
});

test('the same capability in a test file is fine - tests are not the build', () => {
  const { base, write } = tree();
  write('numbers-ledger/test/ledger.test.js', 'const forceResult = () => {};\n');
  const built = manifest.buildManifest({ base });

  const result = manifest.verifyManifest({ base, manifest: built });
  assert.equal(result.ok, true, 'evidence is pinned, not policed');
});

/**
 * The first version of the scanner listed the banned words in plain text and
 * failed on itself, which left a choice between exempting the scanner from its
 * own rule and never writing the words down. Hashing removed the exemption, and
 * this test is what stops somebody putting the words back.
 */
test('the scanner does not contain the words it forbids', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'manifest.js'), 'utf8');
  const built = manifest.buildManifest({ base: REPO });

  for (const token of source.match(/[A-Za-z_$][A-Za-z0-9_$]*/g)) {
    const digest = crypto.createHash('sha256').update(token, 'utf8').digest('hex');
    assert.ok(!built.forbiddenSymbols.includes(digest), `manifest.js names "${token}"`);
  }
});

// ------------------------------------------------------------- the real tree

test('this repository verifies against its own manifest', () => {
  const manifestPath = path.join(__dirname, '..', 'MANIFEST.json');
  if (!fs.existsSync(manifestPath)) {
    assert.fail('No MANIFEST.json. Run: npm run manifest');
  }
  const onDisk = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const result = manifest.verifyManifest({ base: REPO, manifest: onDisk });

  assert.deepEqual(result.problems, [], 'the tree and its manifest disagree - run npm run manifest');
  assert.equal(result.buildId, onDisk.buildId);
});

test('the verification command exits non-zero on a tree that does not match', () => {
  const { base, write } = tree();
  const built = manifest.buildManifest({ base });
  const manifestPath = path.join(base, 'MANIFEST.json');
  fs.writeFileSync(manifestPath, manifest.serialise(built));

  const clean = spawnSync(process.execPath, [
    path.join(__dirname, '..', 'bin', 'verify-build.js'), '--root', base, '--manifest', manifestPath
  ], { encoding: 'utf8' });
  assert.equal(clean.status, 0, clean.stdout + clean.stderr);
  assert.match(clean.stdout, /Nothing has changed/);

  write('numbers-ledger/src/ledger.js', 'module.exports = { post() { /* changed */ } };\n');
  const dirty = spawnSync(process.execPath, [
    path.join(__dirname, '..', 'bin', 'verify-build.js'), '--root', base, '--manifest', manifestPath
  ], { encoding: 'utf8' });
  assert.equal(dirty.status, 1);
  assert.match(dirty.stdout, /NOT the certified build/);
  assert.match(dirty.stdout, /CHANGED/);
});

// -------------------------------------------------------------- build identity

test('a process with no manifest says so rather than inventing a version', () => {
  const missing = path.join(os.tmpdir(), 'no-such-manifest.json');
  assert.equal(build(missing), null);
  assert.equal(label(missing), 'unversioned');
});

test('a process with a manifest reports the build it is running', () => {
  const { base } = tree();
  const built = manifest.buildManifest({ base });
  const manifestPath = path.join(base, 'MANIFEST.json');
  fs.writeFileSync(manifestPath, manifest.serialise(built));

  const reported = build(manifestPath);
  assert.equal(reported.id, built.buildId);
  assert.equal(reported.short, built.buildId.slice(0, 12));
  assert.equal(reported.runtimeFiles, built.sections.runtime.files.length);
});
