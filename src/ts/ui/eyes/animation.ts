import { prefersReducedMotion, type EyesState } from './state.js';

export function setAngryState(state: EyesState): void {
  if (!state.eyesRoot) {
    return;
  }

  state.eyesRoot.classList.add('is-angry');
  state.angryCooldownUntil = performance.now() + 1800;

  if (state.angryTimer !== null) {
    window.clearTimeout(state.angryTimer);
  }

  state.angryTimer = window.setTimeout(() => {
    state.eyesRoot?.classList.remove('is-angry');
    state.angryTimer = null;
  }, 650);
}

export function scheduleBlink(state: EyesState): void {
  if (!state.eyesRoot || prefersReducedMotion()) {
    return;
  }

  if (state.blinkTimer !== null) {
    window.clearTimeout(state.blinkTimer);
  }

  const delay = 2200 + Math.random() * 2600;
  state.blinkTimer = window.setTimeout(() => {
    if (!state.eyesRoot) {
      return;
    }

    state.eyesRoot.classList.add('is-blinking');

    window.setTimeout(() => {
      state.eyesRoot?.classList.remove('is-blinking');
      scheduleBlink(state);
    }, 170);
  }, delay);
}
