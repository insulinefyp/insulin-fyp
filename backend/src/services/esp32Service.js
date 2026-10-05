const axios = require('axios');
const config = require('../config');

// The only module that opens a connection to the device. Everything else
// reads the cache this keeps.
//
// This file must never import aiService, and aiService must never import
// this one. The advisory layer is advisory: it cannot reach the hardware.

const state = {
  // Last response that parsed correctly, with when it arrived.
  lastGood: null,
  lastGoodAt: null,

  consecutiveFailures: 0,
  lastError: null,
  lastErrorAt: null,
  lastAttemptAt: null,

  totalPolls: 0,
  totalFailures: 0,
};

let timer = null;
let pollInProgress = false;

// The device is untrusted input. Its payload is read field by field into a
// known shape, never spread into a response. A reply that does not look like
// our firmware counts as a failure rather than being cached as truth: on a
// hotspot, DHCP can put something else at this address.
function parseDeviceStatus(body) {
  if (!body || typeof body !== 'object') {
    throw new Error('Device returned a non-object response');
  }
  if (typeof body.deviceId !== 'string' || typeof body.state !== 'string') {
    throw new Error('Device response is missing deviceId or state');
  }

  const wifi = body.wifi && typeof body.wifi === 'object' ? body.wifi : {};
  const subsystems =
    body.subsystems && typeof body.subsystems === 'object' ? body.subsystems : {};

  return {
    deviceId: body.deviceId,
    firmwareVersion:
      typeof body.firmwareVersion === 'string' ? body.firmwareVersion : null,
    state: body.state,
    ready: body.ready === true,
    uptimeSeconds: Number.isFinite(body.uptimeSeconds) ? body.uptimeSeconds : null,
    freeHeapBytes: Number.isFinite(body.freeHeapBytes) ? body.freeHeapBytes : null,
    wifi: {
      connected: wifi.connected === true,
      ssid: typeof wifi.ssid === 'string' ? wifi.ssid : null,
      ip: typeof wifi.ip === 'string' ? wifi.ip : null,
      rssi: Number.isFinite(wifi.rssi) ? wifi.rssi : null,
    },
    subsystems: {
      temperature:
        typeof subsystems.temperature === 'string'
          ? subsystems.temperature
          : 'unknown',
      delivery:
        typeof subsystems.delivery === 'string' ? subsystems.delivery : 'unknown',
      display:
        typeof subsystems.display === 'string' ? subsystems.display : 'unknown',
    },
  };
}

async function pollOnce() {
  // A slow device must not cause overlapping requests to stack up.
  if (pollInProgress) return;
  pollInProgress = true;

  const startedAt = Date.now();
  state.lastAttemptAt = new Date();
  state.totalPolls += 1;

  try {
    const res = await axios.get(`${config.esp32.baseUrl}/status`, {
      timeout: config.esp32.timeoutMs,
      // Anything other than 200 is a failure, not something to cache.
      validateStatus: (s) => s === 200,
    });

    const parsed = parseDeviceStatus(res.data);

    state.lastGood = { ...parsed, roundTripMs: Date.now() - startedAt };
    state.lastGoodAt = new Date();

    if (state.consecutiveFailures > 0) {
      console.log(
        `[esp32] device reachable again after ${state.consecutiveFailures} failed poll(s)`
      );
    }

    state.consecutiveFailures = 0;
    state.lastError = null;
  } catch (err) {
    state.consecutiveFailures += 1;
    state.totalFailures += 1;
    state.lastErrorAt = new Date();

    if (err.code === 'ECONNABORTED') {
      state.lastError = `No response within ${config.esp32.timeoutMs} ms`;
    } else if (err.code === 'ECONNREFUSED') {
      state.lastError = 'Connection refused by device';
    } else if (err.code === 'EHOSTUNREACH' || err.code === 'ENETUNREACH') {
      state.lastError = 'Device address unreachable';
    } else {
      state.lastError = err.message;
    }

    // Logged once, at the moment it is declared offline, rather than every
    // poll: otherwise an absent device fills the log.
    if (state.consecutiveFailures === config.esp32.failuresBeforeOffline) {
      console.warn(
        `[esp32] device marked offline after ${state.consecutiveFailures} failures: ${state.lastError}`
      );
    }
  } finally {
    pollInProgress = false;
  }
}

function start() {
  if (!config.esp32.enabled) {
    console.log('ESP32 polling disabled');
    return;
  }
  if (timer) return;

  pollOnce();
  timer = setInterval(pollOnce, config.esp32.pollIntervalSeconds * 1000);

  console.log(
    `ESP32 poller started: ${config.esp32.baseUrl}/status every ${config.esp32.pollIntervalSeconds}s`
  );
}

function stop() {
  if (timer) clearInterval(timer);
  timer = null;
}

// Reads memory only. Never performs a network request, so an API call can
// never be delayed by the device.
function getSnapshot() {
  const now = Date.now();

  const online =
    state.lastGood !== null &&
    state.consecutiveFailures < config.esp32.failuresBeforeOffline;

  let status;
  if (!config.esp32.enabled) {
    status = 'disabled';
  } else if (state.lastGood === null) {
    status = 'never_reached';
  } else {
    status = online ? 'online' : 'offline';
  }

  return {
    status,
    enabled: config.esp32.enabled,
    address: config.esp32.baseUrl,
    pollIntervalSeconds: config.esp32.pollIntervalSeconds,
    timeoutMs: config.esp32.timeoutMs,
    failuresBeforeOffline: config.esp32.failuresBeforeOffline,
    consecutiveFailures: state.consecutiveFailures,
    lastError: state.lastError,
    lastErrorAt: state.lastErrorAt,
    lastAttemptAt: state.lastAttemptAt,
    // The last good reading is still returned when offline, with its age.
    // The app shows it clearly marked as old rather than hiding it.
    device: state.lastGood,
    lastGoodAt: state.lastGoodAt,
    dataAgeSeconds: state.lastGoodAt
      ? Math.floor((now - state.lastGoodAt.getTime()) / 1000)
      : null,
    totalPolls: state.totalPolls,
    totalFailures: state.totalFailures,
  };
}

// For stages 8 and beyond: anything that would actuate hardware calls this
// first. A command must never be sent to a device that is not known-good.
function assertDeviceOnline() {
  const snapshot = getSnapshot();

  if (snapshot.status !== 'online') {
    const err = new Error(
      'The delivery device is not reachable. Delivery is on hold until it responds.'
    );
    err.status = 409;
    err.code = 'DEVICE_OFFLINE';
    throw err;
  }

  return snapshot.device;
}

module.exports = { start, stop, pollOnce, getSnapshot, assertDeviceOnline };
