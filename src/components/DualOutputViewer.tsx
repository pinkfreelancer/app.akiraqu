import React, { useState } from 'react';
import { FileText, Code2, Copy, Check, Download } from 'lucide-react';
import { Language, getTranslation } from '../i18n/translations';

interface DualOutputViewerProps {
  markdownNarrative: string;
  jsonPayload: string;
  symbol: string;
  timeframe: string;
  aiEngine?: string;
  lang?: Language;
  theme?: 'light' | 'dark';
}

export const DualOutputViewer: React.FC<DualOutputViewerProps> = React.memo(({
  markdownNarrative,
  jsonPayload,
  symbol,
  timeframe,
  aiEngine,
  lang = 'id',
  theme = 'dark',
}) => {
  const t = getTranslation(lang);
  const [activeTab, setActiveTab] = useState<'MARKDOWN' | 'JSON'>('MARKDOWN');
  const [copied, setCopied] = useState(false);
  const isDark = theme === 'dark';

  const handleCopy = () => {
    const textToCopy = activeTab === 'MARKDOWN' ? markdownNarrative : jsonPayload;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = activeTab === 'MARKDOWN' ? markdownNarrative : jsonPayload;
    const extension = activeTab === 'MARKDOWN' ? 'md' : 'json';
    const mimeType = activeTab === 'MARKDOWN' ? 'text/markdown' : 'application/json';
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexustrade_${symbol.replace('/', '_')}_${timeframe}_${Date.now()}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`flex flex-col rounded-xl border overflow-hidden shadow-md transition-colors duration-200 ${
      isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'
    }`}>
      {/* Top Bar with Tab Switches & Copy/Download Actions */}
      <div className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b transition-colors duration-200 ${
        isDark ? 'border-[#1e293b] bg-[#0b0f19]' : 'border-slate-100 bg-slate-50'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`flex items-center p-1 rounded-lg border ${
            isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-slate-100 border-slate-200/60'
          } text-xs font-mono`}>
            <button
              onClick={() => setActiveTab('MARKDOWN')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                activeTab === 'MARKDOWN'
                  ? (isDark ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'bg-white text-cyan-600 shadow-xs border border-slate-200/50')
                  : 'text-slate-400 hover:text-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{t.output.markdownTab}</span>
            </button>
            <button
              onClick={() => setActiveTab('JSON')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                activeTab === 'JSON'
                  ? (isDark ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'bg-white text-cyan-600 shadow-xs border border-slate-200/50')
                  : 'text-slate-400 hover:text-slate-800'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{t.output.jsonTab}</span>
            </button>
          </div>

          {aiEngine && (
            <span className={`hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-mono border ${
              isDark ? 'text-cyan-400 bg-cyan-950/40 border-cyan-800/40' : 'text-cyan-700 bg-cyan-50 border-cyan-100'
            }`}>
              Engine: {aiEngine}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-colors cursor-pointer ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-xs'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-cyan-500" />}
            <span>{copied ? t.output.copied : t.output.copy}</span>
          </button>
          <button
            onClick={handleDownload}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-colors cursor-pointer ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-xs'
            }`}
            title="Download Artifact"
          >
            <Download className="w-3.5 h-3.5 text-cyan-500" />
            <span className="hidden sm:inline">{t.output.download}</span>
          </button>
        </div>
      </div>

      {/* Render Panel content */}
      <div className="flex-1">
        {activeTab === 'MARKDOWN' ? (
          <div className={`p-4 md:p-6 overflow-y-auto max-h-[450px] text-xs md:text-sm leading-relaxed font-mono whitespace-pre-wrap transition-colors duration-200 ${
            isDark ? 'text-slate-200' : 'text-slate-700'
          }`}>
            {markdownNarrative}
          </div>
        ) : (
          <pre className={`p-4 md:p-6 overflow-x-auto max-h-[450px] font-mono text-xs leading-relaxed transition-colors duration-200 ${
            isDark ? 'bg-[#060913] text-cyan-400' : 'bg-slate-50 text-cyan-800 border-t border-slate-100'
          }`}>
            <code>{jsonPayload}</code>
          </pre>
        )}
      </div>
    </div>
  );
});

DualOutputViewer.displayName = 'DualOutputViewer';
