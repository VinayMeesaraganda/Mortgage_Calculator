import React, { memo } from 'react';

interface ShareButtonsProps {
  url?: string;
}

const ShareButtonsComponent: React.FC<ShareButtonsProps> = ({ 
  url = typeof window !== 'undefined' ? window.location.href : ''
}) => {
  const encodedUrl = encodeURIComponent(url);

  const shareViaEmail = () => {
    const subject = encodeURIComponent('Advanced Mortgage Calculator - Multiple Payments & Refinance Analysis');
    const body = encodeURIComponent(`Check out this powerful mortgage calculator:\n\n${url}\n\nIt supports multiple one-time payments, loan comparison, refinance analysis, and investment property ROI calculations!`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareOnTwitter = () => {
    const tweetText = encodeURIComponent('🏠 Just found an amazing mortgage calculator with multiple payment tracking, loan comparison & refinance analysis!');
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}&url=${encodedUrl}`, '_blank');
  };

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, '_blank');
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-semibold text-slate-600 mr-2">Share:</span>
      
      <button
        onClick={shareViaEmail}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white text-xs font-semibold rounded-md transition-colors shadow-sm"
        aria-label="Share via Email"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
        </svg>
        Email
      </button>

      <button
        onClick={shareOnTwitter}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white text-xs font-semibold rounded-md transition-colors shadow-sm"
        aria-label="Share on Twitter/X"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        X
      </button>

      <button
        onClick={shareOnFacebook}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-semibold rounded-md transition-colors shadow-sm"
        aria-label="Share on Facebook"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        Facebook
      </button>

      <button
        onClick={shareOnLinkedIn}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0A66C2] hover:bg-[#095196] text-white text-xs font-semibold rounded-md transition-colors shadow-sm"
        aria-label="Share on LinkedIn"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
        LinkedIn
      </button>
    </div>
  );
};

// Export memoized version to prevent unnecessary re-renders
export const ShareButtons = memo(ShareButtonsComponent);

export default ShareButtons;

