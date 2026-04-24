import { qs } from '../lib/dom.js';
import { fetchJson } from '../lib/fetch-json.js';
import type { SiteConfig } from '../types/site.js';
import {
  formatRemainingCooldown,
  getRemainingCooldownMs,
  markContactAttempt,
  markContactSuccess
} from './contact/cooldown.js';
import { buildContactPayload, MESSAGE_LIMIT } from './contact/payload.js';
import type { ContactApiResponse } from './contact/payload.js';
import { setStatus, setSubmittingState } from './contact/status.js';
import { validatePayload } from './contact/validation.js';

const REQUEST_TIMEOUT_MS = 12_000;
const DEFAULT_CONTACT_STATUS = 'Best for project work, freelance inquiries, or opportunities.';

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
  const fields = {
    name: getField<HTMLInputElement>(form, '#contact-name'),
    email: getField<HTMLInputElement>(form, '#contact-email'),
    subject: getField<HTMLInputElement>(form, '#contact-subject'),
    message: messageField,
    company: getField<HTMLInputElement>(form, '#contact-company'),
    website: getField<HTMLInputElement>(form, '#contact-website'),
    honeypot: getField<HTMLInputElement>(form, '#contact-honeypot')
  };

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
      setStatus(status, 'idle', DEFAULT_CONTACT_STATUS);
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!apiBaseUrl) {
      setStatus(status, 'error', 'The form is not available right now. You can still email me directly.');
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

    const payload = buildContactPayload(fields);
    const validationError = validatePayload(payload);

    if (validationError) {
      setStatus(status, 'error', validationError);
      return;
    }

    markContactAttempt();
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

      markContactSuccess();
      form.reset();
      syncMessageCount();
      setStatus(status, 'success', result.message ?? 'Message sent successfully. I will get back to you soon.');
    } catch (error) {
      const message = error instanceof DOMException && error.name === 'AbortError'
        ? 'The request took too long. Please try again in a moment.'
        : 'Something went wrong while sending your message. You can still email me directly.';

      setStatus(status, 'error', message);
    } finally {
      window.clearTimeout(timeoutId);
      setSubmittingState(submitButton, false);
    }
  });
}
