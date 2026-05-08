import React from 'react';
import { createPortal } from 'react-dom';

interface SaveMortgageModalProps {
  isOpen: boolean;
  isUpdate: boolean;
  mortgageName: string;
  onMortgageNameChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const SaveMortgageModal: React.FC<SaveMortgageModalProps> = ({
  isOpen,
  isUpdate,
  mortgageName,
  onMortgageNameChange,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-2">
          {isUpdate ? 'Update Mortgage Tracker?' : 'Save & Track This Mortgage?'}
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          {isUpdate
            ? 'Update the selected mortgage with the current values. Changes will be reflected in the tracker below.'
            : 'Save this mortgage to track it over time. You can view all your saved mortgages in the tracker below.'}
        </p>
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Mortgage Name
          </label>
          <input
            type="text"
            value={mortgageName}
            onChange={(e) => onMortgageNameChange(e.target.value)}
            placeholder="e.g., Primary Home, Investment Property"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && mortgageName.trim()) {
                onConfirm();
              } else if (e.key === 'Escape') {
                onCancel();
              }
            }}
            autoFocus
          />
          {isUpdate && (
            <p className="text-xs text-slate-500 mt-1">
              Note: A mortgage with the same name cannot exist. The selected mortgage will be updated with the current values.
            </p>
          )}
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold bg-slate-400 hover:bg-slate-500 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!mortgageName.trim()}
            className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdate ? 'Confirm & Update' : 'Confirm & Save'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SaveMortgageModal;
