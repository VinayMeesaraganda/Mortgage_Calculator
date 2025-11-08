import React from 'react';
import ReactDOM from 'react-dom/client';
// Import the new modular version
import MortgageCalculator from './src/MortgageCalculator';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MortgageCalculator />
  </React.StrictMode>
);

