// Lease tracking with SCD2 rental history

export type LeaseStatus = 'active' | 'expired' | 'upcoming' | 'terminated';

// One historical rental period — immutable once effectiveTo is set (SCD2 row)
export interface RentalPeriod {
  id: string;
  tenantName: string;
  startDate: string;       // YYYY-MM-DD
  endDate: string;         // YYYY-MM-DD
  monthlyRent: number;
  deposit: number;
  effectiveFrom: string;   // ISO timestamp — when this record was inserted
  effectiveTo: string | null; // null = current version
  notes?: string;
}

// Active lease record (current version of the SCD2 chain)
export interface Lease {
  id: string;
  mortgageId: string;
  tenantName: string;
  leaseStartDate: string;  // YYYY-MM-DD
  leaseEndDate: string;    // YYYY-MM-DD
  monthlyRent: number;
  deposit: number;
  status: LeaseStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Full SCD2 history — every past and present version is stored here
  history: RentalPeriod[];
}
