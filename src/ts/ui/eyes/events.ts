import { setAngryState } from './animation.js';
import { queueRender, setRestingFocus } from './render.js';
import { isTouchEnvironment, type EyesState } from './state.js';

function shouldTrackTouchTarget(state: EyesState, target: EventTarget | null): boolean {
  if (!isTouchEnvironment()) {
    return true;
  }

  return target instanceof Node && !!state.navRoot?.contains(target);
}

export function bindGlobalListeners(state: EyesState): void {
  if (state.listenersBound) {
    return;
  }

  state.listenersBound = true;

  window.addEventListener('mousemove', (event) => {
    const now = performance.now();
    const elapsed = Math.max(now - state.lastMoveTime, 16);
    const distance = Math.hypot(event.clientX - state.lastMoveX, event.clientY - state.lastMoveY);
    const speed = distance / elapsed;

    state.pointerX = event.clientX;
    state.pointerY = event.clientY;
    state.lastMoveX = event.clientX;
    state.lastMoveY = event.clientY;
    state.lastMoveTime = now;

    if (speed > 2.2 && !state.eyesHovered && performance.now() > state.angryCooldownUntil) {
      setAngryState(state);
    }

    queueRender(state);
  });

  window.addEventListener('resize', () => {
    setRestingFocus(state);
    queueRender(state);
  });

  window.addEventListener('touchstart', (event) => {
    const touch = event.touches[0];

    if (!touch || !shouldTrackTouchTarget(state, event.target)) {
      return;
    }

    state.pointerX = touch.clientX;
    state.pointerY = touch.clientY;
    queueRender(state);
  }, { passive: true });

  window.addEventListener('touchmove', (event) => {
    const touch = event.touches[0];

    if (!touch || !shouldTrackTouchTarget(state, event.target)) {
      return;
    }

    state.pointerX = touch.clientX;
    state.pointerY = touch.clientY;
    queueRender(state);
  }, { passive: true });

  window.addEventListener('touchend', () => {
    if (state.touchResetTimer !== null) {
      window.clearTimeout(state.touchResetTimer);
    }

    state.touchResetTimer = window.setTimeout(() => {
      setRestingFocus(state);
      queueRender(state);
    }, 260);
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    setRestingFocus(state);
    queueRender(state);
  });
}

export function bindEyesEvents(state: EyesState): void {
  state.navRoot?.addEventListener('mouseenter', () => {
    if (isTouchEnvironment()) {
      return;
    }

    state.navHovered = true;
    queueRender(state);
  });

  state.navRoot?.addEventListener('mouseleave', () => {
    state.navHovered = false;
    state.eyesHovered = false;
    state.eyesRoot?.classList.remove('is-suspicious');
    setRestingFocus(state);
    queueRender(state);
  });

  state.eyesRoot?.addEventListener('mouseenter', () => {
    state.eyesHovered = true;
    state.eyesRoot?.classList.add('is-suspicious');
    queueRender(state);
  });

  state.eyesRoot?.addEventListener('mouseleave', () => {
    state.eyesHovered = false;
    state.eyesRoot?.classList.remove('is-suspicious');
    queueRender(state);
  });

  state.eyesRoot?.addEventListener('touchstart', (event) => {
    const touch = event.touches[0];

    if (!touch) {
      return;
    }

    state.eyesHovered = true;
    state.eyesRoot?.classList.add('is-suspicious');
    state.pointerX = touch.clientX;
    state.pointerY = touch.clientY;
    queueRender(state);
  }, { passive: true });

  state.eyesRoot?.addEventListener('touchend', () => {
    state.eyesHovered = false;
    state.eyesRoot?.classList.remove('is-suspicious');
    setRestingFocus(state);
    queueRender(state);
  }, { passive: true });
}
