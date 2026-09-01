'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { shortId } = require('./manifest.js');

/**
 * Which build this process is.
 *
 * Read once, at startup, from the manifest beside the package. Everything that
 * needs to say what software it is - the health endpoint, every line of the
 * audit log, the operator console's header - takes it from here, so a logged
 * call is attributable to a build rather than to a date.
 *
 * A missing manifest is not an error. Development runs without one, and a
 * process that refused to start because nobody had cut a release would be a
 * worse failure than an unlabelled log line. It reports `null`, and the places
 * that display it say "unversioned", which is the truthful answer.
 *
 * What this cannot do is prove anything. The manifest sits next to the code it
 * describes, so whoever can change the code can regenerate the manifest. The
 * number means something only because the laboratory and the regulator were
 * told it out of band, and because bin/verify-build.js recomputes it from the
 * files rather than reading it back.
 */

const MANIFEST_PATH = path.resolve(__dirname, '..', 'MANIFEST.json');

let cached;

function readManifest(manifestPath = MANIFEST_PATH) {
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch {
    return null;
  }
}

/** @returns {null|{id, short, generatedAt, runtimeFiles}} */
function build(manifestPath = MANIFEST_PATH) {
  if (cached !== undefined && manifestPath === MANIFEST_PATH) return cached;

  const manifest = readManifest(manifestPath);
  const value = manifest === null ? null : {
    id: manifest.buildId,
    short: shortId(manifest.buildId),
    generatedAt: manifest.generatedAt,
    runtimeFiles: manifest.sections.runtime.files.length
  };

  if (manifestPath === MANIFEST_PATH) cached = value;
  return value;
}

/** For a log line or a screen corner. */
function label(manifestPath = MANIFEST_PATH) {
  const current = build(manifestPath);
  return current === null ? 'unversioned' : current.short;
}

module.exports = { build, label, readManifest, MANIFEST_PATH };
