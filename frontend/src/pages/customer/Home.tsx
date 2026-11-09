
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';

import {
  collection,
  getDocs,
  addDoc
} from 'firebase/firestore';

import { db } from '../../data/firebase';
import { formatPrice } from '../../utils/format';
import { useToast } from '../../context/ToastContext';

import './Home.css';

interface ProductImage {
  url?: string;
  imageUrl?: string;
}

interface Product {
  id: string;
  _id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  image: string;
  imageUrl: string;
  images: Array<string | ProductImage>;
  isFeatured: boolean;
  salesCount: number;
  stock: number;
}

const FALLBACK_IMAGE =
  'https://placehold.co/500x500?text=ShopNova';

const categories = [
  {
    name: 'Electronics',
    symbol: '⌘',
    description: 'Smart technology'
  },
  {
    name: 'Clothing',
    symbol: '✧',
    description: 'Everyday fashion'
  },
  {
    name: 'Books',
    symbol: '▤',
    description: 'Stories & knowledge'
  },
  {
    name: 'Home',
    symbol: '⌂',
    description: 'Beautiful living'
  }
];

function getProductImage(product: Product): string {
  if (Array.isArray(product.images) && product.images.length > 0) {
    const first = product.images[0];

    const image =
      typeof first === 'string'
        ? first
        : first.url || first.imageUrl || '';

    if (typeof image === 'string' && image.trim()) {
      return image.trim();
    }
  }

  if (typeof product.image === 'string' && product.image.trim()) {
    return product.image.split(',')[0].trim();
  }

  if (typeof product.imageUrl === 'string' && product.imageUrl.trim()) {
    return product.imageUrl.trim();
  }

  return FALLBACK_IMAGE;
}

function getCategoryName(category: unknown): string {
  if (typeof category === 'string') {
    return category.trim() || 'ShopNova Collection';
  }

  if (
    category &&
    typeof category === 'object' &&
    'name' in category
  ) {
    const name = category.name;

    return typeof name === 'string' && name.trim()
      ? name.trim()
      : 'ShopNova Collection';
  }

  return 'ShopNova Collection';
}

