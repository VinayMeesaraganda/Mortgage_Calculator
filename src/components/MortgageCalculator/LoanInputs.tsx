import React from 'react';
import { HelpTooltip } from '../HelpTooltip';
import { DatePicker } from '../DatePicker';
import CurrentRatesDisplay from '../CurrentRatesDisplay';
import { INPUT_STYLE } from '../../constants/styles';
import { NumberInputHook, PaymentType, SavedMortgage, Currency } from '../../types/mortgage';

interface LoanInputsProps {
    homeValueInput: NumberInputHook;
    downPaymentInput: NumberInputHook;
    interestRateInput: NumberInputHook;
    tenureInput: NumberInputHook;
    startDate: string;
    setStartDate: (date: string) => void;
    paymentType: PaymentType;
    setPaymentType: (type: PaymentType) => void;
    savedMortgages: SavedMortgage[];
    selectedMortgageId: string | null;
    setSelectedMortgageId: (id: string | null) => void;
    handleLoadMortgage: (mortgage: SavedMortgage) => void;
    currentUser: any;
    setNewMortgageName: (name: string) => void;
    propertyType: string;
    downPayment: number;
    homeValue: number;
    editingDownPaymentPercent: boolean;
    setEditingDownPaymentPercent: (val: boolean) => void;
    rawDownPaymentPercent: string;
    setRawDownPaymentPercent: (val: string) => void;
    showCurrentRates: boolean;
    setShowCurrentRates: (val: boolean) => void;
    selectedCurrency: Currency;
}

