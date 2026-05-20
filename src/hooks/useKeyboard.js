import { useEffect } from 'react';

/**
 * Global keyboard shortcuts hook.
 * Attach to the app root to handle global shortcuts.
 */
export default function useKeyboard({ onSearch, onRandom, onFocus, onEscape }) {
  useEffect(() => {
    const handler = (e) => {
      // Don't intercept when typing in inputs/textareas
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        if (e.key === 'Escape' && onEscape) {
          e.target.blur();
          onEscape();
        }
        return;
      }

      switch (e.key) {
        case '/':
          e.preventDefault();
          onSearch?.();
          break;
        case 'r':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            onRandom?.();
          }
          break;
        case 'f':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            onFocus?.();
          }
          break;
        case 'Escape':
          onEscape?.();
          break;
        case '?':
          // Show shortcuts help — handled by the component using the hook
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSearch, onRandom, onFocus, onEscape]);
}
