import { Request, Response, NextFunction } from 'express';

// Fields that must never be sanitized (passwords, tokens — bcrypt/crypto sensitive)
const SKIP_FIELDS = new Set(['password', 'token', 'newPassword', 'confirmPassword']);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function sanitizeValue(value: unknown, key?: string): unknown {
  // Never sanitize password/token fields
  if (key && SKIP_FIELDS.has(key)) return value;

  if (typeof value === 'string') return escapeHtml(value);

  if (Array.isArray(value)) return value.map(v => sanitizeValue(v));

  if (value !== null && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      sanitized[k] = sanitizeValue(v, k);
    }
    return sanitized;
  }
  return value;
}

export function sanitize(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  next();
}
