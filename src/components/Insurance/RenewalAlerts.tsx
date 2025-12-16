import React from 'react';
import { Bell, AlertTriangle, Clock } from 'lucide-react';
import type { Insurance } from '../../types/insurance';
import { formatCurrency } from '../../utils/formatting';
import { INSURANCE_COLORS, CATEGORY_LABELS } from '../../types/insurance';

interface RenewalAlertsProps {
    insurances: Insurance[];
    onViewPolicy: (insurance: Insurance) => void;
}

export const RenewalAlerts: React.FC<RenewalAlertsProps> = ({ insurances, onViewPolicy }) => {
    const today = new Date();

    // Calculate days until expiry for each policy
    const policiesWithDays = insurances
        .filter(ins => ins.coverageEndDate)
        .map(ins => {
            const expiryDate = new Date(ins.coverageEndDate);
            const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return { ...ins, daysUntilExpiry, expiryDate };
        })
        .filter(ins => ins.daysUntilExpiry > 0 && ins.daysUntilExpiry <= 90) // Show policies expiring in next 90 days
        .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

    if (policiesWithDays.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
                <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-slate-700 mb-1">No Upcoming Renewals</h3>
                <p className="text-slate-500 text-sm">All your policies are valid for more than 90 days</p>
            </div>
        );
    }

    const getUrgencyLevel = (days: number) => {
        if (days <= 7) return { level: 'critical', color: 'red', label: 'Urgent' };
        if (days <= 15) return { level: 'high', color: 'orange', label: 'High Priority' };
        if (days <= 30) return { level: 'medium', color: 'amber', label: 'Medium Priority' };
        if (days <= 60) return { level: 'low', color: 'yellow', label: 'Low Priority' };
        return { level: 'info', color: 'blue', label: 'Upcoming' };
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-orange-50 to-red-50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                        <Bell className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Renewal Alerts</h2>
                        <p className="text-sm text-slate-600">{policiesWithDays.length} {policiesWithDays.length === 1 ? 'policy' : 'policies'} expiring soon</p>
                    </div>
                </div>
            </div>

            <div className="divide-y divide-slate-100">
                {policiesWithDays.map((policy) => {
                    const urgency = getUrgencyLevel(policy.daysUntilExpiry);
                    const colors = INSURANCE_COLORS[policy.category];

                    return (
                        <div
                            key={policy.id}
                            className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                            onClick={() => onViewPolicy(policy)}
                        >
                            <div className="flex items-start gap-4">
                                {/* Urgency Indicator */}
                                <div className={`flex-shrink-0 w-1 h-16 rounded-full bg-${urgency.color}-500`} />

                                {/* Policy Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-slate-800 truncate">{policy.provider}</h3>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} font-medium`}>
                                                    {CATEGORY_LABELS[policy.category]}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500">Policy #{policy.policyNumber}</p>
                                        </div>

                                        {/* Days Remaining Badge */}
                                        <div className={`flex-shrink-0 px-3 py-1 rounded-lg bg-${urgency.color}-100 border border-${urgency.color}-200`}>
                                            <div className="flex items-center gap-1.5">
                                                {policy.daysUntilExpiry <= 15 && (
                                                    <AlertTriangle className={`w-4 h-4 text-${urgency.color}-600`} />
                                                )}
                                                <span className={`text-sm font-bold text-${urgency.color}-700`}>
                                                    {policy.daysUntilExpiry} {policy.daysUntilExpiry === 1 ? 'day' : 'days'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-slate-600">
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            <span>Expires: {policy.expiryDate.toLocaleDateString()}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400">Premium:</span>
                                            <span className="font-semibold ml-1">{formatCurrency(policy.premium || 0)}/{policy.paymentFrequency || 'annual'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
