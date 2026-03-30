// ── ORDER TYPES ────────────────────────────────────────────────────────────
export interface Order {
  id: string;
  user_id: string;
  total_amount: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  shipping_name: string;
  shipping_email: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_price: string;
  quantity: number;
  line_total: string;
  created_at: Date;
}

// ── PAYMENT TYPES ──────────────────────────────────────────────────────────
export interface Payment {
  id: string;
  order_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  status: 'created' | 'authorized' | 'captured' | 'failed' | 'refunded';
  amount: string;
  currency: string;
  error_code: string | null;
  error_description: string | null;
  created_at: Date;
  updated_at: Date;
}

// ── API REQUEST/RESPONSE TYPES ──────────────────────────────────────────────
export interface CreateOrderRequest {
  shipping_name: string;
  shipping_email: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
}

export interface CreateOrderResponse {
  order: Order;
  razorpay_key: string;
  razorpay_order_id: string;
  amount: number;
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  order?: Order;
}
