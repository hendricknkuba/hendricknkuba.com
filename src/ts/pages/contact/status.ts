type ContactStatusState = 'idle' | 'info' | 'success' | 'error';

export function setStatus(el: HTMLElement, state: ContactStatusState, message: string): void {
  el.dataset.state = state;
  el.textContent = message;
}

export function setSubmittingState(button: HTMLButtonElement, isSubmitting: boolean): void {
  if (!button.dataset.defaultLabel) {
    button.dataset.defaultLabel = button.textContent ?? 'Send message';
  }

  button.disabled = isSubmitting;
  button.textContent = isSubmitting ? 'Sending…' : button.dataset.defaultLabel;
}
