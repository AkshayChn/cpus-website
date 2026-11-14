const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

function initProgress(): void {
  const body = document.querySelector<HTMLElement>('[data-reading-body]');
  const bars = document.querySelectorAll<HTMLElement>('[data-progress-bar]');
  const labels = document.querySelectorAll<HTMLElement>('[data-progress-label]');
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-toc-link]'));
  const headings = Array.from(
    document.querySelectorAll<HTMLElement>('[data-reading-body] h2[id], [data-reading-body] h3[id]'),
  );

  if (!body || (bars.length === 0 && labels.length === 0)) return;

  let frame = 0;

  const update = (): void => {
    frame = 0;

    const top = body.getBoundingClientRect().top + window.scrollY;
    const scrollable = Math.max(body.offsetHeight - window.innerHeight, 1);
    const ratio = clamp((window.scrollY - top) / scrollable, 0, 1);
    const percent = `${Math.round(ratio * 100)}%`;

    bars.forEach((bar) => {
      bar.style.width = percent;
    });

    labels.forEach((label) => {
      label.textContent = percent;
    });

    if (links.length === 0) return;

    let activeId = '';

    for (const heading of headings) {
      if (heading.getBoundingClientRect().top <= 140) {
        activeId = heading.id;
      } else {
        break;
      }
    }

    links.forEach((link) => {
      if (link.dataset.tocLink === activeId) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  const schedule = (): void => {
    if (frame) return;
    frame = window.requestAnimationFrame(update);
  };

  update();
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('load', schedule);
}

function initMobileBar(): void {
  const bar = document.querySelector<HTMLElement>('[data-mobile-bar]');
  const header = document.querySelector<HTMLElement>('[data-article-header]');

  if (!bar || !header) return;

  let headerVisible = true;
  let footerVisible = false;

  const sync = (): void => {
    bar.hidden = headerVisible || footerVisible;
  };

  const headerObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry) return;
      headerVisible = entry.isIntersecting;
      sync();
    },
    { rootMargin: '-72px 0px 0px 0px' },
  );

  headerObserver.observe(header);

  const footer = document.querySelector<HTMLElement>('[data-site-footer]');

  if (footer) {
    const footerObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        footerVisible = entry.isIntersecting;
        sync();
      },
      { rootMargin: '0px 0px -15% 0px' },
    );

    footerObserver.observe(footer);
  }

  sync();
}

function initSheets(): void {
  const dialogs = Array.from(document.querySelectorAll<HTMLDialogElement>('[data-sheet]'));

  if (dialogs.length === 0) return;

  const open = (name: string | undefined): void => {
    if (!name) return;

    const dialog = dialogs.find((entry) => entry.dataset.sheet === name);
    if (!dialog || dialog.open) return;

    try {
      dialog.showModal();
    } catch {
      dialog.setAttribute('open', '');
    }
  };

  document.querySelectorAll<HTMLButtonElement>('[data-sheet-open]').forEach((button) => {
    button.addEventListener('click', () => open(button.dataset.sheetOpen));
  });

  dialogs.forEach((dialog) => {
    dialog
      .querySelectorAll<HTMLElement>('[data-sheet-close], [data-sheet-dismiss]')
      .forEach((element) => {
        element.addEventListener('click', () => dialog.close());
      });

    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  });
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function initShare(): void {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-share-button]'));

  if (buttons.length === 0) return;

  const status = document.querySelector<HTMLElement>('[data-share-status]');

  const announce = (message: string): void => {
    if (status) status.textContent = message;
  };

  buttons.forEach((button) => {
    button.addEventListener('click', async () => {
      const title = button.dataset.shareTitle ?? document.title;
      const shareUrl = button.dataset.shareUrl ?? window.location.href;
      const label = button.querySelector<HTMLElement>('[data-share-label]');
      const original = label?.textContent ?? '';

      if (navigator.share) {
        try {
          await navigator.share({ title, url: shareUrl });
          return;
        } catch (error) {
          if ((error as DOMException)?.name === 'AbortError') return;
        }
      }

      const copied = await copyText(shareUrl);
      announce(copied ? 'Link copied' : 'Could not copy link');

      if (label) {
        label.textContent = copied ? 'Copied' : 'Failed';
        window.setTimeout(() => {
          label.textContent = original;
        }, 2000);
      }
    });
  });
}

export function initArticle(): void {
  initProgress();
  initMobileBar();
  initSheets();
  initShare();
}
