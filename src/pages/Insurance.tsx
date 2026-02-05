import React, { useState, useEffect, useRef } from 'react';
import type { Insurance, InsuranceCategory, Claim } from '../types/insurance';
import { useAuth } from '../contexts/AuthContext';
import { saveInsurances, loadInsurances, subscribeToInsurances } from '../services/insuranceService';
import { DEBOUNCE_DELAYS } from '../utils/constants';
import { AddInsuranceModal } from '../components/Insurance/AddInsuranceModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { ClaimTracker } from '../components/Insurance/ClaimTracker';
import { AnalyticsDashboard } from '../components/Insurance/AnalyticsDashboard';
import InsuranceDetailsModal from '../components/Insurance/InsuranceDetailsModal';
import PageShell from '../layouts/PageShell';
import Button from '../components/ui/Button';
import { Download, Printer, Plus } from 'lucide-react';
import InsurancePoliciesSection from '../components/Insurance/InsurancePoliciesSection';
import InsuranceSummaryCards from '../components/Insurance/InsuranceSummaryCards';
import InsuranceTabs from '../components/Insurance/InsuranceTabs';
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

  return (
    <PageShell
      title="Insurance Tracker"
      subtitle="Track policies, manage renewals, and visualize coverage health."
      actions={(
        <div className="flex flex-wrap items-center gap-2">
          {isSaving && <span className="text-xs text-slate-500">Saving...</span>}
          <Button variant="secondary" onClick={() => exportToCSV(insurances, claims)}>
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button variant="secondary" onClick={printPortfolio}>
            <Printer className="w-4 h-4" /> Print
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)} disabled={isLoading}>
            <Plus className="w-4 h-4" /> Add policy
          </Button>
        </div>
      )}
    >
      <div className="space-y-8">
        <InsuranceSummaryCards
          totalPolicies={totalPolicies}
          activePoliciesCount={activePolicies.length}
          totalAnnualPremium={totalAnnualPremium}
          totalCoverage={totalCoverage}
          expiringPoliciesCount={expiringPolicies.length}
        />

        <InsuranceTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          claimsCount={claims.length}
        />

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
          <InsurancePoliciesSection
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            insurances={insurances}
            filteredInsurances={filteredInsurances}
            expiringPolicies={expiringPolicies}
            onViewPolicy={(insurance) => setViewingInsurance(insurance)}
            onEditPolicy={(insurance) => {
              setEditingInsurance(insurance);
              setIsAddModalOpen(true);
            }}
            onDeletePolicy={(insurance) => {
              setIsSaving(false);
              setItemToDelete(insurance);
            }}
          />
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

      <InsuranceDetailsModal
        insurance={viewingInsurance}
        onClose={() => setViewingInsurance(null)}
      />

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
    </PageShell>
  );
};

export default Insurance;
