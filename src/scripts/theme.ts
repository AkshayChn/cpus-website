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

function syncPressed(button: HTMLButtonElement): void {
  button.setAttribute(
    'aria-pressed',
    document.documentElement.dataset.theme === 'dark' ? 'true' : 'false',
  );
}

export function initThemeToggle(): void {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]'));

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const next: Theme =
        document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';

      applyTheme(next);
      syncPressed(button);

      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Ignore storage errors; the theme still changes for this page.
      }
    });
  });

  const stored = readStoredTheme();
  if (stored) applyTheme(stored);

  buttons.forEach(syncPressed);
}
