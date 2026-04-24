import { initAboutPage } from './pages/about.js';
import { initArticlesPage } from './pages/articles.js';
import { initContactPage } from './pages/contact.js';
import { initExperiencePage } from './pages/experience.js';
import { initHomePage } from './pages/home.js';
import { initProjectsPage } from './pages/projects.js';
import { initEyes } from './ui/eyes.js';
import { initNav } from './ui/nav.js';

const pageInitializers: Record<string, () => Promise<void>> = {
  '/': initHomePage,
  '/about/': initAboutPage,
  '/articles/': initArticlesPage,
  '/contact/': initContactPage,
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
  initNav();
  initEyes();

  const page = getCurrentPagePath();
  const initPage = pageInitializers[page];

  if (initPage) {
    await initPage();
  }
}

initCurrentPage();
