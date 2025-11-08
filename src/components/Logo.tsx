import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 48, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* House roof */}
      <path
        d="M50 15L85 45H75V75H60V55H40V75H25V45H15L50 15Z"
        fill="url(#houseGradient)"
        stroke="#1e3a8a"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      
      {/* Calculator display on house */}
      <rect
        x="35"
        y="30"
        width="30"
        height="8"
        rx="2"
        fill="#fbbf24"
        opacity="0.9"
      />
      
      {/* Dollar sign */}
      <text
        x="50"
        y="36"
        fontSize="7"
        fontWeight="bold"
        fill="#1e3a8a"
        textAnchor="middle"
      >
        $
      </text>
      
      {/* Door */}
      <rect
        x="42.5"
        y="60"
        width="15"
        height="15"
        rx="1"
        fill="#1e40af"
      />
      
      {/* Door knob */}
      <circle
        cx="54"
        cy="67.5"
        r="1.5"
        fill="#fbbf24"
      />
      
      {/* Windows */}
      <rect
        x="30"
        y="50"
        width="8"
        height="8"
        rx="1"
        fill="#60a5fa"
        opacity="0.8"
      />
      <rect
        x="62"
        y="50"
        width="8"
        height="8"
        rx="1"
        fill="#60a5fa"
        opacity="0.8"
      />
      
      {/* Percentage symbol in bottom right */}
      <circle
        cx="78"
        cy="72"
        r="3"
        fill="#f97316"
      />
      <line
        x1="75"
        y1="78"
        x2="82"
        y2="67"
        stroke="#f97316"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle
        cx="80"
        cy="80"
        r="3"
        fill="#f97316"
      />
      
      {/* Gradient definition */}
      <defs>
        <linearGradient id="houseGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1e40af" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default Logo;

