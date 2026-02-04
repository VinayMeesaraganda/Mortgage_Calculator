import React from 'react';
import { Check, ChevronDown, Loader2, PieChart, Search, TrendingUp, X } from 'lucide-react';
import type { User } from 'firebase/auth';
import type { Currency } from '../../types/mortgage';
import { CURRENCY_DATA } from '../../utils/currency';
import { CARD_STYLE, CARD_SHADOW, INPUT_STYLE } from '../../constants/styles';
import { HelpTooltip } from '../HelpTooltip';
import { DatePicker } from '../DatePicker';

interface AddMutualFundFormProps {
  showAddForm: boolean;
  onToggleShowForm: () => void;
  currentUser: User | null;
  addingPurchaseToHoldingId: string | null;
  newSchemeCode: string;
  setNewSchemeCode: (value: string) => void;
  newSchemeName: string;
  setNewSchemeName: (value: string) => void;
  newInvestmentAmount: string;
  setNewInvestmentAmount: (value: string) => void;
  newInvestmentType: 'onetime' | 'sip';
  setNewInvestmentType: (value: 'onetime' | 'sip') => void;
  newPurchaseDate: string;
  setNewPurchaseDate: (value: string) => void;
  newSipEndDate: string;
  setNewSipEndDate: (value: string) => void;
  useManualNAV: boolean;
  setUseManualNAV: (value: boolean) => void;
  manualNAV: string;
  setManualNAV: (value: string) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  searchResults: Array<{ schemeCode: string; schemeName: string }>;
  isSearching: boolean;
  onSearch: () => void;
  onSelectFund: (schemeCode: string, schemeName: string) => void;
  onLoadHistoricalData: (schemeCode: string) => void;
  isLoadingHistorical: boolean;
  onCalculateHistoricalPerformance: () => void;
  isLoadingNAV: boolean;
  onAddFund: () => void;
  selectedCurrency: Currency;
}

