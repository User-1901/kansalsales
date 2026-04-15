import { Router } from 'express';
import { pool } from '../db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/ratings/admin/all-ratings — get all ratings across all products (admin only)
router.get('/admin/all-ratings', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.product_id, p.name as product_name, r.user_id, r.guest_email, r.rating, r.review_text, r.created_at
       FROM ratings r
       LEFT JOIN products p ON r.product_id = p.id
       ORDER BY r.created_at DESC`,
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/ratings/:productId — get all ratings for a product (public)
router.get('/:productId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, product_id, user_id, guest_email, rating, review_text, created_at
       FROM ratings
       WHERE product_id = $1
       ORDER BY created_at DESC`,
      [req.params.productId],
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/ratings/:productId/stats — get rating statistics for a product (public)
router.get('/:productId/stats', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        COUNT(*) as total_ratings,
        AVG(rating)::NUMERIC(3,2) as average_rating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
       FROM ratings
       WHERE product_id = $1`,
      [req.params.productId],
    );
    res.json(result.rows[0] || {
      total_ratings: 0,
      average_rating: 0,
      five_star: 0,
      four_star: 0,
      three_star: 0,
      two_star: 0,
      one_star: 0,
    });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/ratings — create a new rating (requires auth or guest email)
router.post('/', authenticate, async (req, res) => {
  const { productId, rating, reviewText, guestEmail } = req.body as {
    productId?: string;
    rating?: unknown;
    reviewText?: string;
    guestEmail?: string;
  };

  const errors: string[] = [];

  if (!productId || productId.trim === undefined || productId.trim() === '') {
    errors.push('productId is required');
  }
  if (rating === undefined || rating === null) {
    errors.push('rating is required');
  } else {
    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      errors.push('rating must be between 1 and 5');
    }
  }

  if (errors.length > 0) {
    res.status(400).json({ errors });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO ratings (product_id, user_id, guest_email, rating, review_text)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, product_id, user_id, guest_email, rating, review_text, created_at`,
      [
        productId!.trim(),
        req.user?.id || null,
        guestEmail || null,
        Number(rating),
        reviewText?.trim() || null,
      ],
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/ratings/:id — delete a rating (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM ratings WHERE id = $1',
      [req.params.id],
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Rating not found' });
      return;
    }
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
