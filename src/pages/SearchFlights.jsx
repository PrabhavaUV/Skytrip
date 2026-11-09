import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import FlightCard from '../components/FlightCard';
import FlightFilter from '../components/FlightFilter';

function SearchFlights() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const fromParam = searchParams.get('from') || '';
  const toParam = searchParams.get('to') || '';
  const dateParam = searchParams.get('date') || '';
  const sortParam = searchParams.get('sort') || 'price_asc';
  const timeBandParam = searchParams.get('timeBand') || '';

  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Editable top bar state
  const [fromInput, setFromInput] = useState(fromParam);
  const [toInput, setToInput] = useState(toParam);
  const [dateInput, setDateInput] = useState(dateParam);

  const [filters, setFilters] = useState({
    sort: sortParam,
    timeBand: timeBandParam,
  });

  // Sync inputs with URL
  useEffect(() => {
    setFromInput(fromParam);
    setToInput(toParam);
    setDateInput(dateParam);
    setFilters({ sort: sortParam, timeBand: timeBandParam });
  }, [fromParam, toParam, dateParam, sortParam, timeBandParam]);

  // Fetch flights whenever searchParams change
  useEffect(() => {
    const fetchFlights = async () => {
      setLoading(true);
      setError(null);

      try {
        const query = new URLSearchParams();
        if (fromParam) query.set('from', fromParam);
        if (toParam) query.set('to', toParam);
        if (dateParam) query.set('date', dateParam);
        if (filters.sort) query.set('sort', filters.sort);
        if (filters.timeBand) query.set('timeBand', filters.timeBand);

        const res = await fetch(`/api/flights?${query.toString()}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to fetch flights');
        }

        setFlights(data.flights || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, [fromParam, toParam, dateParam, filters.sort, filters.timeBand]);

  // Handle filter changes and update URL params
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    const newParams = new URLSearchParams(searchParams);
    if (newFilters.sort) newParams.set('sort', newFilters.sort);
    else newParams.delete('sort');

    if (newFilters.timeBand) newParams.set('timeBand', newFilters.timeBand);
    else newParams.delete('timeBand');

    setSearchParams(newParams);
  };

  // Modify Search Form Submit
  const handleModifySearch = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams();
    if (fromInput) newParams.set('from', fromInput.trim().toUpperCase());
    if (toInput) newParams.set('to', toInput.trim().toUpperCase());
    if (dateInput) newParams.set('date', dateInput);
    if (filters.sort) newParams.set('sort', filters.sort);
    if (filters.timeBand) newParams.set('timeBand', filters.timeBand);
    setSearchParams(newParams);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem', width: '100%' }}>
      {/* Search Header Bar */}
      <div
        style={{
          background: '#131b2e',
          borderRadius: '12px',
          border: '1px solid #1e293b',
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
        }}
      >
        <form
          onSubmit={handleModifySearch}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '1rem',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>From</span>
              <input
                type="text"
                value={fromInput}
                onChange={(e) => setFromInput(e.target.value.toUpperCase())}
                placeholder="BLR"
                maxLength={3}
                style={{
                  background: '#0a0f1f',
                  border: '1px solid #334155',
                  color: '#f8fafc',
                  borderRadius: '6px',
                  padding: '0.4rem 0.6rem',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  width: '75px',
                  textAlign: 'center',
                }}
              />
            </div>

            <span style={{ color: '#D4AF37', fontWeight: 700 }}>➔</span>

            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>To</span>
              <input
                type="text"
                value={toInput}
                onChange={(e) => setToInput(e.target.value.toUpperCase())}
                placeholder="DEL"
                maxLength={3}
                style={{
                  background: '#0a0f1f',
                  border: '1px solid #334155',
                  color: '#f8fafc',
                  borderRadius: '6px',
                  padding: '0.4rem 0.6rem',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  width: '75px',
                  textAlign: 'center',
                }}
              />
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Departure</span>
              <input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                style={{
                  background: '#0a0f1f',
                  border: '1px solid #334155',
                  color: '#f8fafc',
                  borderRadius: '6px',
                  padding: '0.4rem 0.6rem',
                  fontSize: '0.9rem',
                  colorScheme: 'dark',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            style={{
              background: '#1e293b',
              color: '#D4AF37',
              border: '1px solid #D4AF37',
              borderRadius: '6px',
              padding: '0.5rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#D4AF37';
              e.currentTarget.style.color = '#0a0f1f';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1e293b';
              e.currentTarget.style.color = '#D4AF37';
            }}
          >
            Update Search
          </button>
        </form>
      </div>

      {/* Main Results Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
          gap: '2rem',
          alignItems: 'start',
        }}
      >
        {/* Left Filter Sidebar */}
        <aside>
          <FlightFilter filters={filters} onFilterChange={handleFilterChange} />
        </aside>

        {/* Right Flight Cards Stream */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header Summary */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.3rem', color: '#f8fafc', margin: 0, fontWeight: 700 }}>
              {fromParam && toParam
                ? `${fromParam} to ${toParam} Flights`
                : 'Available Flights'}
            </h2>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              {loading ? 'Searching...' : `${flights.length} flights available`}
            </span>
          </div>

          {/* Loading State */}
          {loading && (
            <div
              style={{
                background: '#131b2e',
                borderRadius: '12px',
                padding: '3rem',
                textAlign: 'center',
                color: '#D4AF37',
                border: '1px solid #1e293b',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✈️</div>
              <p style={{ margin: 0, fontWeight: 600 }}>Locating flights across routes...</p>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #ef4444',
                color: '#ef4444',
                borderRadius: '12px',
                padding: '1.5rem',
                textAlign: 'center',
              }}
            >
              <p style={{ margin: 0 }}>Error fetching flights: {error}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && flights.length === 0 && (
            <div
              style={{
                background: '#131b2e',
                borderRadius: '12px',
                border: '1px solid #1e293b',
                padding: '4rem 2rem',
                textAlign: 'center',
                color: '#94a3b8',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🛫</div>
              <h3 style={{ color: '#f8fafc', margin: '0 0 0.5rem 0' }}>No flights found</h3>
              <p style={{ maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
                We couldn't find any flights matching your search criteria. Try modifying your route or date filters.
              </p>
              <button
                onClick={() => navigate('/flights')}
                style={{
                  background: '#D4AF37',
                  color: '#0a0f1f',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.6rem 1.2rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                View All Flights
              </button>
            </div>
          )}

          {/* Flight Results */}
          {!loading &&
            !error &&
            flights.length > 0 &&
            flights.map((flight) => (
              <FlightCard key={flight.id || flight._id} flight={flight} />
            ))}
        </main>
      </div>
    </div>
  );
}

export default SearchFlights;

