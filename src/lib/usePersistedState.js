import { useEffect, useState } from 'react';

/**
 * useState that mirrors itself to localStorage under `key`.
 * If parsing fails or storage is unavailable, falls back gracefully to
 * in-memory state so SSR / private-mode browsers don't crash.
 */
export default function usePersistedState(key, initial) {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return initial;
    try {
      const raw = window.localStorage.getItem(key);
      return raw == null ? initial : JSON.parse(raw);
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota / private mode — silently noop */
    }
  }, [key, value]);

  return [value, setValue];
}
