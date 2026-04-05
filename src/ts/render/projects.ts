import type { Project } from '../types/project.js';

const githubIcon = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.341-3.369-1.341-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.742 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>`;

const externalIcon = `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clip-rule="evenodd"/></svg>`;

function renderProjectLinks(links: Project['links']): string {
  const parts: string[] = [];
  if (links.github) {
    parts.push(`<a href="${links.github}" class="project-link" target="_blank" rel="noopener noreferrer" aria-label="View on GitHub">${githubIcon}</a>`);
  }
  if (links.live) {
    parts.push(`<a href="${links.live}" class="project-link" target="_blank" rel="noopener noreferrer" aria-label="View live site">${externalIcon}</a>`);
  }
  return parts.length ? `<div class="project-links">${parts.join('')}</div>` : '';
}

function renderTags(stack: string[]): string {
  return `<div class="tags">${stack.map(t => `<span class="tag">${t}</span>`).join('')}</div>`;
}

function renderProjectCard(project: Project): string {
  return `
    <div class="project-card">
      <div class="project-card-header">
        <h3 class="project-title">${project.title}</h3>
        ${renderProjectLinks(project.links)}
      </div>
      <p class="project-summary">${project.summary}</p>
      ${renderTags(project.stack)}
    </div>
  `;
}

export function renderProjects(container: Element, projects: Project[]): void {
  if (projects.length === 0) {
    container.innerHTML = '<p class="empty-state">No projects yet.</p>';
    return;
  }
  container.innerHTML = `<div class="project-list">${projects.map(renderProjectCard).join('')}</div>`;
}

export function renderFeaturedProjects(container: Element, projects: Project[]): void {
  const featured = projects.filter(p => p.featured);
  renderProjects(container, featured);
}
