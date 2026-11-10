import React from 'react';
import '../styles/seatmap.css';

/**
 * Interactive 2D Airplane Cabin Seat Map
 * Props:
 *  - seats: Array of seat objects { seatNumber, seatClass, seatType, seatStatus, heldUntil, price }
 *  - selectedSeats: Array of selected seatNumber strings
 *  - onSeatSelect: (seatNumber) => void
 */
function SeatMap({ seats = [], selectedSeats = [], onSeatSelect }) {
  const now = new Date();

  // Helper to determine the dynamic status of a seat
  const getSeatStatus = (seat) => {
    if (selectedSeats.includes(seat.seatNumber)) {
      return 'SELECTED';
    }
    if (seat.seatStatus === 'BOOKED') {
      return 'BOOKED';
    }
    if (seat.seatStatus === 'HOLD') {
      if (seat.heldUntil && new Date(seat.heldUntil) > now) {
        return 'HOLD';
      }
      return 'AVAILABLE';
    }
    return 'AVAILABLE';
  };

  // Group seats by class and row number
  const groupSeatsByRow = (seatList) => {
    const rowMap = {};
    seatList.forEach((seat) => {
      // e.g. "B1A" -> match prefix/row/col
      const match = seat.seatNumber.match(/^([A-Z]?)(\d+)([A-Z])$/);
      const rowKey = match ? `${match[1]}${match[2]}` : '1';
      if (!rowMap[rowKey]) {
        rowMap[rowKey] = [];
      }
      rowMap[rowKey].push(seat);
    });

    // Sort seats in each row alphabetically and return rows sorted numerically
    const sortedRows = Object.keys(rowMap)
      .sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
        return numA - numB;
      })
      .map((rowKey) => {
        rowMap[rowKey].sort((a, b) => a.seatNumber.localeCompare(b.seatNumber));
        return [rowKey, rowMap[rowKey]];
      });

    return sortedRows;
  };

  if (!seats || seats.length === 0) {
    return (
      <div
        style={{
          maxWidth: '680px',
          margin: '1.5rem auto',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>💺</div>
        <h3 style={{ color: '#f8fafc', marginBottom: '0.5rem' }}>No Seat Map Available</h3>
        <p style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
          This flight does not have a cabin seat layout loaded. If you are running locally, make sure{' '}
          <strong style={{ color: 'var(--accent-gold)' }}>MongoDB</strong> is running, seed the database
          (<code style={{ color: 'var(--accent-gold)' }}>npm run seed</code>), and restart the server.
        </p>
      </div>
    );
  }

  const businessSeats = seats.filter((s) => s.seatClass === 'BUSINESS');
  const economySeats = seats.filter((s) => s.seatClass === 'ECONOMY');

  const businessRows = groupSeatsByRow(businessSeats);
  const economyRows = groupSeatsByRow(economySeats);

  // Total price of currently selected seats
  const selectedSeatObjects = seats.filter((s) => selectedSeats.includes(s.seatNumber));
  const totalPrice = selectedSeatObjects.reduce((acc, s) => acc + (s.price || 0), 0);

  const renderSeatButton = (seat, isBusiness = false) => {
    const status = getSeatStatus(seat);
    const isSelected = status === 'SELECTED';
    const isAvailable = status === 'AVAILABLE';
    const isHold = status === 'HOLD';
    const isBooked = status === 'BOOKED';

    let className = `seat-btn ${isBusiness ? 'business-seat' : 'economy-seat'}`;
    if (isSelected) className += ' seat-selected';
    else if (isHold) className += ' seat-hold';
    else if (isBooked) className += ' seat-booked';
    else className += ' seat-available';

    const disabled = isHold || isBooked;

    return (
      <button
        key={seat.seatNumber}
        type="button"
        className={className}
        disabled={disabled}
        onClick={() => onSeatSelect && onSeatSelect(seat.seatNumber)}
        title={`${seat.seatNumber} (${seat.seatClass} - ${seat.seatType}) - ₹${seat.price?.toLocaleString('en-IN')}`}
      >
        <span>{seat.seatNumber}</span>
        {seat.seatType === 'WINDOW' && !isBooked && (
          <span className="seat-surcharge-tag">W</span>
        )}
      </button>
    );
  };

  return (
    <div className="fuselage-container">
      {/* Aircraft Nose / Cockpit */}
      <div className="aircraft-nose">
        <div className="cockpit-window" />
      </div>

      <div className="fuselage-body">
        {/* ── Business Class Cabin ── */}
        {businessSeats.length > 0 && (
          <div className="cabin-section">
            <div className="cabin-header">
              <span className="cabin-title">⭐ Business Class</span>
              <span className="cabin-pricing-pill">2 × 2 Luxury Seating</span>
            </div>

            {businessRows.map(([rowKey, rowSeats]) => {
              const midpoint = Math.ceil(rowSeats.length / 2);
              const leftCluster = rowSeats.slice(0, midpoint);
              const rightCluster = rowSeats.slice(midpoint);

              return (
                <div key={rowKey} className="business-row">
                  <div className="seat-cluster">
                    {leftCluster.map((s) => renderSeatButton(s, true))}
                  </div>
                  <div className="aisle-gap">Aisle</div>
                  <div className="seat-cluster">
                    {rightCluster.map((s) => renderSeatButton(s, true))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Galley Separator */}
        {businessSeats.length > 0 && economySeats.length > 0 && (
          <div className="galley-separator">
            <span className="galley-label">Galley & Restrooms</span>
          </div>
        )}

        {/* ── Economy Class Cabin ── */}
        {economySeats.length > 0 && (
          <div className="cabin-section">
            <div className="cabin-header">
              <span className="cabin-title">✈️ Economy Class</span>
              <span className="cabin-pricing-pill">3 × 3 Main Cabin</span>
            </div>

            {economyRows.map(([rowKey, rowSeats]) => {
              const midpoint = Math.ceil(rowSeats.length / 2);
              const leftCluster = rowSeats.slice(0, midpoint);
              const rightCluster = rowSeats.slice(midpoint);

              return (
                <div key={rowKey} className="economy-row">
                  <div className="seat-cluster">
                    {leftCluster.map((s) => renderSeatButton(s, false))}
                  </div>
                  <div className="aisle-gap">Aisle</div>
                  <div className="seat-cluster">
                    {rightCluster.map((s) => renderSeatButton(s, false))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Legend ── */}
        <div className="seat-legend">
          <div className="legend-item">
            <div className="legend-dot legend-available" />
            <span>Available</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot legend-selected" />
            <span>Selected</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot legend-hold" />
            <span>Temporary Hold</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot legend-booked" />
            <span>Booked</span>
          </div>
          <div className="legend-item" style={{ fontSize: '0.75rem', opacity: 0.8 }}>
            <span>* (W) = Window (+₹150)</span>
          </div>
        </div>

        {/* ── Live Total Price Bar ── */}
        {selectedSeats.length > 0 && (
          <div className="seatmap-price-bar">
            <div className="price-bar-text">
              <strong>{selectedSeats.length}</strong> Seat{selectedSeats.length > 1 ? 's' : ''} Selected:{' '}
              <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>
                {selectedSeats.join(', ')}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total:</span>
              <span className="price-bar-amount">₹{totalPrice.toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SeatMap;
