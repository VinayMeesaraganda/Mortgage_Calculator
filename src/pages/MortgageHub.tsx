import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Calculator, ArrowRightLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AppNav from '../layouts/AppNav';
import MortgageCalculator from '../MortgageCalculator';
import LoginModal from '../components/LoginModal';

export type MortgageView = 'calculator' | 'compare' | 'refinance';

const TABS: { id: MortgageView; label: string; icon: React.ReactNode }[] = [
  { id: 'calculator', label: 'Calculator',    icon: <Calculator className="w-3.5 h-3.5" /> },
  { id: 'compare',    label: 'Compare Loans', icon: <ArrowRightLeft className="w-3.5 h-3.5" /> },
  { id: 'refinance',  label: 'Refinance',     icon: <RefreshCw className="w-3.5 h-3.5" /> },
];

const MortgageHub: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeView, setActiveView] = useState<MortgageView>('calculator');
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <div className="min-h-screen bg-brand-surface">
      <AppNav />
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

      {/* ── Compact page header ────────────────────────────────────────────── */}
      <div className="border-b border-brand-border bg-white/90 backdrop-blur-md sticky top-[57px] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            {/* Title + tabs */}
            <div className="flex items-center gap-5">
              <span className="text-sm font-display font-bold text-slate-900 hidden sm:block">
                Mortgage Hub
              </span>
              <div className="flex items-center gap-0.5">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveView(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeView === tab.id
                        ? 'bg-brand-primary text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {currentUser ? (
                <Link
                  to="/dashboard"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                </Link>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                  Sign in
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <MortgageCalculator
          activeView={activeView}
          onViewChange={setActiveView}
        />
      </div>
    </div>
  );
};

export default MortgageHub;
