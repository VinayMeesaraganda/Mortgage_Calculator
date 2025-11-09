// SEO Content Component - Streamlined FAQs and keywords for search engines
// Focused on unique content that complements the main calculator page

import React, { useState, memo } from 'react';
import { ChevronDown, ChevronUp, FileText, Calculator, TrendingUp, Home, DollarSign } from 'lucide-react';

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

const FAQItem: React.FC<FAQItemProps> = memo(({ question, answer, isOpen, onToggle }) => (
  <div className="border-b border-gray-200 last:border-0">
    <button
      onClick={onToggle}
      className="w-full py-4 px-6 flex justify-between items-center hover:bg-gray-50 transition-colors text-left"
      aria-expanded={isOpen}
    >
      <h3 className="text-lg font-semibold text-gray-900 pr-4">{question}</h3>
      {isOpen ? (
        <ChevronUp className="w-5 h-5 text-blue-600 flex-shrink-0" />
      ) : (
        <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
      )}
    </button>
    {isOpen && (
      <div className="px-6 pb-4">
        <p className="text-gray-700 leading-relaxed">{answer}</p>
      </div>
    )}
  </div>
));

FAQItem.displayName = 'FAQItem';

const SEOContent: React.FC = () => {
  const [openFAQs, setOpenFAQs] = useState<Set<number>>(new Set([0])); // First FAQ open by default

  const toggleFAQ = (index: number) => {
    setOpenFAQs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const faqs = [
    {
      question: "What makes this the best mortgage calculator with taxes and insurance?",
      answer: "This calculator is unique because it includes complete housing cost calculations (PITI - Principal, Interest, Taxes, Insurance) PLUS investment property analysis, loan comparison, refinance break-even analysis, and Excel export—all features that typically require 3-4 separate tools. You can input property taxes, homeowners insurance, PMI, and HOA fees to see your true monthly housing payment, not just the loan payment. The investment property mode adds rental income analysis with Cap Rate, Cash-on-Cash Return, and Net Operating Income calculations that institutional investors use."
    },
    {
      question: "How much can I save with bi-weekly mortgage payments vs monthly?",
      answer: "On a typical $320,000 mortgage at 6.5% interest over 30 years, switching from monthly to bi-weekly payments saves approximately $96,447 in interest and pays off your loan about 6 years earlier (24 years vs 30 years). This works because bi-weekly payments create 26 half-payments per year (equivalent to 13 full monthly payments) instead of 12, applying an extra month's payment annually toward your principal. The calculator shows you the exact savings for your specific loan amount, interest rate, and term."
    },
    {
      question: "Can I track multiple one-time extra payments like bonuses or tax refunds?",
      answer: "Yes! Unlike most calculators that only allow one extra payment, you can add unlimited one-time lump sum payments. Click 'Add One-Time Payment' to specify when you'll make each payment (like a $5,000 bonus in March 2026, then a $3,000 tax refund in April 2026). The calculator instantly shows how each payment reduces your loan term and total interest paid. This is perfect for planning how bonuses, tax refunds, inheritances, or other windfalls will accelerate your mortgage payoff."
    },
    {
      question: "How do I compare three different mortgage scenarios side-by-side?",
      answer: "Click the 'Compare Loans' button to open the comparison tool. You can evaluate three different scenarios with varying interest rates, loan terms (15 vs 20 vs 30 years), down payments, and payment frequencies. The tool displays side-by-side comparison tables showing monthly payments, total interest paid, and payoff dates, plus visual bar charts making it easy to see which option saves the most money. This is invaluable when you're getting multiple loan offers from different lenders or deciding between 15-year and 30-year terms."
    },
    {
      question: "What's the difference between Cap Rate and Cash-on-Cash Return for rental properties?",
      answer: "Cap Rate (Capitalization Rate) measures a property's return independent of financing: Net Operating Income ÷ Property Price × 100. It tells you what the property would return if you paid cash. Cash-on-Cash Return measures YOUR actual return on the cash you invested: Annual Cash Flow ÷ Total Cash Invested × 100. It accounts for your mortgage, showing the leveraged return. For example, a property might have a 6% Cap Rate, but if you put 20% down and finance the rest, your Cash-on-Cash Return could be 12%+ because you're using leverage. Our calculator computes both automatically so you understand both the property's fundamental performance and your personal ROI."
    },
    {
      question: "How accurate is the refinance break-even calculator?",
      answer: "Very accurate. Enter your current loan details (remaining balance, interest rate, payoff date) and new loan terms (rate, term, closing costs). The calculator compares your total costs under both scenarios: keeping your current loan versus refinancing. It shows your break-even point (how many months until savings equal closing costs), monthly savings, total interest savings, and whether refinancing is recommended. Unlike simple calculators that just compare payments, this accounts for your actual remaining term and any extra payments you're making, giving you a complete financial picture."
    },
    {
      question: "Can I export all my calculations to Excel?",
      answer: "Yes! Click 'Export to Excel' to download a professional workbook with multiple worksheets: (1) Primary Mortgage with complete amortization schedule and chart, (2) Investment Property Analysis with all ROI metrics if applicable, (3) Compare Loans comparison table if you used that feature, and (4) Refinance Analysis if you ran a refinance scenario. All data, charts, and calculations are included. This is perfect for presenting to financial advisors, spouses, or keeping detailed records of your analysis."
    },
    {
      question: "How do I calculate PMI and when does it go away?",
      answer: "PMI (Private Mortgage Insurance) is required when your down payment is less than 20% of the home's value. It typically costs 0.5-1% of the loan amount annually. The calculator automatically displays PMI recommendations based on your loan-to-value ratio. PMI can be removed once you reach 20% equity through a combination of paying down principal and/or home appreciation. With bi-weekly payments or extra principal payments, you'll reach 20% equity faster and eliminate PMI sooner, saving hundreds per month."
    },
    {
      question: "What's break-even occupancy and why does it matter for rental properties?",
      answer: "Break-even occupancy is the minimum percentage of time your rental property needs to be occupied to cover all expenses (mortgage, taxes, insurance, maintenance, management fees). Formula: Total Annual Expenses ÷ Potential Annual Rent × 100. For example, if your property could generate $36,000 at 100% occupancy but costs $28,800 annually, your break-even is 80% (need 9.6 months rented). Properties with lower break-even rates (under 75%) are less risky investments because they can withstand longer vacancy periods. Our calculator automatically computes this critical metric to help you assess investment risk."
    },
    {
      question: "How do I use this calculator for a HELOC or home equity loan?",
      answer: "For a HELOC (Home Equity Line of Credit) or home equity loan, enter the amount you're borrowing as the 'Home Value' and set the down payment to $0 since you already own the home. Enter the HELOC interest rate and term. The calculator will show your payment schedule and total interest. For investment property analysis, you can also factor in how the HELOC is being used—if it's for a down payment on a rental property, calculate the combined payment and see if the rental income covers both mortgages."
    }
  ];

  return (
    <div className="w-full bg-white">
      {/* FAQ Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center mb-8">
            <FileText className="w-10 h-10 text-blue-600 mr-4" />
            <h2 className="text-4xl font-bold text-gray-900 text-center">
              Frequently Asked Questions
            </h2>
          </div>
          
          <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            Get answers to common questions about mortgage calculations, investment properties, refinancing, and our calculator features.
          </p>

          <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFAQs.has(index)}
                onToggle={() => toggleFAQ(index)}
              />
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 text-lg">
              Still have questions? Try the calculator above to see instant results for your specific situation.
            </p>
          </div>
        </div>
      </section>

      {/* SEO Keywords Footer Section */}
      <section className="bg-gray-50 py-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Calculator className="w-5 h-5 mr-2 text-blue-600" />
                Mortgage Calculators
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Free Mortgage Calculator</li>
                <li>• Mortgage Calculator with Taxes</li>
                <li>• Mortgage Calculator with Insurance</li>
                <li>• Bi-weekly Mortgage Calculator</li>
                <li>• Extra Payment Calculator</li>
                <li>• Amortization Schedule Calculator</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Home className="w-5 h-5 mr-2 text-green-600" />
                Investment Property Tools
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Rental Property Calculator</li>
                <li>• Cap Rate Calculator</li>
                <li>• Cash-on-Cash Return Calculator</li>
                <li>• Investment Property ROI</li>
                <li>• Real Estate Cash Flow</li>
                <li>• Break-even Occupancy Calculator</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
                Loan Comparison & Analysis
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Compare Mortgage Loans</li>
                <li>• 15-year vs 30-year Mortgage</li>
                <li>• Refinance Calculator</li>
                <li>• Refinance Break-even Analysis</li>
                <li>• Loan Comparison Tool</li>
                <li>• Interest Rate Comparison</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                Additional Features
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Excel Export with Charts</li>
                <li>• PMI Calculator</li>
                <li>• Property Tax Calculator</li>
                <li>• HOA Fee Calculator</li>
                <li>• Multiple One-time Payments</li>
                <li>• Future Rent Projections</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 text-center">
            <p className="text-gray-600 text-sm">
              <strong>Popular Searches:</strong> mortgage calculator, investment property calculator, rental property calculator, 
              bi-weekly mortgage calculator, refinance calculator, amortization schedule, cap rate calculator, 
              cash-on-cash return, loan comparison, mortgage calculator with taxes and insurance, 
              free mortgage calculator, extra payment calculator, mortgage payoff calculator, 
              break-even analysis, real estate calculator, property investment calculator, best mortgage calculator
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default memo(SEOContent);
