import { fetchJson } from '../lib/fetch-json.js';
import { qs, showError } from '../lib/dom.js';
import { renderProjects } from '../render/projects.js';
import type { Project } from '../types/project.js';

async function init(): Promise<void> {
  const container = qs('#projects-container');

  if (container) {
    try {
      const projects = await fetchJson<Project[]>('data/projects.json');
      renderProjects(container, projects);
    } catch {
      showError(container, 'Could not load projects.');
    }
  }
}

init();
