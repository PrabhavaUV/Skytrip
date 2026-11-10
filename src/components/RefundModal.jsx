import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
// Same file the server uses, so the estimate always matches the real refund
import { calculateRefund } from '../../server/utils/refundCalculator';

/**
 * RefundModal (Member 4) - shown before a booking is cancelled.
 *
 * Props:
 *   booking   - the booking being cancelled
 *   flight    - its flight (needs departureTime)
 *   onConfirm - called with the server's response after a successful cancel
 *   onClose   - called when the user clicks "Go Back"
 */

const rupees = (amount) =>
  `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function RefundModal({ booking, flight, onConfirm, onClose }) {
  const { token } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const estimate = calculateRefund(flight.departureTime, booking.totalAmount);
  const cancellationFee = booking.totalAmount - estimate.refundAmount;

  const handleConfirm = async () => {
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/bookings/${booking._id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Cancellation failed');
      onConfirm(data);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const row = (label, value, color) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0' }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <strong style={{ color: color || 'var(--text-primary)' }}>{value}</strong>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Cancel Booking?</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          {booking.bookingReference} | {flight.flightNumber} | Departs in about {estimate.hoursUntilDeparture} hours
        </p>

        {row('Total Paid', rupees(booking.totalAmount))}
        {row(`Eligible Refund (${estimate.refundPercentage}%)`, rupees(estimate.refundAmount), '#22c55e')}
        {row('Cancellation Fee', rupees(cancellationFee), '#ef4444')}

        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
          Refund policy: 4+ days before departure 75%, 2 to 4 days 50%, 1 to 2 days 25%,
          under 24 hours non-refundable. The refund goes to your Skytrip Wallet.
        </p>

        {error && <p className="error-text" style={{ marginTop: '1rem' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose} disabled={submitting}>
            Go Back
          </button>
          <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleConfirm} disabled={submitting}>
            {submitting ? 'Cancelling...' : 'Confirm Cancellation'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RefundModal;
