import React from 'react';

interface PillProps {
  label: string;
  tone?: 'default' | 'success' | 'warning' | 'info';
}

const toneMap = {
  default: 'bg-slate-100 text-slate-600',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  info: 'bg-blue-100 text-blue-700'
};

const Pill: React.FC<PillProps> = ({ label, tone = 'default' }) => {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${toneMap[tone]}`}>
      {label}
    </span>
  );
};

export default Pill;
