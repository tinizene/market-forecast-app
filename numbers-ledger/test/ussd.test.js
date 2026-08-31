'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const { Operator } = require('../src/operator.js');
const { Auth } = require('../src/http/auth.js');
const { UssdEngine, MAX_SCREEN, playerIdFromMsisdn } = require('../src/ussd/engine.js');
const draws = require('../src/draws.js');

// The channel is handed the game's own catalogue and its own rule check. The
// ledger holds no bet types, so USSD does not invent any either.
const game = require('../../africa-numbers/game.js');

const AT = '2026-08-27T10:00:00Z';
const DRAW_AT = '2026-08-27T19:00:00Z';
const MSISDN = '+231770000001';
const PLAYER = playerIdFromMsisdn(MSISDN);
const SESSION = 'ATUid_0001';

let clock = AT;
const now = () => clock;

function rig({ fund = 1_000_00, pin = '1234', openDraw = true } = {}) {
  clock = AT;
  const operator = new Operator();
  const auth = new Auth({ ledger: operator.ledger });
  const sent = [];
  const engine = new UssdEngine({
    operator, auth, now,
    betTypes: game.BET_TYPES,
    validateSelection: (bet) => game.validateBet({ ...bet, stakeCents: 1, balanceCents: 1 }),
    notify: (payload) => sent.push(payload)
  });

  operator.injectCapital({ id: 'cap', at: AT, amountMinor: 1_000_000_00 });
  operator.buyFloat({ id: 'f', at: AT, agentId: 'ag-1', paidMinor: 100_000_00, floatMinor: 100_000_00 });
  if (fund > 0) operator.cashIn({ id: 'in', at: AT, agentId: 'ag-1', playerId: PLAYER, amountMinor: fund });
  if (pin) auth.setPlayerPin({ id: 'pin', at: AT, playerId: PLAYER, pin });

  let draw = null;
  if (openDraw) {
    const seed = draws.createSeed();
    const schedule = draws.schedule({ drawKey: 'D1', drawAt: DRAW_AT, opensAt: AT });
    operator.openDraw({ id: 'open', at: AT, drawKey: 'D1', commitment: draws.commit('D1', seed), ...schedule });
    draw = { key: 'D1', seed, ...schedule, result: draws.resultFromSeed('D1', seed) };
  }

  return { operator, auth, engine, sent, draw };
}

/** Drive a session through a list of inputs, returning every reply. */
function drive(engine, inputs, { sessionId = SESSION, msisdn = MSISDN } = {}) {
  const replies = [engine.handle({ sessionId, msisdn })];
  for (const input of inputs) {
    if (replies[replies.length - 1].done) break;
    replies.push(engine.handle({ sessionId, msisdn, input }));
  }
  return replies;
}

const last = (replies) => replies[replies.length - 1];

// Straight is the first bet type in the catalogue, $1 the first stake.
const PLACE_A_BET = ['1', '1', '472', '1', '1234'];

// ------------------------------------------------------------- the happy path

test('a bet takes five keypresses and one of them is the PIN', () => {
  const { operator, engine, sent } = rig();
  const replies = drive(engine, PLACE_A_BET);

  assert.equal(replies.length, 6, 'the dial plus five inputs');
  assert.ok(replies.slice(0, 5).every((r) => r.reply.startsWith('CON ')), 'four screens keep the session open');
  assert.ok(last(replies).reply.startsWith('END '));
  assert.match(last(replies).reply, /Bet placed: Straight 472 for 1\.00/);

  assert.equal(operator.ledger.balance('PLAYER_WALLET:' + PLAYER), 999_00);
  assert.equal(operator.ledger.readState('bet', `ussd-${SESSION}`).stakeMinor, 1_00);

  // The confirmation goes to the player's own number, from the operator (F1).
  assert.equal(sent.length, 1);
  assert.equal(sent[0].msisdn, MSISDN);
  assert.match(sent[0].text, /Bet placed/);
});

test('every reachable screen fits in a USSD page', () => {
  const { engine } = rig();
  const seen = [];
  const record = (replies) => replies.forEach((r) => seen.push(r.reply));

  record(drive(engine, PLACE_A_BET));
  record(drive(engine, ['1', '0'], { sessionId: 's2' }));                 // back from bet type
  record(drive(engine, ['1', '2', '4', '0'], { sessionId: 's3' }));       // back from stake
  record(drive(engine, ['2', '1234'], { sessionId: 's4' }));              // balance
  record(drive(engine, ['3'], { sessionId: 's5' }));                      // last result
  record(drive(engine, ['9'], { sessionId: 's6' }));                      // bad menu choice
  record(drive(engine, ['1', '1', '47'], { sessionId: 's7' }));           // wrong digit count
  record(drive(engine, ['1', '6', '44'], { sessionId: 's8' }));           // a rule refusal
  record(drive(engine, ['1', '1', '472', '1', '0000'], { sessionId: 's9' })); // wrong PIN

  assert.ok(seen.length > 20, `walked ${seen.length} screens`);
  for (const reply of seen) {
    const body = reply.slice(4);
    assert.ok(body.length <= MAX_SCREEN, `${body.length} chars: ${JSON.stringify(body)}`);
  }
});

