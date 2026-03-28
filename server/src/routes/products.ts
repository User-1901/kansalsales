import { Router } from 'express';
import { pool } from '../db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET / — list all products (public); supports ?search= and ?category=
router.get('/', async (req, res) => {
  const { search, category } = req.query as { search?: string; category?: string };

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (search && search.trim() !== '') {
    params.push(`%${search.trim()}%`);
    conditions.push(`(name ILIKE $${params.length} OR description ILIKE $${params.length})`);
  }

  if (category && category.trim() !== '') {
    params.push(category.trim());
    conditions.push(`category_id = $${params.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT id, name, description, price::text, stock_status, category_id, image_urls, created_at, updated_at
       FROM products ${where} ORDER BY created_at DESC`,
      params,
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /:id — single product (public)
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, price::text, stock_status, category_id, image_urls, created_at, updated_at
       FROM products WHERE id = $1`,
      [req.params.id],
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST / — create product (admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  const { name, description, price, stock_status, category_id, image_urls } = req.body as {
    name?: string;
    description?: string;
    price?: unknown;
    stock_status?: string;
    category_id?: string;
    image_urls?: unknown;
  };

  const errors: string[] = [];

  if (!name || String(name).trim() === '') errors.push('name is required');
  if (price === undefined || price === null || price === '') {
    errors.push('price is required');
  } else {
    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum <= 0) errors.push('price must be a positive number');
  }
  if (!stock_status || !['in_stock', 'out_of_stock'].includes(stock_status)) {
    errors.push("stock_status must be 'in_stock' or 'out_of_stock'");
  }
  if (image_urls !== undefined && !Array.isArray(image_urls)) {
    errors.push('image_urls must be an array of strings');
  }

  if (errors.length > 0) {
    res.status(400).json({ errors });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO products (name, description, price, stock_status, category_id, image_urls)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, description, price::text, stock_status, category_id, image_urls, created_at, updated_at`,
      [
        String(name).trim(),
        description ?? null,
        Number(price),
        stock_status,
        category_id ?? null,
        image_urls ?? [],
      ],
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /:id — update product (admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const { name, description, price, stock_status, category_id, image_urls } = req.body as {
    name?: string;
    description?: string;
    price?: unknown;
    stock_status?: string;
    category_id?: string | null;
    image_urls?: unknown;
  };

  const errors: string[] = [];

  if (name !== undefined && String(name).trim() === '') errors.push('name cannot be empty');
  if (price !== undefined) {
    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum <= 0) errors.push('price must be a positive number');
  }
  if (stock_status !== undefined && !['in_stock', 'out_of_stock'].includes(stock_status)) {
    errors.push("stock_status must be 'in_stock' or 'out_of_stock'");
  }
  if (image_urls !== undefined && !Array.isArray(image_urls)) {
    errors.push('image_urls must be an array of strings');
  }

  if (errors.length > 0) {
    res.status(400).json({ errors });
    return;
  }

  const setClauses: string[] = [];
  const params: unknown[] = [];

  if (name !== undefined) {
    params.push(String(name).trim());
    setClauses.push(`name = $${params.length}`);
  }
  if (description !== undefined) {
    params.push(description);
    setClauses.push(`description = $${params.length}`);
  }
  if (price !== undefined) {
    params.push(Number(price));
    setClauses.push(`price = $${params.length}`);
  }
  if (stock_status !== undefined) {
    params.push(stock_status);
    setClauses.push(`stock_status = $${params.length}`);
  }
  if (category_id !== undefined) {
    params.push(category_id);
    setClauses.push(`category_id = $${params.length}`);
  }
  if (image_urls !== undefined) {
    params.push(image_urls);
    setClauses.push(`image_urls = $${params.length}`);
  }

  if (setClauses.length === 0) {
    res.status(400).json({ errors: ['No fields provided for update'] });
    return;
  }

  setClauses.push(`updated_at = NOW()`);
  params.push(req.params.id);

  try {
    const result = await pool.query(
      `UPDATE products SET ${setClauses.join(', ')} WHERE id = $${params.length}
       RETURNING id, name, description, price::text, stock_status, category_id, image_urls, created_at, updated_at`,
      params,
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /:id — delete product (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
