import { FixedDeposit, TaxConfig } from '../types/fd';

/**
 * Calculate Maturity Amount and Interest for FD/RD
 */
export const calculateFDReturns = (fd: FixedDeposit): { maturityAmount: number; totalInterest: number } => {
    const { principalAmount, interestRate, tenureYears, tenureMonths, tenureDays, type, compoundingFrequency } = fd;

    // Convert tenure to total years
    const totalYears = tenureYears + (tenureMonths / 12) + (tenureDays / 365);

    // Rate per period
    const r = interestRate / 100;

    // Compounding frequency per year (n)
    let n = 4; // Default quarterly
    if (compoundingFrequency === 'monthly') n = 12;
    if (compoundingFrequency === 'half-yearly') n = 2;
    if (compoundingFrequency === 'yearly') n = 1;

    let maturityAmount = 0;
    let totalInterest = 0;

    if (type === 'FD') {
        // Formula: A = P(1 + r/n)^(nt)
        // Maturity Amount depends on payout frequency
        const absoluteMaturityValue = principalAmount * Math.pow(1 + r / n, n * totalYears);
        totalInterest = absoluteMaturityValue - principalAmount;

        if (fd.payoutFrequency === 'cumulative') {
            maturityAmount = absoluteMaturityValue;
        } else {
            // For monthly/quarterly payout, the maturity amount is just the principal
            // The interest is paid out periodically
            maturityAmount = principalAmount;
        }
    } else {
        // RD Formula (General recurrence approximation or exact formula)
        // Common Formula: M = P * n + P * n(n+1)/2 * r/12/100 (Simple Interest based) - wait, banks use compound
        // Quarterly Compounding RD Formula (Indian Banks):
        // A = P * [ (1+r/n)^(n*t) - 1 ] / [ 1 - (1+r/n)^(-1/3) ] ... this is complex.
        // Let's use standard Monthly Compounding approximation for SIP-style or Quarterly compounding sum.

        // Easier approach: Treat each installment as a separate mini-FD
        // Installment 1: invested for T years
        // Installment 2: invested for T - 1/12 years
        // ...

        // Total Installments
        const totalInstallments = Math.floor(totalYears * 12);
        let accumulatedAmount = 0;

        for (let i = 0; i < totalInstallments; i++) {
            const monthsRemaining = totalInstallments - i;
            const yearsRemaining = monthsRemaining / 12;

            // Calculate compounded amount for this installment
            const installmentAmount = principalAmount * Math.pow(1 + r / n, n * yearsRemaining);
            accumulatedAmount += installmentAmount;
        }

        maturityAmount = accumulatedAmount;
        totalInterest = maturityAmount - (principalAmount * totalInstallments);
    }

    return {
        maturityAmount,
        totalInterest
    };
};

/**
 * Calculate dates
 */
export const calculateMaturityDate = (startDate: string, y: number, m: number, d: number): string => {
    const date = new Date(startDate);
    date.setFullYear(date.getFullYear() + y);
    date.setMonth(date.getMonth() + m);
    date.setDate(date.getDate() + d);
    return date.toISOString().split('T')[0];
};

/**
 * Tax Calculations
 */
export const calculateTaxImpact = (interest: number, config: TaxConfig) => {
    const { taxBracket, isSeniorCitizen } = config;

    // TDS Thresholds
    const tdsThreshold = isSeniorCitizen ? 50000 : 40000;
    const isTDSApplicable = interest > tdsThreshold;

    // TDS Amount (assuming 10% standard w/ PAN)
    const estimatedTDS = isTDSApplicable ? interest * 0.10 : 0;

    // Final Tax Liability based on slab
    const totalTaxLiability = interest * (taxBracket / 100);

    // Net Return
    const netInterest = interest - totalTaxLiability;

    return {
        isTDSApplicable,
        estimatedTDS,
        totalTaxLiability,
        netInterest
    };
};
