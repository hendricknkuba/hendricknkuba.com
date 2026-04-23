import { initCurrentPage } from './app.js';

declare global {
  interface Window {
    Swup: new (options?: {
      containers?: string[];
      animationScope?: 'html' | 'containers';
      native?: boolean;
      hooks?: {
        [key: string]: () => void | Promise<void>;
      };
    }) => unknown;
  }
}

function initSwup(): void {
  if (typeof window.Swup !== 'function') {
    return;
  }

  new window.Swup({
    containers: ['#site-nav', '#swup'],
    animationScope: 'html',
    native: false,
    hooks: {
      'page:view': () => initCurrentPage()
    }
  });
}

initSwup();

export {};
