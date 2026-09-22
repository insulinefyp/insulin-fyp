import { useEffect, useState } from 'react';

// Re-renders the caller on a fixed interval so time-based values (a
// reading's age) stay current between network requests.
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
