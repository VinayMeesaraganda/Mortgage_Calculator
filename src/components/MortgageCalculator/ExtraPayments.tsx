import React from 'react';
import { ChevronDown } from 'lucide-react';
import { HelpTooltip } from '../HelpTooltip';
import { DatePicker } from '../DatePicker';
import { CURRENCY_DATA } from '../../utils/currency';
import { NumberInputHook, OneTimePayment, Currency } from '../../types/mortgage';

interface ExtraPaymentsProps {
    extraPaymentEnabled: boolean;
    setExtraPaymentEnabled: (enabled: boolean) => void;
    extraPaymentAmountInput: NumberInputHook;
    extraPaymentStartDate: string;
    setExtraPaymentStartDate: (date: string) => void;
    extraPaymentFrequency: string;
    setExtraPaymentFrequency: (freq: string) => void;
    oneTimePayments: OneTimePayment[];
    setOneTimePayments: (payments: OneTimePayment[]) => void;
    oneTimePaymentsExpanded: boolean;
    setOneTimePaymentsExpanded: (expanded: boolean) => void;
    startDate: string;
    selectedCurrency: Currency;
}

export const ExtraPayments: React.FC<ExtraPaymentsProps> = ({
    extraPaymentEnabled,
    setExtraPaymentEnabled,
    extraPaymentAmountInput,
    extraPaymentStartDate,
    setExtraPaymentStartDate,
    extraPaymentFrequency,
    setExtraPaymentFrequency,
    oneTimePayments,
    setOneTimePayments,
    oneTimePaymentsExpanded,
    setOneTimePaymentsExpanded,
    startDate,
    selectedCurrency
}) => {
    return (
        <>
            {/* Recurring Extra Payments */}
            <div className="pt-2 border-t-2 border-slate-200 bg-gradient-to-br from-emerald-50/40 to-green-50/30 rounded-lg p-3 border-l-4 border-l-emerald-400">
                <div className="mb-2">
                    <label className="flex items-center text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer" style={{ color: '#334155' }}>
                        <input
                            type="checkbox"
                            checked={extraPaymentEnabled}
                            onChange={(e) => setExtraPaymentEnabled(e.target.checked)}
                            className="mr-2 w-4 h-4 text-emerald-600 border-emerald-300 rounded focus:ring-emerald-500"
                        />
                        Recurring Extra Payments
                        <HelpTooltip content="Make additional payments on a regular schedule to pay off your mortgage faster and save on interest." />
                    </label>
                </div>

                <div className="grid grid-cols-3 gap-2 pl-4 border-l border-emerald-200 mb-0">
                    <div className="min-w-[110px]">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Start Date
                        </label>
                        <DatePicker
                            value={extraPaymentStartDate}
                            onChange={setExtraPaymentStartDate}
                            disabled={!extraPaymentEnabled}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-colors text-xs disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Frequency
                        </label>
                        <select
                            value={extraPaymentFrequency}
                            onChange={(e) => setExtraPaymentFrequency(e.target.value)}
                            disabled={!extraPaymentEnabled}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-colors text-xs disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                            <option value="monthly">Monthly</option>
                            <option value="biweekly">Bi-weekly</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Amount
                        </label>
                        <input
                            type="text"
                            value={extraPaymentAmountInput.displayValue}
                            onChange={(e) => extraPaymentAmountInput.handleChange(e.target.value)}
                            onFocus={extraPaymentAmountInput.handleFocus}
                            onBlur={extraPaymentAmountInput.handleBlur}
                            disabled={!extraPaymentEnabled}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-colors text-xs disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                            placeholder="0"
                        />
                    </div>
                </div>
            </div>

            {/* One-Time Extra Payments */}
            <div className="pt-2 border-t-2 border-slate-200 bg-gradient-to-br from-emerald-50/40 to-green-50/30 rounded-lg p-3 border-l-4 border-l-emerald-400">
                <div
                    className="flex items-center justify-between mb-2 cursor-pointer select-none"
                    onClick={() => setOneTimePaymentsExpanded(!oneTimePaymentsExpanded)}
                >
                    <div className="flex items-center gap-2">
                        <ChevronDown
                            className={`w-4 h-4 text-emerald-600 transition-transform duration-200 ${oneTimePaymentsExpanded ? 'transform rotate-180' : ''}`}
                        />
                        <label className="flex items-center text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer" style={{ color: '#334155' }}>
                            One-Time Extra Payments
                            <HelpTooltip content="Add one-time payments at specific dates (e.g., bonus, tax refund) to reduce your principal and save on interest." />
                        </label>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            // Convert startDate from YYYY-MM-DD to YYYY-MM for calculations
                            const [year, month] = startDate.split('-');
                            const dateYYYYMM = `${year}-${month}`;
                            setOneTimePayments([...oneTimePayments, { id: Date.now().toString(), date: dateYYYYMM, amount: 0 }]);
                            setOneTimePaymentsExpanded(true);
                        }}
                        className="text-xs bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 px-3 py-1 rounded-lg hover:from-emerald-200 hover:to-green-200 shadow-md hover:shadow-lg transition-all font-bold border-2 border-emerald-300"
                    >
                        + Add Payment
                    </button>
                </div>

                {oneTimePaymentsExpanded && oneTimePayments.length > 0 && (
                    <div className="space-y-2 pl-4 border-l border-emerald-200">
                        {oneTimePayments.map((payment, index) => (
                            <div key={payment.id} className="grid grid-cols-3 gap-2">
                                <div className="min-w-[110px]">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Date
                                    </label>
                                    <DatePicker
                                        value={payment.date.length === 7 ? `${payment.date}-01` : payment.date}
                                        onChange={(newDate) => {
                                            const updated = [...oneTimePayments];
                                            // Convert YYYY-MM-DD to YYYY-MM for calculations
                                            const [year, month] = newDate.split('-');
                                            updated[index].date = `${year}-${month}`;
                                            setOneTimePayments(updated);
                                        }}
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Amount
                                    </label>
                                    <input
                                        type="text"
                                        value={payment.amount === 0 ? '' : payment.amount.toLocaleString()}
                                        onChange={(e) => {
                                            const cleaned = e.target.value.replace(/,/g, '');
                                            if (cleaned === '' || cleaned === '-') {
                                                const updated = [...oneTimePayments];
                                                updated[index].amount = 0;
                                                setOneTimePayments(updated);
                                            } else if (/^\d*\.?\d*$/.test(cleaned)) {
                                                const num = Number(cleaned);
                                                if (!isNaN(num) && num >= 0) {
                                                    const updated = [...oneTimePayments];
                                                    updated[index].amount = num;
                                                    setOneTimePayments(updated);
                                                }
                                            }
                                        }}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-colors text-xs"
                                        placeholder={`${CURRENCY_DATA[selectedCurrency].symbol}0`}
                                    />
                                </div>
                                <div>
                                    <button
                                        onClick={() => {
                                            setOneTimePayments(oneTimePayments.filter(p => p.id !== payment.id));
                                        }}
                                        className="w-full text-xs bg-gradient-to-r from-rose-100 to-red-100 text-rose-700 px-3 py-1.5 rounded-lg hover:from-rose-200 hover:to-red-200 shadow-md hover:shadow-lg transition-all font-bold border-2 border-rose-300 mt-5"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};
