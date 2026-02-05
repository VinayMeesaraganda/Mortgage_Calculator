import React from 'react';

interface TabOption {
  id: string;
  label: string;
}

interface TabGroupProps {
  tabs: TabOption[];
  activeTab: string;
  onChange: (id: string) => void;
}

const TabGroup: React.FC<TabGroupProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === tab.id
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabGroup;
