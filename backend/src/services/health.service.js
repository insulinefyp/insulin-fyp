const config = require('../config');
const { getDatabaseStatus } = require('../config/database');

function getHealthStatus() {
  const db = getDatabaseStatus();

  return {
    status: db.connected ? 'ok' : 'degraded',
    env: config.env,
    uptimeSeconds: Math.floor(process.uptime()),
    database: db,
    timestamp: new Date().toISOString(),
  };
}

module.exports = { getHealthStatus };
