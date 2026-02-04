import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  PieChart,
  Shield,
  Banknote,
  Home as HomeIcon,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  Target,
  RefreshCw,
  Cloud,
  Wallet,
  Building,
  Plus,
  Layers,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from '../components/LoginModal';

const LandingPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [countUp, setCountUp] = useState({ users: 0, calculations: 0, portfolios: 0 });

  useEffect(() => {
    setIsVisible(true);
    // Animate numbers
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setCountUp({
        users: Math.floor(10000 * progress),
        calculations: Math.floor(50 * progress),
        portfolios: Math.floor(25000 * progress)
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, []);

  const mainFeatures = [
    {
      id: 'mortgage',
      title: 'Mortgage Tracker',
      subtitle: 'Not just a calculator',
      description: 'Save multiple properties, track payments month-by-month, add extra payments, compare bi-weekly vs monthly schedules, and see exactly when you\'ll be debt-free.',
      icon: Building,
      gradient: 'from-blue-500 to-indigo-600',
      path: '/mortgage-calculator',
      highlights: [
        'Save unlimited mortgages with property details',
        'One-time, monthly & bi-weekly extra payments',
        'Compare up to 3 loan scenarios side-by-side',
        'Refinance analysis with break-even calculation',
        'Investment property ROI with rental income tracking',
        'Auto-sync across all your devices'
      ],
      stats: { label: 'Properties Tracked', value: '15,000+' }
    },
    {
      id: 'mutual-funds',
      title: 'Mutual Fund Portfolio',
      subtitle: 'Live NAV tracking',
      description: 'Add your mutual fund investments, and watch your portfolio update automatically with live NAV prices. Track XIRR, CAGR, and see historical performance.',
      icon: PieChart,
      gradient: 'from-purple-500 to-violet-600',
      path: '/mutual-funds',
      highlights: [
        'Search 40,000+ mutual funds by name or code',
        'Auto-fetch NAV prices from AMFI API',
        'Track multiple purchases per fund (SIP tracking)',
        'XIRR & CAGR calculations for true returns',
        'Historical performance analysis',
        'Category-wise portfolio breakdown'
      ],
      stats: { label: 'Live NAV Updates', value: 'Real-time' }
    },
    {
      id: 'stocks',
      title: 'Stock Portfolio',
      subtitle: 'Real-time prices',
      description: 'Track your stock investments with live prices from Yahoo Finance. Monitor daily P&L, track buy/sell transactions, and analyze your performance.',
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-teal-600',
      path: '/stock-investments',
      highlights: [
        'Live stock prices from Yahoo Finance',
        'Auto-refresh every 5 minutes',
        'Track buy & sell transactions',
        'Daily P&L with previous close comparison',
        'Support for NSE, BSE & SME stocks',
        'Average cost basis calculation'
      ],
      stats: { label: 'Price Updates', value: 'Every 5 min' }
    },
    {
      id: 'fixed-deposits',
      title: 'Fixed Deposit Manager',
      subtitle: 'Maturity tracking',
      description: 'Never miss a maturity date again. Track all your FDs across banks, visualize your maturity ladder, and calculate tax impact on interest.',
      icon: Banknote,
      gradient: 'from-amber-500 to-orange-600',
      path: '/fixed-deposits',
      highlights: [
        'Track FDs across multiple banks',
        'Maturity date reminders',
        'Tax impact calculation (30% bracket)',
        'Senior citizen rate support',
        'Maturity ladder visualization',
        'Bank-wise allocation chart'
      ],
      stats: { label: 'FDs Tracked', value: '8,000+' }
    },
    {
      id: 'insurance',
      title: 'Insurance Organizer',
      subtitle: 'Never miss a renewal',
      description: 'Keep all your insurance policies organized in one place. Track premiums, coverage, and get reminded before renewal dates.',
      icon: Shield,
      gradient: 'from-rose-500 to-pink-600',
      path: '/insurance',
      highlights: [
        'Track life, health, vehicle & property insurance',
        'Premium payment tracking',
        'Coverage amount visualization',
        'Renewal date reminders',
        'Policy document organization',
        'Family member coverage tracking'
      ],
      stats: { label: 'Policies Managed', value: '12,000+' }
    }
  ];

  const calculators = [
    {
      title: 'Affordability Calculator',
      description: 'Discover how much house you can afford based on your income, debts, and down payment.',
      icon: Target,
      path: '/affordability-calculator',
      gradient: 'from-cyan-500 to-blue-600'
    },
    {
      title: 'Rent vs. Buy',
      description: 'Make data-driven decisions with detailed cost comparisons over any time horizon.',
      icon: HomeIcon,
      path: '/rent-vs-buy-calculator',
      gradient: 'from-indigo-500 to-purple-600'
    }
  ];

  const comparisonFeatures = [
    { feature: 'Save your data permanently', us: true, others: false },
    { feature: 'Live stock & mutual fund prices', us: true, others: false },
    { feature: 'Track multiple mortgages', us: true, others: false },
    { feature: 'Extra payment strategies', us: true, others: false },
    { feature: 'Cloud sync across devices', us: true, others: false },
    { feature: 'XIRR & CAGR calculations', us: true, others: false },
    { feature: 'Investment property analysis', us: true, others: false },
    { feature: 'No signup required to try', us: true, others: true },
    { feature: 'Completely free', us: true, others: true }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-600/20 via-transparent to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-600/20 via-transparent to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-emerald-600/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 px-6 lg:px-12 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                FinanceHub
              </span>
              <p className="text-xs text-slate-500">Personal Finance Suite</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-300 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-slate-300 hover:text-white transition-colors">How it Works</a>
            <a href="#comparison" className="text-slate-300 hover:text-white transition-colors">Why Us</a>
          </div>
          <div className="flex items-center gap-4">
            {currentUser ? (
              <Link
                to="/home"
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all hover:scale-105"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="hidden sm:block text-slate-300 hover:text-white transition-colors font-medium"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all hover:scale-105"
                >
                  Get Started Free
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 lg:px-12 pt-8 pb-16 lg:pt-16 lg:pb-24">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-full mb-8">
              <Cloud className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-slate-300">Your data syncs everywhere • Login once, track forever</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold leading-tight mb-6">
              <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Stop Re-entering.
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Start Tracking.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto mb-6 leading-relaxed px-4">
              Unlike other calculators that forget you, <span className="text-white font-semibold">FinanceHub remembers</span>.
              Save your mortgages, investments, and insurance — then track them with <span className="text-emerald-400 font-semibold">live prices</span> that update automatically.
            </p>

            {/* Key Differentiators */}
            <div className="flex flex-wrap justify-center gap-4 mb-10 px-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-full border border-slate-700/50">
                <RefreshCw className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-slate-300">Live price updates</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-full border border-slate-700/50">
                <Cloud className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-slate-300">Cloud sync</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-full border border-slate-700/50">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-slate-300">Multiple portfolios</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 px-4">
              <Link
                to="/home"
                className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/25 transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                Start Tracking Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-semibold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                See What's Different
                <ChevronDown className="w-5 h-5" />
              </a>
            </div>

            {/* Animated Stats */}
            <div className="grid grid-cols-3 gap-4 md:gap-16 max-w-2xl mx-auto px-4">
              <div className="text-center">
                <div className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {countUp.users.toLocaleString()}+
                </div>
                <span className="text-slate-500 text-xs sm:text-sm">Active Users</span>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  {countUp.calculations}M+
                </div>
                <span className="text-slate-500 text-xs sm:text-sm">Calculations</span>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {countUp.portfolios.toLocaleString()}+
                </div>
                <span className="text-slate-500 text-xs sm:text-sm">Portfolios Tracked</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="relative z-10 px-6 lg:px-12 py-16 bg-gradient-to-b from-transparent to-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* The Problem */}
            <div className="relative p-8 rounded-3xl bg-gradient-to-br from-red-950/30 to-slate-900/50 border border-red-900/20">
              <div className="absolute -top-4 left-8">
                <span className="px-4 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium border border-red-500/30">
                  😤 The Problem
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white mt-4 mb-4">Other calculators forget you</h3>
              <ul className="space-y-3">
                {[
                  'Enter all your details every single time',
                  'Can\'t track multiple mortgages or investments',
                  'No live price updates — always outdated',
                  'Lost data when you close the browser',
                  'Can\'t compare different payment strategies'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-400">
                    <X className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* The Solution */}
            <div className="relative p-8 rounded-3xl bg-gradient-to-br from-emerald-950/30 to-slate-900/50 border border-emerald-900/20">
              <div className="absolute -top-4 left-8">
                <span className="px-4 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium border border-emerald-500/30">
                  ✨ FinanceHub
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white mt-4 mb-4">Your personal finance command center</h3>
              <ul className="space-y-3">
                {[
                  'Login once — your data is always there',
                  'Track unlimited mortgages, funds & stocks',
                  'Live prices from Yahoo Finance & AMFI',
                  'Cloud sync across all your devices',
                  'Compare bi-weekly vs monthly, scenarios A/B/C'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features Section */}
      <section id="features" className="relative z-10 px-6 lg:px-12 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium">
              5 Powerful Tools
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-6 mb-4">
              <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Everything Syncs. Everything Updates.
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Each tool saves your data and keeps it updated with live prices. No more starting from scratch.
            </p>
          </div>

          {/* Feature Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {mainFeatures.map((feature, index) => (
              <button
                key={feature.id}
                onClick={() => setActiveTab(index)}
                className={`px-4 py-2 rounded-full font-medium transition-all ${activeTab === index
                  ? `bg-gradient-to-r ${feature.gradient} text-white shadow-lg`
                  : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
              >
                {feature.title}
              </button>
            ))}
          </div>

          {/* Active Feature Detail */}
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className={`transition-all duration-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${mainFeatures[activeTab].gradient} mb-4`}>
                {React.createElement(mainFeatures[activeTab].icon, { className: 'w-4 h-4' })}
                <span className="text-sm font-medium">{mainFeatures[activeTab].subtitle}</span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">{mainFeatures[activeTab].title}</h3>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">{mainFeatures[activeTab].description}</p>

              <ul className="space-y-3 mb-8">
                {mainFeatures[activeTab].highlights.map((highlight, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${activeTab === 0 ? 'text-blue-400' :
                      activeTab === 1 ? 'text-purple-400' :
                        activeTab === 2 ? 'text-emerald-400' :
                          activeTab === 3 ? 'text-amber-400' :
                            'text-rose-400'
                      }`} />
                    <span className="text-slate-300">{highlight}</span>
                  </li>
                ))}
              </ul>

              <Link
                to={mainFeatures[activeTab].path}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r ${mainFeatures[activeTab].gradient} font-semibold hover:shadow-lg transition-all hover:scale-105`}
              >
                Try {mainFeatures[activeTab].title}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Feature Preview Card */}
            <div className="relative">
              <div className={`absolute inset-0 bg-gradient-to-br ${mainFeatures[activeTab].gradient} opacity-20 rounded-3xl blur-3xl`} />
              <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-6 sm:p-8 shadow-2xl">
                {/* Mock UI based on active tab */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${mainFeatures[activeTab].gradient} flex items-center justify-center`}>
                      {React.createElement(mainFeatures[activeTab].icon, { className: 'w-5 h-5 text-white' })}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{mainFeatures[activeTab].title}</div>
                      <div className="text-xs text-slate-500">Last synced: Just now</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400 text-sm">
                    <Cloud className="w-4 h-4" />
                    <span>Synced</span>
                  </div>
                </div>

                {/* Dynamic content based on tab */}
                {activeTab === 0 && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
                      <div className="flex justify-between mb-2">
                        <span className="text-slate-400 text-sm">Primary Home - 123 Main St</span>
                        <span className="text-emerald-400 text-sm">Active</span>
                      </div>
                      <div className="text-2xl font-bold text-white">$2,145<span className="text-slate-500 text-sm font-normal">/month</span></div>
                      <div className="text-xs text-slate-500 mt-1">Payoff: Dec 2048 → Aug 2041 (with extra payments)</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <div className="text-xs text-blue-400">Interest Saved</div>
                        <div className="text-lg font-bold text-white">$45,230</div>
                      </div>
                      <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                        <div className="text-xs text-purple-400">Years Saved</div>
                        <div className="text-lg font-bold text-white">7.2 years</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 1 && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-sm text-slate-400">HDFC Mid-Cap Fund</div>
                          <div className="text-xs text-slate-500">3 purchases • SIP active</div>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-400">
                          <RefreshCw className="w-3 h-3" />
                          <span className="text-xs">Live</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="text-2xl font-bold text-white">₹2,45,670</div>
                          <div className="text-xs text-slate-500">Invested: ₹1,80,000</div>
                        </div>
                        <div className="text-right">
                          <div className="text-emerald-400 font-semibold">+36.5%</div>
                          <div className="text-xs text-slate-500">XIRR: 18.2%</div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20 flex items-center justify-between">
                      <span className="text-sm text-purple-300">NAV: ₹142.35</span>
                      <span className="text-xs text-slate-500">Updated 2 min ago</span>
                    </div>
                  </div>
                )}

                {activeTab === 2 && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold">RELIANCE</span>
                          <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">+2.4%</span>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-bold">₹2,892.50</div>
                          <div className="text-xs text-slate-500">Prev: ₹2,824.30</div>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">50 shares @ ₹2,450</span>
                        <span className="text-emerald-400">+₹22,125</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                      <span className="text-sm text-slate-400">Today's P&L</span>
                      <span className="text-emerald-400 font-semibold">+₹3,410</span>
                    </div>
                  </div>
                )}

                {activeTab === 3 && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-white font-semibold">HDFC Bank FD</div>
                          <div className="text-xs text-slate-500">7.1% p.a. • 2 years</div>
                        </div>
                        <div className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs">
                          Matures in 8 months
                        </div>
                      </div>
                      <div className="flex justify-between items-end mt-3">
                        <div>
                          <div className="text-xs text-slate-500">Principal</div>
                          <div className="text-xl font-bold text-white">₹5,00,000</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-500">Maturity Value</div>
                          <div className="text-xl font-bold text-emerald-400">₹5,73,450</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 4 && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-white font-semibold">Term Life Insurance</div>
                          <div className="text-xs text-slate-500">LIC Jeevan Anand</div>
                        </div>
                        <div className="px-2 py-1 bg-rose-500/20 text-rose-400 rounded text-xs">
                          Renews in 45 days
                        </div>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="text-xs text-slate-500">Coverage</div>
                          <div className="text-xl font-bold text-white">₹1 Crore</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-500">Annual Premium</div>
                          <div className="text-lg font-semibold text-slate-300">₹24,500</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stats Badge */}
                <div className="mt-6 flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                  <span className="text-sm text-slate-400">{mainFeatures[activeTab].stats.label}</span>
                  <span className="font-bold text-white">{mainFeatures[activeTab].stats.value}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Calculators */}
      <section className="relative z-10 px-6 lg:px-12 py-16 bg-gradient-to-b from-slate-900/50 to-transparent">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold text-white mb-2">Quick Calculators</h3>
            <p className="text-slate-400">No login required — just instant answers</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {calculators.map((calc) => (
              <Link
                key={calc.title}
                to={calc.path}
                className="group p-6 rounded-2xl bg-slate-800/30 border border-slate-700/30 hover:border-slate-600/50 transition-all hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${calc.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  {React.createElement(calc.icon, { className: 'w-6 h-6 text-white' })}
                </div>
                <h4 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{calc.title}</h4>
                <p className="text-slate-400 mb-4">{calc.description}</p>
                <div className="flex items-center gap-2 text-blue-400 font-medium">
                  <span>Try it free</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="comparison" className="relative z-10 px-6 lg:px-12 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-sm font-medium">
              Why FinanceHub?
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-6 mb-4">
              <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                We're Not Just Another Calculator
              </span>
            </h2>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-3xl border border-slate-700/50 overflow-hidden">
            <div className="grid grid-cols-3 p-4 border-b border-slate-700/50 bg-slate-800/30">
              <div className="text-slate-400 font-medium">Feature</div>
              <div className="text-center">
                <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-white text-sm font-medium">
                  FinanceHub
                </span>
              </div>
              <div className="text-center text-slate-400 font-medium">Others</div>
            </div>
            {comparisonFeatures.map((item, index) => (
              <div key={index} className={`grid grid-cols-3 p-4 items-center ${index % 2 === 0 ? 'bg-slate-800/20' : ''}`}>
                <div className="text-slate-300 text-sm sm:text-base">{item.feature}</div>
                <div className="flex justify-center">
                  {item.us ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <X className="w-6 h-6 text-red-400" />
                  )}
                </div>
                <div className="flex justify-center">
                  {item.others ? (
                    <CheckCircle2 className="w-6 h-6 text-slate-500" />
                  ) : (
                    <X className="w-6 h-6 text-red-400/50" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="relative z-10 px-6 lg:px-12 py-24 bg-gradient-to-b from-transparent to-slate-900/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Get Started in 3 Steps
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Add Your Details',
                description: 'Enter your mortgage, investments, or insurance details. Use our smart search for mutual funds and stocks.',
                icon: Plus,
                color: 'blue'
              },
              {
                step: '02',
                title: 'We Track Everything',
                description: 'Live prices update automatically. Your portfolio syncs across devices. Never enter data twice.',
                icon: RefreshCw,
                color: 'purple'
              },
              {
                step: '03',
                title: 'Make Smarter Decisions',
                description: 'Compare scenarios, track extra payments, analyze returns with XIRR/CAGR, and plan your financial future.',
                icon: TrendingUp,
                color: 'emerald'
              }
            ].map((item, index) => (
              <div key={index} className="relative text-center">
                <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-${item.color}-500/20 to-${item.color}-600/20 border border-${item.color}-500/30 flex items-center justify-center`}>
                  {React.createElement(item.icon, { className: `w-8 h-8 text-${item.color}-400` })}
                </div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 text-6xl font-bold text-slate-800/50">{item.step}</div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 px-6 lg:px-12 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-3xl border border-slate-700/50 p-8 sm:p-12 md:p-16 text-center overflow-hidden">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500/30 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-slate-300 text-sm">100% Free • No Credit Card Required</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
                  Ready to Finally Track Your Finances?
                </span>
              </h2>
              <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
                Join thousands who stopped re-entering their data and started actually tracking their financial progress.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/home"
                  className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/25 transition-all hover:scale-105 flex items-center justify-center gap-2"
                >
                  Start Tracking Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 lg:px-12 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">FinanceHub</span>
            </div>
            <div className="flex items-center gap-8 text-slate-400">
              <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms-of-service" className="hover:text-white transition-colors">Terms</Link>
              <a href="mailto:support@financehub.app" className="hover:text-white transition-colors">Contact</a>
            </div>
            <p className="text-slate-500 text-sm">
              © 2026 FinanceHub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
