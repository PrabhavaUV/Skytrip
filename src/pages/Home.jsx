import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const POPULAR_ROUTES = [
  { from: 'BLR', fromCity: 'Bengaluru', to: 'DEL', toCity: 'New Delhi', fare: '₹4,500' },
  { from: 'BOM', fromCity: 'Mumbai', to: 'GOI', toCity: 'Goa', fare: '₹2,900' },
  { from: 'DEL', fromCity: 'New Delhi', to: 'BOM', toCity: 'Mumbai', fare: '₹4,200' },
  { from: 'BLR', fromCity: 'Bengaluru', to: 'BOM', toCity: 'Mumbai', fare: '₹3,600' },
  { from: 'HYD', fromCity: 'Hyderabad', to: 'DEL', toCity: 'New Delhi', fare: '₹3,900' },
  { from: 'MAA', fromCity: 'Chennai', to: 'DEL', toCity: 'New Delhi', fare: '₹4,800' },
];

function Home() {
  const navigate = useNavigate();

  // Tomorrow's date formatted as YYYY-MM-DD
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  const [from, setFrom] = useState('BLR');
  const [to, setTo] = useState('DEL');
  const [date, setDate] = useState(defaultDate);

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!from || !to) return;
    navigate(`/flights?from=${from.toUpperCase()}&to=${to.toUpperCase()}&date=${date}`);
  };

  const handleQuickSelect = (route) => {
    navigate(`/flights?from=${route.from}&to=${route.to}&date=${date}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* Hero Section */}
      <section
        style={{
          background: 'radial-gradient(ellipse at top, #1e293b 0%, #0a0f1f 70%)',
          padding: '4rem 1.5rem 5rem 1.5rem',
          textAlign: 'center',
          borderBottom: '1px solid #1e293b',
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(212, 175, 55, 0.12)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              color: '#D4AF37',
              padding: '0.35rem 1rem',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '1.25rem',
            }}
          >
            <span>✈️</span> Premium Domestic Airline Experience
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
              fontWeight: 800,
              color: '#f8fafc',
              lineHeight: 1.15,
              marginBottom: '1rem',
              letterSpacing: '-0.02em',
            }}
          >
            Elevate Your Journey with <span style={{ color: '#D4AF37' }}>Skytrip</span>
          </h1>

          <p
            style={{
              fontSize: '1.1rem',
              color: '#94a3b8',
              maxWidth: '650px',
              margin: '0 auto 2.5rem auto',
              lineHeight: 1.6,
            }}
          >
            Real-time flight search, interactive 2D cabin seat selection, secure wallet checkout, and instant automated refunds.
          </p>

          {/* Search Box Card */}
          <div
            style={{
              background: '#131b2e',
              border: '1px solid #1e293b',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
              textAlign: 'left',
            }}
          >
            <form
              onSubmit={handleSearch}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr)) auto',
                gap: '1rem',
                alignItems: 'flex-end',
              }}
            >
              {/* Origin */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    color: '#94a3b8',
                    marginBottom: '0.4rem',
                    fontWeight: 600,
                  }}
                >
                  FROM (CITY / AIRPORT)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={from}
                    onChange={(e) => setFrom(e.target.value.toUpperCase())}
                    placeholder="e.g. BLR"
                    maxLength={3}
                    required
                    style={{
                      width: '100%',
                      background: '#0a0f1f',
                      border: '1px solid #334155',
                      color: '#f8fafc',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Swap Button */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={handleSwap}
                  title="Swap Origin and Destination"
                  style={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    color: '#D4AF37',
                    borderRadius: '50%',
                    width: '42px',
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    transition: 'transform 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'rotate(180deg)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'rotate(0deg)')}
                >
                  ⇄
                </button>
              </div>

              {/* Destination */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    color: '#94a3b8',
                    marginBottom: '0.4rem',
                    fontWeight: 600,
                  }}
                >
                  TO (CITY / AIRPORT)
                </label>
                <input
                  type="text"
                  value={to}
                  onChange={(e) => setTo(e.target.value.toUpperCase())}
                  placeholder="e.g. DEL"
                  maxLength={3}
                  required
                  style={{
                    width: '100%',
                    background: '#0a0f1f',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Departure Date */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    color: '#94a3b8',
                    marginBottom: '0.4rem',
                    fontWeight: 600,
                  }}
                >
                  DEPARTURE DATE
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    background: '#0a0f1f',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    fontSize: '0.95rem',
                    outline: 'none',
                    colorScheme: 'dark',
                  }}
                />
              </div>

              {/* Submit CTA */}
              <div>
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #D4AF37 0%, #b89628 100%)',
                    color: '#0a0f1f',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.85rem 1.75rem',
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(212, 175, 55, 0.4)',
                    minHeight: '48px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Search Flights →
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Popular Routes Section */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '4rem 1.5rem', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.8rem', color: '#f8fafc', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
            Popular Domestic Routes
          </h2>
          <p style={{ color: '#94a3b8', margin: 0 }}>
            Handpicked best-value flights across key metropolitan cities
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr)) ',
            gap: '1.25rem',
          }}
        >
          {POPULAR_ROUTES.map((route, idx) => (
            <div
              key={idx}
              onClick={() => handleQuickSelect(route)}
              style={{
                background: '#131b2e',
                border: '1px solid #1e293b',
                borderRadius: '12px',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
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
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '1.1rem' }}>{route.from}</span>
                  <span style={{ color: '#D4AF37' }}>➔</span>
                  <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '1.1rem' }}>{route.to}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  {route.fromCity} to {route.toCity}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>From</span>
                <span style={{ fontWeight: 700, color: '#D4AF37', fontSize: '1.1rem' }}>{route.fare}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
