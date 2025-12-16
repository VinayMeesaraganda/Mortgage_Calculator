import React, { useState, useEffect } from 'react';
import { X, Calendar, Landmark, Percent, RefreshCw, Milestone } from 'lucide-react';
import { FixedDeposit } from '../../types/fd';
import { BANK_COLORS } from '../../types/fd';

interface AddFDModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (fd: Omit<FixedDeposit, 'id' | 'createdAt' | 'updatedAt'>) => void;
    editFD?: FixedDeposit;
}

export const AddFDModal: React.FC<AddFDModalProps> = ({ isOpen, onClose, onSave, editFD }) => {
    const [bankName, setBankName] = useState('');
    const [principalAmount, setPrincipalAmount] = useState<string>('');
    const [interestRate, setInterestRate] = useState<string>('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [tenureYears, setTenureYears] = useState<number>(1);
    const [tenureMonths, setTenureMonths] = useState<number>(0);
    const [tenureDays, setTenureDays] = useState<number>(0);
    const [type, setType] = useState<'FD' | 'RD'>('FD');
    const [payoutFrequency, setPayoutFrequency] = useState<'cumulative' | 'monthly' | 'quarterly'>('cumulative');
    const [compoundingFrequency, setCompoundingFrequency] = useState<'monthly' | 'quarterly'>('quarterly');
    const [isTaxSaver, setIsTaxSaver] = useState(false);

    useEffect(() => {
        if (editFD) {
            setBankName(editFD.bankName);
            setPrincipalAmount(editFD.principalAmount.toString());
            setInterestRate(editFD.interestRate.toString());
            setStartDate(editFD.startDate);
            setTenureYears(editFD.tenureYears);
            setTenureMonths(editFD.tenureMonths);
            setTenureDays(editFD.tenureDays);
            setType(editFD.type);
            setPayoutFrequency(editFD.payoutFrequency);
            setCompoundingFrequency(editFD.compoundingFrequency as any);
            setIsTaxSaver(editFD.isTaxSaver);
        } else {
            // Reset defaults
            setBankName('');
            setPrincipalAmount('');
            setInterestRate('');
            setTenureYears(1);
            setIsTaxSaver(false);
        }
    }, [editFD, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!bankName || !principalAmount || !interestRate) return;

        // Calculate Maturity Date
        const date = new Date(startDate);
        date.setFullYear(date.getFullYear() + tenureYears);
        date.setMonth(date.getMonth() + tenureMonths);
        date.setDate(date.getDate() + tenureDays);
        const maturityDate = date.toISOString().split('T')[0];

        onSave({
            name: `${bankName} ${type}`,
            bankName,
            type,
            principalAmount: parseFloat(principalAmount),
            interestRate: parseFloat(interestRate),
            startDate,
            maturityDate,
            tenureYears,
            tenureMonths,
            tenureDays,
            payoutFrequency,
            compoundingFrequency,
            status: 'active',
            isTaxSaver,
            colors: BANK_COLORS[Math.floor(Math.random() * BANK_COLORS.length)] // Random color for now
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        {editFD ? 'Edit Investment' : 'Add New Investment'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Investment Type */}
                    <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
                        <button
                            type="button"
                            onClick={() => setType('FD')}
                            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${type === 'FD' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                        >
                            Fixed Deposit (FD)
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('RD')}
                            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${type === 'RD' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                        >
                            Recurring Deposit (RD)
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Bank Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Bank / Institution Name</label>
                            <div className="relative">
                                <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={bankName}
                                    onChange={(e) => setBankName(e.target.value)}
                                    placeholder="e.g. HDFC Bank, SBI"
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                    required
                                />
                            </div>
                        </div>

                        {/* Principal Amount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {type === 'FD' ? 'Invested Amount' : 'Monthly Installment'}
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₹</span>
                                <input
                                    type="number"
                                    value={principalAmount}
                                    onChange={(e) => setPrincipalAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                    required
                                />
                            </div>
                        </div>

                        {/* Interest Rate */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Interest Rate (% p.a.)</label>
                            <div className="relative">
                                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="number"
                                    step="0.01"
                                    value={interestRate}
                                    onChange={(e) => setInterestRate(e.target.value)}
                                    placeholder="7.5"
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                    required
                                />
                            </div>
                        </div>

                        {/* Start Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tenure */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tenure</label>
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 uppercase font-bold">Years</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={tenureYears}
                                    onChange={(e) => setTenureYears(parseInt(e.target.value) || 0)}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                                />
                            </div>
                            <div className="flex-1 relative">
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 uppercase font-bold">Months</span>
                                <input
                                    type="number"
                                    min="0"
                                    max="11"
                                    value={tenureMonths}
                                    onChange={(e) => setTenureMonths(parseInt(e.target.value) || 0)}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                                />
                            </div>
                            <div className="flex-1 relative">
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 uppercase font-bold">Days</span>
                                <input
                                    type="number"
                                    min="0"
                                    max="30"
                                    value={tenureDays}
                                    onChange={(e) => setTenureDays(parseInt(e.target.value) || 0)}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Payout Frequency */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <RefreshCw size={16} /> Interest Payout
                            </label>
                            <select
                                value={payoutFrequency}
                                onChange={(e) => setPayoutFrequency(e.target.value as any)}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                            >
                                <option value="cumulative">On Maturity (Cumulative)</option>
                                <option value="monthly">Monthly Payout</option>
                                <option value="quarterly">Quarterly Payout</option>
                            </select>
                        </div>

                        {/* Compounding Frequency */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <Milestone size={16} /> Compounding
                            </label>
                            <select
                                value={compoundingFrequency}
                                onChange={(e) => setCompoundingFrequency(e.target.value as any)}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                            >
                                <option value="quarterly">Quarterly (Standard)</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                    </div>

                    {/* Tax Saver Toggle */}
                    <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                        <input
                            type="checkbox"
                            id="taxSaver"
                            checked={isTaxSaver}
                            onChange={(e) => setIsTaxSaver(e.target.checked)}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <div>
                            <label htmlFor="taxSaver" className="block text-sm font-bold text-blue-800 cursor-pointer">Tax Saver FD (5 Year Lock-in)</label>
                            <p className="text-xs text-blue-600">Eligible for tax deduction under Section 80C</p>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200 transition-all transform active:scale-95"
                        >
                            Save Investment
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
