const STORAGE_KEY = 'cpus-banner-dismissed-v1';

export function initBanner(): void {
  const banner = document.getElementById('construction-banner');
  if (!banner) return;

  banner.querySelector<HTMLButtonElement>('[data-banner-dismiss]')?.addEventListener('click', () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // Ignore storage errors; the banner still dismisses for this view.
    }

    document.documentElement.dataset.bannerDismissed = 'true';
  });
}
