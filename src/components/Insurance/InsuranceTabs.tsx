import React from 'react';

interface InsuranceTabsProps {
  activeTab: 'policies' | 'claims' | 'analytics';
  onTabChange: (value: 'policies' | 'claims' | 'analytics') => void;
  claimsCount: number;
}

const InsuranceTabs: React.FC<InsuranceTabsProps> = ({
  activeTab,
  onTabChange,
  claimsCount
}) => {
  return (
    <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
      <button
        onClick={() => onTabChange('policies')}
        className={`flex-shrink-0 px-6 py-3 rounded-lg font-medium transition-colors min-h-[44px] ${
          activeTab === 'policies'
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        Policies
      </button>
      <button
        onClick={() => onTabChange('claims')}
        className={`flex-shrink-0 px-6 py-3 rounded-lg font-medium transition-colors min-h-[44px] ${
          activeTab === 'claims'
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        Claims ({claimsCount})
      </button>
      <button
        onClick={() => onTabChange('analytics')}
        className={`flex-shrink-0 px-6 py-3 rounded-lg font-medium transition-colors min-h-[44px] ${
          activeTab === 'analytics'
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        Analytics
      </button>
    </div>
  );
};

export default InsuranceTabs;
