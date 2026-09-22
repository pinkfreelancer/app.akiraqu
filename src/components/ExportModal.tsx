import React, { useState } from 'react';
import { X, Download, ShieldCheck, FileJson, FileText, CheckCircle2 } from 'lucide-react';
import { ConfluenceEvaluation } from '../types/crypto.types';
import { Language } from '../i18n/translations';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation?: ConfluenceEvaluation;
  lang?: Language;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  evaluation,
  lang = 'id',
}) => {
  const [exportType, setExportType] = useState<'BUNDLE_JSON' | 'MARKDOWN' | 'CSV'>('BUNDLE_JSON');
  const [gdprEmail, setGdprEmail] = useState('');
  const [erasureConfirmation, setErasureConfirmation] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadArtifact = () => {
    if (!evaluation) return;
    setIsExporting(true);

    let content = '';
    let mimeType = 'application/json';
    let ext = 'json';

    if (exportType === 'BUNDLE_JSON') {
      content = JSON.stringify(
        {
          meta: {
            app: 'AKIRA.QU: Quantitative Crypto Intelligence & Trading Hub',
            version: '2.0.0-PRO',
            exportedAt: new Date().toISOString(),
            standard: 'Impeccable Style (impeccable.style)',
          },
          evaluation,
        },
        null,
        2
      );
      mimeType = 'application/json';
      ext = 'json';
    } else if (exportType === 'MARKDOWN') {
      content = evaluation.executiveNarrative;
      mimeType = 'text/markdown';
      ext = 'md';
    } else {
      // CSV format
      const ind = evaluation.indicators;
      const csvRows = [
        ['Indicator', 'Signal', 'Confidence', 'Summary'],
        ['Price Action', ind.priceAction.signal, ind.priceAction.confidence, `"${ind.priceAction.summary}"`],
        ['SMC', ind.smc.signal, ind.smc.confidence, `"${ind.smc.summary}"`],
        ['Order Flow (CVD)', ind.orderFlow.signal, ind.orderFlow.confidence, `"${ind.orderFlow.summary}"`],
        ['ICT', ind.ict.signal, ind.ict.confidence, `"${ind.ict.summary}"`],
        ['Option Flow (PCR)', ind.optionFlow.signal, ind.optionFlow.confidence, `"${ind.optionFlow.summary}"`],
        ['VWAP', ind.vwap.signal, ind.vwap.confidence, `"${ind.vwap.summary}"`],
        ['RSI', ind.rsi.signal, ind.rsi.confidence, `"${ind.rsi.summary}"`],
        ['Ichimoku', ind.ichimoku.signal, ind.ichimoku.confidence, `"${ind.ichimoku.summary}"`],
        ['Fibonacci', ind.fibonacci.signal, ind.fibonacci.confidence, `"${ind.fibonacci.summary}"`],
        ['MACD', ind.macd.signal, ind.macd.confidence, `"${ind.macd.summary}"`],
        ['Elliott Wave', ind.elliottWave.signal, ind.elliottWave.confidence, `"${ind.elliottWave.summary}"`],
        ['TD Sequential', ind.tdSequential.signal, ind.tdSequential.confidence, `"${ind.tdSequential.summary}"`],
        ['CONFLUENCE SCORE', evaluation.confluenceScore, evaluation.marketBias, `"${evaluation.symbol} on ${evaluation.timeframe}"`],
      ];
      content = csvRows.map((r) => r.join(',')).join('\n');
      mimeType = 'text/csv';
      ext = 'csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexustrade_bundle_${evaluation.symbol.replace('/', '_')}_${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    setIsExporting(false);
    setNotice(lang === 'id' ? `Artefak berhasil diunduh sebagai .${ext}` : `Artifact downloaded successfully as .${ext}`);
  };

  const handleGdprExport = async () => {
    if (!gdprEmail) {
      setNotice(lang === 'id' ? 'Silakan masukkan alamat email yang valid.' : 'Please provide a valid email address.');
      return;
    }
    try {
      const res = await fetch('/api/v1/privacy/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: gdprEmail,
          format: 'bundle',
          includeAuditTrail: true,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        const blob = new Blob([JSON.stringify(json.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gdpr_data_archive_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setNotice(lang === 'id' ? 'Arsip Data GDPR Pasal 15 berhasil dibuat & diunduh.' : 'GDPR Art. 15 Data Archive generated & downloaded.');
      }
    } catch (_err) {
      setNotice(lang === 'id' ? 'Gagal mengekspor data GDPR.' : 'Failed to export GDPR data.');
    }
  };

  const handleGdprErase = async () => {
    if (erasureConfirmation !== 'PERMANENTLY DELETE MY TRADING SESSIONS') {
      setNotice(lang === 'id' ? 'Anda harus mengetik frasa konfirmasi dengan tepat.' : 'You must type the exact confirmation phrase.');
      return;
    }
    setIsErasing(true);
    try {
      const res = await fetch('/api/v1/privacy/erase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: gdprEmail || 'user@example.com',
          confirmationPhrase: 'PERMANENTLY DELETE MY TRADING SESSIONS',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotice(lang === 'id' ? `Penghapusan Tuntas Selesai: ${data.message}` : `True Erasure Complete: ${data.message}`);
        setErasureConfirmation('');
      } else {
        setNotice(data.error || (lang === 'id' ? 'Penghapusan gagal' : 'Erasure failed'));
      }
    } catch (_err) {
      setNotice(lang === 'id' ? 'Kesalahan jaringan saat menghapus data.' : 'Network error during erasure.');
    } finally {
      setIsErasing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-[#0f172a] rounded-2xl border border-[#1e293b] p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-display">
              {lang === 'id' ? 'Ekspor Artefak & Privasi Data' : 'Export Artifacts & Privacy Suite'}
            </h2>
            <p className="text-xs text-slate-400">
              {lang === 'id'
                ? 'JSON Ramah-Mesin, Laporan Markdown, & Kepatuhan GDPR Pasal 15/17'
                : 'Machine-readable JSON, Markdown Report, & GDPR Article 15/17 Compliance'}
            </p>
          </div>
        </div>

        {notice && (
          <div className="mb-4 p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/40 text-xs font-mono text-cyan-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-cyan-400" />
            <span>{notice}</span>
          </div>
        )}

        {/* Format Selector */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 font-mono mb-2">
            {lang === 'id' ? 'Pilih Format Ekspor' : 'Select Export Format'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              onClick={() => setExportType('BUNDLE_JSON')}
              className={`p-3 rounded-xl border text-left font-mono transition-all cursor-pointer ${
                exportType === 'BUNDLE_JSON'
                  ? 'bg-slate-800 border-cyan-500 text-white shadow-md'
                  : 'bg-[#0b0f19] border-[#1e293b] text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 text-cyan-400 mb-1">
                <FileJson className="w-4 h-4" />
                <span className="text-xs font-bold">Bundle JSON</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                {lang === 'id' ? 'Skema lengkap dengan 10 indikator & model risiko' : 'Complete schema with 10 indicators & risk model'}
              </p>
            </button>

            <button
              onClick={() => setExportType('MARKDOWN')}
              className={`p-3 rounded-xl border text-left font-mono transition-all cursor-pointer ${
                exportType === 'MARKDOWN'
                  ? 'bg-slate-800 border-cyan-500 text-white shadow-md'
                  : 'bg-[#0b0f19] border-[#1e293b] text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 text-cyan-400 mb-1">
                <FileText className="w-4 h-4" />
                <span className="text-xs font-bold">Markdown (.md)</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                {lang === 'id' ? 'Narasi eksekutif & setup trading institusional' : 'Executive institutional trading narrative & setup'}
              </p>
            </button>

            <button
              onClick={() => setExportType('CSV')}
              className={`p-3 rounded-xl border text-left font-mono transition-all cursor-pointer ${
                exportType === 'CSV'
                  ? 'bg-slate-800 border-cyan-500 text-white shadow-md'
                  : 'bg-[#0b0f19] border-[#1e293b] text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 text-cyan-400 mb-1">
                <FileText className="w-4 h-4" />
                <span className="text-xs font-bold">CSV Matrix (.csv)</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                {lang === 'id' ? 'Tabel multi-indikator siap pakai spreadsheet' : 'Spreadsheet-ready multi-indicator table'}
              </p>
            </button>
          </div>

          <button
            onClick={handleDownloadArtifact}
            disabled={isExporting || !evaluation}
            className="w-full mt-3 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-sm rounded-[2px] transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isExporting
              ? (lang === 'id' ? 'Menghasilkan Paket...' : 'Generating Bundle...')
              : (lang === 'id' ? 'Unduh Artefak Terpilih' : 'Download Selected Artifact')}
          </button>
        </div>

        {/* Privacy Overlay Section (GDPR & CCPA Mandates) */}
        <div className="pt-4 border-t border-[#1e293b]">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              {lang === 'id' ? 'Privasi & Hak Data (GDPR / CCPA)' : 'Privacy Overlay & Data Rights (GDPR / CCPA)'}
            </h3>
          </div>

          <div className="p-4 rounded-xl bg-[#0b0f19] border border-[#1e293b] space-y-4 text-xs font-mono">
            {/* Portable Export */}
            <div>
              <span className="block text-slate-300 font-semibold mb-1">
                {lang === 'id' ? '1. Ekspor Data Portabel (GDPR Pasal 15)' : '1. Portable Data Export (GDPR Article 15)'}
              </span>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder={lang === 'id' ? 'Masukkan email untuk ekspor riwayat sesi' : 'Enter email to export session records'}
                  value={gdprEmail}
                  onChange={(e) => setGdprEmail(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-[#0f172a] border border-[#1e293b] rounded-lg text-white placeholder:text-slate-600 focus:outline-none"
                />
                <button
                  onClick={handleGdprExport}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
                >
                  {lang === 'id' ? 'Ekspor Data' : 'Export Data'}
                </button>
              </div>
            </div>

            {/* True Erasure */}
            <div>
              <span className="block text-rose-400 font-semibold mb-1">
                {lang === 'id' ? '2. Penghapusan Data Permanen (GDPR Pasal 17)' : '2. Hard Data Erasure (GDPR Article 17 "Right to be Forgotten")'}
              </span>
              <p className="text-[11px] text-slate-500 mb-2">
                {lang === 'id' ? 'Ketik: ' : 'Type: '}
                <span className="text-slate-300">PERMANENTLY DELETE MY TRADING SESSIONS</span>
                {lang === 'id' ? ' untuk menghapus semua sesi dan membersihkan cache memori.' : ' to permanently purge all sessions and clear in-memory stores.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="PERMANENTLY DELETE MY TRADING SESSIONS"
                  value={erasureConfirmation}
                  onChange={(e) => setErasureConfirmation(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-[#0f172a] border border-rose-900/50 rounded-lg text-rose-200 placeholder:text-slate-600 focus:outline-none focus:border-rose-500 text-xs"
                />
                <button
                  onClick={handleGdprErase}
                  disabled={isErasing || erasureConfirmation !== 'PERMANENTLY DELETE MY TRADING SESSIONS'}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {isErasing
                    ? (lang === 'id' ? 'Menghapus...' : 'Purging...')
                    : (lang === 'id' ? 'Hapus Permanen' : 'Hard Delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
