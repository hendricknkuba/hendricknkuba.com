import { fetchJson } from '../lib/fetch-json.js';
import { qs, showError } from '../lib/dom.js';
import { renderArticles } from '../render/articles.js';
import type { Article } from '../types/article.js';

export async function initArticlesPage(): Promise<void> {
  const container = qs('#articles-container');

  if (container) {
    try {
      const articles = await fetchJson<Article[]>('/data/articles.json');
      renderArticles(container, articles);
    } catch {
      showError(container, 'Could not load articles.');
    }
  }
}
