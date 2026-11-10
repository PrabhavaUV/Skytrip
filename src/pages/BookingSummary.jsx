import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * BookingSummary (Member 4) - the checkout page.
 *
 * Reached from FlightDetails "Proceed to Book", which passes in router state:
 *   { flight, flightId, selectedSeats, passengers, totalAmount }
 *
 * Shows the fare breakdown and the wallet balance, then pays with the wallet.
 * If the balance is too low, the pay button is disabled and a Quick Top-Up
 * link opens Member 1's WalletModal (already mounted in App.jsx).
 */

const rupees = (amount) =>
  `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDateTime = (value) =>
  new Date(value).toLocaleString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
  });

const WINDOW_SURCHARGE = 150;

function BookingSummary() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token, loading, refreshProfile, openWalletModal, updateWalletBalance } = useAuth();

  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const checkout = location.state;

  // Get the latest wallet balance from GET /api/auth/me when the page opens
  useEffect(() => {
    if (token) refreshProfile();
  }, [token]);

  // ── Guard clauses ──────────────────────────────────────────
  if (loading) {
    return <div className="container" style={{ padding: '3rem 0' }}><div className="spinner" /></div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!checkout || !checkout.flight || !checkout.selectedSeats?.length) {
    return (
      <div className="container" style={{ padding: '3rem 0', textAlign: 'center' }}>
        <h2>No booking in progress</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '1rem 0' }}>
          Please choose a flight and seats first.
        </p>
        <Link to="/" className="btn btn-primary">Search Flights</Link>
      </div>
    );
  }

  const { flight, flightId, selectedSeats, passengers } = checkout;

  // ── Price breakdown (same formula as the server) ───────────
  const seatRows = selectedSeats.map((seatNumber) => {
    const seat = flight.seats.find((s) => s.seatNumber === seatNumber) || {};
    const isWindow = seat.seatType === 'WINDOW';
    const price = seat.price || 0;
    return {
      seatNumber,
      seatClass: seat.seatClass,
      seatType: seat.seatType,
      baseFare: isWindow ? price - WINDOW_SURCHARGE : price,
      surcharge: isWindow ? WINDOW_SURCHARGE : 0,
      passenger: passengers.find((p) => p.seatNumber === seatNumber)
    };
  });
  const baseTotal = seatRows.reduce((sum, r) => sum + r.baseFare, 0);
  const surchargeTotal = seatRows.reduce((sum, r) => sum + r.surcharge, 0);
  const taxesTotal = (flight.taxes || 350) * selectedSeats.length;
  const grandTotal = baseTotal + surchargeTotal + taxesTotal;

  const balance = user.walletBalance || 0;
  const shortBy = grandTotal - balance;
  const hasEnough = shortBy <= 0;

  // ── Pay with wallet ────────────────────────────────────────
  const handlePay = async () => {
    setError('');
    setPaying(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ flightId, seatNumbers: selectedSeats, passengers, totalAmount: grandTotal })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Payment failed. Please try again.');
      }

      updateWalletBalance(data.newWalletBalance);
      navigate(`/confirmation/${data.booking.id}`, { replace: true });
    } catch (err) {
      setError(err.message);
      refreshProfile();
    } finally {
      setPaying(false);
    }
  };

  const cellStyle = { padding: '0.6rem 0.5rem', borderBottom: '1px solid var(--border-subtle)' };
  const rightCell = { ...cellStyle, textAlign: 'right' };

  return (
    <div className="container" style={{ padding: '2rem 0', maxWidth: '820px' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Review and Pay</h1>

      {/* Flight details */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ color: 'var(--accent-gold)' }}>
          {flight.flightNumber}: {flight.sourceAirport} ➔ {flight.destinationAirport}
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Departs {formatDateTime(flight.departureTime)} | Arrives {formatDateTime(flight.arrivalTime)}
        </p>
      </div>

      {/* Fare breakdown */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Fare Breakdown</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ color: 'var(--text-secondary)', textAlign: 'left' }}>
              <th style={cellStyle}>Seat</th>
              <th style={cellStyle}>Passenger</th>
              <th style={rightCell}>Base Fare</th>
              <th style={rightCell}>Seat Surcharge</th>
            </tr>
          </thead>
          <tbody>
            {seatRows.map((row) => (
              <tr key={row.seatNumber}>
                <td style={cellStyle}>
                  <strong>{row.seatNumber}</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {row.seatClass} {row.seatType}
                  </div>
                </td>
                <td style={cellStyle}>{row.passenger?.fullName || '-'}</td>
                <td style={rightCell}>{rupees(row.baseFare)}</td>
                <td style={rightCell}>{row.surcharge ? `+${rupees(row.surcharge)} (Window)` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: '1rem', display: 'grid', gap: '0.4rem' }}>
          <SummaryLine label="Base fare total" value={rupees(baseTotal)} />
          <SummaryLine label="Seat surcharges" value={rupees(surchargeTotal)} />
          <SummaryLine label={`Taxes (${rupees(flight.taxes || 350)} x ${selectedSeats.length})`} value={rupees(taxesTotal)} />
          <div className="divider" />
          <SummaryLine label={<strong>Total payable</strong>} value={<strong style={{ color: 'var(--accent-gold)', fontSize: '1.2rem' }}>{rupees(grandTotal)}</strong>} />
        </div>
      </div>

      {/* Wallet and pay */}
      <div className="card">
        <SummaryLine label="Skytrip Wallet Balance" value={<strong>{rupees(balance)}</strong>} />

        {error && <p className="error-text" style={{ marginTop: '1rem' }}>{error}</p>}

        {hasEnough ? (
          <button
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1.25rem' }}
            onClick={handlePay}
            disabled={paying}
          >
            {paying ? 'Processing payment...' : `Pay ${rupees(grandTotal)} via Wallet`}
          </button>
        ) : (
          <>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.25rem' }} disabled>
              Short by {rupees(shortBy)}
            </button>
            <p style={{ textAlign: 'center', marginTop: '0.75rem' }}>
              <button
                onClick={openWalletModal}
                style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Quick Top-Up
              </button>
            </p>
          </>
        )}

        <p style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Link to={`/flights/${flightId}`} style={{ color: 'var(--text-secondary)' }}>
            Back to seat selection
          </Link>
        </p>
      </div>
    </div>
  );
}

/** One "label ..... value" line in the summary */
function SummaryLine({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export default BookingSummary;
