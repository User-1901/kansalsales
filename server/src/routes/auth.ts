import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { pool } from '../db.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email.js';

const router = Router();

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ error: 'Too many login attempts. Please try again in 15 minutes.' });
  },
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SALT_ROUNDS = 10;

router.post('/register', async (req: Request, res: Response) => {
  const { email, displayName, password } = req.body as {
    email?: string;
    displayName?: string;
    password?: string;
  };

  // Validate inputs
  const errors: Record<string, string> = {};

  if (!email || !EMAIL_REGEX.test(email)) {
    errors.email = 'A valid email address is required.';
  }
  if (!displayName || displayName.trim().length === 0) {
    errors.displayName = 'Display name is required.';
  }
  if (!password || password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  if (Object.keys(errors).length > 0) {
    res.status(400).json({ errors });
    return;
  }

  // Check for duplicate email
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rowCount && existing.rowCount > 0) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  // Hash password and insert user
  const passwordHash = await bcrypt.hash(password!, SALT_ROUNDS);
  await pool.query(
    'INSERT INTO users (email, display_name, password_hash) VALUES ($1, $2, $3)',
    [email, displayName!.trim(), passwordHash],
  );

  // Fire-and-forget verification email
  sendVerificationEmail(email!, displayName!.trim()).catch(() => {
    // Email failure should not block registration
  });

  res.status(201).json({ message: 'Registration successful. Please check your email to verify your account.' });
});

router.post('/login', loginRateLimiter, async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const result = await pool.query(
    'SELECT id, email, display_name, password_hash, role FROM users WHERE email = $1',
    [email],
  );

  const user = result.rows[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const secret = process.env.JWT_SECRET ?? 'dev-secret';
  if (!secret) {
    res.status(500).json({ error: 'Server configuration error' });
    return;
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    secret,
    { expiresIn: '24h' },
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
    },
  });
});

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.status(200).json({ message: 'Logged out successfully' });
});

// ── Forgot password ──────────────────────────────────────────────────────────
router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string };
  if (!email || !EMAIL_REGEX.test(email)) {
    res.status(400).json({ error: 'A valid email address is required.' });
    return;
  }

  const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  // Always return 200 to avoid leaking whether email exists
  if (!result.rowCount || result.rowCount === 0) {
    res.status(200).json({ message: 'If that email is registered, a reset link has been sent.' });
    return;
  }

  const userId = result.rows[0].id;
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Invalidate any existing tokens for this user
  await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId]);
  await pool.query(
    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt.toISOString()],
  );

  const clientOrigin = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';
  const resetLink = `${clientOrigin}/reset-password?token=${token}`;

  sendPasswordResetEmail(email, resetLink).catch(() => {});

  res.status(200).json({ message: 'If that email is registered, a reset link has been sent.' });
});

// ── Reset password ───────────────────────────────────────────────────────────
router.post('/reset-password', async (req: Request, res: Response) => {
  const { token, password } = req.body as { token?: string; password?: string };

  if (!token || !password || password.length < 8) {
    res.status(400).json({ error: 'Token and a password of at least 8 characters are required.' });
    return;
  }

  const result = await pool.query(
    `SELECT prt.id, prt.user_id, prt.expires_at, prt.used
     FROM password_reset_tokens prt
     WHERE prt.token = $1`,
    [token],
  );

  if (!result.rowCount || result.rowCount === 0) {
    res.status(400).json({ error: 'Invalid or expired reset link.' });
    return;
  }

  const row = result.rows[0];

  if (row.used || new Date(row.expires_at) < new Date()) {
    res.status(400).json({ error: 'This reset link has expired or already been used.' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, row.user_id]);
  await pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE id = $1', [row.id]);

  res.status(200).json({ message: 'Password updated successfully. You can now log in.' });
});

export default router;
