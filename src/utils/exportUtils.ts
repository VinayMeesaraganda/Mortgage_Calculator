import type { Insurance, Claim } from '../types/insurance';
import { CATEGORY_LABELS } from '../types/insurance';

export const exportToCSV = (insurances: Insurance[], claims: Claim[]) => {
    // Export Insurances
    const insuranceHeaders = [
        'Policy Number',
        'Category',
        'Provider',
        'Premium',
        'Payment Frequency',
        'Start Date',
        'Coverage End Date',
        'Premium Payment End Date',
        'Status',
        'Notes'
    ];

    const insuranceRows = insurances.map(ins => [
        ins.policyNumber,
        CATEGORY_LABELS[ins.category],
        ins.provider,
        ins.premium,
        ins.paymentFrequency,
        ins.startDate,
        ins.coverageEndDate,
        ins.premiumPaymentEndDate,
        ins.status,
        ins.notes || ''
    ]);

    const insuranceCSV = [
        insuranceHeaders.join(','),
        ...insuranceRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Export Claims
    const claimHeaders = [
        'Claim Number',
        'Claim Date',
        'Description',
        'Claim Amount',
        'Approved Amount',
        'Settled Amount',
        'Status',
        'Settlement Date',
        'Notes'
    ];

    const claimRows = claims.map(claim => [
        claim.claimNumber,
        claim.claimDate,
        claim.description,
        claim.claimAmount,
        claim.approvedAmount || '',
        claim.settledAmount || '',
        claim.status,
        claim.settlementDate || '',
        claim.notes || ''
    ]);

    const claimCSV = [
        claimHeaders.join(','),
        ...claimRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download both files
    downloadCSV(insuranceCSV, 'insurance-policies.csv');
    if (claims.length > 0) {
        downloadCSV(claimCSV, 'insurance-claims.csv');
    }
};

const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const printPortfolio = () => {
    window.print();
};
