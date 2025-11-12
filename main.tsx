import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './src/contexts/AuthContext';
import { ToastProvider } from './src/components/Toast';
import ErrorBoundary from './src/components/ErrorBoundary';
import ProtectedRoute from './src/components/ProtectedRoute';
import Login from './src/pages/Login';
import Home from './src/pages/Home';
import MortgageCalculator from './src/MortgageCalculator';
import StockInvestments from './src/pages/StockInvestments';
import MutualFunds from './src/pages/MutualFunds';
import Insurance from './src/pages/Insurance';
import FixedDeposits from './src/pages/FixedDeposits';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              } />
              <Route path="/mortgage-calculator" element={
                <ProtectedRoute>
                  <MortgageCalculator />
                </ProtectedRoute>
              } />
              <Route path="/stock-investments" element={
                <ProtectedRoute>
                  <StockInvestments />
                </ProtectedRoute>
              } />
              <Route path="/mutual-funds" element={
                <ProtectedRoute>
                  <MutualFunds />
                </ProtectedRoute>
              } />
              <Route path="/insurance" element={
                <ProtectedRoute>
                  <Insurance />
                </ProtectedRoute>
              } />
              <Route path="/fixed-deposits" element={
                <ProtectedRoute>
                  <FixedDeposits />
                </ProtectedRoute>
              } />
              
              {/* Redirect unknown routes to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

