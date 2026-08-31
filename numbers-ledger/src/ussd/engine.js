'use strict';

const draws = require('../draws.js');

/**
 * The USSD session engine.
 *
 * USSD is the primary channel, not a fallback: requiring a smartphone would
 * exclude most of the market. It is also a different medium from a browser,
 * and designing as though it were one produces something unusable on the
 * handsets it exists to serve. Five constraints shape everything here.
 *
 *   Roughly 182 characters per screen. Every reply is checked against that,
 *   and a test walks the whole reachable graph to prove none of them needs
 *   the truncation that exists only as a safety net.
 *
 *   A bet must be placeable in a handful of keypresses. It takes five:
 *   menu, bet type, number, stake, PIN. Each screen asks exactly one thing.
 *
 *   Sessions are short and can end without warning. All state lives here,
 *   against the session id, never on the handset - a resumed session cannot
 *   be trusted to carry its own history.
 *
 *   Drafts leave no trace. Session state is deliberately in memory and
 *   expires: "nothing written, nothing charged, no partial bet" is a promise
 *   that persisting a half-built bet would quietly break.
 *
 *   It carries no secrets. The PIN is visible on screen as it is typed and
 *   there is no confidentiality beyond the mobile network. So the PIN
 *   authorises a spend and never identifies the spender, and anything a
 *   shared handset should not reveal sits behind it.
 *
 * The bet is written at the instant the PIN is submitted, and only if the
 * server clock says that instant is before the cutoff. Everything earlier
 * costs nothing. A session that dies at any other step is a non-event, which
 * is what makes a dropped call unarguable afterwards.
 */

const MAX_SCREEN = 182;
const DEFAULT_TTL_MS = 120_000;
const MAX_MISSTEPS = 3;

/** CON keeps the session open; END closes it. The two words every gateway speaks. */
const CON = (text) => ({ reply: `CON ${clamp(text)}`, done: false });
const END = (text) => ({ reply: `END ${clamp(text)}`, done: true });

/**
 * A screen longer than the limit is a bug, not a runtime condition - the test
 * suite walks every reachable screen. This is the net under that, because a
 * truncated menu is survivable and a crashed session is not.
 */
function clamp(text) {
  return text.length <= MAX_SCREEN ? text : text.slice(0, MAX_SCREEN);
}

/** Money for a feature phone: no currency symbol, no thousands separator. */
function money(minor) {
  return (minor / 100).toFixed(2);
}

/** A party id has to survive the ledger's validation; a leading + does not. */
function playerIdFromMsisdn(msisdn) {
  return String(msisdn).replace(/[^0-9]/g, '');
}

class UssdEngine {
  #operator;
  #auth;
  #betTypes;
  #validateSelection;
  #stakes;
  #now;
  #ttl;
  #notify;
  #sessions = new Map();

  /**
   * @param {object} operator
   * @param {object} auth        for the PIN, which is the only thing that spends
   * @param {object} betTypes    the game's catalogue. The ledger holds no bet
   *        types of its own, so the channel does not invent any either - it is
   *        handed the same table the app and the tests use.
   * @param {number[]} stakes    offered stakes, in minor units
   * @param {(bet: {type: string, digits: string}) => {ok: boolean, message?: string}} [validateSelection]
   *        the game's own rule check, so a mispriced selection - a triple
   *        played as a box - is refused while it is still free, not after the
   *        PIN when the player believes the money has gone.
   * @param {(payload: {msisdn: string, text: string}) => void} [notify]
   *        the confirmation to the player's own number. It comes from the
   *        operator and not the runner's handset, which is the control that
   *        defeats the oldest fraud in the trade (F1).
   */
  constructor({ operator, auth, betTypes, validateSelection = null, stakes = [100, 200, 500, 1000],
                now = () => new Date().toISOString(), sessionTtlMs = DEFAULT_TTL_MS, notify = () => {} }) {
    if (!operator) throw new TypeError('UssdEngine needs an operator');
    if (!auth) throw new TypeError('UssdEngine needs an auth');
    if (!betTypes || Object.keys(betTypes).length === 0) throw new TypeError('UssdEngine needs a bet type catalogue');
    this.#operator = operator;
    this.#auth = auth;
    this.#betTypes = betTypes;
    this.#validateSelection = validateSelection;
    this.#stakes = stakes;
    this.#now = now;
    this.#ttl = sessionTtlMs;
    this.#notify = notify;
  }

  get sessionCount() {
    return this.#sessions.size;
  }

  // ------------------------------------------------------------------ screens

  #typeMenu() {
    const keys = Object.keys(this.#betTypes);
    const lines = keys.map((key, i) => `${i + 1} ${this.#betTypes[key].label} ${this.#betTypes[key].multiplier}x`);
    return { keys, text: `Pick a bet\n${lines.join('\n')}\n0 Back` };
  }

