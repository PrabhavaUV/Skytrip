import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RefundModal from '../components/RefundModal';

/**
 * MyBookings (Member 4) - the user's booking history.
 *
 * Loads GET /api/bookings/user. Confirmed bookings get "View Ticket" and
 * "Cancel Booking". Cancel opens RefundModal, which shows the refund estimate
 * and does the actual cancellation.
 */

const rupees = (amount) =>
  `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDateTime = (value) =>
  new Date(value).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
  });

function MyBookings() {
  const { user, token, loading, updateWalletBalance } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [bookingToCancel, setBookingToCancel] = useState(null);

  const loadBookings = async () => {
    try {
      setFetching(true);
      setError('');
      const res = await fetch('/api/bookings/user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Could not load bookings');
      setBookings(data.bookings);
    } catch (err) {
      setError(err.message);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (token) loadBookings();
  }, [token]);

  // Called by RefundModal after the server confirms the cancellation
  const handleCancelled = (result) => {
    setBookingToCancel(null);
    setSuccessMsg(result.message);
    if (result.newWalletBalance !== null) updateWalletBalance(result.newWalletBalance);
    loadBookings();
  };

  if (!loading && !user) return <Navigate to="/login" replace />;

  return (
    <div className="container" style={{ padding: '2rem 0', maxWidth: '900px' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>My Bookings</h1>

      {successMsg && (
        <div className="card" style={{ borderColor: '#22c55e', color: '#22c55e', marginBottom: '1rem' }}>
          {successMsg}
        </div>
      )}
      {error && <p className="error-text">{error}</p>}

      {fetching && <div className="spinner" />}

      {!fetching && !error && bookings.length === 0 && (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>You have no bookings yet.</p>
          <Link to="/" className="btn btn-primary">Search Flights</Link>
        </div>
      )}

      {!fetching && bookings.map((booking) => {
        const flight = booking.flightId || {};
        const isConfirmed = booking.status === 'CONFIRMED';

        return (
          <div key={booking._id} className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ color: 'var(--accent-gold)' }}>{booking.bookingReference}</strong>
                <span style={{ color: 'var(--text-secondary)', marginLeft: '0.75rem' }}>{flight.flightNumber}</span>
              </div>
              <span className={`badge ${isConfirmed ? 'badge-confirmed' : 'badge-cancelled'}`}>
                [{booking.status}]
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', margin: '1rem 0' }}>
              <Info label="Route" value={`${flight.sourceAirport || '?'} ➔ ${flight.destinationAirport || '?'}`} />
              <Info label="Departure" value={flight.departureTime ? formatDateTime(flight.departureTime) : '-'} />
              <Info label="Seats" value={booking.seatNumbers.join(', ')} />
              <Info label="Amount Paid" value={rupees(booking.totalAmount)} />
            </div>

            {!isConfirmed && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Cancelled on {formatDateTime(booking.cancelledAt)}. Refunded {rupees(booking.refundAmount)}.
              </p>
            )}

            {isConfirmed && (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Link to={`/confirmation/${booking._id}`} className="btn btn-outline">View Ticket</Link>
                {flight.departureTime && (
                  <button className="btn btn-danger" onClick={() => { setSuccessMsg(''); setBookingToCancel(booking); }}>
                    Cancel Booking
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {bookingToCancel && (
        <RefundModal
          booking={bookingToCancel}
          flight={bookingToCancel.flightId}
          onConfirm={handleCancelled}
          onClose={() => setBookingToCancel(null)}
        />
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ marginTop: '0.2rem' }}>{value}</div>
    </div>
  );
}

export default MyBookings;
