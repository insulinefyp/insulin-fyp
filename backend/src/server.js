const os = require('os');
const app = require('./app');
const config = require('./config');
const { connectDatabase } = require('./config/database');
const simulator = require('./simulation/glucoseSimulator');
const esp32Service = require('./services/esp32Service');

function getLanAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  Object.values(interfaces).forEach((list) => {
    (list || []).forEach((iface) => {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    });
  });

  return addresses;
}

async function start() {
  try {
    await connectDatabase();
  } catch (err) {
    console.error('Startup aborted: database unavailable');
    process.exit(1);
  }

  if (config.simulator.enabled && config.glucose.source === 'simulator') {
    simulator.start();
  } else {
    console.log('Glucose simulator disabled');
  }

  // Started after the database but before listening. A device that is absent
  // must not prevent the API from serving.
  esp32Service.start();

  app.listen(config.port, config.host, () => {
    console.log(`\nServer running in ${config.env} mode`);
    console.log(`  Local:   http://localhost:${config.port}/api/health`);

    getLanAddresses().forEach((addr) => {
      console.log(`  Network: http://${addr}:${config.port}/api/health`);
    });

    console.log('');
  });
}

start();
