import React from 'react';

const MortgageEducationalSection: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto mt-12 px-4 pb-12">
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 md:p-10 border border-slate-200">

        {/* Main H1 - Hidden visually but present for SEO */}
        <h1 className="sr-only">Mortgage Calculator: Primary & Investment Property, Bi-Weekly Payments & Extra Payment Optimizer</h1>

        {/* Subheading */}
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-6 text-center border-b-2 border-blue-500 pb-3">
          Free Mortgage Calculator with Investment Property Analysis & Loan Comparison
        </h2>

        {/* Intro Paragraph */}
        <div className="prose prose-slate max-w-none mb-8">
          <p className="text-lg text-slate-700 leading-relaxed mb-6">
            Stop using 3-4 different calculators. Our comprehensive mortgage calculator combines everything you need: <strong>rental property analysis, bi-weekly payments, extra payment tracking, loan comparison, and refinance break-even analysis, Amortization Schedule</strong>—all in one place.
          </p>
        </div>

        {/* Feature Highlight Box */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 sm:p-8 mb-10 border-2 border-blue-200 shadow-md">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6 text-center">What Makes This Calculator Different?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="text-lg font-bold text-slate-800 mb-2">
                <span aria-label="Home icon - Rental Property Mode">🏠</span> Rental Property Mode
              </div>
              <p className="text-sm text-slate-600">Calculate CAP rate, Cash-on-Cash return, NOI, and break-even occupancy</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="text-lg font-bold text-slate-800 mb-2">
                <span aria-label="Clock icon - Bi-Weekly Payments">⏱️</span> Bi-Weekly Payments
              </div>
              <p className="text-sm text-slate-600">Save $96,000+ in interest and pay off 6 years faster</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="text-lg font-bold text-slate-800 mb-2">
                <span aria-label="Money bag icon - Extra Payments">💰</span> Extra Payments
              </div>
              <p className="text-sm text-slate-600">Track unlimited one-time and recurring extra payments</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="text-lg font-bold text-slate-800 mb-2">
                <span aria-label="Balance scale icon - Loan Comparison">⚖️</span> Loan Comparison
              </div>
              <p className="text-sm text-slate-600">Compare 3 mortgage scenarios side-by-side instantly</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="text-lg font-bold text-slate-800 mb-2">
                <span aria-label="Refresh icon - Refinance Analysis">🔄</span> Refinance Analysis
              </div>
              <p className="text-sm text-slate-600">Discover your break-even point and total savings</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="text-lg font-bold text-slate-800 mb-2">
                <span aria-label="Chart icon - Full Amortization">📊</span> Full Amortization
              </div>
              <p className="text-sm text-slate-600">View detailed payment schedule and export to CSV</p>
            </div>
          </div>
        </div>

        {/* Pain Points Section */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4 border-b-2 border-orange-500 pb-2">
            The Problems with Standard Calculators
          </h2>

          <h3 className="text-xl font-semibold text-slate-700 mb-3 mt-6">❌ Can't Handle Multiple Payment Scenarios</h3>
          <p className="text-slate-700 leading-relaxed mb-4">
            Standard calculators limit you to one extra payment type. What if you receive a year-end bonus in December, a tax refund in April, and want to add $200 monthly? Our calculator supports <strong>unlimited one-time payments</strong> plus <strong>recurring extra payments</strong> (monthly or bi-weekly), giving you a true picture of your accelerated payoff timeline.
          </p>

          <h3 className="text-xl font-semibold text-slate-700 mb-3">❌ No Side-by-Side Loan Comparison</h3>
          <p className="text-slate-700 leading-relaxed mb-4">
            Shopping for the best mortgage rate? Most calculators force you to manually track multiple scenarios in a spreadsheet. Our <strong>Compare Loans</strong> feature lets you evaluate three different loan scenarios simultaneously—comparing monthly payments, total interest, and payoff timelines in one interactive comparison table with visual graphs.
          </p>

          <h3 className="text-xl font-semibold text-slate-700 mb-3">❌ Missing Refinance Break-Even Analysis</h3>
          <p className="text-slate-700 leading-relaxed mb-4">
            Considering refinancing but unsure if closing costs are worth it? Our <strong>refinance calculator</strong> instantly shows your break-even point, total savings, and provides clear recommendations on whether refinancing makes financial sense based on your specific situation.
          </p>

          <h3 className="text-xl font-semibold text-slate-700 mb-3">❌ Zero Investment Property Support</h3>
          <p className="text-slate-700 leading-relaxed mb-4">
            Evaluating a rental property? Traditional mortgage calculators ignore rental income, vacancy rates, property management fees, and operating expenses. Our dedicated <strong>Investment Property mode</strong> calculates critical metrics like <strong>Cash-on-Cash Return</strong>, <strong>Cap Rate</strong>, <strong>Net Operating Income (NOI)</strong>, and <strong>Break-Even Occupancy</strong>—giving you institutional-grade analysis for free.
          </p>
        </div>

        {/* Feature Explanations */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-6 border-b-2 border-green-500 pb-3">
            How to Use Each Feature
          </h2>

          <h3 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-4 mt-8">1. Investment Property Rental Analysis</h3>
          <p className="text-slate-700 leading-relaxed mb-4">
            Analyzing a rental property? Switch to <strong>Investment Property Mode</strong> to calculate:
          </p>
          <ul className="list-disc list-inside text-slate-700 space-y-2 mb-6 ml-4">
            <li><strong>Monthly & Annual Cash Flow:</strong> See your actual rental income minus expenses</li>
            <li><strong>Cash-on-Cash Return:</strong> Your annual return on the cash invested</li>
            <li><strong>Capitalization Rate (CAP Rate):</strong> Quick measure of property profitability</li>
            <li><strong>Net Operating Income (NOI):</strong> Rental income minus operating expenses</li>
            <li><strong>Break-Even Occupancy:</strong> Minimum occupancy rate needed to cover expenses</li>
          </ul>

          <h3 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-4 mt-8">2. Bi-Weekly Mortgage Payments</h3>
          <p className="text-slate-700 leading-relaxed mb-4">
            One of the most powerful mortgage strategies is switching to <strong>bi-weekly payments</strong>. Here's how it works:
          </p>
          <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4 ml-4">
            <li>Instead of 12 monthly payments per year, you make 26 bi-weekly payments</li>
            <li>This equals 13 full monthly payments annually (instead of 12)</li>
            <li>That extra payment goes directly toward principal, reducing interest dramatically</li>
          </ul>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
            <p className="text-slate-800 font-semibold mb-2">Real Example: On a $320,000 mortgage at 6.5% interest:</p>
            <ul className="list-disc list-inside text-slate-700 space-y-1 ml-4">
              <li>Monthly payments: $2,022.62/month for 30 years</li>
              <li>Bi-weekly payments: $1,011.31 every 2 weeks for 24 years</li>
              <li className="font-bold text-green-700">You save: $96,447 in interest + 6 years of payments</li>
            </ul>
          </div>

          <h3 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-4 mt-8">3. Track Mortgage Extra Payments</h3>
          <p className="text-slate-700 leading-relaxed mb-4">
            Use this feature to see the impact of any extra payment strategy:
          </p>
          <h4 className="text-lg font-semibold text-slate-700 mb-3 mt-4">One-Time Extra Payments</h4>
          <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4 ml-4">
            <li>Year-end bonuses</li>
            <li>Tax refunds</li>
            <li>Inheritance or gifts</li>
            <li>Side income windfalls</li>
          </ul>
          <p className="text-slate-700 leading-relaxed mb-4">
            Specify the date and amount. The calculator shows exactly how many years/months you'll save and total interest reduction.
          </p>
          <h4 className="text-lg font-semibold text-slate-700 mb-3 mt-4">Recurring Extra Payments</h4>
          <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4 ml-4">
            <li>Add $100/month extra</li>
            <li>Add $500 bi-weekly</li>
            <li>Any recurring amount</li>
          </ul>
          <p className="text-slate-700 leading-relaxed mb-6">
            See cumulative impact over your loan term.
          </p>

          <h3 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-4 mt-8">4. Compare 3 Mortgage Loans Side-by-Side</h3>
          <p className="text-slate-700 leading-relaxed mb-4">
            Shopping for the best rate? Use our <strong>3-way loan comparison</strong> to instantly see:
          </p>
          <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4 ml-4">
            <li>Different interest rates (e.g., 5.5% vs 6.0% vs 6.5%)</li>
            <li>Different loan terms (e.g., 15-year vs 20-year vs 30-year)</li>
            <li>Different down payments</li>
          </ul>
          <p className="text-slate-700 leading-relaxed mb-4 font-semibold">Visual charts show:</p>
          <ul className="list-disc list-inside text-slate-700 space-y-2 mb-6 ml-4">
            <li>Monthly payment differences</li>
            <li>Total interest paid</li>
            <li>Payoff timeline</li>
          </ul>

          <h3 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-4 mt-8">5. Refinance Break-Even Calculator</h3>
          <p className="text-slate-700 leading-relaxed mb-4">
            Considering refinancing? This feature instantly tells you:
          </p>
          <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4 ml-4">
            <li><strong>Months to break even:</strong> How long until refinance savings offset closing costs</li>
            <li><strong>Monthly savings:</strong> How much you'll save per payment</li>
            <li><strong>Total savings over loan life:</strong> Total money saved if you keep the loan to maturity</li>
          </ul>
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mb-6">
            <p className="text-slate-800 font-semibold">
              <strong>Example:</strong> You'll see "Break even in 18 months" with monthly savings of $343 and total savings of $43,435.
            </p>
          </div>
        </div>

        {/* Comparison Table Section */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-6 border-b-2 border-indigo-500 pb-3">
            How We Compare to Other Mortgage Calculators
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                  <th className="border border-slate-300 p-3 text-left font-bold">Feature</th>
                  <th className="border border-slate-300 p-3 text-center font-bold">Our Calculator</th>
                  <th className="border border-slate-300 p-3 text-center font-bold">Standard Calculators</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white hover:bg-slate-50">
                  <td className="border border-slate-300 p-3 font-semibold">Investment Property Analysis</td>
                  <td className="border border-slate-300 p-3 text-center text-green-600 font-bold">✓ Included</td>
                  <td className="border border-slate-300 p-3 text-center text-red-600">✗ Not Available</td>
                </tr>
                <tr className="bg-slate-50 hover:bg-slate-100">
                  <td className="border border-slate-300 p-3 font-semibold">Multiple One-Time Payments</td>
                  <td className="border border-slate-300 p-3 text-center text-green-600 font-bold">✓ Unlimited</td>
                  <td className="border border-slate-300 p-3 text-center text-red-600">✗ Limited/None</td>
                </tr>
                <tr className="bg-white hover:bg-slate-50">
                  <td className="border border-slate-300 p-3 font-semibold">Bi-Weekly Payment Comparison</td>
                  <td className="border border-slate-300 p-3 text-center text-green-600 font-bold">✓ Side-by-Side</td>
                  <td className="border border-slate-300 p-3 text-center text-red-600">✗ Separate Calculations</td>
                </tr>
                <tr className="bg-slate-50 hover:bg-slate-100">
                  <td className="border border-slate-300 p-3 font-semibold">3-Way Loan Comparison</td>
                  <td className="border border-slate-300 p-3 text-center text-green-600 font-bold">✓ Visual Charts</td>
                  <td className="border border-slate-300 p-3 text-center text-red-600">✗ Manual Comparison</td>
                </tr>
                <tr className="bg-white hover:bg-slate-50">
                  <td className="border border-slate-300 p-3 font-semibold">Refinance Break-Even Analysis</td>
                  <td className="border border-slate-300 p-3 text-center text-green-600 font-bold">✓ Automatic</td>
                  <td className="border border-slate-300 p-3 text-center text-red-600">✗ Manual Calculation</td>
                </tr>
                <tr className="bg-slate-50 hover:bg-slate-100">
                  <td className="border border-slate-300 p-3 font-semibold">Taxes & Insurance Included</td>
                  <td className="border border-slate-300 p-3 text-center text-green-600 font-bold">✓ Optional</td>
                  <td className="border border-slate-300 p-3 text-center text-yellow-600">⚠ Some Include</td>
                </tr>
                <tr className="bg-white hover:bg-slate-50">
                  <td className="border border-slate-300 p-3 font-semibold">Excel Export with Charts</td>
                  <td className="border border-slate-300 p-3 text-center text-green-600 font-bold">✓ Full Report</td>
                  <td className="border border-slate-300 p-3 text-center text-red-600">✗ CSV Only</td>
                </tr>
                <tr className="bg-slate-50 hover:bg-slate-100">
                  <td className="border border-slate-300 p-3 font-semibold">Recurring Extra Payments</td>
                  <td className="border border-slate-300 p-3 text-center text-green-600 font-bold">✓ Monthly/Bi-Weekly</td>
                  <td className="border border-slate-300 p-3 text-center text-yellow-600">⚠ Limited Options</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4 border-b-2 border-purple-500 pb-2">
            Key Features at a Glance
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">🏠 Primary Home Mode</h4>
              <ul className="text-sm text-slate-700 space-y-1">
                <li>• Monthly or bi-weekly payments</li>
                <li>• Multiple one-time extra payments</li>
                <li>• Recurring extra payment tracking</li>
                <li>• Full amortization schedule</li>
                <li>• Interest savings visualization</li>
              </ul>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-900 mb-2">🏘️ Investment Property Mode</h4>
              <ul className="text-sm text-slate-700 space-y-1">
                <li>• Rental income with vacancy rate</li>
                <li>• Operating expense tracking</li>
                <li>• Cash-on-Cash Return calculation</li>
                <li>• Cap Rate & NOI analysis</li>
                <li>• Break-Even Occupancy metric</li>
              </ul>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-2">📊 Loan Comparison</h4>
              <ul className="text-sm text-slate-700 space-y-1">
                <li>• Compare 3 scenarios side-by-side</li>
                <li>• Visual comparison graphs</li>
                <li>• Instant "Apply to Calculator" button</li>
                <li>• Home value & down payment inputs</li>
                <li>• Total interest comparison</li>
              </ul>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">🔄 Refinance Analysis</h4>
              <ul className="text-sm text-slate-700 space-y-1">
                <li>• Break-even timeline calculation</li>
                <li>• Total savings projection</li>
                <li>• Closing costs consideration</li>
                <li>• Clear refinance recommendation</li>
                <li>• Current vs. new loan comparison</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Methodology Section */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4 border-b-2 border-indigo-500 pb-2">
            Our Calculation Methodology
          </h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            All calculations use industry-standard financial formulas to ensure accuracy and reliability. Here's how we compute your mortgage:
          </p>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
            <div>
              <h4 className="font-semibold text-slate-800 mb-1">Monthly Payment Formula:</h4>
              <p className="text-sm text-slate-600 font-mono bg-white p-2 rounded border border-slate-300">
                M = P [ r(1 + r)^n ] / [ (1 + r)^n - 1 ]
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Where: M = Monthly Payment, P = Principal (loan amount), r = Monthly interest rate (annual rate / 12), n = Number of payments (years × 12)
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-1">Amortization Schedule:</h4>
              <p className="text-sm text-slate-600">
                Each payment is split between principal and interest. Early payments have more interest; later payments have more principal. Extra payments reduce principal directly, shortening the loan term and reducing total interest.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-1">Investment Property Metrics:</h4>
              <ul className="text-sm text-slate-600 space-y-1 ml-4">
                <li>• <strong>Cash-on-Cash Return:</strong> Annual Cash Flow / Total Cash Invested × 100</li>
                <li>• <strong>Cap Rate:</strong> Net Operating Income (NOI) / Property Value × 100</li>
                <li>• <strong>Break-Even Occupancy:</strong> (Operating Expenses + Debt Service) / Gross Potential Rent × 100</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-300 text-center mb-8">
          <h3 className="text-xl font-bold text-slate-800 mb-2">Ready to Optimize Your Mortgage?</h3>
          <p className="text-slate-700 mb-4">
            Start using the calculator above to explore your options, compare loans, analyze refinancing, or evaluate investment properties. All features are 100% free with no signup required.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-base"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            Start Your New Analysis Now
          </button>
          <p className="text-sm text-slate-600 italic mt-4">
            💡 Tip: Try the "Compare Loans" feature to see how different down payments or interest rates affect your monthly payment and total interest paid.
          </p>
        </div>

        {/* Footer with Last Updated */}
        <div className="text-center text-sm text-slate-500 border-t border-slate-200 pt-4">
          <p className="mb-2">Last Updated: November 2025</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <a href="#privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="#terms" className="hover:text-blue-600 transition-colors">Terms of Service</a>
            <span>•</span>
            <a href="#methodology" className="hover:text-blue-600 transition-colors" onClick={(e) => { e.preventDefault(); document.querySelector('h2:has-text("Calculation Methodology")')?.scrollIntoView({ behavior: 'smooth' }); }}>Methodology</a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MortgageEducationalSection;
