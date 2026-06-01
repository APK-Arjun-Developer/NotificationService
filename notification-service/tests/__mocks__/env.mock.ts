export const env = {
  PORT: 3001,
  NODE_ENV: 'test' as const,
  API_KEY: 'test-api-key-that-is-long-enough-32c',
  REDIS_URL: 'redis://localhost:6379',
  SMTP_HOST: 'smtp.gmail.com',
  SMTP_PORT: 587,
  SMTP_SECURE: false,
  SMTP_USER: 'test@gmail.com',
  SMTP_APP_PASSWORD: 'testapppassword1234',
  EMAIL_FROM_NAME: 'Test App',
  EMAIL_FROM_ADDRESS: 'test@gmail.com',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
};
