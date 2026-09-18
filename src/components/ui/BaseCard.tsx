import React from 'react';

export interface BaseCardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  theme?: 'light' | 'dark';
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  onClick?: () => void;
}

export const BaseCard: React.FC<BaseCardProps> = ({
  children,
  title,
  subtitle,
  badge,
  actions,
  icon: Icon,
  theme = 'dark',
  className = '',
  headerClassName = '',
  bodyClassName = '',
  onClick,
}) => {
  const isDark = theme === 'dark';

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border transition-colors duration-200 ${
        isDark
          ? 'bg-[#0f172a] border-[#1e293b] text-slate-100'
          : 'bg-white border-slate-200 text-slate-900 shadow-xs'
      } ${className}`}
    >
      {(title || badge || actions || Icon) && (
        <div
          className={`flex items-center justify-between p-4 border-b ${
            isDark ? 'border-[#1e293b]' : 'border-slate-100'
          } ${headerClassName}`}
        >
          <div className="flex items-center gap-2.5">
            {Icon && (
              <Icon className={`w-4 h-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} />
            )}
            <div>
              {typeof title === 'string' ? (
                <span className={`text-xs font-semibold tracking-tight ${
                  isDark ? 'text-slate-100' : 'text-slate-900'
                }`}>
                  {title}
                </span>
              ) : (
                title
              )}
              {subtitle && (
                <p className={`text-xs mt-0.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {badge}
            {actions}
          </div>
        </div>
      )}

      <div className={`p-4 ${bodyClassName}`}>{children}</div>
    </div>
  );
};