// --------------------------------------------------- a dropped session is free

test('a session dropped before the PIN leaves absolutely nothing behind', () => {
  const { operator, engine } = rig();
  const before = operator.ledger.size;

  // Every prefix of the flow, each abandoned one step earlier.
  for (let stop = 0; stop < PLACE_A_BET.length; stop++) {
    drive(engine, PLACE_A_BET.slice(0, stop), { sessionId: `drop-${stop}` });
  }

  assert.equal(operator.ledger.size, before, 'no transaction was written');
  assert.equal(operator.ledger.balance('PLAYER_WALLET:' + PLAYER), 1_000_00, 'nothing was charged');
  assert.equal(operator.ledger.listState('bet').length, 0, 'and no partial bet exists');
});

test('an expired session is a non-event, and says so', () => {
  const { operator, engine } = rig();
  drive(engine, ['1', '1', '472', '1'], { sessionId: 'slow' });

  clock = '2026-08-27T10:05:00Z';   // five minutes later, well past the timeout
  const res = engine.handle({ sessionId: 'slow', msisdn: MSISDN, input: '1234' });

  assert.match(res.reply, /^END .*timed out.*Nothing was charged/);
  assert.equal(operator.ledger.balance('PLAYER_WALLET:' + PLAYER), 1_000_00);
  assert.equal(engine.sessionCount, 0, 'and the session is gone');
});

test('sessions are swept, so an abandoned one does not sit in memory for ever', () => {
  const { engine } = rig();
  drive(engine, ['1'], { sessionId: 'a' });
  drive(engine, ['1'], { sessionId: 'b' });
  assert.equal(engine.sessionCount, 2);

  assert.equal(engine.sweep('2026-08-27T10:00:30Z'), 2, 'still inside the window');
  assert.equal(engine.sweep('2026-08-27T10:10:00Z'), 0);
});

// ------------------------------------------------------------ the server clock

test('the cutoff is judged on the server clock, at the moment the PIN lands', () => {
  const { operator, engine, draw } = rig();

  // Dial half a minute before the cutoff, so the session is still alive when
  // the confirmation lands after it. A session opened before the cutoff and
  // confirmed after it is exactly the case the design calls out.
  clock = '2026-08-27T18:54:30Z';
  drive(engine, ['1', '1', '472', '1'], { sessionId: 'late' });

  clock = draw.cutoffAt;
  const res = engine.handle({ sessionId: 'late', msisdn: MSISDN, input: '1234' });

  assert.match(res.reply, /^END .*closed at/);
  assert.equal(operator.ledger.balance('PLAYER_WALLET:' + PLAYER), 1_000_00, 'nothing charged');
  assert.equal(operator.ledger.listState('bet').length, 0);
});

test('with no draw open, the menu says so and play is refused', () => {
  const { engine } = rig({ openDraw: false });
  const replies = drive(engine, ['1']);
  assert.match(replies[0].reply, /No draw open/);
  assert.match(last(replies).reply, /^END .*No draw is open/);
});

// -------------------------------------------------------------------- the PIN

test('a wrong PIN ends the session and charges nothing', () => {
  const { operator, engine } = rig();
  const res = last(drive(engine, ['1', '1', '472', '1', '9999']));

  assert.match(res.reply, /^END Wrong PIN\. Nothing was charged\./);
  assert.equal(operator.ledger.balance('PLAYER_WALLET:' + PLAYER), 1_000_00);
});

test('a locked PIN is told plainly, and stays locked across sessions', () => {
  const { engine } = rig();
  for (const attempt of [1, 2, 3]) {
    drive(engine, ['1', '1', '472', '1', '0000'], { sessionId: `bad-${attempt}` });
  }
  const res = last(drive(engine, PLACE_A_BET, { sessionId: 'good' }));
  assert.match(res.reply, /PIN is locked/);
});

test('a balance is account data, so it sits behind the PIN', () => {
  const { engine } = rig();
  const prompted = drive(engine, ['2']);
  assert.match(prompted[1].reply, /^CON Enter your PIN/);

  assert.match(last(drive(engine, ['2', '9999'], { sessionId: 's-bad' })).reply, /^END Wrong PIN/);
  assert.match(last(drive(engine, ['2', '1234'], { sessionId: 's-ok' })).reply, /^END Balance 1000\.00\./);
});

test('the last result is public, because it already is', () => {
  const { operator, engine, draw } = rig();
  assert.match(last(drive(engine, ['3'])).reply, /No result published yet/);

  clock = DRAW_AT;
  operator.revealDraw({ id: 'rv', at: DRAW_AT, drawKey: draw.key, seed: draw.seed });
  assert.match(last(drive(engine, ['3'], { sessionId: 's2' })).reply, new RegExp(`Draw D1: ${draw.result}`));
});

