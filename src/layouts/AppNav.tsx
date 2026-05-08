import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import CurrencySelector from '../components/CurrencySelector';
import type { Currency } from '../types/mortgage';

interface AppNavProps {
  selectedCurrency?: Currency;
  onCurrencyChange?: (currency: Currency) => void;
}

const AppNav: React.FC<AppNavProps> = ({ selectedCurrency, onCurrencyChange }) => {
  const { currentUser, userProfile } = useAuth();

  const navItems = [
    { label: 'Mortgage', path: '/mortgage' },
    { label: 'Stocks', path: '/stock-investments' },
    { label: 'Mutual Funds', path: '/mutual-funds' },
    { label: 'Insurance', path: '/insurance' },
    { label: 'Fixed Deposits', path: '/fixed-deposits' },
    { label: 'Rent vs Buy', path: '/rent-vs-buy-calculator' },
    { label: 'Affordability', path: '/affordability-calculator' }
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-brand-border bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <Link to={currentUser ? '/dashboard' : '/'} className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand-primary text-white flex items-center justify-center font-bold">
              PF
            </div>
            <span className="text-lg font-semibold text-slate-900">Personal Finance</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-4">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `text-sm font-semibold transition-colors ${
                    isActive ? 'text-brand-primary' : 'text-slate-600 hover:text-slate-900'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {selectedCurrency && onCurrencyChange && (
              <CurrencySelector selectedCurrency={selectedCurrency} onCurrencyChange={onCurrencyChange} />
            )}
            {currentUser ? (
              <>
                <NavLink
                  to="/profile"
                  className="hidden sm:flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
                >
                  <User className="w-4 h-4" />
                  <span className="font-semibold">{userProfile?.username || currentUser.displayName || 'User'}</span>
                </NavLink>
                <NavLink
                  to="/signout"
                  className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm font-semibold flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign out</span>
                </NavLink>
              </>
            ) : (
              <NavLink
                to="/login"
                className="px-3 py-2 rounded-lg bg-brand-primary text-white text-sm font-semibold flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Login
              </NavLink>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppNav;
