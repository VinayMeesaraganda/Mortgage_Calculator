import React, { useState, useEffect, useRef } from 'react';
import { Plus, Wallet, TrendingUp, PieChart as PieChartIcon, ArrowUpRight, IndianRupee } from 'lucide-react';
import { FixedDeposit, TaxConfig } from '../types/fd';
import { calculateFDReturns, calculateTaxImpact } from '../utils/fdCalculations';
import { AddFDModal } from '../components/FD/AddFDModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { formatCurrency } from '../utils/formatting';
import { useAuth } from '../contexts/AuthContext';
import { saveFDs, loadFDs, subscribeToFDs } from '../services/fdService';
import { DEBOUNCE_DELAYS } from '../utils/constants';
import PageShell from '../layouts/PageShell';
import Button from '../components/ui/Button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const FixedDeposits: React.FC = () => {
  const { currentUser } = useAuth();
  const [fds, setFds] = useState<FixedDeposit[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingFD, setEditingFD] = useState<FixedDeposit | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Tax state
  const [taxConfig, setTaxConfig] = useState<TaxConfig>({ taxBracket: 30, isSeniorCitizen: false });

  const isInitialLoadRef = useRef(true);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load Data
  useEffect(() => {
    isInitialLoadRef.current = true;

    if (!currentUser) {
      // Guest: Load from Local Storage
      const saved = localStorage.getItem('fixed_deposits_data');
      if (saved) setFds(JSON.parse(saved));
      setIsLoading(false);
      return;
    }

    // Logged In: Load from Firestore
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await loadFDs(currentUser.uid);
        setFds(data);
        isInitialLoadRef.current = false;
      } catch (error) {
        console.error("Failed to load FDs", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();

    // Real-time subscription
    const unsubscribe = subscribeToFDs(currentUser.uid, (data) => {
      if (!isInitialLoadRef.current) {
        setFds(data);
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Save Data (Debounced for Cloud, Instant for Local)
  useEffect(() => {
    if (isInitialLoadRef.current) return;

    if (!currentUser) {
      localStorage.setItem('fixed_deposits_data', JSON.stringify(fds));
      return;
    }

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    setIsSaving(true);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await saveFDs(currentUser.uid, fds);
        setIsSaving(false);
      } catch (error) {
        console.error("Failed to save FDs", error);
        setIsSaving(false);
      }
    }, DEBOUNCE_DELAYS.MORTGAGE_UPDATE);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [fds, currentUser]);


  const handleSaveFD = async (fdData: Omit<FixedDeposit, 'id' | 'createdAt' | 'updatedAt'>) => {
    let newFds = [...fds];

    if (editingFD) {
      newFds = newFds.map(f => f.id === editingFD.id ? { ...f, ...fdData, updatedAt: new Date().toISOString() } : f);
      setEditingFD(undefined);
    } else {
      const newFD: FixedDeposit = {
        ...fdData,
        id: `fd-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      newFds.push(newFD);
    }

    setFds(newFds);

    if (currentUser) {
      setIsSaving(true);
      try {
        await saveFDs(currentUser.uid, newFds);
      } catch (error) {
        console.error("Failed to save FD", error);
      } finally {
        setIsSaving(false);
      }
    } else {
      localStorage.setItem('fixed_deposits_data', JSON.stringify(newFds));
    }
  };

  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Trigger Modal
  const handleDeleteClick = (id: string) => {
    setIsSaving(false); // Clear any previous processing state
    setItemToDelete(id);
  };

  // Actual Delete Logic
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    const id = itemToDelete;
    // Optimistic Update
    const newFds = fds.filter(f => f.id !== id);
    setFds(newFds);
    setItemToDelete(null); // Close modal

    if (currentUser) {
      setIsSaving(true);
      try {
        await saveFDs(currentUser.uid, newFds);
      } catch (error) {
        console.error("Failed to delete FD", error);
        setFds(fds); // Revert
      } finally {
        setIsSaving(false);
      }
    } else {
      localStorage.setItem('fixed_deposits_data', JSON.stringify(newFds));
    }
  };

  // --- DERIVED METRICS ---
  const totalPrincipal = fds.reduce((sum, fd) => sum + fd.principalAmount, 0);

  const portfolioSummary = fds.reduce((acc, fd) => {
    const { maturityAmount, totalInterest } = calculateFDReturns(fd);
    const { netInterest } = calculateTaxImpact(totalInterest, taxConfig);

    return {
      currentValue: acc.currentValue + fd.principalAmount + (totalInterest * 0.5), // Approx accrual
      maturityValue: acc.maturityValue + maturityAmount,
      totalestInterest: acc.totalestInterest + totalInterest,
      netInterest: acc.netInterest + netInterest
    };
  }, { currentValue: 0, maturityValue: 0, totalestInterest: 0, netInterest: 0 });

  // Chart Data: Maturity Ladder
  const maturityLadderData = fds.reduce((acc: any[], fd) => {
    const year = new Date(fd.maturityDate).getFullYear();
    const existing = acc.find(d => d.year === year);
    const { maturityAmount } = calculateFDReturns(fd);

    if (existing) {
      existing.amount += maturityAmount;
    } else {
      acc.push({ year, amount: maturityAmount });
    }
    return acc;
  }, []).sort((a, b) => a.year - b.year);

  // Chart Data: Bank Allocation
  const bankAllocationData = fds.reduce((acc: any[], fd) => {
    const existing = acc.find(d => d.name === fd.bankName);
    if (existing) {
      existing.value += fd.principalAmount;
    } else {
      acc.push({ name: fd.bankName, value: fd.principalAmount });
    }
    return acc;
  }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <PageShell
      title="Fixed Deposit Manager"
      subtitle="Track your FDs, RDs, and analyze returns like a pro."
      actions={(
        <div className="flex items-center gap-2">
          {isSaving && <span className="text-xs text-slate-500">Saving...</span>}
          <Button onClick={() => { setEditingFD(undefined); setIsAddModalOpen(true); }} disabled={isLoading}>
            <Plus size={18} /> New investment
          </Button>
        </div>
      )}
    >
      <div className="space-y-8">

        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" >
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Wallet size={24} />
              </div>
              <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-lg">+12%</span>
            </div>
            <p className="text-slate-500 text-sm font-medium">Total Invested</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalPrincipal)}</h3>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <TrendingUp size={24} />
              </div>
            </div>
            <p className="text-slate-500 text-sm font-medium">Maturity Value</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(portfolioSummary.maturityValue)}</h3>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                <ArrowUpRight size={24} />
              </div>
            </div>
            <p className="text-slate-500 text-sm font-medium">Est. Interest</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(portfolioSummary.totalestInterest)}</h3>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <IndianRupee size={100} />
            </div>
            <p className="text-slate-500 text-sm font-medium z-10 relative">Tax Slab</p>
            <div className="flex items-center gap-2 mt-2 z-10 relative">
              <input
                type="number"
                value={taxConfig.taxBracket}
                onChange={(e) => setTaxConfig(prev => ({ ...prev, taxBracket: parseFloat(e.target.value) }))}
                className="w-16 px-2 py-1 border rounded bg-slate-50 font-bold"
              />
              <span className="text-slate-600">%</span>
            </div>
            <p className="text-xs text-slate-400 mt-2 z-10 relative">Net Return: {formatCurrency(portfolioSummary.netInterest)}</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" >
          {/* Laddering Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100" >
            <h3 className="text-lg font-bold text-slate-800 mb-6">Maturity Ladder (Liquidity)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={maturityLadderData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="amount" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Allocation Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100" >
            <h3 className="text-lg font-bold text-slate-800 mb-6">Bank Allocation</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bankAllocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {bankAllocationData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* List Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden" >
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">Review Investments</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Bank / Info</th>
                  <th className="px-6 py-4">Principal</th>
                  <th className="px-6 py-4">Rate / Tenure</th>
                  <th className="px-6 py-4">Maturity</th>
                  <th className="px-6 py-4">Potential Return</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fds.map((fd) => {
                  const { maturityAmount, totalInterest } = calculateFDReturns(fd);
                  return (
                    <tr key={fd.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${fd.colors?.bg || 'bg-gray-100'} ${fd.colors?.text || 'text-gray-600'}`}>
                            {fd.bankName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{fd.bankName}</p>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">{fd.type}</span>
                            {fd.isTaxSaver && <span className="text-xs ml-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Tax Saver</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {formatCurrency(fd.principalAmount)}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{fd.interestRate}%</p>
                        <p className="text-xs text-slate-500">{fd.tenureYears} Years</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-700">{fd.maturityDate}</p>
                        <p className="text-xs text-slate-500">Maturity Date</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-green-600">{formatCurrency(maturityAmount)}</p>
                        <p className="text-xs text-slate-500">Interest: {formatCurrency(totalInterest)}</p>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => { setEditingFD(fd); setIsAddModalOpen(true); }}
                          className="text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(fd.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {fds.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-3">
                        <PieChartIcon size={48} className="opacity-20" />
                        <p>No investments added yet. Click "New Investment" to start tracking.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <AddFDModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setEditingFD(undefined); }}
        onSave={handleSaveFD}
        editFD={editingFD}
      />

      <ConfirmationModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Investment"
        message="Are you sure you want to delete this investment? This action cannot be undone."
        confirmText="Delete"
        isProcessing={isSaving}
      />
    </PageShell>
  );
};

export default FixedDeposits;
