import React from 'react';
import { formatCurrency } from '../../utils/formatting';
import type { Currency, PaymentType } from '../../types/mortgage';
import { ChevronUp } from 'lucide-react';

interface StickySummaryProps {
    paymentAmount: number;
    currency: Currency;
    paymentType: PaymentType;
    propertyType: 'primary' | 'investment';
    cashFlow?: number;
    onExpand?: () => void;
}

export const StickySummary: React.FC<StickySummaryProps> = ({
    paymentAmount,
    currency,
    paymentType,
    propertyType,
    cashFlow,
    onExpand
}) => {
    const paymentLabel = paymentType === 'biweekly' ? 'Bi-weekly Payment' : 'Monthly Payment';

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 lg:hidden z-50 transition-transform duration-300">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                        {paymentLabel}
                    </span>
                    <span className="text-xl font-bold text-slate-800">
                        {formatCurrency(paymentAmount, currency)}
                    </span>
                </div>

                {propertyType === 'investment' && cashFlow !== undefined && (
                    <div className="flex flex-col items-end mr-4">
                        <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                            Cash Flow
                        </span>
                        <span className={`text-lg font-bold ${cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {cashFlow > 0 ? '+' : ''}{formatCurrency(cashFlow, currency)}
                        </span>
                    </div>
                )}

                {onExpand && (
                    <button
                        onClick={onExpand}
                        className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                        aria-label="View Details"
                    >
                        <ChevronUp size={20} />
                    </button>
                )}
            </div>
        </div>
    );
};
