const mongoose = require('mongoose');
const config = require('./index');

let isConnected = false;

async function connectDatabase() {
  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });

    isConnected = true;
    console.log(`MongoDB connected: ${mongoose.connection.name}`);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    throw err;
  }

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    isConnected = true;
    console.log('MongoDB reconnected');
  });
}

function getDatabaseStatus() {
  return {
    connected: isConnected && mongoose.connection.readyState === 1,
    state: mongoose.STATES[mongoose.connection.readyState],
  };
}

async function disconnectDatabase() {
  await mongoose.connection.close();
  isConnected = false;
}

module.exports = { connectDatabase, getDatabaseStatus, disconnectDatabase };
