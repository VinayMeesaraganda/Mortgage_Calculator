import React, { useState, useEffect } from 'react';
import { X, Heart, Shield, Car, Home } from 'lucide-react';
import type { Insurance, InsuranceCategory } from '../../types/insurance';

interface AddInsuranceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (insurance: Omit<Insurance, 'id' | 'createdAt' | 'updatedAt'>) => void;
    editInsurance?: Insurance;
}

export const AddInsuranceModal: React.FC<AddInsuranceModalProps> = ({
    isOpen,
    onClose,
    onSave,
    editInsurance
}) => {
    const [step, setStep] = useState(1);
    const [category, setCategory] = useState<InsuranceCategory | null>(null);

    // Common fields
    const [provider, setProvider] = useState('');
    const [policyNumber, setPolicyNumber] = useState('');
    const [premium, setPremium] = useState('');
    const [paymentFrequency, setPaymentFrequency] = useState<'monthly' | 'quarterly' | 'half_yearly' | 'annual'>('annual');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [coverageEndDate, setCoverageEndDate] = useState('');
    const [premiumPaymentEndDate, setPremiumPaymentEndDate] = useState('');
    const [notes, setNotes] = useState('');

    // Health-specific fields
    const [sumInsured, setSumInsured] = useState('');
    const [isFamily, setIsFamily] = useState(false);

    // Life-specific fields
    const [coverageAmount, setCoverageAmount] = useState('');
    const [policyType, setPolicyType] = useState<'term' | 'whole_life' | 'endowment' | 'ulip'>('term');

    // Auto-specific fields
    const [vehicleMake, setVehicleMake] = useState('');
    const [vehicleModel, setVehicleModel] = useState('');
    const [idv, setIdv] = useState('');

    // Home-specific fields
    const [propertyType, setPropertyType] = useState<'apartment' | 'independent_house' | 'villa'>('apartment');
    const [structureCover, setStructureCover] = useState('');

    // Initialize form when editInsurance changes
    useEffect(() => {
        if (editInsurance) {
            setCategory(editInsurance.category);
            setProvider(editInsurance.provider);
            setPolicyNumber(editInsurance.policyNumber);
            setPremium(editInsurance.premium?.toString() || '');
            setPaymentFrequency(editInsurance.paymentFrequency || 'annual');
            setStartDate(editInsurance.startDate || new Date().toISOString().split('T')[0]);
            setCoverageEndDate(editInsurance.coverageEndDate || '');
            setPremiumPaymentEndDate(editInsurance.premiumPaymentEndDate || '');
            setNotes(editInsurance.notes || '');

            // Set category-specific fields
            if (editInsurance.category === 'health') {
                setSumInsured(editInsurance.sumInsured?.toString() || '');
                setIsFamily(editInsurance.isFamily || false);
            } else if (editInsurance.category === 'life') {
                setCoverageAmount(editInsurance.coverageAmount?.toString() || '');
                setPolicyType(editInsurance.policyType || 'term');
            } else if (editInsurance.category === 'auto') {
                setVehicleMake(editInsurance.vehicleDetails?.make || '');
                setVehicleModel(editInsurance.vehicleDetails?.model || '');
                setIdv(editInsurance.idv?.toString() || '');
            } else if (editInsurance.category === 'home') {
                setPropertyType(editInsurance.propertyDetails?.type || 'apartment');
                setStructureCover(editInsurance.structureCover?.toString() || '');
            }

            setStep(2); // Skip category selection when editing
        } else if (isOpen) {
            // Reset form for new insurance when modal opens
            setStep(1);
            setCategory(null);
            setProvider('');
            setPolicyNumber('');
            setPremium('');
            setPaymentFrequency('annual');
            setStartDate(new Date().toISOString().split('T')[0]);
            setCoverageEndDate('');
            setPremiumPaymentEndDate('');
            setNotes('');
            setSumInsured('');
            setIsFamily(false);
            setCoverageAmount('');
            setPolicyType('term');
            setVehicleMake('');
            setVehicleModel('');
            setIdv('');
            setPropertyType('apartment');
            setStructureCover('');
        }
    }, [editInsurance, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!category) return;

        const baseData = {
            category,
            provider,
            policyNumber,
            premium: parseFloat(premium),
            paymentFrequency,
            startDate,
            coverageEndDate,
            premiumPaymentEndDate,
            status: 'active' as const,
            notes
        };

        // Build category-specific data
        let insuranceData: any = { ...baseData };

        if (category === 'health') {
            insuranceData = {
                ...insuranceData,
                sumInsured: parseFloat(sumInsured),
                isFamily,
                familyMembers: [],
                roomType: 'private' as const,
                copayment: 0,
                deductible: 0,
                preExistingCover: true,
                waitingPeriod: 24,
                riders: {},
                ncb: 0
            };
        } else if (category === 'life') {
            insuranceData = {
                ...insuranceData,
                coverageAmount: parseFloat(coverageAmount),
                policyType,
                policyTerm: 20,
                premiumPaymentTerm: 20,
                payoutOption: 'lump_sum' as const,
                beneficiaries: [],
                riders: {},
                isSmoker: false
            };
        } else if (category === 'auto') {
            insuranceData = {
                ...insuranceData,
                vehicleDetails: {
                    make: vehicleMake,
                    model: vehicleModel,
                    variant: '',
                    registrationNumber: '',
                    registrationYear: new Date().getFullYear(),
                    fuelType: 'petrol' as const,
                    cubicCapacity: 1200
                },
                idv: parseFloat(idv),
                coverageType: 'comprehensive' as const,
                ncb: 0,
                addOns: {},
                previousClaims: 0
            };
        } else if (category === 'home') {
            insuranceData = {
                ...insuranceData,
                propertyDetails: {
                    type: propertyType,
                    builtUpArea: 1000,
                    ageOfProperty: 5,
                    constructionType: 'rcc' as const,
                    location: '',
                    pinCode: ''
                },
                structureCover: parseFloat(structureCover),
                contentsCover: 0,
                personalLiability: 0,
                addOns: {}
            };
        }

        onSave(insuranceData);
        onClose();
        resetForm();
    };

    const resetForm = () => {
        setStep(1);
        setCategory(null);
        setProvider('');
        setPolicyNumber('');
        setPremium('');
        setPaymentFrequency('annual');
        setStartDate(new Date().toISOString().split('T')[0]);
        setCoverageEndDate('');
        setPremiumPaymentEndDate('');
        setNotes('');
    };

    const categories = [
        { id: 'health' as const, name: 'Health Insurance', icon: Heart, color: 'green' },
        { id: 'life' as const, name: 'Life Insurance', icon: Shield, color: 'blue' },
        { id: 'auto' as const, name: 'Auto Insurance', icon: Car, color: 'orange' },
        { id: 'home' as const, name: 'Home Insurance', icon: Home, color: 'purple' }
    ];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-0 sm:p-4">
            <div className="bg-white rounded-none sm:rounded-2xl shadow-xl w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                        {editInsurance ? 'Edit Insurance Policy' : 'Add New Insurance Policy'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                    {/* Step 1: Select Category */}
                    {step === 1 && !editInsurance && (
                        <div>
                            <h3 className="text-base sm:text-lg font-semibold mb-4">Select Insurance Type</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                {categories.map((cat) => {
                                    const Icon = cat.icon;
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => {
                                                setCategory(cat.id);
                                                setStep(2);
                                            }}
                                            className={`p-4 sm:p-6 border-2 rounded-xl hover:shadow-lg transition-all min-h-[80px] sm:min-h-auto ${category === cat.id
                                                ? `border-${cat.color}-500 bg-${cat.color}-50`
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <Icon size={32} className={`mx-auto mb-2 text-${cat.color}-600`} />
                                            <p className="font-semibold text-gray-800">{cat.name}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Policy Details */}
                    {(step === 2 || editInsurance) && category && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Policy Details</h3>

                            {/* Common Fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
                                    <input
                                        type="text"
                                        value={provider}
                                        onChange={(e) => setProvider(e.target.value)}
                                        placeholder="e.g., HDFC ERGO, ICICI Lombard"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Policy Number</label>
                                    <input
                                        type="text"
                                        value={policyNumber}
                                        onChange={(e) => setPolicyNumber(e.target.value)}
                                        placeholder="Policy #"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Premium Amount (₹)</label>
                                    <input
                                        type="number"
                                        value={premium}
                                        onChange={(e) => setPremium(e.target.value)}
                                        placeholder="25000"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Frequency</label>
                                    <select
                                        value={paymentFrequency}
                                        onChange={(e) => setPaymentFrequency(e.target.value as any)}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                    >
                                        <option value="monthly">Monthly</option>
                                        <option value="quarterly">Quarterly</option>
                                        <option value="half_yearly">Half-Yearly</option>
                                        <option value="annual">Annual</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Policy Start Date</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Coverage End Date</label>
                                    <input
                                        type="date"
                                        value={coverageEndDate}
                                        onChange={(e) => setCoverageEndDate(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Premium Payment End</label>
                                    <input
                                        type="date"
                                        value={premiumPaymentEndDate}
                                        onChange={(e) => setPremiumPaymentEndDate(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                        required
                                    />
                                </div>
                            </div>
                            {/* Category-Specific Fields */}
                            {category === 'health' && (
                                <div className="space-y-4 pt-4 border-t">
                                    <h4 className="font-semibold text-gray-800">Health Coverage Details</h4>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Sum Insured (₹)</label>
                                        <input
                                            type="number"
                                            value={sumInsured}
                                            onChange={(e) => setSumInsured(e.target.value)}
                                            placeholder="500000"
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                            required
                                        />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="isFamily"
                                            checked={isFamily}
                                            onChange={(e) => setIsFamily(e.target.checked)}
                                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                        <label htmlFor="isFamily" className="text-sm font-medium text-gray-700">Family Floater Plan</label>
                                    </div>
                                </div>
                            )}

                            {category === 'life' && (
                                <div className="space-y-4 pt-4 border-t">
                                    <h4 className="font-semibold text-gray-800">Life Coverage Details</h4>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Coverage Amount (₹)</label>
                                        <input
                                            type="number"
                                            value={coverageAmount}
                                            onChange={(e) => setCoverageAmount(e.target.value)}
                                            placeholder="5000000"
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Policy Type</label>
                                        <select
                                            value={policyType}
                                            onChange={(e) => setPolicyType(e.target.value as any)}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                        >
                                            <option value="term">Term Life</option>
                                            <option value="whole_life">Whole Life</option>
                                            <option value="endowment">Endowment</option>
                                            <option value="ulip">ULIP</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {category === 'auto' && (
                                <div className="space-y-4 pt-4 border-t">
                                    <h4 className="font-semibold text-gray-800">Vehicle Details</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Make</label>
                                            <input
                                                type="text"
                                                value={vehicleMake}
                                                onChange={(e) => setVehicleMake(e.target.value)}
                                                placeholder="Maruti Suzuki"
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                                            <input
                                                type="text"
                                                value={vehicleModel}
                                                onChange={(e) => setVehicleModel(e.target.value)}
                                                placeholder="Swift"
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">IDV (₹)</label>
                                        <input
                                            type="number"
                                            value={idv}
                                            onChange={(e) => setIdv(e.target.value)}
                                            placeholder="450000"
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            {category === 'home' && (
                                <div className="space-y-4 pt-4 border-t">
                                    <h4 className="font-semibold text-gray-800">Property Details</h4>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
                                        <select
                                            value={propertyType}
                                            onChange={(e) => setPropertyType(e.target.value as any)}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                        >
                                            <option value="apartment">Apartment</option>
                                            <option value="independent_house">Independent House</option>
                                            <option value="villa">Villa</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Structure Cover (₹)</label>
                                        <input
                                            type="number"
                                            value={structureCover}
                                            onChange={(e) => setStructureCover(e.target.value)}
                                            placeholder="2000000"
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Additional notes..."
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-4 pt-4 border-t border-gray-100">
                        {step === 2 && !editInsurance && (
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="flex-1 px-6 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                            >
                                Back
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        {(step === 2 || editInsurance) && (
                            <button
                                type="submit"
                                className="flex-1 px-6 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200 transition-all transform active:scale-95"
                            >
                                {editInsurance ? 'Update Policy' : 'Save Policy'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};
