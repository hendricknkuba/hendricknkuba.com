type SceneConfig = {
  label: string;
  value: string;
};

const sceneHud: Record<string, SceneConfig> = {
  opening: { label: 'Year 1', value: 'London, Ontario' },
  'new-road': { label: 'Checkpoint 01', value: 'Confidence +1' },
  rhythm: { label: 'Checkpoint 02', value: 'Rhythm found' },
  'hard-part': { label: 'Checkpoint 03', value: 'Accountability unlocked' },
  team: { label: 'Checkpoint 04', value: 'Team trust +1' },
  audit: { label: 'Mission Complete', value: 'Top 10 across Canada & USA' },
  final: { label: 'Final Checkpoint', value: 'Road ahead open' }
};

const audioPreferenceKey = 'uhaul-one-year-audio';
const splashSeenKey = 'uhaul-one-year-splash-seen';

// Tracks which scenes the user has already seen — no retype on scroll back.
const visitedScenes = new Set<string>();

// Whether we're still on the very first scene (no run animation on first load).
let isFirstScene = true;

// Aborts any in-flight transition when a new scene activates.
let sceneAbort: AbortController | null = null;

// Generation counter prevents a stale runAvatar finally-block from removing
// the is-running class that a newer invocation already owns.
let runGeneration = 0;

// Slideshow autoplay timer — module-level so it can be cleared on Swup nav.
let teamAutoTimer: ReturnType<typeof setTimeout> | null = null;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ─── First-visit splash ──────────────────────────────────────────────────────

function hasSeenSplash(): boolean {
  return sessionStorage.getItem(splashSeenKey) === 'true';
}

function markSplashSeen(): void {
  sessionStorage.setItem(splashSeenKey, 'true');
}

function createSplash(): HTMLElement {
  const splash = document.createElement('div');
  splash.className = 'uhaul-splash';
  splash.setAttribute('aria-hidden', 'true');

  const stars = Array.from({ length: 10 }, () => '<span class="uhaul-splash-star"></span>').join('');

  splash.innerHTML = `
    <div class="uhaul-splash-stars">${stars}</div>
    <div class="uhaul-splash-badge">
      <span class="uhaul-splash-badge-top">Checkpoint</span>
      <strong>01</strong>
      <span class="uhaul-splash-badge-bottom">Unlocked</span>
    </div>
    <div class="uhaul-splash-title">
      <span>Special One Year</span>
      <strong>At U-Haul</strong>
    </div>
  `;

  return splash;
}

async function runFirstVisitSplash(): Promise<void> {
  if (hasSeenSplash()) {
    return;
  }

  markSplashSeen();

  if (prefersReducedMotion()) {
    return;
  }

  const splash = createSplash();
  document.body.classList.add('uhaul-splash-active');
  document.body.appendChild(splash);

  await new Promise<void>(resolve => {
    const done = (): void => {
      splash.removeEventListener('animationend', onAnimationEnd);
      splash.remove();
      document.body.classList.remove('uhaul-splash-active');
      resolve();
    };

    const onAnimationEnd = (event: AnimationEvent): void => {
      if (event.animationName === 'uhaul-splash-exit') {
        done();
      }
    };

    splash.addEventListener('animationend', onAnimationEnd);
    window.setTimeout(done, 3600);
  });
}

// ─── Audio ───────────────────────────────────────────────────────────────────

function updateSoundButton(button: HTMLButtonElement, isPlaying: boolean): void {
  button.setAttribute('aria-pressed', String(isPlaying));
  button.setAttribute('aria-label', isPlaying ? 'Turn background music off' : 'Turn background music on');
  button.dataset.sound = isPlaying ? 'on' : 'off';
}

async function playAudio(audio: HTMLAudioElement, button: HTMLButtonElement): Promise<void> {
  audio.muted = false;
  audio.volume = 0.28;
  try {
    await audio.play();
    updateSoundButton(button, true);
    sessionStorage.setItem(audioPreferenceKey, 'on');
  } catch {
    audio.muted = true;
    updateSoundButton(button, false);
    sessionStorage.setItem(audioPreferenceKey, 'off');
  }
}

function pauseAudio(audio: HTMLAudioElement, button: HTMLButtonElement): void {
  audio.pause();
  audio.muted = true;
  updateSoundButton(button, false);
  sessionStorage.setItem(audioPreferenceKey, 'off');
}

