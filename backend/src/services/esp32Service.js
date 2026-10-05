const axios = require('axios');
const config = require('../config');
const temperatureService = require('./temperature.service');
const { classifyTemperature } = require('../utils/temperatureRules');

// The only module that opens a connection to the device. Everything else
// reads the cache this keeps.
//
// This file must never import aiService, and aiService must never import
// this one. The advisory layer is advisory: it cannot reach the hardware.

const state = {
  lastGood: null,
  lastGoodAt: null,
  consecutiveFailures: 0,
  lastError: null,
  lastErrorAt: null,
  lastAttemptAt: null,
  totalPolls: 0,
  totalFailures: 0,
  // Raised when the device's own classification disagrees with ours.
  classificationMismatch: null,
};

let timer = null;
let pollInProgress = false;

function parseTemperature(body) {
  const t = body && typeof body.temperature === 'object' ? body.temperature : null;

  if (!t || t.available !== true) {
    return {
      available: false,
      celsius: null,
      status: 'unavailable',
      simulated: false,
      sensorPresent: Boolean(t && t.sensorPresent),
      chip: t && typeof t.chip === 'string' ? t.chip : null,
      ageSeconds: null,
    };
  }

  const celsius = Number.isFinite(t.celsius) ? t.celsius : null;

  // Classified here from the raw value, independently of what the device
  // said. Two layers reaching the same conclusion from the same number;
  // a disagreement is a fault worth surfacing, not something to paper over.
  const status = classifyTemperature(celsius);

  return {
    available: celsius !== null,
    celsius,
    status,
    deviceReportedStatus: typeof t.status === 'string' ? t.status : null,
    simulated: t.simulated === true,
    sensorPresent: t.sensorPresent === true,
    chip: typeof t.chip === 'string' ? t.chip : null,
    ageSeconds: Number.isFinite(t.ageSeconds) ? t.ageSeconds : null,
  };
}

// The device is untrusted input. Its payload is read field by field into a
// known shape, never spread into a response.
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
    temperature: parseTemperature(body),
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
  if (pollInProgress) return;
  pollInProgress = true;

  const startedAt = Date.now();
  state.lastAttemptAt = new Date();
  state.totalPolls += 1;

  try {
    const res = await axios.get(`${config.esp32.baseUrl}/status`, {
      timeout: config.esp32.timeoutMs,
      validateStatus: (s) => s === 200,
    });

    const parsed = parseDeviceStatus(res.data);
    const observedAt = new Date();

    state.lastGood = { ...parsed, roundTripMs: Date.now() - startedAt };
    state.lastGoodAt = observedAt;

    const temp = parsed.temperature;

    // Both layers classify the same raw value, so they must agree. A
    // disagreement means one of them is wrong and that needs to be visible.
    if (
      temp.available &&
      temp.deviceReportedStatus &&
      temp.deviceReportedStatus !== temp.status
    ) {
      const message = `device reported ${temp.deviceReportedStatus}, backend classified ${temp.status} for ${temp.celsius} C`;
      if (state.classificationMismatch !== message) {
        console.error(`[esp32] temperature classification mismatch: ${message}`);
      }
      state.classificationMismatch = message;
    } else {
      state.classificationMismatch = null;
    }

    if (temp.available) {
      // Storage failures must not break polling: the device status is still
      // useful even if the history cannot be written.
      temperatureService
        .recordObservation(parsed.deviceId, {
          celsius: temp.celsius,
          simulated: temp.simulated,
          observedAt,
        })
        .catch((err) => {
          console.error('[esp32] failed to record temperature:', err.message);
        });
    }

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
    classificationMismatch: state.classificationMismatch,
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
