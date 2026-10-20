import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import WalletModal from './components/WalletModal';

// Member 1 Pages
import Login from './pages/Login';
import Register from './pages/Register';

// ── Routes are added here by each member in order ────────────────────────────
//
// Member 1 adds:  /login, /register (✅ ADDED)
// Member 2 adds:  / (Home), /flights (Search), /admin/login, /admin/add-flight
// Member 3 adds:  /flights/:id (FlightDetails + SeatMap)
// Member 4 adds:  /booking-summary, /confirmation/:bookingId, /my-bookings
//
// Do NOT delete existing routes when adding your own.
// ─────────────────────────────────────────────────────────────────────────────

function App() {
  return (
    <AuthProvider>
      <Router>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navbar />
          <WalletModal />
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Routes>
              {/* Foundation placeholder — Member 2 will replace this with Home.jsx */}
              <Route
                path="/"
                element={
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '3rem 1.5rem',
                      textAlign: 'center',
                      gap: '1rem'
                    }}
                  >
                    <h1 style={{ color: '#D4AF37', fontSize: '2.5rem' }}>✈️ Skytrip</h1>
                    <p style={{ color: '#a0aec0', maxWidth: '500px' }}>
                      Auth & Digital Wallet ready! Sign up or log in to inspect your ₹5,000 wallet. Member 2 flight catalog builds next.
                    </p>
                  </div>
                }
              />

              {/* Member 1 Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
