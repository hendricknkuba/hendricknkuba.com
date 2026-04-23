import { fetchJson } from '../lib/fetch-json.js';
import { qs, showError } from '../lib/dom.js';
import { renderProjects } from '../render/projects.js';
import type { Project } from '../types/project.js';

export async function initProjectsPage(): Promise<void> {
  const container = qs('#projects-container');

  if (container) {
    try {
      const projects = await fetchJson<Project[]>('/data/projects.json');
      renderProjects(container, projects);
    } catch {
      showError(container, 'Could not load projects.');
    }
  }
}
