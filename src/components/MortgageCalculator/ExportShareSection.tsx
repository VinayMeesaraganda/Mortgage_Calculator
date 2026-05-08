import React, { useState, useCallback } from 'react';
import { Twitter, Facebook, Linkedin, MessageCircle, Copy, CheckCircle } from 'lucide-react';
import ExportDropdown from '../ExportDropdown';

interface ExportShareSectionProps {
  onExportExcel: () => void;
  onExportPDF: () => void;
  onExportCSV: () => void;
  onEmailResults: () => void;
  propertyType: 'primary' | 'investment';
  showScenarioComparison: boolean;
  showRefinanceAnalysis: boolean;
  calculationData: {
    loanAmount: number;
    totalInterest: number;
    monthlyPayment: number;
    savingsAmount?: number;
    savingsYears?: number;
  };
}

const SITE_URL = 'https://mortgage-calculator-kappa-nine.vercel.app/';

const ExportShareSection: React.FC<ExportShareSectionProps> = ({
  onExportExcel,
  onExportPDF,
  onExportCSV,
  onEmailResults,
  propertyType,
  showScenarioComparison,
  showRefinanceAnalysis,
  calculationData,
}) => {
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const shareMessage = useCallback(() => {
    const { savingsAmount, savingsYears, loanAmount, totalInterest } = calculationData;
    if (savingsAmount && savingsAmount > 1000) {
      const savings = `$${Math.round(savingsAmount / 1000)}K`;
      const years = savingsYears ? ` and ${savingsYears.toFixed(1)} years` : '';
      return `💰 I'll save ${savings}${years} by switching to bi-weekly payments! Calculate yours at ${SITE_URL}`;
    }
    return `🏠 Just calculated my mortgage: $${Math.round(loanAmount / 1000)}K loan with $${Math.round(totalInterest / 1000)}K in total interest. Check yours at ${SITE_URL}`;
  }, [calculationData]);

  const msg = shareMessage();
  const encoded = encodeURIComponent(msg);

  const openWindow = (url: string) => window.open(url, '_blank', 'width=600,height=400');

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(msg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [msg]);

  return (
    <div className="mt-4 mb-6 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Export row */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Save Your Results</h3>
            <p className="text-xs text-slate-500 mt-0.5">Download a full report or email it to yourself</p>
          </div>
          <button
            type="button"
            onClick={() => setShowDetails(p => !p)}
            className="text-xs font-medium text-slate-500 hover:text-slate-700 transition"
          >
            {showDetails ? 'Hide' : "What's included?"}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <ExportDropdown
              onExportExcel={onExportExcel}
              onExportPDF={onExportPDF}
              onExportCSV={onExportCSV}
            />
          </div>
          <button
            onClick={onEmailResults}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            Email Results
          </button>
        </div>

        {showDetails && (
          <div className="mt-3 text-xs text-slate-500 space-y-0.5 pl-1">
            <p className="font-semibold text-slate-600 mb-1">Report includes:</p>
            <p>• Complete amortization schedule</p>
            {propertyType === 'investment' && <p>• Investment property analysis &amp; cash flow projections</p>}
            {showScenarioComparison && <p>• Loan comparison charts</p>}
            {showRefinanceAnalysis && <p>• Refinance analysis with break-even point</p>}
          </div>
        )}
      </div>

      {/* Share row */}
      <div className="p-5">
        <h3 className="text-base font-bold text-slate-800 mb-1">Share Your Results</h3>
        <p className="text-xs text-slate-500 mb-4">Help others discover smart mortgage strategies</p>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => openWindow(`https://twitter.com/intent/tweet?text=${encoded}&hashtags=mortgage,realestate`)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <Twitter className="w-4 h-4" /> Twitter
          </button>
          <button
            onClick={() => openWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SITE_URL)}&quote=${encoded}`)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <Facebook className="w-4 h-4" /> Facebook
          </button>
          <button
            onClick={() => openWindow(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SITE_URL)}`)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0A66C2] hover:bg-[#095196] text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <Linkedin className="w-4 h-4" /> LinkedIn
          </button>
          <button
            onClick={() => openWindow(`https://wa.me/?text=${encoded}`)}
            className="flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </button>
          <button
            onClick={copyLink}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {copied ? <><CheckCircle className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy link</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportShareSection;
