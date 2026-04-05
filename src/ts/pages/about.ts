import { fetchJson } from '../lib/fetch-json.js';
import { qs, showError } from '../lib/dom.js';
import { renderSkills } from '../render/skills.js';
import type { Skills } from '../types/site.js';

async function init(): Promise<void> {
  const skillsContainer = qs('#skills-container');

  if (skillsContainer) {
    try {
      const skills = await fetchJson<Skills>('data/skills.json');
      renderSkills(skillsContainer, skills);
    } catch {
      showError(skillsContainer, 'Could not load skills.');
    }
  }
}

init();
