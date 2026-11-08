
import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { db } from '../../data/firebase';

import {
  collection,
  onSnapshot
} from 'firebase/firestore';

import { formatPrice } from '../../utils/format';

export default function PLP() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const initialCategory = queryParams.get('category') || 'All';

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState('default');

  // GET PRODUCT IMAGE
  const getProductImage = (product: any) => {
    if (Array.isArray(product.images) && product.images.length > 0) {
      const firstImage = product.images[0];

      return typeof firstImage === 'string'
        ? firstImage
        : firstImage?.url ||
          firstImage?.imageUrl ||
          'https://placehold.co/300x300';
    }

    const image =
      product.image ||
      product.imageUrl ||
      'https://placehold.co/300x300';

    return typeof image === 'string'
      ? image.split(',')[0]
      : 'https://placehold.co/300x300';
  };

  // GET CATEGORY NAME
  const getCategoryName = (product: any): string => {
    const cat = product.category;

    if (!cat) return 'Uncategorized';

    if (typeof cat === 'string') {
      return cat;
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

  // FETCH PRODUCTS FROM FIRESTORE
  useEffect(() => {
    console.log('Fetching products from Firebase Firestore...');

    setLoading(true);
    setError('');

    const unsubProducts = onSnapshot(
      collection(db, 'products'),

      (snapshot) => {
        try {
          const fetchedProducts = snapshot.docs.map((document) => ({
            ...document.data(),
            id: document.id,
            _id: document.id
          }));

          console.log('Firestore Products:', fetchedProducts);

          setProducts(fetchedProducts);
          setLoading(false);

          console.log(
            'Total Products Loaded:',
            fetchedProducts.length
          );

        } catch (err) {
          console.error('Product Processing Error:', err);

          setError('Unable to process products.');
          setLoading(false);
        }
      },

      (err) => {
        console.error('Firestore Product Error:', err);

        setError('Unable to load products. Please try again.');
        setLoading(false);
      }
    );

    return () => {
      unsubProducts();
    };

  }, []);

  // SYNC CATEGORY WITH URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);

    setCategory(params.get('category') || 'All');
  }, [location.search]);

  // GET CATEGORIES DYNAMICALLY
  const categories = useMemo(() => {
    const cats = new Set<string>();

    products.forEach((product) => {
      const cat = product.category;

      if (typeof cat === 'string' && cat.trim()) {
        cats.add(cat.trim());
      } else if (cat && typeof cat === 'object') {
        if (cat.name) {
          cats.add(cat.name);
        } else if (cat.id) {
          cats.add(cat.id);
        } else if (Array.isArray(cat.path) && cat.path.length > 0) {
          cats.add(cat.path[cat.path.length - 1]);
        }
      }
    });

    return ['All', ...Array.from(cats).sort()];
  }, [products]);

  // FILTER AND SORT PRODUCTS
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // SEARCH
    if (search.trim()) {
      result = result.filter((product) =>
        (product.name || '')
          .toLowerCase()
          .includes(search.trim().toLowerCase())
      );
    }

    // CATEGORY FILTER
    if (category !== 'All') {
      result = result.filter((product) => {
        const productCategory = getCategoryName(product);

        return (
          productCategory.toLowerCase() === category.toLowerCase()
        );
      });
    }

    // PRICE SORTING
    if (sortBy === 'price-asc') {
      result.sort(
        (a, b) => Number(a.price || 0) - Number(b.price || 0)
      );
    } else if (sortBy === 'price-desc') {
      result.sort(
        (a, b) => Number(b.price || 0) - Number(a.price || 0)
      );
    }

    return result;

  }, [products, search, category, sortBy]);

  // LOADING
  if (loading) {
    return (
      <div
        style={{
          padding: '50px',
          textAlign: 'center',
          fontFamily: 'sans-serif'
        }}
      >
        Loading products...
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: '#f9fafb',
        minHeight: '100vh',
        padding: '30px 20px',
        fontFamily: 'sans-serif'
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}
      >

        {/* PAGE TITLE */}
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 'bold',
            marginBottom: '24px'
          }}
        >
          All Products
        </h1>

        {/* PRODUCT COUNT */}
        <p
          style={{
            color: '#6b7280',
            marginBottom: '20px'
          }}
        >
          Showing {filteredProducts.length} of {products.length} products
        </p>

        {/* SEARCH AND FILTERS */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            backgroundColor: 'white',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            marginBottom: '32px',
            alignItems: 'center'
          }}
        >

          {/* SEARCH */}
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: '1 1 200px',
              padding: '10px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '6px'
            }}
          />

          {/* CATEGORY FILTER */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              padding: '10px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* PRICE SORT */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '10px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="default">Sort by: Featured</option>
            <option value="price-asc">
              Price: Low to High
            </option>
            <option value="price-desc">
              Price: High to Low
            </option>
          </select>

        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div
            style={{
              textAlign: 'center',
              padding: '30px',
              color: '#dc2626'
            }}
          >
            {error}
          </div>
        )}

        {/* NO PRODUCTS */}
        {!error && filteredProducts.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '60px',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}
          >
            <h3
              style={{
                fontSize: '20px',
                color: '#374151'
              }}
            >
              No products found
            </h3>

            <p style={{ color: '#6b7280' }}>
              Try changing your search or category filter.
            </p>

            <button
              onClick={() => {
                setSearch('');
                setCategory('All');
                setSortBy('default');
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* PRODUCT GRID */}
        {!error && filteredProducts.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '24px'
            }}
          >

            {filteredProducts.map((product) => {

              const price = Number(product.price) || 0;

              const originalPrice = Number(
                product.originalPrice ||
                product.compareAtPrice ||
                0
              );

              const discountPercent =
                originalPrice > price && price > 0
                  ? Math.round(
                      ((originalPrice - price) /
                        originalPrice) * 100
                    )
                  : 0;

              return (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  style={{
                    textDecoration: 'none',
                    color: 'inherit'
                  }}
                >
                  <div
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid #e5e7eb',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >

                    {/* PRODUCT IMAGE */}
                    <div
                      style={{
                        height: '220px',
                        backgroundColor: '#f3f4f6',
                        padding: '16px',
                        position: 'relative'
                      }}
                    >

                      {/* DISCOUNT BADGE */}
                      {discountPercent > 0 && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '10px',
                            left: '10px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            zIndex: 1
                          }}
                        >
                          {discountPercent}% OFF
                        </div>
                      )}

                      <img
                        src={getProductImage(product)}
                        alt={product.name || 'Product'}
                        onError={(e) => {
                          e.currentTarget.src =
                            'https://placehold.co/300x300';
                        }}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain'
                        }}
                      />

                    </div>

                    {/* PRODUCT DETAILS */}
                    <div
                      style={{
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1
                      }}
                    >

                      {/* CATEGORY */}
                      <p
                        style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          marginBottom: '4px'
                        }}
                      >
                        {getCategoryName(product)}
                      </p>

                      {/* PRODUCT NAME */}
                      <h3
                        style={{
                          fontSize: '16px',
                          fontWeight: 'bold',
                          margin: '0 0 8px 0',
                          flex: 1
                        }}
                      >
                        {product.name}
                      </h3>

                      {/* PRICE */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flexWrap: 'wrap'
                        }}
                      >

                        <p
                          style={{
                            fontSize: '20px',
                            fontWeight: 'bold',
                            margin: 0
                          }}
                        >
                          {formatPrice(price)}
                        </p>

                        {discountPercent > 0 && (
                          <p
                            style={{
                              fontSize: '14px',
                              color: '#9ca3af',
                              textDecoration: 'line-through',
                              margin: 0
                            }}
                          >
                            {formatPrice(originalPrice)}
                          </p>
                        )}

                      </div>

                    </div>

                  </div>
                </Link>
              );
            })}

          </div>
        )}

      </div>
    </div>
  );
}
