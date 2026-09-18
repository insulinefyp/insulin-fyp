import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_PORT = 3000;

// Android emulator reaches the host machine at 10.0.2.2.
// Inside the emulator, localhost is the emulator itself, not your Mac.
const EMULATOR_HOST = '10.0.2.2';

// Your Mac's LAN IP, used when running on a physical device.
const LAN_HOST = '192.168.18.133';

function isAndroidEmulator() {
  if (Platform.OS !== 'android') return false;
  return !Constants.isDevice;
}

const API_HOST = isAndroidEmulator() ? EMULATOR_HOST : LAN_HOST;

const config = {
  apiBaseUrl: `http://${API_HOST}:${API_PORT}/api`,
  requestTimeoutMs: 8000,
  isEmulator: isAndroidEmulator(),
};

export default config;
