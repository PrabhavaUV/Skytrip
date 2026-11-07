import React from 'react';

function Footer() {
  return (
    <footer
      style={{
        marginTop: 'auto',
        background: '#070b16',
        borderTop: '1px solid #1e293b',
        padding: '2rem 1.5rem',
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: '0.875rem',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>✈️</span>
          <span style={{ fontWeight: 700, color: '#D4AF37', letterSpacing: '0.05em' }}>SKYTRIP</span>
          <span style={{ color: '#475569' }}>|</span>
          <span>Next-Gen Airline Reservation Platform</span>
        </div>
        <p style={{ margin: 0, color: '#64748b' }}>
          Built for RVCE MCA Semester III (MCA261IA) Experiential Learning.
        </p>
        <p style={{ margin: 0, color: '#475569', fontSize: '0.75rem' }}>
          &copy; {new Date().getFullYear()} Skytrip Team. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
