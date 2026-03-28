import { Router } from 'express';
import { pool } from '../db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET / — list all categories (public)
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query('SELECT id, name FROM categories ORDER BY name');
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST / — create category (admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  const { name } = req.body as { name?: string };
  if (!name || name.trim() === '') {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  try {
    const result = await pool.query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING id, name',
      [name.trim()],
    );
    res.status(201).json(result.rows[0]);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '23505') {
      res.status(409).json({ error: 'Category name already exists' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /:id — rename category (admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const { name } = req.body as { name?: string };
  if (!name || name.trim() === '') {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  try {
    const result = await pool.query(
      'UPDATE categories SET name = $1 WHERE id = $2 RETURNING id, name',
      [name.trim(), req.params.id],
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /:id — delete category (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