const AddMutualFundForm: React.FC<AddMutualFundFormProps> = ({
  showAddForm,
  onToggleShowForm,
  currentUser,
  addingPurchaseToHoldingId,
  newSchemeCode,
  setNewSchemeCode,
  newSchemeName,
  setNewSchemeName,
  newInvestmentAmount,
  setNewInvestmentAmount,
  newInvestmentType,
  setNewInvestmentType,
  newPurchaseDate,
  setNewPurchaseDate,
  newSipEndDate,
  setNewSipEndDate,
  useManualNAV,
  setUseManualNAV,
  manualNAV,
  setManualNAV,
  searchQuery,
  setSearchQuery,
  searchResults,
  isSearching,
  onSearch,
  onSelectFund,
  onLoadHistoricalData,
  isLoadingHistorical,
  onCalculateHistoricalPerformance,
  isLoadingNAV,
  onAddFund,
  selectedCurrency
}) => {
  return (
    <div className={CARD_STYLE} style={CARD_SHADOW}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-600" />
            {showAddForm ? 'Add Mutual Fund to Portfolio' : currentUser ? 'Portfolio Tracker' : 'Explore Mutual Funds'}
          </h2>
          <button
            onClick={onToggleShowForm}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
          >
            {showAddForm ? (
              <>
                <X className="w-4 h-4" />
                Cancel
              </>
            ) : (
              <>
                <ChevronDown className={`w-4 h-4 transition-transform ${showAddForm ? 'rotate-180' : ''}`} />
                {currentUser ? 'Add Fund' : 'Explore Funds'}
              </>
            )}
          </button>
        </div>

        {showAddForm && (
          <div className="bg-slate-50 rounded-lg p-4 border-2 border-purple-200">
            {addingPurchaseToHoldingId ? (
              <div className="mb-4 p-3 bg-purple-100 rounded-lg border border-purple-300">
                <p className="text-sm font-semibold text-purple-800">
                  Adding another purchase to: <span className="font-bold">{newSchemeName}</span>
                </p>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Search Mutual Funds
                  <HelpTooltip content="Search for mutual funds by name. Results are fetched from MFapi.in (India's free mutual fund API)." />
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                    placeholder="e.g., HDFC Large Cap Fund"
                    className={`${INPUT_STYLE} flex-1`}
                  />
                  <button
                    onClick={onSearch}
                    disabled={isSearching}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Search
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-2 bg-white border border-slate-200 rounded-lg max-h-48 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-4 py-2 hover:bg-purple-50 border-b border-slate-100 last:border-b-0 transition-colors"
                      >
                        <button
                          onClick={() => onSelectFund(result.schemeCode, result.schemeName)}
                          className="flex-1 text-left"
                        >
                          <div className="font-semibold text-slate-800">{result.schemeName}</div>
                          <div className="text-xs text-slate-500">Code: {result.schemeCode}</div>
                        </button>
                        <button
                          onClick={() => onLoadHistoricalData(result.schemeCode)}
                          className="ml-2 px-3 py-1.5 text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg transition-all flex items-center gap-1.5"
                          title="View Historical Performance"
                        >
                          <TrendingUp className="w-3 h-3" />
                          <span className="hidden sm:inline">History</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Scheme Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSchemeCode}
                  onChange={(e) => setNewSchemeCode(e.target.value)}
                  placeholder="e.g., 101206"
                  disabled={!!addingPurchaseToHoldingId}
                  className={`${INPUT_STYLE} ${addingPurchaseToHoldingId ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Scheme Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSchemeName}
                  onChange={(e) => setNewSchemeName(e.target.value)}
                  placeholder="e.g., HDFC Large Cap Fund"
                  disabled={!!addingPurchaseToHoldingId}
                  className={`${INPUT_STYLE} ${addingPurchaseToHoldingId ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  {newInvestmentType === 'sip' ? 'Monthly SIP Amount' : 'Investment Amount'} <span className="text-red-500">*</span>
                  <HelpTooltip
                    content={
                      newInvestmentType === 'sip'
                        ? 'Monthly SIP amount. Multiple purchase records will be created for each month.'
                        : 'Total amount invested. Units will be calculated based on current NAV.'
                    }
                  />
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newInvestmentAmount}
                    onChange={(e) => setNewInvestmentAmount(e.target.value)}
                    placeholder={`${CURRENCY_DATA[selectedCurrency].symbol}0.00`}
                    className={`${INPUT_STYLE} flex-1`}
                  />
                  <div className="flex gap-1 bg-white rounded-lg p-0.5 border border-slate-300">
                    <button
                      type="button"
                      onClick={() => setNewInvestmentType('onetime')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                        newInvestmentType === 'onetime'
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      One Time
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewInvestmentType('sip')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                        newInvestmentType === 'sip'
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      SIP
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  {newInvestmentType === 'sip' ? 'SIP Start Date' : 'Purchase Date'} <span className="text-red-500">*</span>
                </label>
                <DatePicker value={newPurchaseDate} onChange={setNewPurchaseDate} />
              </div>
              {newInvestmentType === 'sip' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    SIP End Date <span className="text-red-500">*</span>
                    <HelpTooltip content="Last date of SIP. Purchase records will be created for each month from start date to end date." />
                  </label>
                  <DatePicker value={newSipEndDate} onChange={setNewSipEndDate} />
                </div>
              )}
            </div>

            <div className="mt-4 p-4 bg-slate-50 rounded-lg border-2 border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useManualNAV}
                  onChange={(e) => {
                    setUseManualNAV(e.target.checked);
                    if (!e.target.checked) {
                      setManualNAV('');
                    }
                  }}
                  className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500 focus:ring-2"
                />
                <span className="text-sm font-semibold text-slate-700">
                  Enter NAV manually (allotment price or custom NAV)
                </span>
              </label>

              {useManualNAV && (
                <div className="mt-3">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    NAV at Purchase Date <span className="text-red-500">*</span>
                    <HelpTooltip content="Enter the NAV (Net Asset Value) at the time of purchase. This is typically the allotment price for new investments." />
                  </label>
                  <input
                    type="text"
                    value={manualNAV}
                    onChange={(e) => setManualNAV(e.target.value)}
                    placeholder="e.g., 45.25"
                    className={INPUT_STYLE}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Units will be calculated as: Investment Amount ÷ NAV
                  </p>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onCalculateHistoricalPerformance}
                disabled={isLoadingHistorical || !newSchemeCode || !newInvestmentAmount || !newPurchaseDate || newInvestmentType === 'sip'}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title={newInvestmentType === 'sip' ? 'Historical Performance is only available for One-Time investments' : ''}
              >
                {isLoadingHistorical ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-5 h-5" />
                    Historical Performance
                  </>
                )}
              </button>
              <button
                onClick={onAddFund}
                disabled={isLoadingNAV}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoadingNAV ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Fetching NAV...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    {addingPurchaseToHoldingId ? 'Add Purchase' : 'Add to Portfolio'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddMutualFundForm;
