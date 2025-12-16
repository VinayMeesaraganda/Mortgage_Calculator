import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building } from 'lucide-react';
import { formatCurrency } from '../utils/formatting';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const RentVsBuyCalculator: React.FC = () => {
    // Inputs
    const [homePrice, setHomePrice] = useState(400000);
    const [monthlyRent, setMonthlyRent] = useState(2500);
    const [years, setYears] = useState(10);

    // Assumptions
    const [homeAppreciation, setHomeAppreciation] = useState(3); // %
    const [rentIncrease, setRentIncrease] = useState(3); // %
    const [investmentReturn, setInvestmentReturn] = useState(6); // % (Opportunity cost of down payment)

    // Mortgage details (Hardcoded for simplicity in this version, could be exposed later)
    const downPaymentPercent = 20;
    const interestRate = 6.5;
    const propertyTaxRate = 1.2; // %
    const maintenanceRate = 1; // %
    const insuranceRate = 0.5; // %
    const buyingClosingCosts = 3; // %
    const sellingClosingCosts = 6; // %

    // Results
    const [chartData, setChartData] = useState<any[]>([]);
    const [breakevenYear, setBreakevenYear] = useState<number | null>(null);
    const [totalBuyCost, setTotalBuyCost] = useState(0);
    const [totalRentCost, setTotalRentCost] = useState(0);

    useEffect(() => {
        const data = [];
        let currentHomeValue = homePrice;
        let currentRent = monthlyRent;
        let cumulativeRentCost = 0;
        let cumulativeBuyCost = homePrice * (buyingClosingCosts / 100); // Initial closing costs

        const downPayment = homePrice * (downPaymentPercent / 100);
        const loanAmount = homePrice - downPayment;
        const monthlyRate = interestRate / 100 / 12;
        const numPayments = 30 * 12; // Assume 30 year fixed

        // Monthly mortgage payment (P&I)
        const monthlyMortgage = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);

        let loanBalance = loanAmount;
        let foundBreakeven = false;

        for (let year = 1; year <= years; year++) {
            let yearlyRentCost = 0;

            // Calculate yearly totals
            for (let m = 1; m <= 12; m++) {
                yearlyRentCost += currentRent;

                // Buy costs
                const interestPayment = loanBalance * monthlyRate;
                const principalPayment = monthlyMortgage - interestPayment;
                loanBalance -= principalPayment;

                const tax = (currentHomeValue * propertyTaxRate / 100) / 12;
                const insurance = (currentHomeValue * insuranceRate / 100) / 12;
                const maintenance = (currentHomeValue * maintenanceRate / 100) / 12;

                const monthlyBuyOutflow = monthlyMortgage + tax + insurance + maintenance;

                // Add to cumulative
                cumulativeBuyCost += monthlyBuyOutflow;
            }

            cumulativeRentCost += yearlyRentCost;

            // Update values for next year
            currentHomeValue *= (1 + homeAppreciation / 100);
            currentRent *= (1 + rentIncrease / 100);

            // Opportunity Cost Calculation (Rent Scenario)
            // The down payment + closing costs could have been invested.
            // Also, the difference in monthly payments could be invested.
            // This gets complex. Let's stick to a simpler "Net Cost" model.

            // Net Cost to Rent = Cumulative Rent
            // Net Cost to Buy = Cumulative Outflow + Buying Closing Costs + Selling Closing Costs (if sold now) - (Home Value - Loan Balance)

            const equity = currentHomeValue - loanBalance;
            const sellingCosts = currentHomeValue * (sellingClosingCosts / 100);
            const netBuyCost = cumulativeBuyCost + (homePrice * buyingClosingCosts / 100) + sellingCosts - equity;

            // For Rent, we should subtract the investment return on the down payment to be fair
            // Value of Down Payment after n years = Down * (1+r)^n
            const investmentValue = downPayment * Math.pow(1 + investmentReturn / 100, year);
            const investmentGain = investmentValue - downPayment;
            const netRentCost = cumulativeRentCost - investmentGain;

            data.push({
                year,
                rentCost: Math.round(netRentCost),
                buyCost: Math.round(netBuyCost),
            });

            if (!foundBreakeven && netBuyCost < netRentCost) {
                setBreakevenYear(year);
                foundBreakeven = true;
            }
        }

        if (!foundBreakeven) setBreakevenYear(null);
        setChartData(data);
        setTotalBuyCost(data[data.length - 1].buyCost);
        setTotalRentCost(data[data.length - 1].rentCost);

    }, [homePrice, monthlyRent, years, homeAppreciation, rentIncrease, investmentReturn, downPaymentPercent, interestRate, propertyTaxRate, maintenanceRate, insuranceRate, buyingClosingCosts, sellingClosingCosts]);

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Building className="w-6 h-6 text-blue-600" />
                            Rent vs. Buy Calculator
                        </h1>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Inputs */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-4">Core Inputs</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Target Home Price</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-slate-500">$</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={homePrice}
                                            onChange={(e) => setHomePrice(Number(e.target.value))}
                                            className="block w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Rent</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-slate-500">$</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={monthlyRent}
                                            onChange={(e) => setMonthlyRent(Number(e.target.value))}
                                            className="block w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Comparison Period (Years)</label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="30"
                                        value={years}
                                        onChange={(e) => setYears(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="text-right text-sm text-slate-600 mt-1">{years} Years</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-4">Assumptions</h2>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Home Appreciation (%)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={homeAppreciation}
                                            onChange={(e) => setHomeAppreciation(Number(e.target.value))}
                                            className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Rent Increase (%)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={rentIncrease}
                                            onChange={(e) => setRentIncrease(Number(e.target.value))}
                                            className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Investment Return (%)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={investmentReturn}
                                        onChange={(e) => setInvestmentReturn(Number(e.target.value))}
                                        className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                    <p className="text-[10px] text-slate-500 mt-1">Return you'd get if you invested your down payment instead.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-xl font-bold text-slate-800 mb-6">Net Cost Comparison Over {years} Years</h2>

                            <div className="h-80 w-full mb-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRent" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorBuy" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="year" stroke="#94a3b8" />
                                        <YAxis
                                            stroke="#94a3b8"
                                            tickFormatter={(value) => `$${value / 1000} k`}
                                        />
                                        <Tooltip
                                            formatter={(value: number) => formatCurrency(value)}
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Legend />
                                        <Area
                                            type="monotone"
                                            dataKey="rentCost"
                                            name="Net Cost to Rent"
                                            stroke="#ef4444"
                                            fillOpacity={1}
                                            fill="url(#colorRent)"
                                            strokeWidth={2}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="buyCost"
                                            name="Net Cost to Buy"
                                            stroke="#3b82f6"
                                            fillOpacity={1}
                                            fill="url(#colorBuy)"
                                            strokeWidth={2}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 mb-1">
                                            {breakevenYear
                                                ? `Buying becomes cheaper after ${breakevenYear} years`
                                                : "Renting is cheaper for this period"}
                                        </h3>
                                        <p className="text-slate-600 text-sm">
                                            {breakevenYear
                                                ? "If you plan to stay longer than this, buying makes more financial sense."
                                                : "Based on your inputs, renting is the better financial option for this timeframe."}
                                        </p>
                                    </div>
                                    <div className="text-right min-w-[150px]">
                                        <div className="text-sm text-slate-500 mb-1">Total Savings</div>
                                        <div className={`text-2xl font-bold ${totalBuyCost < totalRentCost ? 'text-blue-600' : 'text-red-600'}`}>
                                            {formatCurrency(Math.abs(totalBuyCost - totalRentCost))}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            by {totalBuyCost < totalRentCost ? 'Buying' : 'Renting'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default RentVsBuyCalculator;
