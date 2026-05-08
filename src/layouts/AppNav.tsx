import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { LogIn, LogOut, User, ChevronDown, Building2, BarChart2, Calculator, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import CurrencySelector from '../components/CurrencySelector';
import type { Currency } from '../types/mortgage';

interface AppNavProps {
  selectedCurrency?: Currency;
  onCurrencyChange?: (currency: Currency) => void;
}

const NAV_GROUPS = [
  {
    label: 'Property',
    icon: Building2,
    color: 'text-blue-600',
    items: [
      { label: 'Mortgage', path: '/mortgage', desc: 'Calculator & tracker' },
      { label: 'Insurance', path: '/insurance', desc: 'Policies & renewals' },
    ],
  },
  {
    label: 'Investments',
    icon: BarChart2,
    color: 'text-emerald-600',
    items: [
      { label: 'Stocks', path: '/stock-investments', desc: 'Equity portfolio' },
      { label: 'Mutual Funds', path: '/mutual-funds', desc: 'SIP & lump sum' },
      { label: 'Fixed Deposits', path: '/fixed-deposits', desc: 'FD tracker' },
    ],
  },
  {
    label: 'Tools',
    icon: Calculator,
    color: 'text-violet-600',
    items: [
      { label: 'Rent vs Buy', path: '/rent-vs-buy-calculator', desc: 'Long-term comparison' },
      { label: 'Affordability', path: '/affordability-calculator', desc: 'How much can you afford?' },
    ],
  },
];

// Dropdown for one nav group
const NavGroup: React.FC<{ group: typeof NAV_GROUPS[0]; activeGroup: boolean }> = ({ group, activeGroup }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const Icon = group.icon;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
          activeGroup || open
            ? 'bg-slate-100 text-slate-900'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        }`}
      >
        <Icon className={`w-4 h-4 ${group.color}`} />
        {group.label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50">
          {group.items.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex flex-col px-4 py-2.5 hover:bg-slate-50 transition-colors ${isActive ? 'bg-blue-50' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`text-sm font-semibold ${isActive ? 'text-brand-primary' : 'text-slate-800'}`}>
                    {item.label}
                  </span>
                  <span className="text-xs text-slate-400 mt-0.5">{item.desc}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

const AppNav: React.FC<AppNavProps> = ({ selectedCurrency, onCurrencyChange }) => {
  const { currentUser, userProfile } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeGroupFor = (group: typeof NAV_GROUPS[0]) =>
    group.items.some(item => location.pathname === item.path);

  return (
    <header className="sticky top-0 z-50 border-b border-brand-border bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to={currentUser ? '/dashboard' : '/'} className="flex items-center gap-2.5 flex-shrink-0">
            <div className="h-8 w-8 rounded-lg bg-brand-primary text-white flex items-center justify-center font-bold text-sm">
              PF
            </div>
            <span className="text-base font-bold text-slate-900 hidden sm:block">Personal Finance</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_GROUPS.map(group => (
              <NavGroup key={group.label} group={group} activeGroup={activeGroupFor(group)} />
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {selectedCurrency && onCurrencyChange && (
              <CurrencySelector selectedCurrency={selectedCurrency} onCurrencyChange={onCurrencyChange} />
            )}
            {currentUser ? (
              <div className="hidden sm:flex items-center gap-2">
                <NavLink
                  to="/profile"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-semibold transition-colors"
                >
                  <User className="w-4 h-4" />
                  {userProfile?.username || currentUser.displayName || 'Profile'}
                </NavLink>
                <NavLink
                  to="/signout"
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </NavLink>
              </div>
            ) : (
              <NavLink
                to="/login"
                className="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-sm font-semibold flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                Login
              </NavLink>
            )}

            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              onClick={() => setMobileOpen(o => !o)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-4">
          {NAV_GROUPS.map(group => {
            const Icon = group.icon;
            return (
              <div key={group.label}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${group.color}`} />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{group.label}</span>
                </div>
                <div className="space-y-1 pl-6">
                  {group.items.map(item => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `block py-1.5 text-sm font-semibold ${isActive ? 'text-brand-primary' : 'text-slate-700'}`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
          {currentUser && (
            <div className="pt-2 border-t border-slate-100 flex gap-3">
              <NavLink to="/profile" onClick={() => setMobileOpen(false)} className="text-sm font-semibold text-slate-600">Profile</NavLink>
              <NavLink to="/signout" onClick={() => setMobileOpen(false)} className="text-sm font-semibold text-red-500">Sign out</NavLink>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default AppNav;
