import React from 'react';
import ExportDropdown from '../ExportDropdown';

interface ExportShareSectionProps {
  onExportExcel: () => void;
  onExportPDF: () => void;
  onExportCSV: () => void;
  onEmailResults: () => void;
  propertyType: 'primary' | 'investment';
  showScenarioComparison: boolean;
  showRefinanceAnalysis: boolean;
}

const ExportShareSection: React.FC<ExportShareSectionProps> = ({
  onExportExcel,
  onExportPDF,
  onExportCSV,
  onEmailResults,
  propertyType,
  showScenarioComparison,
  showRefinanceAnalysis
}) => {
  return (
    <div className="mt-4 mb-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border-2 border-emerald-300 shadow-md">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
          <span className="text-2xl">📊</span>
          Save & Share Your Results
        </h3>
        <p className="text-sm text-slate-600">
          Download complete reports in Excel, PDF, or CSV format
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch gap-3">
        <div className="flex-1">
          <ExportDropdown
            onExportExcel={onExportExcel}
            onExportPDF={onExportPDF}
            onExportCSV={onExportCSV}
          />
        </div>
        <button
          onClick={onEmailResults}
          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-base"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
          Email Results
        </button>
      </div>
      <div className="mt-3 text-xs text-slate-600 space-y-1">
        <p className="font-semibold">Report Includes:</p>
        <ul className="list-disc list-inside space-y-0.5 ml-2">
          <li>Complete amortization schedule</li>
          {propertyType === 'investment' && <li>Investment Property Analysis with cash flow projections</li>}
          {showScenarioComparison && <li>Loan Comparison Charts</li>}
          {showRefinanceAnalysis && <li>Refinance Analysis with break-even point</li>}
        </ul>
      </div>
    </div>
  );
};

export default ExportShareSection;
