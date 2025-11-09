// Social Proof Banner - Conversion Optimization
// Shows live activity and user statistics to build trust

import React, { useState, useEffect, memo } from 'react';
import { Users, TrendingUp, CheckCircle } from 'lucide-react';

interface ActivityNotification {
  id: number;
  message: string;
  time: string;
  icon: 'user' | 'savings' | 'check';
}

const activities: ActivityNotification[] = [
  { id: 1, message: "Sarah M. from Austin just saved $87K with bi-weekly payments", time: "2 min ago", icon: "savings" },
  { id: 2, message: "Michael C. from San Diego analyzed an investment property", time: "5 min ago", icon: "check" },
  { id: 3, message: "Jennifer R. from Phoenix completed a refinance analysis", time: "8 min ago", icon: "check" },
  { id: 4, message: "David T. from Denver compared 3 loan scenarios", time: "12 min ago", icon: "user" },
  { id: 5, message: "Lisa P. from Seattle calculated her mortgage", time: "15 min ago", icon: "user" },
  { id: 6, message: "Robert K. from Atlanta saved $3,500 on closing costs", time: "18 min ago", icon: "savings" },
  { id: 7, message: "Maria G. from Miami exported results to Excel", time: "22 min ago", icon: "check" },
  { id: 8, message: "James W. from Boston analyzed rental property ROI", time: "25 min ago", icon: "check" }
];

const SocialProofBanner: React.FC = () => {
  const [currentActivity, setCurrentActivity] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [userCount, setUserCount] = useState(10247);

  // Rotate through activities
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentActivity((prev) => (prev + 1) % activities.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Increment user count periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setUserCount((prev) => prev + Math.floor(Math.random() * 3)); // Add 0-2 users
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const activity = activities[currentActivity];

  const getIcon = () => {
    switch (activity.icon) {
      case 'savings':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'check':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <Users className="w-5 h-5 text-purple-500" />;
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Floating Activity Notification */}
      <div className="fixed bottom-4 left-4 z-50 animate-slideInLeft hidden sm:block">
        <div className="bg-white rounded-lg shadow-2xl border-2 border-gray-200 p-4 max-w-sm backdrop-blur-sm bg-opacity-95">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 font-medium leading-snug">
                {activity.message}
              </p>
              <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Top Banner Stats */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-2 px-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-6 flex-wrap text-sm">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="font-semibold">{userCount.toLocaleString()}+ users</span>
          </div>
          <div className="hidden sm:block text-white/40">|</div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="font-semibold">$2.4M+ interest saved</span>
          </div>
          <div className="hidden md:block text-white/40">|</div>
          <div className="hidden md:flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span className="font-semibold">1,200+ saved money this month</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(SocialProofBanner);

