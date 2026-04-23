import { qs } from '../lib/dom.js';
import { fetchJson } from '../lib/fetch-json.js';
import type { SiteConfig } from '../types/site.js';

interface ContactFormPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
  company: string;
  website: string;
  honeypot: string;
}

interface ContactApiResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

const ATTEMPT_COOLDOWN_MS = 15_000;
const SUCCESS_COOLDOWN_MS = 120_000;
const REQUEST_TIMEOUT_MS = 12_000;
const MESSAGE_LIMIT = 2_000;
const LAST_ATTEMPT_KEY = 'contact-last-attempt-at';
const LAST_SUCCESS_KEY = 'contact-last-success-at';

function sanitizeValue(value: string, preserveLineBreaks = false): string {
  const normalized = value
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');

  if (preserveLineBreaks) {
    return normalized
      .replace(/\r\n?/g, '\n')
      .replace(/[^\S\n]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .slice(0, MESSAGE_LIMIT);
  }

  return normalized.replace(/\s+/g, ' ').trim();
}

function isValidWebsite(value: string): boolean {
  if (value === '') {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function getStoredTimestamp(key: string): number {
  const value = window.localStorage.getItem(key);
  const parsed = value ? Number.parseInt(value, 10) : 0;

  return Number.isFinite(parsed) ? parsed : 0;
}

function getRemainingCooldownMs(): number {
  const now = Date.now();
  const lastSuccess = getStoredTimestamp(LAST_SUCCESS_KEY);
  const lastAttempt = getStoredTimestamp(LAST_ATTEMPT_KEY);
  const successRemaining = Math.max(0, SUCCESS_COOLDOWN_MS - (now - lastSuccess));
  const attemptRemaining = Math.max(0, ATTEMPT_COOLDOWN_MS - (now - lastAttempt));

  return Math.max(successRemaining, attemptRemaining);
}

function formatRemainingCooldown(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);

  if (totalSeconds >= 60) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (seconds === 0) {
      return `${minutes} min`;
    }

    return `${minutes}m ${seconds}s`;
  }

  return `${totalSeconds}s`;
}

function setStatus(el: HTMLElement, state: 'idle' | 'info' | 'success' | 'error', message: string): void {
  el.dataset.state = state;
  el.textContent = message;
}

function setSubmittingState(button: HTMLButtonElement, isSubmitting: boolean): void {
  if (!button.dataset.defaultLabel) {
    button.dataset.defaultLabel = button.textContent ?? 'Send message';
  }

  button.disabled = isSubmitting;
  button.textContent = isSubmitting ? 'Sending…' : button.dataset.defaultLabel;
}

function getApiBaseUrl(siteConfig: SiteConfig | null): string {
  if (siteConfig?.contactApiBaseUrl) {
    return siteConfig.contactApiBaseUrl.replace(/\/$/, '');
  }

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }

  return '';
}

function getField<T extends HTMLElement>(form: HTMLFormElement, selector: string): T {
  const field = qs<T>(selector, form);

  if (!field) {
    throw new Error(`Missing form field: ${selector}`);
  }

  return field;
}

function validatePayload(payload: ContactFormPayload): string | null {
  if (payload.honeypot !== '') {
    return 'Spam check failed.';
  }

  if (payload.name.length < 2) {
    return 'Please enter your name.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return 'Please enter a valid email address.';
  }

  if (payload.subject.length < 3) {
    return 'Please add a short subject.';
  }

  if (payload.message.length < 10) {
    return 'Please share a little more detail in your message.';
  }

  if (!isValidWebsite(payload.website)) {
    return 'Website must start with http:// or https://';
  }

  return null;
}

export async function initContactPage(): Promise<void> {
  const form = qs<HTMLFormElement>('#contact-form');

  if (!form) {
    return;
  }

  const status = getField<HTMLElement>(form, '[data-contact-status]');
  const submitButton = getField<HTMLButtonElement>(form, 'button[type="submit"]');
  const messageField = getField<HTMLTextAreaElement>(form, '#contact-message');
  const messageCount = getField<HTMLElement>(form, '[data-message-count]');
  const fallbackLink = getField<HTMLAnchorElement>(form, '[data-contact-fallback]');
  const nameField = getField<HTMLInputElement>(form, '#contact-name');
  const emailField = getField<HTMLInputElement>(form, '#contact-email');
  const subjectField = getField<HTMLInputElement>(form, '#contact-subject');
  const companyField = getField<HTMLInputElement>(form, '#contact-company');
  const websiteField = getField<HTMLInputElement>(form, '#contact-website');
  const honeypotField = getField<HTMLInputElement>(form, '#contact-honeypot');

  const siteConfig = await fetchJson<SiteConfig>('/data/site.json').catch(() => null);
  const apiBaseUrl = getApiBaseUrl(siteConfig);
  const emailAddress = siteConfig?.email ?? 'hendrick.nkuba@outlook.com';
  fallbackLink.href = `mailto:${emailAddress}`;

  const syncMessageCount = (): void => {
    const length = messageField.value.length;
    messageCount.textContent = `${length}/${MESSAGE_LIMIT}`;
  };

  syncMessageCount();

  form.addEventListener('input', (event) => {
    if (event.target === messageField) {
      syncMessageCount();
    }

    if (status.dataset.state === 'error') {
      setStatus(status, 'idle', 'Best for project work, freelance inquiries, or opportunities.');
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!apiBaseUrl) {
      setStatus(status, 'error', 'The contact API is not configured yet. You can still email me directly.');
      return;
    }

    if (!window.navigator.onLine) {
      setStatus(status, 'error', 'You look offline right now. Please reconnect and try again.');
      return;
    }

    const remainingCooldown = getRemainingCooldownMs();

    if (remainingCooldown > 0) {
      setStatus(
        status,
        'info',
        `Please wait ${formatRemainingCooldown(remainingCooldown)} before sending another message.`
      );
      return;
    }

    const payload: ContactFormPayload = {
      name: sanitizeValue(nameField.value),
      email: sanitizeValue(emailField.value),
      subject: sanitizeValue(subjectField.value),
      message: sanitizeValue(messageField.value, true),
      company: sanitizeValue(companyField.value),
      website: sanitizeValue(websiteField.value),
      honeypot: honeypotField.value.trim()
    };

    const validationError = validatePayload(payload);

    if (validationError) {
      setStatus(status, 'error', validationError);
      return;
    }

    window.localStorage.setItem(LAST_ATTEMPT_KEY, String(Date.now()));
    setSubmittingState(submitButton, true);
    setStatus(status, 'info', 'Sending securely…');

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${apiBaseUrl}/api/contact`, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-store',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const result = await response.json().catch(() => null) as ContactApiResponse | null;

      if (!response.ok || !result?.success) {
        if (response.status === 429) {
          setStatus(status, 'info', 'Too many requests. Please wait a bit before trying again.');
          return;
        }

        setStatus(status, 'error', result?.error ?? result?.message ?? 'Could not send your message. Please try again later.');
        return;
      }

      window.localStorage.setItem(LAST_SUCCESS_KEY, String(Date.now()));
      form.reset();
      syncMessageCount();
      setStatus(status, 'success', result.message ?? 'Message sent successfully. I will get back to you soon.');
    } catch (error) {
      const message = error instanceof DOMException && error.name === 'AbortError'
        ? 'The request took too long. Please try again in a moment.'
        : 'Could not reach the contact API. You can still email me directly.';

      setStatus(status, 'error', message);
    } finally {
      window.clearTimeout(timeoutId);
      setSubmittingState(submitButton, false);
    }
  });
}
