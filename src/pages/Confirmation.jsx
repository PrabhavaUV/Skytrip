import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Confirmation (Member 4) - the e-ticket / boarding pass.
 *
 * Loads GET /api/bookings/:bookingId and shows a printable ticket.
 * "Print Ticket" calls window.print(). The <style> block below hides
 * everything except the ticket when printing.
 */

const PRINT_STYLES = `
  @media print {
    body * { visibility: hidden; }
    .ticket-print-area, .ticket-print-area * { visibility: visible; }
    .ticket-print-area { position: absolute; left: 0; top: 0; width: 100%; }
    .no-print { display: none !important; }
  }
`;

const formatTime = (value) =>
  new Date(value).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

/**
 * Draws a decorative barcode from the booking reference.
 * Each character decides the width of one bar, so every ticket looks different.
 */
function Barcode({ text }) {
  const bars = text.split('').flatMap((ch, i) => {
    const width = (ch.charCodeAt(0) % 4) + 1;
    return [
      <span key={`b${i}`} style={{ display: 'inline-block', width: `${width * 2}px`, height: '60px', background: '#000' }} />,
      <span key={`g${i}`} style={{ display: 'inline-block', width: `${((i % 3) + 1) * 2}px`, height: '60px' }} />
    ];
  });
  return (
    <div style={{ background: '#fff', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
      <div style={{ lineHeight: 0 }}>{bars}</div>
      <div style={{ color: '#000', fontFamily: 'monospace', letterSpacing: '3px', marginTop: '6px' }}>{text}</div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontWeight: 600, marginTop: '0.2rem' }}>{value}</div>
    </div>
  );
}

function Confirmation() {
  const { bookingId } = useParams();
  const { user, token, loading } = useAuth();

  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    const loadBooking = async () => {
      try {
        const res = await fetch(`/api/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Could not load ticket');
        setBooking(data.booking);
      } catch (err) {
        setError(err.message);
      }
    };
    loadBooking();
  }, [bookingId, token]);

  if (!loading && !user) return <Navigate to="/login" replace />;

  if (error) {
    return (
      <div className="container" style={{ padding: '3rem 0', textAlign: 'center' }}>
        <p className="error-text">{error}</p>
        <Link to="/my-bookings" className="btn btn-outline" style={{ marginTop: '1rem' }}>My Bookings</Link>
      </div>
    );
  }

  if (!booking) {
    return <div className="container" style={{ padding: '3rem 0' }}><div className="spinner" /></div>;
  }

  const flight = booking.flightId || {};
  const isCancelled = booking.status === 'CANCELLED';

  return (
    <div className="container" style={{ padding: '2rem 0', maxWidth: '760px' }}>
      <style>{PRINT_STYLES}</style>

      <div className="no-print" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        {isCancelled ? (
          <h2 style={{ color: '#ef4444' }}>This booking has been cancelled</h2>
        ) : (
          <>
            <h1 style={{ color: 'var(--accent-gold)' }}>Booking Confirmed</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Your e-ticket is ready. Show it at the airport.</p>
          </>
        )}
      </div>

      {/* ── Boarding pass ─────────────────────────────────── */}
      <div className="card ticket-print-area" style={{ border: '2px dashed var(--accent-gold)', padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1.3rem', fontWeight: 700 }}>
            SKY<span style={{ color: 'var(--accent-gold)' }}>TRIP</span> Boarding Pass
          </span>
          <span className={`badge ${isCancelled ? 'badge-cancelled' : 'badge-confirmed'}`}>{booking.status}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.75rem 0' }}>
          <div>
            <div style={{ fontSize: '2.2rem', fontWeight: 700 }}>{flight.sourceAirport}</div>
            <div style={{ color: 'var(--text-secondary)' }}>{formatTime(flight.departureTime)}</div>
          </div>
          <div style={{ color: 'var(--accent-gold)', fontSize: '1.5rem' }}>✈ ➔</div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 700 }}>{flight.destinationAirport}</div>
            <div style={{ color: 'var(--text-secondary)' }}>{formatTime(flight.arrivalTime)}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <Field label="Booking Ref" value={booking.bookingReference} />
          <Field label="Flight" value={flight.flightNumber} />
          <Field label="Date" value={formatDate(flight.departureTime)} />
          <Field label="Gate" value="TBA" />
        </div>

        <div className="divider" />

        <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
          <thead>
            <tr style={{ color: 'var(--text-secondary)', textAlign: 'left', fontSize: '0.8rem' }}>
              <th style={{ padding: '0.4rem 0' }}>PASSENGER</th>
              <th>AGE</th>
              <th>MEAL</th>
              <th style={{ textAlign: 'right' }}>SEAT</th>
            </tr>
          </thead>
          <tbody>
            {booking.passengers.map((p) => (
              <tr key={p.seatNumber}>
                <td style={{ padding: '0.4rem 0', fontWeight: 600 }}>{p.fullName}</td>
                <td>{p.age}</td>
                <td>{p.mealPreference}</td>
                <td style={{ textAlign: 'right', color: 'var(--accent-gold)', fontWeight: 700 }}>{p.seatNumber}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <Barcode text={booking.bookingReference} />
      </div>

      <div className="no-print" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
        {!isCancelled && (
          <button className="btn btn-primary" onClick={() => window.print()}>Print Ticket</button>
        )}
        <Link to="/my-bookings" className="btn btn-outline">My Bookings</Link>
      </div>
    </div>
  );
}

export default Confirmation;
