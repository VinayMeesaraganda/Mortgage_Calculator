import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calculator, TrendingUp, PieChart, Shield, Banknote, LogOut, User, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from '../components/LoginModal';

const Home: React.FC = () => {
  const { currentUser, logout, userProfile } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const tools = [
    {
      id: 'mortgage',
      title: 'Mortgage Calculator',
      description: 'Calculate mortgage payments, compare loans, analyze investment properties, and get detailed amortization schedules.',
      icon: Calculator,
      path: '/mortgage-calculator',
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      available: true
    },
    {
      id: 'stock',
      title: 'Stock Investments',
      description: 'Track your stock portfolio, calculate returns, and analyze investment performance.',
      icon: TrendingUp,
      path: '/stock-investments',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      available: true
    },
    {
      id: 'mutual-funds',
      title: 'Mutual Funds',
      description: 'Track your mutual fund portfolio, calculate returns, and analyze performance by category.',
      icon: PieChart,
      path: '/mutual-funds',
      color: 'from-purple-500 to-violet-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      available: true
    },
    {
      id: 'insurance',
      title: 'Insurance',
      description: 'Compare insurance plans, calculate premiums, and find the best coverage for your needs.',
      icon: Shield,
      path: '/insurance',
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      available: false
    },
    {
      id: 'fixed-deposits',
      title: 'Fixed Deposits',
      description: 'Calculate fixed deposit returns, compare interest rates, and plan your savings.',
      icon: Banknote,
      path: '/fixed-deposits',
      color: 'from-amber-500 to-yellow-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      available: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1"></div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-800 tracking-tight text-center flex-1">
              Personal Finance
            </h1>
            <div className="flex-1 flex justify-end items-center gap-2">
              {currentUser ? (
                <>
                  <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
                    <User className="w-4 h-4" />
                    <span className="font-semibold">{userProfile?.username || currentUser.displayName || 'User'}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-2 text-sm font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all flex items-center gap-2 text-sm font-semibold shadow-md hover:shadow-lg"
                  >
                    <LogIn className="w-4 h-4" />
                    <span className="hidden sm:inline">Login</span>
                  </button>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-2 text-sm font-semibold"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">Sign Up</span>
                  </button>
                </>
              )}
            </div>
          </div>
          <p className="text-sm text-slate-600 mt-1 text-center">
            Comprehensive financial tools to manage your money and investments
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Introduction */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3">
            Your All-in-One Financial Tools Suite
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Access powerful financial tools and calculators to make informed decisions about mortgages, 
            investments, insurance, and savings. Track your portfolio, calculate returns, and plan your financial future. 
            All tools are <span className="font-semibold text-blue-600">free to use</span> with no signup required.
            {!currentUser && (
              <span className="block mt-2 text-sm">
                <button 
                  onClick={() => setShowLoginModal(true)}
                  className="text-blue-600 hover:text-blue-700 font-semibold underline"
                >
                  Sign up
                </button> to save and track your financial data across devices.
              </span>
            )}
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const cardContent = (
              <div className={`${tool.bgColor} rounded-xl border-2 ${tool.borderColor} p-6 h-full transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                tool.available ? 'hover:border-opacity-60 cursor-pointer' : 'cursor-not-allowed opacity-75'
              }`}>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  {tool.title}
                  {!tool.available && (
                    <span className="ml-2 text-xs font-normal text-slate-500 bg-slate-200 px-2 py-1 rounded-full">
                      Coming Soon
                    </span>
                  )}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {tool.description}
                </p>
                {tool.available && (
                  <div className="mt-4 flex items-center text-sm font-semibold text-blue-600">
                    <span>Try it now</span>
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            );

            return tool.available ? (
              <Link key={tool.id} to={tool.path} className="block">
                {cardContent}
              </Link>
            ) : (
              <div key={tool.id} className="block">
                {cardContent}
              </div>
            );
          })}
        </div>

        {/* Features Section */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl border-2 border-slate-200 p-8 shadow-lg">
          <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">
            Why Choose Our Financial Tools?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4 className="font-bold text-slate-800 mb-2">100% Free</h4>
              <p className="text-sm text-slate-600">
                All calculators are completely free with no hidden fees or subscriptions required.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-bold text-slate-800 mb-2">No Signup Required</h4>
              <p className="text-sm text-slate-600">
                Start calculating immediately without creating an account or providing personal information.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-violet-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="font-bold text-slate-800 mb-2">Fast & Accurate</h4>
              <p className="text-sm text-slate-600">
                Get instant, accurate calculations with detailed breakdowns and exportable reports.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-300 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm">
              © {new Date().getFullYear()} Personal Finance Tools. All rights reserved.
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Free financial calculators for mortgages, investments, insurance, and more.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;

