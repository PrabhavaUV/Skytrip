import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function AddFlight() {
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated or not ADMIN
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      navigate('/admin/login');
    }
  }, [isAuthenticated, user, navigate]);

  const [form, setForm] = useState({
    flightNumber: '',
    aircraftType: 'Boeing 737',
    sourceAirport: '',
    destinationAirport: '',
    departureTime: '',
    arrivalTime: '',
    baseFare: '',
    taxes: '350',
    businessMultiplier: '1.5',
    businessRows: '2',
    businessCols: '2',
    economyRows: '8',
    economyCols: '6',
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [existingFlights, setExistingFlights] = useState([]);

  // Calculated total seats
  const totalSeats =
    (parseInt(form.businessRows, 10) || 0) * (parseInt(form.businessCols, 10) || 0) +
    (parseInt(form.economyRows, 10) || 0) * (parseInt(form.economyCols, 10) || 0);

  // Load existing flights for admin review
  const loadFlights = async () => {
    try {
      const res = await fetch('/api/flights');
      const data = await res.json();
      if (data.success) {
        setExistingFlights(data.flights || []);
      }
    } catch (err) {
      console.error('Failed to load flights:', err);
    }
  };

  useEffect(() => {
    loadFlights();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: ['flightNumber', 'sourceAirport', 'destinationAirport'].includes(name)
        ? value.toUpperCase()
        : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (new Date(form.arrivalTime) <= new Date(form.departureTime)) {
      setErrorMessage('Arrival time must be after departure time.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/flights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create flight');
      }

      setSuccessMessage(data.message || `Flight ${form.flightNumber} created successfully!`);
      // Reset form
      setForm({
        flightNumber: '',
        aircraftType: 'Boeing 737',
        sourceAirport: '',
        destinationAirport: '',
        departureTime: '',
        arrivalTime: '',
        baseFare: '',
        taxes: '350',
        businessMultiplier: '1.5',
        businessRows: '2',
        businessCols: '2',
        economyRows: '8',
        economyCols: '6',
      });
      loadFlights();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (flightId, flightNum) => {
    if (!window.confirm(`Are you sure you want to delete flight ${flightNum}?`)) return;

    try {
      const res = await fetch(`/api/flights/${flightId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete');
      loadFlights();
    } catch (err) {
      alert(`Error deleting flight: ${err.message}`);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 1.5rem', width: '100%' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🛠️</span>
            <h1 style={{ fontSize: '1.8rem', color: '#f8fafc', margin: 0, fontWeight: 700 }}>
              Flight Management & Schedule Creation
            </h1>
          </div>
          <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
            Administered by <strong style={{ color: '#D4AF37' }}>{user?.name || 'Administrator'}</strong>
          </p>
        </div>

        <button
          onClick={() => navigate('/flights')}
          style={{
            background: '#131b2e',
            color: '#D4AF37',
            border: '1px solid #D4AF37',
            borderRadius: '6px',
            padding: '0.5rem 1rem',
            fontSize: '0.85rem',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          View Public Catalog →
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div
          style={{
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid #22c55e',
            color: '#22c55e',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            fontWeight: 600,
          }}
        >
          ✅ {successMessage}
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            color: '#ef4444',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            fontWeight: 600,
          }}
        >
          ❌ {errorMessage}
        </div>
      )}

      {/* Grid: Left Form, Right Existing Catalog */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '2rem', alignItems: 'start' }}>
        {/* Create Flight Form Card */}
        <div
          style={{
            background: '#131b2e',
            borderRadius: '12px',
            border: '1px solid #1e293b',
            padding: '1.75rem',
            boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
          }}
        >
          <h2 style={{ fontSize: '1.2rem', color: '#D4AF37', margin: '0 0 1.25rem 0', fontWeight: 700 }}>
            Create New Flight
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                  Flight Number *
                </label>
                <input
                  type="text"
                  name="flightNumber"
                  value={form.flightNumber}
                  onChange={handleChange}
                  placeholder="e.g. SKY-505"
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    background: '#0a0f1f',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                  Aircraft Type
                </label>
                <input
                  type="text"
                  name="aircraftType"
                  value={form.aircraftType}
                  onChange={handleChange}
                  placeholder="Boeing 737"
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    background: '#0a0f1f',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                  }}
                />
              </div>
            </div>

            {/* Route: Source & Destination */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                  Source Airport Code *
                </label>
                <input
                  type="text"
                  name="sourceAirport"
                  value={form.sourceAirport}
                  onChange={handleChange}
                  placeholder="BOM"
                  maxLength={3}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    background: '#0a0f1f',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                  Destination Airport Code *
                </label>
                <input
                  type="text"
                  name="destinationAirport"
                  value={form.destinationAirport}
                  onChange={handleChange}
                  placeholder="GOI"
                  maxLength={3}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    background: '#0a0f1f',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                />
              </div>
            </div>

            {/* Departure & Arrival Times */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                  Departure Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="departureTime"
                  value={form.departureTime}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    background: '#0a0f1f',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    colorScheme: 'dark',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                  Arrival Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="arrivalTime"
                  value={form.arrivalTime}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    background: '#0a0f1f',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    colorScheme: 'dark',
                  }}
                />
              </div>
            </div>

            {/* Fares & Taxes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                  Base Fare (₹) *
                </label>
                <input
                  type="number"
                  name="baseFare"
                  value={form.baseFare}
                  onChange={handleChange}
                  placeholder="2800"
                  min="500"
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    background: '#0a0f1f',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                  Taxes (₹)
                </label>
                <input
                  type="number"
                  name="taxes"
                  value={form.taxes}
                  onChange={handleChange}
                  placeholder="350"
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    background: '#0a0f1f',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                  Biz Multiplier
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="businessMultiplier"
                  value={form.businessMultiplier}
                  onChange={handleChange}
                  placeholder="1.5"
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    background: '#0a0f1f',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                  }}
                />
              </div>
            </div>

            {/* Cabin Layout Matrix */}
            <div
              style={{
                background: '#0a0f1f',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid #1e293b',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                  Cabin Seating Matrix
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#D4AF37' }}>
                  Total Capacity: {totalSeats} Seats
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>
                    Business Rows × Cols
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      name="businessRows"
                      value={form.businessRows}
                      onChange={handleChange}
                      min="0"
                      max="10"
                      style={{
                        width: '60px',
                        padding: '0.4rem',
                        background: '#131b2e',
                        border: '1px solid #334155',
                        color: '#f8fafc',
                        borderRadius: '4px',
                        textAlign: 'center',
                      }}
                    />
                    <span style={{ color: '#64748b' }}>×</span>
                    <input
                      type="number"
                      name="businessCols"
                      value={form.businessCols}
                      onChange={handleChange}
                      min="0"
                      max="4"
                      style={{
                        width: '60px',
                        padding: '0.4rem',
                        background: '#131b2e',
                        border: '1px solid #334155',
                        color: '#f8fafc',
                        borderRadius: '4px',
                        textAlign: 'center',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>
                    Economy Rows × Cols
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      name="economyRows"
                      value={form.economyRows}
                      onChange={handleChange}
                      min="1"
                      max="40"
                      style={{
                        width: '60px',
                        padding: '0.4rem',
                        background: '#131b2e',
                        border: '1px solid #334155',
                        color: '#f8fafc',
                        borderRadius: '4px',
                        textAlign: 'center',
                      }}
                    />
                    <span style={{ color: '#64748b' }}>×</span>
                    <input
                      type="number"
                      name="economyCols"
                      value={form.economyCols}
                      onChange={handleChange}
                      min="2"
                      max="6"
                      style={{
                        width: '60px',
                        padding: '0.4rem',
                        background: '#131b2e',
                        border: '1px solid #334155',
                        color: '#f8fafc',
                        borderRadius: '4px',
                        textAlign: 'center',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '0.5rem',
                padding: '0.85rem',
                background: 'linear-gradient(135deg, #D4AF37 0%, #b89628 100%)',
                color: '#0a0f1f',
                fontWeight: 700,
                fontSize: '1rem',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Publishing Flight...' : 'Create & Publish Flight'}
            </button>
          </form>
        </div>

        {/* Existing Flights Table */}
        <div
          style={{
            background: '#131b2e',
            borderRadius: '12px',
            border: '1px solid #1e293b',
            padding: '1.75rem',
            boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
            maxHeight: '680px',
            overflowY: 'auto',
          }}
        >
          <h2 style={{ fontSize: '1.2rem', color: '#f8fafc', margin: '0 0 1rem 0', fontWeight: 700 }}>
            Scheduled Flights ({existingFlights.length})
          </h2>

          {existingFlights.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No flights currently in catalog.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {existingFlights.map((f) => (
                <div
                  key={f.id || f._id}
                  style={{
                    background: '#0a0f1f',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>
                      {f.flightNumber} • {f.sourceAirport} ➔ {f.destinationAirport}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Fare: <strong style={{ color: '#D4AF37' }}>₹{f.baseFare}</strong> | Dept:{' '}
                      {new Date(f.departureTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(f.id || f._id, f.flightNumber)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      borderRadius: '4px',
                      padding: '0.35rem 0.65rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AddFlight;
