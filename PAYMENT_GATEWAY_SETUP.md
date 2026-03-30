# Payment Gateway Setup Guide

## Razorpay Integration

This e-commerce platform uses **Razorpay** for payment processing. Razorpay is India's leading payment gateway and supports:
- Credit/Debit cards
- Net banking
- Wallets (Google Pay, Apple Pay, etc.)
- UPI
- EMI options

## Setup Steps

### 1. Create Razorpay Account

1. Go to [https://razorpay.com](https://razorpay.com)
2. Sign up for a free merchant account
3. Complete KYC verification (required for live payments)
4. Dashboard will be available at [https://dashboard.razorpay.com](https://dashboard.razorpay.com)

### 2. Get API Keys

1. Log in to Razorpay Dashboard
2. Go to **Settings → API Keys**
3. You'll see:
   - **Key ID** (public key) - starts with `rzp_test_` or `rzp_live_`
   - **Key Secret** (private key) - keep this secret!
4. Copy both keys

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env` in the server directory:
   ```bash
   cp .env.example .env
   ```

2. Add your Razorpay keys:
   ```
   RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX
   RAZORPAY_KEY_SECRET=your_secret_key_here
   ```

3. Add other required variables:
   ```
   JWT_SECRET=your-super-secret-key
   CLIENT_ORIGIN=http://localhost:5173
   ```

### 4. Database Migrations

The payment system uses 3 new database tables:

- **orders** - Stores customer orders
- **order_items** - Individual products in each order
- **payments** - Payment transaction records

Migrations are automatically applied on server startup.

### 5. Install Dependencies

```bash
cd server
npm install razorpay
```

### 6. Start the Application

**Terminal 1 - Backend:**
```bash
npm run dev:server
```

**Terminal 2 - Frontend:**
```bash
npm run dev:client
```

## How It Works

### Payment Flow

```
User → Adds items to cart → Clicks "Checkout" → Enters shipping info
  ↓
Backend creates order (database + Razorpay)
  ↓
Frontend opens Razorpay payment modal
  ↓
User enters payment details
  ↓
Razorpay processes payment
  ↓
Frontend receives payment confirmation
  ↓
Frontend calls API to verify signature
  ↓
Backend confirms payment, updates order status
  ↓
User sees order confirmation page ✅
```

### Testing Payments

Razorpay provides test credentials:

**Test Card (Success):**
- Card Number: `4111111111111111`
- Expiry: Any future date
- CVV: Any 3-4 digits
- OTP: `000000`

**Test Card (Failure):**
- Card Number: `4000000000000002`
- Expiry: Any future date
- CVV: Any 3-4 digits
- OTP: `000000`

## API Endpoints

### POST `/api/checkout`
Creates an order and returns Razorpay payment details

**Request:**
```json
{
  "shippingInfo": {
    "shipping_name": "John Doe",
    "shipping_email": "john@example.com",
    "shipping_phone": "9876543210",
    "shipping_address": "123 Main St, Apt 4B",
    "shipping_city": "Mumbai",
    "shipping_postal_code": "400001"
  },
  "cartItems": [
    { "productId": "uuid", "quantity": 2 }
  ]
}
```

**Response:**
```json
{
  "order": { ... },
  "razorpay_key": "rzp_test_...",
  "razorpay_order_id": "order_...",
  "amount": 299.99
}
```

### POST `/api/checkout/verify`
Verifies payment signature and confirms order

**Request:**
```json
{
  "razorpay_order_id": "order_...",
  "razorpay_payment_id": "pay_...",
  "razorpay_signature": "signature_..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified and order confirmed",
  "order": { ... }
}
```

### GET `/api/orders`
Get all orders for logged-in user

### GET `/api/orders/:id`
Get specific order details with items

## Live Payments vs Test Mode

### Test Mode (Default)
- Use test API keys from Razorpay dashboard
- No real money is charged
- Use test card numbers provided by Razorpay
- Perfect for development and testing

### Live Mode
1. Complete KYC verification on Razorpay
2. Get live API keys (start with `rzp_live_`)
3. Update `.env` with live keys
4. Switch to production in your code
5. Real payments will be processed

⚠️ **Important:** Never commit `.env` to version control!

## Troubleshooting

### Payment modal not opening
- Ensure Razorpay script is loaded
- Check browser console for JavaScript errors
- Verify API keys are correct

### "Invalid signature" error
- Check that backend and frontend signatures match
- Verify `RAZORPAY_KEY_SECRET` is correct
- Check timestamp validity

### Order not created
- Check database connection
- Verify cart items exist
- Check server logs for SQL errors

## Security Considerations

1. **Never expose `RAZORPAY_KEY_SECRET`** - keep it server-side only
2. **Always verify signatures** on backend
3. **Use HTTPS in production** for PCI compliance
4. **Validate all user input** before creating orders
5. **Log payment failures** for debugging

## Support

For Razorpay support:
- Dashboard: [https://dashboard.razorpay.com](https://dashboard.razorpay.com)
- Documentation: [https://razorpay.com/docs](https://razorpay.com/docs)
- Support Email: support@razorpay.com

---

**Your payment gateway is now ready!** 🎉
