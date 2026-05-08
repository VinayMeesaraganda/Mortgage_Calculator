// Email Capture Modal - Conversion Optimization Component
// Captures user emails for follow-up and marketing

import React, { useState, memo, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, CheckCircle, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface EmailCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  calculationSummary: {
    loanAmount: number;
    monthlyPayment: number;
    totalInterest: number;
    totalPaid: number;
    yearsToPayoff: number;
    paymentType: string;
  };
}

const EmailCaptureModal: React.FC<EmailCaptureModalProps> = ({ isOpen, onClose, calculationSummary }) => {
  const { userProfile, currentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const accountEmail = userProfile?.email || currentUser?.email || '';
    if (accountEmail && !accountEmail.endsWith('@personal-finance.app')) {
      setEmail(accountEmail);
    }
  }, [isOpen, userProfile, currentUser]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call (replace with your actual email service)
    try {
      // In production, send to your email service (e.g., SendGrid, Mailchimp, etc.)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In production, send to your email service (e.g., SendGrid, Mailchimp, etc.)
      // Avoid storing PII locally to reduce exfiltration risk.

      setIsSuccess(true);
      
      // Close after 2 seconds
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setEmail('');
        setName('');
      }, 2000);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [email, name, subscribeNewsletter, calculationSummary, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100000] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-slideUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <Mail className="w-8 h-8" />
            <h2 className="text-2xl font-bold">Get Your Results via Email</h2>
          </div>
          <p className="text-blue-100 text-sm">
            We'll send your mortgage calculation summary to your inbox
          </p>
        </div>

        {isSuccess ? (
          /* Success State */
          <div className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Email Sent! 📧</h3>
            <p className="text-gray-600">
              Check your inbox for your calculation summary and mortgage tips.
            </p>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="p-6">
            {/* Calculation Summary Preview */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-3">Your Calculation Summary:</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Monthly Payment:</span>
                  <p className="font-bold text-gray-900">${calculationSummary.monthlyPayment.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-600">Total Interest:</span>
                  <p className="font-bold text-gray-900">${calculationSummary.totalInterest.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-600">Loan Amount:</span>
                  <p className="font-bold text-gray-900">${calculationSummary.loanAmount.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-600">Time to Payoff:</span>
                  <p className="font-bold text-gray-900">{calculationSummary.yearsToPayoff.toFixed(1)} years</p>
                </div>
              </div>
            </div>

            {/* Name Input */}
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                Your Name <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Email Input */}
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Newsletter Checkbox */}
            <div className="mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={subscribeNewsletter}
                  onChange={(e) => setSubscribeNewsletter(e.target.checked)}
                  className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-semibold text-gray-900">
                    📬 Get weekly mortgage tips & money-saving strategies
                  </span>
                  <p className="text-xs text-gray-600 mt-1">
                    Join 10,000+ homeowners saving money. Unsubscribe anytime.
                  </p>
                </div>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`
                w-full py-4 rounded-lg font-bold text-white text-lg transition-all flex items-center justify-center gap-2
                ${isSubmitting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                }
              `}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Email My Results
                </>
              )}
            </button>

            {/* Privacy Note */}
            <p className="text-xs text-gray-500 text-center mt-4">
              🔒 We respect your privacy. Your email will never be shared or sold.
            </p>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};

export default memo(EmailCaptureModal);
