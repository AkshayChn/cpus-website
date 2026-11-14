const STORAGE_KEY = 'cpus-theme';

type Theme = 'light' | 'dark';

function readStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

export function initThemeToggle(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const next: Theme =
        document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';

      applyTheme(next);

      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Ignore storage errors; the theme still changes for this page.
      }
    });
  });

  const stored = readStoredTheme();
  if (stored) applyTheme(stored);
}
