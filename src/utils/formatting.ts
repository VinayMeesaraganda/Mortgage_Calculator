// Formatting utility functions

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const formatCurrencyCompact = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(0)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  } else {
    return `$${value.toFixed(0)}`;
  }
};

export const formatDate = (dateStr: string): string => {
  const [year, month] = dateStr.split('-');
  return `${new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', { month: 'short' })} ${year}`;
};

export const formatYearsMonths = (years: number): string => {
  const wholeYears = Math.floor(years);
  const months = Math.round((years - wholeYears) * 12);
  if (months === 0) return `${wholeYears} years`;
  return `${wholeYears} years ${months} ${months === 1 ? 'month' : 'months'}`;
};

