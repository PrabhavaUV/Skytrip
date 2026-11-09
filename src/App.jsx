import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import WalletModal from './components/WalletModal';

// Member 1 Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Member 2 Pages & Components
import Home from './pages/Home';
import SearchFlights from './pages/SearchFlights';
import Footer from './components/Footer';
import AdminLogin from './pages/admin/AdminLogin';
import AddFlight from './pages/admin/AddFlight';

// ── Routes are added here by each member in order ────────────────────────────
//
// Member 1 adds:  /login, /register (✅ ADDED)
// Member 2 adds:  / (Home), /flights (Search), /admin/login, /admin/add-flight (✅ ADDED)
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
              {/* Member 2 Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/flights" element={<SearchFlights />} />
              <Route path="/admin" element={<AddFlight />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/add-flight" element={<AddFlight />} />

              {/* Member 1 Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
