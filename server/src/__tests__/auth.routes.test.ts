/**
 * Unit tests for auth API endpoints
 *
 * Validates: Requirements 2.1–2.9, 7.6, 7.7
 */

import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import request from 'supertest';

// ─── Mocks (hoisted before imports) ──────────────────────────────────────────

// Mock the db module entirely so the real Pool is never constructed
vi.mock('../db.js', () => ({
  pool: {
    query: vi.fn(),
  },
}));

// Mock email service so no real SMTP calls are made
vi.mock('../services/email.js', () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
}));

// Mock bcrypt so tests are fast and deterministic
vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
    compare: vi.fn(),
  },
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import app from '../app.js';
import { pool } from '../db.js';
import bcrypt from 'bcrypt';

const mockQuery = pool.query as ReturnType<typeof vi.fn>;
const mockBcryptCompare = bcrypt.compare as ReturnType<typeof vi.fn>;

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.DATABASE_URL = 'mock';
});

afterEach(() => {
  vi.clearAllMocks();
});

// ─── POST /api/auth/register ──────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('1. valid registration → 201 with success message', async () => {
    // No existing user, then insert succeeds
    mockQuery
      .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // duplicate check
      .mockResolvedValueOnce({ rowCount: 1, rows: [] }); // insert

    const res = await request(app).post('/api/auth/register').send({
      email: 'newuser@example.com',
      displayName: 'New User',
      password: 'securepass',
    });

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/registration successful/i);
  });

  it('2. missing email → 400 with validation error', async () => {
    const res = await request(app).post('/api/auth/register').send({
      displayName: 'No Email',
      password: 'securepass',
    });

    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty('email');
  });

  it('3. invalid email format → 400 with validation error', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'not-an-email',
      displayName: 'Bad Email',
      password: 'securepass',
    });

    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty('email');
  });

  it('4. password < 8 chars → 400 with validation error', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'user@example.com',
      displayName: 'Short Pass',
      password: 'short',
    });

    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty('password');
  });

  it('5. missing displayName → 400 with validation error', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'user@example.com',
      password: 'securepass',
    });

    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty('displayName');
  });

  it('6. duplicate email → 409 with "Email already registered"', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: '42' }] }); // existing user found

    const res = await request(app).post('/api/auth/register').send({
      email: 'existing@example.com',
      displayName: 'Existing User',
      password: 'securepass',
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Email already registered');
  });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  it('7. valid credentials → 200 with user object, sets cookie', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: '1',
          email: 'user@example.com',
          display_name: 'Test User',
          password_hash: 'hashed_password',
          role: 'user',
        },
      ],
    });
    mockBcryptCompare.mockResolvedValueOnce(true);

    const res = await request(app).post('/api/auth/login').send({
      email: 'user@example.com',
      password: 'correctpassword',
    });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      email: 'user@example.com',
      displayName: 'Test User',
      role: 'user',
    });
    // Cookie should be set
    expect(res.headers['set-cookie']).toBeDefined();
    const cookie = (res.headers['set-cookie'] as string[]).join(';');
    expect(cookie).toMatch(/token=/);
    expect(cookie).toMatch(/HttpOnly/i);
  });

  it('8. missing email or password → 400', async () => {
    const resMissingPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com' });

    expect(resMissingPassword.status).toBe(400);

    const resMissingEmail = await request(app)
      .post('/api/auth/login')
      .send({ password: 'somepassword' });

    expect(resMissingEmail.status).toBe(400);
  });

  it('9. user not found → 401 with "Invalid email or password"', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'somepassword',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  it('10. wrong password → 401 with "Invalid email or password"', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: '2',
          email: 'user@example.com',
          display_name: 'Test User',
          password_hash: 'hashed_password',
          role: 'user',
        },
      ],
    });
    mockBcryptCompare.mockResolvedValueOnce(false);

    const res = await request(app).post('/api/auth/login').send({
      email: 'user@example.com',
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────

describe('POST /api/auth/logout', () => {
  it('11. logout → 200 with "Logged out successfully", clears cookie', async () => {
    const res = await request(app).post('/api/auth/logout');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Logged out successfully');

    // Cookie should be cleared (expires in the past or Max-Age=0)
    const cookies = res.headers['set-cookie'] as string[] | undefined;
    expect(cookies).toBeDefined();
    const tokenCookie = (cookies ?? []).find((c) => c.startsWith('token='));
    expect(tokenCookie).toBeDefined();
    // Cleared cookies have an empty value and/or Max-Age=0 or Expires in the past
    expect(tokenCookie).toMatch(/token=;|Max-Age=0|Expires=Thu, 01 Jan 1970/i);
  });
});
