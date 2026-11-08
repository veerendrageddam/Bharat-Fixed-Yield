import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = 'w-9 h-9', size = 48 }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      fill="none"
      className={`${className} shrink-0`}
      width={size}
      height={size}
      aria-hidden="true"
    >
      {/* Rounded Squircle Badge */}
      <rect width="48" height="48" rx="13" fill="#006C4A" />

      {/* Subtle Gradient Depth Overlay */}
      <rect width="48" height="48" rx="13" fill="url(#bdrLogoGrad)" opacity="0.35" />

      {/* Radar Wave 1 (Outer Arc) */}
      <path
        d="M14 15C19.5 9.5 28.5 9.5 34 15"
        stroke="#F59E0B"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Radar Wave 2 (Middle Arc) */}
      <path
        d="M18 19C21.3 15.7 26.7 15.7 30 19"
        stroke="#FCD34D"
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* Central Vault / Shield Body */}
      <path
        d="M24 21L33 25V32C33 37.5 29.2 42.4 24 43.5C18.8 42.4 15 37.5 15 32V25L24 21Z"
        fill="#043D2A"
        stroke="#10B981"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Stylized Rupee Core */}
      <path
        d="M21 26.5H27M21 29.5H26M24 26.5V36M24 29.5C25.5 29.5 26.5 30.5 26.5 32C26.5 33.5 25.5 34.5 24 34.5M24 32.5L27 37"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Radar Pulse Point */}
      <circle cx="24" cy="21" r="2" fill="#F59E0B" />

      <defs>
        <linearGradient id="bdrLogoGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.8" />
        </linearGradient>
      </defs>
    </svg>
  );
};

