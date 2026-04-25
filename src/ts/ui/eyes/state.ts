export type EyesState = {
  eyesRoot: HTMLElement | null;
  pupils: HTMLElement[];
  navRoot: HTMLElement | null;
  blinkTimer: number | null;
  angryTimer: number | null;
  rafId: number | null;
  listenersBound: boolean;
  pointerX: number;
  pointerY: number;
  lastMoveX: number;
  lastMoveY: number;
  lastMoveTime: number;
  navHovered: boolean;
  eyesHovered: boolean;
  angryCooldownUntil: number;
  touchResetTimer: number | null;
};

export function createEyesState(): EyesState {
  const pointerX = window.innerWidth / 2;
  const pointerY = window.innerHeight / 2;

  return {
    eyesRoot: null,
    pupils: [],
    navRoot: null,
    blinkTimer: null,
    angryTimer: null,
    rafId: null,
    listenersBound: false,
    pointerX,
    pointerY,
    lastMoveX: pointerX,
    lastMoveY: pointerY,
    lastMoveTime: performance.now(),
    navHovered: false,
    eyesHovered: false,
    angryCooldownUntil: 0,
    touchResetTimer: null
  };
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function isTouchEnvironment(): boolean {
  return window.matchMedia('(hover: none), (pointer: coarse)').matches;
}
