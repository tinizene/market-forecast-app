'use strict';

/**
 * A refusal: an expected answer, not a fault.
 *
 * "You cannot stake more than your wallet holds" and "that seed does not match
 * the commitment" are the system working. They carry a message written for
 * whoever asked, and they must reach that person unchanged.
 *
 * The distinction used to be drawn by matching on the text of the message,
 * which worked until a guard was worded differently from the ones the pattern
 * knew about - and then a refusal arrived as a 500, told the operator nothing,
 * and invited a retry that could not succeed. A type is not fooled by wording.
 */
class Refusal extends Error {
  constructor(message) {
    super(message);
    this.name = 'Refusal';
    // A plain flag as well as the class: an error crossing a module boundary
    // is still recognisable if two copies of this file ever load at once.
    this.refusal = true;
  }
}

module.exports = { Refusal };
