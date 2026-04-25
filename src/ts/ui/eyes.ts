import { scheduleBlink } from './eyes/animation.js';
import { bindEyesEvents, bindGlobalListeners } from './eyes/events.js';
import { queueRender, setRestingFocus } from './eyes/render.js';
import { createEyesState } from './eyes/state.js';

const state = createEyesState();

export function initEyes(): void {
  state.eyesRoot = document.querySelector<HTMLElement>('.site-eyes');
  state.pupils = Array.from(document.querySelectorAll<HTMLElement>('.site-eye-pupil'));

  if (!state.eyesRoot || state.pupils.length === 0) {
    return;
  }

  state.navRoot = state.eyesRoot.closest('.site-nav');

  bindEyesEvents(state);
  bindGlobalListeners(state);
  setRestingFocus(state);
  queueRender(state);
  scheduleBlink(state);
}
