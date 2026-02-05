import React from 'react';
import AppNav from './AppNav';
import type { Currency } from '../types/mortgage';

interface PageShellProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  selectedCurrency?: Currency;
  onCurrencyChange?: (currency: Currency) => void;
}

const PageShell: React.FC<PageShellProps> = ({
  title,
  subtitle,
  actions,
  children,
  selectedCurrency,
  onCurrencyChange
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-surface via-blue-50/20 to-teal-50/10">
      <AppNav selectedCurrency={selectedCurrency} onCurrencyChange={onCurrencyChange} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900">{title}</h1>
              {subtitle && <p className="text-slate-500 mt-2 max-w-2xl">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </div>
        {children}
      </main>
    </div>
  );
};

export default PageShell;