// ------------------------------------------------------------- bad navigation

test('an invalid entry re-prompts, and three of them end the session', () => {
  const { engine } = rig();
  const replies = drive(engine, ['7', '8', '9']);
  assert.match(replies[1].reply, /^CON Not a choice/);
  assert.match(replies[2].reply, /^CON Not a choice/);
  assert.match(replies[3].reply, /^END Too many invalid entries/);
});

test('a selection the game refuses is caught while it is still free', () => {
  const { operator, engine } = rig();
  // Two Digits (6) is priced for two DIFFERENT digits; 44 is a different bet.
  const replies = drive(engine, ['1', '6', '44']);
  assert.match(last(replies).reply, /different digits/);
  assert.ok(!last(replies).done, 're-prompted rather than ended');
  assert.equal(operator.ledger.listState('bet').length, 0);
});

test('the wrong number of digits is refused before the stake is asked for', () => {
  const { engine } = rig();
  const replies = drive(engine, ['1', '1', '47']);
  assert.match(last(replies).reply, /Needs exactly 3 digits/);
  assert.ok(!last(replies).done);
});

test('0 goes back without losing the session', () => {
  const { operator, engine } = rig();
  // Into bet type, back to the menu, then all the way through.
  const replies = drive(engine, ['1', '0', '1', '1', '472', '1', '1234']);
  assert.match(last(replies).reply, /Bet placed/);
  assert.equal(operator.ledger.balance('PLAYER_WALLET:' + PLAYER), 999_00);
});

// ------------------------------------------------------------------- the wallet

test('the wallet belongs to a number, not a handset', () => {
  const { operator, engine } = rig();
  // The same session id from a different number is not the same caller.
  drive(engine, ['1', '1', '472', '1'], { sessionId: 'shared' });
  const hijack = engine.handle({ sessionId: 'shared', msisdn: '+231770009999', input: '1234' });

  assert.match(hijack.reply, /^END .*timed out/);
  assert.equal(operator.ledger.balance('PLAYER_WALLET:' + PLAYER), 1_000_00, 'the wallet was not touched');
});

test('a gateway retrying the same session cannot buy the ticket twice', () => {
  const { operator, engine } = rig();
  drive(engine, PLACE_A_BET);
  assert.equal(operator.ledger.balance('PLAYER_WALLET:' + PLAYER), 999_00);

  // The gateway replays the whole session after a timeout on its side.
  drive(engine, PLACE_A_BET);
  assert.equal(operator.ledger.balance('PLAYER_WALLET:' + PLAYER), 999_00, 'charged once');
  assert.equal(operator.ledger.listState('bet').length, 1);
});

test('a player with no money is refused at the PIN, not before', () => {
  const { operator, engine } = rig({ fund: 50 });
  const res = last(drive(engine, PLACE_A_BET));
  assert.match(res.reply, /^END .*cannot stake/);
  assert.equal(operator.ledger.balance('PLAYER_WALLET:' + PLAYER), 50);
});

test('protection reaches the channel without the channel knowing about it', () => {
  const { operator, engine } = rig();
  operator.setProtection({ id: 'prot', at: AT, dailyStakeMinor: 50 });

  const res = last(drive(engine, PLACE_A_BET));
  assert.match(res.reply, /daily limit/);
  assert.equal(operator.ledger.balance('PLAYER_WALLET:' + PLAYER), 1_000_00);
});

test('an excluded player is told, and the wording does not moralise', () => {
  const { operator, engine } = rig();
  operator.excludePlayer({ id: 'ex', at: AT, playerId: PLAYER });

  const res = last(drive(engine, PLACE_A_BET));
  assert.match(res.reply, /self-excluded/);
  assert.equal(operator.ledger.balance('PLAYER_WALLET:' + PLAYER), 1_000_00);
});

// -------------------------------------------------------------- the unexpected

test('an unexpected failure tells the handset nothing useful', () => {
  const { engine, operator } = rig();
  // A bet id collision the engine cannot anticipate: something is wrong, and
  // the player learns only that nothing was charged.
  operator.placeBet = () => { throw new Error('ECONNRESET reading from 10.0.0.7:5432'); };

  const res = last(drive(engine, PLACE_A_BET));
  assert.equal(res.reply, 'END Something went wrong. Nothing was charged.');
  assert.ok(!res.reply.includes('10.0.0.7'));
});

test('a request with no session id or number is refused outright', () => {
  const { engine } = rig();
  assert.match(engine.handle({ sessionId: '', msisdn: MSISDN }).reply, /^END Service unavailable/);
  assert.match(engine.handle({ sessionId: 'x', msisdn: '' }).reply, /^END Service unavailable/);
  assert.equal(engine.sessionCount, 0);
});
