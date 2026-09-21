import React, { useState } from 'react';
import {
  X,
  Send,
  Headphones,
  CheckCircle2,
  Sparkles,
  Shield,
  MessageSquare,
} from 'lucide-react';
import { Language } from '../../i18n/translations';

interface SignalContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  lang: Language;
}

export const SignalContactModal: React.FC<SignalContactModalProps> = ({
  isOpen,
  onClose,
  isDark,
  lang,
}) => {
  const isId = lang === 'id';
  const [name, setName] = useState('');
  const [telegramHandle, setTelegramHandle] = useState('');
  const [topic, setTopic] = useState('VIP_ACCESS');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono">
      <div
        className={`w-full max-w-lg rounded-2xl border p-6 space-y-4 relative ${
          isDark ? 'bg-[#0f172a] border-[#1e293b] text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-pink-500/15 border border-pink-500/30 text-pink-400">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold">Kontak & VIP Telegram Desk</h3>
            <p className="text-xs text-slate-400">AKIRAQU Quant Specialist Support</p>
          </div>
        </div>

        {isSubmitted ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-base font-bold text-white">Permintaan Terkirim!</h4>
            <p className="text-xs text-slate-400">
              Tim Quant Specialist AKIRAQU akan segera menghubungi handle Telegram Anda dalam waktu kurang dari 15 menit.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Nama / Alias:</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="cth. Satoshi Trader"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-hidden focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Username / Nomor Telegram:</label>
              <input
                type="text"
                required
                value={telegramHandle}
                onChange={(e) => setTelegramHandle(e.target.value)}
                placeholder="@username_telegram"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-hidden focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Topik Konsultasi:</label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-hidden focus:border-pink-500"
              >
                <option value="VIP_ACCESS">Aktivasi Sinyal VIP & Webhook Telegram</option>
                <option value="API_INTEGRATION">Integrasi REST / WebSocket API Institusional</option>
                <option value="METHODOLOGY_QUERY">Pertanyaan Teknis Metodologi & Siklus Hidup</option>
                <option value="CUSTOM_BOT">Kustomisasi Model Trading Alpha/Gamma</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Pesan Tambahan (Opsional):</label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tuliskan kebutuhan spesifik atau exchange yang Anda gunakan..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-hidden focus:border-pink-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Pesan</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
