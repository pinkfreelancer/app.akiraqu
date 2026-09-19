import React from 'react';

interface AkiraAvatarProps {
  size?: number | 'sm' | 'md' | 'lg';
  isOnline?: boolean;
  isAnalyzing?: boolean;
  className?: string;
  showGlow?: boolean;
}

export const AkiraAvatar: React.FC<AkiraAvatarProps> = ({
  size = 32,
  isOnline = true,
  isAnalyzing = false,
  className = '',
  showGlow = true,
}) => {
  const pixelSize = typeof size === 'number' ? size : size === 'sm' ? 24 : size === 'lg' ? 44 : 32;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
    >
      {/* Soft Pink Glow Halo */}
      {showGlow && (
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-pink-500/25 to-rose-400/20 blur-sm pointer-events-none transition-all duration-300"
          style={{
            transform: isAnalyzing ? 'scale(1.25)' : 'scale(1.08)',
            opacity: isAnalyzing ? 0.9 : 0.6,
          }}
        />
      )}

      {/* Cybernetic Woman Silhouette Line-Art Container */}
      <div
        className="relative z-10 w-full h-full rounded-full border border-pink-500/40 bg-gradient-to-b from-[#1e293b] via-[#0f172a] to-[#0b0f19] flex items-center justify-center overflow-hidden shadow-xs"
        style={{
          boxShadow: showGlow ? '0 0 12px rgba(244, 114, 182, 0.25)' : 'none',
        }}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1 text-pink-400 transition-transform duration-300 hover:scale-105"
        >
          {/* Cybernetic Neural Mesh Background */}
          <path
            d="M8 24C8 15.1634 15.1634 8 24 8C32.8366 8 40 15.1634 40 24"
            stroke="currentColor"
            strokeWidth="0.75"
            strokeDasharray="2 2"
            strokeOpacity="0.4"
          />
          <path
            d="M12 24C12 17.3726 17.3726 12 24 12C30.6274 12 36 17.3726 36 24"
            stroke="currentColor"
            strokeWidth="0.75"
            strokeDasharray="1.5 1.5"
            strokeOpacity="0.5"
          />

          {/* Minimalist Cybernetic Woman Profile */}
          {/* Sleek Hair & Neural Headband */}
          <path
            d="M16 20C16 14 20 10 25 10C30 10 33 13 33 17C33 21 29 23 27 24C27 25 27 27 27 28"
            stroke="#F472B6"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Refined Facial Contour & Chin */}
          <path
            d="M27 28L25 33L21 34L20 30"
            stroke="#FBCFE8"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Neck and Sleek Cyber Collar */}
          <path
            d="M21 34L20 40M25 33L26 40"
            stroke="#F472B6"
            strokeWidth="1.25"
            strokeLinecap="round"
          />
          {/* Cybernetic Visor / Eye Interface */}
          <line
            x1="22"
            y1="19"
            x2="28"
            y2="19"
            stroke="#38BDF8"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Cybernetic Neural Node Point */}
          <circle cx="28" cy="19" r="1.5" fill="#38BDF8" />
          <circle cx="20" cy="16" r="1" fill="#F472B6" />
          <circle cx="31" cy="22" r="1" fill="#F472B6" />

          {/* Torso / Shoulder Cyber Armour Line */}
          <path
            d="M13 42C15 39 18 38 23 38C28 38 31 39 34 42"
            stroke="#EC4899"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Quantum Flow Arc */}
          <path
            d="M10 28C10 34 15 39 22 40"
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.6"
            strokeLinecap="round"
          />
        </svg>

        {/* Scanline / Pulse line overlay when analyzing */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-400/20 to-transparent animate-pulse pointer-events-none" />
        )}
      </div>

      {/* Online Status Micro Beacon */}
      {isOnline && (
        <span
          className={`absolute bottom-0 right-0 z-20 rounded-full border border-[#0b0f19] ${
            isAnalyzing
              ? 'bg-amber-400 w-2 h-2 animate-ping'
              : 'bg-emerald-400 w-2 h-2 shadow-xs'
          }`}
          title={isAnalyzing ? 'Akira AI Analyzing...' : 'Akira AI Active'}
        />
      )}
    </div>
  );
};
