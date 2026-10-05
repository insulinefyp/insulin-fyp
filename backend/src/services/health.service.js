const config = require('../config');
const { getDatabaseStatus } = require('../config/database');
const simulator = require('../simulation/glucoseSimulator');
const esp32Service = require('./esp32Service');

function getHealthStatus() {
  const db = getDatabaseStatus();
  const esp32 = esp32Service.getSnapshot();

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
    device: {
      status: esp32.status,
      address: esp32.address,
      consecutiveFailures: esp32.consecutiveFailures,
      dataAgeSeconds: esp32.dataAgeSeconds,
    },
    timestamp: new Date().toISOString(),
  };
}

module.exports = { getHealthStatus };
