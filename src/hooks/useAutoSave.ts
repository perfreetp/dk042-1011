import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/useGameStore';

interface UseAutoSaveOptions {
  debounceMs?: number;
  intervalMs?: number;
  enableLogging?: boolean;
}

export const useAutoSave = ({
  debounceMs = 2000,
  intervalMs = 30000,
  enableLogging = false,
}: UseAutoSaveOptions = {}) => {
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSaveTime = useRef<number>(0);

  const saveGame = useCallback(() => {
    const now = Date.now();
    if (now - lastSaveTime.current < 1000) return;

    lastSaveTime.current = now;
    useGameStore.getState().saveToStorage();

    if (enableLogging) {
      console.log('[AutoSave] Game saved at', new Date().toLocaleTimeString());
    }
  }, [enableLogging]);

  const debouncedSave = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      saveGame();
    }, debounceMs);
  }, [debounceMs, saveGame]);

  useEffect(() => {
    const unsubscribe = useGameStore.subscribe(() => {
      debouncedSave();
    });

    intervalTimer.current = setInterval(() => {
      saveGame();
    }, intervalMs);

    const handleBeforeUnload = () => {
      saveGame();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveGame();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubscribe();

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (intervalTimer.current) {
        clearInterval(intervalTimer.current);
      }

      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      saveGame();
    };
  }, [debouncedSave, intervalMs, saveGame]);

  return {
    saveNow: saveGame,
    lastSaveTime: lastSaveTime.current,
  };
};

export default useAutoSave;
