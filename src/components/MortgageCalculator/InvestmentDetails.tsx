import React from 'react';
import { HelpTooltip } from '../HelpTooltip';
import { formatCurrency, formatCurrencyCompact } from '../../utils/formatting';
import { NumberInputHook } from '../../types/mortgage';

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
    futureMonthlyRent5Year: number;
    futureMonthlyRent10Year: number;
    futureMonthlyRent15Year: number;
    rentIncrease5Year: number;
    rentIncrease10Year: number;
    rentIncrease15Year: number;
}

export const InvestmentDetails: React.FC<InvestmentDetailsProps> = ({
    monthlyRentInput,
    vacancyRate,
    setVacancyRate,
    propertyManagementPercent,
    setPropertyManagementPercent,
    maintenanceInput,
    utilitiesInput,
    propertyAppreciationRate,
    setPropertyAppreciationRate,
    futureMonthlyRent5Year,
    futureMonthlyRent10Year,
    futureMonthlyRent15Year,
    rentIncrease5Year,
    rentIncrease10Year,
    rentIncrease15Year
}) => {
    return (
        <div className="relative p-3 border-r-2 border-slate-100">
            <h2 className="text-sm font-serif text-slate-800 mb-2 tracking-wide border-b-2 pb-1.5 font-bold relative flex items-center gap-1" style={{ borderImage: 'linear-gradient(to right, rgb(34, 197, 94), rgb(16, 185, 129)) 1' }}>
                <span className="text-base">💵</span>
                <span className="text-xs">Rental Income & Expenses</span>
                <div className="absolute -bottom-0.5 left-0 w-10 h-0.5 bg-gradient-to-r from-green-500 to-emerald-500"></div>
            </h2>
            <div className="space-y-1.5">
                <div>
                    <label className="block text-[9px] font-semibold text-slate-700 mb-0.5">Monthly Rent</label>
                    <input
                        type="text"
                        value={monthlyRentInput.displayValue}
                        onChange={(e) => monthlyRentInput.handleChange(e.target.value)}
                        onBlur={monthlyRentInput.handleBlur}
                        onFocus={monthlyRentInput.handleFocus}
                        className="w-full px-2 py-1 border-2 border-green-200 rounded-md focus:ring-1 focus:ring-green-400 focus:border-green-400 text-[10px]"
                    />
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                    <div>
                        <label className="block text-[9px] font-semibold text-slate-700 mb-0.5 flex items-center gap-0.5">
                            Vacancy <HelpTooltip content="Typical: 5-10%" />
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={vacancyRate}
                                onChange={(e) => setVacancyRate(Number(e.target.value))}
                                min="0"
                                max="100"
                                step="0.5"
                                className="w-full px-2 py-1 border-2 border-green-200 rounded-md focus:ring-1 focus:ring-green-400 text-[10px]"
                            />
                            <span className="absolute right-1 top-1/2 transform -translate-y-1/2 text-slate-500 text-[9px]">%</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[9px] font-semibold text-slate-700 mb-0.5 flex items-center gap-0.5">
                            Mgmt Fee <HelpTooltip content="Typical: 8-12%" />
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={propertyManagementPercent}
                                onChange={(e) => setPropertyManagementPercent(Number(e.target.value))}
                                min="0"
                                max="20"
                                step="0.5"
                                className="w-full px-2 py-1 border-2 border-green-200 rounded-md focus:ring-1 focus:ring-green-400 text-[10px]"
                            />
                            <span className="absolute right-1 top-1/2 transform -translate-y-1/2 text-slate-500 text-[9px]">%</span>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                    <div>
                        <label className="block text-[9px] font-semibold text-slate-700 mb-0.5">Maintenance</label>
                        <input
                            type="text"
                            value={maintenanceInput.displayValue}
                            onChange={(e) => maintenanceInput.handleChange(e.target.value)}
                            onBlur={maintenanceInput.handleBlur}
                            onFocus={maintenanceInput.handleFocus}
                            className="w-full px-2 py-1 border-2 border-green-200 rounded-md focus:ring-1 focus:ring-green-400 text-[10px]"
                            placeholder="$500"
                        />
                    </div>
                    <div>
                        <label className="block text-[9px] font-semibold text-slate-700 mb-0.5">Utilities</label>
                        <input
                            type="text"
                            value={utilitiesInput.displayValue}
                            onChange={(e) => utilitiesInput.handleChange(e.target.value)}
                            onBlur={utilitiesInput.handleBlur}
                            onFocus={utilitiesInput.handleFocus}
                            className="w-full px-2 py-1 border-2 border-green-200 rounded-md focus:ring-1 focus:ring-green-400 text-[10px]"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-[9px] font-semibold text-slate-700 mb-0.5">Rental Growth Rate</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={propertyAppreciationRate}
                            onChange={(e) => setPropertyAppreciationRate(Number(e.target.value))}
                            min="0"
                            max="20"
                            step="0.1"
                            className="w-full px-2 py-1 border-2 border-green-200 rounded-md focus:ring-1 focus:ring-green-400 text-[10px]"
                        />
                        <span className="absolute right-1 top-1/2 transform -translate-y-1/2 text-slate-500 text-[9px]">%/yr</span>
                    </div>
                </div>
                <div className="p-1.5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-md border border-green-300 mt-2">
                    <p className="text-[9px] text-slate-600">Effective Rent:</p>
                    <p className="text-xs font-bold text-green-700">
                        {formatCurrency(monthlyRentInput.value * (1 - vacancyRate / 100))}/mo
                    </p>
                </div>

                {/* Rental Income Projections */}
                <div className="mt-3 pt-2 border-t border-green-200">
                    <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[9px] font-semibold text-slate-700 flex items-center gap-1">
                            <span aria-label="Chart icon">📊</span> Rental Projections
                            <HelpTooltip content={`Based on ${propertyAppreciationRate}% annual rental growth`} />
                        </p>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                        <div className="p-1.5 rounded-md border border-green-200 bg-green-50/50">
                            <div className="text-[7px] text-slate-600 mb-0.5">5Y</div>
                            <div className="text-[10px] font-bold text-green-700">{formatCurrencyCompact(futureMonthlyRent5Year)}/mo</div>
                            <div className="text-[7px] text-slate-500 mt-0.5">+{formatCurrencyCompact(rentIncrease5Year)}</div>
                        </div>
                        <div className="p-1.5 rounded-md border border-green-300 bg-green-50">
                            <div className="text-[7px] text-slate-600 mb-0.5">10Y</div>
                            <div className="text-[10px] font-bold text-green-700">{formatCurrencyCompact(futureMonthlyRent10Year)}/mo</div>
                            <div className="text-[7px] text-slate-500 mt-0.5">+{formatCurrencyCompact(rentIncrease10Year)}</div>
                        </div>
                        <div className="p-1.5 rounded-md border border-green-400 bg-green-100/50">
                            <div className="text-[7px] text-slate-600 mb-0.5">15Y</div>
                            <div className="text-[10px] font-bold text-green-700">{formatCurrencyCompact(futureMonthlyRent15Year)}/mo</div>
                            <div className="text-[7px] text-slate-500 mt-0.5">+{formatCurrencyCompact(rentIncrease15Year)}</div>
                        </div>
                    </div>
                    <div className="mt-1 text-[7px] text-slate-500 text-center">
                        Growth: {propertyAppreciationRate}%/yr
                    </div>
                </div>
            </div>
        </div>
    );
};