function initAudioControls(story: HTMLElement): void {
  const audio = story.querySelector<HTMLAudioElement>('.uhaul-audio');
  const button = story.querySelector<HTMLButtonElement>('.uhaul-sound-toggle');
  if (!audio || !button) return;

  updateSoundButton(button, false);
  button.addEventListener('click', () => {
    if (audio.paused || audio.muted) { void playAudio(audio, button); return; }
    pauseAudio(audio, button);
  });
  if (sessionStorage.getItem(audioPreferenceKey) === 'on') void playAudio(audio, button);
}

// ─── HUD ─────────────────────────────────────────────────────────────────────

function setHud(story: HTMLElement, sceneName: string): void {
  const hud = sceneHud[sceneName];
  const label = story.querySelector<HTMLElement>('.uhaul-hud-label');
  const value = story.querySelector<HTMLElement>('.uhaul-hud-value');
  if (!hud || !label || !value) return;

  label.textContent = hud.label;
  value.textContent = hud.value;

  const hudEl = story.querySelector<HTMLElement>('.uhaul-hud');
  if (hudEl) {
    hudEl.classList.remove('is-updating');
    void hudEl.offsetWidth; // reflow to restart animation
    hudEl.classList.add('is-updating');
    setTimeout(() => hudEl.classList.remove('is-updating'), 400);
  }
}

// ─── Counters ────────────────────────────────────────────────────────────────

function animateCounter(element: HTMLElement): void {
  if (element.dataset.counted === 'true') return;
  const target = Number(element.dataset.countTo);
  if (!Number.isFinite(target)) return;
  element.dataset.counted = 'true';

  if (prefersReducedMotion()) { element.textContent = target.toLocaleString(); return; }

  const duration = 2000;
  const start = performance.now();

  function step(now: number): void {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = Math.round(target * eased).toLocaleString();
    if (progress < 1) requestAnimationFrame(step);
  }

  element.textContent = '0';
  requestAnimationFrame(step);
}

// ─── Async helpers ────────────────────────────────────────────────────────────

function abortableSleep(ms: number, signal: AbortSignal): Promise<void> {
  // If the signal is already aborted, reject immediately — addEventListener
  // won't fire because the abort event was already dispatched.
  if (signal.aborted) {
    return Promise.reject(new DOMException('Aborted', 'AbortError'));
  }
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  });
}

// ─── Dialog bubble ────────────────────────────────────────────────────────────

function extractDialogTexts(scene: HTMLElement): string[] {
  return Array.from(scene.querySelectorAll<HTMLElement>('.uhaul-dialogue p'))
    .map(p => p.textContent?.trim() ?? '')
    .filter(Boolean);
}

// The dialog bar lives outside <main> to avoid being re-positioned by the
// transform: translateY(0) on .transition-page. Query from document, not story.
function getBubble(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.uhaul-dialog-bubble');
}

function hideBubble(): void {
  const bubble = getBubble();
  if (!bubble) return;
  bubble.classList.remove('is-active');
  bubble.innerHTML = '';
}

async function typeTextInto(el: HTMLElement, text: string, signal: AbortSignal): Promise<void> {
  el.textContent = '';
  const cursor = document.createElement('span');
  cursor.className = 'uhaul-px-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  el.appendChild(cursor);

  try {
    for (let i = 0; i < text.length; i++) {
      if (signal.aborted) return;
      cursor.before(document.createTextNode(text[i]!));
      await abortableSleep(42, signal);
    }
  } catch {
    return;
  }

  cursor.remove();
}

async function showBubble(
  texts: string[],
  animate: boolean,
  signal: AbortSignal
): Promise<void> {
  const bubble = getBubble();
  if (!bubble || !texts.length) return;

  bubble.innerHTML = '';

  // All phrases go into a single paragraph — no height-growing line breaks
  const combined = texts.join(' ');
  const p = document.createElement('p');
  bubble.appendChild(p);

  if (animate) {
    bubble.classList.add('is-active');
    try { await abortableSleep(100, signal); } catch { return; }
    await typeTextInto(p, combined, signal);
  } else {
    p.textContent = combined;
    bubble.classList.add('is-active');
  }
}

// ─── Avatar run ───────────────────────────────────────────────────────────────

