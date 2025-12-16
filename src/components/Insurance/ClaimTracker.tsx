import React, { useState } from 'react';
import { FileText, Plus, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import type { Claim, Insurance } from '../../types/insurance';
import { CLAIM_STATUS_COLORS } from '../../types/insurance';
import { formatCurrency } from '../../utils/formatting';
import { AddClaimModal } from './AddClaimModal';

interface ClaimTrackerProps {
    claims: Claim[];
    insurances: Insurance[];
    onAddClaim: (claim: Omit<Claim, 'id' | 'createdAt' | 'updatedAt'>) => void;
    onEditClaim: (claim: Claim) => void;
    onDeleteClaim: (claimId: string) => void;
}

export const ClaimTracker: React.FC<ClaimTrackerProps> = ({
    claims,
    insurances,
    onAddClaim,
    onEditClaim,
    onDeleteClaim
}) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedInsurance, setSelectedInsurance] = useState<Insurance | null>(null);
    const [editingClaim, setEditingClaim] = useState<Claim | undefined>(undefined);

    // Calculate statistics
    const totalClaims = claims.length;
    const settledClaims = claims.filter(c => c.status === 'settled');
    const totalClaimAmount = claims.reduce((sum, c) => sum + (c.claimAmount || 0), 0);
    const totalSettledAmount = settledClaims.reduce((sum, c) => sum + (c.settledAmount || 0), 0);
    const settlementRatio = totalClaims > 0 ? (settledClaims.length / totalClaims) * 100 : 0;
    const averageSettlementTime = settledClaims.length > 0
        ? settledClaims.reduce((sum, c) => {
            const filed = new Date(c.claimDate);
            const settled = new Date(c.settlementDate!);
            return sum + Math.ceil((settled.getTime() - filed.getTime()) / (1000 * 60 * 60 * 24));
        }, 0) / settledClaims.length
        : 0;

    const handleAddClaim = (insurance: Insurance) => {
        setSelectedInsurance(insurance);
        setEditingClaim(undefined);
        setIsAddModalOpen(true);
    };

    const handleEditClaim = (claim: Claim) => {
        const insurance = insurances.find(ins => ins.id === claim.insuranceId);
        if (insurance) {
            setSelectedInsurance(insurance);
            setEditingClaim(claim);
            setIsAddModalOpen(true);
        }
    };

    const getInsuranceForClaim = (claim: Claim) => {
        return insurances.find(ins => ins.id === claim.insuranceId);
    };

    if (totalClaims === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <div className="text-center">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-1">No Claims Yet</h3>
                    <p className="text-slate-500 text-sm mb-4">Track your insurance claims and settlement status</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {insurances.slice(0, 3).map(insurance => (
                            <button
                                key={insurance.id}
                                onClick={() => handleAddClaim(insurance)}
                                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                                Add Claim for {insurance.provider}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Total Claims</p>
                            <p className="text-2xl font-bold text-slate-800">{totalClaims}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Settlement Rate</p>
                            <p className="text-2xl font-bold text-slate-800">{settlementRatio.toFixed(0)}%</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Total Settled</p>
                            <p className="text-xl font-bold text-slate-800">{formatCurrency(totalSettledAmount)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Avg. Settlement</p>
                            <p className="text-2xl font-bold text-slate-800">{averageSettlementTime.toFixed(0)} days</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Claims List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Claims History</h3>
                        <p className="text-sm text-slate-500 mt-1">{claims.length} {claims.length === 1 ? 'claim' : 'claims'} tracked</p>
                    </div>
                    <button
                        onClick={() => {
                            if (insurances.length === 0) {
                                alert('Please add an insurance policy first before filing a claim.');
                                return;
                            }
                            // If only one insurance, use it directly
                            if (insurances.length === 1) {
                                handleAddClaim(insurances[0]);
                            } else {
                                // Show first insurance or let user select (for now, use first)
                                handleAddClaim(insurances[0]);
                            }
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                        <Plus size={18} />
                        Add Claim
                    </button>
                </div>

                <div className="divide-y divide-slate-100">
                    {claims.map((claim) => {
                        const insurance = getInsuranceForClaim(claim);
                        const statusColors = CLAIM_STATUS_COLORS[claim.status];
                        const daysAgo = Math.ceil((new Date().getTime() - new Date(claim.claimDate).getTime()) / (1000 * 60 * 60 * 24));

                        return (
                            <div key={claim.id} className="p-6 hover:bg-slate-50 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="font-semibold text-slate-800">{claim.claimNumber}</h4>
                                            <span className={`text-xs px-2 py-1 rounded-full ${statusColors.bg} ${statusColors.text} font-medium`}>
                                                {statusColors.label}
                                            </span>
                                        </div>

                                        <p className="text-sm text-slate-600 mb-3">{claim.description}</p>

                                        <div className="flex flex-wrap gap-4 text-sm">
                                            <div>
                                                <span className="text-slate-400">Policy:</span>
                                                <span className="font-semibold text-slate-700 ml-1">{insurance?.provider || 'Unknown'}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400">Filed:</span>
                                                <span className="font-semibold text-slate-700 ml-1">{daysAgo} days ago</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400">Claim Amount:</span>
                                                <span className="font-semibold text-slate-700 ml-1">{formatCurrency(claim.claimAmount)}</span>
                                            </div>
                                            {claim.settledAmount && (
                                                <div>
                                                    <span className="text-slate-400">Settled:</span>
                                                    <span className="font-semibold text-green-600 ml-1">{formatCurrency(claim.settledAmount)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEditClaim(claim)}
                                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm(`Delete claim ${claim.claimNumber}?`)) {
                                                    onDeleteClaim(claim.id);
                                                }
                                            }}
                                            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Add/Edit Claim Modal */}
            {selectedInsurance && (
                <AddClaimModal
                    isOpen={isAddModalOpen}
                    onClose={() => {
                        setIsAddModalOpen(false);
                        setEditingClaim(undefined);
                    }}
                    onSave={(claimData) => {
                        if (editingClaim) {
                            onEditClaim({ ...claimData, id: editingClaim.id, createdAt: editingClaim.createdAt, updatedAt: new Date().toISOString() } as Claim);
                        } else {
                            onAddClaim(claimData);
                        }
                    }}
                    insuranceId={selectedInsurance.id}
                    insuranceProvider={selectedInsurance.provider}
                    editClaim={editingClaim}
                />
            )}
        </div>
    );
};