function normalizeProduct(
  id: string,
  data: Record<string, unknown>
): Product {
  return {
    id,
    _id: id,
    name: String(data.name || 'Unnamed Product'),
    price: Number(data.price) || 0,
    category: getCategoryName(data.category),
    description: String(data.description || ''),
    image: typeof data.image === 'string' ? data.image : '',
    imageUrl:
      typeof data.imageUrl === 'string'
        ? data.imageUrl
        : '',
    images: Array.isArray(data.images)
      ? (data.images as Array<string | ProductImage>)
      : [],
    isFeatured:
      data.isFeatured === true || data.featured === true,
    salesCount: Math.max(0, Number(data.salesCount) || 0),
    stock: Math.max(
      0,
      Number(data.stock ?? data.stockQuantity ?? 0) || 0
    )
  };
}

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const { showToast } = useToast();

  // =====================================
  // LOAD PRODUCTS FROM FIRESTORE
  // =====================================

  useEffect(() => {
    let active = true;

    const fetchHomeData = async () => {
      setLoading(true);

      try {
        const snapshot = await getDocs(collection(db, 'products'));

        if (!active) return;

        const products: Product[] = snapshot.docs.map((item) =>
          normalizeProduct(
            item.id,
            item.data() as Record<string, unknown>
          )
        );

        // FEATURED PRODUCTS
        const markedFeatured = products.filter(
          (product) => product.isFeatured
        );

        const featured = (
          markedFeatured.length > 0
            ? markedFeatured
            : products
        ).slice(0, 4);

        // TRENDING PRODUCTS
        const trending = [...products]
          .sort((a, b) => b.salesCount - a.salesCount)
          .slice(0, 4);

        setFeaturedProducts(featured);
        setBestsellers(trending);

        console.log('ShopNova products loaded:', products.length);
      } catch (error) {
        console.error('Home page Firestore error:', error);

        if (active) {
          showToast(
            'Unable to load home page products.',
            'error'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchHomeData();

    return () => {
      active = false;
    };
  }, [showToast]);

  // =====================================
  // NEWSLETTER SUBSCRIPTION
  // =====================================

  const handleSubscribe = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || subscribing) return;

    setSubscribing(true);

    try {
      await addDoc(collection(db, 'subscribers'), {
        email: normalizedEmail,
        subscribedAt: new Date().toISOString()
      });

      showToast('Successfully subscribed!', 'success');
      setEmail('');
    } catch (error) {
      console.error('Newsletter error:', error);

      showToast(
        'Unable to subscribe. Please try again.',
        'error'
      );
    } finally {
      setSubscribing(false);
    }
  };

  // =====================================
  // PRODUCT CARD
  // =====================================

  const renderProduct = (product: Product) => (
    <Link
      key={product.id}
      to={`/product/${product.id}`}
      className="home-product-card"
      aria-label={`View ${product.name}`}
    >
      <div className="home-product-image">
        {product.salesCount > 0 && (
          <span className="home-product-badge">
            BESTSELLER
          </span>
        )}

        <img
          src={getProductImage(product)}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = FALLBACK_IMAGE;
          }}
        />
      </div>

      <div className="home-product-details">
        <p className="home-product-category">
          {product.category}
        </p>

        <h3>{product.name}</h3>

        <div className="home-product-bottom">
          <strong>{formatPrice(product.price)}</strong>

          <span
            className="home-product-arrow"
            aria-hidden="true"
          >
            →
          </span>
        </div>
      </div>
    </Link>
  );

  return (
    <main className="home-page">

      {/* =====================================
          HERO SECTION
      ===================================== */}

      <section className="home-hero">
        <div className="home-hero-container">

          <div className="home-hero-content">

            {/* SHOPNOVA BRAND LOGO */}

            <div className="home-brand">
              <div className="home-brand-icon">
                <span>N</span>
              </div>

              <div className="home-brand-name">
                <strong>shopnova</strong>
                <small>SHOP • DISCOVER • LOVE</small>
              </div>
            </div>

            <p className="home-eyebrow">
              THE SHOPNOVA COLLECTION
            </p>

            <h1>
              Discover products.
              <br />
              <span>Elevate your lifestyle.</span>
            </h1>

            <p className="home-hero-description">
              Carefully selected products for everyday living.
              Quality, style and value in one place.
            </p>

            <Link
              to="/products"
              className="home-primary-button"
            >
              EXPLORE COLLECTION
              <span aria-hidden="true">→</span>
            </Link>

            <div className="home-hero-note">
              <span aria-hidden="true">✦</span>
              Discover something you'll love.
            </div>

          </div>

          {/* HERO CATEGORY SHOWCASE */}

          <div className="home-hero-visual">
            <div className="home-category-showcase">

              <p>THE WORLD OF SHOPNOVA</p>

              <h2>
                Everything you love, in one place.
              </h2>

              <div className="home-showcase-grid">

                <Link
                  to="/products?category=Electronics"
                  className="showcase-item showcase-electronics"
                >
                  <span aria-hidden="true">⌘</span>
                  <strong>Electronics</strong>
                </Link>

                <Link
                  to="/products?category=Clothing"
                  className="showcase-item showcase-fashion"
                >
                  <span aria-hidden="true">✧</span>
                  <strong>Fashion</strong>
                </Link>

                <Link
                  to="/products?category=Books"
                  className="showcase-item showcase-books"
                >
                  <span aria-hidden="true">▤</span>
                  <strong>Books</strong>
                </Link>

                <Link
                  to="/products?category=Home"
                  className="showcase-item showcase-home"
                >
                  <span aria-hidden="true">⌂</span>
                  <strong>Home Living</strong>
                </Link>

              </div>

              <span className="showcase-footer">
                CURATED FOR YOUR EVERYDAY LIFE
              </span>

            </div>
          </div>

        </div>
      </section>

      {/* =====================================
          CATEGORY SECTION
      ===================================== */}

      <section className="home-section home-category-section">

        <div className="home-section-header">
          <div>
            <p className="home-eyebrow">
              EXPLORE OUR COLLECTION
            </p>

            <h2>Shop by Category</h2>

            <p>Find exactly what you are looking for.</p>
          </div>

          <Link to="/products" className="home-view-link">
            ALL COLLECTIONS →
          </Link>
        </div>

        <div className="home-category-grid">

          {categories.map((category) => (
            <Link
              key={category.name}
              to={`/products?category=${encodeURIComponent(category.name)}`}
              className="home-category-card"
            >
              <div className="home-category-symbol">
                {category.symbol}
              </div>

              <div>
                <h3>{category.name}</h3>
                <p>{category.description}</p>
              </div>

              <span
                className="home-category-arrow"
                aria-hidden="true"
              >
                →
              </span>
            </Link>
          ))}

        </div>
      </section>

      {/* =====================================
          TRENDING PRODUCTS
      ===================================== */}

      <section className="home-section">

        <div className="home-section-header">
          <div>
            <p className="home-eyebrow">
              CUSTOMER FAVOURITES
            </p>

            <h2>Trending Now</h2>

            <p>Explore products worth discovering.</p>
          </div>

          <Link to="/products" className="home-view-link">
            VIEW ALL →
          </Link>
        </div>

        {loading ? (
          <div className="home-message">
            Loading trending products...
          </div>
        ) : bestsellers.length === 0 ? (
          <div className="home-message">
            Products are coming soon.
          </div>
        ) : (
          <div className="home-product-grid">
            {bestsellers.map(renderProduct)}
          </div>
        )}

      </section>

      {/* =====================================
          FEATURED PRODUCTS
      ===================================== */}

      <section className="home-section">

        <div className="home-section-header">
          <div>
            <p className="home-eyebrow">
              HANDPICKED FOR YOU
            </p>

            <h2>Featured Products</h2>

            <p>
              Discover our latest additions and collections.
            </p>
          </div>

          <Link to="/products" className="home-view-link">
            VIEW ALL →
          </Link>
        </div>

        {loading ? (
          <div className="home-message">
            Loading your favourite products...
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="home-message">
            No products available yet.
          </div>
        ) : (
          <div className="home-product-grid">
            {featuredProducts.map(renderProduct)}
          </div>
        )}

      </section>

      {/* =====================================
          SERVICE BENEFITS
      ===================================== */}

      <section className="home-benefits">

        <div>
          <span aria-hidden="true">✦</span>
          <h3>Quality Products</h3>
          <p>Carefully selected collections.</p>
        </div>

        <div>
          <span aria-hidden="true">◇</span>
          <h3>Secure Shopping</h3>
          <p>A safer shopping experience.</p>
        </div>

        <div>
          <span aria-hidden="true">↗</span>
          <h3>Easy Shopping</h3>
          <p>Simple and convenient ordering.</p>
        </div>

      </section>

      {/* =====================================
          NEWSLETTER
      ===================================== */}

      <section className="home-newsletter">

        <div className="home-newsletter-content">

          <p className="home-eyebrow">
            STAY IN THE LOOP
          </p>

          <h2>A little something for your inbox.</h2>

          <p>
            Get updates on new arrivals, exclusive offers and more.
          </p>

          <form onSubmit={handleSubscribe}>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              aria-label="Your email address"
              autoComplete="email"
              required
            />

            <button
              type="submit"
              disabled={subscribing}
            >
              {subscribing
                ? 'PLEASE WAIT...'
                : 'SUBSCRIBE →'}
            </button>

          </form>

          <small>
            Stay inspired. Unsubscribe anytime.
          </small>

        </div>
      </section>

    </main>
  );
}
