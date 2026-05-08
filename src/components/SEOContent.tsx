import React, { useState, memo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
      <h3 className="text-base font-semibold text-gray-900 pr-4">{question}</h3>
      {isOpen
        ? <ChevronUp className="w-5 h-5 text-blue-600 flex-shrink-0" />
        : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
    </button>
    {isOpen && (
      <div className="px-6 pb-4">
        <p className="text-gray-700 leading-relaxed text-sm">{answer}</p>
      </div>
    )}
  </div>
));

FAQItem.displayName = 'FAQItem';

const faqs = [
  {
    question: "How much can I save with bi-weekly payments vs monthly?",
    answer: "On a typical $320,000 mortgage at 6.5% interest over 30 years, switching from monthly to bi-weekly payments saves approximately $96,447 in interest and pays off your loan about 6 years earlier. This works because bi-weekly payments create 26 half-payments per year (equivalent to 13 full monthly payments) instead of 12, applying an extra month's payment annually toward principal."
  },
  {
    question: "Can I track multiple one-time extra payments like bonuses or tax refunds?",
    answer: "Yes. Unlike most calculators that only allow one extra payment, you can add unlimited one-time lump sum payments with specific dates. The calculator instantly shows how each payment reduces your loan term and total interest paid — useful for planning how bonuses, tax refunds, or inheritances will accelerate your payoff."
  },
  {
    question: "How do I compare three different mortgage scenarios side-by-side?",
    answer: "Click the Compare Loans button to open the comparison tool. You can evaluate three scenarios with varying interest rates, loan terms, and down payments. Side-by-side tables and bar charts make it easy to see which option saves the most over the life of the loan."
  },
  {
    question: "What's the difference between Cap Rate and Cash-on-Cash Return for rental properties?",
    answer: "Cap Rate measures a property's return independent of financing: Net Operating Income ÷ Property Price × 100. It tells you what the property would return if you paid cash. Cash-on-Cash Return measures your actual return on the cash invested: Annual Cash Flow ÷ Total Cash Invested × 100. It accounts for your mortgage and shows the leveraged return. A property might have a 6% Cap Rate but a 12%+ Cash-on-Cash Return because of leverage."
  },
  {
    question: "How does the refinance break-even calculator work?",
    answer: "Enter your current loan details (remaining balance, interest rate) and new loan terms (rate, closing costs). The calculator compares total costs under both scenarios and shows your break-even point (months until savings equal closing costs), monthly savings, and total interest savings — accounting for your actual remaining term, not just payment differences."
  },
  {
    question: "How do I calculate PMI and when can I remove it?",
    answer: "PMI (Private Mortgage Insurance) is required when your down payment is less than 20% of the home's value. The calculator auto-estimates it at 0.75% of the loan amount annually, but you can override the value. PMI can be removed once you reach 20% equity — extra payments help you get there faster."
  },
  {
    question: "What is break-even occupancy for a rental property?",
    answer: "Break-even occupancy is the minimum percentage of time your rental needs to be occupied to cover all expenses. Formula: Total Annual Expenses ÷ Potential Annual Rent × 100. For example, if your property could generate $36,000 at full occupancy but costs $28,800 annually, your break-even is 80%. Properties with break-even rates under 75% are generally lower risk."
  },
  {
    question: "How are monthly payments calculated?",
    answer: "Monthly payment uses the standard amortization formula: M = P × [r(1+r)^n] / [(1+r)^n − 1], where P is the principal, r is the monthly interest rate (annual rate ÷ 12), and n is the number of payments. Each payment covers interest on the outstanding balance first; the remainder reduces principal. Extra payments go entirely to principal, which is why they save so much interest."
  }
];

const SEOContent: React.FC = () => {
  const [openFAQs, setOpenFAQs] = useState<Set<number>>(new Set([0]));

  const toggleFAQ = (index: number) => {
    setOpenFAQs(prev => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">Frequently Asked Questions</h2>
      <p className="text-slate-500 text-center text-sm mb-8">
        Common questions about mortgage calculations, investment analysis, and calculator features.
      </p>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
    </div>
  );
};

export default memo(SEOContent);
