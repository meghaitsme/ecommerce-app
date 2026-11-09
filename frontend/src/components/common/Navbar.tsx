import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMenu = () => setIsMobileMenuOpen(false);

  const handleLogout = async () => {
    try {
      await logout();
      closeMenu();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const linkStyle: React.CSSProperties = {
    color: '#e2e8f0',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    transition: 'color 0.2s'
  };

  const mobileLinkStyle: React.CSSProperties = {
    display: 'block',
    padding: '13px 18px',
    color: '#f8fafc',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 600,
    borderBottom: '1px solid #334155'
  };

  return (
    <>
      <nav className="shopnova-navbar">

        <div className="shopnova-nav-container">

          {/* LOGO */}
          <Link to="/" className="shopnova-logo" onClick={closeMenu}>
            <span className="logo-icon">⚡</span>
            <span>Shop<span className="logo-highlight">Nova</span></span>
          </Link>

          {/* DESKTOP NAVIGATION */}
          <div className="desktop-menu">

            <Link to="/" style={linkStyle}>Home</Link>
            <Link to="/products" style={linkStyle}>Products</Link>

            {!isAdmin && (
              <Link to="/wishlist" style={linkStyle}>
                <span className="nav-heart">♥</span> Wishlist
              </Link>
            )}

            {!isAdmin && (
              <Link to="/cart" style={linkStyle}>
                🛒 Cart
                <span className="cart-count">{itemCount || 0}</span>
              </Link>
            )}

            {/* ADMIN LINKS */}
            {isAdmin && (
              <div className="admin-nav-links">
                <Link to="/admin/dashboard" style={linkStyle}>Dashboard</Link>
                <Link to="/admin/messages" style={linkStyle}>Messages</Link>
                <Link to="/admin/products" style={linkStyle}>Manage Products</Link>
                <Link to="/admin/orders" style={linkStyle}>Orders</Link>
                <Link to="/admin/coupons" style={linkStyle}>Coupons</Link>
                <Link to="/admin/users" style={linkStyle}>Users</Link>
                <Link to="/admin/reviews" style={linkStyle}>Reviews</Link>
                <Link to="/admin/subscribers" style={linkStyle}>Subscribers</Link>
                <Link to="/contact" style={linkStyle}>Contact</Link>
              </div>
            )}

            {/* AUTHENTICATION */}
            {user ? (
              <div className="nav-user-section">

                <Link to="/profile" className="profile-link">
                  <span className="profile-icon">👤</span>
                  {user.email?.split('@')[0] || 'My Account'}
                </Link>

                <button
                  onClick={handleLogout}
                  className="logout-btn"
                >
                  Logout
                </button>

              </div>
            ) : (
              <Link to="/login" className="login-btn">
                Login / Register
              </Link>
            )}

          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>

        </div>

        {/* MOBILE DROPDOWN */}
        {isMobileMenuOpen && (
          <div className="mobile-dropdown">

            <Link to="/" onClick={closeMenu} style={mobileLinkStyle}>
              🏠 Home
            </Link>

            <Link to="/products" onClick={closeMenu} style={mobileLinkStyle}>
              🛍️ Products
            </Link>

            {!isAdmin && (
              <>
                <Link to="/wishlist" onClick={closeMenu} style={mobileLinkStyle}>
                  ❤️ Wishlist
                </Link>

                <Link to="/cart" onClick={closeMenu} style={mobileLinkStyle}>
                  🛒 Cart ({itemCount || 0})
                </Link>
              </>
            )}

            {isAdmin && (
              <>
                <Link to="/admin/dashboard" onClick={closeMenu} style={mobileLinkStyle}>Dashboard</Link>
                <Link to="/admin/messages" onClick={closeMenu} style={mobileLinkStyle}>Messages</Link>
                <Link to="/admin/products" onClick={closeMenu} style={mobileLinkStyle}>Manage Products</Link>
                <Link to="/admin/orders" onClick={closeMenu} style={mobileLinkStyle}>Orders</Link>
                <Link to="/admin/coupons" onClick={closeMenu} style={mobileLinkStyle}>Coupons</Link>
                <Link to="/admin/users" onClick={closeMenu} style={mobileLinkStyle}>Users</Link>
                <Link to="/admin/reviews" onClick={closeMenu} style={mobileLinkStyle}>Reviews</Link>
                <Link to="/admin/subscribers" onClick={closeMenu} style={mobileLinkStyle}>Subscribers</Link>
                <Link to="/contact" onClick={closeMenu} style={mobileLinkStyle}>Contact Us</Link>
              </>
            )}

            {user ? (
              <>
                <Link to="/profile" onClick={closeMenu} style={mobileLinkStyle}>
                  👤 My Profile
                </Link>

                <button
                  onClick={handleLogout}
                  style={{
                    ...mobileLinkStyle,
                    width: '100%',
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    color: '#fb7185',
                    cursor: 'pointer'
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" onClick={closeMenu} style={mobileLinkStyle}>
                Login / Register
              </Link>
            )}

          </div>
        )}

      </nav>

      {/* NAVBAR DESIGN */}
      <style>{`

        .shopnova-navbar {
          position: sticky;
          top: 0;
          z-index: 1000;
          background: #0f172a;
          color: white;
          font-family: Arial, Helvetica, sans-serif;
          box-shadow: 0 4px 15px rgba(0,0,0,0.12);
        }

        .shopnova-nav-container {
          max-width: 1500px;
          min-height: 75px;
          margin: auto;
          padding: 12px 25px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .shopnova-logo {
          display: flex;
          align-items: center;
          gap: 7px;
          color: white;
          text-decoration: none;
          font-size: 25px;
          font-weight: 900;
          white-space: nowrap;
        }

        .logo-icon {
          color: #ff9f00;
          font-size: 28px;
        }

        .logo-highlight {
          color: #ff9f00;
        }

        .desktop-menu {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 22px;
          flex: 1;
        }

        .desktop-menu a:hover {
          color: #ffb52e !important;
        }

        .admin-nav-links {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 15px;
          flex-wrap: wrap;
        }

        .nav-heart {
          color: #fb7185;
          font-size: 17px;
        }

        .cart-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #ff9f00;
          color: #111827;
          min-width: 20px;
          height: 20px;
          border-radius: 50%;
          font-size: 11px;
          font-weight: 800;
          margin-left: 4px;
          padding: 0 4px;
        }

        .nav-user-section {
          display: flex;
          align-items: center;
          gap: 15px;
          border-left: 1px solid #334155;
          padding-left: 18px;
        }

        .profile-link {
          color: #e2e8f0;
          text-decoration: none;
          font-size: 14px;
          font-weight: 700;
          white-space: nowrap;
        }

        .profile-icon {
          margin-right: 5px;
        }

        .logout-btn {
          background: #7f1d1d;
          color: white;
          border: none;
          padding: 9px 15px;
          border-radius: 7px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.2s;
        }

        .logout-btn:hover {
          background: #dc2626;
        }

        .login-btn {
          background: linear-gradient(135deg, #ffad19, #ff7900);
          color: white;
          text-decoration: none;
          padding: 11px 18px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 800;
          white-space: nowrap;
        }

        .login-btn:hover {
          opacity: 0.9;
        }

        .mobile-menu-btn {
          display: none;
          background: #1e293b;
          border: 1px solid #475569;
          color: white;
          font-size: 23px;
          width: 42px;
          height: 42px;
          border-radius: 8px;
          cursor: pointer;
        }

        .mobile-dropdown {
          display: none;
          background: #172033;
          padding: 8px 15px 15px;
          max-height: 75vh;
          overflow-y: auto;
        }

        .mobile-dropdown a:hover {
          background: #334155;
          color: #ffb52e !important;
        }

        @media (max-width: 1100px) {
          .desktop-menu {
            gap: 13px;
          }

          .admin-nav-links {
            gap: 10px;
          }
        }

        @media (max-width: 900px) {

          .shopnova-nav-container {
            min-height: 65px;
            padding: 10px 18px;
          }

          .desktop-menu {
            display: none;
          }

          .mobile-menu-btn {
            display: block;
          }

          .mobile-dropdown {
            display: flex;
            flex-direction: column;
          }

        }

        @media (min-width: 901px) {
          .mobile-dropdown {
            display: none !important;
          }
        }

      `}</style>
    </>
  );
}