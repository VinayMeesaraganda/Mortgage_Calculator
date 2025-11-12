// Application-wide constants
// Extracted magic numbers and configuration values

// Timing Constants
export const DEBOUNCE_DELAYS = {
  MORTGAGE_UPDATE: 2000, // 2 seconds for local mortgage updates
  FIRESTORE_SAVE: 10000, // 10 seconds for Firestore saves
  EMAIL_CAPTURE: 3000, // 3 seconds before showing email modal
} as const;

// Firestore Sync Constants
export const FIRESTORE_SYNC = {
  LOCAL_CHANGE_BUFFER_MS: 12000, // 12 seconds buffer to prevent sync conflicts
  INITIAL_LOAD_FLAG: 'isInitialLoad',
} as const;

// Mortgage Calculation Constants
export const MORTGAGE = {
  DEFAULT_HOME_VALUE: 400000,
  DEFAULT_DOWN_PAYMENT: 80000,
  DEFAULT_INTEREST_RATE: 6.5,
  DEFAULT_TENURE_YEARS: 30,
  DEFAULT_MONTHLY_RENT: 2500,
  DEFAULT_VACANCY_RATE: 8, // percentage
  DEFAULT_PROPERTY_MANAGEMENT: 10, // percentage
  DEFAULT_MAINTENANCE: 500,
  DEFAULT_APPRECIATION_RATE: 3.5, // percentage
  MIN_BALANCE_THRESHOLD: 0.01, // Minimum balance to consider paid off
  PMI_RATE: 0.0075, // 0.75% annual PMI rate
  PMI_DOWN_PAYMENT_THRESHOLD: 0.2, // 20% down payment threshold
  MAX_AMORTIZATION_ITERATIONS: 2000, // Safety limit for calculations
} as const;

// Refinance Constants
export const REFINANCE = {
  DEFAULT_REMAINING_BALANCE: 280000,
  DEFAULT_CURRENT_RATE: 7.5,
  DEFAULT_NEW_RATE: 6.0,
  DEFAULT_CLOSING_COSTS: 3500,
  DEFAULT_NEW_TERM: 30,
  MAX_MONTHS_SAFETY: 360, // Maximum months for calculations
} as const;

// Investment Property Thresholds
export const INVESTMENT_THRESHOLDS = {
  COC_EXCELLENT: 12, // Cash-on-Cash Return %
  COC_GOOD: 8,
  CAP_RATE_STRONG: 8, // Cap Rate %
  CAP_RATE_AVERAGE: 5,
  BREAK_EVEN_SAFE: 75, // Break-even occupancy %
  BREAK_EVEN_MODERATE: 85,
} as const;

// UI Configuration
export const UI = {
  CHART_DATA_SAMPLE_RATE: 100, // Sample every Nth item for charts
  TABLE_INITIAL_ROWS: 12, // Initial rows to show in tables
  ANIMATION_DURATION: 800, // milliseconds
  SCROLL_DELAY: 300, // milliseconds before scrolling
} as const;

// Validation Limits
export const VALIDATION = {
  MIN_HOME_VALUE: 1000,
  MAX_HOME_VALUE: 100000000,
  MIN_INTEREST_RATE: 0.1,
  MAX_INTEREST_RATE: 30,
  MIN_TENURE: 1,
  MAX_TENURE: 50,
  MIN_DOWN_PAYMENT_PERCENT: 0,
  MAX_DOWN_PAYMENT_PERCENT: 100,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  SAVE_MORTGAGE_FAILED: 'Failed to save mortgage. Please try again.',
  LOAD_MORTGAGE_FAILED: 'Failed to load mortgages. Please refresh the page.',
  DELETE_MORTGAGE_FAILED: 'Failed to delete mortgage. Please try again.',
  EXPORT_EXCEL_FAILED: 'Failed to export to Excel. Please try again.',
  EXPORT_PDF_FAILED: 'Failed to export to PDF. Please try again.',
  EXPORT_CSV_FAILED: 'Failed to export to CSV. Please try again.',
  AUTH_REQUIRED: 'Please log in to save mortgages',
  INVALID_MORTGAGE_NAME: 'Please enter a name for this mortgage',
  DUPLICATE_MORTGAGE_NAME: 'A mortgage with this name already exists. Please use a different name.',
  EMPTY_MORTGAGE_NAME: 'Mortgage name cannot be empty',
  FIRESTORE_PERMISSION_DENIED: 'Permission denied. Please check Firestore security rules.',
  FIRESTORE_UNAVAILABLE: 'Firestore is unavailable. Please check your internet connection.',
  FIRESTORE_UNAUTHENTICATED: 'You must be logged in to save your mortgages.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  MORTGAGE_SAVED: 'Mortgage saved successfully',
  MORTGAGE_UPDATED: 'Mortgage updated successfully',
  MORTGAGE_DELETED: 'Mortgage deleted successfully',
  EXPORT_SUCCESS: 'Export completed successfully',
} as const;

