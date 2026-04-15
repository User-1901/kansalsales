import Razorpay from 'razorpay';
import crypto from 'crypto';
import { pool } from '../db.js';
import { Order, Payment, CreateOrderRequest, CreateOrderResponse, VerifyPaymentRequest } from '../types/index.js';
import { validateDeliveryPincode } from './delivery.js';

// ── RAZORPAY INITIALIZATION ─────────────────────────────────────────────────
// Initialize with lazy loading - only load when both keys are available
let razorpay: Razorpay | null = null;

function getRazorpayInstance(): Razorpay {
  if (!razorpay) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!keyId || !keySecret) {
      throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment variables');
    }
    
    razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return razorpay;
}

// ── CREATE ORDER FOR PAYMENT ────────────────────────────────────────────────
// Called when user clicks "Proceed to Checkout"
// 1. Creates order in database
// 2. Creates order in Razorpay
// 3. Returns order details and Razorpay key
export async function createPaymentOrder(
  userId: string,
  cartItems: Array<{ productId: string; quantity: number }>,
  shippingInfo: CreateOrderRequest
): Promise<CreateOrderResponse> {
  // ── VALIDATE DELIVERY PINCODE ──────────────────────────────────────────
  const pincodeValidation = validateDeliveryPincode(shippingInfo.shipping_postal_code);
  if (!pincodeValidation.isValid) {
    throw new Error(pincodeValidation.message);
  }

  // ── CALCULATE TOTAL FROM CART ITEMS ──────────────────────────────────
  const itemsQuery = await pool.query(`
    SELECT id, name, price, discount_percentage FROM products WHERE id = ANY($1::text[])
  `, [cartItems.map(item => item.productId)]);

  let totalAmount = 0;
  const orderItems: Array<{ productId: string; product_name: string; product_price: number; quantity: number }> = [];

  for (const item of cartItems) {
    const product = itemsQuery.rows.find((p) => (p as any).id === item.productId) as any;
    if (!product) continue;
    
    const price = parseFloat(product.price);
    const discount = parseFloat(product.discount_percentage || 0);
    
    // Calculate discounted price
    const discountedPrice = discount > 0 
      ? price - (price * discount / 100)
      : price;
    
    totalAmount += discountedPrice * item.quantity;
    orderItems.push({
      productId: item.productId,
      product_name: product.name,
      product_price: discountedPrice,  // Store discounted price in order items
      quantity: item.quantity,
    });
  }

  // Convert to paise (Razorpay requires amount in smallest unit)
  const amountInPaise = Math.round(totalAmount * 100);

  // ── CREATE ORDER IN DATABASE ────────────────────────────────────────
  const orderResult = await pool.query(`
    INSERT INTO orders (user_id, total_amount, status, shipping_name, shipping_email, shipping_phone, shipping_address, shipping_city, shipping_postal_code)
    VALUES ($1, $2, 'pending', $3, $4, $5, $6, $7, $8)
    RETURNING *
  `, [
    userId,
    totalAmount.toFixed(2),
    shippingInfo.shipping_name,
    shippingInfo.shipping_email,
    shippingInfo.shipping_phone,
    shippingInfo.shipping_address,
    shippingInfo.shipping_city,
    shippingInfo.shipping_postal_code,
  ]);

  const order = orderResult.rows[0] as unknown as Order;

  // ── CREATE RAZORPAY ORDER ───────────────────────────────────────────
  const razorpayOrder = await getRazorpayInstance().orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: String(order.id),
    notes: {
      user_id: userId,
      order_id: String(order.id),
    },
  });

  // ── SAVE RAZORPAY ORDER ID TO DATABASE ──────────────────────────────
  await pool.query(`
    INSERT INTO payments (order_id, razorpay_order_id, amount, currency, status)
    VALUES ($1, $2, $3, 'INR', 'created')
  `, [order.id, String((razorpayOrder as any).id), totalAmount.toFixed(2)]);

  // ── CREATE ORDER ITEMS ──────────────────────────────────────────────
  for (const item of orderItems) {
    await pool.query(`
      INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity)
      VALUES ($1, $2, $3, $4, $5)
    `, [order.id, item.productId, item.product_name, item.product_price.toFixed(2), item.quantity]);
  }

  return {
    order,
    razorpay_key: process.env.RAZORPAY_KEY_ID || '',
    razorpay_order_id: String((razorpayOrder as any).id),
    amount: totalAmount,
  };
}

// ── VERIFY PAYMENT SIGNATURE ────────────────────────────────────────────────
// Called when payment completes on frontend
// Verifies Razorpay signature to ensure payment is legitimate
export async function verifyPaymentSignature(request: VerifyPaymentRequest): Promise<boolean> {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = request;

  // Create signature: HmacSHA256(${order_id}|${payment_id}, secret)
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  return expectedSignature === razorpay_signature;
}

// ── COMPLETE PAYMENT ────────────────────────────────────────────────────────
// Called after payment is verified
// Updates order and payment status in database
export async function completePayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): Promise<Order> {
  // ── UPDATE PAYMENT IN DATABASE ──────────────────────────────────────
  await pool.query(`
    UPDATE payments
    SET status = 'captured', razorpay_payment_id = $1, razorpay_signature = $2, updated_at = NOW()
    WHERE razorpay_order_id = $3
  `, [razorpayPaymentId, razorpaySignature, razorpayOrderId]);

  // ── UPDATE ORDER STATUS ─────────────────────────────────────────────
  const result = await pool.query(`
    UPDATE orders
    SET status = 'paid', updated_at = NOW()
    WHERE id = (SELECT order_id FROM payments WHERE razorpay_order_id = $1)
    RETURNING *
  `, [razorpayOrderId]);

  // ── CLEAR USER'S CART AFTER PAYMENT ─────────────────────────────────
  const orderResult = await pool.query(`
    SELECT user_id FROM orders WHERE id = (SELECT order_id FROM payments WHERE razorpay_order_id = $1)
  `, [razorpayOrderId]);

  if (orderResult.rows.length > 0) {
    const userId = (orderResult.rows[0] as any).user_id;
    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
  }

  return result.rows[0] as unknown as Order;
}

// ── GET ORDER DETAILS ───────────────────────────────────────────────────────
export async function getOrderDetails(orderId: string): Promise<{ order: Order; items: any[] }> {
  const orderResult = await pool.query(`
    SELECT * FROM orders WHERE id = $1
  `, [orderId]);

  const itemsResult = await pool.query(`
    SELECT * FROM order_items WHERE order_id = $1
  `, [orderId]);

  return {
    order: orderResult.rows[0] as unknown as Order,
    items: itemsResult.rows,
  };
}
