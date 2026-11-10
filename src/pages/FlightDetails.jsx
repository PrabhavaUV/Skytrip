import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SeatMap from '../components/SeatMap';
import PassengerForm from '../components/PassengerForm';

function FlightDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();

  const [flight, setFlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Restore selected seats if returning from login
  const [selectedSeats, setSelectedSeats] = useState(location.state?.selectedSeats || []);
  const [passengerData, setPassengerData] = useState({ passengers: [], isValid: false });
  const [holdError, setHoldError] = useState('');
  const [holdTimer, setHoldTimer] = useState(null); // seconds remaining

  // Fetch flight info and seat layout
  const fetchFlight = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/flights/${id}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to load flight details');
      }

      setFlight(data.flight);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlight();
  }, [id]);

  // Hold timer countdown
  useEffect(() => {
    if (holdTimer === null || holdTimer <= 0) return;
    const interval = setInterval(() => {
      setHoldTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Auto refresh seats when hold expires
          fetchFlight();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [holdTimer]);

  // Handle seat click
  const handleSeatSelect = async (seatNumber) => {
    setHoldError('');

    // Phase 3: Frictionless Authentication Gate
    if (!token) {
      const updated = selectedSeats.includes(seatNumber)
        ? selectedSeats.filter((s) => s !== seatNumber)
        : [...selectedSeats, seatNumber];

      navigate('/login', {
        state: {
          from: `/flights/${id}`,
          selectedSeats: updated,
          message: 'Please log in to reserve your seats and continue booking.',
        },
      });
      return;
    }

    // Toggle seat if already selected
    if (selectedSeats.includes(seatNumber)) {
      try {
        await fetch('/api/seats/release', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            flightId: id,
            seatNumbers: [seatNumber],
          }),
        });

        const updated = selectedSeats.filter((s) => s !== seatNumber);
        setSelectedSeats(updated);
        if (updated.length === 0) setHoldTimer(null);
        fetchFlight();
      } catch (err) {
        console.error('Failed to release seat:', err);
      }
      return;
    }

    // Attempt to place temporary 5-min HOLD on the new seat
    try {
      const res = await fetch('/api/seats/hold', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          flightId: id,
          seatNumbers: [seatNumber],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setHoldError(data.message || `Seat ${seatNumber} could not be reserved.`);
        fetchFlight();
        return;
      }

      setSelectedSeats((prev) => [...prev, seatNumber]);
      setHoldTimer(data.holdDurationSeconds || 300);
      fetchFlight();
    } catch (err) {
      setHoldError('Network error holding seat. Please try again.');
    }
  };

  // Passenger data change handler
  const handlePassengersChange = (formState) => {
    setPassengerData(formState);
  };

  // Calculate pricing breakdown
  const selectedSeatObjects = flight?.seats?.filter((s) => selectedSeats.includes(s.seatNumber)) || [];
  const baseAndSurchargeTotal = selectedSeatObjects.reduce((acc, s) => acc + (s.price || 0), 0);
  const taxesTotal = (flight?.taxes || 350) * selectedSeats.length;
  const grandTotal = baseAndSurchargeTotal + taxesTotal;

  // Proceed to Booking Summary (Member 4 Integration)
  const handleProceedToBook = () => {
    if (selectedSeats.length === 0) {
      setHoldError('Please select at least one seat to proceed.');
      return;
    }

    if (!passengerData.isValid) {
      setHoldError('Please complete all passenger details with valid identification.');
      return;
    }

    navigate('/booking-summary', {
      state: {
        flight,
        flightId: flight.id || flight._id,
        selectedSeats,
        passengers: passengerData.passengers,
        totalAmount: grandTotal,
        fareBreakdown: {
          seatsTotal: baseAndSurchargeTotal,
          taxes: taxesTotal,
          grandTotal,
        },
      },
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#D4AF37' }}>
          <span style={{ fontSize: '2.5rem' }}>✈️</span>
          <p style={{ marginTop: '0.75rem', fontSize: '1.1rem' }}>Loading cabin layout...</p>
        </div>
      </div>
    );
  }

  if (error || !flight) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="card" style={{ maxWidth: '480px', textAlign: 'center', padding: '2rem' }}>
          <span style={{ fontSize: '2.5rem' }}>⚠️</span>
          <h2 style={{ marginTop: '0.75rem', color: '#ef4444' }}>Flight Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '1rem 0' }}>{error || 'Unable to load flight.'}</p>
          <button
            onClick={() => navigate('/flights')}
            style={{
              background: 'var(--accent-gold)',
              color: '#0a0f1f',
              border: 'none',
              padding: '0.65rem 1.5rem',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ← Back to Flights
          </button>
        </div>
      </div>
    );
  }

  const formatHoldTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div style={{ flex: 1, padding: '2rem 1.5rem', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
      {/* ── Flight Header Banner ── */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1.5rem 2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span
                style={{
                  background: 'rgba(212, 175, 55, 0.15)',
                  color: 'var(--accent-gold)',
                  border: '1px solid var(--border-color)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              >
                {flight.flightNumber}
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {flight.aircraftType || 'Boeing 737'}
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', marginTop: '0.5rem', color: '#ffffff' }}>
              {flight.sourceAirport} ➔ {flight.destinationAirport}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{formatDate(flight.departureTime)}</p>
          </div>

          {/* Schedule */}
          <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Departs</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                {formatTime(flight.departureTime)}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{flight.sourceAirport}</span>
            </div>

            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '1.25rem' }}>✈️</span>
            </div>

            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Arrives</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                {formatTime(flight.arrivalTime)}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{flight.destinationAirport}</span>
            </div>
          </div>
        </div>

        {/* Hold Timer Alert */}
        {holdTimer !== null && holdTimer > 0 && (
          <div
            style={{
              marginTop: '1.25rem',
              padding: '0.65rem 1rem',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid var(--seat-hold)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#fbbf24',
              fontSize: '0.9rem',
            }}
          >
            <span>⏱️ Seats held temporarily. Complete your reservation before the timer expires!</span>
            <strong style={{ fontSize: '1.1rem', letterSpacing: '1px' }}>{formatHoldTimer(holdTimer)}</strong>
          </div>
        )}
      </div>

      {holdError && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}
        >
          {holdError}
        </div>
      )}

      {/* ── Step 1: 2D Interactive Cabin Seat Map ── */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', color: '#ffffff', marginBottom: '0.5rem', textAlign: 'center' }}>
          Select Your Seats
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          Click on any available seat to reserve it. Window seats include a complimentary view (+₹150).
        </p>

        <SeatMap
          seats={flight.seats || []}
          selectedSeats={selectedSeats}
          onSeatSelect={handleSeatSelect}
        />
      </div>

      {/* ── Step 2: Passenger Details Form ── */}
      {selectedSeats.length > 0 && (
        <PassengerForm
          selectedSeats={selectedSeats}
          onPassengersChange={handlePassengersChange}
        />
      )}

      {/* ── Step 3: Checkout Action Bar ── */}
      {selectedSeats.length > 0 && (
        <div
          style={{
            marginTop: '2.5rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '1.5rem 2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {selectedSeats.length} Seat{selectedSeats.length > 1 ? 's' : ''} Selected ({selectedSeats.join(', ')})
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
                ₹{grandTotal.toLocaleString('en-IN')}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                (Incl. ₹{taxesTotal.toLocaleString('en-IN')} taxes)
              </span>
            </div>
          </div>

          <button
            onClick={handleProceedToBook}
            disabled={!passengerData.isValid}
            style={{
              background: passengerData.isValid
                ? 'linear-gradient(135deg, #D4AF37 0%, #b89628 100%)'
                : 'rgba(255, 255, 255, 0.1)',
              color: passengerData.isValid ? '#0a0f1f' : '#64748b',
              border: 'none',
              borderRadius: '8px',
              padding: '0.85rem 2.2rem',
              fontWeight: 700,
              fontSize: '1.05rem',
              cursor: passengerData.isValid ? 'pointer' : 'not-allowed',
              boxShadow: passengerData.isValid ? '0 4px 15px rgba(212, 175, 55, 0.3)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            Proceed to Book ➔
          </button>
        </div>
      )}
    </div>
  );
}

export default FlightDetails;
