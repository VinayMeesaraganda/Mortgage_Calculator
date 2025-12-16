import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calculator } from 'lucide-react';
import { formatCurrency } from '../utils/formatting';

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
        <div className="min-h-screen bg-slate-50 pb-12">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Calculator className="w-6 h-6 text-green-600" />
                            Affordability Calculator
                        </h1>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Inputs Section */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-4">Financial Details</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Annual Gross Income</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-slate-500">$</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={annualIncome}
                                            onChange={(e) => setAnnualIncome(Number(e.target.value))}
                                            className="block w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Total income before taxes</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Debts</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-slate-500">$</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={monthlyDebts}
                                            onChange={(e) => setMonthlyDebts(Number(e.target.value))}
                                            className="block w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Credit cards, car loans, student loans, etc.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Down Payment</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-slate-500">$</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={downPayment}
                                            onChange={(e) => setDownPayment(Number(e.target.value))}
                                            className="block w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-4">Loan Assumptions</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Interest Rate (%)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={interestRate}
                                        onChange={(e) => setInterestRate(Number(e.target.value))}
                                        className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Loan Term (Years)</label>
                                    <select
                                        value={loanTerm}
                                        onChange={(e) => setLoanTerm(Number(e.target.value))}
                                        className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                    >
                                        <option value={15}>15 Years</option>
                                        <option value={20}>20 Years</option>
                                        <option value={30}>30 Years</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Property Tax (%)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={propertyTaxRate}
                                            onChange={(e) => setPropertyTaxRate(Number(e.target.value))}
                                            className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">HOA (/mo)</label>
                                        <input
                                            type="number"
                                            value={hoaFees}
                                            onChange={(e) => setHoaFees(Number(e.target.value))}
                                            className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Results Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>

                            <div className="relative z-10">
                                <h2 className="text-green-100 font-medium text-lg mb-2">You can afford a home up to</h2>
                                <div className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
                                    {formatCurrency(maxHomePrice)}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-white/20">
                                    <div>
                                        <div className="text-green-200 text-sm mb-1">Monthly Payment</div>
                                        <div className="text-2xl font-bold">{formatCurrency(monthlyPayment)}</div>
                                    </div>
                                    <div>
                                        <div className="text-green-200 text-sm mb-1">Down Payment</div>
                                        <div className="text-2xl font-bold">{formatCurrency(downPayment)}</div>
                                    </div>
                                    <div>
                                        <div className="text-green-200 text-sm mb-1">Debt-to-Income</div>
                                        <div className="text-2xl font-bold">{dti.toFixed(1)}%</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">How is this calculated?</h3>
                            <div className="prose prose-slate text-sm">
                                <p>
                                    We use the standard <strong>28/36 rule</strong> used by most lenders:
                                </p>
                                <ul>
                                    <li>
                                        <strong>Front-end Ratio (28%):</strong> Your monthly housing costs (mortgage + tax + insurance + HOA) shouldn't exceed 28% of your gross monthly income.
                                    </li>
                                    <li>
                                        <strong>Back-end Ratio (36%):</strong> Your total monthly debt payments (housing + credit cards + loans) shouldn't exceed 36% of your gross monthly income.
                                    </li>
                                </ul>
                                <p>
                                    The calculator takes the lower of these two limits to determine your maximum affordable monthly payment, then works backward to find the home price based on your down payment and interest rate.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AffordabilityCalculator;
