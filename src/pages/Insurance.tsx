import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

const Insurance: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-red-50/20">
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
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            Insurance
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white/60 backdrop-blur-sm rounded-xl border-2 border-orange-200 p-8 md:p-12 shadow-lg text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Shield className="w-12 h-12 text-white" />
          </div>
          
          <h2 className="text-3xl font-bold text-slate-800 mb-4">
            Coming Soon
          </h2>
          
          <p className="text-lg text-slate-600 mb-6 max-w-2xl mx-auto">
            Our Insurance Calculator is currently under development. 
            This tool will help you compare insurance plans, calculate premiums, 
            and find the best coverage for your needs.
          </p>

          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-slate-800 mb-4">
              Planned Features
            </h3>
            <ul className="text-left space-y-2 text-slate-700 max-w-md mx-auto">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-orange-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Life insurance premium and coverage calculator</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-orange-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Health insurance plan comparison</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-orange-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Term vs whole life insurance analysis</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-orange-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Claim settlement ratio and company ratings</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-orange-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Premium payment schedule and tax benefits</span>
              </li>
            </ul>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Insurance;

