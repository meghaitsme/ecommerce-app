
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

import {
  collection,
  doc,
  getDocs,
  onSnapshot
} from 'firebase/firestore';

import { db } from '../../data/firebase';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { formatPrice } from '../../utils/format';
import './PDP.css';

interface Product {
  id: string;
  _id: string;
  name: string;
  description?: string;
  category?: string | {
    id?: string;
    name?: string;
    path?: string[];
  };
  price: number;
  originalPrice?: number;
  compareAtPrice?: number;
  stock?: number;
  image?: string | string[];
  imageUrl?: string;
  images?: Array<string | { url?: string; src?: string }>;
  [key: string]: any;
}

function getNumber(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function getImages(product: Product): string[] {
  const images: string[] = [];

  if (Array.isArray(product.images)) {
    product.images.forEach((item) => {
      const url = typeof item === 'string'
        ? item
        : item?.url || item?.src;

      if (url) images.push(url);
    });
  }

  if (Array.isArray(product.image)) {
    images.push(...product.image);
  } else if (typeof product.image === 'string') {
    images.push(...product.image.split(','));
  }

  if (product.imageUrl) {
    images.push(product.imageUrl);
  }

  return [...new Set(
    images.map((image) => image.trim()).filter(Boolean)
  )];
}

function getCategory(category: Product['category']): string {
  if (!category) return 'Uncategorized';

  if (typeof category === 'string') return category;

  return (
    category.name ||
    category.path?.join(' / ') ||
    category.id ||
    'Uncategorized'
  );
}

function getCategoryKey(category: Product['category']): string {
  return getCategory(category).trim().toLowerCase();
}

export default function PDP() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  // FETCH PRODUCT FROM FIRESTORE
  useEffect(() => {
    if (!id) {
      setProduct(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setProduct(null);
    setRelatedProducts([]);
    setQuantity(1);
    setSelectedImage('');

    const productRef = doc(db, 'products', id);

    const unsubscribe = onSnapshot(
      productRef,
      async (snapshot) => {
        if (!snapshot.exists()) {
          setProduct(null);
          setRelatedProducts([]);
          setLoading(false);
          return;
        }

        const productData = {
          ...snapshot.data(),
          id: snapshot.id,
          _id: snapshot.id
        } as Product;

        setProduct(productData);

        const images = getImages(productData);
        setSelectedImage(images[0] || '');

        setLoading(false);

        // FETCH RELATED PRODUCTS
        try {
          const productsSnapshot = await getDocs(
            collection(db, 'products')
          );

          const currentCategory = getCategoryKey(
            productData.category
          );

          const related = productsSnapshot.docs
            .map((productDoc) => ({
              ...productDoc.data(),
              id: productDoc.id,
              _id: productDoc.id
            } as Product))
            .filter((item) => (
              item.id !== productData.id &&
              currentCategory !== '' &&
              getCategoryKey(item.category) === currentCategory
            ))
            .slice(0, 4);

          setRelatedProducts(related);
        } catch (error) {
          console.error('Related Products Error:', error);
          setRelatedProducts([]);
        }
      },
      (error) => {
        console.error('Firestore Product Error:', error);

        setProduct(null);
        setLoading(false);

        showToast('Unable to load product details.', 'error');
      }
    );

    return () => unsubscribe();
  }, [id, showToast]);

  const stock = getNumber(product?.stock);
  const price = getNumber(product?.price);

  const originalPrice = getNumber(
    product?.originalPrice || product?.compareAtPrice
  );

  const hasDiscount = originalPrice > price && price > 0;

  const discountPercentage = hasDiscount
    ? Math.round(
        ((originalPrice - price) / originalPrice) * 100
      )
    : 0;

  const productImages = product ? getImages(product) : [];

  // QUANTITY
  const handleQuantityChange = (value: number) => {
    if (value < 1) {
      setQuantity(1);
      return;
    }

    if (value > stock) {
      showToast(`Only ${stock} items available.`, 'error');
      setQuantity(stock);
      return;
    }

    setQuantity(value);
  };

  // ADD TO CART
  const handleAddToCart = async () => {
    if (!product) return;

    if (stock <= 0 || quantity > stock) {
      showToast('Product is out of stock.', 'error');
      return;
    }

    try {
      setAddingToCart(true);

      await addToCart(
        {
          ...product,
          id: product.id,
          _id: product.id
        },
        quantity
      );

      showToast('Product added to cart successfully!', 'success');
    } catch (error) {
      console.error('Add to Cart Error:', error);
      showToast('Unable to add product to cart.', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  // BUY NOW
  const handleBuyNow = async () => {
    if (!product) return;

    if (stock <= 0 || quantity > stock) {
      showToast('Product is out of stock.', 'error');
      return;
    }

    try {
      await addToCart(
        {
          ...product,
          id: product.id,
          _id: product.id
        },
        quantity
      );

      navigate('/cart');
    } catch (error) {
      console.error('Buy Now Error:', error);
      showToast('Unable to proceed. Please try again.', 'error');
    }
  };

  // LOADING
  if (loading) {
    return (
      <div className="pdp-loading">
        <div className="pdp-spinner" />
        <p>Loading product details...</p>
      </div>
    );
  }

  // PRODUCT NOT FOUND
  if (!product) {
    return (
      <div className="pdp-not-found">
        <h2>Product Not Found</h2>

        <p>
          This product may have been removed or is unavailable.
        </p>

        <Link to="/products" className="pdp-back-button">
          Explore Products
        </Link>
      </div>
    );
  }

  return (
    <main className="shop-pdp">

      {/* BREADCRUMB */}
      <div className="pdp-breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/products">Shop</Link>
        <span>/</span>
        <span>{product.name}</span>
      </div>

      {/* MAIN PRODUCT SECTION */}
      <section className="pdp-main">

        {/* PRODUCT GALLERY */}
        <div className="pdp-gallery">

          <div className="pdp-main-image">

            {hasDiscount && (
              <div className="pdp-sale-badge">
                {discountPercentage}% OFF
              </div>
            )}

            {selectedImage ? (
              <img
                src={selectedImage}
                alt={product.name}
              />
            ) : (
              <div className="pdp-no-image">
                No image available
              </div>
            )}

          </div>

          {/* IMAGE THUMBNAILS */}
          {productImages.length > 1 && (
            <div className="pdp-thumbnails">
              {productImages.map((image, index) => (
                <button
                  type="button"
                  key={`${image}-${index}`}
                  className={`pdp-thumbnail ${
                    selectedImage === image ? 'active' : ''
                  }`}
                  onClick={() => setSelectedImage(image)}
                  aria-label={`View product image ${index + 1}`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                  />
                </button>
              ))}
            </div>
          )}

          <div className="pdp-image-note">
            <span>✦</span>
            Carefully selected for quality and style.
          </div>

        </div>

        {/* PRODUCT INFORMATION */}
        <div className="pdp-details">

          <p className="pdp-category">
            {getCategory(product.category)}
          </p>

          <h1>{product.name}</h1>

          <p className="pdp-short-description">
            {product.description ||
              'Discover quality and style with this carefully selected product.'}
          </p>

          {/* PRICE */}
          <div className="pdp-price-row">

            <span className="pdp-price">
              {formatPrice(price)}
            </span>

            {hasDiscount && (
              <>
                <span className="pdp-old-price">
                  {formatPrice(originalPrice)}
                </span>

                <span className="pdp-discount">
                  {discountPercentage}% OFF
                </span>
              </>
            )}

          </div>

          <div className="pdp-divider" />

          {/* STOCK */}
          <div className="pdp-stock">

            <span className={`stock-dot ${
              stock <= 0 ? 'out' : ''
            }`} />

            {stock > 0
              ? `In stock — ${stock} available`
              : 'Currently out of stock'}

          </div>

          {/* QUANTITY */}
          <div className="pdp-quantity-section">

            <label>Quantity</label>

            <div className="pdp-quantity">

              <button
                type="button"
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                −
              </button>

              <span>{quantity}</span>

              <button
                type="button"
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= stock}
                aria-label="Increase quantity"
              >
                +
              </button>

            </div>

          </div>

          {/* TOTAL */}
          <div className="pdp-total">

            <span>Total price</span>

            <strong>
              {formatPrice(price * quantity)}
            </strong>

          </div>

          {/* ACTION BUTTONS */}
          <div className="pdp-actions">

            <button
              type="button"
              className="pdp-add-button"
              onClick={handleAddToCart}
              disabled={stock <= 0 || addingToCart}
            >
              {addingToCart ? 'Adding...' : 'Add to Cart'}

              <span>→</span>
            </button>

            <button
              type="button"
              className="pdp-buy-button"
              onClick={handleBuyNow}
              disabled={stock <= 0}
            >
              Buy Now
            </button>

          </div>

          {/* SHOPPING BENEFITS */}
          <div className="pdp-benefits">

            <div>
              <span>✓</span>
              <p>Secure checkout</p>
            </div>

            <div>
              <span>✓</span>
              <p>Quality products</p>
            </div>

            <div>
              <span>✓</span>
              <p>Easy order tracking</p>
            </div>

          </div>

        </div>

      </section>

      {/* RELATED PRODUCTS */}
      {relatedProducts.length > 0 && (
        <section className="pdp-related">

          <div className="pdp-related-heading">

            <div>
              <span>YOU MAY ALSO LIKE</span>
              <h2>Related Products</h2>
            </div>

            <Link to="/products">
              View All →
            </Link>

          </div>

          <div className="pdp-related-grid">

            {relatedProducts.map((item) => {
              const image = getImages(item)[0];

              return (
                <Link
                  key={item.id}
                  to={`/product/${item.id}`}
                  className="pdp-related-card"
                >

                  <div className="pdp-related-image">

                    {image ? (
                      <img
                        src={image}
                        alt={item.name}
                      />
                    ) : (
                      <span className="pdp-no-image">
                        No image
                      </span>
                    )}

                  </div>

                  <div className="pdp-related-info">

                    <h3>{item.name}</h3>

                    <p>
                      {formatPrice(getNumber(item.price))}
                    </p>

                  </div>

                </Link>
              );
            })}

          </div>

        </section>
      )}

    </main>
  );
}
