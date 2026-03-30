import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { createPaymentOrder, verifyPaymentSignature, completePayment, getOrderDetails } from '../services/payment.js';
import { pool } from '../db.js';

// ── ROUTER SETUP ────────────────────────────────────────────────────────────
const router = Router();

// ── POST /api/checkout - Create order for payment ───────────────────────────
// Takes shipping info from request, creates order in DB and Razorpay
// Returns Razorpay key and order details
router.post('/api/checkout', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { shippingInfo, cartItems } = req.body;

    // Validate shipping info
    if (!shippingInfo || !shippingInfo.shipping_name || !shippingInfo.shipping_email ||
        !shippingInfo.shipping_phone || !shippingInfo.shipping_address || 
        !shippingInfo.shipping_city || !shippingInfo.shipping_postal_code) {
      return res.status(400).json({ error: 'Incomplete shipping information' });
    }

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Create payment order
    const orderResponse = await createPaymentOrder(userId, cartItems, shippingInfo);
    
    res.json(orderResponse);
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// ── POST /api/checkout/verify - Verify payment and complete order ──────────
// Called after Razorpay payment is completed on frontend
// Verifies signature, marks order as paid, clears cart
router.post('/api/checkout/verify', authenticate, async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment details' });
    }

    // Verify Razorpay signature
    const isValid = await verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    // Complete payment and update order
    const order = await completePayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    res.json({
      success: true,
      message: 'Payment verified and order confirmed',
      order,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// ── GET /api/orders/:id - Get order details ────────────────────────────────
// Returns order info and line items
router.get('/api/orders/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id;
    const userId = (req as any).user.id;

    // Verify order belongs to user
    const orderCheckResult = await pool.query(`
      SELECT user_id FROM orders WHERE id = $1
    `, [orderId]);

    if (orderCheckResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (orderCheckResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const orderData = await getOrderDetails(orderId);
    res.json(orderData);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// ── GET /api/orders - Get user's orders ─────────────────────────────────────
// Returns all orders for authenticated user
router.get('/api/orders', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const result = await pool.query(`
      SELECT * FROM orders 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [userId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

export default router;