export const LoanInputs: React.FC<LoanInputsProps> = ({
    homeValueInput,
    downPaymentInput,
    interestRateInput,
    tenureInput,
    startDate,
    setStartDate,
    paymentType,
    setPaymentType,
    savedMortgages,
    selectedMortgageId,
    setSelectedMortgageId,
    handleLoadMortgage,
    currentUser,
    setNewMortgageName,
    propertyType,
    downPayment,
    homeValue,
    editingDownPaymentPercent,
    setEditingDownPaymentPercent,
    rawDownPaymentPercent,
    setRawDownPaymentPercent,
    showCurrentRates,
    setShowCurrentRates,
    selectedCurrency,
}) => {
    return (
        <>
            <div className="mb-2">
                <h2 className="text-base font-serif text-slate-800 tracking-wide border-b-2 pb-1.5 font-bold relative" style={{ borderImage: 'linear-gradient(to right, rgb(96, 165, 250), rgb(203, 213, 225)) 1' }}>
                    Loan Details
                    <div className="absolute -bottom-0.5 left-0 w-12 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse"></div>
                </h2>
            </div>

            <div>
                <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider" style={{ color: '#334155' }}>
                        Home Value
                    </label>
                    {/* Saved Mortgages Dropdown */}
                    {currentUser && savedMortgages.length > 0 && (
                        <select
                            value={selectedMortgageId || ''}
                            onChange={(e) => {
                                const mortgageId = e.target.value;
                                if (mortgageId) {
                                    const mortgage = savedMortgages.find(m => m.id === mortgageId);
                                    if (mortgage) {
                                        handleLoadMortgage(mortgage);
                                    }
                                } else {
                                    setSelectedMortgageId(null);
                                    setNewMortgageName(''); // Clear name when selecting "New Mortgage"
                                }
                            }}
                            className="px-2 py-1 text-xs font-semibold bg-white border-2 border-blue-300 rounded-md text-blue-700 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        >
                            <option value="">New Mortgage</option>
                            {savedMortgages
                                .filter(m => (m.propertyType || 'primary') === propertyType)
                                .map((mortgage) => (
                                    <option key={mortgage.id} value={mortgage.id}>
                                        {mortgage.name}
                                    </option>
                                ))}
                        </select>
                    )}
                </div>
                <input
                    type="text"
                    inputMode="decimal"
                    value={homeValueInput.displayValue}
                    onChange={(e) => homeValueInput.handleChange(e.target.value)}
                    onFocus={homeValueInput.handleFocus}
                    onBlur={homeValueInput.handleBlur}
                    className={INPUT_STYLE}
                    style={{ overflow: 'visible' }}
                />
            </div>

            <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider" style={{ color: '#334155' }}>
                    Down Payment
                </label>
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <input
                            type="text"
                            inputMode="decimal"
                            value={downPaymentInput.displayValue}
                            onChange={(e) => downPaymentInput.handleChange(e.target.value)}
                            onFocus={downPaymentInput.handleFocus}
                            onBlur={downPaymentInput.handleBlur}
                            className={INPUT_STYLE}
                            style={{ overflow: 'visible' }}
                            placeholder="Amount"
                        />
                    </div>
                    <div className="text-blue-400 text-lg font-light">|</div>
                    <div className="flex-1">
                        <input
                            type="text"
                            inputMode="decimal"
                            value={editingDownPaymentPercent
                                ? rawDownPaymentPercent
                                : ((downPayment / homeValue) * 100).toFixed(1)}
                            onChange={(e) => {
                                setEditingDownPaymentPercent(true);
                                const cleaned = e.target.value.replace(/,/g, '');
                                setRawDownPaymentPercent(cleaned);
                                if (cleaned && /^\d*\.?\d*$/.test(cleaned)) {
                                    const percent = Number(cleaned);
                                    if (!isNaN(percent) && percent >= 0 && percent <= 100) {
                                        downPaymentInput.setValue((homeValue * percent) / 100);
                                    }
                                }
                            }}
                            onFocus={() => {
                                setEditingDownPaymentPercent(true);
                                setRawDownPaymentPercent(((downPayment / homeValue) * 100).toFixed(1));
                            }}
                            onBlur={() => {
                                setEditingDownPaymentPercent(false);
                                setRawDownPaymentPercent('');
                            }}
                            className={INPUT_STYLE}
                            style={{ overflow: 'visible' }}
                            placeholder="%"
                        />
                    </div>
                </div>
            </div>

            <div>
                <label className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider" style={{ color: '#334155' }}>
                    <span>Interest Rate (%)</span>
                    <button
                        type="button"
                        onClick={() => setShowCurrentRates(!showCurrentRates)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 normal-case tracking-normal flex items-center gap-1 transition-colors"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        {showCurrentRates ? 'Hide' : 'Show'} Current Rates
                    </button>
                </label>
                <input
                    type="text"
                    inputMode="decimal"
                    value={interestRateInput.displayValue}
                    onChange={(e) => interestRateInput.handleChange(e.target.value)}
                    onFocus={interestRateInput.handleFocus}
                    onBlur={interestRateInput.handleBlur}
                    className={INPUT_STYLE}
                    style={{ overflow: 'visible' }}
                />

                {/* Current Mortgage Rates - Collapsible */}
                {showCurrentRates && (
                    <div className="mt-2 animate-slideDown">
                        <CurrentRatesDisplay
                            currency={selectedCurrency}
                            onApplyRate={(rate) => {
                                interestRateInput.setValue(rate);
                                setShowCurrentRates(false); // Auto-close after selection
                            }}
                        />
                    </div>
                )}
            </div>

            <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider" style={{ color: '#334155' }}>
                    Loan Tenure (Years)
                </label>
                <input
                    type="text"
                    inputMode="numeric"
                    value={tenureInput.displayValue}
                    onChange={(e) => tenureInput.handleChange(e.target.value)}
                    onFocus={tenureInput.handleFocus}
                    onBlur={tenureInput.handleBlur}
                    className={INPUT_STYLE}
                    style={{ overflow: 'visible' }}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div>
                    <label className="flex items-center text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider" style={{ color: '#334155' }}>
                        Payment Frequency
                        <HelpTooltip content="Choose between monthly (12 payments/year) or bi-weekly (26 payments/year) schedules. Bi-weekly results in one extra monthly payment per year, helping pay off your mortgage faster." />
                    </label>
                    <select
                        value={paymentType}
                        onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                        className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-sm bg-white shadow-sm hover:shadow-md hover:border-blue-300"
                        style={{ overflow: 'visible' }}
                    >
                        <option value="monthly">Monthly</option>
                        <option value="biweekly">Bi-weekly</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider" style={{ color: '#334155' }}>
                        Start Date
                    </label>
                    <DatePicker
                        value={startDate}
                        onChange={setStartDate}
                        className={INPUT_STYLE}
                    />
                </div>
            </div>
        </>
    );
};
