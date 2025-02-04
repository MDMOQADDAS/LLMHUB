export const STORAGE_KEYS = {
    SUGGESTIONS: 'enableSuggestions',
    ACTIVE_MODE: 'activeMode'
  } as const;
  
  export const safeLocalStorage = {
    get: (key: string) => {
      if (typeof window === 'undefined') return null;
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch (e) {
        console.error(`Error reading ${key} from localStorage:`, e);
        return null;
      }
    },
    set: (key: string, value: any) => {
      if (typeof window === 'undefined') return;
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.error(`Error writing ${key} to localStorage:`, e);
      }
    }
  };