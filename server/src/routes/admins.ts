/**
 * Admin user management — only accessible by admins.
 * GET  /api/admins        — list all admin accounts
 * POST /api/admins        — create a new admin account
 * DELETE /api/admins/:id  — remove admin role (or delete account)
 */
import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(authenticate, requireAdmin);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SALT_ROUNDS = 10;

// GET /api/admins — list all admin users
router.get('/', async (_req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT id, email, display_name, email_verified, created_at
     FROM users WHERE role = 'admin' ORDER BY created_at ASC`,
  );
  res.json(result.rows);
});

// POST /api/admins — create a new admin account
router.post('/', async (req: Request, res: Response) => {
  const { email, displayName, password } = req.body as {
    email?: string;
    displayName?: string;
    password?: string;
  };

  const errors: Record<string, string> = {};
  if (!email || !EMAIL_REGEX.test(email)) errors.email = 'Valid email required.';
  if (!displayName || !displayName.trim()) errors.displayName = 'Display name required.';
  if (!password || password.length < 8) errors.password = 'Password must be at least 8 characters.';

  if (Object.keys(errors).length > 0) {
    res.status(400).json({ errors });
    return;
  }

  // Check duplicate
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rowCount && existing.rowCount > 0) {
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }

  const passwordHash = await bcrypt.hash(password!, SALT_ROUNDS);
  const result = await pool.query(
    `INSERT INTO users (email, display_name, password_hash, role, email_verified)
     VALUES ($1, $2, $3, 'admin', TRUE)
     RETURNING id, email, display_name, created_at`,
    [email!.toLowerCase().trim(), displayName!.trim(), passwordHash],
  );

  res.status(201).json(result.rows[0]);
});

// DELETE /api/admins/:id — remove an admin account
router.delete('/:id', async (req: Request, res: Response) => {
  // Prevent self-deletion
  if (req.user!.id === req.params.id) {
    res.status(400).json({ error: 'You cannot delete your own admin account.' });
    return;
  }

  const result = await pool.query(
    `DELETE FROM users WHERE id = $1 AND role = 'admin' RETURNING id`,
    [req.params.id],
  );

  if (!result.rowCount || result.rowCount === 0) {
    res.status(404).json({ error: 'Admin account not found.' });
    return;
  }

  res.status(204).send();
});

export default router;
