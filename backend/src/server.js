const os = require('os');
const app = require('./app');
const config = require('./config');

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

app.listen(config.port, config.host, () => {
  console.log(`\nServer running in ${config.env} mode`);
  console.log(`  Local:   http://localhost:${config.port}/api/health`);

  getLanAddresses().forEach((addr) => {
    console.log(`  Network: http://${addr}:${config.port}/api/health`);
  });

  console.log('');
});