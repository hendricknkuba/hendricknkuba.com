import { fetchJson } from '../lib/fetch-json.js';
import { qs, showError } from '../lib/dom.js';
import { renderExperience } from '../render/experience.js';
import type { Experience } from '../types/experience.js';

async function init(): Promise<void> {
  const container = qs('#experience-container');

  if (container) {
    try {
      const experience = await fetchJson<Experience[]>('data/experience.json');
      renderExperience(container, experience);
    } catch {
      showError(container, 'Could not load experience.');
    }
  }
}

init();
