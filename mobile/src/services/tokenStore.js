import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';

// Every call is wrapped: secure storage can fail on a wiped device, a
// restored backup, or an emulator with no keystore. A failure to read a
// token means "not signed in", never a crash on launch.
export async function saveToken(token) {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    return true;
  } catch (err) {
    console.warn('Could not save auth token:', err.message);
    return false;
  }
}

export async function getToken() {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (err) {
    console.warn('Could not read auth token:', err.message);
    return null;
  }
}

export async function clearToken() {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (err) {
    console.warn('Could not clear auth token:', err.message);
  }
}
