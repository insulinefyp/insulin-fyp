const config = require('../config');
const { getDatabaseStatus } = require('../config/database');
const simulator = require('../simulation/glucoseSimulator');

function getHealthStatus() {
  const db = getDatabaseStatus();

  return {
    status: db.connected ? 'ok' : 'degraded',
    env: config.env,
    uptimeSeconds: Math.floor(process.uptime()),
    database: db,
    glucose: {
      source: config.glucose.source,
      intervalSeconds: config.glucose.intervalSeconds,
      simulator: simulator.getStatus(),
    },
    timestamp: new Date().toISOString(),
  };
}

module.exports = { getHealthStatus };
