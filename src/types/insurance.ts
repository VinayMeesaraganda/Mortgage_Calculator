// Insurance Type Definitions

export type InsuranceCategory = 'health' | 'life' | 'auto' | 'home';
export type InsuranceStatus = 'active' | 'expiring_soon' | 'expired' | 'cancelled';
export type PolicyType = 'term' | 'whole_life' | 'endowment' | 'ulip';
export type PayoutFrequency = 'lump_sum' | 'monthly_income' | 'increasing_income';

export type PaymentFrequency = 'monthly' | 'quarterly' | 'half_yearly' | 'annual';

// Base Insurance Interface
export interface BaseInsurance {
    id: string;
    category: InsuranceCategory;
    provider: string;
    policyNumber: string;
    premium: number; // Base premium amount
    paymentFrequency: PaymentFrequency;
    startDate: string;
    coverageEndDate: string; // When coverage expires
    premiumPaymentEndDate: string; // When premium payments end (can differ for limited pay policies)
    status: InsuranceStatus;
    documentUrl?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

// For backward compatibility, keep annualPremium as computed property
export interface BaseInsuranceWithComputed extends BaseInsurance {
    get annualPremium(): number;
}

// Health Insurance
export interface HealthInsurance extends BaseInsurance {
    category: 'health';
    sumInsured: number;
    isFamily: boolean;
    familyMembers?: {
        relation: 'self' | 'spouse' | 'child' | 'parent';
        name: string;
        age: number;
        gender: 'male' | 'female';
    }[];
    roomType: 'shared' | 'semi_private' | 'private' | 'suite';
    copayment: number; // percentage
    deductible: number;
    preExistingCover: boolean;
    waitingPeriod: number; // months
    riders: {
        maternitycover?: { limit: number; cost: number };
        criticalIllness?: { coverage: number; cost: number };
        dailyHospitalCash?: { amount: number; cost: number };
        noRoomRentLimit?: { cost: number };
        consumablesCover?: { cost: number };
    };
    ncb: number; // percentage
}

// Life Insurance
export interface LifeInsurance extends BaseInsurance {
    category: 'life';
    coverageAmount: number;
    policyType: PolicyType;
    policyTerm: number; // years
    premiumPaymentTerm: number; // years
    payoutOption: PayoutFrequency;
    beneficiaries: {
        name: string;
        relation: string;
        percentage: number;
    }[];
    riders: {
        accidentalDeath?: { coverage: number; cost: number };
        criticalIllness?: { coverage: number; cost: number };
        waiverOfPremium?: { cost: number };
        incomeRider?: { monthlyIncome: number; cost: number };
    };
    isSmoker: boolean;
    maturityBenefit?: number; // for endowment/ULIP
}

// Auto Insurance
export interface AutoInsurance extends BaseInsurance {
    category: 'auto';
    vehicleDetails: {
        make: string;
        model: string;
        variant: string;
        registrationNumber: string;
        registrationYear: number;
        fuelType: 'petrol' | 'diesel' | 'cng' | 'electric';
        cubicCapacity: number;
    };
    idv: number; // Insured Declared Value
    coverageType: 'third_party' | 'comprehensive';
    ncb: number; // percentage
    addOns: {
        zeroDepreciation?: { cost: number };
        engineProtection?: { cost: number };
        returnToInvoice?: { cost: number };
        roadsideAssistance?: { cost: number };
        ncbProtection?: { cost: number };
        consumablesCover?: { cost: number };
        keyReplacement?: { cost: number };
    };
    previousClaims: number;
}

// Home Insurance
export interface HomeInsurance extends BaseInsurance {
    category: 'home';
    propertyDetails: {
        type: 'apartment' | 'independent_house' | 'villa';
        builtUpArea: number; // sq ft
        ageOfProperty: number; // years
        constructionType: 'rcc' | 'load_bearing';
        location: string;
        pinCode: string;
    };
    structureCover: number;
    contentsCover: number;
    personalLiability: number;
    addOns: {
        naturalDisasters?: { cost: number };
        terrorismCover?: { cost: number };
        temporaryAccommodation?: { cost: number };
        rentLossProtection?: { cost: number };
        valuableItems?: { items: string[]; totalValue: number; cost: number };
    };
}

// Union type for all insurance types
export type Insurance = HealthInsurance | LifeInsurance | AutoInsurance | HomeInsurance;

// Claim Management
export type ClaimStatus = 'filed' | 'under_review' | 'approved' | 'rejected' | 'settled';

export interface Claim {
    id: string;
    insuranceId: string; // Links to Insurance.id
    claimNumber: string;
    claimDate: string;
    claimAmount: number;
    approvedAmount?: number;
    settledAmount?: number;
    status: ClaimStatus;
    description: string;
    documents?: string[];
    settlementDate?: string;
    rejectionReason?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export const CLAIM_STATUS_COLORS: Record<ClaimStatus, { bg: string; text: string; label: string }> = {
    filed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Filed' },
    under_review: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Under Review' },
    approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved' },
    rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
    settled: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Settled' }
};

// Renewal Interface
export interface Renewal {
    id: string;
    policyId: string;
    category: InsuranceCategory;
    provider: string;
    policyNumber: string;
    dueDate: string;
    premium: number;
    remindersSent: {
        daysBeforeExpiry: number;
        sentAt: string;
        channel: 'email' | 'sms' | 'in_app';
    }[];
    autoRenewal: boolean;
    renewed: boolean;
    renewedAt?: string;
    createdAt: string;
}

// Premium Calculator Inputs
export interface HealthPremiumInput {
    age: number;
    gender: 'male' | 'female';
    sumInsured: number;
    isFamily: boolean;
    familySize?: number;
    eldestAge?: number;
    city: string;
    copayment: number;
    deductible: number;
    riders: string[];
    ncb: number;
}

export interface LifePremiumInput {
    age: number;
    gender: 'male' | 'female';
    coverageAmount: number;
    policyTerm: number;
    premiumPaymentTerm: number;
    isSmoker: boolean;
    riders: string[];
}

export interface AutoPremiumInput {
    vehicleMake: string;
    vehicleModel: string;
    registrationYear: number;
    fuelType: string;
    cubicCapacity: number;
    city: string;
    idv: number;
    coverageType: 'third_party' | 'comprehensive';
    ncb: number;
    addOns: string[];
}

export interface HomePremiumInput {
    propertyType: string;
    builtUpArea: number;
    ageOfProperty: number;
    location: string;
    structureCover: number;
    contentsCover: number;
    addOns: string[];
}

// Color schemes for different categories
export const INSURANCE_COLORS = {
    health: {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        accent: 'bg-green-600'
    },
    life: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        accent: 'bg-blue-600'
    },
    auto: {
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-200',
        accent: 'bg-orange-600'
    },
    home: {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
        accent: 'bg-purple-600'
    }
};

// Category labels
export const CATEGORY_LABELS: Record<InsuranceCategory, string> = {
    health: 'Health Insurance',
    life: 'Life Insurance',
    auto: 'Auto Insurance',
    home: 'Home Insurance'
};
