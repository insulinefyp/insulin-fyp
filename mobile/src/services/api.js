import config from '../config';
import { getToken } from './tokenStore';

function unwrap(json) {
  if (json && typeof json === 'object' && 'success' in json) {
    if (json.success) return json.data;
    const err = new Error(json.error?.message || 'Request failed');
    err.code = json.error?.code || 'UNKNOWN';
    err.fields = json.error?.fields;
    throw err;
  }
  return json;
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const url = `${config.apiBaseUrl}${path}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    config.requestTimeoutMs
  );

  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const err = new Error(json?.error?.message || `HTTP ${res.status}`);
      err.code = json?.error?.code || 'HTTP_ERROR';
      err.status = res.status;
      err.fields = json?.error?.fields;
      throw err;
    }

    return unwrap(json);
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeoutErr = new Error('Backend did not respond in time');
      timeoutErr.code = 'TIMEOUT';
      throw timeoutErr;
    }
    if (err.message === 'Network request failed') {
      const netErr = new Error('Cannot reach backend');
      netErr.code = 'NETWORK';
      throw netErr;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  getHealth: () => request('/health'),
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  getMe: () => request('/auth/me', { auth: true }),
};
