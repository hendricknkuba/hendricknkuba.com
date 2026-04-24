export const MESSAGE_LIMIT = 2_000;

export interface ContactFormPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
  company: string;
  website: string;
  honeypot: string;
}

export interface ContactApiResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

interface ContactFormFields {
  name: HTMLInputElement;
  email: HTMLInputElement;
  subject: HTMLInputElement;
  message: HTMLTextAreaElement;
  company: HTMLInputElement;
  website: HTMLInputElement;
  honeypot: HTMLInputElement;
}

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

export function buildContactPayload(fields: ContactFormFields): ContactFormPayload {
  return {
    name: sanitizeValue(fields.name.value),
    email: sanitizeValue(fields.email.value),
    subject: sanitizeValue(fields.subject.value),
    message: sanitizeValue(fields.message.value, true),
    company: sanitizeValue(fields.company.value),
    website: sanitizeValue(fields.website.value),
    honeypot: fields.honeypot.value.trim()
  };
}
