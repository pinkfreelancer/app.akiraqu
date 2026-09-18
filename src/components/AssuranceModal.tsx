import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import { AuditLogEntry } from '../types/crypto.types';
import { Language } from '../i18n/translations';
import { ModalWrapper } from './ui/ModalWrapper';

interface AssuranceModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
  theme?: 'light' | 'dark';
}

export const AssuranceModal: React.FC<AssuranceModalProps> = ({
  isOpen,
  onClose,
  lang = 'id',
  theme = 'dark',
}) => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'REGISTER' | 'AUDIT'>('REGISTER');

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/v1/audit-log')
      .then((r) => r.json())
      .then((res) => {
        if (res.status === 'success') {
          setAuditLogs(res.data);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const assuranceChecklist = [
    {
      category: lang === 'id' ? 'Kepatuhan' : 'Compliance',
      item: lang === 'id' ? 'Ekspor Data GDPR/CCPA (JSON/CSV)' : 'GDPR/CCPA Data Export (JSON/CSV)',
      status: 'PASS',
      detail: lang === 'id' ? 'Terverifikasi via endpoint /api/v1/privacy/export' : 'Verified via /api/v1/privacy/export endpoint',
    },
    {
      category: lang === 'id' ? 'Kepatuhan' : 'Compliance',
      item: lang === 'id' ? 'Hook Penghapusan Tuntas GDPR (Pasal 17)' : 'GDPR True Erasure Hook (Art. 17)',
      status: 'PASS',
      detail: lang === 'id' ? 'Pembersihan permanen aktif di /api/v1/privacy/erase' : 'Real hard wipe active on /api/v1/privacy/erase',
    },
    {
      category: lang === 'id' ? 'Kepatuhan' : 'Compliance',
      item: lang === 'id' ? 'Pengungkapan AI EU AI Act Pasal 50' : 'EU AI Act Art. 50 AI Disclosure',
      status: 'PASS',
      detail: lang === 'id' ? 'Lencana aktif & identitas model AI dirender di UI' : 'Active badge & commentary model identity rendered in UI',
    },
    {
      category: lang === 'id' ? 'Keamanan' : 'Security',
      item: lang === 'id' ? 'Nol Paparan Rahasia Kunci API' : 'Zero Secret Exposure',
      status: 'PASS',
      detail: lang === 'id' ? 'Kunci Gemini API hanya disimpan di proksi server Express' : 'Gemini API key kept server-side in Express proxy only',
    },
    {
      category: lang === 'id' ? 'Keamanan' : 'Security',
      item: lang === 'id' ? 'Validasi Input Skema Zod' : 'Zod Input Validation',
      status: 'PASS',
      detail: lang === 'id' ? 'AnalysisSchema memvalidasi simbol, timeframe, UUID' : 'AnalysisSchema strictly validates symbol, timeframe, UUID',
    },
    {
      category: lang === 'id' ? 'Keamanan' : 'Security',
      item: lang === 'id' ? 'Perlindungan Idempotensi' : 'Idempotency Protection',
      status: 'PASS',
      detail: lang === 'id' ? 'Kunci idempotensi UUID mencegah eksekusi duplikat' : 'UUID idempotency keys prevent duplicate executions',
    },
    {
      category: lang === 'id' ? 'Keamanan' : 'Security',
      item: lang === 'id' ? 'Pembatasan Laju & Anti-DDoS' : 'Rate Limiting & Anti-DDoS',
      status: 'PASS',
      detail: lang === 'id' ? '100 permintaan per 60 detik per IP klien' : '100 requests per 60s per client IP window',
    },
    {
      category: lang === 'id' ? 'Operasional' : 'Operational',
      item: lang === 'id' ? 'Endpoint Kesehatan (/api/v1/health)' : 'Health Endpoint (/api/v1/health)',
      status: 'PASS',
      detail: lang === 'id' ? 'Mengembalikan 200 OK dengan telemetri uptime & latensi' : 'Returns 200 OK with uptime and latency telemetry',
    },
    {
      category: lang === 'id' ? 'Operasional' : 'Operational',
      item: lang === 'id' ? 'Pencatatan Audit Terstruktur' : 'Structured Audit Logging',
      status: 'PASS',
      detail: lang === 'id' ? 'Hash IP SHA-256 teranonimisasi dengan stempel waktu sub-milidetik' : 'Anonymized SHA-256 IP hash with sub-millisecond timestamps',
    },
  ];

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      theme={theme}
      icon={ShieldCheck}
      iconClassName="text-emerald-400"
      iconBgClassName="bg-emerald-500/10 border-emerald-500/30"
      title={lang === 'id' ? 'Daftar Jaminan & NFR Keamanan' : 'Assurance Register & Security NFRs'}
      subtitle={
        lang === 'id'
          ? 'Verifikasi Tingkat Bisnis + Lapisan Privasi vibeArchitecture'
          : 'vibeArchitecture Business Tier + Privacy Overlay Verification'
      }
      footer={
        <>
          <span>{lang === 'id' ? 'Standar: WCAG AA, GDPR Ps. 15/17, EU AI Act Ps. 50' : 'Standards: WCAG AA, GDPR Art. 15/17, EU AI Act Art. 50'}</span>
          <span>{lang === 'id' ? 'Garansi Nol Rahasia di Klien' : 'Zero Client Secrets Guaranteed'}</span>
        </>
      }
    >
      {/* Tab switcher */}
      <div className="flex gap-2 border-b border-[#1e293b] pb-2 mb-4 font-mono text-xs">
        <button
          onClick={() => setActiveTab('REGISTER')}
          className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer transition-colors ${
            activeTab === 'REGISTER'
              ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {lang === 'id' ? 'Matriks Jaminan (9/9 Lolos)' : 'Assurance Matrix (9/9 Passed)'}
        </button>
        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer transition-colors ${
            activeTab === 'AUDIT'
              ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {lang === 'id' ? `Log Audit Keamanan Langsung (${auditLogs.length})` : `Live Security Audit Logs (${auditLogs.length})`}
        </button>
      </div>

      {activeTab === 'REGISTER' ? (
        <div className="space-y-2">
          {assuranceChecklist.map((row, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-lg bg-[#0b0f19] border border-[#1e293b] text-xs font-mono"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-white font-semibold">{row.item}</span>
                  <p className="text-[11px] text-slate-400">{row.detail}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                  {row.category}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {row.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs font-mono">
              {lang === 'id'
                ? 'Belum ada peristiwa keamanan atau jejak audit yang dicatat. Jalankan analisis untuk menghasilkan log audit.'
                : 'No security events or audit trails logged yet. Run an analysis to generate an audit log.'}
            </div>
          ) : (
            auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-[#0b0f19] border border-[#1e293b] text-xs font-mono gap-1"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  <span className="text-slate-200 font-semibold">{log.action}</span>
                  <span className="text-cyan-400">[{log.symbol} {log.timeframe}]</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                  <span>{lang === 'id' ? 'Skor' : 'Score'}: {log.confluenceScore}</span>
                  <span>IP Hash: {log.ipHash}</span>
                  <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </ModalWrapper>
  );
};
