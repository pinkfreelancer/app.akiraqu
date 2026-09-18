import { z } from 'zod';

// Validated according to Stage 4 Security & NFR Specification
export const AnalysisSchema = z.object({
  symbol: z
    .string()
    .min(2)
    .max(20)
    .transform((val) => val.trim().toUpperCase()),
  timeframe: z.enum(['1m', '5m', '15m', '1H', '4H', '1D', '1W', '1h', '4h', '1d', '1w'])
    .transform((tf) => {
      if (tf === '1h') return '1H';
      if (tf === '4h') return '4H';
      if (tf === '1d') return '1D';
      if (tf === '1w') return '1W';
      return tf as '1m' | '5m' | '15m' | '1H' | '4H' | '1D' | '1W';
    }),
  idempotencyKey: z.string().min(1).optional(),
  useAI: z.boolean().optional().default(true),
  accountBalance: z.number().min(1, 'Account balance must be at least $1').optional().default(10000),
  riskPercentage: z.number().min(0.1).max(10).optional().default(1.5),
  language: z.enum(['id', 'en']).optional().default('id'),
  lang: z.enum(['id', 'en']).optional(),
  exchange: z.enum(['BINANCE', 'OKX', 'KUCOIN', 'CRYPTO_COM', 'BITUNIX']).optional().default('BINANCE'),
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
