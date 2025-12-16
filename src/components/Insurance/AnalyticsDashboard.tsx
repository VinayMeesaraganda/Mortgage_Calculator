import React from 'react';
import { TrendingUp, PieChart, BarChart3, Activity } from 'lucide-react';
import type { Insurance } from '../../types/insurance';
import { INSURANCE_COLORS, CATEGORY_LABELS } from '../../types/insurance';
import { formatCurrency } from '../../utils/formatting';

interface AnalyticsDashboardProps {
    insurances: Insurance[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ insurances }) => {
    // Calculate premium breakdown by category
    const premiumByCategory = insurances.reduce((acc, ins) => {
        const category = ins.category;
        const annualPremium = calculateAnnualPremium(ins.premium, ins.paymentFrequency);
        acc[category] = (acc[category] || 0) + annualPremium;
        return acc;
    }, {} as Record<string, number>);

    // Calculate coverage breakdown by category
    const coverageByCategory = insurances.reduce((acc, ins) => {
        const category = ins.category;
        let coverage = 0;

        if (ins.category === 'health') coverage = ins.sumInsured || 0;
        else if (ins.category === 'life') coverage = ins.coverageAmount || 0;
        else if (ins.category === 'auto') coverage = ins.idv || 0;
        else if (ins.category === 'home') coverage = (ins.structureCover || 0) + (ins.contentsCover || 0);

        acc[category] = (acc[category] || 0) + coverage;
        return acc;
    }, {} as Record<string, number>);

    const totalPremium = Object.values(premiumByCategory).reduce((sum, val) => sum + val, 0);
    const totalCoverage = Object.values(coverageByCategory).reduce((sum, val) => sum + val, 0);
    const coverageToPremiumumRatio = totalPremium > 0 ? totalCoverage / totalPremium : 0;

    // Policy count by category
    const policyCount = insurances.reduce((acc, ins) => {
        acc[ins.category] = (acc[ins.category] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const categories = Object.keys(premiumByCategory) as Array<keyof typeof CATEGORY_LABELS>;

    if (insurances.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
                <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-slate-700 mb-1">No Data Available</h3>
                <p className="text-slate-500 text-sm">Add insurance policies to see analytics</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-600 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <h4 className="font-semibold text-blue-900">Total Annual Premium</h4>
                    </div>
                    <p className="text-3xl font-bold text-blue-900">{formatCurrency(totalPremium)}</p>
                    <p className="text-sm text-blue-700 mt-1">Across {insurances.length} policies</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-600 rounded-lg">
                            <PieChart className="w-5 h-5 text-white" />
                        </div>
                        <h4 className="font-semibold text-green-900">Total Coverage</h4>
                    </div>
                    <p className="text-3xl font-bold text-green-900">{formatCurrency(totalCoverage)}</p>
                    <p className="text-sm text-green-700 mt-1">{categories.length} categories covered</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-600 rounded-lg">
                            <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        <h4 className="font-semibold text-purple-900">Coverage Ratio</h4>
                    </div>
                    <p className="text-3xl font-bold text-purple-900">{coverageToPremiumumRatio.toFixed(0)}x</p>
                    <p className="text-sm text-purple-700 mt-1">Coverage per ₹1 premium</p>
                </div>
            </div>

            {/* Premium Breakdown */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-blue-600" />
                    Premium Distribution by Category
                </h3>
                <div className="space-y-3">
                    {categories.map((category) => {
                        const premium = premiumByCategory[category];
                        const percentage = (premium / totalPremium) * 100;
                        const colors = INSURANCE_COLORS[category];

                        return (
                            <div key={category} className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${colors.accent}`} />
                                        <span className="font-medium text-slate-700">{CATEGORY_LABELS[category]}</span>
                                        <span className="text-slate-400">({policyCount[category]} {policyCount[category] === 1 ? 'policy' : 'policies'})</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-semibold text-slate-800">{formatCurrency(premium)}</span>
                                        <span className="text-slate-500">{percentage.toFixed(1)}%</span>
                                    </div>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div
                                        className={`h-full ${colors.accent} transition-all duration-500`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Coverage Breakdown */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-green-600" />
                    Coverage Amount by Category
                </h3>
                <div className="space-y-3">
                    {categories.map((category) => {
                        const coverage = coverageByCategory[category];
                        const percentage = (coverage / totalCoverage) * 100;
                        const colors = INSURANCE_COLORS[category];

                        return (
                            <div key={category} className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${colors.accent}`} />
                                        <span className="font-medium text-slate-700">{CATEGORY_LABELS[category]}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-semibold text-slate-800">{formatCurrency(coverage)}</span>
                                        <span className="text-slate-500">{percentage.toFixed(1)}%</span>
                                    </div>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div
                                        className={`h-full ${colors.accent} transition-all duration-500`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Policy Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h4 className="font-semibold text-slate-800 mb-4">Policy Status</h4>
                    <div className="space-y-3">
                        {['active', 'expiring_soon', 'expired'].map((status) => {
                            const count = insurances.filter(ins => ins.status === status).length;
                            const statusColors = {
                                active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
                                expiring_soon: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Expiring Soon' },
                                expired: { bg: 'bg-red-100', text: 'text-red-700', label: 'Expired' }
                            }[status];

                            if (count === 0) return null;

                            return (
                                <div key={status} className="flex items-center justify-between">
                                    <span className={`text-sm px-3 py-1 rounded-full ${statusColors?.bg} ${statusColors?.text} font-medium`}>
                                        {statusColors?.label}
                                    </span>
                                    <span className="text-2xl font-bold text-slate-800">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h4 className="font-semibold text-slate-800 mb-4">Average Premium by Category</h4>
                    <div className="space-y-3">
                        {categories.map((category) => {
                            const avgPremium = premiumByCategory[category] / policyCount[category];
                            const colors = INSURANCE_COLORS[category];

                            return (
                                <div key={category} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${colors.accent}`} />
                                        <span className="text-sm text-slate-600">{CATEGORY_LABELS[category]}</span>
                                    </div>
                                    <span className="font-semibold text-slate-800">{formatCurrency(avgPremium)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper function
function calculateAnnualPremium(premium: number, frequency: string): number {
    switch (frequency) {
        case 'monthly': return premium * 12;
        case 'quarterly': return premium * 4;
        case 'half_yearly': return premium * 2;
        case 'annual': return premium;
        default: return premium;
    }
}
