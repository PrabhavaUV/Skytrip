import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, openWalletModal } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const firstName = user ? user.name.split(' ')[0] : '';

  return (
    <nav
      style={{
        background: 'rgba(15, 22, 41, 0.9)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: '0.875rem 0'
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        {/* Brand */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '1.4rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            textDecoration: 'none'
          }}
        >
          <span style={{ color: 'var(--accent-gold)' }}>✈️</span>
          <span>SKY<span style={{ color: 'var(--accent-gold)' }}>TRIP</span></span>
        </Link>

        {/* Navigation Items */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <Link
            to="/"
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              fontWeight: 500,
              textDecoration: 'none'
            }}
          >
            Search Flights
          </Link>

          {user ? (
            <>
              <Link
                to="/my-bookings"
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  textDecoration: 'none'
                }}
              >
                My Bookings
              </Link>

              {user.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  style={{
                    color: 'var(--accent-gold)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    padding: '0.25rem 0.5rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  Admin Portal
                </Link>
              )}

              {/* Wallet Pill Button */}
              <button
                id="navbar-wallet-pill"
                onClick={openWalletModal}
                title="Click to view ledger or top up funds"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'var(--accent-gold-muted)',
                  border: '1px solid var(--accent-gold)',
                  borderRadius: '999px',
                  padding: '0.35rem 0.85rem',
                  color: 'var(--accent-gold)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>💳</span>
                <span>₹{user.walletBalance ? user.walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}</span>
                <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>+</span>
              </button>

              {/* User profile & Logout */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Hi, <strong style={{ color: 'var(--text-primary)' }}>{firstName}</strong>
                </span>
                <button
                  onClick={handleLogout}
                  className="btn btn-outline"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link
                to="/login"
                className="btn btn-outline"
                style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="btn btn-primary"
                style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
