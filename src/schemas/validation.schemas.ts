import { z } from 'zod';

// Validated according to Stage 4 Security & NFR Specification
export const AnalysisSchema = z.object({
  symbol: z
    .string()
    .min(2)
    .max(30)
    .transform((val) => val.trim().toUpperCase()),
  timeframe: z.union([
    z.enum(['1m', '5m', '15m', '1H', '4H', '1D', '1W', '1h', '4h', '1d', '1w']),
    z.string().transform((tf) => {
      const lower = tf.trim().toLowerCase();
      if (lower === '1m') return '1m';
      if (lower === '5m') return '5m';
      if (lower === '15m') return '15m';
      if (lower === '1h') return '1H';
      if (lower === '4h') return '4H';
      if (lower === '1d') return '1D';
      if (lower === '1w') return '1W';
      return '1H';
    }),
  ]).transform((tf) => {
    if (tf === '1h') return '1H';
    if (tf === '4h') return '4H';
    if (tf === '1d') return '1D';
    if (tf === '1w') return '1W';
    return tf as '1m' | '5m' | '15m' | '1H' | '4H' | '1D' | '1W';
  }),
  idempotencyKey: z.string().min(1).optional(),
  useAI: z.union([
    z.boolean(),
    z.string().transform((v) => v === 'true' || v === '1'),
  ]).optional().default(true),
  accountBalance: z.union([
    z.number(),
    z.string().transform((v) => {
      const num = Number(v.replace(/[^0-9.]/g, ''));
      return isNaN(num) ? 10000 : num;
    }),
  ]).pipe(z.number().min(1, 'Account balance must be at least $1')).optional().default(10000),
  riskPercentage: z.union([
    z.number(),
    z.string().transform((v) => {
      const num = Number(v.replace(/[^0-9.]/g, ''));
      return isNaN(num) ? 1.5 : num;
    }),
  ]).pipe(z.number().min(0.01).max(50)).optional().default(1.5),
  language: z.enum(['id', 'en']).optional().default('id'),
  lang: z.enum(['id', 'en']).optional(),
  exchange: z.enum(['BINANCE', 'OKX', 'BYBIT', 'KUCOIN', 'BITGET', 'CRYPTO_COM', 'BITUNIX']).optional().default('BINANCE'),
  marketType: z.enum(['SPOT', 'FUTURES']).optional().default('SPOT'),
});

export const RiskCalculatorSchema = z.object({
  accountBalance: z.number().min(1, 'Account balance must be at least $1'),
  riskPercentage: z.number().min(0.1).max(10, 'Risk percentage between 0.1% and 10%'),
  entryPrice: z.number().positive('Entry price must be positive'),
  stopLoss: z.number().positive('Stop loss must be positive'),
  targetRRR: z.number().min(1).max(10).optional().default(2.5),
});

export const PrivacyExportSchema = z.object({
  userEmail: z.string().email('Valid email required for GDPR audit trail'),
  format: z.enum(['json', 'csv', 'bundle']),
  includeAuditTrail: z.boolean().default(true),
});

export const PrivacyErasureSchema = z.object({
  userEmail: z.string().email(),
  confirmationPhrase: z.literal('PERMANENTLY DELETE MY TRADING SESSIONS'),
});

export type AnalysisInput = z.infer<typeof AnalysisSchema>;
export type RiskCalculatorInput = z.infer<typeof RiskCalculatorSchema>;
