
import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { db } from '../../data/firebase';

import {
  collection,
  onSnapshot
} from 'firebase/firestore';

import { formatPrice } from '../../utils/format';

import './PLP.css';

// ==========================================
// PRODUCT INTERFACE
// ==========================================

interface Product {
  id: string;
  _id: string;
  name?: string;
  description?: string;
  category?: string | {
    name?: string;
    id?: string;
    path?: string[];
  };
  price?: number;
  originalPrice?: number;
  compareAtPrice?: number;
  image?: string;
  imageUrl?: string;
  images?: Array<string | {
    url?: string;
    imageUrl?: string;
  }>;
  featured?: boolean;
  isFeatured?: boolean;
  featuredRank?: number;
  stock?: number;
  stockQuantity?: number;
  quantity?: number;
  inStock?: boolean;
  createdAt?: any;
  [key: string]: any;
}

const FALLBACK_IMAGE =
  'https://placehold.co/500x500?text=ShopNova';

// ==========================================
// MAIN PRODUCTS PAGE
// ==========================================

export default function PLP() {

  const location = useLocation();
  const navigate = useNavigate();

  const initialCategory =
    new URLSearchParams(location.search).get('category') || 'All';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState('featured');
  const [stockFilter, setStockFilter] = useState('all');

  const [retryCount, setRetryCount] = useState(0);

  // ==========================================
  // PRODUCT IMAGE
  // ==========================================

  const getProductImage = (product: Product): string => {

    if (Array.isArray(product.images) && product.images.length > 0) {

      const first = product.images[0];

      if (typeof first === 'string' && first.trim()) {
        return first.trim();
      }

      if (typeof first === 'object' && first !== null) {

        const image =
          first.url ||
          first.imageUrl;

        if (image) return image;
      }
    }

    const image = product.imageUrl || product.image;

    if (typeof image === 'string' && image.trim()) {
      return image.split(',')[0].trim();
    }

    return FALLBACK_IMAGE;
  };

  // ==========================================
  // CATEGORY NAME
  // ==========================================

  const getCategoryName = (product: Product): string => {

    const cat = product.category;

    if (!cat) return 'Uncategorized';

    if (typeof cat === 'string') {
      return cat.trim() || 'Uncategorized';
    }

    if (typeof cat === 'object') {

      if (cat.name) return cat.name;

      if (cat.id) return cat.id;

      if (Array.isArray(cat.path) && cat.path.length > 0) {
        return cat.path[cat.path.length - 1];
      }
    }

    return 'Uncategorized';
  };

  // ==========================================
  // STOCK STATUS
  // ==========================================

  const isOutOfStock = (product: Product): boolean => {

    if (product.inStock === false) {
      return true;
    }

    const stock =
      product.stock ??
      product.stockQuantity ??
      product.quantity;

    if (stock === undefined || stock === null) {
      return false;
    }

    return Number(stock) <= 0;
  };

  // ==========================================
  // DATE CONVERSION
  // ==========================================

  const getDate = (value: any): number => {

    if (!value) return 0;

    if (typeof value.toMillis === 'function') {
      return value.toMillis();
    }

    if (typeof value.toDate === 'function') {
      return value.toDate().getTime();
    }

    if (value instanceof Date) {
      return value.getTime();
    }

    const date = new Date(value).getTime();

    return Number.isNaN(date) ? 0 : date;
  };

  // ==========================================
  // FETCH PRODUCTS FROM FIRESTORE
  // ==========================================

  useEffect(() => {

    setLoading(true);
    setError('');

    const unsubscribe = onSnapshot(
      collection(db, 'products'),

      (snapshot) => {

        const fetchedProducts: Product[] =
          snapshot.docs.map((document) => {

            const data = document.data();

            return {
              ...data,
              id: document.id,
              _id: document.id
            } as Product;

          });

        setProducts(fetchedProducts);
        setLoading(false);
        setError('');

        console.log(
          'ShopNova Firestore Products:',
          fetchedProducts.length
        );

      },

      (err) => {

        console.error('Firestore Product Error:', err);

        setError(
          'Unable to load products. Please check your connection and try again.'
        );

        setLoading(false);

      }
    );

    return () => unsubscribe();

  }, [retryCount]);

  // ==========================================
  // SYNC CATEGORY WITH URL
  // ==========================================

  useEffect(() => {

    const params = new URLSearchParams(location.search);

    setCategory(params.get('category') || 'All');

  }, [location.search]);

  // ==========================================
  // CATEGORY CHANGE
  // ==========================================

  const handleCategoryChange = (value: string) => {

    setCategory(value);

    const params = new URLSearchParams(location.search);

    if (value === 'All') {
      params.delete('category');
    } else {
      params.set('category', value);
    }

    navigate({
      pathname: location.pathname,
      search: params.toString()
        ? `?${params.toString()}`
        : ''
    }, { replace: true });

  };

  // ==========================================
  // DYNAMIC CATEGORIES
  // ==========================================

  const categories = useMemo(() => {

    const cats = new Set<string>();

    products.forEach((product) => {

      const name = getCategoryName(product);

      if (name !== 'Uncategorized') {
        cats.add(name);
      }

    });

    return [
      'All',
      ...Array.from(cats).sort((a, b) =>
        a.localeCompare(b)
      )
    ];

  }, [products]);

  // ==========================================
  // SEARCH, FILTER AND SORT
  // ==========================================

  const filteredProducts = useMemo(() => {

    let result = [...products];

    // SEARCH

    if (search.trim()) {

      const term = search.trim().toLowerCase();

      result = result.filter((product) => {

        const name = String(product.name || '').toLowerCase();

        const description =
          String(product.description || '').toLowerCase();

        const cat =
          getCategoryName(product).toLowerCase();

        const brand =
          String(product.brand || '').toLowerCase();

        return (
          name.includes(term) ||
          description.includes(term) ||
          cat.includes(term) ||
          brand.includes(term)
        );

      });

    }

    // CATEGORY FILTER

    if (category !== 'All') {

      result = result.filter((product) =>

        getCategoryName(product).toLowerCase() ===
        category.toLowerCase()

      );

    }

    // STOCK FILTER

    if (stockFilter === 'in-stock') {

      result = result.filter(
        (product) => !isOutOfStock(product)
      );

    } else if (stockFilter === 'out-of-stock') {

      result = result.filter(
        (product) => isOutOfStock(product)
      );

    }

    // SORTING

    switch (sortBy) {

      case 'price-asc':

        result.sort((a, b) =>
          Number(a.price || 0) - Number(b.price || 0)
        );

        break;

      case 'price-desc':

        result.sort((a, b) =>
          Number(b.price || 0) - Number(a.price || 0)
        );

        break;

      case 'name-asc':

        result.sort((a, b) =>
          (a.name || '').localeCompare(b.name || '')
        );

        break;

      case 'newest':

        result.sort((a, b) =>
          getDate(b.createdAt) - getDate(a.createdAt)
        );

        break;

      case 'featured':

        result.sort((a, b) => {

          const aFeatured =
            a.featured === true || a.isFeatured === true;

          const bFeatured =
            b.featured === true || b.isFeatured === true;

          if (aFeatured !== bFeatured) {
            return aFeatured ? -1 : 1;
          }

          return (
            Number(b.featuredRank || 0) -
            Number(a.featuredRank || 0)
          );

        });

        break;

    }

    return result;

  }, [products, search, category, sortBy, stockFilter]);

  // ==========================================
  // CLEAR FILTERS
  // ==========================================

  const clearFilters = () => {

    setSearch('');
    setSortBy('featured');
    setStockFilter('all');

    handleCategoryChange('All');

  };

  // ==========================================
  // RETRY
  // ==========================================

  const handleRetry = () => {

    setProducts([]);
    setError('');
    setLoading(true);

    setRetryCount((previous) => previous + 1);

  };

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {

    return (

      <div className="plp-loading">

        <div className="plp-spinner"></div>

        <p>Loading ShopNova products...</p>

      </div>

    );

  }

  // ==========================================
  // MAIN UI
  // ==========================================

  return (

    <main className="plp-page">

      <div className="plp-container">

        {/* PAGE HEADER */}

        <div className="plp-header">

          <div>

            <span className="plp-eyebrow">
              SHOPNOVA COLLECTION
            </span>

            <h1>Discover Products</h1>

            <p>
              Find everything you love, all in one place.
            </p>

          </div>

        </div>

        {/* FILTER PANEL */}

        <section className="plp-filter-panel">

          <div className="plp-search">

            <span>⌕</span>

            <input
              type="search"
              placeholder="Search products, categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search products"
            />

          </div>

          <select
            value={category}
            onChange={(e) =>
              handleCategoryChange(e.target.value)
            }
            aria-label="Filter by category"
          >

            {!categories.includes(category) && category !== 'All' && (
              <option value={category}>{category}</option>
            )}

            {categories.map((cat) => (

              <option key={cat} value={cat}>
                {cat}
              </option>

            ))}

          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort products"
          >

            <option value="featured">Featured</option>
            <option value="newest">Newest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Name: A to Z</option>

          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            aria-label="Filter by availability"
          >

            <option value="all">All Availability</option>
            <option value="in-stock">In Stock</option>
            <option value="out-of-stock">Out of Stock</option>

          </select>

        </section>

        {/* RESULTS */}

        <div className="plp-results">

          <p>
            Showing <strong>{filteredProducts.length}</strong> of{' '}
            <strong>{products.length}</strong> products
          </p>

          {(search ||
            category !== 'All' ||
            stockFilter !== 'all' ||
            sortBy !== 'featured') && (

            <button
              className="plp-clear"
              onClick={clearFilters}
            >
              Clear Filters ✕
            </button>

          )}

        </div>

        {/* ERROR */}

        {error && (

          <div className="plp-error">

            <p>{error}</p>

            <button onClick={handleRetry}>
              Try Again
            </button>

          </div>

        )}

        {/* EMPTY STATE */}

        {!error && filteredProducts.length === 0 && (

          <div className="plp-empty">

            <div className="plp-empty-icon">⌕</div>

            <h2>No products found</h2>

            <p>
              Try another search or adjust your filters.
            </p>

            <button onClick={clearFilters}>
              Clear All Filters
            </button>

          </div>

        )}

        {/* PRODUCT GRID */}

        {!error && filteredProducts.length > 0 && (

          <div className="plp-grid">

            {filteredProducts.map((product) => {

              const price = Number(product.price) || 0;

              const originalPrice = Number(
                product.originalPrice ??
                product.compareAtPrice ??
                0
              );

              const discountPercent =
                originalPrice > price && price > 0
                  ? Math.round(
                      ((originalPrice - price) / originalPrice) * 100
                    )
                  : 0;

              const outOfStock = isOutOfStock(product);

              const featured =
                product.featured === true ||
                product.isFeatured === true;

              return (

                <article
                  className="plp-card"
                  key={product.id}
                >

                  <Link
                    to={`/product/${product.id}`}
                    className="plp-product-link"
                  >

                    {/* IMAGE */}

                    <div className="plp-image-wrapper">

                      <img
                        src={getProductImage(product)}
                        alt={product.name || 'ShopNova product'}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = FALLBACK_IMAGE;
                        }}
                      />

                      {/* BADGES */}

                      <div className="plp-badges">

                        {discountPercent > 0 && (

                          <span className="plp-discount">
                            {discountPercent}% OFF
                          </span>

                        )}

                        {featured && (

                          <span className="plp-featured">
                            Featured
                          </span>

                        )}

                      </div>

                      {outOfStock && (

                        <div className="plp-stock-overlay">
                          Out of Stock
                        </div>

                      )}

                      <span className="plp-view-label">
                        View Product →
                      </span>

                    </div>

                    {/* PRODUCT DETAILS */}

                    <div className="plp-product-info">

                      <span className="plp-category">
                        {getCategoryName(product)}
                      </span>

                      <h3>
                        {product.name || 'Unnamed Product'}
                      </h3>

                      <div className="plp-price-row">

                        <span className="plp-price">
                          {formatPrice(price)}
                        </span>

                        {discountPercent > 0 && (

                          <span className="plp-original-price">
                            {formatPrice(originalPrice)}
                          </span>

                        )}

                      </div>

                      <p className={
                        outOfStock
                          ? 'plp-stock out'
                          : 'plp-stock available'
                      }>

                        <span></span>

                        {outOfStock
                          ? 'Out of Stock'
                          : 'Available'}

                      </p>

                    </div>

                  </Link>

                </article>

              );

            })}

          </div>

        )}

      </div>

    </main>

  );

}
