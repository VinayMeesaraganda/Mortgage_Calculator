import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Calculator, ArrowRightLeft,
  TrendingDown, Wallet, AlertCircle, Home as HomeIcon,
  BarChart3, Scale
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSavedMortgages } from '../hooks/useSavedMortgages';
import { computeMortgageMetrics } from '../utils/mortgageMetrics';
import { formatCurrency } from '../utils/formatting';
import { saveMortgages } from '../services/mortgageService';
import { loadInsurances, saveInsurances } from '../services/insuranceService';
import AppNav from '../layouts/AppNav';
import MortgageCard from '../components/Dashboard/MortgageCard';
import ConvertToInvestmentModal, { type RentalSetup } from '../components/Dashboard/ConvertToInvestmentModal';
import PropertyReminders from '../components/Dashboard/PropertyReminders';
import LoginModal from '../components/LoginModal';
import type { SavedMortgage } from '../types/mortgage';
import type { Insurance } from '../types/insurance';
import type { Lease } from '../types/lease';

// ─── Portfolio metric tile ────────────────────────────────────────────────────
interface MetricTileProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
  valueColor?: string;
}
const MetricTile: React.FC<MetricTileProps> = ({ label, value, sub, icon, iconBg, valueColor = 'text-slate-900' }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-soft px-5 py-4 flex items-center gap-4 min-w-0">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-widest text-slate-400 leading-none mb-1">{label}</p>
      <p className={`text-xl font-bold font-mono tabular-nums leading-tight truncate ${valueColor}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5 leading-none">{sub}</p>}
    </div>
  </div>
);

// ─── Quick-action card ─────────────────────────────────────────────────────────
interface QuickActionProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  sub: string;
  iconBg: string;
}
const QuickAction: React.FC<QuickActionProps> = ({ to, icon, label, sub, iconBg }) => (
  <Link
    to={to}
    className="flex items-center gap-4 bg-white rounded-xl border border-slate-200 px-4 py-3.5 hover:border-brand-primary/40 hover:shadow-soft transition-all duration-200 group"
  >
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg} group-hover:scale-105 transition-transform`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-semibold text-slate-800 leading-tight">{label}</p>
      <p className="text-xs text-slate-400 leading-tight mt-0.5">{sub}</p>
    </div>
  </Link>
);

// ─── Greeting helper ──────────────────────────────────────────────────────────
function greeting(name: string): string {
  const h = new Date().getHours();
  const salutation = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return `${salutation}, ${name}`;
}

function todayStr(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const { mortgages, isLoading, setMortgages } = useSavedMortgages();
  const [showLogin, setShowLogin] = useState(false);
  const [convertingMortgage, setConvertingMortgage] = useState<SavedMortgage | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [insurances, setInsurances] = useState<Insurance[]>([]);

  // Load insurances once for the reminders banner
  useEffect(() => {
    if (!currentUser) {
      try {
        const raw = localStorage.getItem('insurances_data');
        setInsurances(raw ? JSON.parse(raw) : []);
      } catch { setInsurances([]); }
      return;
    }
    loadInsurances(currentUser.uid).then(setInsurances).catch(() => setInsurances([]));
  }, [currentUser]);

  const displayName = userProfile?.username || currentUser?.displayName || 'there';

  // Compute per-mortgage metrics (memoised to avoid re-running amortization on every render)
  const metricsMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof computeMortgageMetrics>>();
    mortgages.forEach(m => { try { map.set(m.id, computeMortgageMetrics(m)); } catch {} });
    return map;
  }, [mortgages]);

  // Portfolio aggregates
  const portfolio = useMemo(() => {
    let totalDebt = 0, totalMonthly = 0, totalInterestLeft = 0, totalPrincipalPaid = 0;
    metricsMap.forEach(m => {
      totalDebt += m.principalRemaining;
      totalMonthly += m.trueMonthly;
      totalInterestLeft += m.interestRemaining;
      totalPrincipalPaid += m.principalPaid;
    });
    return { totalDebt, totalMonthly, totalInterestLeft, totalPrincipalPaid };
  }, [metricsMap]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this mortgage?')) return;
    const updated = mortgages.filter(m => m.id !== id);
    setMortgages(updated);
    try {
      if (currentUser) {
        await saveMortgages(currentUser.uid, updated);
      } else {
        localStorage.setItem('mortgage_calculator_local_saves', JSON.stringify(updated));
      }
    } catch (err) {
      setMortgages(mortgages); // revert on failure
      setSaveError('Failed to delete. Please try again.');
    }
  };

  const handleAddInsurance = async (ins: Omit<Insurance, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newIns: Insurance = { ...ins, id: `ins-${Date.now()}`, createdAt: now, updatedAt: now } as Insurance;
    const updated = [...insurances, newIns];
    setInsurances(updated);
    try {
      if (currentUser) {
        await saveInsurances(currentUser.uid, updated);
      } else {
        localStorage.setItem('insurances_data', JSON.stringify(updated));
      }
    } catch {
      setInsurances(insurances);
      setSaveError('Failed to save insurance policy.');
    }
  };

  const handleLeasesChange = async (mortgageId: string, leases: Lease[]) => {
    const updated = mortgages.map(m => m.id !== mortgageId ? m : { ...m, leases, updatedAt: new Date().toISOString() });
    setMortgages(updated);
    try {
      if (currentUser) {
        await saveMortgages(currentUser.uid, updated);
      } else {
        localStorage.setItem('mortgage_calculator_local_saves', JSON.stringify(updated));
      }
    } catch {
      setSaveError('Failed to save lease changes.');
    }
  };

  const handleConvertToPrimary = async (mortgage: SavedMortgage) => {
    if (!window.confirm(`Convert "${mortgage.name}" back to a primary residence? Rental income settings will be kept but the property will be treated as primary.`)) return;
    const updated = mortgages.map(m => m.id !== mortgage.id ? m : {
      ...m,
      propertyType: 'primary' as const,
      updatedAt: new Date().toISOString(),
    });
    setMortgages(updated);
    try {
      if (currentUser) {
        await saveMortgages(currentUser.uid, updated);
      } else {
        localStorage.setItem('mortgage_calculator_local_saves', JSON.stringify(updated));
      }
    } catch (err) {
      setMortgages(mortgages);
      setSaveError('Failed to save conversion. Please try again.');
    }
  };

  const handleConvert = async (mortgageId: string, rentalSetup: RentalSetup) => {
    const updated = mortgages.map(m => m.id !== mortgageId ? m : {
      ...m,
      propertyType: 'investment' as const,
      monthlyRent: rentalSetup.monthlyRent,
      vacancyRate: rentalSetup.vacancyRate,
      propertyManagementPercent: rentalSetup.managementFee,
      maintenance: rentalSetup.maintenance,
      utilities: rentalSetup.utilities,
      propertyAppreciationRate: rentalSetup.growthRate,
      updatedAt: new Date().toISOString(),
    });
    setMortgages(updated);
    try {
      if (currentUser) {
        await saveMortgages(currentUser.uid, updated);
      } else {
        localStorage.setItem('mortgage_calculator_local_saves', JSON.stringify(updated));
      }
      setConvertingMortgage(null);
    } catch (err) {
      setMortgages(mortgages); // revert on failure
      setSaveError('Failed to save conversion. Please try again.');
    }
  };

  // ── Skeleton loader ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-surface via-blue-50/20 to-teal-50/10">
        <AppNav />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-64 bg-slate-200 rounded-xl" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-200 rounded-2xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-64 bg-slate-200 rounded-2xl" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-surface via-blue-50/20 to-teal-50/10">
      <AppNav />
      {saveError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center justify-between">
            {saveError}
            <button onClick={() => setSaveError(null)} className="ml-4 text-red-400 hover:text-red-600 font-bold">✕</button>
          </div>
        </div>
      )}
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      <ConvertToInvestmentModal
        isOpen={convertingMortgage !== null}
        mortgage={convertingMortgage}
        onClose={() => setConvertingMortgage(null)}
        onConvert={handleConvert}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Hero header ──────────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-deep via-slate-800 to-slate-900 px-8 py-8 shadow-hover">
          {/* Decorative blobs */}
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-56 h-56 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              {currentUser ? (
                <>
                  <p className="text-slate-400 text-sm font-medium mb-1">{todayStr()}</p>
                  <h1 className="text-2xl md:text-3xl font-display font-bold text-white">
                    {greeting(displayName)} 👋
                  </h1>
                  <p className="text-slate-400 text-sm mt-1">
                    {mortgages.length === 0
                      ? 'No mortgages saved yet. Add one to start tracking.'
                      : `You have ${mortgages.length} mortgage${mortgages.length > 1 ? 's' : ''} being tracked.`}
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl md:text-3xl font-display font-bold text-white">
                    Mortgage Dashboard
                  </h1>
                  <p className="text-slate-400 text-sm mt-1">
                    Sign in to save and track your mortgages across devices.
                  </p>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {!currentUser && (
                <button
                  onClick={() => setShowLogin(true)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold border border-white/20 transition-colors"
                >
                  Sign in
                </button>
              )}
              <Link
                to="/mortgage"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-blue-700 text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-4 h-4" /> New Mortgage
              </Link>
            </div>
          </div>
        </div>

        {/* ── Reminders ────────────────────────────────────────────────────────── */}
        {mortgages.length > 0 && (
          <PropertyReminders mortgages={mortgages} insurances={insurances} />
        )}

        {/* ── Portfolio summary ─────────────────────────────────────────────────── */}
        {mortgages.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricTile
              label="Total Debt"
              value={formatCurrency(portfolio.totalDebt)}
              sub={`across ${mortgages.length} mortgage${mortgages.length > 1 ? 's' : ''}`}
              icon={<Wallet className="w-5 h-5 text-blue-600" />}
              iconBg="bg-blue-50"
              valueColor="text-slate-900"
            />
            <MetricTile
              label="Monthly Outflow"
              value={formatCurrency(portfolio.totalMonthly)}
              sub="true cost incl. costs"
              icon={<BarChart3 className="w-5 h-5 text-indigo-600" />}
              iconBg="bg-indigo-50"
            />
            <MetricTile
              label="Principal Paid"
              value={formatCurrency(portfolio.totalPrincipalPaid)}
              sub="total equity built"
              icon={<TrendingDown className="w-5 h-5 text-emerald-600" />}
              iconBg="bg-emerald-50"
              valueColor="text-emerald-700"
            />
            <MetricTile
              label="Interest Remaining"
              value={formatCurrency(portfolio.totalInterestLeft)}
              sub="cost of borrowing"
              icon={<AlertCircle className="w-5 h-5 text-red-500" />}
              iconBg="bg-red-50"
              valueColor="text-red-600"
            />
          </div>
        )}

        {/* ── Mortgage cards ────────────────────────────────────────────────────── */}
        {mortgages.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-semibold text-slate-900">Your Mortgages</h2>
              <Link
                to="/mortgage"
                className="text-sm font-semibold text-brand-primary hover:text-blue-700 flex items-center gap-1 transition-colors"
              >
                <Calculator className="w-4 h-4" /> Open Calculator
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mortgages.map(mortgage => (
                <MortgageCard
                  key={mortgage.id}
                  mortgage={mortgage}
                  linkedInsurances={insurances.filter(i => i.mortgageId === mortgage.id)}
                  onDelete={handleDelete}
                  onConvertToInvestment={setConvertingMortgage}
                  onConvertToPrimary={handleConvertToPrimary}
                  onLeasesChange={handleLeasesChange}
                  onAddInsurance={handleAddInsurance}
                />
              ))}
              {/* Add another tile */}
              <Link
                to="/mortgage"
                className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 hover:border-brand-primary/50 hover:bg-blue-50/30 transition-all duration-200 py-12 text-slate-400 hover:text-brand-primary group"
              >
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-current flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold">Add another mortgage</span>
              </Link>
            </div>
          </div>
        ) : (
          /* ── Empty state ──────────────────────────────────────────────────────── */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center mb-5 shadow-soft">
              <HomeIcon className="w-10 h-10 text-brand-primary" />
            </div>
            <h3 className="text-xl font-display font-bold text-slate-800 mb-2">No mortgages tracked yet</h3>
            <p className="text-slate-500 max-w-sm mb-6 text-sm leading-relaxed">
              Use the calculator to model your mortgage, then save it here to track payoff progress, equity built, and interest saved over time.
            </p>
            <Link
              to="/mortgage"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-primary hover:bg-blue-700 text-white font-semibold shadow-soft hover:shadow-hover transition-all"
            >
              <Calculator className="w-4 h-4" /> Open Calculator
            </Link>
          </div>
        )}

        {/* ── Quick actions ─────────────────────────────────────────────────────── */}
        <div>
          <h2 className="text-lg font-display font-semibold text-slate-900 mb-4">Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <QuickAction
              to="/mortgage"
              icon={<Calculator className="w-4.5 h-4.5 text-blue-600" />}
              label="Mortgage Calculator"
              sub="Calculate & compare loans"
              iconBg="bg-blue-50"
            />
            <QuickAction
              to="/affordability-calculator"
              icon={<HomeIcon className="w-4.5 h-4.5 text-teal-600" />}
              label="Affordability"
              sub="How much can you afford?"
              iconBg="bg-teal-50"
            />
            <QuickAction
              to="/rent-vs-buy-calculator"
              icon={<Scale className="w-4.5 h-4.5 text-violet-600" />}
              label="Rent vs Buy"
              sub="Long-term cost comparison"
              iconBg="bg-violet-50"
            />
            <QuickAction
              to="/mutual-funds"
              icon={<ArrowRightLeft className="w-4.5 h-4.5 text-emerald-600" />}
              label="Investments"
              sub="Mutual funds & stocks"
              iconBg="bg-emerald-50"
            />
          </div>
        </div>

      </main>
    </div>
  );
};

export default Dashboard;
