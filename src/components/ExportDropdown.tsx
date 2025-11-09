import React, { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';

interface ExportDropdownProps {
  onExportExcel: () => void;
  onExportPDF: () => void;
  onExportCSV: () => void;
}

export const ExportDropdown: React.FC<ExportDropdownProps> = ({
  onExportExcel,
  onExportPDF,
  onExportCSV
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleExport = (exportFn: () => void) => {
    exportFn();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-base"
      >
        <Download size={20} />
        <span>Download Report</span>
        <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl border-2 border-slate-200 z-50 overflow-hidden animate-fadeIn">
          <button
            onClick={() => handleExport(onExportExcel)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors border-b border-slate-100"
          >
            <FileSpreadsheet size={18} className="text-emerald-600" />
            <div className="text-left">
              <div className="font-semibold text-slate-800 text-sm">Excel (XLSX)</div>
              <div className="text-xs text-slate-600">Full report with charts</div>
            </div>
          </button>

          <button
            onClick={() => handleExport(onExportPDF)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors border-b border-slate-100"
          >
            <FileText size={18} className="text-red-600" />
            <div className="text-left">
              <div className="font-semibold text-slate-800 text-sm">PDF Document</div>
              <div className="text-xs text-slate-600">Printable report</div>
            </div>
          </button>

          <button
            onClick={() => handleExport(onExportCSV)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors"
          >
            <FileSpreadsheet size={18} className="text-blue-600" />
            <div className="text-left">
              <div className="font-semibold text-slate-800 text-sm">CSV File</div>
              <div className="text-xs text-slate-600">Amortization schedule only</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(ExportDropdown);

