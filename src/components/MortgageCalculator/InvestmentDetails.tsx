import React from 'react';
import { HelpTooltip } from '../HelpTooltip';
import { formatCurrency } from '../../utils/formatting';
import { NumberInputHook } from '../../types/mortgage';
import { INPUT_STYLE } from '../../constants/styles';

interface InvestmentDetailsProps {
  monthlyRentInput: NumberInputHook;
  vacancyRate: number;
  setVacancyRate: (rate: number) => void;
  propertyManagementPercent: number;
  setPropertyManagementPercent: (percent: number) => void;
  maintenanceInput: NumberInputHook;
  utilitiesInput: NumberInputHook;
  propertyAppreciationRate: number;
  setPropertyAppreciationRate: (rate: number) => void;
  // Live preview values passed from parent (already calculated)
  effectiveMonthlyRent: number;
  totalOperatingExpenses: number;
  monthlyCashFlow: number;
  mortgagePayment: number;
  // Projections
  futureMonthlyRent5Year: number;
  futureMonthlyRent10Year: number;
  futureMonthlyRent15Year: number;
}

const PercentInput: React.FC<{
  label: string; tooltip: string; value: number;
  onChange: (v: number) => void; min?: number; max?: number; step?: number; suffix?: string;
}> = ({ label, tooltip, value, onChange, min = 0, max = 100, step = 0.5, suffix = '%' }) => (
  <div>
    <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
      {label} <HelpTooltip content={tooltip} />
    </label>
    <div className="relative">
      <input type="number" value={value} onChange={e => onChange(Number(e.target.value))}
        min={min} max={max} step={step} className={INPUT_STYLE} />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">{suffix}</span>
    </div>
  </div>
);

export const InvestmentDetails: React.FC<InvestmentDetailsProps> = ({
  monthlyRentInput,
  vacancyRate, setVacancyRate,
  propertyManagementPercent, setPropertyManagementPercent,
  maintenanceInput, utilitiesInput,
  propertyAppreciationRate, setPropertyAppreciationRate,
  effectiveMonthlyRent, totalOperatingExpenses, monthlyCashFlow, mortgagePayment,
  futureMonthlyRent5Year, futureMonthlyRent10Year, futureMonthlyRent15Year,
}) => {
  const cashPositive = monthlyCashFlow >= 0;

  return (
    <div className="space-y-5">

      {/* ── Section header ─────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-bold text-slate-800">Rental Income &amp; Expenses</h2>
        <p className="text-xs text-slate-400 mt-0.5">Enter your rental income and expenses to calculate investment returns.</p>
      </div>

      {/* ── Gross Monthly Rent ─────────────────────────────────────────────── */}
      <div>
        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Gross Monthly Rent
        </label>
        <input
          type="text"
          value={monthlyRentInput.displayValue}
          onChange={e => monthlyRentInput.handleChange(e.target.value)}
          onBlur={monthlyRentInput.handleBlur}
          onFocus={monthlyRentInput.handleFocus}
          className={INPUT_STYLE}
          placeholder="$2,500"
        />
        {effectiveMonthlyRent > 0 && vacancyRate > 0 && (
          <p className="text-xs text-slate-400 mt-1">
            Effective after vacancy: <span className="font-semibold text-slate-600">{formatCurrency(effectiveMonthlyRent)}/mo</span>
          </p>
        )}
      </div>

      {/* ── Vacancy + Management ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <PercentInput
          label="Vacancy Rate"
          tooltip="Typical: 5–10%. Accounts for time the unit sits empty between tenants."
          value={vacancyRate}
          onChange={setVacancyRate}
          max={50}
        />
        <PercentInput
          label="Mgmt Fee"
          tooltip="Property management fee as % of gross rent. Typical: 8–12%."
          value={propertyManagementPercent}
          onChange={setPropertyManagementPercent}
          max={25}
        />
      </div>

      {/* ── Maintenance + Utilities ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Maintenance /mo
          </label>
          <input
            type="text"
            value={maintenanceInput.displayValue}
            onChange={e => maintenanceInput.handleChange(e.target.value)}
            onBlur={maintenanceInput.handleBlur}
            onFocus={maintenanceInput.handleFocus}
            className={INPUT_STYLE}
            placeholder="$500"
          />
        </div>
        <div>
          <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Utilities /mo
            <HelpTooltip content="Only if landlord pays utilities (uncommon in residential)." />
          </label>
          <input
            type="text"
            value={utilitiesInput.displayValue}
            onChange={e => utilitiesInput.handleChange(e.target.value)}
            onBlur={utilitiesInput.handleBlur}
            onFocus={utilitiesInput.handleFocus}
            className={INPUT_STYLE}
            placeholder="$0"
          />
        </div>
      </div>

      {/* ── Annual Growth Rate ────────────────────────────────────────────── */}
      <PercentInput
        label="Annual Growth Rate"
        tooltip="Expected annual increase applied to both rent and property value. Used for 5/10/15 year projections."
        value={propertyAppreciationRate}
        onChange={setPropertyAppreciationRate}
        max={20}
        step={0.1}
        suffix="%/yr"
      />

      {/* ── Live P&L snapshot ─────────────────────────────────────────────── */}
      {monthlyRentInput.value > 0 && (
        <div className={`rounded-xl border-2 p-4 ${cashPositive ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Monthly Summary</span>
            <span className={`text-sm font-bold tabular-nums ${cashPositive ? 'text-emerald-600' : 'text-red-500'}`}>
              {cashPositive ? '+' : ''}{formatCurrency(monthlyCashFlow)}/mo
            </span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Effective rent</span>
              <span className="font-semibold tabular-nums text-slate-700">+{formatCurrency(effectiveMonthlyRent)}</span>
            </div>
            <div className="flex justify-between">
              <span>Operating expenses</span>
              <span className="font-semibold tabular-nums text-red-400">−{formatCurrency(totalOperatingExpenses)}</span>
            </div>
            <div className="flex justify-between">
              <span>Mortgage payment</span>
              <span className="font-semibold tabular-nums text-red-400">−{formatCurrency(mortgagePayment)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Rent projections ─────────────────────────────────────────────── */}
      {monthlyRentInput.value > 0 && propertyAppreciationRate > 0 && (
        <div className="pt-1">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Rent at {propertyAppreciationRate}%/yr growth
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: '5 yr', rent: futureMonthlyRent5Year },
              { label: '10 yr', rent: futureMonthlyRent10Year },
              { label: '15 yr', rent: futureMonthlyRent15Year },
            ].map(({ label, rent }) => (
              <div key={label} className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-center">
                <div className="text-[10px] text-slate-400 mb-0.5">{label}</div>
                <div className="text-sm font-bold text-slate-800 tabular-nums">{formatCurrency(rent)}</div>
                <div className="text-[9px] text-emerald-600 font-medium">
                  +{formatCurrency(rent - monthlyRentInput.value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
