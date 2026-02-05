import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './src/contexts/AuthContext';
import { ToastProvider } from './src/components/Toast';
import ErrorBoundary from './src/components/ErrorBoundary';
import Home from './src/pages/Home';
import LandingPage from './src/pages/LandingPage';
import MortgageHub from './src/pages/MortgageHub';
import StockInvestments from './src/pages/StockInvestments';
import MutualFunds from './src/pages/MutualFunds';
import Insurance from './src/pages/Insurance';
import FixedDeposits from './src/pages/FixedDeposits';
import AffordabilityCalculator from './src/pages/AffordabilityCalculator';
import RentVsBuyCalculator from './src/pages/RentVsBuyCalculator';
import PrivacyPolicyPage from './src/pages/PrivacyPolicy';
import TermsOfService from './src/pages/TermsOfService';
import ProtectedRoute from './src/components/ProtectedRoute';
import Login from './src/pages/Login';
import Profile from './src/pages/Profile';
import Signout from './src/pages/Signout';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/home" element={<Home />} />
              <Route path="/mortgage" element={<MortgageHub />} />
              <Route path="/mortgage-calculator" element={<Navigate to="/mortgage" replace />} />
              <Route path="/mutual-funds" element={<MutualFunds />} />
              <Route path="/fixed-deposits" element={<FixedDeposits />} />
              <Route path="/insurance" element={<Insurance />} />
              <Route path="/affordability-calculator" element={<AffordabilityCalculator />} />
              <Route path="/rent-vs-buy-calculator" element={<RentVsBuyCalculator />} />
              <Route path="/login" element={<Login />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />

              {/* Protected Routes - Login Required */}
              <Route path="/stock-investments" element={
                <ProtectedRoute>
                  <StockInvestments />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/signout" element={
                <ProtectedRoute>
                  <Signout />
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
