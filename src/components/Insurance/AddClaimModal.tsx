import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Claim, ClaimStatus } from '../../types/insurance';

interface AddClaimModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (claim: Omit<Claim, 'id' | 'createdAt' | 'updatedAt'>) => void;
    insuranceId: string;
    insuranceProvider: string;
    editClaim?: Claim;
}

export const AddClaimModal: React.FC<AddClaimModalProps> = ({
    isOpen,
    onClose,
    onSave,
    insuranceId,
    insuranceProvider,
    editClaim
}) => {
    const [claimNumber, setClaimNumber] = useState(editClaim?.claimNumber || '');
    const [claimDate, setClaimDate] = useState(editClaim?.claimDate || new Date().toISOString().split('T')[0]);
    const [claimAmount, setClaimAmount] = useState(editClaim?.claimAmount.toString() || '');
    const [approvedAmount, setApprovedAmount] = useState(editClaim?.approvedAmount?.toString() || '');
    const [settledAmount, setSettledAmount] = useState(editClaim?.settledAmount?.toString() || '');
    const [status, setStatus] = useState<ClaimStatus>(editClaim?.status || 'filed');
    const [description, setDescription] = useState(editClaim?.description || '');
    const [settlementDate, setSettlementDate] = useState(editClaim?.settlementDate || '');
    const [rejectionReason, setRejectionReason] = useState(editClaim?.rejectionReason || '');
    const [notes, setNotes] = useState(editClaim?.notes || '');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const claimData: Omit<Claim, 'id' | 'createdAt' | 'updatedAt'> = {
            insuranceId,
            claimNumber,
            claimDate,
            claimAmount: parseFloat(claimAmount),
            approvedAmount: approvedAmount ? parseFloat(approvedAmount) : undefined,
            settledAmount: settledAmount ? parseFloat(settledAmount) : undefined,
            status,
            description,
            settlementDate: settlementDate || undefined,
            rejectionReason: rejectionReason || undefined,
            notes: notes || undefined
        };

        onSave(claimData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">
                            {editClaim ? 'Edit Claim' : 'Add New Claim'}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">For {insuranceProvider}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Claim Number *</label>
                            <input
                                type="text"
                                value={claimNumber}
                                onChange={(e) => setClaimNumber(e.target.value)}
                                placeholder="CLM-2024-001"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Claim Date *</label>
                            <input
                                type="date"
                                value={claimDate}
                                onChange={(e) => setClaimDate(e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the claim..."
                            rows={3}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none resize-none"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Claim Amount (₹) *</label>
                            <input
                                type="number"
                                value={claimAmount}
                                onChange={(e) => setClaimAmount(e.target.value)}
                                placeholder="50000"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Approved Amount (₹)</label>
                            <input
                                type="number"
                                value={approvedAmount}
                                onChange={(e) => setApprovedAmount(e.target.value)}
                                placeholder="45000"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Settled Amount (₹)</label>
                            <input
                                type="number"
                                value={settledAmount}
                                onChange={(e) => setSettledAmount(e.target.value)}
                                placeholder="45000"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as ClaimStatus)}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                            >
                                <option value="filed">Filed</option>
                                <option value="under_review">Under Review</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="settled">Settled</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Settlement Date</label>
                            <input
                                type="date"
                                value={settlementDate}
                                onChange={(e) => setSettlementDate(e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                            />
                        </div>
                    </div>

                    {status === 'rejected' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason</label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Reason for rejection..."
                                rows={2}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none resize-none"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Additional notes..."
                            rows={2}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none resize-none"
                        />
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
                            {editClaim ? 'Update Claim' : 'Add Claim'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
