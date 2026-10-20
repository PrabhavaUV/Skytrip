import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global styles — dark luxury theme defined here (plan.md → Section 3)
import './styles/styles.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
