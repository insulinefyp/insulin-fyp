const esp32Service = require('./esp32Service');

function getStatus() {
  return esp32Service.getSnapshot();
}

module.exports = { getStatus };