  #stakeMenu() {
    return `Stake\n${this.#stakes.map((s, i) => `${i + 1} ${money(s)}`).join('  ')}\n0 Back`;
  }

  /** The draw currently taking bets. Nothing can be staked without one. */
  #openDraw(at) {
    for (const [drawKey, draw] of this.#operator.ledger.listState('draw')) {
      if (draw && !draw.settled && !draw.result && draws.acceptsBetsAt(draw, at)) return drawKey;
    }
    return null;
  }

  // ------------------------------------------------------------------ session

  #session(sessionId, msisdn, at) {
    const existing = this.#sessions.get(sessionId);
    if (!existing) return null;
    if (Date.parse(at) - Date.parse(existing.touchedAt) > this.#ttl) {
      this.#sessions.delete(sessionId);
      return 'expired';
    }
    // The handset cannot vouch for itself: a session id replayed from another
    // number is a different caller, whatever the gateway says.
    if (existing.msisdn !== msisdn) return 'expired';
    existing.touchedAt = at;
    return existing;
  }

  #close(sessionId) {
    this.#sessions.delete(sessionId);
  }

  /** Drop every session older than the timeout. Cheap, and bounds the map. */
  sweep(at = this.#now()) {
    for (const [id, session] of this.#sessions) {
      if (Date.parse(at) - Date.parse(session.touchedAt) > this.#ttl) this.#sessions.delete(id);
    }
    return this.#sessions.size;
  }

  // ------------------------------------------------------------------ dispatch

  /**
   * One gateway request.
   *
   * @param {{sessionId: string, msisdn: string, input?: string}} request
   *        `input` is the latest keypress only. A gateway that sends the whole
   *        `1*2*472` history can pass its last segment: this engine keeps its
   *        own state and never reconstructs a session from what a handset
   *        echoes back.
   * @returns {{reply: string, done: boolean}}
   */
  handle({ sessionId, msisdn, input = '' }) {
    const at = this.#now();
    const text = String(input).trim();

    if (!sessionId || !msisdn) return END('Service unavailable. Please try again.');

    const found = this.#session(sessionId, msisdn, at);
    if (found === 'expired') {
      return END('Your session timed out. Nothing was charged. Please dial again.');
    }

    if (!found) {
      // A first request with input already in it is a gateway replaying a
      // dropped session. Start clean rather than guess where it got to.
      const session = { msisdn, playerId: playerIdFromMsisdn(msisdn), state: 'menu', draft: {}, missteps: 0, touchedAt: at };
      this.#sessions.set(sessionId, session);
      return CON(this.#welcome(session, at));
    }

    try {
      return this.#step(sessionId, found, text, at);
    } catch (error) {
      // A guard rejection is the player's answer; anything else is ours and
      // is not spelled out to a handset.
      this.#close(sessionId);
      const known = /cannot |not enough|is suspended|self-excluded|daily |closed at|does not open|has already|Unknown /i.test(error.message);
      return END(known ? error.message : 'Something went wrong. Nothing was charged.');
    }
  }

  #welcome(session, at) {
    const drawKey = this.#openDraw(at);
    session.draft.drawKey = drawKey;
    const header = drawKey ? `Draw ${drawKey}` : 'No draw open';
    return `${header}\n1 Play\n2 Balance\n3 Last result`;
  }

  #retry(session, sessionId, screen, note) {
    session.missteps += 1;
    if (session.missteps >= MAX_MISSTEPS) {
      this.#close(sessionId);
      return END('Too many invalid entries. Nothing was charged. Please dial again.');
    }
    return CON(`${note}\n${screen}`);
  }

  #step(sessionId, session, input, at) {
    switch (session.state) {
      case 'menu':
        return this.#atMenu(sessionId, session, input, at);
      case 'type':
        return this.#atType(sessionId, session, input);
      case 'digits':
        return this.#atDigits(sessionId, session, input, at);
      case 'stake':
        return this.#atStake(sessionId, session, input);
      case 'pin':
        return this.#atPin(sessionId, session, input, at);
      case 'pin-balance':
        return this.#atPinBalance(sessionId, session, input, at);
      default:
        this.#close(sessionId);
        return END('Something went wrong. Nothing was charged.');
    }
  }

  #atMenu(sessionId, session, input, at) {
    if (input === '1') {
      if (!session.draft.drawKey) {
        this.#close(sessionId);
        return END('No draw is open for bets right now. Please dial again later.');
      }
      session.state = 'type';
      return CON(this.#typeMenu().text);
    }
    if (input === '2') {
      // A balance is account data on a handset that gets shared and swapped,
      // so it sits behind the PIN. Public information does not.
      session.state = 'pin-balance';
      return CON('Enter your PIN to see your balance');
    }
    if (input === '3') {
      this.#close(sessionId);
      return END(this.#lastResult() || 'No result published yet.');
    }
    return this.#retry(session, sessionId, this.#welcome(session, at), 'Not a choice.');
  }

  #atType(sessionId, session, input) {
    const { keys, text } = this.#typeMenu();
    if (input === '0') {
      session.state = 'menu';
      return CON(this.#welcome(session, this.#now()));
    }
    const chosen = keys[Number(input) - 1];
    if (!chosen) return this.#retry(session, sessionId, text, 'Not a choice.');

    session.draft.type = chosen;
    session.state = 'digits';
    const spec = this.#betTypes[chosen];
    return CON(`${spec.label}: ${spec.hint}\nEnter ${spec.digits} digit${spec.digits === 1 ? '' : 's'}`);
  }

  #atDigits(sessionId, session, input, at) {
    const spec = this.#betTypes[session.draft.type];
    const prompt = `Enter ${spec.digits} digit${spec.digits === 1 ? '' : 's'}`;

    if (!new RegExp(`^[0-9]{${spec.digits}}$`).test(input)) {
      return this.#retry(session, sessionId, prompt, `Needs exactly ${spec.digits} digits.`);
    }

    // Validate the selection now, while it still costs nothing - not after the
    // PIN, when the player thinks the money has gone.
    const check = this.#validateSelection
      ? this.#validateSelection({ type: session.draft.type, digits: input })
      : { ok: true };
    if (!check.ok) return this.#retry(session, sessionId, prompt, check.message);

    session.draft.digits = input;
    session.state = 'stake';
    return CON(this.#stakeMenu());
  }

  #atStake(sessionId, session, input) {
    if (input === '0') {
      session.state = 'digits';
      const spec = this.#betTypes[session.draft.type];
      return CON(`Enter ${spec.digits} digit${spec.digits === 1 ? '' : 's'}`);
    }
    const stake = this.#stakes[Number(input) - 1];
    if (!stake) return this.#retry(session, sessionId, this.#stakeMenu(), 'Not a choice.');

    session.draft.stakeMinor = stake;
    session.state = 'pin';
    const { type, digits } = session.draft;
    return CON(`${this.#betTypes[type].label} ${digits} for ${money(stake)}\nEnter PIN to confirm`);
  }

  /**
   * The only step that changes anything.
   *
   * The PIN is checked and the bet posted in the same request, against the
   * server's clock. A session that dies before this leaves nothing behind; a
   * session that dies after it has already been paid for and recorded.
   */
  #atPin(sessionId, session, input, at) {
    const { type, digits, stakeMinor, drawKey } = session.draft;

    const pin = this.#auth.checkPin({
      id: `ussd-pin-${sessionId}-${session.missteps}-${at}`, at, playerId: session.playerId, pin: input
    });
    if (!pin.ok) {
      this.#close(sessionId);
      return END(pin.reason === 'locked'
        ? 'Your PIN is locked. Contact support. Nothing was charged.'
        : 'Wrong PIN. Nothing was charged.');
    }

    // The bet id is the session id: a gateway that retries the same request -
    // and they do - cannot buy the ticket twice.
    const betId = `ussd-${sessionId}`;
    this.#operator.placeBet({
      id: betId, at, betId, playerId: session.playerId, drawKey,
      stakeMinor, selection: { type, digits }, memo: 'ussd'
    });
    this.#close(sessionId);

    const wallet = this.#operator.playerStatement(session.playerId, at);
    const line = `Bet placed: ${this.#betTypes[type].label} ${digits} for ${money(stakeMinor)}. Draw ${drawKey}. Balance ${money(wallet.walletMinor)}.`;
    // Sent by the operator, to the player's own number, whatever device the
    // bet was entered on.
    this.#notify({ msisdn: session.msisdn, text: line });
    return END(line);
  }

  #atPinBalance(sessionId, session, input, at) {
    const pin = this.#auth.checkPin({
      id: `ussd-bal-${sessionId}-${session.missteps}-${at}`, at, playerId: session.playerId, pin: input
    });
    this.#close(sessionId);
    if (!pin.ok) return END(pin.reason === 'locked' ? 'Your PIN is locked. Contact support.' : 'Wrong PIN.');

    const wallet = this.#operator.playerStatement(session.playerId, at);
    const limits = wallet.limits && wallet.limits.dailyStakeMinor !== null
      ? ` Staked today ${money(wallet.stakedTodayMinor)} of ${money(wallet.limits.dailyStakeMinor)}.`
      : '';
    return END(`Balance ${money(wallet.walletMinor)}.${limits}`);
  }

  #lastResult() {
    const settled = this.#operator.ledger.listState('draw')
      .filter(([, draw]) => draw && draw.result)
      .sort((a, b) => (a[1].drawAt < b[1].drawAt ? 1 : -1))[0];
    return settled ? `Draw ${settled[0]}: ${settled[1].result}` : null;
  }
}

module.exports = { UssdEngine, MAX_SCREEN, playerIdFromMsisdn };
