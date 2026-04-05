import type { Experience } from '../types/experience.js';

function renderHighlights(highlights: string[]): string {
  return `<ul class="experience-highlights">${highlights.map(h => `<li>${h}</li>`).join('')}</ul>`;
}

function renderTags(stack: string[]): string {
  if (stack.length === 0) return '';
  return `<div class="tags" style="margin-top: var(--space-4);">${stack.map(t => `<span class="tag">${t}</span>`).join('')}</div>`;
}

function renderExperienceItem(exp: Experience): string {
  return `
    <div class="experience-item">
      <div>
        <p class="experience-period">${exp.period}</p>
      </div>
      <div>
        <p class="experience-company">${exp.company}</p>
        <p class="experience-role">${exp.role} · ${exp.location}</p>
        ${renderHighlights(exp.highlights)}
        ${renderTags(exp.stack)}
      </div>
    </div>
  `;
}

export function renderExperience(container: Element, experience: Experience[]): void {
  if (experience.length === 0) {
    container.innerHTML = '<p class="empty-state">No experience entries yet.</p>';
    return;
  }
  container.innerHTML = `<div class="experience-list">${experience.map(renderExperienceItem).join('')}</div>`;
}

export function renderRecentExperience(container: Element, experience: Experience[]): void {
  renderExperience(container, experience.slice(0, 2));
}
