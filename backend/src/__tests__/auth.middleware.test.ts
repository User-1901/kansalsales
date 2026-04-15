/**
 * Unit tests for authenticate and requireAdmin middleware
 *
 * Validates: Requirements 5.1, 5.2, 7.2, 7.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const TEST_SECRET = 'test-secret';

// Must set before importing the middleware so it picks up the env var
beforeEach(() => {
  process.env.JWT_SECRET = TEST_SECRET;
  vi.resetModules();
});

// Helper to build a minimal mock Request
function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    cookies: {},
    ...overrides,
  } as unknown as Request;
}

// Helper to build a mock Response that captures status/json calls
function mockRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: unknown) {
      this.body = data;
      return this;
    },
  };
  return res as unknown as Response & { statusCode: number; body: unknown };
}

function mockNext(): NextFunction & { called: boolean } {
  const fn = ((): unknown => vi.fn())() as NextFunction & { called: boolean };
  Object.defineProperty(fn, 'called', {
    get() {
      return (fn as ReturnType<typeof vi.fn>).mock.calls.length > 0;
    },
  });
  return fn;
}

// ─── authenticate ────────────────────────────────────────────────────────────

describe('authenticate middleware', () => {
  it('valid token: calls next() and attaches req.user', async () => {
    const { authenticate } = await import('../middleware/auth.js');

    const payload = { id: '1', email: 'user@example.com', role: 'user' as const };
    const token = jwt.sign(payload, TEST_SECRET, { expiresIn: '1h' });

    const req = mockReq({ cookies: { token } });
    const res = mockRes();
    const next = mockNext();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect((req as Request).user).toEqual({
      id: '1',
      email: 'user@example.com',
      role: 'user',
    });
  });

  it('missing token: returns 401 with Authentication required', async () => {
    const { authenticate } = await import('../middleware/auth.js');

    const req = mockReq({ cookies: {} });
    const res = mockRes();
    const next = mockNext();

    authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Authentication required' });
  });

  it('expired token: returns 401 with Invalid or expired token', async () => {
    const { authenticate } = await import('../middleware/auth.js');

    // Sign with a negative expiry so it is already expired
    const token = jwt.sign(
      { id: '2', email: 'old@example.com', role: 'user' },
      TEST_SECRET,
      { expiresIn: -1 },
    );

    const req = mockReq({ cookies: { token } });
    const res = mockRes();
    const next = mockNext();

    authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid or expired token' });
  });

  it('malformed token: returns 401 with Invalid or expired token', async () => {
    const { authenticate } = await import('../middleware/auth.js');

    const req = mockReq({ cookies: { token: 'not.a.valid.jwt' } });
    const res = mockRes();
    const next = mockNext();

    authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid or expired token' });
  });
});

// ─── requireAdmin ─────────────────────────────────────────────────────────────

describe('requireAdmin middleware', () => {
  it('admin role: calls next()', async () => {
    const { requireAdmin } = await import('../middleware/auth.js');

    const req = mockReq();
    (req as Request).user = { id: '10', email: 'admin@example.com', role: 'admin' };
    const res = mockRes();
    const next = mockNext();

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('non-admin role: returns 403 with Admin access required', async () => {
    const { requireAdmin } = await import('../middleware/auth.js');

    const req = mockReq();
    (req as Request).user = { id: '11', email: 'user@example.com', role: 'user' };
    const res = mockRes();
    const next = mockNext();

    requireAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: 'Admin access required' });
  });

  it('no req.user: returns 403 with Admin access required', async () => {
    const { requireAdmin } = await import('../middleware/auth.js');

    const req = mockReq(); // req.user is undefined
    const res = mockRes();
    const next = mockNext();

    requireAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: 'Admin access required' });
  });
});
