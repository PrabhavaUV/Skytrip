import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — Foundation component.
 * Wraps any route that requires the user to be logged in.
 * Redirects unauthenticated users to /login.
 *
 * Requires: Member 1's AuthContext to export useAuth() with a `user` property
 *   - user = null        → not logged in → redirect to /login
 *   - user = { ... }    → logged in      → render the page
 *
 * Usage in App.jsx (Members 2, 3, 4 use this for their protected pages):
 *   import ProtectedRoute from './components/ProtectedRoute';
 *   <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
 */
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
