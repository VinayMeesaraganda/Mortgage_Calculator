import React from 'react';
import { AlertCircle, Cloud, CloudOff, Loader2, RefreshCw } from 'lucide-react';
import type { User } from 'firebase/auth';

interface PortfolioSyncStatusProps {
  isLoadingPortfolio: boolean;
  currentUser: User | null;
  isSaving: boolean;
  isSynced: boolean;
  isRefreshingNAVs: boolean;
  lastRefreshTime: Date | null;
  holdingsCount: number;
  saveError: string | null;
  onRefreshAllNAVs: () => void;
}

const PortfolioSyncStatus: React.FC<PortfolioSyncStatusProps> = ({
  isLoadingPortfolio,
  currentUser,
  isSaving,
  isSynced,
  isRefreshingNAVs,
  lastRefreshTime,
  holdingsCount,
  saveError,
  onRefreshAllNAVs
}) => {
  if (isLoadingPortfolio || !currentUser) {
    return null;
  }

  return (
    <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-slate-600">Saving...</span>
            </>
          ) : isSynced ? (
            <>
              <Cloud className="w-4 h-4 text-green-600" />
              <span className="text-green-600">Synced</span>
            </>
          ) : (
            <>
              <CloudOff className="w-4 h-4 text-yellow-600" />
              <span className="text-yellow-600">Not synced</span>
            </>
          )}
        </div>

        {holdingsCount > 0 && (
          <div className="flex items-center gap-2 text-sm">
            {isRefreshingNAVs ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                <span className="text-slate-600">Updating NAVs...</span>
              </>
            ) : lastRefreshTime ? (
              <>
                <RefreshCw className="w-4 h-4 text-purple-600" />
                <span className="text-slate-600">
                  NAVs updated {lastRefreshTime.toLocaleTimeString()}
                </span>
              </>
            ) : null}
            <button
              onClick={onRefreshAllNAVs}
              disabled={isRefreshingNAVs}
              className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
              title="Refresh all NAVs"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshingNAVs ? 'animate-spin' : ''}`} />
              Refresh NAVs
            </button>
          </div>
        )}
      </div>

      {saveError && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold mb-1">Error Saving Portfolio</p>
            <p className="text-xs">{saveError}</p>
            {saveError.includes('security rules') && (
              <p className="text-xs mt-2 text-red-700">
                Please update your Firestore security rules to allow writes to the mutualFunds collection.
                See FIREBASE_QUICK_START.md for instructions.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioSyncStatus;
