// Viral Share Results Component - Conversion Optimization
// Allows users to share their savings on social media with pre-filled messages

import React, { memo, useCallback } from 'react';
import { Share2, Twitter, Facebook, Linkedin, MessageCircle, Copy, CheckCircle } from 'lucide-react';

interface ViralShareResultsProps {
  calculationData: {
    savingsAmount?: number;
    savingsYears?: number;
    paymentType?: string;
    loanAmount: number;
    totalInterest: number;
    monthlyPayment: number;
  };
}

const ViralShareResults: React.FC<ViralShareResultsProps> = ({ calculationData }) => {
  const [copied, setCopied] = React.useState(false);
  
  // Generate compelling share message
  const generateShareMessage = useCallback(() => {
    const { savingsAmount, savingsYears, loanAmount, totalInterest } = calculationData;
    
    if (savingsAmount && savingsAmount > 1000) {
      // Has significant savings - always show "from monthly to biweekly"
      const formattedSavings = `$${Math.round(savingsAmount / 1000)}K`;
      const yearsText = savingsYears ? ` and ${savingsYears.toFixed(1)} years` : '';
      return `💰 I'll save ${formattedSavings}${yearsText} by switching from monthly to biweekly payments! Calculate your savings at`;
    } else {
      // No savings yet, general message
      const interestAmount = `$${Math.round(totalInterest / 1000)}K`;
      return `🏠 Just calculated my mortgage: $${Math.round(loanAmount / 1000)}K loan with ${interestAmount} in total interest. Check your numbers at`;
    }
  }, [calculationData]);

  const siteUrl = 'https://mortgage-calculator-kappa-nine.vercel.app/';
  const shareMessage = generateShareMessage();
  const fullMessage = `${shareMessage} ${siteUrl}`;
  const hashtags = 'mortgage,realestate,homebuying,financetips';

  const shareOnTwitter = useCallback(() => {
    const tweetText = encodeURIComponent(fullMessage);
    const hashtagsEncoded = encodeURIComponent(hashtags);
    window.open(
      `https://twitter.com/intent/tweet?text=${tweetText}&hashtags=${hashtagsEncoded}`,
      '_blank',
      'width=600,height=400'
    );
    
    // Track sharing event (in production, send to analytics)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'share', {
        method: 'Twitter',
        content_type: 'calculation_results'
      });
    }
  }, [fullMessage]);

  const shareOnFacebook = useCallback(() => {
    const url = encodeURIComponent(siteUrl);
    const quote = encodeURIComponent(shareMessage);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${quote}`,
      '_blank',
      'width=600,height=400'
    );
    
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'share', {
        method: 'Facebook',
        content_type: 'calculation_results'
      });
    }
  }, [shareMessage]);

  const shareOnLinkedIn = useCallback(() => {
    const url = encodeURIComponent(siteUrl);
    const summary = encodeURIComponent(shareMessage);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${summary}`,
      '_blank',
      'width=600,height=400'
    );
    
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'share', {
        method: 'LinkedIn',
        content_type: 'calculation_results'
      });
    }
  }, [shareMessage]);

  const shareOnWhatsApp = useCallback(() => {
    const text = encodeURIComponent(fullMessage);
    window.open(
      `https://wa.me/?text=${text}`,
      '_blank'
    );
    
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'share', {
        method: 'WhatsApp',
        content_type: 'calculation_results'
      });
    }
  }, [fullMessage]);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'share', {
          method: 'Copy',
          content_type: 'calculation_results'
        });
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [fullMessage]);

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200 shadow-md">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-green-500 rounded-full p-2">
          <Share2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Share Your Savings! 🎉</h3>
          <p className="text-sm text-gray-600">Help others discover smart mortgage strategies</p>
        </div>
      </div>

      {/* Share Message Preview */}
      <div className="bg-white rounded-lg p-4 mb-4 border border-green-200">
        <p className="text-sm text-gray-600 mb-1 font-semibold">Your message:</p>
        <p className="text-gray-900">{shareMessage}</p>
        <p className="text-blue-600 font-medium mt-1">{siteUrl}</p>
      </div>

      {/* Share Buttons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {/* Twitter */}
        <button
          onClick={shareOnTwitter}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow-md transform hover:scale-105"
        >
          <Twitter className="w-5 h-5" />
          <span className="text-sm">Twitter</span>
        </button>

        {/* Facebook */}
        <button
          onClick={shareOnFacebook}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow-md transform hover:scale-105"
        >
          <Facebook className="w-5 h-5" />
          <span className="text-sm">Facebook</span>
        </button>

        {/* LinkedIn */}
        <button
          onClick={shareOnLinkedIn}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0A66C2] hover:bg-[#095196] text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow-md transform hover:scale-105"
        >
          <Linkedin className="w-5 h-5" />
          <span className="text-sm">LinkedIn</span>
        </button>

        {/* WhatsApp */}
        <button
          onClick={shareOnWhatsApp}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow-md transform hover:scale-105"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm">WhatsApp</span>
        </button>

        {/* Copy Link */}
        <button
          onClick={copyToClipboard}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow-md transform hover:scale-105 col-span-2 sm:col-span-1"
        >
          {copied ? (
            <>
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-5 h-5" />
              <span className="text-sm">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Incentive Message */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200">
        <p className="text-xs text-center text-gray-700">
          <span className="font-bold">💡 Pro tip:</span> Sharing helps others save money too! Many people don't know about bi-weekly payments or investment property analysis.
        </p>
      </div>
    </div>
  );
};

export default memo(ViralShareResults);

