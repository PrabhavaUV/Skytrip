import React from 'react';
import { useNavigate } from 'react-router-dom';

function FlightCard({ flight }) {
  const navigate = useNavigate();

  const depDate = new Date(flight.departureTime);
  const arrDate = new Date(flight.arrivalTime);

  const formatTime = (date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  const formatDate = (date) =>
    date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  // Calculate duration in hours & minutes
  const diffMinutes = Math.max(0, Math.round((arrDate - depDate) / (1000 * 60)));
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  const durationStr = `${hours}h ${minutes}m`;

  const isLowSeats = flight.availableSeatsCount > 0 && flight.availableSeatsCount < 10;

  return (
    <div
      style={{
        background: '#131b2e',
        borderRadius: '12px',
        border: '1px solid #1e293b',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
        transition: 'transform 0.2s ease, border-color 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#D4AF37';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#1e293b';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Top Header: Flight Number, Aircraft & Badges */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.25rem' }}>✈️</span>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f8fafc', letterSpacing: '0.05em' }}>
            {flight.flightNumber}
          </span>
          <span
            style={{
              fontSize: '0.75rem',
              color: '#94a3b8',
              background: '#1e293b',
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
            }}
          >
            {flight.aircraftType || 'Boeing 737'}
          </span>
        </div>

        {isLowSeats && (
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#ef4444',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '0.25rem 0.6rem',
              borderRadius: '20px',
            }}
          >
            🔥 Only {flight.availableSeatsCount} seats left!
          </span>
        )}
      </div>

      {/* Flight Timeline: Origin -> Path -> Destination */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: '1rem',
          textAlign: 'center',
        }}
      >
        {/* Source */}
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc' }}>
            {flight.sourceAirport}
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#D4AF37' }}>
            {formatTime(depDate)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            {formatDate(depDate)}
          </div>
        </div>

        {/* Duration Vector */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '120px' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
            {durationStr} • Non-stop
          </span>
          <div
            style={{
              width: '100%',
              height: '2px',
              background: 'linear-gradient(90deg, #334155 0%, #D4AF37 50%, #334155 100%)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ background: '#131b2e', padding: '0 4px', fontSize: '0.9rem' }}>✈</span>
          </div>
        </div>

        {/* Destination */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc' }}>
            {flight.destinationAirport}
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#D4AF37' }}>
            {formatTime(arrDate)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            {formatDate(arrDate)}
          </div>
        </div>
      </div>

      {/* Footer: Price & Select Seats Button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '0.75rem',
          borderTop: '1px solid #1e293b',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Starting from</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#D4AF37' }}>
            ₹{flight.baseFare?.toLocaleString('en-IN')}
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400, marginLeft: '4px' }}>
              + taxes
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate(`/flights/${flight.id || flight._id}`)}
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #b89628 100%)',
            color: '#0a0f1f',
            border: 'none',
            borderRadius: '8px',
            padding: '0.65rem 1.4rem',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)',
            transition: 'opacity 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Select Seats →
        </button>
      </div>
    </div>
  );
}

export default FlightCard;

