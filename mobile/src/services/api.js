import config from '../config';

function unwrap(json) {
  if (json && typeof json === 'object' && 'success' in json) {
    if (json.success) return json.data;
    const err = new Error(json.error?.message || 'Request failed');
    err.code = json.error?.code || 'UNKNOWN';
    throw err;
  }
  return json;
}

async function request(path, { method = 'GET', body, baseUrl, signal } = {}) {
  const url = `${baseUrl || config.apiBaseUrl}${path}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    config.requestTimeoutMs
  );

  if (signal) {
    signal.addEventListener('abort', () => controller.abort());
  }

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const err = new Error(json?.error?.message || `HTTP ${res.status}`);
      err.code = json?.error?.code || 'HTTP_ERROR';
      err.status = res.status;
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
  getHealth: (opts) => request('/health', opts),
};