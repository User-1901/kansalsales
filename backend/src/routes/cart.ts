import { Router } from 'express';
import { pool } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All cart endpoints require authentication
router.use(authenticate);

/** Helper: fetch the full cart for a user */
async function getCart(userId: string): Promise<{
  userId: string;
  items: { productId: string; name: string; price: string; quantity: number }[];
  total: string;
}> {
  const result = await pool.query(
    `SELECT ci.product_id AS "productId", p.name, p.price::text, ci.quantity
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.user_id = $1
     ORDER BY ci.added_at ASC`,
    [userId],
  );

  const items = result.rows as {
    productId: string;
    name: string;
    price: string;
    quantity: number;
  }[];

  const total = items
    .reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0)
    .toFixed(2);

  return { userId, items, total };
}

// GET / — return authenticated user's cart with computed total
router.get('/', async (req, res) => {
  try {
    const cart = await getCart(req.user!.id);
    res.json(cart);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /items — add item to cart
router.post('/items', async (req, res) => {
  const { productId, quantity } = req.body as { productId?: unknown; quantity?: unknown };

  if (!productId || String(productId).trim() === '') {
    res.status(400).json({ error: 'productId is required' });
    return;
  }

  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty <= 0) {
    res.status(400).json({ error: 'Quantity must be greater than 0' });
    return;
  }

  try {
    // Check product exists
    const productResult = await pool.query('SELECT id FROM products WHERE id = $1', [
      String(productId).trim(),
    ]);
    if (productResult.rowCount === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Insert or update on conflict
    await pool.query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity`,
      [req.user!.id, String(productId).trim(), qty],
    );

    const cart = await getCart(req.user!.id);
    res.status(201).json(cart);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /items/:productId — update quantity
router.put('/items/:productId', async (req, res) => {
  const { quantity } = req.body as { quantity?: unknown };

  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty <= 0) {
    res.status(400).json({ error: 'Quantity must be greater than 0' });
    return;
  }

  try {
    const result = await pool.query(
      `UPDATE cart_items SET quantity = $1
       WHERE user_id = $2 AND product_id = $3`,
      [qty, req.user!.id, req.params.productId],
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Item not found in cart' });
      return;
    }

    const cart = await getCart(req.user!.id);
    res.json(cart);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /checkout — return order summary (no payment processing)
router.post('/checkout', async (req, res) => {
  try {
    const cart = await getCart(req.user!.id);

    if (cart.items.length === 0) {
      res.status(400).json({ error: 'Cart is empty' });
      return;
    }

    const orderSummary = {
      cartId: req.user!.id,
      items: cart.items,
      total: cart.total,
      currency: 'INR',
    };

    res.json(orderSummary);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /items/:productId — remove item from cart
router.delete('/items/:productId', async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2`,
      [req.user!.id, req.params.productId],
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Item not found in cart' });
      return;
    }

    const cart = await getCart(req.user!.id);
    res.json(cart);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
