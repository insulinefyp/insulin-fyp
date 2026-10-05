const esp32Service = require('./esp32Service');
const temperatureService = require('./temperature.service');

function getStatus() {
  return esp32Service.getSnapshot();
}

function currentDeviceId() {
  const snapshot = esp32Service.getSnapshot();
  return snapshot.device ? snapshot.device.deviceId : null;
}

async function getTemperatureHistory(options) {
  const deviceId = currentDeviceId();
  if (!deviceId) {
    return { unit: 'C', count: 0, readings: [], min: null, max: null };
  }
  return temperatureService.getHistory(deviceId, options);
}

async function getTemperatureExcursions(options) {
  const deviceId = currentDeviceId();
  if (!deviceId) return { excursions: [] };
  return temperatureService.getExcursions(deviceId, options);
}

module.exports = { getStatus, getTemperatureHistory, getTemperatureExcursions };