async function runAvatar(signal: AbortSignal): Promise<void> {
  const avatar = document.querySelector<HTMLElement>('.uhaul-fixed-avatar');
  if (!avatar) return;

  // Claim this generation so the finally block below can tell whether a newer
  // runAvatar has since taken over. Without this guard, the microtask that
  // runs the previous call's finally block would remove is-running AFTER the
  // new call's add — erasing the animation before it becomes visible.
  const gen = ++runGeneration;
  avatar.classList.add('is-running');
  try {
    await abortableSleep(680, signal);
  } finally {
    if (runGeneration === gen) {
      avatar.classList.remove('is-running');
    }
  }
}

// ─── Scene activation ─────────────────────────────────────────────────────────

async function activateScene(story: HTMLElement, scene: HTMLElement): Promise<void> {
  const sceneName = scene.dataset.scene;
  if (!sceneName) return;

  // Guard: IntersectionObserver fires immediately for elements already in viewport,
  // which would double-invoke for the opening scene and abort its own typing animation.
  // Skip if this scene is already the active one (only the direct init call should win).
  if (story.dataset.activeScene === sceneName) return;

  // Cancel any in-flight transition from a previous scene
  sceneAbort?.abort();
  sceneAbort = new AbortController();
  const { signal } = sceneAbort;

  // Synchronous DOM updates happen immediately, before any async work
  story.dataset.activeScene = sceneName;
  setHud(story, sceneName);

  story.querySelectorAll<HTMLElement>('.uhaul-scene.is-active').forEach(prev => {
    prev.classList.remove('is-active');
  });
  scene.classList.add('is-active');
  scene.classList.add('is-visible');
  scene.querySelectorAll<HTMLElement>('[data-count-to]').forEach(animateCounter);

  const alreadyVisited = visitedScenes.has(sceneName);
  visitedScenes.add(sceneName);

  const texts = extractDialogTexts(scene);
  hideBubble();

  if (!texts.length) return;

  // Already seen this scene: restore bubble instantly, no run, no typing
  if (alreadyVisited) {
    await showBubble(texts, false, signal);
    return;
  }

  const shouldRun = !isFirstScene && !prefersReducedMotion();
  const firstVisit = isFirstScene;
  isFirstScene = false;

  if (shouldRun) {
    try { await runAvatar(signal); } catch { return; }
  } else if (firstVisit) {
    // First scene on page load: brief wait for the page to settle
    try { await abortableSleep(560, signal); } catch { return; }
  }

  if (signal.aborted) return;

  await showBubble(texts, !prefersReducedMotion(), signal);
}

// ─── Team slideshow ───────────────────────────────────────────────────────────

