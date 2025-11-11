import React from 'react';
import { Link } from 'react-router-dom';
import { Banknote, ArrowLeft } from 'lucide-react';

const FixedDeposits: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-yellow-50/20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            to="/" 
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg">
              <Banknote className="w-6 h-6 text-white" />
            </div>
            Fixed Deposits
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white/60 backdrop-blur-sm rounded-xl border-2 border-amber-200 p-8 md:p-12 shadow-lg text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Banknote className="w-12 h-12 text-white" />
          </div>
          
          <h2 className="text-3xl font-bold text-slate-800 mb-4">
            Coming Soon
          </h2>
          
          <p className="text-lg text-slate-600 mb-6 max-w-2xl mx-auto">
            Our Fixed Deposits Calculator is currently under development. 
            This tool will help you calculate fixed deposit returns, compare interest rates, 
            and plan your savings.
          </p>

          <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-slate-800 mb-4">
              Planned Features
            </h3>
            <ul className="text-left space-y-2 text-slate-700 max-w-md mx-auto">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>FD maturity amount and interest calculator</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Compare FD rates across different banks</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Simple vs compound interest calculations</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Tax on FD interest (TDS) calculator</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Premature withdrawal penalty calculator</span>
              </li>
            </ul>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
};

export default FixedDeposits;

