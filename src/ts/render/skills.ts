import type { Skills } from '../types/site.js';

const CDN = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons';

const iconMap: Record<string, string> = {
  // Languages
  'JavaScript':   `${CDN}/javascript/javascript-original.svg`,
  'TypeScript':   `${CDN}/typescript/typescript-original.svg`,
  'PHP':          `${CDN}/php/php-original.svg`,
  'SQL':          `${CDN}/mysql/mysql-original.svg`,

  // Frameworks
  'Laravel':      `${CDN}/laravel/laravel-original.svg`,
  'Vue.js':       `${CDN}/vuejs/vuejs-original.svg`,
  'React':        `${CDN}/react/react-original.svg`,
  'Angular':      `${CDN}/angularjs/angularjs-original.svg`,
  'Next.js':      `${CDN}/nextjs/nextjs-original.svg`,
  'Node.js':      `${CDN}/nodejs/nodejs-original.svg`,
  'React Native': `${CDN}/react/react-original.svg`,

  // Tools
  'Firebase':     `${CDN}/firebase/firebase-plain.svg`,
  'Supabase':     `${CDN}/supabase/supabase-original.svg`,
  'PostgreSQL':   `${CDN}/postgresql/postgresql-original.svg`,
  'MySQL':        `${CDN}/mysql/mysql-original.svg`,
  'Git':          `${CDN}/git/git-original.svg`,
  'GitHub':       `${CDN}/github/github-original.svg`,
  'Bitbucket':    `${CDN}/bitbucket/bitbucket-original.svg`,
  'Postman':      `${CDN}/postman/postman-original.svg`,
  'Azure':        `${CDN}/azure/azure-original.svg`,
  'Jira':         `${CDN}/jira/jira-original.svg`,
};

const darkIcons = new Set(['GitHub', 'Next.js']);

function renderTag(label: string, withIcon = false): string {
  const src = withIcon ? iconMap[label] : undefined;
  if (!src) return `<span class="tag">${label}</span>`;
  const cls = darkIcons.has(label) ? ' class="icon-invert"' : '';
  return `<span class="tag"><img src="${src}" alt="" width="14" height="14"${cls} />${label}</span>`;
}

function renderGroup(label: string, items: string[], withIcons = false): string {
  const tags = items.map(i => renderTag(i, withIcons)).join('');
  return `
    <div>
      <p class="skills-group-label">${label}</p>
      <div class="tags">${tags}</div>
    </div>
  `;
}

export function renderSkills(container: Element, skills: Skills): void {
  container.innerHTML = `
    <div class="skills-grid">
      ${renderGroup('Languages', skills.languages, true)}
      ${renderGroup('Frameworks', skills.frameworks, true)}
      ${renderGroup('Tools', skills.tools, true)}
      ${renderGroup('Concepts', skills.concepts)}
    </div>
  `;
}
