import React, { useContext } from 'react';

// Optional loose context lookup so AkiraQuLogo can be used anywhere without crashing
const getIsDarkFallback = (): boolean => {
  if (typeof document !== 'undefined') {
    return document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
  }
  return true;
};

export interface AkiraQuLogoProps {
  size?: number | string;
  className?: string;
  showBackground?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  variant?: 'symbol' | 'squircle' | 'full';
  showSubtitle?: boolean;
}

export const AkiraQuLogo: React.FC<AkiraQuLogoProps> = ({
  size = 32,
  className = '',
  showBackground = false,
  theme = 'auto',
  variant = 'symbol',
  showSubtitle = true,
}) => {
  // Determine if we are rendering in dark mode or light mode
  let effectiveIsDark = true;
  if (theme === 'light') {
    effectiveIsDark = false;
  } else if (theme === 'dark') {
    effectiveIsDark = true;
  } else {
    effectiveIsDark = getIsDarkFallback();
  }

  // Exact color values derived from the official AKIRAQU brand identity
  const fgColor = effectiveIsDark ? '#F89DB5' : '#21242B';
  const bgColor = effectiveIsDark ? '#1F2127' : '#F8B4C8';
  const subtitleColor = effectiveIsDark ? '#E5E7EB' : '#4B5563';

  const shouldRenderBg = showBackground || variant === 'squircle';

  // If variant is full (Symbol on top, AKIRAQU in bold, and Subtitle below)
  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center text-center select-none ${className}`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 256 256"
          width={size}
          height={size}
          className="shrink-0 transition-transform duration-200"
          aria-label="AKIRAQU Logo Icon"
        >
          {shouldRenderBg && (
            <rect width="256" height="256" rx="58" fill={bgColor} />
          )}
          {/* Circle Symbol */}
          <circle
            cx="128"
            cy="124"
            r="58"
            fill="none"
            stroke={fgColor}
            strokeWidth="15"
          />
          {/* Zig-Zag Trend Line */}
          <path
            d="M 58 176 L 104 110 L 146 152 L 192 86"
            fill="none"
            stroke={fgColor}
            strokeWidth="15"
            strokeLinecap="butt"
            strokeLinejoin="miter"
            strokeMiterlimit="3"
          />
          {/* Arrowhead */}
          <polygon
            points="218,60 178,72 206,100"
            fill={fgColor}
          />
        </svg>

        {/* AKIRAQU Title */}
        <span
          className="mt-3 font-extrabold tracking-wider font-display uppercase leading-tight"
          style={{ color: fgColor, fontSize: typeof size === 'number' ? Math.max(18, size * 0.35) : '1.5rem' }}
        >
          AKIRAQU
        </span>

        {/* Subtitle */}
        {showSubtitle && (
          <span
            className="mt-1 font-sans font-medium tracking-normal text-xs sm:text-sm"
            style={{ color: subtitleColor }}
          >
            Analytic Quantitative Crypto Tools
          </span>
        )}
      </div>
    );
  }

  // Standard Symbol or Squircle Icon
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      width={size}
      height={size}
      className={`shrink-0 transition-transform duration-200 ${className}`}
      aria-label="AKIRAQU Logo"
    >
      {/* Squircle Background for App Icon / Favicon mode */}
      {shouldRenderBg && (
        <rect width="256" height="256" rx="58" fill={bgColor} />
      )}

      {/* Circle Symbol */}
      <circle
        cx="128"
        cy="124"
        r="58"
        fill="none"
        stroke={fgColor}
        strokeWidth="15"
      />

      {/* Zig-Zag Trend Line */}
      <path
        d="M 58 176 L 104 110 L 146 152 L 192 86"
        fill="none"
        stroke={fgColor}
        strokeWidth="15"
        strokeLinecap="butt"
        strokeLinejoin="miter"
        strokeMiterlimit="3"
      />

      {/* Arrowhead (Oriented at 45° with perpendicular base) */}
      <polygon
        points="218,60 178,72 206,100"
        fill={fgColor}
      />
    </svg>
  );
};
