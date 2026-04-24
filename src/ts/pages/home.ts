import { fetchJson } from '../lib/fetch-json.js';
import { qs, showError } from '../lib/dom.js';
import { renderLatestArticle } from '../render/articles.js';
import { renderFeaturedProjects } from '../render/projects.js';
import { renderRecentExperience } from '../render/experience.js';
import type { Article } from '../types/article.js';
import type { Project } from '../types/project.js';
import type { Experience } from '../types/experience.js';

export async function initHomePage(): Promise<void> {
  const projectsContainer = qs('#featured-projects-container');
  const experienceContainer = qs('#home-experience-container');
  const articlesContainer = qs('#home-articles-container');

  if (projectsContainer) {
    try {
      const projects = await fetchJson<Project[]>('/data/projects.json');
      renderFeaturedProjects(projectsContainer, projects);
    } catch {
      showError(projectsContainer, 'Could not load projects.');
    }
  }

  if (experienceContainer) {
    try {
      const experience = await fetchJson<Experience[]>('/data/experience.json');
      renderRecentExperience(experienceContainer, experience);
    } catch {
      showError(experienceContainer, 'Could not load experience.');
    }
  }

  if (articlesContainer) {
    try {
      const articles = await fetchJson<Article[]>('/data/articles.json');
      renderLatestArticle(articlesContainer, articles);
    } catch {
      showError(articlesContainer, 'Could not load articles.');
    }
  }
}
