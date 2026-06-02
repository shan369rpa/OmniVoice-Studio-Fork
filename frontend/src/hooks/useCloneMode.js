import { useMemo } from 'react';

export default function useCloneMode() {
  const isCloneMode = useMemo(() => {
    // 1. Check URL param first (?mode=clone)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('mode') === 'clone') {
        return true;
      }
    }
    
    // 2. Fallback to Env var (VITE_CLONE_MODE=1)
    if (import.meta.env && import.meta.env.VITE_CLONE_MODE === '1') {
      return true;
    }

    return false;
  }, []);

  return { isCloneMode };
}
