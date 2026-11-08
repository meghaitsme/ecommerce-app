
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  collection,
  getDocs,
  addDoc
} from 'firebase/firestore';

import { db } from '../../data/firebase';
import { formatPrice } from '../../utils/format';
import { useToast } from '../../context/ToastContext';

interface Product {
  id: string;
  name: string;
  price: number;
  category?: string;
  description?: string;
  image?: string;
  imageUrl?: string;
  images?: any[];
  isFeatured?: boolean;
  salesCount?: number;
  stock?: number;
  [key: string]: any;
}

const pageStyle: React.CSSProperties = {
  background: '#f6f7f9',
  minHeight: '100vh',
  color: '#111827',
  fontFamily: 'Arial, sans-serif'
};

const sectionStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '65px 24px'
};

const buttonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '15px 25px',
  background: '#111827',
  color: '#fff',
  border: '1px solid #111827',
  fontWeight: 600,
  fontSize: '13px',
  cursor: 'pointer',
  textDecoration: 'none'
};

function getProductImage(product: Product): string {
  if (Array.isArray(product.images) && product.images.length) {
    const first = product.images[0];

    if (typeof first === 'string') return first;

    return first?.url || first?.imageUrl || '';
  }

  if (Array.isArray(product.image)) {
    return product.image[0] || '';
  }

  if (typeof product.image === 'string') {
    return product.image.split(',')[0].trim();
  }

  return product.imageUrl || 'https://placehold.co/500x500?text=ShopNova';
}

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const { showToast } = useToast();

  // FETCH PRODUCTS AND BESTSELLERS FROM FIRESTORE
  useEffect(() => {
    let active = true;

   const fetchHomeData = async () => {
  try {
    const productsSnapshot = await getDocs(
      collection(db, 'products')
    );

    if (!active) return;

    const products: Product[] = productsSnapshot.docs.map((item) => {
  const data = item.data();

  return {
    id: item.id,
    _id: item.id,
    name: String(data.name || 'Unnamed Product'),
    price: Number(data.price) || 0,
    category: data.category || '',
    description: data.description || '',
    image: data.image || '',
    imageUrl: data.imageUrl || '',
    images: Array.isArray(data.images) ? data.images : [],
    isFeatured: data.isFeatured === true,
    salesCount: Number(data.salesCount) || 0,
    stock: Number(data.stock) || 0
  };
});

    // FEATURED PRODUCTS
    const markedFeatured = products.filter(
      (item) => item.isFeatured === true
    );

    const displayedFeatured = (
      markedFeatured.length > 0 ? markedFeatured : products
    ).slice(0, 4);

    setFeaturedProducts(displayedFeatured);

    // BESTSELLERS
    const topSelling = [...products]
      .sort(
        (a, b) =>
          (Number(b.salesCount) || 0) -
          (Number(a.salesCount) || 0)
      )
      .slice(0, 4);

    setBestsellers(
      topSelling.some((item) => Number(item.salesCount) > 0)
        ? topSelling.filter((item) => Number(item.salesCount) > 0)
        : []
    );

    console.log('All Products:', products);
    console.log('Featured Products:', displayedFeatured);
    console.log('Bestsellers:', topSelling);

  } catch (error) {
    console.error('Home page Firestore error:', error);
    showToast('Unable to load home page products.', 'error');
  } finally {
    if (active) setLoading(false);
  }
};
    fetchHomeData();

    return () => {
      active = false;
    };
  }, []);

  // NEWSLETTER SUBSCRIPTION
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) return;

    setSubscribing(true);

    try {
      await addDoc(collection(db, 'subscribers'), {
        email: email.trim().toLowerCase(),
        subscribedAt: new Date().toISOString()
      });

      showToast('Successfully subscribed!', 'success');
      setEmail('');

    } catch (error) {
      console.error('Newsletter error:', error);
      showToast('Unable to subscribe. Please try again.', 'error');

    } finally {
      setSubscribing(false);
    }
  };

  // PRODUCT CARD
  const renderProduct = (product: Product) => (
    <Link
      key={product.id}
      to={`/product/${product.id}`}
      style={{
        background: '#fff',
        textDecoration: 'none',
        color: '#111827',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #e5e7eb',
        transition: 'transform .2s, box-shadow .2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = '0 12px 25px rgba(0,0,0,.07)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{
        height: '245px',
        background: '#f4f4f2',
        padding: '20px',
        position: 'relative'
      }}>
        {product.salesCount ? (
          <span style={{
            position: 'absolute',
            top: 12,
            left: 12,
            background: '#111827',
            color: '#fff',
            fontSize: 10,
            padding: '6px 9px',
            letterSpacing: '1px'
          }}>
            BESTSELLER
          </span>
        ) : null}

        <img
          src={getProductImage(product)}
          alt={product.name}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
        />
      </div>

      <div style={{ padding: '19px' }}>
        <p style={{
          fontSize: 10,
          letterSpacing: '1.5px',
          color: '#9ca3af',
          textTransform: 'uppercase',
          marginBottom: 9
        }}>
          {product.category || 'ShopNova Collection'}
        </p>

        <h3 style={{
          fontSize: 15,
          fontWeight: 600,
          marginBottom: 12
        }}>
          {product.name}
        </h3>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <strong style={{ fontSize: 16 }}>
            {formatPrice(Number(product.price) || 0)}
          </strong>

          <span style={{ fontSize: 18 }}>→</span>
        </div>
      </div>
    </Link>
  );

  return (
    <main style={pageStyle}>

      {/* HERO SECTION */}
      <section style={{
        background: '#eae9e5',
        padding: '85px 24px',
        minHeight: '440px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <div style={{
          maxWidth: 1200,
          width: '100%',
          margin: '0 auto'
        }}>
          <p style={{
            fontSize: 11,
            letterSpacing: 4,
            color: '#9a7548',
            marginBottom: 22
          }}>
            THE SHOPNOVA COLLECTION
          </p>

          <h1 style={{
            fontSize: 'clamp(38px, 6vw, 65px)',
            lineHeight: 1.12,
            fontWeight: 700,
            maxWidth: 650,
            marginBottom: 22
          }}>
            Discover products.
            <br />
            Elevate your lifestyle.
          </h1>

          <p style={{
            color: '#6b7280',
            fontSize: 15,
            maxWidth: 450,
            lineHeight: 1.8,
            marginBottom: 32
          }}>
            Carefully selected products for everyday living.
            Quality, style and value in one place.
          </p>

          <Link to="/products" style={buttonStyle}>
            EXPLORE COLLECTION <span style={{ marginLeft: 25 }}>→</span>
          </Link>
        </div>
      </section>

      {/* CATEGORY SECTION */}
      <section style={{
        ...sectionStyle,
        paddingBottom: 25
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'end',
          marginBottom: 25
        }}>
          <div>
            <p style={eyebrow}>EXPLORE</p>
            <h2 style={heading}>Shop by Category</h2>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 15
        }}>
          {['Electronics', 'Clothing', 'Books', 'Home'].map((category) => (
            <Link
              key={category}
              to={`/products?category=${encodeURIComponent(category)}`}
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                padding: '27px 15px',
                textAlign: 'center',
                fontSize: 14,
                fontWeight: 600,
                color: '#111827'
              }}
            >
              {category} <span style={{ marginLeft: 8 }}>→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* BESTSELLERS */}
      {bestsellers.length > 0 && (
        <section style={sectionStyle}>
          <div style={sectionHeader}>
            <div>
              <p style={eyebrow}>CUSTOMER FAVOURITES</p>
              <h2 style={heading}>Trending Now</h2>
              <p style={subheading}>
                The products everyone is talking about.
              </p>
            </div>

            <Link to="/products" style={viewLink}>VIEW ALL →</Link>
          </div>

          <div style={productGrid}>
            {bestsellers.map(renderProduct)}
          </div>
        </section>
      )}

      {/* FEATURED PRODUCTS */}
      <section style={sectionStyle}>
        <div style={sectionHeader}>
          <div>
            <p style={eyebrow}>HANDPICKED FOR YOU</p>
            <h2 style={heading}>Featured Products</h2>
            <p style={subheading}>
              Discover our latest additions and collections.
            </p>
          </div>

          <Link to="/products" style={viewLink}>VIEW ALL →</Link>
        </div>

        {loading ? (
          <p>Loading products...</p>
        ) : featuredProducts.length === 0 ? (
          <p>No products available yet.</p>
        ) : (
          <div style={productGrid}>
            {featuredProducts.map(renderProduct)}
          </div>
        )}
      </section>

      {/* NEWSLETTER */}
      <section style={{
        background: '#111827',
        padding: '75px 24px',
        textAlign: 'center',
        color: '#fff'
      }}>
        <p style={{
          color: '#c69b65',
          fontSize: 10,
          letterSpacing: 3,
          marginBottom: 18
        }}>
          STAY IN THE LOOP
        </p>

        <h2 style={{
          fontSize: 32,
          marginBottom: 15
        }}>
          A little something for your inbox.
        </h2>

        <p style={{
          color: '#9ca3af',
          fontSize: 14,
          marginBottom: 30
        }}>
          Get updates on new arrivals, exclusive offers and more.
        </p>

        <form
          onSubmit={handleSubscribe}
          style={{
            display: 'flex',
            maxWidth: 500,
            margin: '0 auto',
            gap: 8,
            flexWrap: 'wrap'
          }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            required
            style={{
              flex: '1 1 250px',
              padding: 16,
              border: '1px solid #374151',
              background: '#1f2937',
              color: '#fff',
              outline: 'none',
              fontSize: 13
            }}
          />

          <button
            type="submit"
            disabled={subscribing}
            style={{
              ...buttonStyle,
              background: '#fff',
              color: '#111827',
              border: '1px solid #fff'
            }}
          >
            {subscribing ? 'PLEASE WAIT...' : 'SUBSCRIBE →'}
          </button>
        </form>
      </section>

    </main>
  );
}

const eyebrow: React.CSSProperties = {
  color: '#a17b4b',
  fontSize: 10,
  letterSpacing: 2,
  marginBottom: 10
};

const heading: React.CSSProperties = {
  fontSize: 29,
  fontWeight: 700,
  marginBottom: 9
};

const subheading: React.CSSProperties = {
  fontSize: 13,
  color: '#9ca3af'
};

const sectionHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'end',
  gap: 20,
  marginBottom: 30,
  flexWrap: 'wrap'
};

const viewLink: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 1,
  color: '#111827'
};

const productGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
  gap: 22
};
