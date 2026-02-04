import React from 'react';
import { Check, ChevronDown, ChevronUp, Edit2, Search, ShoppingCart, Trash2, X } from 'lucide-react';
import type { StockTransaction } from '../../types/stock';
import { formatCurrency } from '../../utils/formatting';
import { CARD_STYLE, CARD_SHADOW } from '../../constants/styles';

type StockTransactionWithMeta = StockTransaction & { stockSymbol: string; stockId: string };

interface StockTransactionsTableProps {
  isTransactionsExpanded: boolean;
  onToggleExpanded: () => void;
  filteredTransactions: StockTransactionWithMeta[];
  transactionSearchQuery: string;
  setTransactionSearchQuery: (value: string) => void;
  editingTransactionId: string | null;
  setEditingTransactionId: (value: string | null) => void;
  editTransactionPrice: string;
  setEditTransactionPrice: (value: string) => void;
  editTransactionQuantity: string;
  setEditTransactionQuantity: (value: string) => void;
  editTransactionDate: string;
  setEditTransactionDate: (value: string) => void;
  editTransactionType: 'buy' | 'sell';
  setEditTransactionType: (value: 'buy' | 'sell') => void;
  onStartEditTransaction: (stockId: string, transactionId: string) => void;
  onUpdateTransaction: (stockId: string, transactionId: string, updates: Partial<StockTransaction>) => void;
  onDeleteTransaction: (stockId: string, transactionId: string) => void;
  onInvalidEdit: () => void;
}

const StockTransactionsTable: React.FC<StockTransactionsTableProps> = ({
  isTransactionsExpanded,
  onToggleExpanded,
  filteredTransactions,
  transactionSearchQuery,
  setTransactionSearchQuery,
  editingTransactionId,
  setEditingTransactionId,
  editTransactionPrice,
  setEditTransactionPrice,
  editTransactionQuantity,
  setEditTransactionQuantity,
  editTransactionDate,
  setEditTransactionDate,
  editTransactionType,
  setEditTransactionType,
  onStartEditTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onInvalidEdit
}) => {
  return (
    <div className={CARD_STYLE} style={CARD_SHADOW}>
      <div className="p-6">
        <button
          onClick={onToggleExpanded}
          className="w-full flex items-center justify-between mb-4 hover:bg-slate-50 -m-2 p-2 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-2">
            {isTransactionsExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-600" />
            )}
            <h2 className="text-xl font-bold text-slate-800">All Transactions</h2>
            <span className="text-sm text-slate-500 font-normal">({filteredTransactions.length})</span>
          </div>
          {isTransactionsExpanded && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={transactionSearchQuery}
                  onChange={(e) => setTransactionSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Search by stock name..."
                  className="pl-10 pr-4 py-2 border-2 border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              {transactionSearchQuery && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTransactionSearchQuery('');
                  }}
                  className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </button>
        {isTransactionsExpanded && (
          <>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">
                  {transactionSearchQuery ? 'No transactions found for this search' : 'No transactions yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b-2 border-slate-300">
                      <th className="text-left p-3 text-sm font-bold text-slate-700">Date</th>
                      <th className="text-left p-3 text-sm font-bold text-slate-700">Stock Name</th>
                      <th className="text-center p-3 text-sm font-bold text-slate-700">Type</th>
                      <th className="text-right p-3 text-sm font-bold text-slate-700">Price</th>
                      <th className="text-right p-3 text-sm font-bold text-slate-700">Quantity</th>
                      <th className="text-right p-3 text-sm font-bold text-slate-700">Value</th>
                      <th className="text-center p-3 text-sm font-bold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction) => {
                      const transValue = transaction.price * transaction.quantity;
                      const isEditing = editingTransactionId === transaction.id;

                      return (
                        <tr
                          key={transaction.id}
                          className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${
                            transaction.type === 'buy' ? 'bg-green-50/30' : 'bg-red-50/30'
                          }`}
                        >
                          <td className="p-3 text-sm font-semibold text-slate-700">{transaction.date}</td>
                          <td className="p-3">
                            <span className="font-bold text-slate-800">{transaction.stockSymbol}</span>
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-1 rounded text-xs font-bold ${
                                transaction.type === 'buy'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {transaction.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3 text-right text-sm font-semibold text-slate-700">
                            {formatCurrency(transaction.price)}
                          </td>
                          <td className="p-3 text-right text-sm font-semibold text-slate-700">
                            {transaction.quantity}
                          </td>
                          <td className="p-3 text-right text-sm font-bold text-slate-800">
                            {formatCurrency(transValue)}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1">
                              {isEditing ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      const price = parseFloat(editTransactionPrice.replace(/[^0-9.]/g, ''));
                                      const quantity = parseFloat(editTransactionQuantity.replace(/[^0-9.]/g, ''));
                                      if (!isNaN(price) && !isNaN(quantity) && quantity > 0 && price > 0) {
                                        onUpdateTransaction(transaction.stockId, transaction.id, {
                                          type: editTransactionType,
                                          price,
                                          quantity,
                                          date: editTransactionDate
                                        });
                                      } else {
                                        onInvalidEdit();
                                      }
                                    }}
                                    className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                                    title="Save"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingTransactionId(null);
                                      setEditTransactionPrice('');
                                      setEditTransactionQuantity('');
                                      setEditTransactionDate('');
                                    }}
                                    className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                                    title="Cancel"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => onStartEditTransaction(transaction.stockId, transaction.id)}
                                    className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                    title="Edit transaction"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => onDeleteTransaction(transaction.stockId, transaction.id)}
                                    className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                                    title="Delete transaction"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StockTransactionsTable;
