import React from 'react';

import { HelpTooltip } from '../HelpTooltip';
import { CURRENCY_DATA } from '../../utils/currency';
import { formatCurrency } from '../../utils/formatting';
import { Currency } from '../../types/mortgage';
import { INPUT_STYLE } from '../../constants/styles';

interface PropertyDetailsProps {
    propertyType: string;

    propertyTax: number;
    setPropertyTax: (val: number) => void;
    propertyTaxPeriod: string;
    setPropertyTaxPeriod: (val: 'year' | 'month') => void;
    homeInsurance: number;
    setHomeInsurance: (val: number) => void;
    homeInsurancePeriod: string;
    setHomeInsurancePeriod: (val: 'year' | 'month') => void;
    pmiAmount: number;
    setPmiAmount: (val: number) => void;
    hoaFees: number;
    setHoaFees: (val: number) => void;
    selectedCurrency: Currency;
    downPayment: number;
    homeValue: number;
}

export const PropertyDetails: React.FC<PropertyDetailsProps> = ({
    propertyType,
    propertyTax,
    setPropertyTax,
    propertyTaxPeriod,
    setPropertyTaxPeriod,
    homeInsurance,
    setHomeInsurance,
    homeInsurancePeriod,
    setHomeInsurancePeriod,
    pmiAmount,
    setPmiAmount,
    hoaFees,
    setHoaFees,
    selectedCurrency,
    downPayment,
    homeValue
}) => {
    // Calculate monthly costs for summary
    const monthlyPropertyTax = propertyTaxPeriod === 'year' ? propertyTax / 12 : propertyTax;
    const monthlyInsurance = homeInsurancePeriod === 'year' ? homeInsurance / 12 : homeInsurance;
    const totalMonthlyCosts = monthlyPropertyTax + monthlyInsurance + pmiAmount + hoaFees;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-serif text-slate-800 tracking-wide border-b-2 border-gradient-to-r from-blue-400 to-slate-300 pb-1.5 font-bold relative" style={{ borderImage: 'linear-gradient(to right, rgb(96, 165, 250), rgb(203, 213, 225)) 1' }}>
                    {propertyType === 'investment' ? 'Additional Property Costs' : 'Additional Housing Costs'}
                    <div className="absolute -bottom-0.5 left-0 w-12 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse"></div>
                </h2>
                <HelpTooltip content={
                    propertyType === 'investment'
                        ? "Add property tax, insurance, and HOA fees. These costs are included in your cash flow calculation."
                        : "Add property tax, insurance, PMI, and HOA fees to see your true monthly housing cost."
                } />
            </div>

            {/* Property Tax */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        Property Tax
                    </label>
                    <input
                        type="text"
                        value={propertyTax || ''}
                        onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            setPropertyTax(val === '' ? 0 : Number(val));
                        }}
                        className={INPUT_STYLE}
                        placeholder={`${CURRENCY_DATA[selectedCurrency].symbol}0`}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        Period
                    </label>
                    <select
                        value={propertyTaxPeriod}
                        onChange={(e) => setPropertyTaxPeriod(e.target.value as 'year' | 'month')}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-colors text-xs"
                    >
                        <option value="year">Per Year</option>
                        <option value="month">Per Month</option>
                    </select>
                </div>
            </div>

            {/* Home Insurance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        Home Insurance
                    </label>
                    <input
                        type="text"
                        value={homeInsurance || ''}
                        onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            setHomeInsurance(val === '' ? 0 : Number(val));
                        }}
                        className={INPUT_STYLE}
                        placeholder={`${CURRENCY_DATA[selectedCurrency].symbol}0`}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        Period
                    </label>
                    <select
                        value={homeInsurancePeriod}
                        onChange={(e) => setHomeInsurancePeriod(e.target.value as 'year' | 'month')}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-colors text-xs"
                    >
                        <option value="year">Per Year</option>
                        <option value="month">Per Month</option>
                    </select>
                </div>
            </div>

            {/* PMI */}
            <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                    PMI (Private Mortgage Insurance)
                    {downPayment / homeValue < 0.2 && (
                        <span className="ml-1 text-xs text-amber-600 font-semibold">(Auto-calculated)</span>
                    )}
                </label>
                <input
                    type="text"
                    value={pmiAmount || ''}
                    onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        setPmiAmount(val === '' ? 0 : Number(val));
                    }}
                    className={INPUT_STYLE}
                    placeholder={`${CURRENCY_DATA[selectedCurrency].symbol}0/month`}
                />
                <p className="text-[10px] text-slate-500 mt-0.5">
                    {downPayment / homeValue < 0.2
                        ? 'Required when down payment < 20%. You can override the auto-calculated amount.'
                        : 'Not required (down payment ≥ 20%)'}
                </p>
            </div>

            {/* HOA Fees */}
            <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                    HOA Fees (Monthly)
                </label>
                <input
                    type="text"
                    value={hoaFees || ''}
                    onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        setHoaFees(val === '' ? 0 : Number(val));
                    }}
                    className={INPUT_STYLE}
                    placeholder={`${CURRENCY_DATA[selectedCurrency].symbol}0/month`}
                />
            </div>

            {/* Monthly Summary */}
            {totalMonthlyCosts > 0 && (
                <div className="pt-2 border-t border-slate-200">
                    <div className={`rounded-lg p-2 border-2 ${propertyType === 'investment'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-blue-50 border-blue-200'
                        }`}>
                        <div className="text-xs text-slate-600 space-y-0.5">
                            <div className="flex justify-between">
                                <span>Property Tax:</span>
                                <span className="font-semibold">{formatCurrency(monthlyPropertyTax)}/mo</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Insurance:</span>
                                <span className="font-semibold">{formatCurrency(monthlyInsurance)}/mo</span>
                            </div>
                            {pmiAmount > 0 && (
                                <div className="flex justify-between">
                                    <span>PMI:</span>
                                    <span className="font-semibold">{formatCurrency(pmiAmount)}/mo</span>
                                </div>
                            )}
                            {hoaFees > 0 && (
                                <div className="flex justify-between">
                                    <span>HOA Fees:</span>
                                    <span className="font-semibold">{formatCurrency(hoaFees)}/mo</span>
                                </div>
                            )}
                            <div className={`flex justify-between font-bold pt-1 border-t ${propertyType === 'investment' ? 'border-green-200 text-green-700' : 'border-blue-200 text-blue-700'
                                }`}>
                                <span>Total Extra:</span>
                                <span>{formatCurrency(totalMonthlyCosts)}/mo</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
