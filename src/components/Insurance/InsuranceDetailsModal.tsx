import React from 'react';
import { X } from 'lucide-react';
import type { Insurance } from '../../types/insurance';
import { formatCurrency } from '../../utils/formatting';

interface InsuranceDetailsModalProps {
  insurance: Insurance | null;
  onClose: () => void;
}

const InsuranceDetailsModal: React.FC<InsuranceDetailsModalProps> = ({ insurance, onClose }) => {
  if (!insurance) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800">Policy Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Provider</p>
              <p className="font-semibold">{insurance.provider}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Policy Number</p>
              <p className="font-semibold">{insurance.policyNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Premium</p>
              <p className="font-semibold">
                {formatCurrency(insurance.premium || 0)} / {insurance.paymentFrequency || 'annual'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Coverage Period</p>
              <p className="font-semibold">
                {new Date(insurance.startDate).toLocaleDateString()} -
                {new Date(insurance.coverageEndDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Premium Payment End</p>
              <p className="font-semibold">{new Date(insurance.premiumPaymentEndDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-semibold capitalize">{insurance.status.replace('_', ' ')}</p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="font-semibold text-gray-800 mb-3">Coverage Details</h3>
            {insurance.category === 'health' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Sum Insured</p>
                  <p className="font-semibold">{formatCurrency(insurance.sumInsured || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Deductible</p>
                  <p className="font-semibold">{formatCurrency(insurance.deductible || 0)}</p>
                </div>
              </div>
            )}
            {insurance.category === 'life' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Coverage Amount</p>
                  <p className="font-semibold">{formatCurrency(insurance.coverageAmount || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nominee</p>
                  <p className="font-semibold">{insurance.nominee || 'Not specified'}</p>
                </div>
              </div>
            )}
            {insurance.category === 'auto' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Vehicle</p>
                  <p className="font-semibold">{insurance.vehicleDetails || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">IDV</p>
                  <p className="font-semibold">{formatCurrency(insurance.idv || 0)}</p>
                </div>
              </div>
            )}
            {insurance.category === 'home' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Structure Cover</p>
                  <p className="font-semibold">{formatCurrency(insurance.structureCover || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contents Cover</p>
                  <p className="font-semibold">{formatCurrency(insurance.contentsCover || 0)}</p>
                </div>
              </div>
            )}
          </div>

          {insurance.notes && (
            <div className="border-t border-gray-100 pt-4">
              <h3 className="font-semibold text-gray-800 mb-2">Notes</h3>
              <p className="text-gray-600 text-sm">{insurance.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InsuranceDetailsModal;
