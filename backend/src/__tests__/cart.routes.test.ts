/**
 * Unit tests for cart API endpoints
 *
 * Validates: Requirements 4.1–4.5, 8.1
 */

import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import request from 'supertest';

// ─── Mocks (hoisted before imports) ──────────────────────────────────────────

// Mock the db module so the real Pool is never constructed
vi.mock('../db.js', () => ({
  pool: {
    query: vi.fn(),
  },
}));

// Mock authenticate middleware to always set req.user and call next()
vi.mock('../middleware/auth.js', () => ({
  authenticate: vi.fn((req: any, _res: any, next: any) => {
    req.user = { id: 'user-1', email: 'user@example.com', role: 'user' };
    next();
  }),
  requireAdmin: vi.fn((_req: any, _res: any, next: any) => next()),
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import app from '../app.js';
import { pool } from '../db.js';

const mockQuery = pool.query as ReturnType<typeof vi.fn>;

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.DATABASE_URL = 'mock';
});

afterEach(() => {
  vi.clearAllMocks();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Simulate getCart returning a list of items */
function mockGetCart(
  items: { productId: string; name: string; price: string; quantity: number }[],
) {
  mockQuery.mockResolvedValueOnce({ rows: items, rowCount: items.length });
}

// ─── GET /api/cart ────────────────────────────────────────────────────────────

describe('GET /api/cart', () => {
  it('1. returns cart with items and computed total', async () => {
    const items = [
      { productId: 'p1', name: 'Milk', price: '50.00', quantity: 2 },
      { productId: 'p2', name: 'Butter', price: '120.00', quantity: 1 },
    ];
    mockGetCart(items);

    const res = await request(app).get('/api/cart');

    expect(res.status).toBe(200);
    expect(res.body.userId).toBe('user-1');
    expect(res.body.items).toHaveLength(2);
    // total = 50*2 + 120*1 = 220.00
    expect(res.body.total).toBe('220.00');
  });

  it('2. returns empty cart when no items', async () => {
    mockGetCart([]);

    const res = await request(app).get('/api/cart');

    expect(res.status).toBe(200);
    expect(res.body.userId).toBe('user-1');
    expect(res.body.items).toHaveLength(0);
    expect(res.body.total).toBe('0.00');
  });
});

// ─── POST /api/cart/items ─────────────────────────────────────────────────────

describe('POST /api/cart/items', () => {
  it('3. adds item successfully → 201 with updated cart', async () => {
    // product check → found
    mockQuery.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'p1' }] });
    // insert
    mockQuery.mockResolvedValueOnce({ rowCount: 1, rows: [] });
    // getCart
    mockGetCart([{ productId: 'p1', name: 'Milk', price: '50.00', quantity: 3 }]);

    const res = await request(app)
      .post('/api/cart/items')
      .send({ productId: 'p1', quantity: 3 });

    expect(res.status).toBe(201);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].productId).toBe('p1');
    expect(res.body.total).toBe('150.00');
  });

  it('4. returns 400 when quantity is 0', async () => {
    const res = await request(app)
      .post('/api/cart/items')
      .send({ productId: 'p1', quantity: 0 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/quantity/i);
  });

  it('5. returns 400 when quantity is negative', async () => {
    const res = await request(app)
      .post('/api/cart/items')
      .send({ productId: 'p1', quantity: -2 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/quantity/i);
  });

  it('6. returns 400 when productId is missing', async () => {
    const res = await request(app)
      .post('/api/cart/items')
      .send({ quantity: 1 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/productId/i);
  });

  it("7. returns 404 when product doesn't exist", async () => {
    // product check → not found
    mockQuery.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const res = await request(app)
      .post('/api/cart/items')
      .send({ productId: 'nonexistent', quantity: 1 });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/product not found/i);
  });
});

// ─── PUT /api/cart/items/:productId ──────────────────────────────────────────

describe('PUT /api/cart/items/:productId', () => {
  it('8. updates quantity → 200 with updated cart', async () => {
    // update query → 1 row affected
    mockQuery.mockResolvedValueOnce({ rowCount: 1, rows: [] });
    // getCart
    mockGetCart([{ productId: 'p1', name: 'Milk', price: '50.00', quantity: 5 }]);

    const res = await request(app)
      .put('/api/cart/items/p1')
      .send({ quantity: 5 });

    expect(res.status).toBe(200);
    expect(res.body.items[0].quantity).toBe(5);
    expect(res.body.total).toBe('250.00');
  });

  it('9. returns 400 when quantity is 0', async () => {
    const res = await request(app)
      .put('/api/cart/items/p1')
      .send({ quantity: 0 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/quantity/i);
  });

  it('10. returns 404 when item not in cart', async () => {
    // update query → 0 rows affected
    mockQuery.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const res = await request(app)
      .put('/api/cart/items/p-missing')
      .send({ quantity: 2 });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/item not found/i);
  });
});

// ─── DELETE /api/cart/items/:productId ───────────────────────────────────────

describe('DELETE /api/cart/items/:productId', () => {
  it('11. removes item → 200 with updated cart', async () => {
    // delete query → 1 row affected
    mockQuery.mockResolvedValueOnce({ rowCount: 1, rows: [] });
    // getCart after removal
    mockGetCart([]);

    const res = await request(app).delete('/api/cart/items/p1');

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
    expect(res.body.total).toBe('0.00');
  });

  it('12. returns 404 when item not in cart', async () => {
    // delete query → 0 rows affected
    mockQuery.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const res = await request(app).delete('/api/cart/items/p-missing');

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/item not found/i);
  });
});

// ─── POST /api/cart/checkout ──────────────────────────────────────────────────

describe('POST /api/cart/checkout', () => {
  it("13. returns OrderSummary with cartId, items, total, currency='INR'", async () => {
    mockGetCart([
      { productId: 'p1', name: 'Milk', price: '50.00', quantity: 2 },
      { productId: 'p2', name: 'Paneer', price: '200.00', quantity: 1 },
    ]);

    const res = await request(app).post('/api/cart/checkout');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      cartId: 'user-1',
      currency: 'INR',
      total: '300.00',
    });
    expect(res.body.items).toHaveLength(2);
  });

  it('14. returns 400 when cart is empty', async () => {
    mockGetCart([]);

    const res = await request(app).post('/api/cart/checkout');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cart is empty/i);
  });
});
