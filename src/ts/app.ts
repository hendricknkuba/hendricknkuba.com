import { initAboutPage } from './pages/about.js';
import { initExperiencePage } from './pages/experience.js';
import { initHomePage } from './pages/home.js';
import { initProjectsPage } from './pages/projects.js';
import { initEyes } from './ui/eyes.js';

const pageInitializers: Record<string, () => Promise<void>> = {
  '/': initHomePage,
  '/about/': initAboutPage,
  '/projects/': initProjectsPage,
  '/experience/': initExperiencePage
};

function getCurrentPagePath(): string {
  const path = window.location.pathname;

  if (path === '' || path === '/') {
    return '/';
  }

  return path.endsWith('/') ? path : `${path}/`;
}

export async function initCurrentPage(): Promise<void> {
  initEyes();

  const page = getCurrentPagePath();
  const initPage = pageInitializers[page];

  if (initPage) {
    await initPage();
  }
}

initCurrentPage();
