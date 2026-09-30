import React, { useState, useRef, useEffect } from 'react';
import {
  Palette,
  Sun,
  Moon,
  Terminal as TerminalIcon,
  Sparkles,
  Check,
  ChevronDown,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import {
  EngineThemeId,
  THEME_OPTIONS,
  PRESET_CUSTOM_COLORS,
  SOFT_PINK_SHADES,
  PRESET_BACKGROUND_CONTRASTS,
  getContrastTextColor,
} from '../types/theme.types';
import { Language } from '../i18n/translations';

interface ThemeDropdownMenuProps {
  currentTheme: EngineThemeId;
  customColor: string;
  customBg?: string;
  onSelectTheme: (theme: EngineThemeId, customColor?: string, customBg?: string) => void;
  onUpdateCustomColor: (color: string) => void;
  onUpdateCustomBg?: (bg: string) => void;
  lang?: Language;
  isDark?: boolean;
}

export const ThemeDropdownMenu: React.FC<ThemeDropdownMenuProps> = ({
  currentTheme,
  customColor,
  customBg = '#0B0F19',
  onSelectTheme,
  onUpdateCustomColor,
  onUpdateCustomBg,
  lang = 'id',
  isDark = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hexInput, setHexInput] = useState(customColor);
  const [bgHexInput, setBgHexInput] = useState(customBg);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isId = lang === 'id';

  // Sync internal hex input state with prop
  useEffect(() => {
    setHexInput(customColor);
  }, [customColor]);

  useEffect(() => {
    setBgHexInput(customBg);
  }, [customBg]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeOption = THEME_OPTIONS.find((t) => t.id === currentTheme) || THEME_OPTIONS[1];

  // Active theme indicator dot color
  const activeDotColor =
    currentTheme === 'theme-custom'
      ? customColor
      : activeOption.accentColor;

  const handleHexChange = (val: string) => {
    setHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      onUpdateCustomColor(val);
      if (currentTheme !== 'theme-custom') {
        onSelectTheme('theme-custom', val, customBg);
      }
    }
  };

  const handleBgHexChange = (val: string) => {
    setBgHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      onUpdateCustomBg?.(val);
      if (currentTheme !== 'theme-custom') {
        onSelectTheme('theme-custom', customColor, val);
      }
    }
  };

  const contrastColor = getContrastTextColor(customColor);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        id="btn-theme-dropdown-trigger"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono font-bold transition-all cursor-pointer ${
          isOpen
            ? isDark
              ? 'bg-[#0f172a] border-cyan-400 text-white shadow-xs'
              : 'bg-slate-100 border-cyan-500 text-slate-900'
            : isDark
            ? 'bg-[#0f172a] border-[#1e293b] text-slate-300 hover:text-white hover:border-slate-600'
            : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 shadow-xs'
        }`}
        title={isId ? 'Pilih Tema Engine Tampilan' : 'Choose Visual Engine Theme'}
        aria-label="Theme Switcher Dropdown"
      >
        <div className="relative flex items-center justify-center">
          <Palette className="w-3.5 h-3.5 text-slate-300" />
          <span
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0f172a]"
            style={{ backgroundColor: activeDotColor }}
          />
        </div>
        <span className="hidden sm:inline font-semibold">
          {activeOption.nameId}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-cyan-400' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Overlay */}
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-[2px] border p-4 shadow-2xl z-50 transition-all font-mono ${
            isDark
              ? 'bg-[#0a0e17] border-[#1e293b] text-white shadow-black/80'
              : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/60'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1e293b]/70">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block">
                  {isId ? 'Tema Engine AKIRA.QU' : 'AKIRA.QU Engine Theme'}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {isId ? '5 Pilihan Skema Visual' : '5 Visual Scheme Presets'}
                </span>
              </div>
            </div>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-[2px] border"
              style={{
                borderColor: activeDotColor,
                color: activeDotColor,
                backgroundColor: `${activeDotColor}15`,
              }}
            >
              {activeOption.badgeLabel}
            </span>
          </div>

          {/* Theme List Grid */}
          <div className="space-y-2 mb-3.5">
            {THEME_OPTIONS.map((theme) => {
              const isSelected = currentTheme === theme.id;
              const previewAccent = theme.id === 'theme-custom' ? customColor : theme.accentColor;
              const previewBg = theme.id === 'theme-custom' ? customBg : theme.bgColor;

              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => {
                    onSelectTheme(theme.id, theme.id === 'theme-custom' ? customColor : undefined, theme.id === 'theme-custom' ? customBg : undefined);
                  }}
                  className={`w-full p-2.5 rounded-[2px] border text-left transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isSelected
                      ? isDark
                        ? 'bg-[#0f172a] border-pink-400/80 shadow-md ring-1 ring-pink-400/40'
                        : 'bg-slate-50 border-pink-400 shadow-sm ring-1 ring-pink-400/30'
                      : isDark
                      ? 'bg-[#080c14] border-[#1e293b]/70 hover:border-slate-600'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Theme Icon Badge */}
                    <div
                      className="w-8 h-8 rounded-[2px] flex items-center justify-center border shrink-0 mt-0.5"
                      style={{
                        backgroundColor: previewBg,
                        borderColor: theme.surfaceColor,
                      }}
                    >
                      {theme.id === 'theme-glassnode' && (
                        <Layers className="w-4 h-4 text-[#DB2777]" />
                      )}
                      {theme.id === 'theme-light' && (
                        <Sun className="w-4 h-4 text-[#F472B6]" />
                      )}
                      {theme.id === 'theme-dark' && (
                        <Moon className="w-4 h-4 text-[#EC4899]" />
                      )}
                      {theme.id === 'theme-terminal' && (
                        <TerminalIcon className="w-4 h-4 text-[#FF007A]" />
                      )}
                      {theme.id === 'theme-custom' && (
                        <Sparkles
                          className="w-4 h-4"
                          style={{ color: previewAccent }}
                        />
                      )}
                    </div>

                    {/* Text Details */}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-bold ${
                            isSelected
                              ? isDark
                                ? 'text-white'
                                : 'text-slate-900'
                              : isDark
                              ? 'text-slate-300'
                              : 'text-slate-700'
                          }`}
                        >
                          {isId ? theme.nameId : theme.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          [{theme.badgeLabel}]
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-2">
                        {isId ? theme.conceptId : theme.concept}
                      </p>
                    </div>
                  </div>

                  {/* Right Preview Swatches & Check */}
                  <div className="flex items-center gap-2 shrink-0 self-center">
                    {/* Color Swatch Stack */}
                    <div className="flex items-center -space-x-1">
                      <span
                        className="w-3.5 h-3.5 rounded-[2px] border border-black/40 shadow-xs"
                        style={{ backgroundColor: previewBg }}
                        title="Canvas Background"
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-[2px] border border-black/40 shadow-xs"
                        style={{ backgroundColor: previewAccent }}
                        title="Interactive Accent"
                      />
                    </div>

                    {isSelected ? (
                      <span
                        className="w-5 h-5 rounded-[2px] flex items-center justify-center text-white"
                        style={{ backgroundColor: previewAccent }}
                      >
                        <Check className="w-3 h-3 text-white" />
                      </span>
                    ) : (
                      <span className="w-5 h-5" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Theme Controls */}
          {currentTheme === 'theme-custom' && (
            <div className={`p-3 rounded-[2px] border space-y-3 ${
              isDark ? 'bg-[#060910] border-[#1e293b]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold uppercase ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  {isId ? 'Color Picker Mini' : 'Mini Color Picker'}
                </span>
                <div
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono font-bold"
                  style={{
                    backgroundColor: customColor,
                    color: contrastColor,
                  }}
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>WCAG AA</span>
                </div>
              </div>

              {/* 1. Soft Pink Accent Picker */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-pink-400 font-mono block font-semibold">
                  {isId ? '1. Aksen Soft Pink:' : '1. Soft Pink Accent:'}
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => {
                      onUpdateCustomColor(e.target.value);
                      setHexInput(e.target.value);
                    }}
                    className="w-8 h-8 rounded-[2px] border border-[#1e293b] cursor-pointer bg-transparent shrink-0"
                    aria-label="Accent Color Picker"
                  />
                  <div className={`flex-1 flex items-center rounded-[2px] border px-2 py-1 text-xs ${
                    isDark ? 'border-[#1e293b] bg-[#0b0f19] text-white' : 'border-slate-300 bg-white text-slate-900'
                  }`}>
                    <span className="text-slate-500 mr-1 font-mono text-[10px]">HEX:</span>
                    <input
                      type="text"
                      value={hexInput}
                      onChange={(e) => handleHexChange(e.target.value)}
                      placeholder="#EC4899"
                      maxLength={7}
                      className={`w-full bg-transparent font-mono text-xs focus:outline-none uppercase ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    />
                  </div>
                </div>
                {/* Soft pink chips */}
                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                  {SOFT_PINK_SHADES.slice(0, 5).map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => {
                        onUpdateCustomColor(preset.hex);
                        setHexInput(preset.hex);
                        onSelectTheme('theme-custom', preset.hex, customBg);
                      }}
                      className={`w-5 h-5 rounded-[2px] border transition-transform cursor-pointer hover:scale-110 flex items-center justify-center ${
                        customColor.toLowerCase() === preset.hex.toLowerCase()
                          ? 'ring-2 ring-white border-white scale-105'
                          : 'border-black/50'
                      }`}
                      style={{ backgroundColor: preset.hex }}
                      title={preset.name}
                    >
                      {customColor.toLowerCase() === preset.hex.toLowerCase() && (
                        <Check className="w-2.5 h-2.5 text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Background Contrast Picker */}
              <div className={`space-y-1.5 pt-1 border-t ${
                isDark ? 'border-[#1e293b]/60' : 'border-slate-200'
              }`}>
                <span className="text-[10px] text-cyan-400 font-mono block font-semibold">
                  {isId ? '2. Kontras Background:' : '2. Background Contrast:'}
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customBg}
                    onChange={(e) => {
                      onUpdateCustomBg?.(e.target.value);
                      setBgHexInput(e.target.value);
                    }}
                    className="w-8 h-8 rounded-[2px] border border-[#1e293b] cursor-pointer bg-transparent shrink-0"
                    aria-label="Background Color Picker"
                  />
                  <div className={`flex-1 flex items-center rounded-[2px] border px-2 py-1 text-xs ${
                    isDark ? 'border-[#1e293b] bg-[#0b0f19] text-white' : 'border-slate-300 bg-white text-slate-900'
                  }`}>
                    <span className="text-slate-500 mr-1 font-mono text-[10px]">BG:</span>
                    <input
                      type="text"
                      value={bgHexInput}
                      onChange={(e) => handleBgHexChange(e.target.value)}
                      placeholder="#0B0F19"
                      maxLength={7}
                      className={`w-full bg-transparent font-mono text-xs focus:outline-none uppercase ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    />
                  </div>
                </div>
                {/* Background contrast chips */}
                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                  {PRESET_BACKGROUND_CONTRASTS.map((bgPreset) => (
                    <button
                      key={bgPreset.hex}
                      type="button"
                      onClick={() => {
                        onUpdateCustomBg?.(bgPreset.hex);
                        setBgHexInput(bgPreset.hex);
                        onSelectTheme('theme-custom', customColor, bgPreset.hex);
                      }}
                      className={`w-5 h-5 rounded-[2px] border transition-transform cursor-pointer hover:scale-110 flex items-center justify-center ${
                        customBg.toLowerCase() === bgPreset.hex.toLowerCase()
                          ? 'ring-2 ring-cyan-400 border-white scale-105'
                          : 'border-slate-700'
                      }`}
                      style={{ backgroundColor: bgPreset.hex }}
                      title={bgPreset.name}
                    >
                      {customBg.toLowerCase() === bgPreset.hex.toLowerCase() && (
                        <Check className="w-2.5 h-2.5 text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
