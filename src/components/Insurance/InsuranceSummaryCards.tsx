import React from 'react';
import { Bell, FileText, Shield, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../utils/formatting';

interface InsuranceSummaryCardsProps {
  totalPolicies: number;
  activePoliciesCount: number;
  totalAnnualPremium: number;
  totalCoverage: number;
  expiringPoliciesCount: number;
}

const InsuranceSummaryCards: React.FC<InsuranceSummaryCardsProps> = ({
  totalPolicies,
  activePoliciesCount,
  totalAnnualPremium,
  totalCoverage,
  expiringPoliciesCount
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <FileText size={24} />
          </div>
        </div>
        <p className="text-slate-500 text-sm font-medium">Total Policies</p>
        <h3 className="text-2xl font-bold text-slate-800 mt-1">{totalPolicies}</h3>
        <p className="text-xs text-slate-400 mt-1">{activePoliciesCount} active</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <TrendingUp size={24} />
          </div>
        </div>
        <p className="text-slate-500 text-sm font-medium">Annual Premium</p>
        <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalAnnualPremium)}</h3>
        <p className="text-xs text-slate-400 mt-1">{formatCurrency(totalAnnualPremium / 12)}/month</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <Shield size={24} />
          </div>
        </div>
        <p className="text-slate-500 text-sm font-medium">Total Coverage</p>
        <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalCoverage)}</h3>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Bell size={24} />
          </div>
          {expiringPoliciesCount > 0 && (
            <span className="text-xs font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded-lg">
              {expiringPoliciesCount}
            </span>
          )}
        </div>
        <p className="text-slate-500 text-sm font-medium">Renewals Due</p>
        <h3 className="text-2xl font-bold text-slate-800 mt-1">Next 30 Days</h3>
        <p className="text-xs text-slate-400 mt-1">{expiringPoliciesCount} policies</p>
      </div>
    </div>
  );
};

export default InsuranceSummaryCards;
