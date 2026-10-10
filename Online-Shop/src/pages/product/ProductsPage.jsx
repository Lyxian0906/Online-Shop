import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import axios from 'axios';
import { Header } from '../../components/Header';
import { Loading } from '../../components/loading/Loading';
import { formatMoney } from '../../utils/money';
import './ProductPage.css';

export function ProductPage({ cart, loadCart }) {
  const { productId } = useParams(); // the :productId from the address /product/:productId
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(`/api/products/${productId}`);
        setProduct(response.data);
      } catch (err) {
        setError(
          err.response?.status === 404
            ? 'We could not find this product.'
            : 'Could not load the product. Please try again.'
        );
      }
      setLoading(false);
    };

    loadProduct();
  }, [productId]);

  const addToCart = async () => {
    setAdding(true);
    try {
      await axios.post('/api/cart-items', { productId: product.id, quantity });
    } catch (err) {
      setAdding(false);
      // 401 = not logged in (or the session expired)
      if (err.response?.status === 401) {
        navigate('/login');
      }
      return;
    }

    await loadCart();
    setAdding(false);

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const soldOut = product?.inStock === false;

  // This page lives at /product/:id (two segments), so an image path like
  // "images/products/x.jpg" would be looked up under /product/... and fail.
  // Starting the path with "/" always points to the site's images folder.
  const imageSrc = product
    ? product.image.startsWith('/') || product.image.startsWith('http')
      ? product.image
      : `/${product.image}`
    : '';

  return (
    <>
      <Header cart={cart} />

      {loading && <Loading message="Loading product..." />}

      {error && (
        <div className="product-page">
          <p role="alert">{error}</p>
          <Link to="/">Back to the store</Link>
        </div>
      )}

      {!loading && !error && product && (
        <div className="product-page">
          <Link className="product-page-back" to="/">&larr; Back to the store</Link>

          <div className="product-page-layout">
            <div className="product-page-image-box">
              <img className="product-page-image" src={imageSrc} alt={product.name} />
            </div>

            <div className="product-page-info">
              <h1 className="product-page-name">{product.name}</h1>

              <div className="product-page-rating">
                <img
                  src={`/images/ratings/rating-${product.rating.stars * 10}.png`}
                  alt={`${product.rating.stars} out of 5 stars`}
                />
                <span>{product.rating.count} ratings</span>
              </div>

              <div className="product-page-price">{formatMoney(product.priceCents)}</div>

              {soldOut && <p className="product-page-soldout">Sold out</p>}

              <h2 className="product-page-subtitle">Description</h2>
              <p className="product-page-description">
                {product.description || 'No description yet.'}
              </p>

              <div className="product-page-buy">
                <label htmlFor="quantity">Quantity</label>
                <select
                  id="quantity"
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value))}
                  disabled={soldOut}
                >
                  {Array.from({ length: 10 }, (_, index) => index + 1).map((number) => (
                    <option key={number} value={number}>{number}</option>
                  ))}
                </select>

                <button
                  type="button"
                  className="add-to-cart-button button-primary"
                  onClick={addToCart}
                  disabled={soldOut || adding}
                >
                  {soldOut ? 'Sold out' : adding ? 'Adding...' : 'Add to Cart'}
                </button>

                <span className="product-page-added" style={{ opacity: added ? 1 : 0 }}>
                  Added
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}