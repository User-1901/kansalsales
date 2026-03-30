import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// ── IMPORT PUBLIC PAGES AND COMPONENTS ──────────────────────────────────────
// Pages that all users can see (customers)
import NavBar from './components/NavBar';              // Top navigation bar
import HomePage from './pages/HomePage';              // Landing page with featured products
import ProductsPage from './pages/ProductsPage';      // Browse all products
import ProductDetailPage from './pages/ProductDetailPage';  // Single product details
import CategoriesPage from './pages/CategoriesPage';  // Browse by category (if implemented)
import CartPage from './pages/CartPage';              // Shopping cart
import LoginPage from './pages/LoginPage';            // User login
import RegisterPage from './pages/RegisterPage';      // User registration
import ContactPage from './pages/ContactPage';        // Contact us page
import CheckoutPage from './pages/CheckoutPage';      // Payment/checkout page
import OrderPage from './pages/OrderPage';            // Order confirmation page
import ForgotPasswordPage from './pages/ForgotPasswordPage';  // Forgot password
import ResetPasswordPage from './pages/ResetPasswordPage';    // Reset password with token

// ── IMPORT ADMIN PAGES ──────────────────────────────────────────────────────
// Admin panel - separate from customer site
import AdminApp from './admin/AdminApp';

// ── MAIN APP COMPONENT ──────────────────────────────────────────────────────
// Sets up routing for the entire application
function App() {
  return (
    <BrowserRouter>
      {/* AuthProvider wraps entire app to make authentication available globally */}
      <AuthProvider>
        <Routes>
          {/* ── ADMIN ROUTES ── No NavBar, separate layout */}
          <Route path="/admin/*" element={<AdminApp />} />

          {/* ── PUBLIC/CUSTOMER ROUTES ── All have NavBar at top */}
          <Route
            path="/*"
            element={
              <>
                {/* NavBar appears on all customer pages */}
                <NavBar />
                
                {/* Customer page routes */}
                <Routes>
                  <Route path="/" element={<HomePage />} />                      {/* / → Home page */}
                  <Route path="products" element={<ProductsPage />} />            {/* /products → Browse all products */}
                  <Route path="products/:id" element={<ProductDetailPage />} />   {/* /products/[ID] → Product details */}
                  <Route path="categories" element={<CategoriesPage />} />        {/* /categories → Browse by category */}
                  <Route path="cart" element={<CartPage />} />                    {/* /cart → Shopping cart */}
                  <Route path="login" element={<LoginPage />} />                  {/* /login → User login */}
                  <Route path="register" element={<RegisterPage />} />            {/* /register → Create account */}
                  <Route path="contact" element={<ContactPage />} />              {/* /contact → Contact form */}
                  <Route path="checkout" element={<CheckoutPage />} />            {/* /checkout → Payment page (login required) */}
                  <Route path="orders/:orderId" element={<OrderPage />} />         {/* /orders/[ID] → Order confirmation */}
                  <Route path="forgot-password" element={<ForgotPasswordPage />} /> {/* /forgot-password → Reset password request */}
                  <Route path="reset-password" element={<ResetPasswordPage />} />  {/* /reset-password → Actually reset password */}
                </Routes>
              </>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
