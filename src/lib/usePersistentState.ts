import { useCallback, useEffect, useRef, useState } from 'react';
import { clear, load, save } from './storage';

/**
 * useState that survives a refresh, a backgrounded tab, and a phone dying
 * mid-game. Writes through on every change.
 */
export function usePersistentState<T>(
  key: string,
  initial: T | (() => T),
): [T, (value: T | ((previous: T) => T)) => void, () => void] {
  const makeInitial = useCallback(
    () => (typeof initial === 'function' ? (initial as () => T)() : initial),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [state, setState] = useState<T>(() => load<T>(key) ?? makeInitial());
  const keyRef = useRef(key);

  useEffect(() => {
    if (keyRef.current !== key) {
      keyRef.current = key;
      setState(load<T>(key) ?? makeInitial());
    }
  }, [key, makeInitial]);

  useEffect(() => {
    save(key, state);
  }, [key, state]);

  const reset = useCallback(() => {
    clear(key);
    setState(makeInitial());
  }, [key, makeInitial]);

  return [state, setState, reset];
}

/** Read-once helper for values that don't need to re-render on change. */
export function readStored<T>(key: string, fallback: T): T {
  return load<T>(key) ?? fallback;
}
