import { Link } from 'react-router-dom';
import type { MouseEvent } from 'react';
import type { Product } from '../../types';
import { formatPrice } from '../../utils/format';
import { useState, useEffect } from 'react';

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';

import { useAuth } from '../../context/AuthContext';
import { db, auth } from '../../data/firebase';

export default function ProductCard({ product }: { product: Product }) {

  const { user } = useAuth();

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check whether product already exists in wishlist
useEffect(() => {
  let active = true;

  const checkWishlist = async () => {
    if (!user?.uid || !product._id) {
      if (active) setIsWishlisted(false);
      return;
    }

    try {
      const wishlistId = `${user.uid}_${product._id}`;

      const wishlistRef = doc(db, 'wishlist', wishlistId);

      const wishlistSnap = await getDoc(wishlistRef);

      if (active) {
        setIsWishlisted(wishlistSnap.exists());
      }
    } catch (error) {
      console.error('Wishlist check failed:', error);
    }
  };

  checkWishlist();

  return () => {
    active = false;
  };
}, [user?.uid, product._id]);

  const productImage =
    product.image ||
    'https://placehold.co/400x400?text=ShopNova';

  const addToWishlist = async (
    e: MouseEvent<HTMLButtonElement>
  ) => {

    e.preventDefault();
    e.stopPropagation();

    const uid = auth.currentUser?.uid || user?.uid;

    if (!uid) {
      alert('Please login first to add products to your wishlist!');
      return;
    }

    if (loading || isWishlisted) return;

    if (!product._id) {
      alert('Product ID is missing!');
      return;
    }

    try {

      setLoading(true);

      const wishlistId = `${uid}_${product._id}`;

      await setDoc(
        doc(db, 'wishlist', wishlistId),
        {
          userId: uid,
          productId: product._id,
          name: product.name,
          price: product.price,
          imageUrl: productImage,
          category: product.category || 'General',
          createdAt: serverTimestamp()
        },
        { merge: true }
      );

      setIsWishlisted(true);

      alert('❤️ Added to your wishlist!');

    } catch (error: unknown) {

      console.error('Wishlist Error:', error);

      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong';

      alert(`Unable to add to wishlist: ${message}`);

    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`

        .shopnova-product-card {
          position: relative;
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid #edf0f4;
          box-shadow: 0 3px 12px rgba(0,0,0,0.04);
          transition: all 0.3s ease;
          height: 100%;
        }

        .shopnova-product-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 28px rgba(0,0,0,0.10);
          border-color: #dce3ed;
        }

        .shopnova-image-container {
          position: relative;
          height: 220px;
          padding: 20px;
          background: #f8fafc;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
        }

        .shopnova-product-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transition: transform 0.4s ease;
        }

        .shopnova-product-card:hover .shopnova-product-image {
          transform: scale(1.07);
        }

        .shopnova-wishlist-btn {
          position: absolute;
          top: 13px;
          right: 13px;
          z-index: 5;
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 50%;
          background: white;
          color: #64748b;
          font-size: 21px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 10px rgba(0,0,0,0.10);
          transition: all 0.25s ease;
        }

        .shopnova-wishlist-btn:hover {
          transform: scale(1.12);
          color: #ef4444;
        }

        .shopnova-wishlist-btn.active {
          color: #ef4444;
          background: #fff1f2;
        }

        .shopnova-product-info {
          padding: 17px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .shopnova-category {
          color: #64748b;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.7px;
          margin-bottom: 8px;
        }

        .shopnova-product-name {
          color: #1e293b;
          font-size: 16px;
          font-weight: 700;
          line-height: 1.5;
          margin: 0 0 12px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 48px;
        }

        .shopnova-product-price {
          font-size: 21px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 17px;
        }

        .shopnova-view-btn {
          display: block;
          width: 100%;
          padding: 12px;
          text-align: center;
          text-decoration: none;
          background: linear-gradient(135deg, #ff9f00, #ff7700);
          color: white;
          border-radius: 9px;
          font-size: 14px;
          font-weight: 700;
          transition: all 0.25s ease;
          box-sizing: border-box;
        }

        .shopnova-view-btn:hover {
          background: linear-gradient(135deg, #f58b00, #e96800);
          box-shadow: 0 5px 14px rgba(255,140,0,0.25);
        }

        @media (max-width: 480px) {
          .shopnova-image-container {
            height: 170px;
            padding: 14px;
          }

          .shopnova-product-info {
            padding: 12px;
          }

          .shopnova-product-name {
            font-size: 14px;
          }

          .shopnova-product-price {
            font-size: 18px;
          }
        }

      `}</style>

      <div className="shopnova-product-card">

        {/* Wishlist Button */}

        <button
          type="button"
          className={`shopnova-wishlist-btn ${isWishlisted ? 'active' : ''}`}
          onClick={addToWishlist}
          disabled={loading}
          aria-label={
            isWishlisted
              ? 'Already in wishlist'
              : 'Add to wishlist'
          }
          title={
            isWishlisted
              ? 'Added to wishlist'
              : 'Add to wishlist'
          }
        >
          {loading ? '...' : isWishlisted ? '♥' : '♡'}
        </button>

        {/* Product Image */}

        <Link
          to={`/product/${product._id}`}
          style={{ textDecoration: 'none' }}
        >
          <div className="shopnova-image-container">

            <img
              src={productImage}
              alt={product.name}
              className="shopnova-product-image"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src =
                  'https://placehold.co/400x400?text=ShopNova';
              }}
            />

          </div>
        </Link>

        {/* Product Details */}

        <div className="shopnova-product-info">

          <span className="shopnova-category">
            {product.category || 'General'}
          </span>

          <Link
            to={`/product/${product._id}`}
            style={{ textDecoration: 'none' }}
          >
            <h3 className="shopnova-product-name">
              {product.name}
            </h3>
          </Link>

          <p className="shopnova-product-price">
            {formatPrice(product.price)}
          </p>

          <div style={{ marginTop: 'auto' }}>

            <Link
              to={`/product/${product._id}`}
              className="shopnova-view-btn"
            >
              View Details →
            </Link>

          </div>

        </div>

      </div>
    </>
  );
}