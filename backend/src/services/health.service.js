const config = require('../config');

function getHealthStatus() {
  return {
    status: 'ok',
    env: config.env,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  };
}

module.exports = { getHealthStatus };