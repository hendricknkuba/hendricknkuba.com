import type { ContactFormPayload } from './payload.js';

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

export function validatePayload(payload: ContactFormPayload): string | null {
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
