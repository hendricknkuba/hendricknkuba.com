import type { Article } from '../types/article.js';

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(date));
}

function renderTags(tags: string[]): string {
  return `<div class="tags">${tags.map((tag) => `<span class="tag">${tag}</span>`).join('')}</div>`;
}

function renderArticleCard(article: Article): string {
  return `
    <article class="article-card">
      <a class="article-card-link" href="/articles/${article.slug}/">
        <div class="article-card-meta">
          <time datetime="${article.date}">${formatDate(article.date)}</time>
        </div>
        <h2 class="article-card-title">${article.title}</h2>
        <p class="article-card-summary">${article.summary}</p>
        ${renderTags(article.tags)}
      </a>
    </article>
  `;
}

export function renderArticles(container: Element, articles: Article[]): void {
  if (articles.length === 0) {
    container.innerHTML = '<p class="empty-state">No articles published yet.</p>';
    return;
  }

  container.innerHTML = `<div class="article-list">${articles.map(renderArticleCard).join('')}</div>`;
}

export function renderLatestArticle(container: Element, articles: Article[]): void {
  if (articles.length === 0) {
    container.innerHTML = '<p class="empty-state">First article coming soon.</p>';
    return;
  }

  const [latest] = [...articles].sort((a, b) => b.date.localeCompare(a.date));

  container.innerHTML = `
    <article class="article-featured-card">
      <div class="article-featured-meta">
        <time datetime="${latest.date}">${formatDate(latest.date)}</time>
      </div>
      <h2 class="article-featured-title">
        <a href="/articles/${latest.slug}/">${latest.title}</a>
      </h2>
      ${renderTags(latest.tags)}
    </article>
  `;
}
