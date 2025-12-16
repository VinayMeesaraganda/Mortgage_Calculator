export type FDIvestmentType = 'FD' | 'RD';
export type InterestPayout = 'cumulative' | 'monthly' | 'quarterly';
export type FDStatus = 'active' | 'matured' | 'closed';

export interface FixedDeposit {
    id: string;
    name: string; // e.g., "HDFC FD", "SBI RD"
    bankName: string;
    type: FDIvestmentType;

    // Amount details
    principalAmount: number; // For FD: Lumpsum, For RD: Monthly Installment

    // Date details
    startDate: string; // ISO Date string
    maturityDate: string; // ISO Date string
    tenureYears: number;
    tenureMonths: number;
    tenureDays: number;

    // Interest details
    interestRate: number; // Annual %
    payoutFrequency: InterestPayout;
    compoundingFrequency: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly'; // Usually quarterly for Indian banks

    // Computed values (stored for performance or re-calculated)
    maturityAmount?: number;
    totalInterestEarned?: number;

    status: FDStatus;

    // Tax details
    isTaxSaver: boolean; // 5-year lock-in

    // Metadata
    colors?: {
        bg: string;
        text: string;
    };
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface TaxConfig {
    taxBracket: number; // e.g., 30 for 30% slab
    isSeniorCitizen: boolean;
}

export const BANK_COLORS = [
    { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
    { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
    { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
    { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
    { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200' },
    { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
];
