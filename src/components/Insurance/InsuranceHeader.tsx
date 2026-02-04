import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Plus, Printer } from 'lucide-react';

interface InsuranceHeaderProps {
  isSaving: boolean;
  isLoading: boolean;
  onExport: () => void;
  onPrint: () => void;
  onAddPolicy: () => void;
}

const InsuranceHeader: React.FC<InsuranceHeaderProps> = ({
  isSaving,
  isLoading,
  onExport,
  onPrint,
  onAddPolicy
}) => {
  return (
    <div className="flex flex-col space-y-4">
      <Link to="/" className="inline-flex items-center text-slate-500 hover:text-blue-600 transition-colors w-fit">
        <ArrowLeft size={20} className="mr-2" />
        Back to Dashboard
      </Link>

      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Insurance Tracker</h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">
            Track policies, manage renewals, and optimize coverage
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isSaving && <span className="text-sm text-gray-500 self-center">Saving...</span>}
          <button
            onClick={onExport}
            className="flex-1 sm:flex-none px-4 py-3 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors min-h-[44px]"
            title="Export to CSV"
          >
            <Download size={18} />
            <span>Export</span>
          </button>
          <button
            onClick={onPrint}
            className="flex-1 sm:flex-none px-4 py-3 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors min-h-[44px]"
            title="Print"
          >
            <Printer size={18} />
            <span>Print</span>
          </button>
          <button
            onClick={onAddPolicy}
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl font-semibold shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-transform active:scale-95 min-h-[44px]"
          >
            <Plus size={20} /> Add Policy
          </button>
        </div>
      </div>
    </div>
  );
};

export default InsuranceHeader;
