require('dotenv').config();

function toInt(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

function toBool(value, fallback) {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes'].includes(String(value).toLowerCase());
}

const env = process.env.NODE_ENV || 'development';

const config = {
  env,
  port: toInt(process.env.PORT, 3000),
  host: process.env.HOST || '0.0.0.0',
  mongoUri: process.env.MONGODB_URI,
  bcryptRounds: toInt(process.env.BCRYPT_ROUNDS, 10),
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  glucose: {
    source: process.env.GLUCOSE_SOURCE || 'simulator',
    intervalSeconds: toInt(process.env.CGM_INTERVAL_SECONDS, 60),
    staleAfterIntervals: toInt(process.env.CGM_STALE_AFTER_INTERVALS, 3),
  },

  simulator: {
    enabled: toBool(process.env.SIMULATOR_ENABLED, true),
    controlsEnabled: toBool(
      process.env.SIMULATOR_CONTROLS_ENABLED,
      env === 'development'
    ),
  },

  // The backend polls the device. The device never pushes, and the mobile
  // app never talks to the device directly.
  esp32: {
    enabled: toBool(process.env.ESP32_ENABLED, true),
    host: process.env.ESP32_HOST || '',
    port: toInt(process.env.ESP32_PORT, 80),
    pollIntervalSeconds: toInt(process.env.ESP32_POLL_INTERVAL_SECONDS, 3),
    timeoutMs: toInt(process.env.ESP32_TIMEOUT_MS, 2000),
    failuresBeforeOffline: toInt(process.env.ESP32_FAILURES_BEFORE_OFFLINE, 3),
  },
};

config.esp32.baseUrl = config.esp32.host
  ? `http://${config.esp32.host}:${config.esp32.port}`
  : null;

const problems = [];

if (!config.mongoUri) problems.push('MONGODB_URI is missing');
if (!config.jwtSecret) problems.push('JWT_SECRET is missing');
if (config.glucose.intervalSeconds < 5 || config.glucose.intervalSeconds > 900) {
  problems.push('CGM_INTERVAL_SECONDS must be between 5 and 900');
}
if (config.glucose.staleAfterIntervals < 1) {
  problems.push('CGM_STALE_AFTER_INTERVALS must be at least 1');
}
if (config.esp32.enabled && !config.esp32.host) {
  problems.push('ESP32_ENABLED is true but ESP32_HOST is empty');
}
if (config.esp32.timeoutMs < 200 || config.esp32.timeoutMs > 10000) {
  problems.push('ESP32_TIMEOUT_MS must be between 200 and 10000');
}
if (config.esp32.failuresBeforeOffline < 1) {
  problems.push('ESP32_FAILURES_BEFORE_OFFLINE must be at least 1');
}

if (problems.length > 0) {
  problems.forEach((p) => console.error(`Config error: ${p}`));
  console.error('Check .env against .env.example.');
  process.exit(1);
}

module.exports = config;
