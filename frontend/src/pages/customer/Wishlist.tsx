
import { Link } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

export default function Wishlist() {
  const { user } = useAuth();

  const { addToCart, cartLoading } = useCart();

  const {
    wishlist,
    loading,
    error,
    removeFromWishlist
  } = useWishlist();

  // ==========================================
  // REMOVE WISHLIST PRODUCT
  // ==========================================

  const handleRemove = async (id: string) => {
    try {
      await removeFromWishlist(id);
    } catch (err) {
      console.error('Remove wishlist error:', err);
      alert('Unable to remove product from wishlist.');
    }
  };

  // ==========================================
  // ADD PRODUCT TO CART
  // ==========================================

  const handleAddToCart = (item: typeof wishlist[number]) => {
    const success = addToCart({
      id: item.productId,
      name: item.name,
      price: item.price,
      image: item.imageUrl
    });

    if (success) {
      alert('Product added to cart!');
    } else {
      alert('Unable to add product. Please check stock and try again.');
    }
  };

  // ==========================================
  // LOGIN CHECK
  // ==========================================

  if (!user) {
    return (
      <div style={{
        padding: '80px 24px',
        textAlign: 'center'
      }}>
        <h2>Please log in to view your wishlist</h2>

        <Link to="/login">
          Log In
        </Link>
      </div>
    );
  }

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div style={{
        padding: '80px',
        textAlign: 'center'
      }}>
        Loading your wishlist...
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div style={{
        padding: '60px',
        textAlign: 'center'
      }}>
        <h2>Unable to load wishlist</h2>
        <p>{error}</p>
      </div>
    );
  }

  // ==========================================
  // EMPTY WISHLIST
  // ==========================================

  if (wishlist.length === 0) {
    return (
      <div style={{
        padding: '60px',
        textAlign: 'center'
      }}>
        <h2>Your wishlist is empty ❤️</h2>

        <p>Save your favorite products here.</p>

        <Link to="/products">
          Explore Products
        </Link>
      </div>
    );
  }

  // ==========================================
  // WISHLIST PRODUCTS
  // ==========================================

  return (
    <div style={{
      padding: '40px 24px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>

      <h1>My Wishlist ❤️</h1>

      <p>
        {wishlist.length} saved product(s)
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns:
          'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '24px'
      }}>

        {wishlist.map(item => (

          <div
            key={item.id}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: 'white'
            }}
          >

            <Link to={`/product/${item.productId}`}>
              <img
                src={
                  item.imageUrl ||
                  'https://placehold.co/300x200?text=Product'
                }
                alt={item.name}
                onError={(e) => {
                  e.currentTarget.src =
                    'https://placehold.co/300x200?text=Product';
                }}
                style={{
                  width: '100%',
                  height: '200px',
                  objectFit: 'cover'
                }}
              />
            </Link>

            <div style={{ padding: '16px' }}>

              <h3>
                <Link
                  to={`/product/${item.productId}`}
                  style={{
                    textDecoration: 'none',
                    color: 'inherit'
                  }}
                >
                  {item.name}
                </Link>
              </h3>

              <p style={{
                fontSize: '20px',
                fontWeight: 'bold'
              }}>
                ₹{item.price.toFixed(2)}
              </p>

              <div style={{
                display: 'flex',
                gap: '8px'
              }}>

                <button
                  onClick={() => handleAddToCart(item)}
                  disabled={cartLoading}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: cartLoading ? 'not-allowed' : 'pointer',
                    opacity: cartLoading ? 0.6 : 1
                  }}
                >
                  Add to Cart
                </button>

                <button
                  onClick={() => handleRemove(item.id)}
                  style={{
                    padding: '10px',
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                  title="Remove from wishlist"
                >
                  ✕
                </button>

              </div>

            </div>
          </div>

        ))}

      </div>
    </div>
  );
}
