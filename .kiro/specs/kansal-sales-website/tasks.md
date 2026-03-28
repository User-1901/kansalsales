# Implementation Plan: Kansal Sales Website

## Overview

Incremental build of the Kansal Sales React SPA + Node.js/Express API + PostgreSQL backend. Each task builds on the previous, ending with a fully wired application.

## Tasks

- [x] 1. Project scaffolding and shared configuration
  - Initialise a monorepo with `client/` (Vite + React + TypeScript) and `server/` (Node.js + Express + TypeScript) directories
  - Add shared ESLint, Prettier, and tsconfig base
  - Configure environment variable loading (`.env`) for both client and server
  - _Requirements: 7.1_

- [x] 2. Database setup and migrations
  - [x] 2.1 Create PostgreSQL schema migration files
    - Write SQL migration files for `users`, `categories`, `products`, `cart_items`, and `sessions` tables exactly as specified in the design
    - Include `DECIMAL(10,2)` price field and `TEXT[]` image_urls
    - _Requirements: 3.1, 7.4, 8.3_
  - [x] 2.2 Write property test for schema constraints
    - **Property: quantity CHECK (quantity > 0) rejects zero and negative values**
    - **Validates: Requirements 4.2**

- [x] 3. Express server bootstrap and middleware
  - [x] 3.1 Set up Express app with core middleware
    - Configure `helmet` (HTTPS headers), `cors`, `cookie-parser`, `express.json`
    - Wire `sanitize` middleware that strips/escapes HTML from all string body fields (XSS prevention)
    - _Requirements: 7.1, 7.3_
  - [x] 3.2 Implement `authenticate` and `requireAdmin` middleware
    - `authenticate`: verify JWT from httpOnly cookie, attach `req.user`; return 401 if missing/invalid
    - `requireAdmin`: check `req.user.role === 'admin'`; return 403 otherwise
    - _Requirements: 5.1, 5.2, 7.5_
  - [x] 3.3 Write unit tests for authenticate and requireAdmin middleware
    - Test valid token, expired token, missing token, non-admin role
    - _Requirements: 5.1, 5.2, 7.2, 7.5_

- [x] 4. Auth API (`/api/auth`)
  - [x] 4.1 Implement `POST /api/auth/register`
    - Validate unique email, display name, password ≥ 8 chars
    - Hash password with bcrypt; insert user row; send verification email via Nodemailer
    - Return 409 if email already registered
    - _Requirements: 2.1, 2.2, 2.3, 2.9_
  - [x] 4.2 Implement `POST /api/auth/login` with rate limiting
    - Apply `express-rate-limit`: max 10 requests per IP per 15 min; return 429 with error message when exceeded
    - Validate credentials; issue JWT (24 h expiry) as httpOnly cookie on success; return 401 on failure
    - _Requirements: 2.4, 2.5, 2.6, 7.2, 7.6, 7.7_
  - [x] 4.3 Implement `POST /api/auth/logout`
    - Clear the JWT cookie; optionally invalidate session row
    - _Requirements: 2.8_
  - [x] 4.4 Write unit tests for auth endpoints
    - Test registration success/duplicate email, login success/failure, logout, rate-limit trigger
    - _Requirements: 2.1–2.9, 7.6, 7.7_

- [x] 5. Checkpoint — auth layer
  - Ensure all auth tests pass, ask the user if questions arise.

- [x] 6. Products and Categories API
  - [x] 6.1 Implement Categories CRUD (`/api/categories`)
    - `GET /` — list all categories
    - `POST /`, `PUT /:id`, `DELETE /:id` — admin-only create/rename/delete (use `requireAdmin`)
    - Use parameterized queries / ORM; no raw string interpolation
    - _Requirements: 5.12, 7.4_
  - [x] 6.2 Implement Products CRUD (`/api/products`)
    - `GET /` — list all products; support `?search=` (name/description ILIKE) and `?category=` filter
    - `GET /:id` — single product
    - `POST /`, `PUT /:id`, `DELETE /:id` — admin-only; validate all required fields
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 5.3, 5.4, 5.5, 5.7, 5.9, 5.11_
  - [x] 6.3 Write property tests for product search
    - **Property 1: Search results always contain the search term in name or description (case-insensitive)**
    - **Validates: Requirements 3.4**
    - **Property 2: Category filter returns only products with matching categoryId**
    - **Validates: Requirements 3.3**

- [x] 7. Cart API (`/api/cart`)
  - [x] 7.1 Implement cart endpoints
    - `GET /` — return authenticated user's cart with computed total
    - `POST /items` — add item; enforce `quantity > 0`
    - `PUT /items/:productId` — update quantity; recalculate total
    - `DELETE /items/:productId` — remove item
    - All endpoints require `authenticate` middleware
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [x] 7.2 Implement `POST /api/cart/checkout`
    - Accept cart ID; return `OrderSummary` (items, total, currency); no payment processing
    - _Requirements: 8.1_
  - [x] 7.3 Write unit tests for cart endpoints
    - Test add/update/remove, total recalculation, cart restore on login, checkout summary shape
    - _Requirements: 4.1–4.5, 8.1_

- [x] 8. Contact API (`/api/contact`)
  - [x] 8.1 Implement `POST /api/contact`
    - Validate name, email, message are non-empty; return 400 with per-field errors otherwise
    - Send email to admin via Nodemailer on valid submission; return 200 success response
    - _Requirements: 6.3, 6.4_
  - [x] 8.2 Write unit tests for contact endpoint
    - Test valid submission, missing fields (each), email send failure handling
    - _Requirements: 6.3, 6.4_

