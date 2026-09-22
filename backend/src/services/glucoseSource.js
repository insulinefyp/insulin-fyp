const config = require('../config');
const simulatorSource = require('./glucoseSources/simulator.source');

// The single place that decides where glucose comes from. Swapping to a real
// CGM means adding its source file here and changing GLUCOSE_SOURCE.
const SOURCES = {
  simulator: simulatorSource,
};

const source = SOURCES[config.glucose.source];

if (!source) {
  console.error(
    `Unknown GLUCOSE_SOURCE "${config.glucose.source}". ` +
      `Available: ${Object.keys(SOURCES).join(', ')}`
  );
  process.exit(1);
}

module.exports = source;
