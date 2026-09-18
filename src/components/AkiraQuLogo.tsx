import React from 'react';

export interface AkiraQuLogoProps {
  size?: number;
  className?: string;
  showBackground?: boolean;
}

export const AkiraQuLogo: React.FC<AkiraQuLogoProps> = ({
  size = 32,
  className = '',
  showBackground = true,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      aria-label="AKIRA.QU Logo"
    >
      <defs>
        <linearGradient id="akiraCyanGradComp" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>

        <linearGradient id="akiraSilverGradComp" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="45%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>

        <linearGradient id="akiraCoreGradComp" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="50%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#A5F3FC" />
        </linearGradient>

        <filter id="akiraGlowComp" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#06B6D4" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Optional Dark Tech Squircle Canvas */}
      {showBackground && (
        <rect width="256" height="256" rx="56" fill="#090D16" stroke="#1E293B" strokeWidth="3" />
      )}

      {/* Concentric Quantum Grid Ticks */}
      <g opacity="0.25">
        <circle cx="128" cy="128" r="92" fill="none" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="4 8" />
      </g>

      {/* Main AKIRA.QU Monogram ('A' + 'Q' Quantum Orbit + Cyan Node) */}
      <g filter="url(#akiraGlowComp)">
        {/* Top Node */}
        <circle cx="128" cy="38" r="4" fill="#38BDF8" />
        <line x1="128" y1="38" x2="128" y2="52" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />

        {/* Lateral Data Rails */}
        <path d="M 38 128 L 56 128 L 68 140" fill="none" stroke="url(#akiraCyanGradComp)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="36" cy="128" r="3" fill="#38BDF8" />

        <path d="M 218 128 L 200 128 L 188 116" fill="none" stroke="url(#akiraCyanGradComp)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="220" cy="128" r="3" fill="#38BDF8" />

        {/* Quantum Orbit Ring (The 'Q' loop) */}
        <ellipse
          cx="128"
          cy="134"
          rx="64"
          ry="36"
          transform="rotate(-24 128 134)"
          fill="none"
          stroke="url(#akiraCyanGradComp)"
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeDasharray="280"
          strokeDashoffset="15"
        />

        {/* 'Q' Quantum Trajectory Beam */}
        <path
          d="M 166 154 L 198 196 L 214 196"
          fill="none"
          stroke="url(#akiraCoreGradComp)"
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="216" cy="196" r="4.5" fill="#38BDF8" />

        {/* Iconic 'A' Structure */}
        <path
          d="M 128 54 L 64 196 L 86 196 L 128 98 L 146 142"
          fill="none"
          stroke="url(#akiraSilverGradComp)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 128 54 L 192 196 L 170 196 L 140 126"
          fill="none"
          stroke="url(#akiraSilverGradComp)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Quantum Central Chevron / Crossbar */}
        <path
          d="M 92 142 L 128 126 L 164 142"
          fill="none"
          stroke="url(#akiraCoreGradComp)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Central Quantum Node (The '.' in AKIRA.QU) */}
        <circle cx="128" cy="106" r="7" fill="url(#akiraCoreGradComp)" />
        <circle cx="128" cy="106" r="3.5" fill="#FFFFFF" />

        {/* Base Stabilizers */}
        <line x1="60" y1="206" x2="88" y2="206" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
        <line x1="168" y1="206" x2="196" y2="206" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
};
