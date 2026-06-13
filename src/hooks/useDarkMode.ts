import { useState, useCallback } from 'react';

export function useDarkMode(): { dark: boolean; toggle: () => void } {
  // Lit l'état courant depuis le DOM (appliqué par main.tsx avant le rendu).
  const [dark, setDark] = useState(
    () => document.documentElement.classList.contains('dark'),
  );

  const toggle = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('skein-theme', next ? 'dark' : 'light');
      return next;
    });
  }, []);

  return { dark, toggle };
}
