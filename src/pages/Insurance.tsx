import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Plus,
  TrendingUp,
  AlertCircle,
  FileText,
  ArrowLeft,
  Bell,
  X,
  Download,
  Printer,
  Heart,
  Car,
  Home as HomeIcon
} from 'lucide-react';
import type { Insurance, InsuranceCategory, Claim } from '../types/insurance';
import { INSURANCE_COLORS, CATEGORY_LABELS } from '../types/insurance';
import { formatCurrency } from '../utils/formatting';
import { useAuth } from '../contexts/AuthContext';
import { saveInsurances, loadInsurances, subscribeToInsurances } from '../services/insuranceService';
import { DEBOUNCE_DELAYS } from '../utils/constants';
import { AddInsuranceModal } from '../components/Insurance/AddInsuranceModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { RenewalAlerts } from '../components/Insurance/RenewalAlerts';
import { ClaimTracker } from '../components/Insurance/ClaimTracker';
import { AnalyticsDashboard } from '../components/Insurance/AnalyticsDashboard';
import { exportToCSV, printPortfolio } from '../utils/exportUtils';

const Insurance: React.FC = () => {
  const { currentUser } = useAuth();
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState<Insurance | undefined>(undefined);
  const [viewingInsurance, setViewingInsurance] = useState<Insurance | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Insurance | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<InsuranceCategory | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'policies' | 'claims' | 'analytics'>('policies');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isInitialLoadRef = useRef(true);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Set page title
  useEffect(() => {
    document.title = 'Insurance Tracker - Personal Finance';
  }, []);

  // Load Data
  useEffect(() => {
    isInitialLoadRef.current = true;

    if (!currentUser) {
      const saved = localStorage.getItem('insurances_data');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Migrate old data format to new format
          const migrated = parsed.map((ins: any) => ({
            ...ins,
            premium: ins.premium || ins.annualPremium || 0,
            paymentFrequency: ins.paymentFrequency || 'annual',
            coverageEndDate: ins.coverageEndDate || ins.endDate || '',
            premiumPaymentEndDate: ins.premiumPaymentEndDate || ins.endDate || ''
          }));
          setInsurances(migrated);
        } catch (e) {
          console.error('Error loading insurances:', e);
          setInsurances([]);
        }
      }
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await loadInsurances(currentUser.uid);
        // Migrate old data format to new format
        const migrated = data.map((ins: any) => ({
          ...ins,
          premium: ins.premium || ins.annualPremium || 0,
          paymentFrequency: ins.paymentFrequency || 'annual',
          coverageEndDate: ins.coverageEndDate || ins.endDate || '',
          premiumPaymentEndDate: ins.premiumPaymentEndDate || ins.endDate || ''
        }));
        setInsurances(migrated);
        isInitialLoadRef.current = false;
      } catch (error) {
        console.error("Failed to load insurances", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();

    const unsubscribe = subscribeToInsurances(currentUser.uid, (data) => {
      if (!isInitialLoadRef.current) {
        setInsurances(data);
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Save Data (Debounced for Cloud, Instant for Local)
  useEffect(() => {
    if (isInitialLoadRef.current) return;

    if (!currentUser) {
      localStorage.setItem('insurances_data', JSON.stringify(insurances));
      return;
    }

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    setIsSaving(true);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await saveInsurances(currentUser.uid, insurances);
        setIsSaving(false);
      } catch (error) {
        console.error("Failed to save insurances", error);
        setIsSaving(false);
      }
    }, DEBOUNCE_DELAYS.MORTGAGE_UPDATE);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [insurances, currentUser]);

  const handleSaveInsurance = async (insuranceData: Omit<Insurance, 'id' | 'createdAt' | 'updatedAt'>) => {
    let newInsurances: Insurance[];

    if (editingInsurance) {
      // Update existing insurance
      const updatedInsurance: Insurance = {
        ...insuranceData,
        id: editingInsurance.id,
        createdAt: editingInsurance.createdAt,
        updatedAt: new Date().toISOString()
      } as Insurance;

      newInsurances = insurances.map(ins =>
        ins.id === editingInsurance.id ? updatedInsurance : ins
      );
    } else {
      // Add new insurance
      const newInsurance: Insurance = {
        ...insuranceData,
        id: `ins-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as Insurance;

      newInsurances = [...insurances, newInsurance];
    }

    setInsurances(newInsurances);

    if (currentUser) {
      setIsSaving(true);
      try {
        await saveInsurances(currentUser.uid, newInsurances);
      } catch (error) {
        console.error("Failed to save insurance", error);
      } finally {
        setIsSaving(false);
      }
    } else {
      localStorage.setItem('insurances_data', JSON.stringify(newInsurances));
    }

    // Close modal and reset state after successful save
    setIsAddModalOpen(false);
    setEditingInsurance(undefined);
  };

  const handleDeleteInsurance = async (insuranceId: string) => {
    const newInsurances = insurances.filter(ins => ins.id !== insuranceId);
    setInsurances(newInsurances);

    if (currentUser) {
      setIsSaving(true);
      try {
        await saveInsurances(currentUser.uid, newInsurances);
      } catch (error) {
        console.error("Failed to delete insurance", error);
        // Rollback on error
        setInsurances(insurances);
      } finally {
        setIsSaving(false);
      }
    } else {
      localStorage.setItem('insurances_data', JSON.stringify(newInsurances));
    }
  };

  // Claim Management
  const handleAddClaim = (claimData: Omit<Claim, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newClaim: Claim = {
      ...claimData,
      id: `clm-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newClaims = [...claims, newClaim];
    setClaims(newClaims);
    localStorage.setItem('insurance_claims', JSON.stringify(newClaims));
  };

  const handleEditClaim = (updatedClaim: Claim) => {
    const newClaims = claims.map(c => c.id === updatedClaim.id ? updatedClaim : c);
    setClaims(newClaims);
    localStorage.setItem('insurance_claims', JSON.stringify(newClaims));
  };

  const handleDeleteClaim = (claimId: string) => {
    const newClaims = claims.filter(c => c.id !== claimId);
    setClaims(newClaims);
    localStorage.setItem('insurance_claims', JSON.stringify(newClaims));
  };

  // Load claims from localStorage
  useEffect(() => {
    const savedClaims = localStorage.getItem('insurance_claims');
    if (savedClaims) {
      try {
        setClaims(JSON.parse(savedClaims));
      } catch (e) {
        console.error('Error loading claims:', e);
      }
    }
  }, []);

  // Calculate summary metrics
  const totalPolicies = insurances.length;

  // Calculate annual premium based on payment frequency
  const totalAnnualPremium = insurances.reduce((sum, ins) => {
    const premium = ins.premium || 0;
    const frequency = ins.paymentFrequency || 'annual';
    let annualAmount = premium;

    switch (frequency) {
      case 'monthly': annualAmount = premium * 12; break;
      case 'quarterly': annualAmount = premium * 4; break;
      case 'half_yearly': annualAmount = premium * 2; break;
      case 'annual': annualAmount = premium; break;
    }
    return sum + (annualAmount || 0);
  }, 0);

  const activePolicies = insurances.filter(ins => ins.status === 'active');
  const expiringPolicies = insurances.filter(ins => {
    if (!ins.coverageEndDate) return false;
    try {
      const daysUntilExpiry = Math.ceil((new Date(ins.coverageEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    } catch (e) {
      return false;
    }
  });

  // Calculate total coverage
  const totalCoverage = insurances.reduce((sum, ins) => {
    try {
      if (ins.category === 'health') return sum + (ins.sumInsured || 0);
      if (ins.category === 'life') return sum + (ins.coverageAmount || 0);
      if (ins.category === 'auto') return sum + (ins.idv || 0);
      if (ins.category === 'home') return sum + ((ins.structureCover || 0) + (ins.contentsCover || 0));
    } catch (e) {
      console.error('Error calculating coverage:', e);
    }
    return sum;
  }, 0);

  // Filter insurances by category
  const filteredInsurances = selectedCategory === 'all'
    ? insurances
    : insurances.filter(ins => ins.category === selectedCategory);

  // Category icons
  const getCategoryIcon = (category: InsuranceCategory) => {
    switch (category) {
      case 'health': return Heart;
      case 'life': return Shield;
      case 'auto': return Car;
      case 'home': return HomeIcon;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col space-y-4">
          <Link to="/" className="inline-flex items-center text-slate-500 hover:text-blue-600 transition-colors w-fit">
            <ArrowLeft size={20} className="mr-2" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Insurance Tracker</h1>
              <p className="text-slate-500 mt-1">Track policies, manage renewals, and optimize coverage</p>
            </div>
            <div className="flex gap-2">
              {isSaving && <span className="text-sm text-gray-500 self-center">Saving...</span>}
              <button
                onClick={() => exportToCSV(insurances, claims)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium flex items-center gap-2 transition-colors"
                title="Export to CSV"
              >
                <Download size={18} />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                onClick={printPortfolio}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium flex items-center gap-2 transition-colors"
                title="Print"
              >
                <Printer size={18} />
                <span className="hidden sm:inline">Print</span>
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                disabled={isLoading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl font-semibold shadow-lg shadow-blue-200 flex items-center gap-2 transition-transform active:scale-95"
              >
                <Plus size={20} /> Add Policy
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <FileText size={24} />
              </div>
            </div>
            <p className="text-slate-500 text-sm font-medium">Total Policies</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{totalPolicies}</h3>
            <p className="text-xs text-slate-400 mt-1">{activePolicies.length} active</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <TrendingUp size={24} />
              </div>
            </div>
            <p className="text-slate-500 text-sm font-medium">Annual Premium</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalAnnualPremium)}</h3>
            <p className="text-xs text-slate-400 mt-1">{formatCurrency(totalAnnualPremium / 12)}/month</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                <Shield size={24} />
              </div>
            </div>
            <p className="text-slate-500 text-sm font-medium">Total Coverage</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalCoverage)}</h3>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Bell size={24} />
              </div>
              {expiringPolicies.length > 0 && (
                <span className="text-xs font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded-lg">
                  {expiringPolicies.length}
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm font-medium">Renewals Due</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">Next 30 Days</h3>
            <p className="text-xs text-slate-400 mt-1">{expiringPolicies.length} policies</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('policies')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${activeTab === 'policies'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            Policies
          </button>
          <button
            onClick={() => setActiveTab('claims')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${activeTab === 'claims'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            Claims ({claims.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${activeTab === 'analytics'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            Analytics
          </button>
        </div>

        {/* Content based on selected tab */}
        {activeTab === 'claims' ? (
          <ClaimTracker
            claims={claims}
            insurances={insurances}
            onAddClaim={handleAddClaim}
            onEditClaim={handleEditClaim}
            onDeleteClaim={handleDeleteClaim}
          />
        ) : activeTab === 'analytics' ? (
          <AnalyticsDashboard insurances={insurances} />
        ) : (
          <>
            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${selectedCategory === 'all'
                  ? 'bg-slate-800 text-white shadow-lg'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
              >
                All Policies
              </button>
              {(['health', 'life', 'auto', 'home'] as InsuranceCategory[]).map((category) => {
                const Icon = getCategoryIcon(category);
                const count = insurances.filter(ins => ins.category === category).length;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all flex items-center gap-2 ${selectedCategory === category
                      ? `${INSURANCE_COLORS[category].accent} text-white shadow-lg`
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    <Icon size={16} />
                    {CATEGORY_LABELS[category]} ({count})
                  </button>
                );
              })}
            </div>

            {/* Renewal Alerts */}
            {expiringPolicies.length > 0 && (
              <div className="mb-8">
                <RenewalAlerts
                  insurances={insurances}
                  onViewPolicy={(insurance) => setViewingInsurance(insurance)}
                />
              </div>
            )}

            {/* Policies List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-slate-800">Your Policies</h3>
              </div>

              {filteredInsurances.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Shield size={48} className="mx-auto opacity-20 mb-4" />
                  <p className="text-lg font-medium">No policies found</p>
                  <p className="text-sm mt-2">Click "Add Policy" to start tracking your insurance</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredInsurances.map((insurance) => {
                    const Icon = getCategoryIcon(insurance.category);
                    const colors = INSURANCE_COLORS[insurance.category];
                    const daysUntilExpiry = insurance.coverageEndDate
                      ? Math.ceil((new Date(insurance.coverageEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                      : null;

                    return (
                      <div key={insurance.id} className="p-6 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <div className={`p-3 ${colors.bg} ${colors.text} rounded-xl`}>
                              <Icon size={24} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-slate-800">{insurance.provider}</h4>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} font-medium`}>
                                  {CATEGORY_LABELS[insurance.category]}
                                </span>
                                {insurance.status === 'expiring_soon' && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                                    Expiring Soon
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-slate-500">Policy #{insurance.policyNumber}</p>
                              <div className="flex gap-4 mt-2 text-sm">
                                <div>
                                  <span className="text-slate-400">Premium:</span>
                                  <span className="font-semibold text-slate-700 ml-1">
                                    {formatCurrency(insurance.premium || 0)}/{insurance.paymentFrequency || 'annual'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Coverage Expires:</span>
                                  <span className={`font-semibold ml-1 ${daysUntilExpiry !== null && daysUntilExpiry <= 30 ? 'text-amber-600' : 'text-slate-700'}`}>
                                    {insurance.coverageEndDate ? new Date(insurance.coverageEndDate).toLocaleDateString() : 'Not set'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setViewingInsurance(insurance)}
                              className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => {
                                setEditingInsurance(insurance);
                                setIsAddModalOpen(true);
                              }}
                              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setIsSaving(false); // Clear any saving state
                                setItemToDelete(insurance);
                              }}
                              className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <AddInsuranceModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingInsurance(undefined);
        }}
        onSave={handleSaveInsurance}
        editInsurance={editingInsurance}
      />

      {/* View Details Modal */}
      {viewingInsurance && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-800">Policy Details</h2>
              <button
                onClick={() => setViewingInsurance(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Provider</p>
                  <p className="font-semibold">{viewingInsurance.provider}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Policy Number</p>
                  <p className="font-semibold">{viewingInsurance.policyNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Premium</p>
                  <p className="font-semibold">{formatCurrency(viewingInsurance.premium || 0)} / {viewingInsurance.paymentFrequency || 'annual'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Coverage Period</p>
                  <p className="font-semibold">{new Date(viewingInsurance.startDate).toLocaleDateString()} - {new Date(viewingInsurance.coverageEndDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Premium Payment End</p>
                  <p className="font-semibold">{new Date(viewingInsurance.premiumPaymentEndDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-semibold capitalize">{viewingInsurance.status.replace('_', ' ')}</p>
                </div>
              </div>
              {viewingInsurance.notes && (
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="text-gray-700">{viewingInsurance.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={itemToDelete !== null}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => {
          if (itemToDelete) {
            handleDeleteInsurance(itemToDelete.id);
            setItemToDelete(null);
          }
        }}
        title="Delete Insurance Policy"
        message={`Are you sure you want to delete the ${itemToDelete?.provider} policy? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default Insurance;
