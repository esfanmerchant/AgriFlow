import { useEffect } from 'react';

/**
 * Calls `onEscape` when Escape is pressed and `enabled` is true.
 * Used to dismiss modals, drawers, popovers without forcing every component
 * to re-implement the listener and cleanup.
 */
export default function useEscapeKey(enabled, onEscape) {
  useEffect(() => {
    if (!enabled) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onEscape?.();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [enabled, onEscape]);
}
