import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import '../styles/ProductDetailPage.css';

// ── Data Types ──────────────────────────────────────────────────────────────
// Defines the structure of a Product object returned from the API
interface Product {
  id: string;
  name: string;
  price: string;
  description: string;
  image_urls: string[];
  category_id: string;
  stock_status: string;
  quantity_available: number;
  why_shop_message?: string;
  discount_percentage?: number;
}

// Defines the structure of a Review object (not currently used but prepared for future)
interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  review_text: string;
  user_name: string;
  created_at: string;
}

// ── Main Component ──────────────────────────────────────────────────────────
// This page displays detailed information about a single product
// Users can view images, description, price, and add items to cart
const ProductDetailPage: React.FC = () => {
  // Extract product ID from the URL (e.g., /products/[ID])
  const { id } = useParams<{ id: string }>();
  
  // Get current user info and cart manipulation functions from AuthContext
  const { user, cartCount, setCartCount } = useAuth();
  
  // STATE VARIABLES - Track component data
  const [product, setProduct] = useState<Product | null>(null);  // Stores the product data
  const [reviews, setReviews] = useState<Review[]>([]);          // Stores product reviews
  const [quantity, setQuantity] = useState(1);                   // How many items user wants to add
  const [loading, setLoading] = useState(true);                  // Shows loading spinner while fetching
  const [error, setError] = useState<string | null>(null);       // Stores error messages

  // ── FETCH PRODUCT DATA ON PAGE LOAD ────────────────────────────────────
  // This runs once when component mounts or when product ID changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Validate that product ID exists in URL
        if (!id) {
          setError('Product ID not found');
          setLoading(false);
          return;
        }

        // API Call: Get product details from server using the product ID
        const productResponse = await axios.get(`/api/products/${id}`);
        setProduct(productResponse.data);

        // API Call: Try to get reviews for this product (currently not implemented on server)
        try {
          const reviewsResponse = await axios.get(`/api/reviews?product_id=${id}`);
          setReviews(reviewsResponse.data || []);
        } catch {
          // If reviews endpoint fails, just continue without reviews
          setReviews([]);
        }
      } catch (err) {
        // If product not found or API error occurs, show error message
        setError('Product not found');
        console.error('Error fetching product:', err);
      } finally {
        // Stop loading spinner regardless of success/failure
        setLoading(false);
      }
    };

    fetchData();
  }, [id]); // Re-fetch if product ID changes

  // ── ADD TO CART HANDLER ─────────────────────────────────────────────────
  // Handles adding the selected quantity of product to the user's cart
  const handleAddToCart = async () => {
    if (!product) return;

    try {
      if (user) {
        // Logged-in user: Add item to database cart via API
        await axios.post('/api/cart/items', {
          productId: product.id,
          quantity: quantity,
        });
        // Update cart count in the app header
        setCartCount(cartCount + quantity);
      } else {
        // Guest user: Store cart in browser's sessionStorage (temporary localStorage)
        const raw = sessionStorage.getItem('guestCart');
        const cart: Array<{ productId: string; name: string; price: string; quantity: number }> =
          raw ? JSON.parse(raw) : [];
        
        // Check if product already exists in guest cart
        const existing = cart.find((i) => i.productId === product.id);
        if (existing) {
          // If product exists, increase quantity
          existing.quantity += quantity;
        } else {
          // If new product, add it to cart
          cart.push({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: quantity,
          });
        }
        // Save updated cart back to sessionStorage
        sessionStorage.setItem('guestCart', JSON.stringify(cart));
        // Update cart count in the app header
        setCartCount(cartCount + quantity);
      }

      // Show success message and reset quantity selector
      alert('Product added to cart!');
      setQuantity(1);
    } catch (err) {
      // Handle any errors during add to cart operation
      console.error('Error adding to cart:', err);
      alert('Failed to add to cart');
    }
  };

  // ── LOADING STATE ───────────────────────────────────────────────────────
  // Show loading message while fetching product data
  if (loading) {
    return <div className="product-detail-loading">Loading...</div>;
  }

  // ── ERROR STATE ─────────────────────────────────────────────────────────
  // Show error message if product not found or API failed
  if (error || !product) {
    return <div className="product-detail-error">{error || 'Product not found'}</div>;
  }

  // ── CALCULATE DISPLAY VALUES ────────────────────────────────────────────
  // Prepare data for display
  const imageUrl = product.image_urls?.[0] || '';        // Get first image URL
  const originalPrice = parseFloat(product.price);       // Parse original price
  const discount = product.discount_percentage || 0;     // Get discount percentage
  const discountedPrice = discount > 0 
    ? (originalPrice - (originalPrice * discount / 100)).toFixed(2)
    : originalPrice.toFixed(2);                          // Calculate discounted price
  const displayPrice = discountedPrice;                  // Use discounted price for display
  const averageRating =                                   // Calculate average rating from reviews
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

  // ── RENDER PAGE ─────────────────────────────────────────────────────────
  return (
    <div className="product-main-container">
      {/* Left: Product Image */}
      <div className="product-image-section">
        {imageUrl && <img src={imageUrl} alt={product.name} className="product-image" />}
        {!imageUrl && <div className="product-image-placeholder">No image available</div>}
      </div>

      {/* Right: Product Info */}
      <div className="product-info-section">
        <h1 className="product-name">{product.name}</h1>

        <div className="product-price-rating">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="product-price">₹{displayPrice}</span>
            {discount > 0 && (
              <>
                <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: 14 }}>₹{originalPrice.toFixed(2)}</span>
                <span style={{ background: '#dc2626', color: '#fff', padding: '4px 12px', borderRadius: 4, fontSize: 12, fontWeight: 700 }}>
                  -{discount}% OFF
                </span>
              </>
            )}
          </div>
          {reviews.length > 0 && (
            <span className="product-rating">
              ⭐ {averageRating} ({reviews.length} reviews)
            </span>
          )}
        </div>

        <p className="product-description">{product.description}</p>

        {/* Stock Status */}
        <div className="stock-status">
          {product.stock_status === 'in_stock' ? (
            <span className="in-stock">✓ In Stock</span>
          ) : (
            <span className="out-stock">Out of Stock</span>
          )}
        </div>

        {/* Quantity Selector and Add to Cart */}
        <div className="add-to-cart-section">
          <div className="quantity-selector">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="qty-btn"
            >
              −
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              max={product.quantity_available}
              className="qty-input"
            />
            <button
              onClick={() => setQuantity(Math.min(product.quantity_available, quantity + 1))}
              className="qty-btn"
            >
              +
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            className="add-to-cart-btn"
            disabled={product.stock_status !== 'in_stock'}
          >
            Add to Cart
          </button>
        </div>

        {/* Why Shop With Us Section */}
        {product.why_shop_message && (
          <div className="why-shop-message-section">
            <h3>Why Shop With Us?</h3>
            <p>{product.why_shop_message}</p>
          </div>
        )}
      </div>

      {/* Reviews Section - Below both columns */}
      {reviews.length > 0 && (
        <div className="reviews-section-full">
          <h2>Customer Reviews</h2>
          <div className="reviews-list">
            {reviews.map((review) => (
              <div key={review.id} className="review-card">
                <div className="review-header">
                  <span className="review-user">{review.user_name}</span>
                  <span className="review-rating">{'⭐'.repeat(review.rating)}</span>
                </div>
                <p className="review-text">{review.review_text}</p>
                <span className="review-date">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
