/**
 * Unit tests for contact API endpoint
 *
 * Validates: Requirements 6.3, 6.4
 */

import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import request from 'supertest';

// ─── Mocks (hoisted before imports) ──────────────────────────────────────────

vi.mock('../db.js', () => ({
  pool: { query: vi.fn() },
}));

vi.mock('../services/email.js', () => ({
  sendContactEmail: vi.fn(),
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import app from '../app.js';
import { sendContactEmail } from '../services/email.js';

const mockSendContactEmail = sendContactEmail as ReturnType<typeof vi.fn>;

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
});

afterEach(() => {
  vi.clearAllMocks();
});

// ─── POST /api/contact ────────────────────────────────────────────────────────

describe('POST /api/contact', () => {
  it('1. valid submission → 200 with success message and sendContactEmail called', async () => {
    mockSendContactEmail.mockResolvedValueOnce(undefined);

    const res = await request(app).post('/api/contact').send({
      name: 'Alice',
      email: 'alice@example.com',
      message: 'Hello, I have a question.',
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/sent/i);
    expect(mockSendContactEmail).toHaveBeenCalledOnce();
    expect(mockSendContactEmail).toHaveBeenCalledWith(
      'Alice',
      'alice@example.com',
      'Hello, I have a question.',
    );
  });

  it('2. missing name → 400 with errors.name', async () => {
    const res = await request(app).post('/api/contact').send({
      email: 'alice@example.com',
      message: 'Hello',
    });

    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty('name');
    expect(mockSendContactEmail).not.toHaveBeenCalled();
  });

  it('3. missing email → 400 with errors.email', async () => {
    const res = await request(app).post('/api/contact').send({
      name: 'Alice',
      message: 'Hello',
    });

    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty('email');
    expect(mockSendContactEmail).not.toHaveBeenCalled();
  });

  it('4. invalid email format → 400 with errors.email', async () => {
    const res = await request(app).post('/api/contact').send({
      name: 'Alice',
      email: 'not-an-email',
      message: 'Hello',
    });

    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty('email');
    expect(mockSendContactEmail).not.toHaveBeenCalled();
  });

  it('5. missing message → 400 with errors.message', async () => {
    const res = await request(app).post('/api/contact').send({
      name: 'Alice',
      email: 'alice@example.com',
    });

    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty('message');
    expect(mockSendContactEmail).not.toHaveBeenCalled();
  });

  it('6. all fields missing → 400 with errors for name, email, and message', async () => {
    const res = await request(app).post('/api/contact').send({});

    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty('name');
    expect(res.body.errors).toHaveProperty('email');
    expect(res.body.errors).toHaveProperty('message');
    expect(mockSendContactEmail).not.toHaveBeenCalled();
  });

  it('7. email send failure → still returns 200 (error is swallowed)', async () => {
    mockSendContactEmail.mockRejectedValueOnce(new Error('SMTP connection failed'));

    const res = await request(app).post('/api/contact').send({
      name: 'Alice',
      email: 'alice@example.com',
      message: 'Hello',
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/sent/i);
  });
});
