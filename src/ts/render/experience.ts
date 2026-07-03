import type { Experience } from '../types/experience.js';

function renderHighlights(highlights: string[]): string {
  return `<ul class="experience-highlights">${highlights.map(h => `<li>${h}</li>`).join('')}</ul>`;
}

function renderTags(stack: string[]): string {
  if (stack.length === 0) return '';
  return `<div class="tags" style="margin-top: var(--space-4);">${stack.map(t => `<span class="tag">${t}</span>`).join('')}</div>`;
}

function renderFeature(exp: Experience): string {
  if (!exp.feature) return '';

  return `
    <a class="experience-feature-link" href="${exp.feature.href}">
      <span>${exp.feature.label}</span>
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <path d="M3.5 8h9"/>
        <path d="M8.5 4l4 4-4 4"/>
      </svg>
    </a>
  `;
}

function renderExperienceItem(exp: Experience): string {
  return `
    <div class="experience-item${exp.feature ? ' experience-item-featured' : ''}">
      <div>
        <p class="experience-period">${exp.period}</p>
      </div>
      <div>
        <p class="experience-company">${exp.company}</p>
        <p class="experience-role">${exp.role} · ${exp.location}</p>
        ${renderHighlights(exp.highlights)}
        ${renderTags(exp.stack)}
        ${renderFeature(exp)}
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
