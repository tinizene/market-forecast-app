'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const events = require('../scripts/events.js');
const { markdown, html, GAPS } = require('../scripts/render-events.js');

const DOCS = path.resolve(__dirname, '..', 'docs');

// ------------------------------------------------------- the two directions

/**
 * The check that makes the catalogue worth submitting. A list of events written
 * by hand is exactly the document that quietly stops matching the code, so it
 * is compared against the source in one direction and against a full exercise
 * of the system in the other.
 */
test('every event kind the code can write is catalogued', () => {
  const data = events.reconcile();
  assert.deepEqual(data.undocumented, [],
    'add an entry in scripts/events.js saying what it means and why it matters');
});

test('every catalogued kind still exists in the code', () => {
  assert.deepEqual(events.reconcile().stale, []);
});

/**
 * A transaction filed as an event, or the reverse, is a catalogue that
 * misdescribes the durability of a record. Checked by running the system and
 * seeing which of the two it lands in.
 */
test('every kind is filed under the record it is actually written to', () => {
  assert.deepEqual(events.reconcile().misfiled, []);
});

test('every catalogued kind was observed being written', () => {
  const data = events.reconcile();
  assert.deepEqual(data.unexercised, [],
    'a documented kind no scenario reaches is a claim without evidence');
  assert.equal(data.counts.exercised, data.counts.catalogued);
});

/**
 * The discovery has to find kinds however they are written. Two are chosen by a
 * ternary and two more are passed as an argument, so a scan that only looked
 * for `kind: '...'` would have missed a PIN lockout and a mobile money timeout.
 */
test('discovery finds kinds that are not written as a literal property', () => {
  const found = events.discover().map((entry) => entry.kind);
  for (const awkward of ['PIN_LOCKED', 'PIN_FAILED', 'MM_ACCEPTED', 'MM_UNRESOLVED']) {
    assert.ok(found.includes(awkward), `${awkward} was not discovered`);
  }
});

test('discovery does not mistake an account or a status for an event', () => {
  const found = events.discover().map((entry) => entry.kind);
  for (const notAKind of ['SETTLEMENT', 'PLAYER_WALLET', 'LIABILITY', 'PENDING', 'SUCCEEDED', 'LRD', 'GET']) {
    assert.ok(!found.includes(notAKind), `${notAKind} is not an event kind`);
  }
});

// -------------------------------------------------------------- the entries

test('every entry says what it means, who it is about, and where it lives', () => {
  for (const entry of events.CATALOGUE) {
    assert.match(entry.kind, /^[A-Z][A-Z0-9_]+$/);
    assert.ok(entry.title.length > 8, `${entry.kind} has a title`);
    assert.ok(entry.what.length > 40, `${entry.kind} says what it means`);
    assert.ok(['journal', 'events'].includes(entry.record), `${entry.kind} names its record`);
    assert.ok(['operator', 'runner', 'player', 'provider', 'any'].includes(entry.subject), entry.kind);
    assert.ok(entry.group, `${entry.kind} is grouped`);
  }
});

test('no kind is catalogued twice', () => {
  const kinds = events.CATALOGUE.map((entry) => entry.kind);
  assert.equal(new Set(kinds).size, kinds.length);
});

// ------------------------------------------------------ what a log must not hold

/**
 * The call log is shipped elsewhere and read by people who are not the
 * operator, so it can never carry a working credential or anything a player
 * told the service in confidence. The catalogue states that; this checks the
 * statement is still true of the code.
 */
test('the call log carries no credential and no body', () => {
  const app = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'http', 'app.js'), 'utf8');
  const record = app.slice(app.indexOf('function record('), app.indexOf('function record(') + 1400);

  for (const forbidden of ['ctx.body', 'rawBody', 'answer.body', 'authorization', 'pin']) {
    assert.ok(!record.includes(forbidden), `the call log writes ${forbidden}`);
  }
  assert.ok(record.includes('tokenId'), 'but it does record which token, as a digest');
});

// ---------------------------------------------------------------- the gaps

/**
 * The section a laboratory reads first. A generator cannot enumerate an
 * absence, so this part is written by hand - and an empty gap list would mean
 * nobody had looked rather than that there was nothing to find.
 */
test('the catalogue says what is not recorded', () => {
  assert.ok(GAPS.length >= 5, 'a short gap list means nobody looked');
  for (const gap of GAPS) {
    assert.ok(gap.title.length > 10);
    assert.ok(gap.detail.length > 80, `${gap.title} needs more than a headline`);
  }

  const titles = GAPS.map((gap) => gap.title.toLowerCase()).join(' ');
  assert.match(titles, /who did it/, 'the actor gap is the first one a reviewer asks about');
  assert.match(titles, /cryptography/, 'and the journal is append-only by storage, not by hash chain');
});

// ------------------------------------------------------------- the document

test('the published catalogue is the one this tree produces', () => {
  const data = events.reconcile();
  const onDisk = fs.readFileSync(path.join(DOCS, 'events-catalogue.md'), 'utf8');
  assert.equal(onDisk, markdown(data), 'run npm run events');
});

test('every kind reaches the page, in both renderings', () => {
  const data = events.reconcile();
  const asMarkdown = markdown(data);
  const asHtml = html(data);

  for (const entry of events.CATALOGUE) {
    assert.ok(asMarkdown.includes(entry.kind), `${entry.kind} is in the markdown`);
    assert.ok(asHtml.includes(entry.kind), `${entry.kind} is in the page`);
  }
  assert.ok(asHtml.startsWith('<title>'));
  assert.ok(!asHtml.includes('<html'), 'the artifact host supplies the shell');
});