function initTeamSlideshow(): void {
  const slideshow = document.querySelector<HTMLElement>('.uhaul-slideshow');
  if (!slideshow) return;

  const track = slideshow.querySelector<HTMLElement>('.uhaul-slides-track');
  const slides = Array.from(slideshow.querySelectorAll<HTMLElement>('.uhaul-slide'));
  const prevBtn = slideshow.querySelector<HTMLButtonElement>('.uhaul-slide-prev');
  const nextBtn = slideshow.querySelector<HTMLButtonElement>('.uhaul-slide-next');
  const numEl = slideshow.querySelector<HTMLElement>('.uhaul-slide-num');
  const dotsContainer = slideshow.querySelector<HTMLElement>('.uhaul-slide-dots');
  const flash = slideshow.querySelector<HTMLElement>('.uhaul-slide-flash');

  if (!track || slides.length === 0 || !prevBtn || !nextBtn || !numEl) return;

  // Re-assign with non-null types so nested functions can close over them
  const safePrev = prevBtn;
  const safeNext = nextBtn;
  const safeNum = numEl;

  let current = 0;
  const total = slides.length;
  const dots: HTMLButtonElement[] = [];

  // Build dot indicators
  if (dotsContainer) {
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'uhaul-dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Photo ${i + 1} of ${total}`);
      dot.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(dot);
      dots.push(dot);
    });
  }

  function triggerFlash(): void {
    if (!flash || prefersReducedMotion()) return;
    flash.classList.remove('is-flashing');
    void flash.offsetWidth;
    flash.classList.add('is-flashing');
  }

  const animClasses = ['slide-out-left', 'slide-out-right', 'slide-in-left', 'slide-in-right'] as const;

  function clearAnimClasses(el: HTMLElement): void {
    el.classList.remove(...animClasses);
  }

  function update(): void {
    safeNum.textContent = String(current + 1).padStart(2, '0');
    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === current);
      dot.setAttribute('aria-selected', String(i === current));
    });
    safePrev.disabled = current === 0;
    safeNext.disabled = current === total - 1;
  }

  const AUTOPLAY_MS = 4500;

  function scheduleAutoplay(): void {
    if (teamAutoTimer) clearTimeout(teamAutoTimer);
    teamAutoTimer = setTimeout(() => {
      // Only advance when the team scene is in view
      const teamScene = document.querySelector<HTMLElement>('.uhaul-scene[data-scene="team"]');
      if (teamScene?.classList.contains('is-active') || teamScene?.classList.contains('is-visible')) {
        const next = current < total - 1 ? current + 1 : 0;
        goTo(next, true); // always slide forward for autoplay loop
      }
      scheduleAutoplay(); // reschedule after each step
    }, AUTOPLAY_MS);
  }

  // isForwardOverride: explicit direction for autoplay loops (last → first = forward)
  function goTo(index: number, isForwardOverride?: boolean): void {
    if (index === current || index < 0 || index >= total) return;

    const isForward = isForwardOverride !== undefined ? isForwardOverride : index > current;
    const outgoing = slides[current]!;
    const incoming = slides[index]!;

    triggerFlash();
    current = index;
    update();
    scheduleAutoplay(); // reset timer on any navigation

    if (prefersReducedMotion()) {
      outgoing.classList.remove('is-current');
      incoming.classList.add('is-current');
      return;
    }

    const outClass = isForward ? 'slide-out-left' : 'slide-out-right';
    const inClass  = isForward ? 'slide-in-right' : 'slide-in-left';

    clearAnimClasses(outgoing);
    clearAnimClasses(incoming);

    outgoing.classList.add(outClass);
    incoming.classList.add('is-current', inClass);

    outgoing.addEventListener('animationend', () => {
      outgoing.classList.remove('is-current', outClass);
    }, { once: true });

    incoming.addEventListener('animationend', () => {
      clearAnimClasses(incoming);
    }, { once: true });
  }

  // Set the first slide as visible
  slides[0]?.classList.add('is-current');

  safePrev.addEventListener('click', () => goTo(current - 1));
  safeNext.addEventListener('click', () => goTo(current + 1));

  // Keyboard navigation when the team scene is active
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    const teamScene = document.querySelector<HTMLElement>('.uhaul-scene[data-scene="team"].is-active');
    if (!teamScene) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); }
  });

  // Touch swipe
  let touchStartX = 0;
  slideshow.addEventListener('touchstart', (e: TouchEvent) => {
    touchStartX = e.touches[0]?.clientX ?? 0;
  }, { passive: true });
  slideshow.addEventListener('touchend', (e: TouchEvent) => {
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX;
    if (Math.abs(dx) > 48) goTo(dx < 0 ? current + 1 : current - 1);
  }, { passive: true });

  update();
  scheduleAutoplay();
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export async function initUhaulOneYearPage(): Promise<void> {
  const story = document.querySelector<HTMLElement>('.uhaul-story');
  if (!story) return;

  const scenes = Array.from(story.querySelectorAll<HTMLElement>('.uhaul-scene'));
  if (scenes.length === 0) return;

  story.dataset.uhaulReady = 'true';
  initAudioControls(story);
  initTeamSlideshow();

  await runFirstVisitSplash();

  // Activate the first scene immediately (no run animation)
  void activateScene(story, scenes[0]!);

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        void activateScene(story, entry.target as HTMLElement);
      });
    },
    { rootMargin: '-35% 0px -45% 0px', threshold: 0 }
  );

  // Reduced motion: reveal all scenes immediately, no observer-driven animation
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    scenes.forEach(scene => {
      scene.classList.add('is-visible');
      if (scene.dataset.scene) visitedScenes.add(scene.dataset.scene);
    });
    return;
  }

  scenes.forEach(scene => observer.observe(scene));

  // The dialog bar lives outside #swup so Swup won't remove it automatically
  // when navigating to another page. Clean it up on the next content:replace.
  document.addEventListener('swup:content:replace', () => {
    document.querySelector('.uhaul-splash')?.remove();
    document.body.classList.remove('uhaul-splash-active');
    document.querySelector('.uhaul-dialog-bar')?.remove();
    if (teamAutoTimer) { clearTimeout(teamAutoTimer); teamAutoTimer = null; }
  }, { once: true });
}
