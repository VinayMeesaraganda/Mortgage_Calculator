import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PageShell from '../layouts/PageShell';
import TabGroup from '../components/ui/TabGroup';
import Button from '../components/ui/Button';
import MortgageCalculator from '../MortgageCalculator';
import LoginModal from '../components/LoginModal';

const MortgageHub: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('calculator');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const hasAutoNavigated = useRef(false);

  const tabs = [
    { id: 'calculator', label: 'Calculator' },
    { id: 'compare', label: 'Compare' },
    { id: 'refinance', label: 'Refinance' },
    { id: 'tracker', label: 'Tracker' }
  ];

  const handleTabChange = useCallback((tabId: string) => {
    if (tabId === 'tracker' && !currentUser) {
      setShowLoginModal(true);
      return;
    }
    setActiveTab(tabId);
    const target = document.getElementById(`mortgage-${tabId}-section`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || hasAutoNavigated.current) return;
    hasAutoNavigated.current = true;
    handleTabChange('tracker');
  }, [currentUser, handleTabChange]);

  return (
    <PageShell
      title="Mortgage Hub"
      subtitle="Calculate, compare, refinance, and track your mortgages in one premium workspace."
    >
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <div className="sticky top-20 z-40 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-white/90 backdrop-blur border-b border-brand-border">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabGroup tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
          <Button
            variant="secondary"
            onClick={() => document.getElementById('mortgage-calculator-section')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Back to Calculator
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between mb-6 mt-6">
        <div className="text-sm text-slate-500">
          Jump between calculator, comparisons, refinance, and your saved mortgages without losing progress.
        </div>
      </div>
      <MortgageCalculator />
    </PageShell>
  );
};

export default MortgageHub;
