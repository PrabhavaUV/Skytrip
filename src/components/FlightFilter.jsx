import React from 'react';

function FlightFilter({ filters, onFilterChange }) {
  const handleSortChange = (e) => {
    onFilterChange({ ...filters, sort: e.target.value });
  };

  const handleTimeBandChange = (band) => {
    onFilterChange({
      ...filters,
      timeBand: filters.timeBand === band ? '' : band,
    });
  };

  const handleReset = () => {
    onFilterChange({
      sort: 'price_asc',
      timeBand: '',
    });
  };

  return (
    <div
      style={{
        background: '#131b2e',
        borderRadius: '12px',
        border: '1px solid #1e293b',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', fontWeight: 600 }}>
          Filters & Sorting
        </h3>
        <button
          onClick={handleReset}
          style={{
            background: 'none',
            border: 'none',
            color: '#D4AF37',
            fontSize: '0.8rem',
            cursor: 'pointer',
            padding: 0,
            textDecoration: 'underline',
          }}
        >
          Reset All
        </button>
      </div>

      {/* Sort By Dropdown */}
      <div>
        <label
          htmlFor="sort-select"
          style={{
            display: 'block',
            fontSize: '0.85rem',
            color: '#94a3b8',
            marginBottom: '0.5rem',
            fontWeight: 500,
          }}
        >
          Sort Flights By
        </label>
        <select
          id="sort-select"
          value={filters.sort || 'price_asc'}
          onChange={handleSortChange}
          style={{
            width: '100%',
            background: '#0a0f1f',
            border: '1px solid #334155',
            color: '#f8fafc',
            borderRadius: '6px',
            padding: '0.6rem 0.75rem',
            fontSize: '0.9rem',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="price_asc">Price: Low to High (Cheapest)</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="departure_asc">Departure: Earliest First</option>
          <option value="duration_asc">Duration: Shortest First</option>
        </select>
      </div>

      {/* Departure Time Bands */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: '0.85rem',
            color: '#94a3b8',
            marginBottom: '0.5rem',
            fontWeight: 500,
          }}
        >
          Departure Time
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          {[
            { id: 'morning', label: '🌅 Morning', time: '6 AM - 12 PM' },
            { id: 'afternoon', label: '☀️ Afternoon', time: '12 PM - 5 PM' },
            { id: 'evening', label: '🌆 Evening', time: '5 PM - 9 PM' },
            { id: 'night', label: '🌙 Night', time: 'After 9 PM' },
          ].map((item) => {
            const isSelected = filters.timeBand === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTimeBandChange(item.id)}
                style={{
                  background: isSelected ? 'rgba(212, 175, 55, 0.15)' : '#0a0f1f',
                  border: isSelected ? '1px solid #D4AF37' : '1px solid #334155',
                  color: isSelected ? '#D4AF37' : '#94a3b8',
                  borderRadius: '6px',
                  padding: '0.6rem 0.5rem',
                  fontSize: '0.75rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontWeight: 600, color: isSelected ? '#f8fafc' : '#cbd5e1' }}>
                  {item.label}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{item.time}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default FlightFilter;

