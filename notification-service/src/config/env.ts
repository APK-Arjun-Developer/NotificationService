import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const EnvSchema = z.object({
  // ── App ───────────────────────────────────────────────────────────────────
  PORT: z
    .string()
    .default('3001')
    .transform(Number)
    .refine((n) => n > 0 && n < 65536, 'PORT must be 1-65535'),

  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  API_KEY: z
    .string()
    .min(32, 'API_KEY must be at least 32 characters for security'),

  // ── Redis ────────────────────────────────────────────────────────────────
  REDIS_URL: z.string().url('REDIS_URL must be a valid URL'),

  // ── SMTP (Gmail App Password) ─────────────────────────────────────────────
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z
    .string()
    .default('587')
    .transform(Number),
  SMTP_SECURE: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  SMTP_USER: z.string().email('SMTP_USER must be a valid email'),
  SMTP_APP_PASSWORD: z.string().min(1, 'SMTP_APP_PASSWORD is required'),
  EMAIL_FROM_NAME: z.string().default('Notification Service'),
  EMAIL_FROM_ADDRESS: z.string().email('EMAIL_FROM_ADDRESS must be a valid email'),

  // ── Database ──────────────────────────────────────────────────────────────
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
});

const _parsed = EnvSchema.safeParse(process.env);

if (!_parsed.success) {
  console.error('\n❌  Invalid environment variables:\n');
  const errors = _parsed.error.flatten().fieldErrors;
  Object.entries(errors).forEach(([field, messages]) => {
    console.error(`   ${field}: ${messages?.join(', ')}`);
  });
  console.error('\n   Check your .env file against .env.example\n');
  process.exit(1);
}

export const env = _parsed.data;
export type Env = typeof env;
