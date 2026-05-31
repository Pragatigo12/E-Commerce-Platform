import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const styles = {
    nav: {
      position: 'sticky', top: 0, zIndex: 100,
      background: '#fff', borderBottom: '1px solid #EEEBE5',
      padding: '0 5%',
    },
    inner: {
      maxWidth: 1280, margin: '0 auto',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: 68,
    },
    logo: {
      fontFamily: "'Playfair Display', serif",
      fontSize: 22, fontWeight: 700, letterSpacing: 3,
      color: '#1A1714', textDecoration: 'none',
    },
    links: { display: 'flex', gap: 28, listStyle: 'none' },
    link: (active) => ({
      fontSize: 13, fontWeight: 500, letterSpacing: 1,
      textTransform: 'uppercase', color: active ? '#1A1714' : '#8A8278',
      textDecoration: 'none', transition: 'color 0.2s',
    }),
    iconBtn: {
      width: 38, height: 38, borderRadius: '50%',
      background: '#EEEBE5', border: 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 16, cursor: 'pointer', position: 'relative',
    },
    cartBadge: {
      position: 'absolute', top: -4, right: -4,
      width: 18, height: 18, borderRadius: '50%',
      background: '#B8954A', color: '#fff',
      fontSize: 10, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    right: { display: 'flex', alignItems: 'center', gap: 12 },
    dropdown: {
      position: 'absolute', top: '100%', right: 0,
      background: '#fff', border: '1px solid #EEEBE5',
      borderRadius: 4, minWidth: 180, boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
      overflow: 'hidden',
    },
    dropItem: {
      padding: '12px 18px', display: 'block',
      fontSize: 14, color: '#3D3830',
      textDecoration: 'none', cursor: 'pointer',
      transition: 'background 0.15s', border: 'none', width: '100%',
      textAlign: 'left', background: 'none', fontFamily: 'inherit',
    },
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        <Link to="/" style={styles.logo}>LU<span style={{ color: '#B8954A' }}>✦</span>XE</Link>

        <ul style={styles.links} className="nav-desktop-links">
          {[['/', 'Home'], ['/products', 'Shop'], ['/products?featured=true', 'New In']].map(([path, label]) => (
            <li key={path}>
              <Link to={path} style={styles.link(isActive(path))}>{label}</Link>
            </li>
          ))}
          {isAdmin && (
            <li><Link to="/admin" style={styles.link(false)} className="admin-link">Admin</Link></li>
          )}
        </ul>

        <div style={styles.right}>
          {/* Cart */}
          <button style={styles.iconBtn} onClick={() => navigate('/cart')} title="Cart">
            🛒
            {itemCount > 0 && <span style={styles.cartBadge}>{itemCount}</span>}
          </button>

          {/* User dropdown */}
          {isAuthenticated ? (
            <div style={{ position: 'relative' }}>
              <button
                style={{ ...styles.iconBtn, background: '#E8D5A3' }}
                onClick={() => setDropOpen(!dropOpen)}
                title={user?.name}
              >
                {user?.name?.[0]?.toUpperCase() || '👤'}
              </button>
              {dropOpen && (
                <div style={styles.dropdown} onMouseLeave={() => setDropOpen(false)}>
                  <Link to="/profile" style={styles.dropItem} onClick={() => setDropOpen(false)}>👤 Profile</Link>
                  <Link to="/orders"  style={styles.dropItem} onClick={() => setDropOpen(false)}>📦 My Orders</Link>
                  {isAdmin && (
                    <Link to="/admin" style={styles.dropItem} onClick={() => setDropOpen(false)}>⚙️ Admin Panel</Link>
                  )}
                  <hr style={{ borderColor: '#EEEBE5', margin: '4px 0' }} />
                  <button style={{ ...styles.dropItem, color: '#C94040' }} onClick={handleLogout}>
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary" style={{ padding: '10px 22px' }}>Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;