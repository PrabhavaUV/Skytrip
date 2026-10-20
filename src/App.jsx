import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// ── Routes are added here by each member in order ────────────────────────────
//
// Member 1 adds:  /login, /register
// Member 2 adds:  / (Home), /flights (Search), /admin/login, /admin/add-flight
// Member 3 adds:  /flights/:id (FlightDetails + SeatMap)
// Member 4 adds:  /booking-summary, /confirmation/:bookingId, /my-bookings
//
// Do NOT delete existing routes when adding your own.
// ─────────────────────────────────────────────────────────────────────────────

function App() {
  return (
    <Router>
      <Routes>
        {/* Foundation placeholder — Member 2 will replace this with Home.jsx */}
        <Route
          path="/"
          element={
            <div style={{
              background: '#0a0f1f',
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Inter, sans-serif',
              gap: '1rem'
            }}>
              <h1 style={{ color: '#D4AF37', fontSize: '2.5rem' }}>✈️ Skytrip</h1>
              <p style={{ color: '#a0aec0' }}>Foundation ready. Members build from here.</p>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
