import React from 'react';
import { Car, Heart, Home as HomeIcon, Shield } from 'lucide-react';
import type { Insurance, InsuranceCategory } from '../../types/insurance';
import { CATEGORY_LABELS, INSURANCE_COLORS } from '../../types/insurance';
import { formatCurrency } from '../../utils/formatting';
import { RenewalAlerts } from './RenewalAlerts';

interface InsurancePoliciesSectionProps {
  selectedCategory: InsuranceCategory | 'all';
  onSelectCategory: (category: InsuranceCategory | 'all') => void;
  insurances: Insurance[];
  filteredInsurances: Insurance[];
  expiringPolicies: Insurance[];
  onViewPolicy: (insurance: Insurance) => void;
  onEditPolicy: (insurance: Insurance) => void;
  onDeletePolicy: (insurance: Insurance) => void;
}

const getCategoryIcon = (category: InsuranceCategory) => {
  switch (category) {
    case 'health':
      return Heart;
    case 'life':
      return Shield;
    case 'auto':
      return Car;
    case 'home':
      return HomeIcon;
  }
};

const InsurancePoliciesSection: React.FC<InsurancePoliciesSectionProps> = ({
  selectedCategory,
  onSelectCategory,
  insurances,
  filteredInsurances,
  expiringPolicies,
  onViewPolicy,
  onEditPolicy,
  onDeletePolicy
}) => {
  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
        <button
          onClick={() => onSelectCategory('all')}
          className={`flex-shrink-0 px-4 py-3 rounded-xl font-semibold text-sm whitespace-nowrap transition-all min-h-[44px] ${
            selectedCategory === 'all'
              ? 'bg-slate-800 text-white shadow-lg'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Policies
        </button>
        {(['health', 'life', 'auto', 'home'] as InsuranceCategory[]).map((category) => {
          const Icon = getCategoryIcon(category);
          const count = insurances.filter((ins) => ins.category === category).length;
          return (
            <button
              key={category}
              onClick={() => onSelectCategory(category)}
              className={`flex-shrink-0 px-4 py-3 rounded-xl font-semibold text-sm whitespace-nowrap transition-all flex items-center gap-2 min-h-[44px] ${
                selectedCategory === category
                  ? `${INSURANCE_COLORS[category].accent} text-white shadow-lg`
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon size={16} />
              {CATEGORY_LABELS[category]} ({count})
            </button>
          );
        })}
      </div>

      {expiringPolicies.length > 0 && (
        <div className="mb-8">
          <RenewalAlerts insurances={insurances} onViewPolicy={onViewPolicy} />
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-slate-800">Your Policies</h3>
        </div>

        {filteredInsurances.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Shield size={48} className="mx-auto opacity-20 mb-4" />
            <p className="text-lg font-medium">No policies found</p>
            <p className="text-sm mt-2">Click "Add Policy" to start tracking your insurance</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredInsurances.map((insurance) => {
              const Icon = getCategoryIcon(insurance.category);
              const colors = INSURANCE_COLORS[insurance.category];
              const daysUntilExpiry = insurance.coverageEndDate
                ? Math.ceil((new Date(insurance.coverageEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                : null;

              return (
                <div key={insurance.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-3 ${colors.bg} ${colors.text} rounded-xl`}>
                        <Icon size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-slate-800">{insurance.provider}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} font-medium`}>
                            {CATEGORY_LABELS[insurance.category]}
                          </span>
                          {insurance.status === 'expiring_soon' && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                              Expiring Soon
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500">Policy #{insurance.policyNumber}</p>
                        <div className="flex gap-4 mt-2 text-sm">
                          <div>
                            <span className="text-slate-400">Premium:</span>
                            <span className="font-semibold text-slate-700 ml-1">
                              {formatCurrency(insurance.premium || 0)}/{insurance.paymentFrequency || 'annual'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Coverage Expires:</span>
                            <span
                              className={`font-semibold ml-1 ${
                                daysUntilExpiry !== null && daysUntilExpiry <= 30 ? 'text-amber-600' : 'text-slate-700'
                              }`}
                            >
                              {insurance.coverageEndDate
                                ? new Date(insurance.coverageEndDate).toLocaleDateString()
                                : 'Not set'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onViewPolicy(insurance)}
                        className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => onEditPolicy(insurance)}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeletePolicy(insurance)}
                        className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default InsurancePoliciesSection;