- [x] 9. Checkpoint — API layer complete
  - Ensure all API tests pass, ask the user if questions arise.

- [x] 10. React client — routing and layout
  - [x] 10.1 Set up React Router with all routes
    - Define routes: `/`, `/products`, `/categories`, `/cart`, `/login`, `/register`, `/contact`, `/checkout`, `/admin/*`
    - Implement `NavBar` component with links to Home, Products, Categories, Cart, Login/Logout, and cart count badge
    - Implement `AdminLayout` with role guard: redirect to `/` with "Access Denied" toast if not admin
    - _Requirements: 1.1, 1.2, 4.6, 5.1, 5.2_
  - [x] 10.2 Write unit tests for NavBar and AdminLayout role guard
    - Test nav links render, cart badge count, admin redirect for non-admin users
    - _Requirements: 1.1, 4.6, 5.2_

- [x] 11. Auth pages — Login and Register
  - [x] 11.1 Implement `LoginPage` and `RegisterPage` components
    - `LoginPage`: email + password form; call `POST /api/auth/login`; show error on failure; redirect to `/` on success
    - `RegisterPage`: email, display name, password form (≥ 8 chars client-side validation); call `POST /api/auth/register`; show duplicate-email error
    - On successful login, update auth context; display user's display name in NavBar; show Logout option
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_
  - [x] 11.2 Write unit tests for Login and Register forms
    - Test form validation, error display, successful login state update
    - _Requirements: 2.1, 2.3, 2.6, 2.7_

- [x] 12. Public pages — Home, Products, Categories
  - [x] 12.1 Implement `HomePage`
    - Render banner, brief description, and a featured products section (first 6 products from API)
    - _Requirements: 1.3_
  - [x] 12.2 Implement `ProductsPage` and `ProductCard`
    - Fetch all products; render `ProductCard` grid with name, image, price, stock status badge, and "Add to Cart" button
    - Wire search bar to `?search=` query param; show "No products found" when result is empty
    - _Requirements: 1.4, 3.2, 3.4, 3.5_
  - [x] 12.3 Implement `CategoriesPage`
    - Fetch categories; render category list; on category click fetch `?category=` filtered products and display them
    - Show "No products found" when filter returns empty
    - _Requirements: 1.5, 3.3, 3.5_

- [x] 13. Cart page
  - [x] 13.1 Implement `CartPage` component
    - Fetch and display cart items with quantity controls and remove buttons
    - Recalculate and display total on quantity change; sync changes to API within 2 s (debounce)
    - For guests: store cart in sessionStorage; show prompt to log in to save permanently
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  - [x] 13.2 Write unit tests for CartPage
    - Test add/update/remove interactions, total display, guest prompt
    - _Requirements: 4.1–4.7_

- [x] 14. Contact page
  - [x] 14.1 Implement `ContactPage` component
    - Render contact form (name, email, message); client-side validation for empty fields with per-field error messages
    - On valid submit call `POST /api/contact`; show success confirmation
    - Display Telegram link `https://t.me/+CTrROqUmKkM4MTJl` with "Join our community" label; open in new tab (`target="_blank" rel="noopener noreferrer"`)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  - [x] 14.2 Write unit tests for ContactPage
    - Test empty-field validation errors, successful submission message, Telegram link attributes
    - _Requirements: 6.4, 6.5, 6.6_

- [x] 15. Checkout placeholder page
  - Implement `CheckoutPage` that renders a "Coming Soon" message at `/checkout`
  - _Requirements: 8.2_

- [x] 16. Admin panel
  - [x] 16.1 Implement `AdminProductsPage`
    - Render product table with Edit and Delete buttons for each row
    - Implement "Add Product" form (name, description, price, category, stock status, image URLs)
    - On Edit submit: show `ConfirmationDialog` summarising changes; call `PUT /api/products/:id` only on confirm
    - On Delete: show `ConfirmationDialog`; call `DELETE /api/products/:id` only on confirm
    - _Requirements: 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11_
  - [x] 16.2 Implement `AdminCategoriesPage`
    - Render category list with Rename and Delete buttons
    - Implement "Add Category" form; show `ConfirmationDialog` before rename and delete
    - _Requirements: 5.12_
  - [x] 16.3 Implement `ConfirmationDialog` reusable modal
    - Accept `message`, `onConfirm`, `onCancel` props; render confirm and cancel buttons
    - _Requirements: 5.6, 5.8, 5.10_
  - [x] 16.4 Write unit tests for Admin panel components
    - Test ConfirmationDialog confirm/cancel, product form validation, admin-only access guard
    - _Requirements: 5.1, 5.2, 5.6, 5.8, 5.10_

- [x] 17. Final checkpoint — wire everything together
  - Ensure NavBar cart count badge reflects live cart state across all pages
  - Verify admin role guard redirects correctly from all `/admin/*` routes
  - Confirm search, category filter, and "No products found" state work end-to-end
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- All database queries must use parameterized queries or an ORM — no string interpolation
- JWT is stored in httpOnly cookies only; never in localStorage or sessionStorage
- The Telegram link must always use `target="_blank" rel="noopener noreferrer"`
- Price values are serialized as strings from the API to preserve `DECIMAL(10,2)` precision
