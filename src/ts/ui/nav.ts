let navController: AbortController | null = null;

function closeMenu(nav: HTMLElement, toggle: HTMLButtonElement): void {
  nav.dataset.mobileOpen = 'false';
  document.body.dataset.mobileMenu = 'false';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Open menu');
}

function openMenu(nav: HTMLElement, toggle: HTMLButtonElement): void {
  nav.dataset.mobileOpen = 'true';
  document.body.dataset.mobileMenu = 'true';
  toggle.setAttribute('aria-expanded', 'true');
  toggle.setAttribute('aria-label', 'Close menu');
}

export function initNav(): void {
  navController?.abort();
  navController = new AbortController();

  const nav = document.querySelector<HTMLElement>('#site-nav');
  const toggle = document.querySelector<HTMLButtonElement>('.nav-toggle');
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.nav-links a'));

  if (!nav || !toggle) {
    return;
  }

  const { signal } = navController;

  closeMenu(nav, toggle);

  toggle.addEventListener('click', () => {
    const isOpen = nav.dataset.mobileOpen === 'true';

    if (isOpen) {
      closeMenu(nav, toggle);
      return;
    }

    openMenu(nav, toggle);
  }, { signal });

  links.forEach((link) => {
    link.addEventListener('click', () => {
      closeMenu(nav, toggle);
    }, { signal });
  });

  document.addEventListener('click', (event) => {
    const target = event.target;

    if (!(target instanceof Node)) {
      return;
    }

    if (!nav.contains(target)) {
      closeMenu(nav, toggle);
    }
  }, { signal });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenu(nav, toggle);
    }
  }, { signal });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 640) {
      closeMenu(nav, toggle);
    }
  }, { signal });
}
