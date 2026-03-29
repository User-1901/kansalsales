import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import '../styles/ProductDetailPage.css';

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
}

interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  review_text: string;
  user_name: string;
  created_at: string;
}

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!id) {
          setError('Product ID not found');
          setLoading(false);
          return;
        }

        // Fetch product details
        const productResponse = await axios.get(`/api/products/${id}`);
        setProduct(productResponse.data);

        // Fetch reviews for this product
        try {
          const reviewsResponse = await axios.get(`/api/reviews?product_id=${id}`);
          setReviews(reviewsResponse.data || []);
        } catch {
          // Reviews endpoint might not exist, that's ok
          setReviews([]);
        }
      } catch (err) {
        setError('Product not found');
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleAddToCart = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      await axios.post('/api/cart', {
        product_id: id,
        quantity: quantity,
      });

      alert('Product added to cart!');
      setQuantity(1);
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert('Failed to add to cart');
    }
  };

  if (loading) {
    return <div className="product-detail-loading">Loading...</div>;
  }

  if (error || !product) {
    return <div className="product-detail-error">{error || 'Product not found'}</div>;
  }

  const imageUrl = product.image_urls?.[0] || '';
  const displayPrice = parseFloat(product.price).toFixed(2);
  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

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
          <span className="product-price">₹{displayPrice}</span>
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
