let eyesRoot: HTMLElement | null = null;
let pupils: HTMLElement[] = [];
let blinkTimer: number | null = null;
let angryTimer: number | null = null;
let rafId: number | null = null;
let listenersBound = false;
let pointerX = window.innerWidth / 2;
let pointerY = window.innerHeight / 2;
let lastMoveX = pointerX;
let lastMoveY = pointerY;
let lastMoveTime = performance.now();
let navHovered = false;
let eyesHovered = false;
let angryCooldownUntil = 0;
let touchResetTimer: number | null = null;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function queueRender(): void {
  if (rafId !== null) {
    return;
  }

  rafId = window.requestAnimationFrame(() => {
    rafId = null;
    renderPupilPositions();
  });
}

function renderPupilPositions(): void {
  if (!eyesRoot || pupils.length === 0) {
    return;
  }

  pupils.forEach((pupil, index) => {
    const eye = pupil.parentElement;

    if (!(eye instanceof HTMLElement)) {
      return;
    }

    const rect = eye.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = pointerX - centerX;
    const dy = pointerY - centerY;
    const distance = Math.hypot(dx, dy) || 1;
    const cornerFactor = eyesHovered ? 0.18 : navHovered ? 0.22 : 0.14;
    const maxOffset = Math.min(rect.width, rect.height) * cornerFactor;
    let offsetX = (dx / distance) * maxOffset;
    let offsetY = (dy / distance) * maxOffset;

    if (eyesHovered) {
      offsetX += index === 0 ? 0.6 : -0.6;
      offsetY -= 0.2;
    }

    pupil.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
  });
}

function setAngryState(): void {
  if (!eyesRoot) {
    return;
  }

  eyesRoot.classList.add('is-angry');
  angryCooldownUntil = performance.now() + 1800;

  if (angryTimer !== null) {
    window.clearTimeout(angryTimer);
  }

  angryTimer = window.setTimeout(() => {
    eyesRoot?.classList.remove('is-angry');
    angryTimer = null;
  }, 650);
}

function scheduleBlink(): void {
  if (!eyesRoot || prefersReducedMotion()) {
    return;
  }

  if (blinkTimer !== null) {
    window.clearTimeout(blinkTimer);
  }

  const delay = 2200 + Math.random() * 2600;
  blinkTimer = window.setTimeout(() => {
    if (!eyesRoot) {
      return;
    }

    eyesRoot.classList.add('is-blinking');

    window.setTimeout(() => {
      eyesRoot?.classList.remove('is-blinking');
      scheduleBlink();
    }, 170);
  }, delay);
}

function bindListeners(): void {
  if (listenersBound) {
    return;
  }

  listenersBound = true;

  window.addEventListener('mousemove', (event) => {
    const now = performance.now();
    const elapsed = Math.max(now - lastMoveTime, 16);
    const distance = Math.hypot(event.clientX - lastMoveX, event.clientY - lastMoveY);
    const speed = distance / elapsed;

    pointerX = event.clientX;
    pointerY = event.clientY;
    lastMoveX = event.clientX;
    lastMoveY = event.clientY;
    lastMoveTime = now;

    if (speed > 2.2 && !eyesHovered && performance.now() > angryCooldownUntil) {
      setAngryState();
    }

    queueRender();
  });

  window.addEventListener('resize', () => {
    queueRender();
  });

  window.addEventListener('touchstart', (event) => {
    const touch = event.touches[0];

    if (!touch) {
      return;
    }

    pointerX = touch.clientX;
    pointerY = touch.clientY;
    queueRender();
  }, { passive: true });

  window.addEventListener('touchmove', (event) => {
    const touch = event.touches[0];

    if (!touch) {
      return;
    }

    pointerX = touch.clientX;
    pointerY = touch.clientY;
    queueRender();
  }, { passive: true });

  window.addEventListener('touchend', () => {
    if (touchResetTimer !== null) {
      window.clearTimeout(touchResetTimer);
    }

    touchResetTimer = window.setTimeout(() => {
      pointerX = window.innerWidth / 2;
      pointerY = window.innerHeight / 2;
      queueRender();
    }, 220);
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    pointerX = window.innerWidth / 2;
    pointerY = window.innerHeight / 2;
    queueRender();
  });
}

export function initEyes(): void {
  eyesRoot = document.querySelector<HTMLElement>('.site-eyes');
  pupils = Array.from(document.querySelectorAll<HTMLElement>('.site-eye-pupil'));

  if (!eyesRoot || pupils.length === 0) {
    return;
  }

  const nav = eyesRoot.closest('.site-nav');

  nav?.addEventListener('mouseenter', () => {
    navHovered = true;
    queueRender();
  });

  nav?.addEventListener('mouseleave', () => {
    navHovered = false;
    eyesHovered = false;
    eyesRoot?.classList.remove('is-suspicious');
    queueRender();
  });

  eyesRoot.addEventListener('mouseenter', () => {
    eyesHovered = true;
    eyesRoot?.classList.add('is-suspicious');
    queueRender();
  });

  eyesRoot.addEventListener('mouseleave', () => {
    eyesHovered = false;
    eyesRoot?.classList.remove('is-suspicious');
    queueRender();
  });

  eyesRoot.addEventListener('touchstart', (event) => {
    const touch = event.touches[0];

    if (!touch) {
      return;
    }

    eyesHovered = true;
    eyesRoot?.classList.add('is-suspicious');
    pointerX = touch.clientX;
    pointerY = touch.clientY;
    queueRender();
  }, { passive: true });

  eyesRoot.addEventListener('touchend', () => {
    eyesHovered = false;
    eyesRoot?.classList.remove('is-suspicious');
    queueRender();
  }, { passive: true });

  bindListeners();
  queueRender();
  scheduleBlink();
}
