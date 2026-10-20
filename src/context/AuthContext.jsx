import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('skytrip_token') || null);
  const [loading, setLoading] = useState(true);
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  // On mount: if a token exists in localStorage, validate it with /api/auth/me
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const storedToken = localStorage.getItem('skytrip_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${storedToken}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setToken(storedToken);
        } else {
          // Token expired or invalid
          localStorage.removeItem('skytrip_token');
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        console.error('Failed to restore authentication session:', err);
        localStorage.removeItem('skytrip_token');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const login = (userData, jwtToken) => {
    localStorage.setItem('skytrip_token', jwtToken);
    setToken(jwtToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('skytrip_token');
    setToken(null);
    setUser(null);
  };

  const updateWalletBalance = (newBalance) => {
    if (user) {
      setUser((prev) => ({
        ...prev,
        walletBalance: newBalance
      }));
    }
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  };

  const openWalletModal = () => setIsWalletOpen(true);
  const closeWalletModal = () => setIsWalletOpen(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateWalletBalance,
        refreshProfile,
        isWalletOpen,
        openWalletModal,
        closeWalletModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
