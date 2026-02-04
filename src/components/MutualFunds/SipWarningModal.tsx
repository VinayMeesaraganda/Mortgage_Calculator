import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface SipWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToOneTime: () => void;
}

const SipWarningModal: React.FC<SipWarningModalProps> = ({
  isOpen,
  onClose,
  onSwitchToOneTime
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Historical Performance - One-Time Only
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <p className="text-slate-700 mb-6">
            Historical Performance calculation is only available for <strong>One-Time</strong> investments.
            For SIP investments, please use the "Add to Portfolio" feature which will create purchase records for each month.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onSwitchToOneTime}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            >
              Switch to One-Time
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SipWarningModal;
