import React from 'react';

export const TermsOfService: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Terms of Service</h1>
      <p className="text-sm text-slate-600 mb-6">Last Updated: November 2025</p>

      <div className="space-y-6 text-slate-700">
        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-3">Acceptance of Terms</h2>
          <p>
            By accessing and using this Mortgage Calculator, you accept and agree to be bound by these Terms of Service.
            If you do not agree to these terms, please do not use this calculator.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-3">Use of the Calculator</h2>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">Informational Purposes Only</h3>
          <p className="mb-3">
            This calculator is provided for <strong>informational and educational purposes only</strong>. 
            The results are estimates based on the information you provide and should not be considered financial advice.
          </p>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">No Financial Advice</h3>
          <p className="mb-3">
            We are not financial advisors, mortgage brokers, or licensed professionals. Always consult with qualified
            financial professionals before making mortgage or investment decisions.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-3">Accuracy of Calculations</h2>
          <p className="mb-2">
            While we strive for accuracy, we do not guarantee that:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>The calculations are 100% error-free</li>
            <li>The results match actual loan offers from lenders</li>
            <li>The estimates reflect all fees, taxes, and costs associated with a mortgage</li>
          </ul>
          <p className="mt-3">
            Actual mortgage terms may vary based on lender policies, credit scores, market conditions, and other factors
            not accounted for in this calculator.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-3">Disclaimer of Warranties</h2>
          <p>
            This calculator is provided "as is" without any warranties, express or implied. We make no warranties about:
          </p>
          <ul className="list-disc ml-6 space-y-1 mt-2">
            <li>The accuracy, completeness, or reliability of the calculations</li>
            <li>The suitability of the calculator for any particular purpose</li>
            <li>Uninterrupted or error-free operation</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-3">Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, we shall not be liable for any damages arising from:
          </p>
          <ul className="list-disc ml-6 space-y-1 mt-2">
            <li>Use or inability to use this calculator</li>
            <li>Financial decisions made based on the calculator's results</li>
            <li>Errors or inaccuracies in calculations</li>
            <li>Loss of data or interruption of service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-3">User Responsibilities</h2>
          <p className="mb-2">When using this calculator, you agree to:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Verify all results with qualified financial professionals</li>
            <li>Not rely solely on this calculator for financial decisions</li>
            <li>Understand that estimates may differ from actual loan offers</li>
            <li>Use the calculator in compliance with all applicable laws</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-3">Intellectual Property</h2>
          <p>
            The calculator's design, code, and content are protected by copyright and other intellectual property laws.
            You may use the calculator for personal, non-commercial purposes only.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-3">Free Service</h2>
          <p>
            This calculator is provided free of charge with no hidden fees. We reserve the right to modify, suspend,
            or discontinue the service at any time without notice.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-3">Changes to Terms</h2>
          <p>
            We may update these Terms of Service at any time. Continued use of the calculator after changes
            constitutes acceptance of the new terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-3">Governing Law</h2>
          <p>
            These terms shall be governed by and construed in accordance with applicable laws. Any disputes
            shall be resolved in the appropriate courts.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-3">Contact Information</h2>
          <p>
            For questions about these Terms of Service, please contact us through GitHub issues or email.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;

