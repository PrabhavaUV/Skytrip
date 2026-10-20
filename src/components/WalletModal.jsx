import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const PRESET_AMOUNTS = [500, 1000, 2500, 5000];

const WalletModal = () => {
  const { user, token, isWalletOpen, closeWalletModal, updateWalletBalance } = useAuth();
  const [amount, setAmount] = useState('1000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isWalletOpen || !user) return null;

  const handleTopUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid top-up amount greater than ₹0.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/wallet/topup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: numericAmount })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Top-up request failed');
      }

      updateWalletBalance(data.newBalance);
      setSuccessMsg(data.message || `₹${numericAmount.toLocaleString('en-IN')} added successfully!`);
      setTimeout(() => {
        setSuccessMsg('');
        closeWalletModal();
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={closeWalletModal}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>💳</span>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>Digital Wallet</h2>
          </div>
          <button
            onClick={closeWalletModal}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {/* Current Balance Display */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            textAlign: 'center',
            marginBottom: '1.5rem'
          }}
        >
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Current Balance
          </div>
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: 'var(--accent-gold)',
              marginTop: '0.25rem'
            }}
          >
            ₹{user.walletBalance ? user.walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontSize: '0.85rem',
              marginBottom: '1rem'
            }}
          >
            {error}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              color: '#22c55e',
              fontSize: '0.85rem',
              marginBottom: '1rem',
              textAlign: 'center'
            }}
          >
            ✅ {successMsg}
          </div>
        )}

        <form onSubmit={handleTopUp}>
          <div className="form-group">
            <label>Select Top-Up Amount</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
              {PRESET_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(String(val))}
                  style={{
                    padding: '0.5rem 0',
                    background: amount === String(val) ? 'var(--accent-gold)' : 'var(--bg-secondary)',
                    color: amount === String(val) ? '#0a0f1f' : 'var(--text-primary)',
                    border: `1px solid ${amount === String(val) ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  ₹{val}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="custom-topup-amount">Or Enter Custom Amount (₹)</label>
            <input
              id="custom-topup-amount"
              type="number"
              min="1"
              step="100"
              placeholder="e.g. 3000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={closeWalletModal}
              style={{ flex: 1 }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 2 }}
              disabled={loading}
            >
              {loading ? <span className="spinner" style={{ width: '1rem', height: '1rem' }}></span> : 'Add Funds'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WalletModal;
