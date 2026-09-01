'use strict';

const draws = require('../src/draws.js');

/**
 * Making a draw land on a chosen number, without a hook in the product.
 *
 * A laboratory has to exercise a 500x straight win, a three-way box, a
 * near-miss and a jackpot, and cannot wait for chance to produce them. The
 * obvious way to give them that is a switch in the draw code. That switch would
 * then exist in production, set to false, and "set to false" is a sentence
 * nobody should have to trust.
 *
 * So there is no switch. The result is a deterministic function of the seed, so
 * a wanted result is found by generating seeds until one produces it - about a
 * thousand tries for a three-digit game, which is microseconds. Everything
 * downstream is then completely ordinary: a real seed, a real commitment
 * published before betting opens, a real reveal that verifies against it.
 *
 * The tester can confirm for themselves that the product has no back door,
 * because this file only calls the same public functions any player can.
 *
 * ----------------------------------------------------------------------
 *
 * There is a property boundary here worth stating rather than discovering.
 * Commit-reveal stops the operator changing the number *after seeing the book*.
 * It does not stop them choosing the number *before the book exists* - which is
 * exactly what this file does. That is why the commitment must be published
 * before betting opens and why the timing rule matters as much as the
 * cryptography: with no bets placed yet, a chosen number is worth nothing.
 * Publish a commitment late and the guarantee is retrospective, which is to say
 * absent.
 */

const DEFAULT_ATTEMPTS = 100_000;

/**
 * @param {string} drawKey the commitment is bound to it, so the search is too
 * @param {string} wantedResult three digits, '000' to '999'
 * @param {{attempts?: number, nextSeed?: () => string}} [options]
 * @returns {{seed: string, commitment: string, tries: number}}
 */
function seedFor(drawKey, wantedResult, { attempts = DEFAULT_ATTEMPTS, nextSeed = draws.createSeed } = {}) {
  if (!/^[0-9]{3}$/.test(String(wantedResult))) {
    throw new TypeError(`wantedResult must be three digits, got ${wantedResult}`);
  }

  for (let tries = 1; tries <= attempts; tries++) {
    const seed = nextSeed();
    if (draws.resultFromSeed(drawKey, seed) === wantedResult) {
      return { seed, commitment: draws.commit(drawKey, seed), tries };
    }
  }

  // At one in a thousand per try this is a one-in-e^100 event, so reaching it
  // means the generator is repeating rather than that the search was unlucky.
  throw new Error(
    `No seed produced ${wantedResult} for ${drawKey} in ${attempts} tries - check the seed generator`
  );
}

module.exports = { seedFor, DEFAULT_ATTEMPTS };
