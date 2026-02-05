import React from 'react';
import PageShell from '../layouts/PageShell';

export const PrivacyPolicy: React.FC = () => {
  return (
    <PageShell
      title="Privacy Policy"
      subtitle="Last updated: February 4, 2026"
    >
      <div className="max-w-4xl space-y-6 text-slate-700">
        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-3">Introduction</h2>
          <p>
            Welcome to our Personal Finance suite. We respect your privacy and are committed to protecting any information you share with us.
            This privacy policy explains how we collect, use, and safeguard your information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-3">Information We Collect</h2>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">Usage Data</h3>
          <p className="mb-3">
            We collect anonymous usage data through Google Analytics to understand how visitors use our tools. This includes:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Pages visited</li>
            <li>Time spent on the site</li>
            <li>Browser type and version</li>
            <li>Device type (mobile, desktop, tablet)</li>
            <li>General location (city/country level)</li>
          </ul>
          <p className="mt-3">
            <strong>Important:</strong> We do NOT collect or store any financial information you enter into the calculators.
            All calculations are performed locally in your browser, and your data never leaves your device unless you
            explicitly save it while signed in.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-3">How We Use Your Information</h2>
          <p className="mb-2">We use the collected anonymous data to:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Improve the tools and user experience</li>
            <li>Understand which features are most valuable to users</li>
            <li>Identify and fix technical issues</li>
            <li>Make data-driven decisions about new features</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-3">Cookies</h2>
          <p>
            We use cookies only for Google Analytics tracking. These cookies help us understand how you use the site
            but do not collect personally identifiable information. You can disable cookies in your browser settings,
            though this may affect some website functionality.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-3">Third-Party Services</h2>
          <p className="mb-2">We use the following third-party services:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li><strong>Google Analytics:</strong> For anonymous usage tracking</li>
            <li><strong>Vercel:</strong> For website hosting</li>
          </ul>
          <p className="mt-3">
            These services have their own privacy policies, and we encourage you to review them.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-3">Data Security</h2>
          <p>
            Since we don&apos;t collect or store your financial data by default, there is minimal security risk. All calculations
            happen in your browser, ensuring your sensitive information remains private.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-3">Your Rights</h2>
          <p className="mb-2">You have the right to:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Request access to data associated with your account</li>
            <li>Request deletion of your account data</li>
            <li>Opt out of analytics tracking via browser controls</li>
          </ul>
        </section>
      </div>
    </PageShell>
  );
};

export default PrivacyPolicy;
