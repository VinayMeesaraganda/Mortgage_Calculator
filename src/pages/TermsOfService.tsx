import React from 'react';
import PageShell from '../layouts/PageShell';

export const TermsOfService: React.FC = () => {
  return (
    <PageShell
      title="Terms of Service"
      subtitle="Last updated: February 4, 2026"
    >
      <div className="max-w-4xl space-y-6 text-slate-700">
        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-3">Acceptance of Terms</h2>
          <p>
            By accessing and using this Personal Finance suite, you accept and agree to be bound by these Terms of Service.
            If you do not agree to these terms, please do not use the application.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-3">Use of the Tools</h2>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">Informational Purposes Only</h3>
          <p className="mb-3">
            The calculators and trackers are provided for <strong>informational and educational purposes only</strong>.
            Results are estimates based on the information you provide and should not be considered financial advice.
          </p>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">No Financial Advice</h3>
          <p className="mb-3">
            We are not financial advisors, mortgage brokers, or licensed professionals. Always consult with qualified
            financial professionals before making mortgage, investment, or insurance decisions.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-3">Accuracy of Calculations</h2>
          <p className="mb-2">While we strive for accuracy, we do not guarantee that:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>The calculations are 100% error-free</li>
            <li>The results match actual loan offers from lenders</li>
            <li>The estimates reflect all fees, taxes, and costs associated with a mortgage or investment</li>
          </ul>
          <p className="mt-3">
            Actual terms may vary based on lender policies, credit scores, market conditions, and other factors not
            accounted for in the calculators.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-3">Disclaimer of Warranties</h2>
          <p>
            This application is provided "as is" without any warranties, express or implied. We make no warranties about:
          </p>
          <ul className="list-disc ml-6 space-y-1 mt-2">
            <li>The accuracy, completeness, or reliability of the calculations</li>
            <li>The suitability of the tools for any particular purpose</li>
            <li>Uninterrupted or error-free operation</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-3">Limitation of Liability</h2>
          <p>To the fullest extent permitted by law, we shall not be liable for any damages arising from:</p>
          <ul className="list-disc ml-6 space-y-1 mt-2">
            <li>Use or inability to use this application</li>
            <li>Financial decisions made based on tool outputs</li>
            <li>Errors or inaccuracies in calculations</li>
            <li>Loss of data or interruption of service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-3">User Responsibilities</h2>
          <p className="mb-2">When using this application, you agree to:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Verify results with qualified financial professionals</li>
            <li>Not rely solely on the tools for financial decisions</li>
            <li>Understand that estimates may differ from actual offers</li>
            <li>Use the tools in compliance with applicable laws</li>
          </ul>
        </section>
      </div>
    </PageShell>
  );
};

export default TermsOfService;
