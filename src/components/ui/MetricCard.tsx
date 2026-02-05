import React from 'react';
import Card from './Card';

interface MetricCardProps {
  label: string;
  value: string | number;
  delta?: string;
  icon?: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, delta, icon }) => {
  return (
    <Card className="p-4 hover:shadow-hover transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">{label}</p>
        {icon && <div className="text-brand-primary">{icon}</div>}
      </div>
      <div className="text-2xl font-semibold text-slate-900 font-mono">{value}</div>
      {delta && <div className="text-xs text-slate-500 mt-1">{delta}</div>}
    </Card>
  );
};

export default MetricCard;
