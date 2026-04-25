import { isTouchEnvironment, type EyesState } from './state.js';

export function setRestingFocus(state: EyesState): void {
  if (isTouchEnvironment() && state.navRoot) {
    const toggle = state.navRoot.querySelector<HTMLElement>('.nav-toggle');

    if (toggle) {
      const rect = toggle.getBoundingClientRect();
      state.pointerX = rect.left + rect.width / 2;
      state.pointerY = rect.top + rect.height / 2;
      return;
    }
  }

  state.pointerX = window.innerWidth / 2;
  state.pointerY = window.innerHeight / 2;
}

export function renderPupilPositions(state: EyesState): void {
  if (!state.eyesRoot || state.pupils.length === 0) {
    return;
  }

  state.pupils.forEach((pupil, index) => {
    const eye = pupil.parentElement;

    if (!(eye instanceof HTMLElement)) {
      return;
    }

    const rect = eye.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = state.pointerX - centerX;
    const dy = state.pointerY - centerY;
    const distance = Math.hypot(dx, dy) || 1;
    const cornerFactor = state.eyesHovered ? 0.18 : state.navHovered ? 0.2 : isTouchEnvironment() ? 0.1 : 0.14;
    const maxOffset = Math.min(rect.width, rect.height) * cornerFactor;
    let offsetX = (dx / distance) * maxOffset;
    let offsetY = (dy / distance) * maxOffset;

    if (state.eyesHovered) {
      offsetX += index === 0 ? 0.6 : -0.6;
      offsetY -= 0.2;
    }

    pupil.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
  });
}

export function queueRender(state: EyesState): void {
  if (state.rafId !== null) {
    return;
  }

  state.rafId = window.requestAnimationFrame(() => {
    state.rafId = null;
    renderPupilPositions(state);
  });
}
