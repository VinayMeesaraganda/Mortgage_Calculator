import React from 'react';
import { Car, Heart, Home as HomeIcon, Shield, Link2, Building2 } from 'lucide-react';
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
  mortgages: { id: string; name: string }[];
  onViewPolicy: (insurance: Insurance) => void;
  onEditPolicy: (insurance: Insurance) => void;
  onDeletePolicy: (insurance: Insurance) => void;
}

const getCategoryIcon = (category: InsuranceCategory) => {
  switch (category) {
    case 'health': return Heart;
    case 'life':   return Shield;
    case 'auto':   return Car;
    case 'home':   return HomeIcon;
  }
};

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

// ─── Single policy row ────────────────────────────────────────────────────────
const PolicyRow: React.FC<{
  insurance: Insurance;
  mortgageName?: string;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ insurance, mortgageName, onView, onEdit, onDelete }) => {
  const Icon = getCategoryIcon(insurance.category);
  const colors = INSURANCE_COLORS[insurance.category];
  const days = insurance.coverageEndDate ? daysUntil(insurance.coverageEndDate) : null;
  const isExpiring = days !== null && days <= 30 && days > 0;
  const isExpired = days !== null && days <= 0;

  return (
    <div className="p-5 hover:bg-slate-50 transition-colors group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Icon */}
          <div className={`p-2.5 ${colors.bg} ${colors.text} rounded-xl flex-shrink-0`}>
            <Icon size={20} />
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h4 className="font-bold text-slate-800 text-sm">{insurance.provider}</h4>
              <span className={`text-[11px] px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} font-semibold`}>
                {CATEGORY_LABELS[insurance.category]}
              </span>
              {isExpiring && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                  Expiring soon
                </span>
              )}
              {isExpired && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">
                  Expired
                </span>
              )}
              {/* Property link badge */}
              {mortgageName && (
                <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                  <Link2 size={10} /> {mortgageName}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 mb-2">Policy #{insurance.policyNumber}</p>

            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
              <span className="text-slate-500">
                Premium:{' '}
                <span className="font-semibold text-slate-700">
                  {formatCurrency(insurance.premium || 0)}/{insurance.paymentFrequency || 'annual'}
                </span>
              </span>
              <span className="text-slate-500">
                Coverage ends:{' '}
                <span className={`font-semibold ${isExpiring ? 'text-amber-600' : isExpired ? 'text-red-600' : 'text-slate-700'}`}>
                  {insurance.coverageEndDate
                    ? new Date(insurance.coverageEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '—'}
                </span>
              </span>
              {days !== null && days > 0 && (
                <span className={`font-semibold ${isExpiring ? 'text-amber-600' : 'text-slate-400'}`}>
                  {days}d left
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={onView}
            className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            View
          </button>
          <button
            onClick={onEdit}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const InsurancePoliciesSection: React.FC<InsurancePoliciesSectionProps> = ({
  selectedCategory,
  onSelectCategory,
  insurances,
  filteredInsurances,
  expiringPolicies,
  mortgages,
  onViewPolicy,
  onEditPolicy,
  onDeletePolicy,
}) => {
  const mortgageMap = Object.fromEntries(mortgages.map(m => [m.id, m.name]));

  // When on the Home tab, group policies by linked property
  const isHomeTab = selectedCategory === 'home';

  const groups: { label: string; icon: React.ReactNode; policies: Insurance[] }[] = [];

  if (isHomeTab) {
    // Separate linked vs unlinked
    const linked = filteredInsurances.filter(ins => ins.mortgageId && mortgageMap[ins.mortgageId]);
    const unlinked = filteredInsurances.filter(ins => !ins.mortgageId || !mortgageMap[ins.mortgageId]);

    // Group linked by property
    const byProperty: Record<string, Insurance[]> = {};
    for (const ins of linked) {
      const pid = ins.mortgageId!;
      if (!byProperty[pid]) byProperty[pid] = [];
      byProperty[pid].push(ins);
    }

    for (const [mortgageId, policies] of Object.entries(byProperty)) {
      groups.push({
        label: mortgageMap[mortgageId],
        icon: <Building2 size={14} className="text-blue-600" />,
        policies,
      });
    }

    if (unlinked.length > 0) {
      groups.push({
        label: 'Not linked to a property',
        icon: <HomeIcon size={14} className="text-slate-400" />,
        policies: unlinked,
      });
    }
  }

  return (
    <>
      {/* Category filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
        <button
          onClick={() => onSelectCategory('all')}
          className={`flex-shrink-0 px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
            selectedCategory === 'all'
              ? 'bg-slate-800 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Policies
        </button>
        {(['health', 'life', 'auto', 'home'] as InsuranceCategory[]).map((category) => {
          const Icon = getCategoryIcon(category);
          const count = insurances.filter(ins => ins.category === category).length;
          return (
            <button
              key={category}
              onClick={() => onSelectCategory(category)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                selectedCategory === category
                  ? `${INSURANCE_COLORS[category].accent} text-white shadow-md`
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon size={15} />
              {CATEGORY_LABELS[category]}
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                selectedCategory === category ? 'bg-white/20' : 'bg-slate-100'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Renewal alerts */}
      {expiringPolicies.length > 0 && (
        <div className="mb-2">
          <RenewalAlerts insurances={insurances} onViewPolicy={onViewPolicy} />
        </div>
      )}

      {/* Policy list */}
      {filteredInsurances.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
          <Shield size={40} className="mx-auto opacity-20 mb-4" />
          <p className="text-base font-semibold">No policies found</p>
          <p className="text-sm mt-1">Click "Add policy" to start tracking</p>
        </div>
      ) : isHomeTab && groups.length > 0 ? (
        /* Grouped by property for Home tab */
        <div className="space-y-4">
          {groups.map((group, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50/60">
                {group.icon}
                <span className="text-sm font-bold text-slate-700">{group.label}</span>
                <span className="ml-auto text-xs text-slate-400">{group.policies.length} policy</span>
              </div>
              <div className="divide-y divide-slate-100">
                {group.policies.map(ins => (
                  <PolicyRow
                    key={ins.id}
                    insurance={ins}
                    mortgageName={ins.mortgageId ? mortgageMap[ins.mortgageId] : undefined}
                    onView={() => onViewPolicy(ins)}
                    onEdit={() => onEditPolicy(ins)}
                    onDelete={() => onDeletePolicy(ins)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Flat list for all other tabs */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filteredInsurances.map(ins => (
              <PolicyRow
                key={ins.id}
                insurance={ins}
                mortgageName={ins.mortgageId ? mortgageMap[ins.mortgageId] : undefined}
                onView={() => onViewPolicy(ins)}
                onEdit={() => onEditPolicy(ins)}
                onDelete={() => onDeletePolicy(ins)}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default InsurancePoliciesSection;
