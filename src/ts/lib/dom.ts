export function qs<T extends Element>(selector: string, scope: ParentNode = document): T | null {
  return scope.querySelector<T>(selector);
}

export function setHtml(el: Element, html: string): void {
  el.innerHTML = html;
}

export function showError(el: Element, message: string): void {
  el.innerHTML = `<p class="empty-state">${message}</p>`;
}
