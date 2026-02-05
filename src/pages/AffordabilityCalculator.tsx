import React, { useState, useEffect } from 'react';
import { formatCurrency, getGlobalCurrency } from '../utils/formatting';
import { CURRENCY_DATA } from '../utils/currency';
import PageShell from '../layouts/PageShell';

const AffordabilityCalculator: React.FC = () => {
    // State for inputs
    const [annualIncome, setAnnualIncome] = useState(100000);
    const [monthlyDebts, setMonthlyDebts] = useState(500);
    const [downPayment, setDownPayment] = useState(50000);
    const [interestRate, setInterestRate] = useState(6.5);
    const [loanTerm, setLoanTerm] = useState(30);
    const [propertyTaxRate, setPropertyTaxRate] = useState(1.2); // Annual %
    const [homeInsurance] = useState(1200); // Annual $
    const [hoaFees, setHoaFees] = useState(0); // Monthly $

    // State for results
    const [maxHomePrice, setMaxHomePrice] = useState(0);
    const [monthlyPayment, setMonthlyPayment] = useState(0);
    const [dti, setDti] = useState(0);
    const currencySymbol = CURRENCY_DATA[getGlobalCurrency()].symbol;

    // Calculation logic
    useEffect(() => {
        // 28/36 Rule
        // Front-end ratio: Housing costs <= 28% of gross monthly income
        // Back-end ratio: Total debts (housing + other) <= 36% of gross monthly income

        const monthlyGrossIncome = annualIncome / 12;

        // Max allowable housing payment based on front-end ratio (28%)
        const maxHousingFront = monthlyGrossIncome * 0.28;

        // Max allowable total debt payment based on back-end ratio (36%)
        const maxTotalBack = monthlyGrossIncome * 0.36;

        // Max allowable housing payment based on back-end ratio (after subtracting other debts)
        const maxHousingBack = maxTotalBack - monthlyDebts;

        // The limiting factor is the lower of the two
        const maxMonthlyPayment = Math.max(0, Math.min(maxHousingFront, maxHousingBack));

        // Calculate Max Home Price
        // Monthly Payment = (Loan Amount * r * (1+r)^n) / ((1+r)^n - 1) + Tax + Insurance + HOA
        // We need to solve for Loan Amount first.
        // Available for P&I = Max Monthly Payment - (Tax + Insurance + HOA)

        const monthlyRate = interestRate / 100 / 12;
        const numPayments = loanTerm * 12;

        // Estimate monthly tax (approximate based on price, iterative approach would be better but simple algebra works if we assume tax is % of price)
        // Let P = Price. Loan = P - DownPayment.
        // Tax = (P * TaxRate) / 12
        // Insurance = AnnualInsurance / 12
        // HOA = MonthlyHOA
        // P&I = (P - Down) * Factor

        // MaxPayment = (P - Down) * Factor + (P * TaxRate/12) + Insurance/12 + HOA
        // MaxPayment - Insurance/12 - HOA + (Down * Factor) = P * Factor + P * TaxRate/12
        // MaxPayment - Insurance/12 - HOA + (Down * Factor) = P * (Factor + TaxRate/12)
        // P = (MaxPayment - Insurance/12 - HOA + (Down * Factor)) / (Factor + TaxRate/12)

        const monthlyInsurance = homeInsurance / 12;
        const mortgageFactor = (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
        const monthlyTaxRate = propertyTaxRate / 100 / 12;

        const numerator = maxMonthlyPayment - monthlyInsurance - hoaFees + (downPayment * mortgageFactor);
        const denominator = mortgageFactor + monthlyTaxRate;

        let calculatedMaxPrice = numerator / denominator;

        // Ensure max price isn't less than down payment (edge case)
        if (calculatedMaxPrice < downPayment) calculatedMaxPrice = downPayment;
        if (maxMonthlyPayment <= 0) calculatedMaxPrice = 0;

        setMaxHomePrice(calculatedMaxPrice);
        setMonthlyPayment(maxMonthlyPayment);

        // Calculate actual DTI
        const totalMonthlyDebt = maxMonthlyPayment + monthlyDebts;
        setDti((totalMonthlyDebt / monthlyGrossIncome) * 100);

    }, [annualIncome, monthlyDebts, downPayment, interestRate, loanTerm, propertyTaxRate, homeInsurance, hoaFees]);

    return (
        <PageShell
            title="Affordability Calculator"
            subtitle="Estimate how much house you can afford based on your income, debts, and down payment."
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Inputs Section - Spans 4 columns on large screens */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Financial Details Card */}
                    <div className="bg-white rounded-card shadow-card p-6 border border-slate-100">
                        <h2 className="text-lg font-bold text-brand-dark mb-5 flex items-center gap-2">
                            Financial Details
                        </h2>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Annual Gross Income</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <span className="text-slate-400 font-medium">{currencySymbol}</span>
                                    </div>
                                    <input
                                        type="number"
                                        value={annualIncome}
                                        onChange={(e) => setAnnualIncome(Number(e.target.value))}
                                        className="block w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-medium text-slate-900"
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-1.5 ml-1">Total income before taxes</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Monthly Debts</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <span className="text-slate-400 font-medium">{currencySymbol}</span>
                                    </div>
                                    <input
                                        type="number"
                                        value={monthlyDebts}
                                        onChange={(e) => setMonthlyDebts(Number(e.target.value))}
                                        className="block w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-medium text-slate-900"
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-1.5 ml-1">Loans, credit cards, etc.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Down Payment</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <span className="text-slate-400 font-medium">{currencySymbol}</span>
                                    </div>
                                    <input
                                        type="number"
                                        value={downPayment}
                                        onChange={(e) => setDownPayment(Number(e.target.value))}
                                        className="block w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-medium text-slate-900"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Loan Assumptions Card */}
                    <div className="bg-white rounded-card shadow-card p-6 border border-slate-100">
                        <h2 className="text-lg font-bold text-brand-dark mb-5">Loan Assumptions</h2>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Interest Rate (%)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={interestRate}
                                    onChange={(e) => setInterestRate(Number(e.target.value))}
                                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-medium text-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Loan Term</label>
                                <div className="relative">
                                    <select
                                        value={loanTerm}
                                        onChange={(e) => setLoanTerm(Number(e.target.value))}
                                        className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-medium text-slate-900 appearance-none"
                                    >
                                        <option value={15}>15 Years</option>
                                        <option value={20}>20 Years</option>
                                        <option value={30}>30 Years</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Property Tax (%)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={propertyTaxRate}
                                        onChange={(e) => setPropertyTaxRate(Number(e.target.value))}
                                        className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">HOA /mo</label>
                                    <input
                                        type="number"
                                        value={hoaFees}
                                        onChange={(e) => setHoaFees(Number(e.target.value))}
                                        className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Section - Spans 8 columns on large screens */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Hero Result Card */}
                    <div className="w-full bg-brand-primary rounded-[32px] shadow-2xl p-8 md:p-10 text-white relative overflow-hidden flex flex-col justify-between min-h-[400px]">
                        {/* Abstract Background Shapes */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-accent opacity-10 rounded-full -ml-20 -mb-20 blur-3xl"></div>

                        <div className="relative z-10">
                            <h2 className="text-blue-100 font-medium text-lg md:text-xl mb-4 tracking-wide">You can afford a home up to</h2>

                            <div className="flex flex-wrap items-baseline gap-2 mb-8">
                                <span className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight">
                                    {formatCurrency(maxHomePrice)}
                                </span>
                            </div>

                            {/* Key Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-white/10">
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 md:p-5 border border-white/5 hover:bg-white/15 transition-colors">
                                    <div className="text-blue-100 text-sm font-medium uppercase tracking-wider mb-2">Monthly Payment</div>
                                    <div className="text-2xl font-bold">{formatCurrency(monthlyPayment)}</div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 md:p-5 border border-white/5 hover:bg-white/15 transition-colors">
                                    <div className="text-blue-100 text-sm font-medium uppercase tracking-wider mb-2">Down Payment</div>
                                    <div className="text-2xl font-bold">{formatCurrency(downPayment)}</div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 md:p-5 border border-white/5 hover:bg-white/15 transition-colors">
                                    <div className="text-blue-100 text-sm font-medium uppercase tracking-wider mb-2">Debt-to-Income</div>
                                    <div className={`text-2xl font-bold ${dti > 36 ? 'text-brand-accent' : 'text-brand-success'}`}>
                                        {dti.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Explanation / Info Card */}
                    <div className="bg-white rounded-card shadow-card p-8 border border-slate-100">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-brand-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-brand-dark mb-2">How we calculate this</h3>
                                <p className="text-slate-600 leading-relaxed max-w-2xl">
                                    We use the <strong>28/36 rule</strong>, a standard used by most lenders.
                                    This guideline suggests you spend no more than <strong>28%</strong> of your gross monthly income on housing expenses
                                    and no more than <strong>36%</strong> on total debt. We use the lower of these two limits to estimate your home buying power.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageShell>
    );
};

export default AffordabilityCalculator;
