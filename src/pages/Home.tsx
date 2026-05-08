import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Calculator,
  TrendingUp,
  PieChart,
  Shield,
  Banknote,
  Home as HomeIcon,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from '../components/LoginModal';
import PageShell from '../layouts/PageShell';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SectionHeader from '../components/ui/SectionHeader';

const Home: React.FC = () => {
  const { currentUser } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Logged-in users go straight to the dashboard
  if (currentUser) return <Navigate to="/dashboard" replace />;

  const tools = [
    {
      id: 'mortgage',
      title: 'Mortgage Hub',
      description: 'Calculate, compare, refinance, and track your mortgages in one workspace.',
      icon: Calculator,
      path: '/mortgage',
      highlight: true,
      available: true
    },
    {
      id: 'mutual-funds',
      title: 'Mutual Funds',
      description: 'Track your mutual fund portfolio, calculate returns, and analyze performance by category.',
      icon: PieChart,
      path: '/mutual-funds',
      available: true
    },
    {
      id: 'stock',
      title: 'Stock Investments',
      description: 'Track your stock portfolio, calculate returns, and analyze investment performance.',
      icon: TrendingUp,
      path: '/stock-investments',
      available: true,
      requiresLogin: true
    },
    {
      id: 'insurance',
      title: 'Insurance',
      description: 'Track policies, manage renewals, calculate premiums, and optimize your coverage.',
      icon: Shield,
      path: '/insurance',
      available: true
    },
    {
      id: 'affordability',
      title: 'Affordability Calculator',
      description: 'Estimate how much house you can afford based on income, debts, and down payment.',
      icon: Banknote,
      path: '/affordability-calculator',
      available: true
    },
    {
      id: 'rent-vs-buy',
      title: 'Rent vs. Buy',
      description: 'Compare the long-term costs of renting versus buying a home to make the right decision.',
      icon: HomeIcon,
      path: '/rent-vs-buy-calculator',
      available: true
    },
    {
      id: 'fixed-deposits',
      title: 'Fixed Deposits',
      description: 'Manage your FD portfolio, track maturity dates, and analyze returns with our advisor tools.',
      icon: Banknote,
      path: '/fixed-deposits',
      available: true
    }
  ];

  return (
    <PageShell
      title="Welcome"
      subtitle="A modern finance suite to calculate, track, and optimize every major money decision."
    >
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

      <Card className="p-8 md:p-10 mb-10 bg-gradient-to-br from-white via-blue-50/60 to-teal-50/40 border-brand-border">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 text-brand-accent">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-semibold">Modern, integrated money tools</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 max-w-3xl">
            A premium workspace to plan mortgages, track portfolios, and make smarter decisions.
          </h2>
          <p className="text-slate-600 max-w-2xl">
            Everything stays connected across calculators, trackers, and insights. Use it free, and sign in to save and
            sync your data across devices.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/mortgage">
              <Button>
                Open Mortgage Hub <ArrowUpRight className="w-4 h-4" />
              </Button>
            </Link>
            {!currentUser && (
              <Button variant="secondary" onClick={() => setShowLoginModal(true)}>
                Sign in to save data
              </Button>
            )}
          </div>
        </div>
      </Card>

      <SectionHeader title="Your Tools" subtitle="Jump straight into the workflows you use the most." />

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => {
          const IconComponent = tool.icon;
          const cardContent = (
            <Card
              className={`p-6 h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-hover ${
                tool.highlight ? 'border-brand-primary/30 bg-gradient-to-br from-white to-blue-50/50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                  <IconComponent className="w-6 h-6" />
                </div>
                {tool.requiresLogin && !currentUser && (
                  <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                    Login required
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mt-4">{tool.title}</h3>
              <p className="text-sm text-slate-500 mt-2">{tool.description}</p>
              <div className="mt-4 flex items-center text-sm font-semibold text-brand-primary">
                {tool.requiresLogin && !currentUser ? 'Sign in to access' : 'Open tool'}
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </div>
            </Card>
          );

          if (tool.requiresLogin && !currentUser) {
            return (
              <button
                key={tool.id}
                type="button"
                className="text-left"
                onClick={() => setShowLoginModal(true)}
              >
                {cardContent}
              </button>
            );
          }

          return (
            <Link key={tool.id} to={tool.path}>
              {cardContent}
            </Link>
          );
        })}
      </div>
    </PageShell>
  );
};

export default Home;
