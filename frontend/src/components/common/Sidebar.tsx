import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './Sidebar.css';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState<boolean>(
    () => localStorage.getItem('sidebarCollapsed') === 'true'
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(collapsed));
  }, [collapsed]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <button
        className="sidebar-mobile-toggle"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <i className="bx bx-menu" />
      </button>

      <nav
        className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'active' : ''}`}
      >
        <div className="logo-details">
          <img src="/logo.svg" alt="ShopFree" className="brand-logo" />
          <span className="logo_name">ShopFree</span>
          <i
            className="bx bx-menu"
            id="btn-toggle"
            onClick={() => setCollapsed((c) => !c)}
          />
        </div>

        <ul className="nav-list">
          {/* ---------- Front of house ---------- */}
          <li>
            <NavLink to="/" end onClick={closeMobile}>
              <i className="bx bx-home-alt" />
              <span className="link_name">Home</span>
            </NavLink>
            <span className="tooltip">Home</span>
          </li>

          <li>
            <NavLink to="/profile" onClick={closeMobile}>
              <i className="bx bx-user" />
              <span className="link_name">Profile</span>
            </NavLink>
            <span className="tooltip">Profile</span>
          </li>

          <li>
            <NavLink to="/services" onClick={closeMobile}>
              <i className="bx bx-briefcase" />
              <span className="link_name">Services</span>
            </NavLink>
            <span className="tooltip">Services</span>
          </li>

          <li>
            <NavLink to="/contact" onClick={closeMobile}>
              <i className="bx bx-envelope" />
              <span className="link_name">Contact Us</span>
            </NavLink>
            <span className="tooltip">Contact Us</span>
          </li>

          <li className="nav-divider" aria-hidden="true" />

          {/* ---------- Store ---------- */}
          <li>
            <NavLink to="/dashboard" onClick={closeMobile}>
              <i className="bx bx-grid-alt" />
              <span className="link_name">Dashboard</span>
            </NavLink>
            <span className="tooltip">Dashboard</span>
          </li>

          <li>
            <NavLink to="/products" onClick={closeMobile}>
              <i className="bx bx-store" />
              <span className="link_name">Products</span>
            </NavLink>
            <span className="tooltip">Products</span>
          </li>

          <li>
            <NavLink to="/cart" onClick={closeMobile}>
              <i className="bx bx-cart" />
              <span className="link_name">Cart</span>
              {itemCount > 0 && <span className="badge">{itemCount}</span>}
            </NavLink>
            <span className="tooltip">Cart</span>
          </li>

          <li>
            <NavLink to="/orders" onClick={closeMobile}>
              <i className="bx bx-package" />
              <span className="link_name">Orders</span>
              {user && <span className="badge-dot" />}
            </NavLink>
            <span className="tooltip">Orders</span>
          </li>

          <li>
            <NavLink to="/wishlist" onClick={closeMobile}>
              <i className="bx bx-heart" />
              <span className="link_name">Wishlist</span>
            </NavLink>
            <span className="tooltip">Wishlist</span>
          </li>

          {user?.role === 'admin' && (
            <li>
              <NavLink to="/admin/products" onClick={closeMobile}>
                <i className="bx bx-line-chart" />
                <span className="link_name">Admin</span>
              </NavLink>
              <span className="tooltip">Admin</span>
            </li>
          )}

          <li>
            <a
              href="#logout"
              onClick={(e) => {
                e.preventDefault();
                closeMobile();
                handleLogout();
              }}
            >
              <i className="bx bx-log-out" />
              <span className="link_name">Logout</span>
            </a>
            <span className="tooltip">Logout</span>
          </li>
        </ul>

        <div className="profile-details">
          <img
            src={`https://i.pravatar.cc/100?u=${user?.email || 'guest'}`}
            alt="profile"
          />
          <div className="profile_info">
            <div className="profile_name">{user?.name || 'Guest'}</div>
            <div className="job">{user?.role || 'Visitor'}</div>
          </div>
        </div>
      </nav>

      {mobileOpen && <div className="sidebar-backdrop" onClick={closeMobile} />}
    </>
  );
}
